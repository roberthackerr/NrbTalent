// lib\sms\twilio.ts

import twilio from 'twilio'

// Pour le développement, utilisez les identifiants de test de Twilio
// Ou utilisez un service alternatif comme Vonage (Nexmo)
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhone = process.env.TWILIO_PHONE_NUMBER

const client = accountSid && authToken ? twilio(accountSid, authToken) : null

export async function sendVerificationSMS(
  phoneNumber: string,
  verificationCode: string
): Promise<void> {
  try {
    // Si Twilio n'est pas configuré, log dans la console pour le développement
    if (!client) {
      console.log(`📱 SMS à ${phoneNumber}: Votre code de vérification est ${verificationCode}`)
      console.log(`⚠️  Pour envoyer de vrais SMS, configurez Twilio dans .env.local`)
      return
    }

    const message = await client.messages.create({
      body: `Votre code de vérification Closepro est: ${verificationCode}. Valable 10 minutes.`,
      from: twilioPhone,
      to: phoneNumber
    })

    console.log('SMS envoyé avec SID:', message.sid)
  } catch (error) {
    console.error('Erreur Twilio:', error)
    throw new Error('Failed to send SMS')
  }
}

// Alternative: Service email pour la vérification téléphone (si SMS est trop cher)
export async function sendVerificationEmailFallback(
  email: string,
  phoneNumber: string,
  verificationCode: string
): Promise<void> {
  // Implémentez cette fonction si vous préférez vérifier par email
  console.log(`📧 Email à ${email}: Code de vérification pour ${phoneNumber}: ${verificationCode}`)
}