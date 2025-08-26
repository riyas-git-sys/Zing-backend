import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendWelcomeEmail = async (email, name) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to ChatApp!',
      html: `
        <h1>Welcome ${name}!</h1>
        <p>Thank you for registering with ChatApp.</p>
        <p>Start connecting with your friends now!</p>
      `
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};