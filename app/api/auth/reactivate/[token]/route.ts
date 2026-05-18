// app/api/auth/reactivate/[token]/route.ts
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    
    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const user = await usersCollection.findOne({
      reactivationToken: token,
      reactivationTokenExpiry: { $gt: new Date() },
      isDeactivated: true
    })

    if (!user) {
      return NextResponse.json(
        { error: "Lien de réactivation invalide ou expiré" },
        { status: 400 }
      )
    }

    // Réactiver le compte
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          isDeactivated: false,
          isActive: true,
          updatedAt: new Date()
        },
        $unset: {
          reactivationToken: "",
          reactivationTokenExpiry: "",
          deactivatedAt: "",
          deactivationReason: ""
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: "Compte réactivé avec succès"
    })
  } catch (error) {
    console.error("Error reactivating account:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}