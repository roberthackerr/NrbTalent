// app/api/users/change-password/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    // Lire le body de manière sécurisée
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json(
        { error: "Format de requête invalide" },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = body

    // Validations
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Récupérer l'utilisateur avec son mot de passe
    const user = await db.collection("users").findOne({
      _id: new ObjectId((session.user as any).id)
    })

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier si l'utilisateur a un mot de passe (compte Google)
    if (!user.password) {
      return NextResponse.json(
        { error: "Ce compte utilise Google. Les mots de passe ne sont pas gérés ici." },
        { status: 400 }
      )
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
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

    // Retourner une réponse JSON valide
    return NextResponse.json({ 
      success: true,
      message: "Mot de passe modifié avec succès!" 
    })

  } catch (error) {
    console.error("Error changing password:", error)
    
    // Retourner une erreur JSON valide
    return NextResponse.json(
      { 
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    )
  }
}