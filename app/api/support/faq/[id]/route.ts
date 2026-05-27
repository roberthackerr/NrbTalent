// app/api/support/faq/[id]/route.ts
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
    const { question, answer, category, order, active } = await request.json()
    
    const db = await getDatabase()
    
    await db.collection("faqs").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          question,
          answer,
          category,
          order,
          active,
          updatedAt: new Date()
        }
      }
    )
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error updating FAQ:', error)
    return NextResponse.json({ error: "Failed to update FAQ" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { id } = await params
    const db = await getDatabase()
    
    await db.collection("faqs").deleteOne({ _id: new ObjectId(id) })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error deleting FAQ:', error)
    return NextResponse.json({ error: "Failed to delete FAQ" }, { status: 500 })
  }
}