// app/api/users/two-factor/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { authenticator } from "otplib"
import QRCode from "qrcode"

// Configuration de TOTP
authenticator.options = {
  window: 1,
  step: 30
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { twoFactorSecret: 1, twoFactorEnabled: 1, twoFactorVerified: 1, email: 1 } }
    )

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Si l'utilisateur n'a pas encore de secret, en générer un
    if (!user.twoFactorSecret) {
      const secret = authenticator.generateSecret()
      
      await db.collection("users").updateOne(
        { _id: userId },
        { 
          $set: { 
            twoFactorSecret: secret,
            twoFactorVerified: false, // 👈 AJOUTER
            updatedAt: new Date()
          } 
        }
      )

      // Générer le QR code
      const otpauth = authenticator.keyuri(user.email || "user", "NRBTalents", secret)
      const qrCode = await QRCode.toDataURL(otpauth)

      return NextResponse.json({
        secret: secret,
        qrCode: qrCode,
        enabled: false,
        verified: false, // 👈 AJOUTER
        message: "Secret généré. Scannez le QR code avec votre application d'authentification."
      })
    }

    // Si l'utilisateur a déjà un secret mais n'a pas encore activé le 2FA
    if (user.twoFactorSecret && !user.twoFactorEnabled) {
      const otpauth = authenticator.keyuri(user.email || "user", "NRBTalents", user.twoFactorSecret)
      const qrCode = await QRCode.toDataURL(otpauth)

      return NextResponse.json({
        secret: user.twoFactorSecret,
        qrCode: qrCode,
        enabled: false,
        verified: user.twoFactorVerified || false, // 👈 AJOUTER
        message: user.twoFactorVerified ? "Secret vérifié, prêt à activer" : "Secret généré, en attente de vérification"
      })
    }

    return NextResponse.json({
      enabled: user.twoFactorEnabled,
      verified: true,
      message: user.twoFactorEnabled ? "2FA activé" : "2FA non configuré"
    })

  } catch (error) {
    console.error("Erreur récupération 2FA:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { enabled, token, action } = await request.json()
    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { twoFactorSecret: 1, twoFactorEnabled: 1, twoFactorVerified: 1, email: 1 } }
    )

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Action: verify (vérifier le token)
    if (action === "verify") {
      if (!user.twoFactorSecret) {
        return NextResponse.json({ error: "Secret 2FA non configuré" }, { status: 400 })
      }

      if (!token) {
        return NextResponse.json({ error: "Token requis" }, { status: 400 })
      }

      const isValid = authenticator.verify({
        token,
        secret: user.twoFactorSecret
      })

      if (!isValid) {
        return NextResponse.json({ 
          error: "Token invalide", 
          valid: false 
        }, { status: 400 })
      }

      // Marquer le 2FA comme vérifié
      await db.collection("users").updateOne(
        { _id: userId },
        { 
          $set: { 
            twoFactorVerified: true,
            updatedAt: new Date()
          } 
        }
      )

      return NextResponse.json({ 
        valid: true,
        message: "Token vérifié avec succès"
      })
    }

    // Action: enable/disable
    if (action === "toggle") {
      if (enabled === true) {
        // Vérifier si le 2FA a été vérifié avant d'activer
        if (!user.twoFactorVerified) {
          return NextResponse.json({ 
            error: "Veuillez d'abord vérifier votre token 2FA" 
          }, { status: 400 })
        }

        await db.collection("users").updateOne(
          { _id: userId },
          { 
            $set: { 
              twoFactorEnabled: true,
              updatedAt: new Date()
            } 
          }
        )

        // Créer une notification
        await db.collection("notifications").insertOne({
          userId: userId.toString(),
          category: "SECURITY",
          priority: "HIGH",
          title: "🔐 Authentification 2FA activée",
          message: "L'authentification à deux facteurs a été activée sur votre compte",
          data: {
            entityType: "security",
            action: "2fa_enabled",
            timestamp: new Date().toISOString()
          },
          status: "UNREAD",
          createdAt: new Date(),
          updatedAt: new Date()
        })

        return NextResponse.json({ 
          enabled: true,
          message: "2FA activé avec succès"
        })
      } else {
        // Désactivation du 2FA
        await db.collection("users").updateOne(
          { _id: userId },
          { 
            $set: { 
              twoFactorEnabled: false,
              twoFactorVerified: false, // 👈 RÉINITIALISER
              updatedAt: new Date()
            } 
          }
        )

        return NextResponse.json({ 
          enabled: false,
          message: "2FA désactivé avec succès"
        })
      }
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 })

  } catch (error) {
    console.error("Erreur configuration 2FA:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}