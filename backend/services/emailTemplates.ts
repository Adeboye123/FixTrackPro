// Professional HTML email template for FixTrack Pro
// All transactional emails use this branded wrapper

export function buildEmailTemplate(options: {
  recipientName?: string;
  subject: string;
  body: string;          // inner HTML content
  shopName?: string;     // optional shop branding
  footerNote?: string;   // optional footer message
}): string {
  const { recipientName, body, shopName, footerNote } = options;
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hello,';
  const brandName = shopName || 'FixTrack Pro';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, -apple-system, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.07);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5, #6366f1); padding:28px 32px; text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background-color:rgba(255,255,255,0.2); border-radius:10px; padding:8px 10px; vertical-align:middle;">
                    <span style="font-size:18px; color:#ffffff;">🔧</span>
                  </td>
                  <td style="padding-left:10px; vertical-align:middle;">
                    <span style="font-size:20px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">${brandName}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <p style="margin:0 0 20px; font-size:16px; font-weight:600; color:#1e293b;">${greeting}</p>
              ${body}
            </td>
          </tr>

          <!-- Divider + Gratitude -->
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none; border-top:1px solid #e2e8f0; margin:0;">
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 12px;">
              <p style="margin:0; font-size:13px; color:#64748b; line-height:1.6;">
                Thank you for choosing <strong style="color:#4f46e5;">${brandName}</strong>. We truly appreciate your trust and business. 
                If you have any questions, please don't hesitate to reach out to us.
              </p>
            </td>
          </tr>
          ${footerNote ? `
          <tr>
            <td style="padding:4px 32px 16px;">
              <p style="margin:0; font-size:12px; color:#94a3b8; line-height:1.5;">${footerNote}</p>
            </td>
          </tr>` : ''}

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc; padding:20px 32px; border-top:1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 4px; font-size:12px; font-weight:700; color:#64748b;">Warm Regards,</p>
                    <p style="margin:0; font-size:13px; font-weight:800; color:#4f46e5;">${brandName} Team</p>
                  </td>
                  <td style="text-align:right;">
                    <p style="margin:0; font-size:10px; color:#94a3b8;">Powered by FixTrack Pro</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Sub-footer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin-top:16px;">
          <tr>
            <td style="text-align:center;">
              <p style="margin:0; font-size:11px; color:#94a3b8;">
                This email was sent by ${brandName}. If you did not request this, please ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Pre-built templates ──

export function otpEmailHtml(otp: string, purpose: 'login' | 'reset' = 'login', shopName?: string): string {
  const isReset = purpose === 'reset';
  return buildEmailTemplate({
    subject: isReset ? 'Password Reset Code' : 'Login Verification Code',
    body: `
      <p style="margin:0 0 16px; font-size:14px; color:#475569; line-height:1.6;">
        ${isReset 
          ? 'You requested to reset your password. Use the code below to complete the process.' 
          : 'A sign-in attempt requires verification. Please use the code below to complete your login.'
        }
      </p>
      <div style="background:#f0f0ff; border:2px dashed #c7d2fe; border-radius:12px; padding:20px; text-align:center; margin:20px 0;">
        <p style="margin:0 0 4px; font-size:10px; font-weight:700; color:#6366f1; text-transform:uppercase; letter-spacing:2px;">Verification Code</p>
        <p style="margin:0; font-size:36px; font-weight:900; letter-spacing:8px; color:#1e293b; font-family:'Courier New',monospace;">${otp}</p>
      </div>
      <p style="margin:0; font-size:13px; color:#94a3b8;">⏳ This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
    `,
    shopName,
  });
}

export function repairNotificationHtml(options: {
  customerName: string;
  deviceModel: string;
  jobId: string;
  status: string;
  shopName?: string;
  shopPhone?: string;
}): string {
  const { customerName, deviceModel, jobId, status, shopName, shopPhone } = options;
  
  const statusColors: Record<string, { bg: string; text: string; }> = {
    'Received': { bg: '#fef3c7', text: '#92400e' },
    'Diagnosing': { bg: '#dbeafe', text: '#1e40af' },
    'Waiting for Parts': { bg: '#fef3c7', text: '#92400e' },
    'Repairing': { bg: '#e0e7ff', text: '#3730a3' },
    'Completed': { bg: '#d1fae5', text: '#065f46' },
    'Delivered': { bg: '#d1fae5', text: '#065f46' },
  };
  const sc = statusColors[status] || { bg: '#f1f5f9', text: '#475569' };

  return buildEmailTemplate({
    recipientName: customerName,
    subject: `Repair Update: ${jobId}`,
    body: `
      <p style="margin:0 0 16px; font-size:14px; color:#475569; line-height:1.6;">
        We're writing to let you know about an update to your device repair.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; margin:16px 0;">
        <tr>
          <td style="padding:16px 20px; border-bottom:1px solid #e2e8f0;">
            <p style="margin:0; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Job ID</p>
            <p style="margin:4px 0 0; font-size:18px; font-weight:900; color:#4f46e5; font-family:'Courier New',monospace;">${jobId}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 20px; border-bottom:1px solid #e2e8f0;">
            <p style="margin:0; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Device</p>
            <p style="margin:4px 0 0; font-size:14px; font-weight:600; color:#1e293b;">${deviceModel}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 20px;">
            <p style="margin:0; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Current Status</p>
            <span style="display:inline-block; margin-top:6px; padding:4px 14px; border-radius:20px; font-size:12px; font-weight:800; background:${sc.bg}; color:${sc.text}; text-transform:uppercase; letter-spacing:0.5px;">${status}</span>
          </td>
        </tr>
      </table>
      ${status === 'Completed' ? `
      <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px; padding:14px 16px; margin:16px 0;">
        <p style="margin:0; font-size:13px; color:#065f46; font-weight:600;">🎉 Great news! Your device is ready for pickup. Please bring your receipt or Job ID when collecting your device.</p>
      </div>` : ''}
      ${shopPhone ? `<p style="margin:16px 0 0; font-size:13px; color:#64748b;">Need help? Call us at <strong>${shopPhone}</strong></p>` : ''}
    `,
    shopName,
    footerNote: 'Please keep your Job ID for reference when picking up your device.',
  });
}

