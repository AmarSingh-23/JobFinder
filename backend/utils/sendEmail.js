const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

const sendEmail = async (options) => {
  try {

    const message = {
      from: `${process.env.FROM_NAME || 'Job Portal'} <${process.env.FROM_EMAIL || 'noreply@jobportal.com'}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || `<p>${options.message}</p>`
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent:', info.messageId);

    if (!process.env.SMTP_EMAIL) {
      console.log('📬 Preview:', nodemailer.getTestMessageUrl(info));
    }

  } catch (error) {
    console.error('❌ Email failed:', error);
  }
};

module.exports = sendEmail;