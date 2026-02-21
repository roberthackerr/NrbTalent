import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { User } from "@/lib/models/user"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const db = await getDatabase()

    // Find valid reset request
    const resetRequest = await db.collection("passwordResets").findOne({
      token,
      expiresAt: { $gt: new Date() },
    })

    if (!resetRequest) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user password
    await db.collection<User>("users").updateOne(
      { _id: resetRequest.userId },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      },
    )

    // Delete used reset token
    await db.collection("passwordResets").deleteOne({ _id: resetRequest._id })

    // Delete all other reset tokens for this user
    await db.collection("passwordResets").deleteMany({ userId: resetRequest.userId })

    return NextResponse.json({ message: "Password reset successfully" })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
