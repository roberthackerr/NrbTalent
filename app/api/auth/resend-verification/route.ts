import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { User } from "@/lib/models/user"
import crypto from "crypto"
import { sendVerificationEmail } from "@/lib/email-service"

export async function POST(request: Request) {
  try {
    const { email, lang = 'fr' } = await request.json()

    const messages = {
      'fr': {
        emailRequired: "Email requis",
        success: "Si un compte existe, un email de vérification a été envoyé",
        alreadyVerified: "Votre email est déjà vérifié",
        emailSent: "Email de vérification envoyé",
        expiresIn: "24 heures"
      },
      'en': {
        emailRequired: "Email required",
        success: "If an account exists, a verification email has been sent",
        alreadyVerified: "Your email is already verified",
        emailSent: "Verification email sent",
        expiresIn: "24 hours"
      },
      'es': {
        emailRequired: "Email requerido",
        success: "Si existe una cuenta, se ha enviado un email de verificación",
        alreadyVerified: "Tu email ya está verificado",
        emailSent: "Email de verificación enviado",
        expiresIn: "24 horas"
      },
      'mg': {
        emailRequired: "Ilaina ny mailaka",
        success: "Raha misy kaonty, nisy mailaka fanamarinana nalefa",
        alreadyVerified: "Efa voamarina ny mailakao",
        emailSent: "Nalefa ny mailaka fanamarinana",
        expiresIn: "24 ora"
      }
    }

    const t = messages[lang as keyof typeof messages] || messages['fr']

    if (!email) {
      return NextResponse.json({ error: t.emailRequired }, { status: 400 })
    }

    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne({ 
      email: email.toLowerCase().trim() 
    })

    if (!user) {
      return NextResponse.json({ message: t.success })
    }

    if (user.emailVerified) {
      return NextResponse.json({ 
        message: t.alreadyVerified,
        alreadyVerified: true
      })
    }

    const verificationToken = crypto.randomBytes(32).toString("hex")
    const tokenExpiry = new Date(Date.now() + 24 * 3600000)

    await db.collection("verificationTokens").deleteMany({
      userId: user._id,
      type: 'email_verification'
    })

    await db.collection("verificationTokens").insertOne({
      userId: user._id,
      email: user.email,
      token: verificationToken,
      type: 'email_verification',
      expiresAt: tokenExpiry,
      createdAt: new Date(),
      lang
    })

    await sendVerificationEmail(user.email, verificationToken, lang)

    await db.collection("emailLogs").insertOne({
      type: 'verification_resent',
      userId: user._id,
      email: user.email,
      lang,
      timestamp: new Date()
    })

    return NextResponse.json({ 
      message: t.emailSent,
      expiresIn: t.expiresIn
    })

  } catch (error) {
    console.error("Erreur renvoi vérification:", error)
    return NextResponse.json({ 
      message: t.success 
    })
  }
}