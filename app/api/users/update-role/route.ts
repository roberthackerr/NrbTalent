// app/api/users/update-role/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { role, onboardingCompleted = true } = await request.json()

    if (!role || (role !== "freelance" && role !== "client")) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    const result = await db.collection("users").updateOne(
      { _id: userId },
      { 
        $set: { 
          role: role,
          onboardingCompleted: onboardingCompleted,
          updatedAt: new Date()
        } 
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      message: "Profil mis à jour avec succès",
      role: role,
      onboardingCompleted: onboardingCompleted
    })

  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ 
      error: "Erreur interne du serveur" 
    }, { status: 500 })
  }
}