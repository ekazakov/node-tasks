'use strict';

const config = require('config');
const fs = require('fs');
const koa = require('koa');
const PassTrough = require('stream').PassThrough;
const app = koa();

app.context.subscribers = [];

function serveIndex() {
    this.type = 'text/html; charset=utf-8';
    this.body = fs.createReadStream('index.html');
}

function subscribe() {
    this.type = 'text/plain; charset=utf-8';
    this.body = new PassTrough();
    app.context.subscribers.push(this.response);
    this.res.setTimeout(config.get('timeout'), () => {
        this.status = 202;
        this.body.end();
    });
}

function publish() {
    let data = '';

    this.body = new PassTrough();
    this.req.on('data', chunk => data += chunk);
    this.req.on('end', () => {
        try {
            const body = JSON.parse(data);
            app.context.subscribers.forEach(subscriber => {
                subscriber.body.end(body.message);
            });
            this.body.end('Success');
        } catch (e) {
            this.throw(500);
        } finally {
            app.context.subscribers = [];
        }
    });
    // this.req.on('close', () => console.log('publish request closed'));
}

const routes = {
    'GET /': serveIndex,
    'GET /subscribe': subscribe,
    'POST /publish': publish,
};

app.use(function * () {
    // console.log(`subscribers count ${app.context.subscribers.length}`);
    const route = `${this.method} ${this.url}`;

    if (route in routes) {
        routes[route].apply(this);
    } else {
        this.throw(404);
    }
});

if (module.parent) {
    module.exports = app;
} else {
    app.listen(3005);
}
