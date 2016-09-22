/* global describe, before, beforeEach, after, it, context, JSON */

require('co-mocha');

const expect = require('expect');
const chat = require('../chat');
const rp = require('request-promise').defaults({
    resolveWithFullResponse: true,
    simple: false
});
const host = 'http://localhost:3006';

describe('Koa chat', () => {
    let server;
    beforeEach((done) => {
        server = chat.listen(3006, 'localhost', done);
    });
    afterEach((done) => server.close(done));

    describe('GET /subscribe', () => {
        context('If message published', () => {
            it('return 200 and message', function * () {
                const subscriptionReq = rp.get({url: `${host}/subscribe`});
                const publishingReq = rp.post({
                    url: `${host}/publish`,
                    body: JSON.stringify({message: 'hello'})
                });

                const subscriptionRes = yield subscriptionReq;

                expect(subscriptionRes.statusCode).toBe(200);
                expect(subscriptionRes.body).toBe('hello');

                const publishingRes = yield publishingReq;
                expect(publishingRes.statusCode).toBe(200);
            });
        });
        context('If subscription closed by timeout', () => {
            it('return 202', function * () {
                this.slow(5000);
                const subscriptionReq = rp.get({url: `${host}/subscribe`});
                const subscriptionRes = yield subscriptionReq;
                expect(subscriptionRes.statusCode).toBe(202);
            });

            //TODO: как лучше тестировать?
            it('clear subscribers', function * () {
                this.slow(5000);
                expect(chat.context.subscribers.length).toEqual(0);
                const subscriptionReq = rp.get({url: `${host}/subscribe`});
                yield subscriptionReq;
                expect(chat.context.subscribers.length).toEqual(0);
            });
        });
    });

    describe('POST /publish', () => {
        context('When message is valid JSON', () => {
            it('return 200', function *() {
                const publishingReq = rp.post({
                    url: `${host}/publish`,
                    body: JSON.stringify({message: 'hello'})
                });

                const publishingRes = yield publishingReq;
                expect(publishingRes.statusCode).toBe(200);
            });
        });

        context('Otherwise', () => {
            it('return 400', function * () {
                const publishingReq = rp.post({
                    url: `${host}/publish`,
                    body: 'simple text'
                });

                const publishingRes = yield publishingReq;
                expect(publishingRes.statusCode).toBe(400);
            });
        });
    });

    describe('Simple chat', () => {
        //TODO: бывает падает по таймауту
        it('Two subscribers receive message', function * () {
            const subscriptionReqOne = rp.get({url: `${host}/subscribe`});
            const subscriptionReqTow = rp.get({url: `${host}/subscribe`});
            const publishingReq = rp.post({
                url: `${host}/publish`,
                body: JSON.stringify({message: 'hello'})
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