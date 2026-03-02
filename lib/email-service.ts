// lib/email-service.ts

const API_BASE_URL = process.env.NODEMAILER_API_URL || 'http://localhost:3001/api/email'

interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
  timestamp?: string
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  lang?: string
}

interface TemplateEmailOptions {
  to: string
  templateName: string
  data: Record<string, any>
  lang?: string
}

/**
 * Dictionnaire des sujets par langue
 */
const subjectTranslations: Record<string, Record<string, string>> = {
  'welcome': {
    'fr': 'Bienvenue sur NrbTalents !',
    'en': 'Welcome to NrbTalents!',
    'es': '¡Bienvenido a NrbTalents!',
    'mg': "Tongasoa eto NrbTalents !"
  },
  'password-reset': {
    'fr': 'Réinitialisation de votre mot de passe',
    'en': 'Reset your password',
    'es': 'Restablecer tu contraseña',
    'mg': "Hanova ny tenimiafinao"
  },
  'email-verification': {
    'fr': 'Vérifiez votre email - NrbTalents',
    'en': 'Verify your email - NrbTalents',
    'es': 'Verifica tu email - NrbTalents',
    'mg': "Hamarinina ny mailakao - NrbTalents"
  },
  'project-match': {
    'fr': '✨ Un nouveau projet correspond à votre profil!',
    'en': '✨ A new project matches your profile!',
    'es': '✨ ¡Un nuevo proyecto coincide con tu perfil!',
    'mg': "✨ Tetikasa vaovao mifanaraka aminao!"
  },
  'proposal-received': {
    'fr': 'Vous avez reçu une nouvelle proposition!',
    'en': 'You received a new proposal!',
    'es': '¡Recibiste una nueva propuesta!',
    'mg': "Nahazo tolo-kevitra vaovao ianao!"
  },
  'payment-confirmation': {
    'fr': '✅ Paiement confirmé',
    'en': '✅ Payment confirmed',
    'es': '✅ Pago confirmado',
    'mg': "✅ Voamarina ny fandoavana"
  }
}

/**
 * Dictionnaire des contenus pour l'email de vérification
 */
const verificationContent: Record<string, any> = {
  'fr': {
    title: "Vérifiez votre email",
    subtitle: "Presque terminé!",
    message: "Veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :",
    button: "Vérifier mon email",
    linkText: "Ou copiez et collez ce lien dans votre navigateur :",
    expire: "Ce lien expirera dans 24 heures.",
    ignore: "Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.",
       linkOption: "Option 1: Cliquez sur le lien",
    codeOption: "Option 2: Utilisez ce code",
    codeExpires: "Ce code expire dans 10 minutes"

  },
  'en': {
    title: "Verify your email",
    subtitle: "Almost there!",
    message: "Please verify your email address by clicking the button below:",
    button: "Verify Email",
    linkText: "Or copy and paste this link in your browser:",
    expire: "This link will expire in 24 hours.",
    ignore: "If you didn't create an account, you can ignore this email.",
     linkOption: "Option 1: Click the link",
    codeOption: "Option 2: Use this code",
    codeExpires: "This code expires in 10 minutes"
  },
  'es': {
    title: "Verifica tu email",
    subtitle: "¡Casi listo!",
    message: "Por favor verifica tu email haciendo clic en el botón:",
    button: "Verificar Email",
    linkText: "O copia y pega este enlace en tu navegador:",
    expire: "Este enlace expirará en 24 horas.",
    ignore: "Si no creaste una cuenta, puedes ignorar este email.",
        linkOption: "Opción 1: Haz clic en el enlace",
    codeOption: "Opción 2: Usa este código",
    codeExpires: "Este código expira en 10 minutos"
  },
  'mg': {
    title: "Hamarinina ny mailakao",
    subtitle: "Efa saika vita!",
    message: "Hamarinino ny adiresy mailakao amin'ny fipihana ity bokotra ity:",
    button: "Hamarinina ny mailaka",
    linkText: "Na dikao ity rohy ity ary apetaho amin'ny navigateur anao:",
    expire: "Hifoka ao anatin'ny 24 ora ity rohy ity.",
    ignore: "Raha tsy namorona kaonty ianao dia tsy miraharaha ity mailaka ity.",
       linkOption: "Safidy 1: Kitiho ny rohy",
    codeOption: "Safidy 2: Ampiasao ity code ity",
    codeExpires: "Hifoka ao anatin'ny 10 minitra ity code ity"
  }
}

/**
 * Dictionnaire des versions texte pour l'email de vérification
 */
