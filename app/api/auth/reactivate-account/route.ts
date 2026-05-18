// app/api/auth/reactivate-account/route.ts
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { sendAccountReactivationEmail } from "@/lib/email-service"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const { email, lang } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const user = await usersCollection.findOne({ email })

    if (!user) {
      return NextResponse.json(
        { error: "Aucun utilisateur trouvé avec cet email" },
        { status: 404 }
      )
    }

    if (user.isDeactivated !== true) {
      return NextResponse.json(
        { error: "Ce compte n'est pas désactivé" },
        { status: 400 }
      )
    }

    // Générer un token de réactivation
    const reactivationToken = crypto.randomBytes(32).toString("hex")
    const reactivationExpiry = new Date(Date.now() + 24 * 3600000) // 24 heures

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          reactivationToken,
          reactivationTokenExpiry: reactivationExpiry,
          updatedAt: new Date()
        }
      }
    )

    // Envoyer l'email de réactivation
    await sendAccountReactivationEmail(email, reactivationToken, lang || "fr")

    return NextResponse.json({
      success: true,
      message: "Lien de réactivation envoyé"
    })
  } catch (error) {
    console.error("Error sending reactivation link:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}