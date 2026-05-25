const SibApiV3Sdk = require('@getbrevo/brevo');

const sendEmail = async (to, subject, otp) => {
  try {
    let emailTo, emailSubject, emailHtml;

    if (typeof to === 'object' && to !== null) {
      emailTo = to.email;
      emailSubject = to.subject;
      emailHtml = to.html || `<p>${to.message}</p>`;
    } else {
      emailTo = to;
      emailSubject = subject;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Job Finder - Email Verification</h2>
          <p>Your OTP code is:</p>
          <h1 style="color: #2563eb; letter-spacing: 8px;">${otp}</h1>
          <p>This OTP expires in 10 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: process.env.FROM_NAME || 'Job Finder',
          email: process.env.FROM_EMAIL
        },
        to: [{ email: emailTo }],
        subject: emailSubject,
        htmlContent: emailHtml
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Email failed:', data);
    } else {
      console.log('✅ Email sent successfully to', emailTo);
    }
  } catch (error) {
    console.error('❌ Email failed:', error.message);
  }
};

module.exports = sendEmail;