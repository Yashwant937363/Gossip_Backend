const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define TranslationSettings Schema
const TranslationSettingsSchema = new Schema(
  {
    language: {
      type: String,
      required: true,
    },
    alwaysTranslate: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);
const SummarziationSettingsSchema = new Schema(
  {
    format: {
      type: String,
      enum: ["paragraph", "bullet", "structured"],
      required: true,
    },
  },
  { _id: false }
);

// Define Settings Schema
const SettingsSchema = new Schema(
  {
    translation: {
      type: TranslationSettingsSchema,
      required: true,
    },
    summarization: {
      type: SummarziationSettingsSchema,
      required: true,
    },
  },
  { _id: false }
);

// Define User Schema
const userSchema = new Schema(
  {
    Username: {
      type: String,
      required: true,
    },
    FirstName: String,
    LastName: String,
    Email: {
      type: String,
      required: true,
      unique: true,
    },
    uid: {
      type: String,
      required: true,
      unique: true,
    },
    ProfilePicture: String,
    Password: {
      type: String,
      required: true,
    },
    DOB: Date,
    settings: {
      type: SettingsSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
