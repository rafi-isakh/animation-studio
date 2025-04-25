import { sendMail } from '@/lib/send_mail';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  if (req.method === 'POST') {
    const { email, nickname } = await req.json();
    const html = `
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome Email</title>
    <style>
        /* Email-safe styles */
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .email-header {
            background-color: #DB2777;
            color: white;
            padding: 20px;
            text-align: center;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .email-body {
            padding: 20px;
        }
        .greeting {
            font-size: 22px;
            margin-bottom: 20px;
            color: #333333;
        }
        .content-cards {
            margin-bottom: 30px;
        }
        .card {
            border: 1px solid #e0e0e0;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 15px;
            background-color: #f9f9f9;
        }
        .card h3 {
            margin-top: 0;
            color: #DB2777;
        }
        .social-links {
            text-align: center;
            padding: 15px;
            background-color: #f0f0f0;
        }
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #DB2777;
            text-decoration: none;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #777777;
        }
        .button a {
            display: inline-block;
            color: #DB2777;
            background-color: #ffffff;
            border: 1px solid #DB2777;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 10px;
            font-weight: bold;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100%;
            }
            .email-header {
                padding: 15px;
            }
            .email-body {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <img src="https://toonyzbucket.s3.ap-northeast-2.amazonaws.com/logo+white.png" alt="Toonyz Logo" style="max-width: 150px;">
        </div>
        <div class="email-body">
            <div class="greeting">
                <p>Hello <span id="user-name">${nickname}</span></p>
                <p>Thank you for joining our community! We're excited to have you on board.</p>
            </div>
            
            <div class="content-cards">
                <div class="card">
                    <h3>Getting Started</h3>
                    <p>Complete your profile and explore our platform features to get the most out of your experience.</p>
                    <a href="#" class="button">Complete Profile</a>
                </div>
                
                <div class="card">
                    <h3>Discover Features</h3>
                    <p>Our platform offers a wide range of tools and resources to help you succeed.</p>
                    <a href="#" class="button">Explore Features</a>
                </div>
                
                <div class="card">
                    <h3>Community Guidelines</h3>
                    <p>Learn about our community guidelines to ensure a positive experience for everyone.</p>
                    <a href="#" class="button">Read Guidelines</a>
                </div>
            </div>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Best regards,<br>Toonyz Team</p>
        </div>
        
        <div class="social-links">
            <p>Follow us on social media:</p>
            <a href="#" class="social-link">Youtube</a>
            <a href="#" class="social-link">Twitter</a>
            <a href="#" class="social-link">Instagram</a>
            <a href="#" class="social-link">LinkedIn</a>
        </div>
        
        <div class="footer">
            <p>© 2025 Toonyz. All rights reserved.</p>
            <p>You're receiving this email because you signed up for our platform.</p>
            <p><a href="#">Unsubscribe</a> | <a href="#">Privacy Policy</a></p>
        </div>
    </div>
  </body>
  </html>
  `;
   
    const info = await sendMail({
      email: process.env.EMAIL_USER!,
      sendTo: email || 'dami@stelland.io',
      subject: `Thank you for joining Toonyz ${nickname}!`,
      text: `Welcome, ${nickname}! Thanks for joining us.`,
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