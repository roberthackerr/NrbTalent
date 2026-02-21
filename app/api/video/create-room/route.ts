import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { participantId, projectId } = await req.json()
    const client = await clientPromise
    const db = client.db("nrbtalents")

    // Generate unique room ID
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const videoCall = {
      roomId,
      participants: [new ObjectId((session.user as any).id), new ObjectId(participantId)],
      projectId: projectId ? new ObjectId(projectId) : undefined,
      startedAt: new Date(),
      status: "active",
    }

    await db.collection("video_calls").insertOne(videoCall)

    return NextResponse.json({
      success: true,
      roomId,
      roomUrl: `/video/${roomId}`,
    })
  } catch (error) {
    console.error("Create room error:", error)
    return NextResponse.json({ error: "Failed to create video room" }, { status: 500 })
  }
}
