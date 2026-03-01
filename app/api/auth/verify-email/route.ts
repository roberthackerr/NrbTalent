// app/api/auth/verify-email/route.ts
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { User } from "@/lib/models/user"
import { sendWelcomeEmail } from "@/lib/email-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const lang = searchParams.get('lang') || 'fr'

    const messages = {
      'fr': {
        tokenMissing: "Token de vérification manquant",
        invalidToken: "Token invalide ou expiré",
        userNotFound: "Utilisateur non trouvé",
        alreadyVerified: "Email déjà vérifié",
        success: "Email vérifié avec succès!",
        serverError: "Erreur interne du serveur",
        redirecting: "Redirection en cours..."
      },
      'en': {
        tokenMissing: "Verification token missing",
        invalidToken: "Invalid or expired token",
        userNotFound: "User not found",
        alreadyVerified: "Email already verified",
        success: "Email verified successfully!",
        serverError: "Internal server error",
        redirecting: "Redirecting..."
      },
      'es': {
        tokenMissing: "Token de verificación faltante",
        invalidToken: "Token inválido o expirado",
        userNotFound: "Usuario no encontrado",
        alreadyVerified: "Email ya verificado",
        success: "¡Email verificado con éxito!",
        serverError: "Error interno del servidor",
        redirecting: "Redirigiendo..."
      },
      'mg': {
        tokenMissing: "Token fanamarinana tsy hita",
        invalidToken: "Token tsy mety na efa lany daty",
        userNotFound: "Tsy hita ny mpampiasa",
        alreadyVerified: "Efa voamarina ny mailaka",
        success: "Soa! Voamarina ny mailakao!",
        serverError: "Erreur interne du serveur",
        redirecting: "Alefa any amin'ny..."
      }
    }

    const t = messages[lang as keyof typeof messages] || messages['fr']

    if (!token) {
      return NextResponse.json({ error: t.tokenMissing }, { status: 400 })
    }

    const db = await getDatabase()

    // ✅ SOLUTION: Ajouter une marge de 5 minutes pour éviter les problèmes de fuseau horaire
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    
    console.log("🔍 Vérification token:", {
      token: token.substring(0, 10) + "...",
      now: now.toISOString(),
      fiveMinutesAgo: fiveMinutesAgo.toISOString()
    })

    const verificationToken = await db.collection("verificationTokens").findOne({
      token,
      type: 'email_verification',
      expiresAt: { $gt: fiveMinutesAgo } // 👈 MARGE DE 5 MINUTES
    })

    if (!verificationToken) {
      // Vérifier si le token existe mais est expiré (pour debug)
      const expiredToken = await db.collection("verificationTokens").findOne({ token })
      if (expiredToken) {
        console.log("⏰ Token expiré:", {
          expiresAt: expiredToken.expiresAt,
          now: now,
          diffMinutes: (new Date(expiredToken.expiresAt).getTime() - now.getTime()) / 1000 / 60
        })
      }
      
      return NextResponse.json({ error: t.invalidToken }, { status: 400 })
    }

    const user = await db.collection<User>("users").findOne({ 
      _id: verificationToken.userId 
    })

    if (!user) {
      return NextResponse.json({ error: t.userNotFound }, { status: 404 })
    }

    if (user.emailVerified) {
      await db.collection("verificationTokens").deleteOne({ _id: verificationToken._id })
      
      return NextResponse.json({ 
        message: t.alreadyVerified,
        redirectTo: `/${lang}/onboarding`,
        email: user.email
      })
    }

    // ✅ Mettre à jour l'utilisateur
    await db.collection<User>("users").updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerified: new Date(),
          updatedAt: new Date()
        }
      }
    )

    // ✅ Supprimer les tokens utilisés
    await db.collection("verificationTokens").deleteOne({ _id: verificationToken._id })
    await db.collection("verificationTokens").deleteMany({
      userId: user._id,
      type: 'email_verification'
    })

    // ✅ Envoyer email de bienvenue
    try {
      await sendWelcomeEmail(user.email, user.name || 'Utilisateur', undefined, lang)
    } catch (emailError) {
      console.error('Erreur envoi email bienvenue:', emailError)
    }

    // ✅ Log la vérification
    await db.collection("userLogs").insertOne({
      userId: user._id,
      action: 'email_verified',
      timestamp: new Date(),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })

    return NextResponse.json({ 
      success: true,
      message: t.success,
      redirectTo: `/${lang}/onboarding`,
      email: user.email
    })

  } catch (error) {
    console.error("Erreur vérification email:", error)
    return NextResponse.json({ error: t.serverError }, { status: 500 })
  }
}