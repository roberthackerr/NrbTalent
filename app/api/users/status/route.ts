// app/api/users/status/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// GET - Vérifier le statut du compte
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { isDeactivated: 1, deactivatedAt: 1, reactivatedAt: 1 } }
    )

    if (!user) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      )
    }

    return NextResponse.json({
      isDeactivated: user.isDeactivated === true,
      deactivatedAt: user.deactivatedAt || null,
      reactivatedAt: user.reactivatedAt || null,
      status: user.isDeactivated ? "deactivated" : "active"
    })

  } catch (error) {
    console.error("Error checking account status:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}