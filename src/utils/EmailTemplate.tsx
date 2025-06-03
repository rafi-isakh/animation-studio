interface EmailTemplateProps {
  email: string
  staffEmail?: string
  message?: string
  nickname?: string
  subject?: string
  language?: string
}

export function EmailTemplateToStaff({ email, staffEmail }: EmailTemplateProps) {
  return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Toonyz BookTok Creator Campaign Join Request</title>
        </head>
        <body style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; padding: 20px;">
          <div style="max-width: 560px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #111827; font-size: 24px; margin-bottom: 16px;">There is a new join request for the Toonyz BookTok creator campaign</h1>
            <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
              Toonyz BookTok creator campaign has received a new join request from ${email}.
            </p>
            <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
              Please review the request and approve or reject it.
            </p>
            <p style="color: #374151; font-size: 16px; margin-bottom: 8px;">Best regards,</p>
            <p style="color: #111827; font-size: 16px; font-weight: 500;">Toonyz R&D Team</p>
          </div>
        </body>
      </html>
    `
}



export function EmailTemplateToCreator({ email }: EmailTemplateProps) {
  return `
     <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Welcome to Our Waitlist</title>
        </head>
        <body style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; padding: 20px;">
          <div style="max-width: 560px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #111827; font-size: 24px; margin-bottom: 16px;">Welcome to Our Waitlist!</h1>
            <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
              Thank you for joining our Toonyz BookTok creator campaign. We've received your email address (${email}) and will keep you updated on our progress.
            </p>
            <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
              We're working hard to create something amazing and can't wait to share it with you!
            </p>
            <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
              in the meantime, you can check out our proposal 
               <a href='https://drive.google.com/file/d/1J45SUuRXqJ1T9kvi3qN286U2YXUYEL0-/view?usp=sharing' style="text-decoration: none; color: #374151;">
                  <img src='${process.env.NEXT_PUBLIC_PICTURES_S3}/bookTok_intro.png' alt='Toonyz BookTok Creator Campaign' style="width: 100%; height: auto; border-radius: 8px;" />
                </a>
              </p>
            <p style="color: #374151; font-size: 16px; margin-bottom: 8px;">Best regards,</p>
            <p style="color: #111827; font-size: 16px; font-weight: 500;">Toonyz Team</p>
          </div>
        </body>
      </html>
    `
}




export function EmailTemplateToReport({ message, email }: EmailTemplateProps) {
  return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Toonyz Report</title>
        </head>
        <body style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; padding: 20px;">
          <div style="max-width: 560px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #111827; font-size: 24px; margin-bottom: 16px;">There is a new report</h1>
            <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
              Toonyz has received a new report
            </p>
            <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
              ${message}
            </p>
            <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
              Please review the report and take action.
            </p>
            <p style="color: #374151; font-size: 16px; margin-bottom: 8px;">Best regards,</p>
            <p style="color: #111827; font-size: 16px; font-weight: 500;">Toonyz R&D Team</p>
          </div>
        </body>
      </html>
    `
}

