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

    const { type, documents } = await req.json()
    const client = await clientPromise
    const db = client.db("nrbtalents")

    const verification = {
      userId: new ObjectId((session.user as any).id),
      type,
      status: "pending",
      documents: documents?.map((doc: any) => ({
        ...doc,
        uploadedAt: new Date(),
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("verifications").insertOne(verification)

    return NextResponse.json({
      success: true,
      verificationId: result.insertedId,
    })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: "Failed to submit verification" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("nrbtalents")

    const verifications = await db
      .collection("verifications")
      .find({ userId: new ObjectId((session.user as any).id) })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ verifications })
  } catch (error) {
    console.error("Get verifications error:", error)
    return NextResponse.json({ error: "Failed to get verifications" }, { status: 500 })
  }
}
