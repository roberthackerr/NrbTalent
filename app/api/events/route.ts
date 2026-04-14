// app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import type { CalendarEvent, CreateEventRequest } from '@/lib/models/event'
import type { ApiResponse, EventsFilter } from './types'

// POST - Créer un nouvel événement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Non authentifié'
      }
      return NextResponse.json(response, { status: 401 })
    }

    const body: CreateEventRequest = await request.json()
    const db = await getDatabase()

    // Validation des champs requis
    if (!body.title || !body.client || !body.start || !body.end || !body.type || !body.status) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Tous les champs obligatoires doivent être remplis'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Validation des dates
    const startDate = new Date(body.start)
    const endDate = new Date(body.end)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Dates invalides'
      }
      return NextResponse.json(response, { status: 400 })
    }

    if (endDate <= startDate) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'La date de fin doit être après la date de début'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Utiliser l'ID de l'utilisateur connecté
    const userId = new ObjectId(session.user.id)

    const newEvent: CalendarEvent = {
      userId, // ✅ Maintenant on utilise le vrai userId
      title: body.title,
      description: body.description || '',
      start: startDate,
      end: endDate,
      client: body.client,
      type: body.type,
      status: body.status,
      location: body.location,
      project: body.project,
      projectId: body.projectId ? new ObjectId(body.projectId) : undefined,
      clientId: body.clientId ? new ObjectId(body.clientId) : undefined,
      recurring: body.recurring ? {
        ...body.recurring,
        endDate: body.recurring.endDate ? new Date(body.recurring.endDate) : undefined
      } : undefined,
      reminders: (body.reminders || []).map(reminder => ({
        ...reminder,
        sent: false
      })),
      color: body.color || getDefaultColor(body.type),
      tags: body.tags || [],
      isAllDay: body.isAllDay || false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection<CalendarEvent>('events').insertOne(newEvent)
    
    const createdEvent = await db.collection<CalendarEvent>('events').findOne({ 
      _id: result.insertedId 
    })

    const response: ApiResponse<CalendarEvent> = {
      success: true,
      data: createdEvent!,
      message: 'Événement créé avec succès'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: 'Erreur lors de la création de l\'événement'
    }
    return NextResponse.json(response, { status: 500 })
  }
}

// GET - Récupérer les événements avec filtres (aussi filtrer par userId)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Non authentifié'
      }
      return NextResponse.json(response, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const db = await getDatabase()
    
    // Construction du filtre - TOUJOURS filtrer par userId
    const filter: any = {
      userId: new ObjectId(session.user.id) // ✅ Seulement les événements de l'utilisateur connecté
    }
    
    // Filtre par date
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

    // Filtre par client
    const client = searchParams.get('client')
    if (client) {
      filter.client = { $regex: client, $options: 'i' }
    }

    // Filtre par projet
    const projectId = searchParams.get('projectId')
    if (projectId) {
      filter.projectId = new ObjectId(projectId)
    }

    // Récupération des événements
    const events = await db
      .collection<CalendarEvent>('events')
      .find(filter)
      .sort({ start: 1 })
      .toArray()

    const response: ApiResponse<CalendarEvent[]> = {
      success: true,
      data: events
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching events:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: 'Erreur lors de la récupération des événements'
    }
    return NextResponse.json(response, { status: 500 })
  }
}

// Fonction utilitaire pour les couleurs par défaut
function getDefaultColor(type: string): string {
  const colors: { [key: string]: string } = {
    meeting: '#3b82f6',    // blue
    call: '#10b981',       // green
    project: '#8b5cf6',    // purple
    delivery: '#f59e0b',   // orange
    workshop: '#ef4444',   // red
    training: '#06b6d4'    // cyan
  }
  return colors[type] || '#6b7280' // gray par défaut
}