import dotenv from "dotenv";

dotenv.config();

/**
 * Send SMS using Africa's Talking API
 * Free sandbox for testing, cheap production rates for Nigeria (~₦2-4/SMS)
 * 
 * Expects AT_USERNAME, AT_API_KEY, and AT_ENVIRONMENT to be set in .env
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

export const sendSMS = async (to: string, message: string) => {
  const username = process.env.AT_USERNAME;
  const apiKey = process.env.AT_API_KEY;
  const environment = process.env.AT_ENVIRONMENT || 'sandbox';
  const senderId = process.env.AT_SENDER_ID || 'FixTrack';

  if (!username || !apiKey) {
    console.warn("Africa's Talking credentials not found. Simulating SMS:", { to, message });
    return;
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
      } else {
        console.warn(`SMS sent but status: ${recipient.status} (code: ${recipient.statusCode})`);
      }
    } else {
      console.log(`SMS request accepted: ${data.SMSMessageData?.Message}`);
    }
  } catch (error) {
    console.error("Failed to send SMS:", error);
    throw error;
  }
};
