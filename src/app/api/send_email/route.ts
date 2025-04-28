import nodemailer from 'nodemailer';
import { EmailTemplateToCreator, EmailTemplateToReport } from '@/utils/EmailTemplate';
import { EmailTemplateToStaff } from '@/utils/EmailTemplate';

export async function POST(req: Request) {
    const { message, email, subject, templateType, staffEmail } = await req.json();

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    
    // Conditionally render the appropriate email template
    const emailHtml = templateType === 'staff' 
        ? EmailTemplateToStaff({ email, staffEmail })
        : templateType === 'creator'
        ? EmailTemplateToCreator({ email })
        : templateType === 'report'
        ? EmailTemplateToReport({ email, message })
        : EmailTemplateToReport({ email, message });
        
    // Set the recipient based on template type
    const recipient = templateType === 'staff' ? staffEmail 
                    : templateType === 'report' ? staffEmail 
                    : templateType === 'creator' ? email : email;
        
    await transporter.sendMail({
        from: email,
        to: recipient,
        subject: subject || 'Report',
        text: message,
        html: emailHtml
    });
    
    return new Response(JSON.stringify({ status: "OK", recipient }), { 
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}