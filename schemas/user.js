const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    Username: {
        type: String,
        required: true
    },
    FirstName: String,
    LastName: String,
    Email: {
        type: String,
        required: true,
        unique: true
    },
    uid: {
        type: String,
        required: true,
        unique: true
    },
    ProfilePicture: {
        type: String
    },
    Password: {
        type: String,
        required: true
    },
    DOB: Date,

}, {
    timestamps: true
})

const User = mongoose.model("User", userSchema);
module.exports = User;