// app/api/support/chat/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// POST - Démarrer une conversation de chat
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { initialMessage } = body
    
    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    
    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { name: 1, email: 1 } }
    )
    
    const chat = {
      userId,
      user: {
        name: user?.name,
        email: user?.email
      },
      status: 'active',
      assignedAgent: null,
      messages: initialMessage ? [{
        id: new ObjectId().toString(),
        content: initialMessage,
        isFromUser: true,
        createdAt: new Date(),
        read: false
      }] : [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection("support_chats").insertOne(chat)
    
    // Notifier les agents disponibles
    await db.collection("notifications").insertOne({
      userId: null,
      category: "SUPPORT",
      priority: "HIGH",
      title: "Nouvelle demande de chat",
      message: `${user?.name} demande une assistance en direct`,
      actionUrl: `/admin/support/chats/${result.insertedId}`,
      data: {
        entityType: "support_chat",
        action: "new_chat",
        chatId: result.insertedId
      },
      status: "UNREAD",
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    return NextResponse.json({
      success: true,
      chatId: result.insertedId,
      chat
    })
    
  } catch (error) {
    console.error('Error starting chat:', error)
    return NextResponse.json(
      { error: "Failed to start chat" },
      { status: 500 }
    )
  }
}

// GET - Récupérer les messages d'un chat
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId')
    
    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    
    const chat = await db.collection("support_chats").findOne({
      _id: new ObjectId(chatId)
    })
    
    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      )
    }
    
    const isAdmin = session.user.role === 'admin'
    if (!isAdmin && chat.userId.toString() !== userId.toString()) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Marquer les messages comme lus
    if (isAdmin) {
      await db.collection("support_chats").updateOne(
        { _id: new ObjectId(chatId) },
        { 
          $set: { updatedAt: new Date() },
          $push: {
            messages: {
              $each: [],
              $position: 0
            }
          }
        }
      )
    }
    
    return NextResponse.json({
      messages: chat.messages,
      status: chat.status,
      assignedAgent: chat.assignedAgent
    })
    
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}