import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  // host: process.env.SMTP_SERVER_HOST,
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendMail({ email, sendTo, subject, text, html }: { email: string, sendTo: string, subject: string, text: string, html: string }) {
  try {
    await transporter.verify();
    const info = await transporter.sendMail({
      from: email,
      to: sendTo || 'by.kangdami@gmail.com', // process.env.SITE_MAIL_RECEIVER
      subject,
      text,
      html: html || '',
    });
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    return null;
  }
}