import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    const { message } = await req.json();
    const email = 'min@stelland.io'
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    transporter.sendMail({
        from: 'noreply@toonyz.com',
        to: email,
        subject: 'Report',
        text: message,
    });
    return new Response('Email sent', { status: 200 });
}