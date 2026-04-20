const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    userId: {
        type: String,
        unique: true
    },
    password: String,
    role: {
        type: String,
        enum: ["admin", "teacher", "student"],
        required: true
    }
});

module.exports = mongoose.model('User', userSchema);