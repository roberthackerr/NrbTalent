// app/api/events/route.ts (CORRIGÉ)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// Types
interface CalendarEvent {
  _id?: ObjectId
  userId: ObjectId
  title: string
  description?: string
  start: Date
  end: Date
  type: 'meeting' | 'deadline' | 'milestone' | 'task'
  status: 'scheduled' | 'completed' | 'cancelled'
  location?: string
  projectId?: ObjectId
  taskId?: ObjectId
  color?: string
  tags?: string[]
  isAllDay?: boolean
  createdAt: Date
  updatedAt: Date
}

interface CreateEventRequest {
  title: string
  description?: string
  start: Date
  end: Date
  type: 'meeting' | 'deadline' | 'milestone' | 'task'
  status?: 'scheduled' | 'completed' | 'cancelled'
  location?: string
  projectId?: string
  taskId?: string
  color?: string
  tags?: string[]
  isAllDay?: boolean
}

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

    // Validation des champs requis (supprimer 'client' qui n'est pas nécessaire)
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
    
    // Gérer projectId si présent
    let projectId = undefined
    if (body.projectId) {
      try {
        projectId = new ObjectId(body.projectId)
      } catch (error) {
        return NextResponse.json({ 
          success: false, 
          error: 'ID de projet invalide' 
        }, { status: 400 })
      }
    }

    // Gérer taskId si présent
    let taskId = undefined
    if (body.taskId) {
      try {
        taskId = new ObjectId(body.taskId)
      } catch (error) {
        return NextResponse.json({ 
          success: false, 
          error: 'ID de tâche invalide' 
        }, { status: 400 })
      }
    }

    const newEvent: CalendarEvent = {
      userId,
      title: body.title,
      description: body.description || '',
      start: startDate,
      end: endDate,
      type: body.type,
      status: body.status || 'scheduled',
      location: body.location || '',
      projectId,
      taskId,
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

    // Formater la réponse
    const formattedEvent = {
      id: createdEvent._id.toString(),
      userId: createdEvent.userId.toString(),
      title: createdEvent.title,
      description: createdEvent.description,
      start: createdEvent.start.toISOString(),
      end: createdEvent.end.toISOString(),
      type: createdEvent.type,
      status: createdEvent.status,
      location: createdEvent.location,
      projectId: createdEvent.projectId?.toString(),
      taskId: createdEvent.taskId?.toString(),
      color: createdEvent.color,
      tags: createdEvent.tags,
      isAllDay: createdEvent.isAllDay,
      createdAt: createdEvent.createdAt.toISOString(),
      updatedAt: createdEvent.updatedAt.toISOString()
    }

    return NextResponse.json({ 
      success: true, 
      data: formattedEvent,
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

    const events = await db.collection('events')
      .find(filter)
      .sort({ start: 1 })
      .toArray()

    const formattedEvents = events.map(event => ({
      id: event._id.toString(),
      userId: event.userId.toString(),
      title: event.title,
      description: event.description,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      type: event.type,
      status: event.status,
      location: event.location,
      projectId: event.projectId?.toString(),
      taskId: event.taskId?.toString(),
      color: event.color,
      tags: event.tags,
      isAllDay: event.isAllDay,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString()
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