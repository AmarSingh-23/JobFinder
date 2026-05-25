const Brevo = require('@getbrevo/brevo');

const sendEmail = async (to, subject, otp) => {
  try {
    const apiInstance = new Brevo.TransactionalEmailsApi();
    
    const apiKey = apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    
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

    sendSmtpEmail.subject = emailSubject;
    sendSmtpEmail.to = [{ email: emailTo }];
    sendSmtpEmail.sender = { 
      name: process.env.FROM_NAME || 'Job Finder', 
      email: process.env.FROM_EMAIL || 'noreply@jobfinder.com' 
    };
    sendSmtpEmail.htmlContent = emailHtml;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent successfully to', emailTo);
  } catch (error) {
    console.error('❌ Email failed:', error?.response?.body || error.message);
  }
};

module.exports = sendEmail;