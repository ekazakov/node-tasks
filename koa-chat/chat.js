'use strict';

const https = require('https');
const config = require('config');
const koa = require('koa');
const app = koa();
const parser = require('co-body');
const fs = require('fs');

const options = {
    key: fs.readFileSync('foo.bar.key'),
    cert: fs.readFileSync('foo.bar.crt')
};

app.context.subscribers = [];

app.use(function * tryCatch(next) {
    try {
        yield * next;
    } catch (error) {
        this.status = error.status || 500;
        this.body = error.message;
    }
});

app.use(function * (next) {
    if (!['GET', 'DELETE'].includes(this.method)) {
        this.request.body = yield parser.json(this, {strict: true});
    }
    yield * next;
});

app.use(require('./routes'));

if (module.parent) {
    module.exports = app;
} else {
    // app.listen(3005, '0.0.0.0', () => {
    //     console.log('Chat started on http://localhost:3005');
    // });
    https.createServer(options, app.callback()).listen(3005, '0.0.0.0');
    require('death')(() => {
        console.log('\nChat destroyed!');
        process.exit();
    });
}
