import sgMail from '@sendgrid/mail'

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

export async function sendVerificationEmail(
  to: string,
  userName: string,
  verificationType: string,
  status: 'pending' | 'approved' | 'rejected',
  additionalInfo?: string
): Promise<void> {
  try {
    // Si SendGrid n'est pas configuré, log dans la console
    if (!SENDGRID_API_KEY) {
      console.log(`📧 Email à ${to}: Vérification ${verificationType} ${status}`)
      console.log(`⚠️  Pour envoyer de vrais emails, configurez SendGrid dans .env.local`)
      return
    }

    const subjectMap = {
      pending: `Vérification ${verificationType} en cours`,
      approved: `✅ Vérification ${verificationType} approuvée`,
      rejected: `❌ Vérification ${verificationType} rejetée`
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${subjectMap[status]}</h2>
        <p>Bonjour ${userName},</p>
        
        ${status === 'pending' ? `
          <p>Votre demande de vérification <strong>${verificationType}</strong> a été reçue.</p>
          <p>Notre équipe l'examinera dans les 24-48 heures.</p>
        ` : ''}
        
        ${status === 'approved' ? `
          <p style="color: green; font-weight: bold;">
            ✅ Félicitations ! Votre vérification ${verificationType} a été approuvée.
          </p>
          <p>Vous avez maintenant accès à toutes les fonctionnalités premium.</p>
        ` : ''}
        
        ${status === 'rejected' ? `
          <p style="color: red; font-weight: bold;">
            ❌ Votre vérification ${verificationType} a été rejetée.
          </p>
          <p>Raison : ${additionalInfo || 'Documents insuffisants'}</p>
          <p>Veuillez soumettre à nouveau vos documents.</p>
        ` : ''}
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #666;">
          Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
        </p>
      </div>
    `

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'verification@closepro.com',
      subject: subjectMap[status],
      html: htmlContent,
      text: htmlContent.replace(/<[^>]*>/g, '') // Version texte
    }

    await sgMail.send(msg)
    console.log(`Email de vérification envoyé à ${to}`)
  } catch (error) {
    console.error('Erreur SendGrid:', error)
    // Ne pas throw pour éviter de bloquer le flux principal
  }
}

// Email de bienvenue avec vérification
export async function sendWelcomeVerificationEmail(
  to: string,
  userName: string,
  verificationLink: string
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Bienvenue sur Closepro, ${userName} !</h2>
      <p>Pour commencer à utiliser toutes les fonctionnalités, veuillez vérifier votre compte.</p>
      <p>
        <a href="${verificationLink}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Vérifier mon compte
        </a>
      </p>
      <p>Ce lien expirera dans 24 heures.</p>
    </div>
  `

  await sendEmail(to, `Bienvenue sur Closepro - Vérifiez votre compte`, html)
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.log(`📧 Email à ${to}: ${subject}`)
    return
  }

  try {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@closepro.com',
      subject,
      html
    })
  } catch (error) {
    console.error('Erreur email:', error)
  }
}