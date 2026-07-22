import dotenv from 'dotenv';
import { sendPasswordResetOtpEmail } from '../src/utils/email.service.js';

dotenv.config();

async function test() {
  console.log('Sending live test OTP email using GMAIL_USER:', process.env.GMAIL_USER);
  const result = await sendPasswordResetOtpEmail({
    email: 'divyeshdandwani@gmail.com',
    fullName: 'Test Developer',
    otp: '987654'
  });
  console.log('Live Email Sending Result:', JSON.stringify(result, null, 2));
}

test().catch(err => {
  console.error('Email Test Failed:', err);
  process.exit(1);
});
