import dotenv from 'dotenv';
import { sendPasswordResetOtpEmail } from '../src/utils/email.service.js';

dotenv.config();

async function sendRealOtp() {
  const targetEmail = 'vivekdhanwani2004@gmail.com';
  console.log('Sending real OTP email to:', targetEmail);

  // Generate a live 6-digit OTP code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const result = await sendPasswordResetOtpEmail({
    email: targetEmail,
    fullName: 'Vivek Dhanwani',
    otp: otp
  });

  console.log('Result:', result);
  console.log(`Generated OTP code sent to ${targetEmail}: ${otp}`);
}

sendRealOtp().catch(console.error);
