import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const user = process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : null;
const rawPass = process.env.GMAIL_APP_PASS ? process.env.GMAIL_APP_PASS.trim() : null;
const pass = rawPass ? rawPass.replace(/\s+/g, '') : null;

console.log('Testing Gmail SMTP on Port 465 (Direct SSL) with user:', user);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Port 465 uses SSL directly (works on Render)
  auth: { user, pass },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

async function main() {
  const info = await transporter.sendMail({
    from: `DevConnect <${user}>`,
    to: 'vivekdhanwani2004@gmail.com',
    subject: 'DevConnect Render SSL Test Email',
    html: '<h3>Testing Port 465 SSL connection for Render hosting</h3>',
  });
  console.log('Success on Port 465! MessageId:', info.messageId);
}

main().catch(err => {
  console.error('Port 465 Test Failed:', err);
  process.exit(1);
});
