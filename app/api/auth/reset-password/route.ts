// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { User } from "@/lib/models/user"
import bcrypt from "bcryptjs"
import { sendEmail } from "@/lib/email-service"

export async function POST(request: Request) {
  try {
    // 👇 DÉCLARATION À L'INTÉRIEUR DU TRY (et en premier !)
    const { token, password, lang = 'fr' } = await request.json()

    if (!token || !password) {
      const errorMessages = {
        'fr': 'Le token et le mot de passe sont requis',
        'en': 'Token and password are required',
        'es': 'El token y la contraseña son requeridos',
        'mg': 'Ilaina ny token sy ny tenimiafina'
      }
      return NextResponse.json({ 
        error: errorMessages[lang as keyof typeof errorMessages] || errorMessages['fr']
      }, { status: 400 })
    }

    if (password.length < 8) {
      const errorMessages = {
        'fr': 'Le mot de passe doit contenir au moins 8 caractères',
        'en': 'Password must be at least 8 characters long',
        'es': 'La contraseña debe tener al menos 8 caracteres',
        'mg': 'Ny tenimiafina dia tsy maintsy misy 8 litera farafahakeliny'
      }
      return NextResponse.json({ 
        error: errorMessages[lang as keyof typeof errorMessages] || errorMessages['fr']
      }, { status: 400 })
    }

    const db = await getDatabase()

    // Find valid reset request - AJOUTER UNE MARGE DE 5 MINUTES
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000) // 5 minutes de marge
    
    console.log("🔍 Recherche token:", {
      token: token.substring(0, 10) + "...",
      now: now.toISOString(),
      fiveMinutesAgo: fiveMinutesAgo.toISOString()
    })

    const resetRequest = await db.collection("passwordResets").findOne({
      token,
      expiresAt: { $gt: fiveMinutesAgo }, // 👈 MARGE DE 5 MINUTES
    })

    console.log("📦 Reset request trouvé:", resetRequest ? "Oui" : "Non")

    if (!resetRequest) {
      // Vérifier si le token existe mais est expiré (pour debug)
      const expiredToken = await db.collection("passwordResets").findOne({ token })
      if (expiredToken) {
        console.log("⏰ Token expiré:", {
          expiresAt: expiredToken.expiresAt,
          now: now
        })
      }

      const errorMessages = {
        'fr': 'Token invalide ou expiré',
        'en': 'Invalid or expired token',
        'es': 'Token inválido o expirado',
        'mg': 'Token tsy mety na efa lany daty'
      }
      return NextResponse.json({ 
        error: errorMessages[lang as keyof typeof errorMessages] || errorMessages['fr']
      }, { status: 400 })
    }

    // Get user
    const user = await db.collection<User>("users").findOne({ 
      _id: resetRequest.userId 
    })

    if (!user) {
      const errorMessages = {
        'fr': 'Utilisateur non trouvé',
        'en': 'User not found',
        'es': 'Usuario no encontrado',
        'mg': 'Tsy hita ny mpampiasa'
      }
      return NextResponse.json({ 
        error: errorMessages[lang as keyof typeof errorMessages] || errorMessages['fr']
      }, { status: 404 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user password
    const updateResult = await db.collection<User>("users").updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    )

    if (updateResult.modifiedCount === 0) {
      const errorMessages = {
        'fr': 'Échec de la mise à jour du mot de passe',
        'en': 'Failed to update password',
        'es': 'Error al actualizar la contraseña',
        'mg': 'Tsy nahomby ny fanovana ny tenimiafina'
      }
      return NextResponse.json({ 
        error: errorMessages[lang as keyof typeof errorMessages] || errorMessages['fr']
      }, { status: 500 })
    }

    // Delete used reset token
    await db.collection("passwordResets").deleteOne({ _id: resetRequest._id })

    // Delete all other reset tokens for this user
    await db.collection("passwordResets").deleteMany({ userId: user._id })

    // Send confirmation email
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const supportUrl = `${baseUrl}/${lang}/support`
      
      const emailContent = {
        'fr': {
          subject: '✅ Mot de passe modifié - NrbTalents',
          greeting: `Bonjour ${user.name || 'Utilisateur'},`,
          message: 'Votre mot de passe a été modifié avec succès.',
          warning: '⚠️ Si vous n\'avez pas effectué cette modification, veuillez contacter immédiatement notre support.',
          buttonText: 'Contacter le support'
        },
        'en': {
          subject: '✅ Password changed - NrbTalents',
          greeting: `Hello ${user.name || 'User'},`,
          message: 'Your password has been successfully changed.',
          warning: '⚠️ If you did not make this change, please contact our support immediately.',
          buttonText: 'Contact support'
        },
        'es': {
          subject: '✅ Contraseña modificada - NrbTalents',
          greeting: `Hola ${user.name || 'Usuario'},`,
          message: 'Tu contraseña ha sido modificada con éxito.',
          warning: '⚠️ Si no realizaste este cambio, contacta inmediatamente a nuestro soporte.',
          buttonText: 'Contactar soporte'
        },
        'mg': {
          subject: '✅ Voavaha ny tenimiafina - NrbTalents',
          greeting: `Salama ${user.name || 'Mpampiasa'},`,
          message: 'Soa! Voavaha soamantsara ny tenimiafinao.',
          warning: '⚠️ Raha tsy ianao no nanao izany, mifandraisa amin\'ny fanampiana izahay.',
          buttonText: 'Mifandraisa amin\'ny fanampiana'
        }
      }

      const content = emailContent[lang as keyof typeof emailContent] || emailContent['fr']

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #10b981; padding: 30px; color: white; text-align: center;">
            <h1 style="margin: 0;">✅ ${content.subject.split(' ')[1]}</h1>
          </div>
          <div style="padding: 40px;">
            <p style="color: #666; line-height: 1.6;">
              ${content.greeting}<br><br>
              ${content.message}
            </p>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin-top: 20px;">
              <p style="color: #065f46; margin: 0; font-size: 14px;">
                ${content.warning}<br><br>
                <a href="${supportUrl}" style="display: inline-block; background: #059669; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px;">
                  ${content.buttonText}
                </a>
              </p>
            </div>
          </div>
        </div>
      `

      const text = `${content.greeting}\n\n${content.message}\n\n${content.warning}\n\nSupport: ${supportUrl}`

      await sendEmail({
        to: user.email,
        subject: content.subject,
        html,
        text,
        lang
      })
    } catch (emailError) {
      console.error('❌ Failed to send confirmation email:', emailError)
    }

    // Log the password reset
    await db.collection("securityLogs").insertOne({
      type: "password_reset_completed",
      userId: user._id,
      email: user.email,
      lang,
      timestamp: new Date(),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })

    const successMessages = {
      'fr': 'Mot de passe réinitialisé avec succès',
      'en': 'Password reset successfully',
      'es': 'Contraseña restablecida con éxito',
      'mg': 'Soa! Voavaha soamantsara ny tenimiafinao'
    }

    return NextResponse.json({ 
      success: true,
      message: successMessages[lang as keyof typeof successMessages] || successMessages['fr']
    })
  } catch (error) {
    console.error("❌ Reset password error:", error)
    
    // Try to get lang from error context (if available)
    let lang = 'fr'
    try {
      const requestClone = await request.clone().json()
      lang = requestClone.lang || 'fr'
    } catch {
      // Ignore, keep default 'fr'
    }

    // Log the error
    try {
      const db = await getDatabase()
      await db.collection("errorLogs").insertOne({
        type: "password_reset_error",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      })
    } catch (logError) {
      console.error("Failed to log error:", logError)
    }

    const errorMessages = {
      'fr': 'Erreur interne du serveur',
      'en': 'Internal server error',
      'es': 'Error interno del servidor',
      'mg': 'Erreur interne du serveur'
    }

    return NextResponse.json({ 
      error: errorMessages[lang as keyof typeof errorMessages] || errorMessages['fr']
    }, { status: 500 })
  }
}