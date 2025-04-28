interface EmailTemplateProps {
    email: string
    message?: string
    nickname?: string
    subject?: string
    language?: string
  }
  
  export function EmailTemplateToStaff({ email }: EmailTemplateProps) {
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
            <p style="color: #374151; font-size: 16px; margin-bottom: 8px;">Best regards,</p>
            <p style="color: #111827; font-size: 16px; font-weight: 500;">Toonyz Team</p>
          </div>
        </body>
      </html>
    `
  }



    
  export function EmailTemplateToReport({ email, message }: EmailTemplateProps) {
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
              Toonyz has received a new report from ${email}.
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




    
  export function EmailTemplateToWelcome({ email, nickname, subject, language }: EmailTemplateProps) {
    if (language === 'en') {
      return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Toonyz Report</title>
        </head>
        <body style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; padding: 20px;">
          <div style="max-width: 560px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #111827; font-size: 24px; margin-bottom: 16px;">Thank you for joining Toonyz ${nickname}!</h1>
            <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
              Welcome ${nickname}!
            </p>
            <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
              ${nickname}, we are excited to have you on board!
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

  if (language === 'kr') {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Toonyz Report</title>
        </head>
        <body style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; padding: 20px;">
          <div style="max-width: 560px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #111827; font-size: 24px; margin-bottom: 16px;">Thank you for joining Toonyz ${nickname}!</h1>
          </div>
        </body>
      </html>
    `
  }
}