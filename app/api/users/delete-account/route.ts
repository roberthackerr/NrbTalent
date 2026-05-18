// app/api/users/delete-account/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// DELETE - Supprimer définitivement le compte
export async function DELETE(request: Request) {
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

    // Récupérer l'utilisateur avant suppression (pour backup)
    const user = await db.collection("users").findOne({ _id: userId })
    if (!user) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      )
    }

    // 1. Sauvegarder les données de l'utilisateur (optionnel)
    const backupData = {
      userId: userId.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      deletedAt: new Date(),
      data: user
    }

    await db.collection("deleted_users_backup").insertOne(backupData)

    // 2. Supprimer toutes les données de l'utilisateur

    // Supprimer les messages
    await db.collection("messages").deleteMany({
      $or: [
        { senderId: userId },
        { recipientId: userId }
      ]
    })

    // Supprimer les conversations
    await db.collection("conversations").deleteMany({
      participants: userId
    })

    // Supprimer les notifications
    await db.collection("notifications").deleteMany({
      userId: userId
    })

    // Supprimer les candidatures (applications)
    await db.collection("applications").deleteMany({
      $or: [
        { freelancerId: userId },
        { clientId: userId }
      ]
    })

    // Supprimer les projets (si client)
    await db.collection("projects").deleteMany({
      clientId: userId
    })

    // Supprimer les gigs (si freelance)
    await db.collection("gigs").deleteMany({
      createdBy: userId
    })

    // Supprimer les commandes
    await db.collection("orders").deleteMany({
      $or: [
        { buyerId: userId },
        { sellerId: userId }
      ]
    })

    // Supprimer les entrées de temps
    await db.collection("time_entries").deleteMany({
      userId: userId
    })

    // Supprimer les paiements
    await db.collection("payment_transactions").deleteMany({
      userId: userId
    })

    // Supprimer les abonnements
    await db.collection("user_subscriptions").deleteMany({
      userId: userId
    })

    // Supprimer des groupes
    await db.collection("group_members").deleteMany({
      userId: userId
    })

    // Supprimer les fichiers uploadés (Cloudinary serait géré séparément)

    // 3. Supprimer l'utilisateur lui-même
    const result = await db.collection("users").deleteOne({ _id: userId })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Failed to delete user" }, 
        { status: 500 }
      )
    }

    console.log(`🗑️ User account permanently deleted: ${userId}`)
    console.log(`📦 User data backed up: ${backupData._id}`)

    return NextResponse.json({
      success: true,
      message: "Account permanently deleted successfully",
      backupId: backupData._id
    })

  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}