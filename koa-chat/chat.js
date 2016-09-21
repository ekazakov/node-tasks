'use strict';

const config = require('config');
const fs = require('fs');
const koa = require('koa');
const app = koa();
const parser = require('co-body');
const co = require('co');

function defer() {
    let resolve, reject;
    const promise = new Promise((...args) => {
        ([resolve, reject] = args);
    });
    return {
        reject,
        resolve,
        promise
    };
}

app.context.subscribers = [];

function * serveIndex() {
    this.type = 'text/html; charset=utf-8';
    this.body = fs.createReadStream('index.html');
}

function * subscribe() {
    const deferred = defer();
    app.context.subscribers.push(deferred);

    this.body = yield deferred.promise;
    this.type = 'text/plain; charset=utf-8';
    this.status = 200;
}

function * publish() {
    try {
        app.context.subscribers.forEach(subscriber => {
            subscriber.resolve(this.request.body.message);
        });
        this.body = 'Success';
    } catch (e) {
        this.throw(500);
    } finally {
        app.context.subscribers = [];
    }
}

app.use(function * tryCatch(next) {
    try {
        yield * next;
    } catch (error) {
        this.status = error.status || 500;
        this.body = error.message;
    }
});

app.use(function * timeout(next) {
    let timer;
    const timeoutPromise = new Promise((resolve, reject) => {
        timer = setTimeout(() => {
           const error = new Error('Request timeout');
           error.status = 202;
           reject(error);
        }, config.get('timeout'));
    });

    const nextStep = co(function * () { yield * next; }.bind(this))
        .then(()=> {
            // console.log('clean timer');
            clearTimeout(timer);
        })
        .catch(err => {
            clearTimeout(timer);
            return err;
        })
    ;

    yield Promise.race([timeoutPromise, nextStep]);
});

app.use(function * (next) {
    if (!['GET', 'DELETE'].includes(this.method)) {
        this.request.body = yield parser.json(this, {strict: true});
    }

    yield * next;
});

app.use(function * () {
    const route = `${this.method} ${this.url}`;

    switch (route) {
        case 'GET /':
            yield serveIndex.apply(this);
            break;
        case 'GET /subscribe':
            yield subscribe.apply(this);
            break;
        case 'POST /publish':
            yield publish.apply(this);
            break;
    }
});



if (module.parent) {
    module.exports = app;
} else {
    const server = app.listen(3005, '0.0.0.0', () => {
        console.log('Chat started on http://localhost:3005');
        const timer = setInterval(() => {
            console.log(`${new Date().toISOString()}: alive`);
        }, 1000);
        timer.unref();
    });
    require('death')(() => {
        console.log('\nChat destroyed!');
        process.exit();
    });
}
