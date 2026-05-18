// app/api/users/deactivate/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// POST - Désactiver temporairement le compte
export async function POST(request: Request) {
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

    // Vérifier que l'utilisateur existe
    const user = await db.collection("users").findOne({ _id: userId })
    if (!user) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      )
    }

    // Vérifier si l'utilisateur n'est pas déjà désactivé
    if (user.isDeactivated === true) {
      return NextResponse.json(
        { error: "Account is already deactivated" }, 
        { status: 400 }
      )
    }

    // Désactiver le compte
    const result = await db.collection("users").updateOne(
      { _id: userId },
      {
        $set: {
          isDeactivated: true,
          deactivatedAt: new Date(),
          deactivationReason: null,
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to deactivate account" }, 
        { status: 500 }
      )
    }

    // Notifier l'utilisateur
    await db.collection("notifications").insertOne({
      userId: userId,
      category: "SYSTEM",
      priority: "HIGH",
      title: "Compte désactivé",
      message: "Votre compte a été désactivé temporairement. Vous pouvez le réactiver à tout moment.",
      status: "UNREAD",
      createdAt: new Date(),
      updatedAt: new Date()
    })

    console.log(`✅ Account deactivated for user: ${userId}`)

    return NextResponse.json({
      success: true,
      message: "Account deactivated successfully",
      isDeactivated: true,
      deactivatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error("Error deactivating account:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}

// POST - Réactiver le compte
export async function PUT(request: Request) {
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

    // Vérifier que l'utilisateur existe
    const user = await db.collection("users").findOne({ _id: userId })
    if (!user) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      )
    }

    // Réactiver le compte
    const result = await db.collection("users").updateOne(
      { _id: userId },
      {
        $set: {
          isDeactivated: false,
          reactivatedAt: new Date(),
          updatedAt: new Date()
        },
        $unset: {
          deactivatedAt: "",
          deactivationReason: ""
        }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to reactivate account" }, 
        { status: 500 }
      )
    }

    // Notifier l'utilisateur
    await db.collection("notifications").insertOne({
      userId: userId,
      category: "SYSTEM",
      priority: "MEDIUM",
      title: "Compte réactivé",
      message: "Votre compte a été réactivé. Bienvenue à nouveau !",
      status: "UNREAD",
      createdAt: new Date(),
      updatedAt: new Date()
    })

    console.log(`✅ Account reactivated for user: ${userId}`)

    return NextResponse.json({
      success: true,
      message: "Account reactivated successfully",
      isDeactivated: false
    })

  } catch (error) {
    console.error("Error reactivating account:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}