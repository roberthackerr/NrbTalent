// app/api/users/change-password/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import { notificationService } from "@/services/notificationService"

// Messages d'erreur multilingues
const errorMessages = {
  fr: {
    unauthorized: "Non autorisé",
    invalidFormat: "Format de requête invalide",
    missingFields: "Tous les champs sont requis",
    passwordTooShort: "Le mot de passe doit contenir au moins 8 caractères",
    userNotFound: "Utilisateur non trouvé",
    googleAccount: "Ce compte utilise Google. Les mots de passe ne sont pas gérés ici.",
    currentPasswordIncorrect: "Mot de passe actuel incorrect",
    serverError: "Erreur serveur",
    success: "Mot de passe modifié avec succès!"
  },
  en: {
    unauthorized: "Unauthorized",
    invalidFormat: "Invalid request format",
    missingFields: "All fields are required",
    passwordTooShort: "Password must be at least 8 characters",
    userNotFound: "User not found",
    googleAccount: "This account uses Google. Passwords are not managed here.",
    currentPasswordIncorrect: "Current password is incorrect",
    serverError: "Server error",
    success: "Password changed successfully!"
  },
  mg: {
    unauthorized: "Tsy nahazo alalana",
    invalidFormat: "Endrika fangatahana tsy mety",
    missingFields: "Ny saha rehetra dia ilaina",
    passwordTooShort: "Ny tenimiafina dia tsy maintsy misy 8 tarehintsoratra farafahakeliny",
    userNotFound: "Tsy hita ny mpampiasa",
    googleAccount: "Ity kaonty ity dia mampiasa Google. Ny tenimiafina dia tsy tantanina eto.",
    currentPasswordIncorrect: "Ny tenimiafina ankehitriny dia diso",
    serverError: "Hadisoana anatiny",
    success: "Nova soa aman-tsara ny tenimiafina!"
  }
}

// Détecter la langue
function getLanguageFromRequest(request: Request): 'fr' | 'en' | 'mg' {
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage?.startsWith('fr')) return 'fr'
  if (acceptLanguage?.startsWith('mg')) return 'mg'
  return 'en'
}

export async function POST(request: Request) {
  try {
    const lang = getLanguageFromRequest(request)
    const messages = errorMessages[lang]

    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: messages.unauthorized },
        { status: 401 }
      )
    }

    // Lire le body de manière sécurisée
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json(
        { error: messages.invalidFormat },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = body

    // Validations
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: messages.missingFields },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: messages.passwordTooShort },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Récupérer l'utilisateur avec son mot de passe
    let userId
    try {
      userId = new ObjectId((session.user as any).id)
    } catch {
      const userByEmail = await db.collection("users").findOne({
        email: session.user.email
      })
      if (!userByEmail) {
        return NextResponse.json(
          { error: messages.userNotFound },
          { status: 404 }
        )
      }
      userId = userByEmail._id
    }

    const user = await db.collection("users").findOne({ _id: userId })

    if (!user) {
      return NextResponse.json(
        { error: messages.userNotFound },
        { status: 404 }
      )
    }

    // Vérifier si l'utilisateur a un mot de passe (compte Google)
    if (!user.password) {
      return NextResponse.json(
        { error: messages.googleAccount },
        { status: 400 }
      )
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: messages.currentPasswordIncorrect },
        { status: 400 }
      )
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Mettre à jour le mot de passe
    await db.collection("users").updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        } 
      }
    )

    // ──────────────────────────────────────────────────────────────────────────
    // 📢 ENVOYER UNE NOTIFICATION DE SÉCURITÉ
    // ──────────────────────────────────────────────────────────────────────────
    try {
      // Récupérer les informations de l'appareil depuis les headers
      const userAgent = request.headers.get('user-agent') || 'Appareil inconnu'
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'Adresse IP inconnue'
      
      // Simplifier le user-agent pour l'affichage
      let deviceType = 'Appareil inconnu'
      if (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iPod')) {
        deviceType = 'Appareil Apple'
      } else if (userAgent.includes('Android')) {
        deviceType = 'Appareil Android'
      } else if (userAgent.includes('Windows')) {
        deviceType = 'Ordinateur Windows'
      } else if (userAgent.includes('Mac')) {
        deviceType = 'Mac'
      } else if (userAgent.includes('Linux')) {
        deviceType = 'Linux'
      }

      // Envoyer la notification de changement de mot de passe
      await notificationService.sendPasswordChanged(user._id.toString())

      // Optionnel: Envoyer une notification supplémentaire avec plus de détails
      // pour une meilleure sécurité
      await notificationService.send({
        userId: user._id.toString(),
        category: 'SECURITY',
        priority: 'HIGH',
        title: lang === 'fr' ? '🔐 Mot de passe modifié' :
               lang === 'mg' ? '🔐 Tenimiafina nohavaozina' :
               '🔐 Password changed',
        message: lang === 'fr' 
          ? `Votre mot de passe a été modifié depuis ${deviceType} (${ip})`
          : lang === 'mg'
            ? `Nohavaozina ny tenimiafinao avy amin'ny ${deviceType} (${ip})`
            : `Your password was changed from ${deviceType} (${ip})`,
        actionUrl: '/dashboard/settings',
        data: {
          action: 'password_changed',
          device: deviceType,
          ip: ip,
          userAgent: userAgent,
          timestamp: new Date().toISOString()
        }
      })

      console.log('✅ Password change notification sent to user:', user._id)

    } catch (notifError) {
      // Ne pas bloquer le changement de mot de passe si la notification échoue
      console.error('⚠️ Failed to send password change notification:', notifError)
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 🔔 NOTIFICATION PUSH (optionnelle)
    // ──────────────────────────────────────────────────────────────────────────
    try {
      // Vérifier si l'utilisateur a activé les notifications push pour la sécurité
      const userPrefs = await db.collection("users").findOne(
        { _id: user._id },
        { projection: { notificationPreferences: 1 } }
      )

      const securityPushEnabled = userPrefs?.notificationPreferences?.['security-login'] !== false

      if (securityPushEnabled) {
        // Si vous avez un service de push notifications (OneSignal, Firebase, etc.)
        // await sendPushNotification({
        //   userId: user._id.toString(),
        //   title: '🔐 Sécurité - Mot de passe modifié',
        //   body: `Votre mot de passe a été modifié depuis ${deviceType}`,
        //   data: { type: 'password_changed' }
        // })
        console.log('📱 Push notification would be sent (if configured)')
      }
    } catch (pushError) {
      console.error('⚠️ Failed to send push notification:', pushError)
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 📧 NOTIFICATION EMAIL (optionnelle)
    // ──────────────────────────────────────────────────────────────────────────
    // if (user.email) {
    //   await sendEmail({
    //     to: user.email,
    //     subject: '🔐 Votre mot de passe a été modifié',
    //     template: 'password-changed',
    //     data: {
    //       name: user.name,
    //       device: deviceType,
    //       ip: ip,
    //       date: new Date().toLocaleDateString(),
    //       time: new Date().toLocaleTimeString()
    //     }
    //   })
    // }

    return NextResponse.json({ 
      success: true,
      message: messages.success 
    })

  } catch (error) {
    console.error("Error changing password:", error)
    
    const lang = getLanguageFromRequest(request)
    const messages = errorMessages[lang]
    
    return NextResponse.json(
      { 
        error: messages.serverError,
        details: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    )
  }
}