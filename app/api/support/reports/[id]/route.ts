// app/api/support/reports/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { id } = await params
    const { status, resolution } = await request.json()
    
    const db = await getDatabase()
    
    const updateData: any = {
      status,
      updatedAt: new Date()
    }
    
    if (status === 'resolved') {
      updateData.resolvedAt = new Date()
      if (resolution) updateData.resolution = resolution
    }
    
    await db.collection("problem_reports").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error updating report:', error)
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 })
  }
}