import dotenv from 'dotenv';
dotenv.config();

async function testBrevoApi() {
  const apiKey = process.env.BREVO_SMTP_KEY;
  console.log("Testing Brevo REST API with key:", apiKey?.substring(0, 15) + "...");

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'DevConnect', email: 'onboarding@devconnect.app' },
      to: [{ email: 'amanrohera999@gmail.com', name: 'Aman Rohera' }],
      subject: 'Welcome to DevConnect! 🚀',
      htmlContent: '<h1>Welcome to DevConnect!</h1><p>This is a test welcome email sent via Brevo REST API.</p>'
    })
  });

  const data = await response.json();
  console.log("Status:", response.status);
  console.log("Response:", data);
}

testBrevoApi();
