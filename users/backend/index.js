'use strict';

if (process.env.TRACE) {
    require('./libs/trace');
}

const koa = require('koa');
const app = koa();

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


if (module.parent) {
    module.exports = app;
} else {
    app.listen(8080, '0.0.0.0', () => {
        console.log('Users service started on http://localhost:8080');
    });
    require('death')(() => {
        console.log('\nUsers destroyed!');
        process.exit();
    });
}