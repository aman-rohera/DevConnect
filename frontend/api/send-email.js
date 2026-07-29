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

  const { email, otp, fullName, type = 'otp' } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email required' });
  }
  if (type === 'otp' && !otp) {
    return res.status(400).json({ success: false, message: 'OTP required for password reset' });
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
  const frontendUrl = process.env.FRONTEND_URL || 'https://dev-connect-si.vercel.app';
  
  let htmlContent = '';
  let subject = '';

  if (type === 'welcome') {
    subject = `Welcome to DevConnect, ${name}! 🚀`;
    htmlContent = `
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
  } else {
    subject = `${otp} is your DevConnect password reset code`;
    htmlContent = `
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
  }

  try {
    const info = await transporter.sendMail({
      from: `DevConnect <${user}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    });
    return res.status(200).json({ success: true, message: 'Email sent successfully', messageId: info.messageId });
  } catch (error) {
    console.error('Email send failed:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
