// app/api/users/export-data/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// GET - Exporter toutes les données de l'utilisateur
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

    // Récupérer toutes les données de l'utilisateur
    const [
      user,
      messages,
      conversations,
      notifications,
      applications,
      projects,
      gigs,
      orders,
      timeEntries,
      payments,
      subscriptions,
      groupMemberships
    ] = await Promise.all([
      db.collection("users").findOne(
        { _id: userId },
        { projection: { password: 0 } }
      ),
      db.collection("messages").find({
        $or: [
          { senderId: userId },
          { recipientId: userId }
        ]
      }).toArray(),
      db.collection("conversations").find({
        participants: userId
      }).toArray(),
      db.collection("notifications").find({ userId }).toArray(),
      db.collection("applications").find({
        $or: [
          { freelancerId: userId },
          { clientId: userId }
        ]
      }).toArray(),
      db.collection("projects").find({ clientId: userId }).toArray(),
      db.collection("gigs").find({ createdBy: userId }).toArray(),
      db.collection("orders").find({
        $or: [
          { buyerId: userId },
          { sellerId: userId }
        ]
      }).toArray(),
      db.collection("time_entries").find({ userId }).toArray(),
      db.collection("payment_transactions").find({ userId }).toArray(),
      db.collection("user_subscriptions").find({ userId }).toArray(),
      db.collection("group_members").find({ userId }).toArray()
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        ...user,
        _id: user?._id?.toString(),
        password: undefined // Ne jamais exporter le mot de passe
      },
      statistics: {
        totalMessages: messages.length,
        totalConversations: conversations.length,
        totalNotifications: notifications.length,
        totalApplications: applications.length,
        totalProjects: projects.length,
        totalGigs: gigs.length,
        totalOrders: orders.length,
        totalTimeEntries: timeEntries.length,
        totalPayments: payments.length
      },
      messages,
      conversations,
      notifications,
      applications,
      projects,
      gigs,
      orders,
      timeEntries,
      payments,
      subscriptions,
      groupMemberships
    }

    // Nettoyer les données sensibles dans les messages
    exportData.messages = exportData.messages.map(msg => ({
      ...msg,
      _id: msg._id?.toString(),
      senderId: msg.senderId?.toString(),
      recipientId: msg.recipientId?.toString()
    }))

    // Retourner les données au format JSON
    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': 'attachment; filename="nrbtalents-data-export.json"',
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error("Error exporting user data:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}