require('co-mocha');
const app = require('..');
const rp = require('request-promise').defaults({
    resolveWithFullResponse: true,
    simple: false
});
const co = require('co');
const mongoose = require('mongoose');

let User;
const getURL = (path) => `http://localhost:8080${path}`;

describe('User service API', function () {
    let existingUserData = {
        email: "john@test.ru",
        displayName: "John"
    };
    let newUserData = {
        email: "alice@test.ru",
        displayName: "Alice"
    };
    let existingUser;
    let server;

    before(done => {
        co(function *() {
            const connectionOptions = {
                server: {
                    socketOptions: {
                        keepAlive: 1
                    },
                    poolSize: 5
                }
            };

            console.log(`Mongoose connection state: ${mongoose.connection.readyState}`);

            if (mongoose.connection.readyState !== 0) {
                yield mongoose.disconnect();
            }
            
            yield mongoose.connect('mongodb://localhost/users-base', connectionOptions, (err) => {
                console.log('=========== Mongoose connection');
                console.log(err ? err : 'success');
            });


            const routes = require('../routes');
            app.use(routes);
            User = mongoose.model('User');

            server = app.listen(8080, 'localhost', () => {
                console.log('server started');
                done();
            });
        })
    });
    after(done => server.close(() => {
        mongoose.disconnect((err) => {
            console.log('============== Mongoose disconnect');
            console.log(err ? err : 'success');
            done();
        });
    }));

    beforeEach(function * () {
        yield User.remove({});
        existingUser = yield User.create(existingUserData);
    });
    
    describe('POST /users', function () {
        it('create a user', function * () {
            const response = yield rp.post({url: getURL('/users'), json: true, body: newUserData});
            expect(response.body).toEqual(newUserData);
        });

        it('throws if email already exists', function *() {
            const response = yield rp.post({url: getURL('/users'), json: true, body: existingUserData});
            expect(response.statusCode).toBe(400);
            expect(response.body.errors.email).toBe('Such email already exist');
        });
        
        it('throws id email not valid', function *() {
            const response = yield rp.post({url: getURL('/users'), json: true, body: {email: 'invalid'}});
            expect(response.statusCode).toBe(400);
        });
    });

    describe('DELETE /user/:userId', function () {
        it('removes user', function * () {
            let response = yield rp.del(getURL(`/users/${existingUser._id}`));
            expect(response.statusCode).toBe(200);
            const users = yield User.find({});
            expect(users.length).toBe(0);
        });
    });

    it("GET /users gets all users", function*() {
        let response = yield rp.get(getURL('/users'));
        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toMatch(/application\/json/);
        expect(JSON.parse(response.body).length).toBe(1);
    });
});