const verificationTextContent: Record<string, string> = {
  'fr': `Vérifiez votre email

Presque terminé!

Veuillez vérifier votre adresse email en visitant ce lien :
{url}

Ce lien expirera dans 24 heures.
Si vous n'avez pas créé de compte, ignorez cet email.`,
  'en': `Verify your email

Almost there!

Please verify your email by visiting:
{url}

This link expires in 24 hours.
If you didn't create an account, ignore this email.`,
  'es': `Verifica tu email

¡Casi listo!

Por favor verifica tu email visitando:
{url}

Este enlace expira en 24 horas.
Si no creaste una cuenta, ignora este email.`,
  'mg': `Hamarinina ny mailakao

Efa saika vita!

Hamarinino ny mailakao amin'ny fitsidihana ity rohy ity:
{url}

Hifoka ao anatin'ny 24 ora ity rohy ity.
Raha tsy namorona kaonty ianao dia tsy miraharaha ity mailaka ity.`
}

/**
 * Obtenir le sujet traduit
 */
function getTranslatedSubject(templateName: string, lang: string = 'fr'): string {
  const translations = subjectTranslations[templateName]
  if (!translations) return templateName
  return translations[lang] || translations['fr'] || templateName
}

/**
 * Envoie un email simple
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        lang: options.lang || 'fr'
      })
    })

    const data: EmailResponse = await response.json()
    
    if (!data.success) {
      console.error(`❌ Failed to send email (${options.lang || 'fr'}):`, data.error)
    } else {
      console.log(`✅ Email sent (${options.lang || 'fr'}):`, data.messageId)
    }
    
    return data
  } catch (error) {
    console.error(`❌ Error sending email (${options.lang || 'fr'}):`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Envoie un email basé sur un template
 */
