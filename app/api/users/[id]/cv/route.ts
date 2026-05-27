// app/api/users/[id]/cv/route.ts
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Find user by ID or by custom id string
    let user
    try {
      user = await db.collection("users").findOne(
        { _id: new ObjectId(id) },
        { projection: { cv: 1, name: 1, role: 1 } }
      )
    } catch {
      // If not valid ObjectId, try to find by string id
      user = await db.collection("users").findOne(
        { id: id },
        { projection: { cv: 1, name: 1, role: 1 } }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Only freelancers can have CVs
    if (user.role !== 'freelance') {
      return NextResponse.json(
        { error: "This user does not have a CV" },
        { status: 404 }
      )
    }

    if (!user.cv || !user.cv.url) {
      return NextResponse.json(
        { error: "No CV available for this user" },
        { status: 404 }
      )
    }

    // Return CV info (without sensitive data)
    return NextResponse.json({
      cv: {
        url: user.cv.url,
        fileName: user.cv.fileName,
        uploadedAt: user.cv.uploadedAt,
        fileSize: user.cv.fileSize
      },
      userName: user.name
    })

  } catch (error) {
    console.error('Error fetching CV:', error)
    return NextResponse.json(
      { error: "Failed to fetch CV" },
      { status: 500 }
    )
  }
}