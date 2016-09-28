const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: "E-mail is required",
        validate: [
            {
                validator: (value) => /^[^@]+@[^@]/.test(value),
                msg: 'E-mail is not correct'
            }
        ],
        unique: 'Such email already exist'
    },
    displayName: {
        type: String,
        required: 'User must must have a name',
        unique: 'Such name already exists'
    }
}, {
    timestamps: true
});

userSchema.options.emitIndexErrors = true;
userSchema.statics.publicFields = ['email', 'displayName'];
const beautifyUnique = require('mongoose-beautiful-unique-validation');
// userSchema.plugin(beautifyUnique);

const User = mongoose.model('User', userSchema);

User.on('error', (error) => {
    console.log('======================================');
    console.log(error);
});

module.exports = User;
