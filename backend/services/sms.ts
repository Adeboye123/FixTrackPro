import dotenv from "dotenv";

dotenv.config();

/**
 * SMS / WhatsApp Notification Service for FixTrack Pro
 * 
 * Supports two modes:
 * 1. **WhatsApp Link (FREE)** — Generates a wa.me deep link with pre-filled message.
 *    The frontend opens this link, allowing the shop owner to send the message via WhatsApp.
 *    Zero cost, works immediately, no API keys needed.
 * 
 * 2. **Africa's Talking API (PAID)** — Direct SMS delivery when API credentials are configured.
 *    Expects AT_USERNAME, AT_API_KEY, and AT_ENVIRONMENT to be set in .env.
 *    Free sandbox for testing, cheap production rates for Nigeria (~₦2-4/SMS).
 */

const formatPhoneNumber = (phone: string) => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // If it starts with '0' (like 080... or 070...), replace '0' with '+234'
  if (cleaned.startsWith('0')) {
    return '+234' + cleaned.substring(1);
  }

  // If it already starts with '234' but without the '+', add it
  if (cleaned.startsWith('234')) {
    return '+' + cleaned;
  }

  // Prepend '+' if none exists but we expect an international format
  if (!phone.startsWith('+')) {
    return '+' + cleaned;
  }

  return phone;
};

// Strip the '+' for wa.me links (WhatsApp expects digits only)
const formatForWhatsApp = (phone: string) => {
  return formatPhoneNumber(phone).replace('+', '');
};

/**
 * Generate a WhatsApp deep link with a pre-filled message.
 * This is FREE and works immediately — the shop owner clicks the link
 * and WhatsApp opens with the message ready to send.
 */
export const generateWhatsAppLink = (to: string, message: string) => {
  const waNumber = formatForWhatsApp(to);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${waNumber}?text=${encodedMessage}`;
};

/**
 * Check if direct SMS sending is available (Africa's Talking credentials configured)
 */
export const isSMSConfigured = () => {
  const username = process.env.AT_USERNAME;
  const apiKey = process.env.AT_API_KEY;
  const environment = process.env.AT_ENVIRONMENT || 'sandbox';
  // Sandbox mode with default "sandbox" username doesn't deliver real SMS
  if (environment === 'sandbox') return false;
  return !!(username && apiKey);
};

/**
 * Send SMS using Africa's Talking API (requires paid credentials)
 * Falls back to generating a WhatsApp link if credentials aren't configured.
 */
export const sendSMS = async (to: string, message: string) => {
  const username = process.env.AT_USERNAME;
  const apiKey = process.env.AT_API_KEY;
  const environment = process.env.AT_ENVIRONMENT || 'sandbox';
  const senderId = process.env.AT_SENDER_ID || 'FixTrack';

  // If not in production mode or no credentials, return WhatsApp link as fallback
  if (!username || !apiKey || environment === 'sandbox') {
    const waLink = generateWhatsAppLink(to, message);
    console.log("SMS not configured for production. WhatsApp fallback link generated:", waLink);
    return { 
      delivered: false, 
      method: 'whatsapp_link', 
      whatsappLink: waLink,
      message: 'SMS credentials not configured. Use WhatsApp link to send message.'
    };
  }

  const baseUrl = environment === 'production'
    ? 'https://api.africastalking.com'
    : 'https://api.sandbox.africastalking.com';

  const formattedPhone = formatPhoneNumber(to);

  try {
    const params = new URLSearchParams({
      username,
      to: formattedPhone,
      message,
      ...(environment === 'production' && senderId ? { from: senderId } : {})
    });

    const res = await fetch(`${baseUrl}/version1/messaging`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "apiKey": apiKey
      },
      body: params.toString()
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(`Africa's Talking API Error: ${data.SMSMessageData?.Message || res.statusText}`);
    }

    const recipients = data.SMSMessageData?.Recipients;
    if (recipients && recipients.length > 0) {
      const recipient = recipients[0];
      if (recipient.statusCode === 101 || recipient.status === 'Success') {
        console.log(`SMS successfully sent to ${formattedPhone} (messageId: ${recipient.messageId})`);
        return { delivered: true, method: 'sms', messageId: recipient.messageId };
      } else {
        console.warn(`SMS sent but status: ${recipient.status} (code: ${recipient.statusCode})`);
        return { delivered: true, method: 'sms', status: recipient.status };
      }
    } else {
      console.log(`SMS request accepted: ${data.SMSMessageData?.Message}`);
      return { delivered: true, method: 'sms' };
    }
  } catch (error) {
    console.error("Failed to send SMS:", error);
    // On SMS failure, fallback to WhatsApp link
    const waLink = generateWhatsAppLink(to, message);
    return { 
      delivered: false, 
      method: 'whatsapp_link', 
      whatsappLink: waLink,
      message: 'SMS delivery failed. Use WhatsApp link instead.'
    };
  }
};
