// lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'NRB Talents <onboarding@resend.dev>',
      to: email,
      subject: 'Reset Your Password - NRB Talents',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>NRB Talents</h1>
              <p>Password Reset Request</p>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>You requested to reset your password for your NRB Talents account.</p>
              <p>Click the button below to create a new password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>

              <p>This link will expire in 1 hour for security reasons.</p>
              
              <p>If you didn't request this reset, please ignore this email.</p>
              
              <div class="footer">
                <p>Best regards,<br>The NRB Talents Team</p>
                <p><small>If the button doesn't work, copy and paste this link in your browser:<br>${resetUrl}</small></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request - NRB Talents
        
        Hello!
        
        You requested to reset your password for your NRB Talents account.
        
        Click this link to reset your password: ${resetUrl}
        
        This link will expire in 1 hour for security reasons.
        
        If you didn't request this reset, please ignore this email.
        
        Best regards,
        The NRB Talents Team
      `
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    console.log('Password reset email sent:', data?.id)
    return data
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}