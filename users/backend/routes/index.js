//TODO: зачем в тестах let users = yield User.find({}).exec();
//TODO: mongoose.plugin(beautifyUnique); не работает глобально
//TODO: uniqueValidator validation is not atomic! unsafe!

const Router = require('koa-router');
const User = require('../models/user');
const R = require('ramda');
const mongoose = require('mongoose');

const getPublicFields = R.pick(User.publicFields);
const router = new Router({
    prefix: '/users'
});

router.param('userId', function *(id, next) {
    this.assert(mongoose.Types.ObjectId.$isValid(id), 404, 'User not found');
    this.state.user = yield User.findById(id);
    this.assert(this.state.user != null, 404, 'User not found');

    yield* next;
});

router.get('/', function*() {
    const users = yield User.find({});
    this.body = R.map(getPublicFields, users);
});

router.get('/:userId', function *() {
    this.body = getPublicFields(this.state.user);
});

router.del('/:userId', function *() {
    yield this.state.user.remove();
    this.body = 'Ok'
});

router.post('/', function *() {
    const user = yield User.create(getPublicFields(this.request.body));
    this.status = 201;
    this.body = getPublicFields(user);
});

module.exports = router.routes();
