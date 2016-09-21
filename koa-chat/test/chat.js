/* global describe, before, beforeEach, after, it, context, JSON */

require('co-mocha');

const expect = require('expect');
const chat = require('../chat');
const rp = require('request-promise');
const host = 'http://localhost:3006';


// describe('deferred', function () {
//     it.only('resolve', function * () {
//         const def = defer();
//
//         setTimeout(() => def.resolve(10), 10);
//         const result = yield def.promise;
//         expect(result).toBe(10);
//     });
//     it.only('reject', function * () {
//         const def = defer();
//
//         setTimeout(() => def.reject(new Error('foo')), 10);
//         const result = yield def.promise.catch(err => err);
//
//         expect(result.message).toBe('foo');
//     });
// });

describe('Koa chat', () => {
    let server;
    beforeEach((done) => {
        server = chat.listen(3006, 'localhost', done);
    });
    afterEach((done) => server.close(done));

    describe('GET /subscribe', () => {
        context('If message published', () => {
            it('return 200 and message', function * () {
                const subscriptionReq = rp.get({url: `${host}/subscribe`, resolveWithFullResponse: true});
                const publishingReq = rp.post({
                    url: `${host}/publish`,
                    body: JSON.stringify({message: 'hello'}),
                    resolveWithFullResponse: true
                });

                const subscriptionRes = yield subscriptionReq;

                expect(subscriptionRes.statusCode).toBe(200);
                expect(subscriptionRes.body).toBe('hello');

                const publishingRes = yield publishingReq;
                expect(publishingRes.statusCode).toBe(200);
            });
        });
        context('Otherwise', () => {
            it('return 202', function * () {
                this.slow(5000);
                const subscriptionReq = rp.get({url: `${host}/subscribe`, resolveWithFullResponse: true});
                const subscriptionRes = yield subscriptionReq;
                expect(subscriptionRes.statusCode).toBe(202);
            });
        });
    });

    describe('POST /publish', () => {
        it('return 200', function * () {
            const publishingReq = rp.post({
                url: `${host}/publish`,
                body: JSON.stringify({message: 'hello'}),
                resolveWithFullResponse: true
            });

            const publishingRes = yield publishingReq;
            expect(publishingRes.statusCode).toBe(200);
        });
    });
    
    describe('Simple chat', () => {
        it('Two subscribers receive message', function * () {
            const subscriptionReqOne = rp.get({url: `${host}/subscribe`, resolveWithFullResponse: true});
            const subscriptionReqTow = rp.get({url: `${host}/subscribe`, resolveWithFullResponse: true});
            const publishingReq = rp.post({
                url: `${host}/publish`,
                body: JSON.stringify({message: 'hello'}),
                resolveWithFullResponse: true
            });

            const responses = yield Promise.all([subscriptionReqOne, subscriptionReqTow]);

            responses.forEach(response => {
                expect(response.statusCode).toBe(200);
                expect(response.body).toBe('hello');
            });

            const publishingRes = yield publishingReq;
            expect(publishingRes.statusCode).toBe(200);
        });
    });
});