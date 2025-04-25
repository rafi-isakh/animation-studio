import { sendMail } from '@/lib/send_mail';
import { NextResponse } from 'next/server';


export async function POST(req: Request) {
  if (req.method === 'POST') {
    const { email = 'by.kangdami@gmail.com', nickname = 'Kangdami' } = await req.json();
    const html = `
    <html>
        <body>
        <h1>Welcome to Our Platform, ${nickname}!</h1>
        <p>We're excited to have you onboard. Get started by exploring our features!</p>
        </body>
    </html>
    `;
   
    const info = await sendMail({
      email: process.env.EMAIL_USER!,
      sendTo: email,
      subject: `Thank you for joining Toonyz ${name}!`,
      text: `Welcome, ${name}! Thanks for joining us.`,
      html,
    });
    if (info?.messageId) {
      return NextResponse.json({ message: 'Welcome email sent!' }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }
}