export async function sendTemplateEmail(options: TemplateEmailOptions): Promise<EmailResponse> {
  try {
    // Ajouter automatiquement le sujet traduit si non fourni
    const dataWithSubject = {
      ...options.data,
      _subject: getTranslatedSubject(options.templateName, options.lang)
    }

    const response = await fetch(`${API_BASE_URL}/send-template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: options.to,
        templateName: options.templateName,
        data: dataWithSubject,
        lang: options.lang || 'fr'
      })
    })

    const data: EmailResponse = await response.json()
    
    if (!data.success) {
      console.error(`❌ Failed to send ${options.templateName} ${API_BASE_URL} email (${options.lang || 'fr'}):`, data.error)
    } else {
      console.log(`✅ ${options.templateName} email sent (${options.lang || 'fr'}):`, data.messageId)
    }
    
    return data
  } catch (error) {
    console.error(`❌ Error sending ${options.templateName} email (${options.lang || 'fr'}):`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Envoie un email de bienvenue (multilingue)
 */
export async function sendWelcomeEmail(
  email: string, 
  userName: string, 
  activationLink?: string,
  lang: string = 'fr'
): Promise<EmailResponse> {
  return await sendTemplateEmail({
    to: email,
    templateName: 'welcome',
    lang,
    data: {
      userName,
      activationLink,
      year: new Date().getFullYear()
    }
  })
}

/**
 * Envoie un email de réinitialisation de mot de passe (multilingue)
 */
export async function sendPasswordResetEmail(
  email: string, 
  resetUrl: string,
  lang: string = 'fr'
): Promise<EmailResponse> {
  return await sendTemplateEmail({
    to: email,
    templateName: 'password-reset',
    lang,
    data: {
      resetLink: resetUrl,
      expiryHours: 1,
      year: new Date().getFullYear()
    }
  })
}

/**
 * Envoie un email de vérification (multilingue)
/**
 * Envoie un email de vérification (multilingue) avec lien ET code
 */
export async function sendVerificationEmail(
  email: string, 
  token: string,
  code?: string,
  lang: string = 'fr'
): Promise<EmailResponse> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const verificationUrl = `${baseUrl}/${lang}/auth/verify-email?token=${token}`
  
  const c = verificationContent[lang] || verificationContent['fr']
  
  // Design avec code en grand et bien visible
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <!-- Header avec dégradé -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; color: white; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">${c.title}</h1>
      </div>
      
      <div style="padding: 40px;">
        <h2 style="color: #333; text-align: center;">${c.subtitle}</h2>
        <p style="color: #666; line-height: 1.6; text-align: center;">${c.message}</p>
        
        ${code ? `
        <!-- CODE DE VÉRIFICATION - Mise en avant -->
        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e6f0fa 100%); padding: 30px; border-radius: 16px; margin: 30px 0; border: 2px solid #667eea; box-shadow: 0 10px 25px rgba(102, 126, 234, 0.2);">
          <h2 style="color: #0369a1; margin: 0 0 10px 0; font-size: 20px; text-align: center; text-transform: uppercase; letter-spacing: 2px;">
            ⚡ CODE DE VÉRIFICATION ⚡
          </h2>
          <div style="text-align: center; margin: 25px 0;">
            <div style="background: white; padding: 20px 30px; border-radius: 16px; display: inline-block; box-shadow: 0 8px 20px rgba(0,0,0,0.15); border: 3px solid #667eea;">
              <span style="font-size: 54px; font-weight: 900; letter-spacing: 12px; color: #0369a1; font-family: 'Courier New', monospace; background: #f0f9ff; padding: 10px 20px; border-radius: 12px;">
                ${code}
              </span>
            </div>
          </div>
          <p style="color: #0369a1; font-size: 16px; text-align: center; font-weight: bold; margin: 15px 0 0 0;">
            ⏱️ Expire dans 10 minutes
          </p>
        </div>
        
        <!-- Séparateur "OU" -->
        <div style="text-align: center; margin: 20px 0; position: relative;">
          <span style="background: #e5e7eb; padding: 8px 20px; border-radius: 30px; color: #4b5563; font-weight: bold; font-size: 14px;">
            OU
          </span>
        </div>
        ` : ''}
        
        <!-- OPTION LIEN (toujours disponible) -->
        <div style="background: #f8f9fa; padding: 30px; border-radius: 12px; text-align: center; border: 1px solid #e5e7eb;">
          <h3 style="color: #4a5568; margin: 0 0 15px 0;">🔗 Cliquez sur le lien ci-dessous</h3>
          <a href="${verificationUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 10px 0;">
            ${c.button}
          </a>
          <p style="color: #666; font-size: 13px; margin: 15px 0 0 0;">
            <small>Ce lien expirera dans 24 heures</small>
          </p>
        </div>
        
        <!-- Footer identique -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #999; font-size: 12px;">
            ${c.expire}<br>
            ${c.ignore}
          </p>
        </div>
      </div>
    </div>
  `

  // Version texte améliorée
  let text = (verificationTextContent[lang] || verificationTextContent['fr']).replace('{url}', verificationUrl)
  
  if (code) {
    text = `🔐 CODE DE VÉRIFICATION : ${code}\n\nCe code expire dans 10 minutes.\n\n---\n\n${text}`
  }

  return await sendEmail({
    to: email,
    subject: getTranslatedSubject('email-verification', lang),
    html,
    text,
    lang
  })
}

/**
 * Envoie un email de notification de projet (multilingue)
 */
export async function sendProjectMatchEmail(
  email: string,
  projectData: {
    title: string
    description: string
    budgetMin: number
    budgetMax: number
    currency: string
    deadline: string
    skills: string[]
    link: string
    hoursToApply: number
  },
  userName: string,
  lang: string = 'fr'
): Promise<EmailResponse> {
  return await sendTemplateEmail({
    to: email,
    templateName: 'project-match',
    lang,
    data: {
      userName,
      projectTitle: projectData.title,
      projectDescription: projectData.description,
      projectBudgetMin: projectData.budgetMin,
      projectBudgetMax: projectData.budgetMax,
      projectCurrency: projectData.currency,
      projectDeadline: projectData.deadline,
      projectSkills: projectData.skills.join(', '),
      projectLink: projectData.link,
      hoursToApply: projectData.hoursToApply,
      year: new Date().getFullYear()
    }
  })
}

/**
 * Envoie un email de proposition reçue (multilingue)
 */
export async function sendProposalReceivedEmail(
  email: string,
  proposalData: {
    projectTitle: string
    proposerName: string
    proposalMessage: string
    proposalBudget: number
    projectCurrency: string
    proposalDuration: string
    proposerRating: number
    proposerReviews: number
    link: string
  },
  lang: string = 'fr'
): Promise<EmailResponse> {
  return await sendTemplateEmail({
    to: email,
    templateName: 'proposal-received',
    lang,
    data: {
      projectTitle: proposalData.projectTitle,
      proposerName: proposalData.proposerName,
      proposalMessage: proposalData.proposalMessage,
      proposalBudget: proposalData.proposalBudget,
      projectCurrency: proposalData.projectCurrency,
      proposalDuration: proposalData.proposalDuration,
      proposerRating: proposalData.proposerRating.toFixed(1),
      proposerReviews: proposalData.proposerReviews,
      proposalLink: proposalData.link,
      year: new Date().getFullYear()
    }
  })
}

/**
 * Envoie un email de confirmation de paiement (multilingue)
 */
export async function sendPaymentConfirmationEmail(
  email: string,
  paymentData: {
    userName: string
    transactionId: string
    amount: number
    currency: string
    description: string
    date: string
    dashboardLink: string
  },
  lang: string = 'fr'
): Promise<EmailResponse> {
  return await sendTemplateEmail({
    to: email,
    templateName: 'payment-confirmation',
    lang,
    data: {
      userName: paymentData.userName,
      transactionId: paymentData.transactionId,
      amount: paymentData.amount.toFixed(2),
      currency: paymentData.currency,
      description: paymentData.description,
      paymentDate: new Date(paymentData.date).toLocaleDateString('fr-FR'),
      dashboardLink: paymentData.dashboardLink,
      year: new Date().getFullYear()
    }
  })
}

/**
 * Vérifie la connexion au service d'email
 */
export async function verifyEmailService(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/verify`)
    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('❌ Email service verification failed:', error)
    return false
  }
}

/**
 * Récupère la liste des langues supportées
 */
export function getSupportedLanguages(): Array<{ code: string; name: string }> {
  return [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'mg', name: 'Malagasy' }
  ]
}