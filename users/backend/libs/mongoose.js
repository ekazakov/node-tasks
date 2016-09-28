const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');
mongoose.Promise = Promise;
// mongoose.plugin(beautifyUnique);
mongoose.set('debug', true);

const connectionOptions = {
    server: {
        socketOptions: {
            keepAlive: 1
        },
        poolSize: 5
    }
};

mongoose.connect('mongodb://localhost/users-base', connectionOptions);

module.exports = mongoose;