export function EmailTemplateToWelcome({ email, nickname, language }: EmailTemplateProps) {
  if (language === 'en') {
    return `
       <!DOCTYPE html>
      <html>
        <body
          style="margin:0;padding:0;background:#fff;font-family:Arial,sans-serif;"
        >
          <div
            style="max-width:600px;margin:30px auto;border:1px solid #eee;padding:30px 40px;"
          >
            <img src='${process.env.NEXT_PUBLIC_PICTURES_S3}/toonyz_log_with_stelli.png' width="150" height="auto" style="margin-bottom: 16px;">
            <h2 style="color:#222;font-size:18px;margin-top:32px;">
              Hi, <span> ${nickname},</span><br /> 
              Welcome to <span style="color:#DB2777;font-weight:bold;">Toonyz</span>
            </h2>
          
            <p style="margin:24px 0 0 0;line-height:1.6;">
              Thank you for joining Toonyz! <br />
              We're truly excited to have you here, ${nickname}, To celebrate your signup, we've gifted you <span style="font-weight:bold;">3 stars</span>as a welcome gift :)<br /> <br />
              
              On Toonyz, you can bring your stories to life with AI-generated illustrations and short-form content. <br /> 
              Share your creations directly on Toonyz Post!<br />
        
            </p>
            <p style="margin:24px 0 32px 0;">  Check out our tutorial video to get started with Toonyz Post.</p>
            
            <a href="https://www.youtube.com/embed/q-j_FEe5EG0?si=9j57FmjZuMAdYABF" style="display: block; margin-bottom: 16px; text-decoration: none;">
                    <img src="https://img.youtube.com/vi/q-j_FEe5EG0/maxresdefault.jpg" alt="Toonyz Post Tutorial" style="width: 100%; max-width: 560px; height: auto; border-radius: 8px;" />
            </a>
            
            <h2 style="color:#222;font-size:18px;margin-top:32px;">Check out our most popular web novels!</h2>

                  <a href="https://toonyz.com" style="display: block; margin-bottom: 16px; text-decoration: none;">
                    <img src='${process.env.NEXT_PUBLIC_PICTURES_S3}/welcome_email_thumbnails_ko.webp' alt="Toonyz web novels" style="width: 100%; max-width: 560px; height: auto; border-radius: 8px;" />
                  </a>
          
            <a
              href="https://toonyz.com"
              style="display:inline-flex;align-items: center;justify-content:center;padding:16px 32px;background:#DB2777;color:#fff;text-decoration:none;font-weight:bold;border-radius:6px;"
            >
              Go to Toonyz 
            </a>
            
            
            <div style="margin-top:48px;font-size:12px;color:#bbb;text-align:center;">
              <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
              <p>
                CEO Seoyeon Kang | 1111B S Governors Ave #23452 Dover, DE 19904, USA<br />
                Email:
                <a href="mailto:hello@stelland.io" style="color:#888;"
                  >hello@stelland.io</a
                >
              </p>
              <p>
                This email is for promotional purposes only. For inquiries, please contact our customer support.
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  if (language === 'ko') {
    return `
     <!DOCTYPE html>
      <html>
        <body
          style="margin:0;padding:0;background:#fff;font-family:Arial,sans-serif;"
        >
          <div
            style="max-width:600px;margin:30px auto;border:1px solid #eee;padding:30px 40px;"
          >
            <img src='${process.env.NEXT_PUBLIC_PICTURES_S3}/toonyz_log_with_stelli.png' width="150" height="auto" style="margin-bottom: 16px;">
            <h2 style="color:#222;font-size:18px;margin-top:32px;">
              안녕하세요. <span> ${nickname}님,</span><br /> 
              <span style="color:#DB2777;font-weight:bold;">Toonyz</span>에 오신 것을 환영합니다!
            </h2>
          
            <p style="margin:24px 0 0 0;line-height:1.6;">
              투니즈의 새로운 크리에이터가 되어주셔서 감사합니다. <br />
              ${nickname}님, 가입을 기념하여 웰컴 기프트로 <span style="font-weight:bold;">별 3개</span>를 선물로 드렸어요 :)<br /> <br />
              
              투니즈에서는 상상 속 이야기를 AI 삽화와 숏폼 콘텐츠로 직접 창작하고, 
              만든 콘텐츠를 투니즈 포스트에 공유할 수 있어요.<br />
        
            </p>
            <p style="margin:24px 0 32px 0;"> 아래의 튜토리얼 영상으로 투니즈 포스트 활용법을 먼저 확인해 보세요!</p>
            
            <a href="https://www.youtube.com/embed/q-j_FEe5EG0?si=9j57FmjZuMAdYABF" style="display: block; margin-bottom: 16px; text-decoration: none;">
                    <img src="https://img.youtube.com/vi/q-j_FEe5EG0/maxresdefault.jpg" alt="투니즈 포스트 튜토리얼" style="width: 100%; max-width: 560px; height: auto; border-radius: 8px;" />
            </a>
            
            <h2 style="color:#222;font-size:18px;margin-top:32px;">가장 인기있는 작품들을 만나보세요!</h2>

                  <a href="https://toonyz.com" style="display: block; margin-bottom: 16px; text-decoration: none;">
                    <img src='${process.env.NEXT_PUBLIC_PICTURES_S3}/welcome_email_thumbnails_ko.webp' alt="Toonyz web novels" style="width: 100%; max-width: 560px; height: auto; border-radius: 8px;" />
                  </a>
          
            <a
              href="https://toonyz.com"
              style="display:inline-flex;align-items: center;justify-content:center;padding:16px 32px;background:#DB2777;color:#fff;text-decoration:none;font-weight:bold;border-radius:6px;"
            >
              Toonyz 바로가기
            </a>
            
            
            <div style="margin-top:48px;font-size:12px;color:#bbb;text-align:center;">
              <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
              <p>
                대표자 강서연 | 사업자등록번호 221-88-02281<br />
                이메일:
                <a href="mailto:hello@stelland.io" style="color:#888;"
                  >hello@stelland.io</a
                >
                | 대표전화: (+82) 02-6952-7933
              </p>
              <p>
                본 메일은 발신전용입니다. 문의는 고객센터를 이용해주시기 바랍니다.
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  }
}
