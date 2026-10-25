import transporter from "../config/mailer.js";

const email = process.env.EMAIL;

export function generateEmailOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendEmailOtp(
  recipientEmail: string,
  otp: string,
): Promise<void> {
  await transporter.sendMail({
    from: email,
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
