const API_BASE_URL = process.env.NODEMAILER_API_URL || 'http://localhost:3001/api/email'

interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
  timestamp?: string
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/email/send-template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        templateName: 'password-reset',
        data: {
          resetLink: resetUrl
        }
      })
    })

    const data: EmailResponse = await response.json()
    
    if (!data.success) {
      console.error('Failed to send reset email:', data.error)
      // Ne pas throw pour éviter l'énumération d'emails
    }
  } catch (error) {
    console.error('Error sending reset email:', error)
    // Ne pas throw - l'utilisateur ne doit pas savoir si l'email a échoué
  }
}

export async function sendWelcomeEmail(email: string, userName: string, activationLink?: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/send-template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        templateName: 'welcome',
        data: {
          userName,
          activationLink
        }
      })
    })
  } catch (error) {
    console.error('Error sending welcome email:', error)
  }
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  try {
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`
    
    await fetch(`${API_BASE_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: 'Verify your email - NrbTalents',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; color: white; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">Verify Your Email</h1>
            </div>
            <div style="padding: 40px;">
              <h2 style="color: #333;">Almost there!</h2>
              <p style="color: #666; line-height: 1.6;">
                Please verify your email address by clicking the button below:
              </p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="${verificationUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Verify Email Address
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                Or copy and paste this link in your browser:<br>
                <code style="background: #f5f5f5; padding: 5px 10px; border-radius: 3px; font-size: 12px;">
                  ${verificationUrl}
                </code>
              </p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #666; font-size: 12px;">
                  This link will expire in 24 hours.<br>
                  If you didn't create an account, you can safely ignore this email.
                </p>
              </div>
            </div>
          </div>
        `,
        text: `Please verify your email by visiting: ${verificationUrl}`
      })
    })
  } catch (error) {
    console.error('Error sending verification email:', error)
  }
}