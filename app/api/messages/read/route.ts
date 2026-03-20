import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId } = await request.json()
    
    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Marquer tous les messages non lus de cette conversation comme lus
    const result = await db.collection("messages").updateMany(
      {
        conversationId: new ObjectId(conversationId),
        receiverId: userId,
        read: false
      },
      {
        $set: {
          read: true,
          readAt: new Date()
        }
      }
    )

    // Mettre à jour le unreadCount dans la conversation
    await db.collection("conversations").updateOne(
      {
        _id: new ObjectId(conversationId),
        participants: userId
      },
      {
        $set: {
          unreadCount: 0,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({ 
      success: true, 
      modifiedCount: result.modifiedCount 
    })

  } catch (error) {
    console.error("Error marking messages as read:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}