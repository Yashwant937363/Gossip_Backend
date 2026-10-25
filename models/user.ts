import mongoose, { Schema } from "mongoose";
import { UserSettings } from "../schema/settings-schema.js";

const TranslationSettingsModelSchema = new Schema(
  {
    language: { type: String, required: true, default: "original" },
    alwaysTranslate: { type: Boolean, default: false },
  },
  { _id: false },
);

const SummarizationSettingsModelSchema = new Schema(
  {
    format: {
      type: String,
      enum: ["paragraph", "bullet", "structured"],
      default: "paragraph",
      required: true,
    },
  },
  { _id: false },
);

const UserSettingsModelSchema = new Schema(
  {
    translation: {
      type: TranslationSettingsModelSchema,
      required: true,
    },
    summarization: {
      type: SummarizationSettingsModelSchema,
      required: true,
    },
  },
  { _id: false },
);

interface IUser {
  Username: string;
  FirstName: string;
  LastName: string;
  Email: string;
  uid: string;
  ProfilePicture: string;
  Password: string;
  settings: UserSettings;
}
// Define User Schema
const userSchema = new Schema<IUser>(
  {
    Username: {
      type: String,
      required: true,
    },
    FirstName: {
      type: String,
      default: "",
    },
    LastName: {
      type: String,
      default: "",
    },
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
    ProfilePicture: {
      type: String,
      default: "",
    },
    Password: {
      type: String,
      required: true,
    },
    settings: {
      type: UserSettingsModelSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);
export default User;
