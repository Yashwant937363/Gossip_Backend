const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const translatedChatSchema = new Schema(
  {
    language: {
      type: String,
      required: true,
    },
    translatedText: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

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
    translatedText: {
      type: [translatedChatSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;
