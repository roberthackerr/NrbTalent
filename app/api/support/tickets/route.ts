// app/api/support/tickets/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// POST - Créer un nouveau ticket
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { subject, category, priority, description, attachments } = body
    
    if (!subject || !description) {
      return NextResponse.json(
        { error: "Subject and description are required" },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    
    // Récupérer les infos utilisateur
    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { name: 1, email: 1, role: 1 } }
    )
    
    const ticket = {
      ticketId: `TKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      user: {
        name: user?.name,
        email: user?.email,
        role: user?.role
      },
      subject,
      category: category || 'other',
      priority: priority || 'medium',
      status: 'open',
      description,
      attachments: attachments || [],
      messages: [],
      assignedTo: null,
      resolvedAt: null,
      resolution: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection("support_tickets").insertOne(ticket)
    
    // Envoyer une notification
    await db.collection("notifications").insertOne({
      userId,
      category: "SUPPORT",
      priority: "MEDIUM",
      title: `Ticket créé: ${subject}`,
      message: `Votre ticket ${ticket.ticketId} a été créé avec succès. Nous vous répondrons dans les plus brefs délais.`,
      actionUrl: `/support/tickets/${result.insertedId}`,
      data: {
        entityType: "support_ticket",
        action: "ticket_created",
        ticketId: result.insertedId,
        ticketNumber: ticket.ticketId
      },
      status: "UNREAD",
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    return NextResponse.json({
      success: true,
      ticket: { ...ticket, _id: result.insertedId }
    })
    
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    )
  }
}

// GET - Récupérer les tickets de l'utilisateur
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const isAdmin = session.user.role === 'admin'
    
    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    
    let query: any = {}
    
    if (!isAdmin) {
      query.userId = userId
    }
    
    if (status) query.status = status
    
    const skip = (page - 1) * limit
    
    const [tickets, total] = await Promise.all([
      db.collection("support_tickets")
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("support_tickets").countDocuments(query)
    ])
    
    return NextResponse.json({
      tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    )
  }
}