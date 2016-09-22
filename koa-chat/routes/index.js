const router = require('koa-router')();
const fs = require('fs');
const path = require('path');
const co = require('co');
const config = require('config');

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

router.get('/', function * serveIndex() {
    this.type = 'text/html; charset=utf-8';
    this.body = fs.createReadStream(path.normalize(path.join(__dirname, '../index.html')));
});

function * timeout(next) {
    let timer;
    const timeoutPromise = new Promise((resolve, reject) => {
        timer = setTimeout(() => {
            const index = this.app.context.subscribers.indexOf(this.state.deferred);
            if (index !== -1) {
                this.app.context.subscribers.splice(index, 1);
            }

            const error = new Error('Request timeout');
            error.status = 202;
            reject(error);
        }, config.get('timeout'));
    });

    const nextStep = co(function * () { yield * next; }.bind(this))
        .then(()=> { clearTimeout(timer); })
        .catch(err => {
            clearTimeout(timer);
            throw err;
        });
    ;

    yield Promise.race([timeoutPromise, nextStep]);
}

function * subscribe() {
    const deferred = defer();
    this.state.deferred = deferred;
    this.app.context.subscribers.push(deferred);

        this.body = yield deferred.promise;
    try {
    } catch (error) {
        console.log('catched');
        this.throw(error);
    }

    this.type = 'text/plain; charset=utf-8';
    this.status = 200;
}

router.get('/subscribe', timeout, subscribe);

router.post('/publish', function * publish() {
    try {
        this.app.context.subscribers.forEach(subscriber => {
            subscriber.resolve(this.request.body.message);
        });
        this.body = 'Success';
    } catch (e) {
        this.throw(500);
    } finally {
        this.app.context.subscribers = [];
    }
});

module.exports = router.routes();