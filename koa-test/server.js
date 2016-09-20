const koa = require('koa');
const app = koa();

app.use(function *(next) {
    const start = new Date();
    yield next;

    const ms = new Date() - start;
    this.set('X-Response-Time', `${ms}ms`);
});

app.use(function *(next) {
    const start = new Date();
    yield next;

    // throw Error('Oops');
    const ms = new Date() - start;
    console.log(`${this.method} ${this.url} — ${ms}m s`);
});


app.use(function *() {
    this.cookies.set('main', 'my-first-cookie', {path: '/fiz', expires: new Date(2016, 10, 0)});
    this.body = 'Hell';
});

app.on('error', (err, ctx) => {
    console.log('server error', err);
    console.log('context', ctx);
});

app.listen(3000);