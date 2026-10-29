import { Transporter } from "nodemailer";
import { env } from "../config/env.js";
import transporter from "../config/mailer.js";

export function generateEmailOtp(randomFn = Math.random): string {
  return Math.floor(100000 + randomFn() * 900000).toString();
}

export async function sendEmailOtp(
  recipientEmail: string,
  otp: string,
  senderEmail = env.email,
  mailer: Pick<Transporter, "sendMail"> = transporter,
): Promise<void> {
  await mailer.sendMail({
    from: senderEmail,
    to: recipientEmail,
    subject: "Your One-Time Password (OTP) for Verification",
    text: `Dear User,

Your One-Time Password (OTP) for verification is: ${otp}

Please use this OTP to complete your verification. Do not share it with anyone.

Best regards,
Gossip AI`,
    html: `
      <p>Dear User,</p>
      <p>Your One-Time Password (OTP) for verification is:
        <strong>${otp}</strong>
      </p>
      <p>Please use this OTP to complete your verification.
        Do not share it with anyone.</p>
      <p>Best regards,<br />Gossip AI</p>
    `,
  });
}
