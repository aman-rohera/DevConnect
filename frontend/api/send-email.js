import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { email, otp, fullName } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP required' });
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASS;

  if (!user || !pass) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server email credentials not configured in Vercel. Please set GMAIL_USER and GMAIL_APP_PASS in Vercel Environment Variables.' 
    });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: user.trim(), pass: pass.replace(/[\s"']/g, '') },
    tls: { rejectUnauthorized: false }
  });

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
        <tr>
          <td style="padding: 40px 30px; text-align: center; border-bottom: 1px solid #1e293b; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);">
            <h1 style="margin: 0; color: #e2e8f0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
              <span style="color: #3b82f6;">Dev</span>Connect
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #cbd5e1;">Hi ${name},</p>
            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #94a3b8;">
              We received a request to reset the password for your DevConnect account. Please use the following One-Time Password (OTP) to proceed:
            </p>
            <div style="background-color: #1e293b; border-radius: 8px; padding: 24px; text-align: center; margin: 30px 0;">
              <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 700; color: #3b82f6; letter-spacing: 4px;">
                ${otp}
              </div>
            </div>
            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 20px; color: #64748b; text-align: center;">
              This code will expire in 10 minutes. If you did not request a password reset, you can safely ignore this email.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `DevConnect <${user}>`,
      to: email,
      subject: `${otp} is your DevConnect password reset code`,
      html: htmlContent,
    });
    return res.status(200).json({ success: true, message: 'OTP email sent successfully', messageId: info.messageId });
  } catch (error) {
    console.error('Email send failed:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
