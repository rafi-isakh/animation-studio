import nodemailer from 'nodemailer';
import { EmailTemplateToCreator, EmailTemplateToReport, EmailTemplateToWelcome } from '@/utils/EmailTemplate';
import { EmailTemplateToStaff } from '@/utils/EmailTemplate';

export async function POST(req: Request) {
    const { message, email, subject, templateType, nickname, language } = await req.json();

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    
    // Conditionally render the appropriate email template
    const emailHtml = templateType === 'staff' 
        ? EmailTemplateToStaff({ email })
        : templateType === 'creator'
        ? EmailTemplateToCreator({ email })
        : templateType === 'report'
        ? EmailTemplateToReport({ email, message })
        : templateType === 'welcome'
        ? EmailTemplateToWelcome({ email, nickname, subject, language })
        : EmailTemplateToReport({ email, message });
        
    transporter.sendMail({
        to: email,
        subject: subject || 'Report',
        text: message,
        html: emailHtml
    });
    return new Response('Email sent', { status: 200 });
}