const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GroupChatSchema = new Schema({
    GroupID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    SenderID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    text: {
        type: String,
        required: true
    }
}, { timestamps: true })

const GroupChat = mongoose.model("GroupChat", GroupChatSchema);
module.exports = GroupChat;