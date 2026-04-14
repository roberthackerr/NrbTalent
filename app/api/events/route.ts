// app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import type { CalendarEvent, CreateEventRequest } from '@/lib/models/event'

// Helper pour les couleurs par défaut
function getDefaultColor(type: string): string {
  const colors: Record<string, string> = {
    meeting: '#8b5cf6',    // purple
    deadline: '#ef4444',   // red
    milestone: '#10b981',  // green
    task: '#f59e0b',       // orange
    call: '#3b82f6',       // blue
    workshop: '#ec4899',   // pink
    training: '#06b6d4'    // cyan
  }
  return colors[type] || '#6b7280'
}

// POST - Créer un nouvel événement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Non authentifié' 
      }, { status: 401 })
    }

    const body = await request.json()
    const db = await getDatabase()

    // Validation des champs requis
    if (!body.title || !body.start || !body.end || !body.type) {
      return NextResponse.json({ 
        success: false, 
        error: 'Titre, dates et type sont obligatoires' 
      }, { status: 400 })
    }

    // Validation des dates
    const startDate = new Date(body.start)
    const endDate = new Date(body.end)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ 
        success: false, 
        error: 'Dates invalides' 
      }, { status: 400 })
    }

    if (endDate <= startDate) {
      return NextResponse.json({ 
        success: false, 
        error: 'La date de fin doit être après la date de début' 
      }, { status: 400 })
    }

    const userId = new ObjectId(session.user.id)

    const newEvent: Omit<CalendarEvent, '_id'> = {
      userId,
      title: body.title,
      description: body.description || '',
      start: startDate,
      end: endDate,
      type: body.type,
      status: body.status || 'scheduled',
      location: body.location || '',
      projectId: body.projectId ? new ObjectId(body.projectId) : undefined,
      taskId: body.taskId ? new ObjectId(body.taskId) : undefined,
      color: body.color || getDefaultColor(body.type),
      tags: body.tags || [],
      isAllDay: body.isAllDay || false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('events').insertOne(newEvent)
    
    const createdEvent = await db.collection('events').findOne({ 
      _id: result.insertedId 
    })

    return NextResponse.json({ 
      success: true, 
      data: createdEvent,
      message: 'Événement créé avec succès'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur lors de la création de l\'événement' 
    }, { status: 500 })
  }
}

// GET - Récupérer les événements
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Non authentifié' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const db = await getDatabase()
    
    const filter: any = {
      userId: new ObjectId(session.user.id)
    }
    
    // Filtre par période
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    if (startDate && endDate) {
      filter.start = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    } else if (startDate) {
      filter.start = { $gte: new Date(startDate) }
    } else if (endDate) {
      filter.start = { $lte: new Date(endDate) }
    }

    // Filtre par type
    const type = searchParams.get('type')
    if (type && type !== 'all') {
      filter.type = type
    }

    // Filtre par statut
    const status = searchParams.get('status')
    if (status && status !== 'all') {
      filter.status = status
    }

    // Filtre par projet
    const projectId = searchParams.get('projectId')
    if (projectId && ObjectId.isValid(projectId)) {
      filter.projectId = new ObjectId(projectId)
    }

    // Récupération des événements
    const events = await db.collection('events')
      .find(filter)
      .sort({ start: 1 })
      .toArray()

    // Transformation des ObjectId en string pour le client
    const formattedEvents = events.map(event => ({
      ...event,
      id: event._id.toString(),
      _id: event._id.toString(),
      projectId: event.projectId?.toString(),
      taskId: event.taskId?.toString(),
      userId: event.userId.toString()
    }))

    return NextResponse.json({ 
      success: true, 
      data: formattedEvents 
    })
    
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur lors de la récupération des événements' 
    }, { status: 500 })
  }
}