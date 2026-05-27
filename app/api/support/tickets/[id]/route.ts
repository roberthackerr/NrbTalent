// app/api/support/tickets/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// GET - Récupérer un ticket spécifique
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const ticketId = new ObjectId(id)
    
    const ticket = await db.collection("support_tickets").findOne({
      _id: ticketId
    })
    
    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      )
    }
    
    // Vérifier les permissions
    const isAdmin = session.user.role === 'admin'
    if (!isAdmin && ticket.userId.toString() !== userId.toString()) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    return NextResponse.json({ ticket })
    
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un ticket
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const { id } = await params
    const body = await request.json()
    const { status, assignedTo, resolution, message } = body
    
    if (!id) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    const ticketId = new ObjectId(id)
    const userId = new ObjectId((session.user as any).id)
    const isAdmin = session.user.role === 'admin'
    
    const ticket = await db.collection("support_tickets").findOne({
      _id: ticketId
    })
    
    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      )
    }
    
    // Vérifier les permissions
    if (!isAdmin && ticket.userId.toString() !== userId.toString()) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const updateData: any = {
      updatedAt: new Date()
    }
    
    if (status && (isAdmin || status === 'closed')) updateData.status = status
    if (assignedTo && isAdmin) updateData.assignedTo = assignedTo
    if (resolution && isAdmin) updateData.resolution = resolution
    
    if (status === 'resolved') updateData.resolvedAt = new Date()
    
    // Ajouter un message
    if (message) {
      const newMessage = {
        id: new ObjectId().toString(),
        content: message,
        isFromUser: !isAdmin,
        createdAt: new Date(),
        attachments: []
      }
      
      await db.collection("support_tickets").updateOne(
        { _id: ticketId },
        { 
          $push: { messages: newMessage },
          $set: updateData
        }
      )
    } else {
      await db.collection("support_tickets").updateOne(
        { _id: ticketId },
        { $set: updateData }
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un ticket
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    
    const result = await db.collection("support_tickets").deleteOne({
      _id: new ObjectId(id)
    })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error deleting ticket:', error)
    return NextResponse.json(
      { error: "Failed to delete ticket" },
      { status: 500 }
    )
  }
}