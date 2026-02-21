// app/messages/new/route.ts
import { getDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { ObjectId } from "mongodb"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user")
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Validate if the user ID is a valid ObjectId
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
    }

    const currentUserId = (session.user as any).id
    const db = await getDatabase()

    // Check if we're trying to create a conversation with ourselves
    if (currentUserId === userId) {
      return NextResponse.json({ error: "Cannot create conversation with yourself" }, { status: 400 })
    }

    // Check if the target user exists
    const targetUser = await db.collection("users").findOne({
      _id: new ObjectId(userId)
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const allParticipants = [
      new ObjectId(currentUserId), 
      new ObjectId(userId)
    ]

    // Check if conversation already exists between these two users
    const existingConversation = await db.collection("conversations").findOne({
      participants: { 
        $all: allParticipants,
        $size: allParticipants.length
      }
    })

    if (existingConversation) {
      // Redirect to existing conversation
      return NextResponse.redirect(new URL(`/messages/${existingConversation._id}`, request.url))
    }

    // Create new conversation
    const newConversation = {
      participants: allParticipants,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: null,
      unreadCount: 0,
      // Optional: Add conversation type for direct messages
      type: "direct"
    }

    const result = await db.collection("conversations").insertOne(newConversation)

    console.log(`✅ New conversation created: ${result.insertedId}`)

    // Redirect to the new conversation
    return NextResponse.redirect(new URL(`/messages/${result.insertedId}`, request.url))

  } catch (error) {
    console.error("Error creating conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Optional: Also handle POST requests if needed
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await request.json()
    const currentUserId = (session.user as any).id

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check if target user exists
    const targetUser = await db.collection("users").findOne({
      _id: new ObjectId(userId)
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent self-conversation
    if (currentUserId === userId) {
      return NextResponse.json({ error: "Cannot create conversation with yourself" }, { status: 400 })
    }

    const allParticipants = [
      new ObjectId(currentUserId), 
      new ObjectId(userId)
    ]

    // Check for existing conversation
    const existingConversation = await db.collection("conversations").findOne({
      participants: { 
        $all: allParticipants,
        $size: allParticipants.length
      }
    })

    if (existingConversation) {
      return NextResponse.json({ 
        conversationId: existingConversation._id,
        existing: true,
        redirectUrl: `/messages/${existingConversation._id}`
      })
    }

    // Create new conversation
    const newConversation = {
      participants: allParticipants,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: null,
      unreadCount: 0,
      type: "direct"
    }

    const result = await db.collection("conversations").insertOne(newConversation)

    console.log(`✅ New conversation created via POST: ${result.insertedId}`)

    return NextResponse.json({ 
      conversationId: result.insertedId,
      existing: false,
      redirectUrl: `/messages/${result.insertedId}`,
      message: "Conversation created successfully" 
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}