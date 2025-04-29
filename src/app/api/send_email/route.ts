import nodemailer from 'nodemailer';
import { EmailTemplateToCreator, EmailTemplateToStaff, EmailTemplateToReport } from '@/utils/EmailTemplate';

export async function POST(req: Request) {
    const { message, email, subject, templateType, staffEmail } = await req.json();

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
        } else if (templateType === 'Report') {
            return EmailTemplateToReport({ email, message })
        } else {
            return EmailTemplateToReport({ email, message })
        }
    }
    // Set the recipient based on template type
    const recipient = (templateType: string) => {
        if (templateType === 'staff') {
            return staffEmail
        } else if (templateType === 'Report') {
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