module.exports = function*(next) {

    try {
        yield* next;
    } catch (e) {
        this.set('X-Content-Type-Options', 'nosniff');
        let preferredType = this.accepts('html', 'json');

        if (e.status) {
            this.status = e.status;

            if (preferredType === 'json') {
                this.body = {error: e.message};
            } else {
                this.body = e.message;
            }

        } else if (e.name === 'ValidationError') {
            this.status = 400;
            let errors = {};

            for (let field in e.errors) {
                errors[field] = e.errors[field].message;
            }

            if (preferredType === 'json') {
                this.body = {errors};
            } else {
                this.body = 'Invalid data';
            }

        } else {
            this.body = 'Error 500';
            this.status = 500;
            console.error(e.message, e.stack);
        }

    }
};
