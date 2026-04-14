import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Gmail SMTP transporter — uses App Password for authentication
// For other providers, change service/host accordingly
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("SMTP credentials missing. Set SMTP_USER (Gmail) and SMTP_PASS (App Password) in .env");
    }

    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

    const info = await transporter.sendMail({
      from: `"FixTrack Pro" <${fromEmail}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`✅ Email sent to ${to} (Message ID: ${info.messageId})`);
  } catch (error: any) {
    console.error("❌ Email sending failed:", error.message || error);
    console.log(`[EMAIL FALLBACK] To: ${to} - ${subject}: ${text}`);
  }
};
