'use strict';

if (process.env.TRACE) {
    require('./libs/trace');
}

const koa = require('koa');
const app = koa();
const co = require('co');
const config = require('config');
// keys for in-koa KeyGrip cookie signing (used in session, maybe other modules)
app.keys = [config.secret];

const path = require('path');
const fs = require('fs');
const middlewares = fs.readdirSync(path.join(__dirname, 'middlewares')).sort();

middlewares.forEach(function (middleware) {
    app.use(require('./middlewares/' + middleware));
});

const routes = require('./routes');
// ---------------------------------------


app.use(routes);

const mongoose = require('./libs/mongoose');
const User = require('./models/user');

co(function *() {
    try {
        yield User.remove({});
        yield new Promise(resolve => User.on('index', resolve));
        yield Promise.all([
           User.create({email: 'mike@mail.com', displayName: 'mike'}),
           User.create({email: 'mike1@mail.com', displayName: 'mike1'}),
           User.create({email: 'mike2@mail.com', displayName: 'mike2'}),
        ]);

        // const userList = yield User.find({});
        // console.log(userList.map(user => user.getPublicFields()));
    } catch (e) {
        console.error(e.message);
        console.error(e.stack);
        yield mongoose.disconnect();
    }
});

if (module.parent) {
    module.exports = app;
} else {
    app.listen(8080, '0.0.0.0', () => {
        console.log('Users service started on http://localhost:8080');
    });
    require('death')(() => {
        mongoose.disconnect();
        console.log('\nUsers destroyed!');
        process.exit();
    });
}