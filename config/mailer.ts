import nodemailer from "nodemailer";
import { env } from "./env.js";

const email = env.email;
const password = env.appPassword;

if (!email || !password) {
  throw new Error("EMAIL and APP_PASSWORD must be configured");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: email,
    pass: password,
  },
});

export default transporter;
