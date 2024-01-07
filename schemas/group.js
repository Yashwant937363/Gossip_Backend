const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GroupSchema = new Schema({
    AdminID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    Members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
}, { timestamps: true });

const Group = mongoose.model('Group', GroupSchema);

module.exports = Group;
