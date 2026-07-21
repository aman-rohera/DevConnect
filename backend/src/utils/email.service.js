import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const getGmailTransporter = () => {
  const user = process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : null;
  const rawPass = process.env.GMAIL_APP_PASS ? process.env.GMAIL_APP_PASS.trim() : null;
  if (!user || !rawPass) {
    return null;
  }
  // Strip all spaces from app password to ensure clean authentication
  const pass = rawPass.replace(/\s+/g, '');
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL required for cloud server environments (Render/AWS)
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Sends a clean, professional dark-themed Welcome Email to newly registered users
 */
export const sendWelcomeEmail = async ({ email, fullName }) => {
  const gmailTransporter = getGmailTransporter();
  const userAddress = process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : 'divyeshdandwani@gmail.com';
  const fromEmail = `DevConnect <${userAddress}>`;
  const frontendUrl = process.env.FRONTEND_URL || 'https://dev-connect-si.vercel.app';
  const name = fullName || 'Developer';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to DevConnect</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 30px auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
        <!-- Header -->
        <tr>
          <td style="padding: 32px 32px 24px 32px; background-color: #090d16; border-bottom: 1px solid #1e293b; text-align: center;">
            <table align="center" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color: #3b82f6; border-radius: 10px; padding: 8px 12px; font-weight: bold; color: #ffffff; font-size: 18px; display: inline-block;">
                  &lt;/&gt;
                </td>
                <td style="padding-left: 12px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                  DevConnect
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
          <td style="padding: 32px;">
            <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #ffffff; line-height: 1.3;">
              Welcome aboard, ${name}! 🚀
            </h1>
            <p style="margin: 0 0 20px 0; font-size: 15px; color: #94a3b8; line-height: 1.6;">
              We're thrilled to have you join <strong style="color: #f8fafc;">DevConnect</strong> — the ultimate social and professional network built specifically for developers, engineers, and tech innovators.
            </p>
            
            <!-- Features Card Grid -->
            <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 14px 0; font-size: 15px; font-weight: 600; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.5px;">
                Here is what you can do right now:
              </h3>
              <ul style="margin: 0; padding-left: 18px; color: #cbd5e1; font-size: 14px; line-height: 1.8;">
                <li style="margin-bottom: 8px;">💻 <strong>Share Code & Posts</strong> — Show off your latest projects and thoughts.</li>
                <li style="margin-bottom: 8px;">🤝 <strong>Connect with Developers</strong> — Network with engineers & tech leaders worldwide.</li>
                <li style="margin-bottom: 8px;">📄 <strong>Attach Your PDF Resume</strong> — Upload your CV directly on your profile for recruiters.</li>
                <li>💼 <strong>Explore Tech Jobs</strong> — Apply to top engineering opportunities with 1-click.</li>
              </ul>
            </div>

            <!-- Call to Action Button -->
            <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 28px auto 12px auto;">
              <tr>
                <td align="center" style="background-color: #3b82f6; border-radius: 10px;">
                  <a href="${frontendUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 10px;">
                    Explore DevConnect Feed &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="padding: 24px 32px; background-color: #090d16; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
            <p style="margin: 0 0 8px 0;">This email was sent to <span style="color: #94a3b8;">${email}</span> because you signed up on DevConnect.</p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} DevConnect Inc. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    if (gmailTransporter) {
      const info = await gmailTransporter.sendMail({
        from: fromEmail,
        to: email,
        subject: `Welcome to DevConnect, ${name}! 🚀`,
        html: htmlContent,
      });

      console.log(`[Email Service Success - Gmail SMTP] Welcome email successfully sent to ${email}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId, provider: 'gmail' };
    }

    console.log(`[Email Service] GMAIL_USER / GMAIL_APP_PASS not configured in .env. Welcome email to ${email} simulated successfully.`);
    return { success: true, simulated: true };
  } catch (err) {
    console.error(`[Email Service Exception] Failed to send welcome email to ${email}:`, err?.message || err);
    return { success: false, error: err?.message };
  }
};
