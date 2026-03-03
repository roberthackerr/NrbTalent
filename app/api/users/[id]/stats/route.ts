import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/user"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    
    const user = await db.collection<User>("users").findOne(
      { _id: new ObjectId(params.id) },
      { projection: { statistics: 1, name: 1, role: 1 } }
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user.statistics || {})
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}