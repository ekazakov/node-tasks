const Router = require('koa-router');
const router = new Router();

router.get('/foo', function*() {
    this.body = 'Hello';
});

module.exports = router.routes();
