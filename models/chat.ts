import mongoose, { Schema } from "mongoose";

export interface ITranslatedChat {
  language: string;
  translatedText: string;
}

const translatedChatSchema = new Schema<ITranslatedChat>(
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
  { _id: false },
);

export interface IChat {
  Sender_ID: string;
  Receiver_ID: string;
  text: string;
  seen: boolean | null;
  type: string;
  translatedText: ITranslatedChat[];
}

const chatSchema = new Schema<IChat>(
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
  { timestamps: true },
);

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
