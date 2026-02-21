import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/user"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const isOwnProfile = session?.user && (session.user as any).id === params.id
    
    const db = await getDatabase()
    
    const projection = isOwnProfile 
      ? { password: 0 }
      : { 
          password: 0,
          email: 0,
          phone: 0,
          preferences: 0,
          statistics: 0,
          enrolledCourses: 0,
          savedProjects: 0
        }

    const user = await db.collection<User>("users").findOne(
      { _id: new ObjectId(params.id) },
      { projection }
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).id !== params.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await request.json()
    const db = await getDatabase()

    const restrictedFields = ['password', 'email', '_id', 'role', 'verified', 'createdAt']
    restrictedFields.forEach(field => delete updates[field])

    const result = await db.collection<User>("users").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "User updated successfully" })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}