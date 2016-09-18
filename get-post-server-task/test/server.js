/* global describe, before, beforeEach, after, it, context */

const expect = require('expect');
const server = require('../server');

// (!!!) encoding: null to get buffer,
// https://github.com/request/request/issues/823#issuecomment-59208292
const rp = require('request-promise').defaults({encoding: null});
const fs = require('fs-extra');
const host = 'http://localhost:3003';
const fixturesRoot = __dirname + '/fixtures';
require('co-mocha');


describe('Simple server', () => {
    before(done => server.listen(3003, 'localhost', done));
    beforeEach(() => fs.emptyDirSync('./files'));
    after(done => server.close(done));

    describe('GET file', () => {
        context('When file exists', () => {
            beforeEach(() => fs.copySync(`${fixturesRoot}/small.png`, './files/small.png'));

            it('return 200 and file', function * () {
                let smallPng = fs.readFileSync(`${fixturesRoot}/small.png`);
                const image = yield rp.get(`${host}/small.png`);
                expect(image.equals(smallPng)).toBe(true);
            });
        });

        context('Otherwise', () => {
            it('return 404', function * () {
                const response = yield rp.get(`${host}/small.png`).catch(err => err);
                expect(response.statusCode).toEqual(404);
            });
        });
    });

    describe('GET nested/path', () => {
        it('return 400', function * () {
            const response = yield rp.get(`${host}/nested/path`).catch(err => err);
            expect(response.statusCode).toEqual(400);
        });
    });
    
    describe('POST file', () => {
        context('When exists', () => {
            it.skip('foo')
        });
        context('Otherwise', () => {
            it('return 200 and file is uploaded', function * () {
                const request = rp.post({url: `${host}/small.png`, resolveWithFullResponse: true});
                fs.createReadStream(`${fixturesRoot}/small.png`).pipe(request);

                const response = yield request;
                expect(response.statusCode).toBe(201);
                const fixtureFile = fs.readFileSync(`${fixturesRoot}/small.png`);
                const uploadedFile = fs.readFileSync(`./files/small.png`);
                expect(fixtureFile.equals(uploadedFile)).toBe(true);
            });
        });
    });
});