import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Resend client (primary provider — uses HTTPS port 443, works on all cloud hosts)
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

const getGmailTransporter = () => {
  const user = process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : null;
  const rawPass = process.env.GMAIL_APP_PASS ? process.env.GMAIL_APP_PASS.trim() : null;
  
  if (!user || !rawPass) {
    const smtpHost = process.env.SMTP_HOST ? process.env.SMTP_HOST.trim() : null;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
    const smtpUser = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : null;
    const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : null;

    if (smtpHost && smtpUser && smtpPass) {
      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
      });
    }

    console.warn('[Email Service Warning] GMAIL_USER / GMAIL_APP_PASS or SMTP credentials missing in backend/.env!');
    return null;
  }
  
  // Strip all spaces and quotes from app password to ensure clean authentication
  const pass = rawPass.replace(/[\s"']/g, '');

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 25000,
    greetingTimeout: 25000,
    socketTimeout: 25000,
  });
};

/**
 * Sends a clean, professional dark-themed Welcome Email to newly registered users
 */
export const sendWelcomeEmail = async ({ email, fullName }) => {
  const gmailTransporter = getGmailTransporter();
  const userAddress = process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : (process.env.SMTP_USER || 'no-reply@devconnect.com');
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
    // Primary: Resend API (HTTPS port 443 — never blocked on Render)
    const resend = getResendClient();
    if (resend) {
      const { data, error } = await resend.emails.send({
        from: 'DevConnect <onboarding@resend.dev>',
        to: email,
        subject: `Welcome to DevConnect, ${name}! 🚀`,
        html: htmlContent,
      });
      if (!error) {
        console.log(`[Email Service Success - Resend] Welcome email sent to ${email}. MessageId: ${data?.id}`);
        return { success: true, messageId: data?.id, provider: 'resend' };
      }
      console.warn('[Email Service Warning] Resend failed, falling back to Gmail SMTP:', error?.message);
    }

    // Fallback: Gmail SMTP via Nodemailer
    if (!gmailTransporter) {
      console.log(`[Email Service Simulation] No email provider configured. Welcome email to ${email} simulated.`);
      return { success: true, simulated: true, reason: 'No email provider configured in process.env' };
    }

    const info = await gmailTransporter.sendMail({
      from: fromEmail,
      to: email,
      subject: `Welcome to DevConnect, ${name}! 🚀`,
      html: htmlContent,
    });

    console.log(`[Email Service Success - Gmail SMTP] Welcome email sent to ${email}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId, provider: 'gmail' };
  } catch (err) {
    console.error(`[Email Service Exception] Failed to send welcome email to ${email}:`, err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
};

/**
 * Sends a clean, professional dark-themed Password Reset OTP email
 */
export const sendPasswordResetOtpEmail = async ({ email, fullName, otp }) => {
  const gmailTransporter = getGmailTransporter();
  const userAddress = process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : (process.env.SMTP_USER || 'no-reply@devconnect.com');
  const fromEmail = `DevConnect <${userAddress}>`;
  const name = fullName || 'Developer';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DevConnect - Password Reset OTP</title>
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
            <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #ffffff; line-height: 1.3;">
              Password Reset Request 🔐
            </h1>
            <p style="margin: 0 0 20px 0; font-size: 15px; color: #94a3b8; line-height: 1.6;">
              Hello <strong style="color: #f8fafc;">${name}</strong>,<br/>
              We received a request to reset your password for your DevConnect account. Use the 6-digit One-Time Password (OTP) below to complete your reset request.
            </p>
            
            <!-- OTP Display Card -->
            <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0;">
              <span style="font-size: 13px; font-weight: 600; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase;">Your Verification OTP</span>
              <div style="font-size: 36px; font-weight: 800; color: #3b82f6; letter-spacing: 8px; margin: 12px 0 8px 0; font-family: monospace;">
                ${otp}
              </div>
              <p style="margin: 0; font-size: 13px; color: #ef4444; font-weight: 500;">
                ⏰ Valid for 10 minutes only
              </p>
            </div>

            <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b; line-height: 1.5;">
              If you did not request a password reset, please ignore this email or reach out to support if you suspect unauthorized access to your account.
            </p>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="padding: 24px 32px; background-color: #090d16; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
            <p style="margin: 0 0 8px 0;">This email was sent to <span style="color: #94a3b8;">${email}</span></p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} DevConnect Inc. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    // Primary: Resend API (HTTPS port 443 — never blocked on Render)
    const resend = getResendClient();
    if (resend) {
      const { data, error } = await resend.emails.send({
        from: 'DevConnect <onboarding@resend.dev>',
        to: email,
        subject: `${otp} is your DevConnect password reset code`,
        html: htmlContent,
      });
      if (!error) {
        console.log(`[Email Service Success - Resend] OTP email sent to ${email}. MessageId: ${data?.id}`);
        return { success: true, messageId: data?.id, provider: 'resend' };
      }
      console.warn('[Email Service Warning] Resend failed, falling back to Gmail SMTP:', error?.message);
    }

    // Fallback: Gmail SMTP via Nodemailer
    if (!gmailTransporter) {
      console.log(`[Email Service Simulation] No email provider configured. OTP ${otp} to ${email} simulated.`);
      return { success: true, simulated: true, otp, reason: 'No email provider configured in process.env' };
    }

    const info = await gmailTransporter.sendMail({
      from: fromEmail,
      to: email,
      subject: `${otp} is your DevConnect password reset code`,
      html: htmlContent,
    });

    console.log(`[Email Service Success - Gmail SMTP] OTP email sent to ${email}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId, provider: 'gmail' };
  } catch (err) {
    console.error(`[Email Service Exception] Failed to send OTP email to ${email}:`, err?.message || err);
    return {
      success: true,
      simulated: true,
      otp,
      reason: `Email send failed (${err?.message}).`
    };
  }
};


