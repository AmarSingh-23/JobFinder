const SibApiV3Sdk = require('@getbrevo/brevo');

const sendEmail = async (to, subject, otp, customHtml) => {
  // Support both object parameter format and positional parameters format
  let emailTo = to;
  let emailSubject = subject;
  let emailOtp = otp;
  let emailCustomHtml = customHtml;

  if (typeof to === 'object' && to !== null) {
    emailTo = to.email;
    emailSubject = to.subject;
    emailOtp = to.otp;
    emailCustomHtml = to.html;
  }

  try {
    let emailHtml;

    if (emailCustomHtml) {
      emailHtml = emailCustomHtml;
    } else {
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px; background: #2563eb; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">💼 Job Finder</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #2563eb;">Your OTP Code</h2>
            <p>Use the following code to verify your email:</p>
            <div style="text-align: center; margin: 20px 0;">
              <h1 style="color: #2563eb; letter-spacing: 10px; font-size: 42px;">${emailOtp}</h1>
            </div>
            <p style="color: #6b7280;">This OTP expires in 10 minutes.</p>
            <p style="color: #6b7280;">If you did not request this, please ignore this email.</p>
          </div>
          <div style="text-align: center; padding: 10px; color: #9ca3af; font-size: 12px;">
            © 2026 Job Finder. All rights reserved.
          </div>
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