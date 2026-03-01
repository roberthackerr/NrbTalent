// app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { User } from "@/lib/models/user"
import crypto from "crypto"
import { sendPasswordResetEmail } from "@/lib/email-service"

export async function POST(request: Request) {
  try {
    const { email, lang = 'fr' } = await request.json() // 👈 Récupère la langue

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" }, 
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne({ 
      email: email.toLowerCase().trim() 
    })

    // Message de succès multilingue
    const successMessages: Record<string, string> = {
      'fr': "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé",
      'en': "If an account exists with this email, a reset link has been sent",
      'es': "Si existe una cuenta con este email, se ha enviado un enlace de restablecimiento",
      'mg': "Raha misy kaonty miaraka amin'ity mailaka ity, nisy rohy fanovana nalefa"
    }
    
    const successMessage = successMessages[lang] || successMessages['fr']
    
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email} (${lang})`)
      return NextResponse.json({ message: successMessage })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour

    // Delete any existing reset tokens for this user
    await db.collection("passwordResets").deleteMany({ 
      userId: user._id 
    })

    // Store new reset token
    await db.collection("passwordResets").insertOne({
      userId: user._id,
      email: user.email,
      token: resetToken,
      expiresAt: resetTokenExpiry,
      createdAt: new Date(),
      lang: lang, // 👈 Stocke la langue
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown'
    })

    // Create reset URL with language
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const resetUrl = `${baseUrl}/${lang}/auth/reset-password?token=${resetToken}` // 👈 URL avec langue

    // Send email with language
    await sendPasswordResetEmail(user.email, resetUrl, lang) // 👈 Passage de la langue

    // Log the request
    await db.collection("emailLogs").insertOne({
      type: "password_reset",
      userId: user._id,
      email: user.email,
      token: resetToken,
      lang: lang,
      sentAt: new Date(),
      success: true
    })

    return NextResponse.json({ message: successMessage })
  } catch (error) {
    console.error("❌ Forgot password error:", error)
    
    return NextResponse.json({ 
      message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé" 
    })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Forgot password API is running",
    method: "POST",
    languages: ["fr", "en", "es", "mg"]
  })
}