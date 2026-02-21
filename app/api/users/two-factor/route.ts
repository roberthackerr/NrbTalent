import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { enabled } = await request.json()
    const db = await getDatabase()

    await db.collection("users").updateOne(
      { _id: new ObjectId((session.user as any).id) },
      { 
        $set: { 
          "preferences.twoFactorEnabled": enabled,
          updatedAt: new Date()
        } 
      }
    )

    return NextResponse.json({ message: `2FA ${enabled ? 'activé' : 'désactivé'}` })
  } catch (error) {
    console.error("Error updating 2FA:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}