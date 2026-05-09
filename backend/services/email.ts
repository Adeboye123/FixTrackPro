import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Brevo (formerly Sendinblue) Transactional Email API
// Uses HTTPS (port 443) — works on Render free tier where SMTP ports are blocked
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const fromName = "FixTrack Pro";

    if (!apiKey) {
      throw new Error("BREVO_API_KEY is missing. Set it in your .env or Render environment variables.");
    }

    if (!fromEmail) {
      throw new Error("SMTP_FROM or SMTP_USER is missing. Set a sender email in .env");
    }

    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to }],
        subject,
        textContent: text,
        ...(html && { htmlContent: html }),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Brevo API error (${response.status}): ${errorBody}`);
    }

    const result = await response.json();
    console.log(`✅ Email sent to ${to} (Brevo Message ID: ${result.messageId})`);
  } catch (error: any) {
    console.error("❌ Email sending failed:", error.message || error);
    console.log(`[EMAIL FALLBACK] To: ${to} - ${subject}: ${text}`);
  }
};
