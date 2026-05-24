const nodemailer = require('nodemailer');

let transporter;

const createTransporter = async () => {
  if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      }
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
};

const sendEmail = async (options) => {
  try {
    if (!transporter) {
      transporter = await createTransporter();
    }

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