export function adminLoginAlertHtml(options: {
  time: string;
  ip: string;
  userAgent: string;
  success: boolean;
}): string {
  const { time, ip, userAgent, success } = options;
  
  const statusBg = success ? '#ecfdf5' : '#fef2f2';
  const statusBorder = success ? '#a7f3d0' : '#fecaca';
  const statusColor = success ? '#065f46' : '#991b1b';
  const statusIcon = success ? '✅' : '⚠️';
  const statusText = success ? 'Successful Login' : 'Failed Login Attempt';

  return buildEmailTemplate({
    subject: success ? 'Admin Login Alert' : 'Admin Security Alert',
    body: `
      <div style="background:${statusBg}; border:1px solid ${statusBorder}; border-radius:12px; padding:16px 20px; margin:0 0 20px;">
        <p style="margin:0; font-size:15px; font-weight:700; color:${statusColor};">
          ${statusIcon} ${statusText}
        </p>
        <p style="margin:6px 0 0; font-size:13px; color:${statusColor};">
          ${success 
            ? 'A successful login to your FixTrack Pro Admin Dashboard was just detected.'
            : 'Someone attempted to log into your Admin Dashboard with an incorrect password.'
          }
        </p>
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; margin:16px 0;">
        <tr>
          <td style="padding:12px 20px; border-bottom:1px solid #e2e8f0;">
            <p style="margin:0; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Time</p>
            <p style="margin:4px 0 0; font-size:14px; font-weight:600; color:#1e293b;">${time}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 20px; border-bottom:1px solid #e2e8f0;">
            <p style="margin:0; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">IP Address</p>
            <p style="margin:4px 0 0; font-size:14px; font-weight:600; color:#1e293b; font-family:'Courier New',monospace;">${ip}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 20px;">
            <p style="margin:0; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Browser / Device</p>
            <p style="margin:4px 0 0; font-size:12px; font-weight:500; color:#64748b; word-break:break-all;">${userAgent}</p>
          </td>
        </tr>
      </table>

      ${!success ? `
      <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:14px 16px; margin:16px 0;">
        <p style="margin:0; font-size:13px; color:#92400e; font-weight:600;">
          🛡️ <strong>Security Tip:</strong> If this wasn't you, consider changing your admin password immediately. Multiple failed attempts will trigger an automatic lockout.
        </p>
      </div>` : `
      <p style="margin:16px 0 0; font-size:13px; color:#64748b; line-height:1.6;">
        If this was you, no action is needed. If you didn't initiate this login, please change your password immediately and review your security settings.
      </p>`}
    `,
    footerNote: 'This is an automated security notification from FixTrack Pro. You receive this because you are a platform administrator.',
  });
}

export function subscriptionExpiredHtml(options: {
  ownerName: string;
  previousPlan: string;
  shopName: string;
}): string {
  const { ownerName, previousPlan, shopName } = options;

  return buildEmailTemplate({
    recipientName: ownerName,
    subject: 'Your Subscription Has Expired',
    body: `
      <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:16px 20px; margin:0 0 20px;">
        <p style="margin:0; font-size:15px; font-weight:700; color:#991b1b;">
          ⚠️ Subscription Expired
        </p>
        <p style="margin:6px 0 0; font-size:13px; color:#991b1b;">
          Your <strong>${previousPlan}</strong> plan for <strong>${shopName}</strong> has expired and your account has been moved to the Trial plan.
        </p>
      </div>

      <p style="margin:0 0 16px; font-size:14px; color:#475569; line-height:1.6;">
        Some features may now be limited. To restore full access to all the features you were enjoying, please log in and subscribe to a new plan.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; margin:16px 0;">
        <tr>
          <td style="padding:12px 20px; border-bottom:1px solid #e2e8f0;">
            <p style="margin:0; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Previous Plan</p>
            <p style="margin:4px 0 0; font-size:14px; font-weight:600; color:#1e293b;">${previousPlan}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 20px; border-bottom:1px solid #e2e8f0;">
            <p style="margin:0; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Current Plan</p>
            <p style="margin:4px 0 0; font-size:14px; font-weight:600; color:#dc2626;">Trial (Limited Features)</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 20px;">
            <p style="margin:0; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Action Required</p>
            <p style="margin:4px 0 0; font-size:14px; font-weight:600; color:#4f46e5;">Subscribe to a new plan to restore access</p>
          </td>
        </tr>
      </table>

      <div style="text-align:center; margin:24px 0 8px;">
        <p style="margin:0; font-size:13px; color:#64748b; line-height:1.6;">
          Log in to your FixTrack Pro dashboard and visit the <strong>Billing</strong> page to choose a new plan.
        </p>
      </div>
    `,
    shopName: 'FixTrack Pro',
    footerNote: 'This is an automated subscription notification. You received this because your subscription plan has expired.',
  });
}
