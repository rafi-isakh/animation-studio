import nodemailer from 'nodemailer';
import { EmailTemplateToCreator, EmailTemplateToStaff, EmailTemplateToReport, EmailTemplateToWelcome } from '@/utils/EmailTemplate';

export async function POST(req: Request) {
    const body = await req.json();
    const { message, email, subject, templateType, staffEmail } = body;
    
    // Only get nickname and language if templateType is 'welcome'
    const nickname = templateType === 'welcome' ? body.nickname : undefined;
    const language = templateType === 'welcome' ? body.language : undefined;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    
    const emailHtml = (templateType: string) => {
        if (templateType === 'staff') {
            return EmailTemplateToStaff({ email, staffEmail })
        } else if (templateType === 'creator') {
            return EmailTemplateToCreator({ email })
        } else if (templateType === 'report') {
            return EmailTemplateToReport({ email, message })
        } else if (templateType === 'welcome') {
            return EmailTemplateToWelcome({ email, nickname, subject, language })
        } else {
            return EmailTemplateToReport({ email, message })
        }
    }
    // Set the recipient based on template type
    const recipient = (templateType: string) => {
        if (templateType === 'staff') {
            return staffEmail
        } else if (templateType === 'report') {
            return staffEmail
        } else if (templateType === 'creator') {
            return email
        } else {
            return email
        }
    }
        
    await transporter.sendMail({
        from: email,
        to: recipient(templateType),
        subject: subject,
        text: message,
        html: emailHtml(templateType)
    });
    
    return new Response(JSON.stringify({ status: "OK", recipient }), { 
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}