// app/api/auth/verify-code/route.ts
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { User } from "@/lib/models/user"

export async function POST(request: Request) {
  try {
    const { email, code, lang = 'fr' } = await request.json()

    const messages = {
      'fr': {
        missingFields: "Email et code requis",
        invalidCode: "Code invalide ou expiré",
        userNotFound: "Utilisateur non trouvé",
        alreadyVerified: "Email déjà vérifié",
        success: "Email vérifié avec succès!"
      },
      'en': {
        missingFields: "Email and code required",
        invalidCode: "Invalid or expired code",
        userNotFound: "User not found",
        alreadyVerified: "Email already verified",
        success: "Email verified successfully!"
      },
      'es': {
        missingFields: "Email y código requeridos",
        invalidCode: "Código inválido o expirado",
        userNotFound: "Usuario no encontrado",
        alreadyVerified: "Email ya verificado",
        success: "¡Email verificado con éxito!"
      },
      'mg': {
        missingFields: "Ilaina ny mailaka sy ny code",
        invalidCode: "Code tsy mety na efa lany daty",
        userNotFound: "Tsy hita ny mpampiasa",
        alreadyVerified: "Efa voamarina ny mailaka",
        success: "Soa! Voamarina ny mailakao!"
      }
    }

    const t = messages[lang as keyof typeof messages] || messages['fr']

    if (!email || !code) {
      return NextResponse.json({ error: t.missingFields }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Chercher l'utilisateur avec ce code de vérification
    const user = await db.collection<User>("users").findOne({
      email,
      verificationCode: code,
      verificationCodeExpiry: { $gt: new Date() }
    })

    if (!user) {
      return NextResponse.json({ error: t.invalidCode }, { status: 400 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ 
        message: t.alreadyVerified,
        email: user.email
      })
    }

    // Mettre à jour l'utilisateur
    await db.collection<User>("users").updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerified: new Date(),
          updatedAt: new Date()
        },
        $unset: {
          verificationCode: "",
          verificationCodeExpiry: ""
        }
      }
    )

    return NextResponse.json({ 
      success: true,
      message: t.success,
      email: user.email
    })

  } catch (error) {
    console.error("Verify code error:", error)
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }
}