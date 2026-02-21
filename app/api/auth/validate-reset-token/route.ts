import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const resetRequest = await db.collection("passwordResets").findOne({
      token,
      expiresAt: { $gt: new Date() },
    })

    if (!resetRequest) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("Validate token error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
