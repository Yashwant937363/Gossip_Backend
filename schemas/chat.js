const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatSchema = new Schema(
  {
    Sender_ID: {
      type: String,
      ref: "User",
      required: true,
    },
    Receiver_ID: {
      type: String,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    seen: {
      type: Boolean,
      default: null,
    },
    type: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;
