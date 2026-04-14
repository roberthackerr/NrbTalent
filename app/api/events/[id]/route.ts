
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import type { CalendarEvent, UpdateEventRequest } from '@/lib/models/event'
import type { ApiResponse } from '../types'

// GET - Récupérer un événement spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Non authentifié'
      }
      return NextResponse.json(response, { status: 401 })
    }

    const db = await getDatabase()
    
    if (!ObjectId.isValid(params.id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'ID d\'événement invalide'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Vérifier que l'événement appartient à l'utilisateur
    const event = await db.collection<CalendarEvent>('events').findOne({ 
      _id: new ObjectId(params.id),
      userId: new ObjectId(session.user.id) // ✅ Sécurité
    })

    if (!event) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Événement non trouvé'
      }
      return NextResponse.json(response, { status: 404 })
    }

    const response: ApiResponse<CalendarEvent> = {
      success: true,
      data: event
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching event:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: 'Erreur lors de la récupération de l\'événement'
    }
    return NextResponse.json(response, { status: 500 })
  }
}

// PUT - Mettre à jour un événement
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Non authentifié'
      }
      return NextResponse.json(response, { status: 401 })
    }

    const body: UpdateEventRequest = await request.json()
    const db = await getDatabase()

    if (!ObjectId.isValid(params.id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'ID d\'événement invalide'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Vérifier que l'événement appartient à l'utilisateur
    const event = await db.collection<CalendarEvent>('events').findOne({ 
      _id: new ObjectId(params.id),
      userId: new ObjectId(session.user.id) // ✅ Sécurité
    })

    if (!event) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Événement non trouvé'
      }
      return NextResponse.json(response, { status: 404 })
    }

    // Préparation des données de mise à jour
    const updateData: any = {
      updatedAt: new Date()
    }

    // Mise à jour des champs fournis
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.client !== undefined) updateData.client = body.client
    if (body.type !== undefined) updateData.type = body.type
    if (body.status !== undefined) updateData.status = body.status
    if (body.location !== undefined) updateData.location = body.location
    if (body.project !== undefined) updateData.project = body.project
    if (body.color !== undefined) updateData.color = body.color
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.isAllDay !== undefined) updateData.isAllDay = body.isAllDay

    // Mise à jour des dates
    if (body.start) {
      updateData.start = new Date(body.start)
    }
    if (body.end) {
      updateData.end = new Date(body.end)
    }

    // Mise à jour des IDs
    if (body.projectId) {
      updateData.projectId = new ObjectId(body.projectId)
    }
    if (body.clientId) {
      updateData.clientId = new ObjectId(body.clientId)
    }

    // Mise à jour de la récurrence
    if (body.recurring !== undefined) {
      updateData.recurring = body.recurring ? {
        ...body.recurring,
        endDate: body.recurring.endDate ? new Date(body.recurring.endDate) : undefined
      } : null
    }

    // Mise à jour des rappels
    if (body.reminders !== undefined) {
      updateData.reminders = body.reminders.map(reminder => ({
        ...reminder,
        sent: false
      }))
    }

    const result = await db.collection<CalendarEvent>('events').updateOne(
      { 
        _id: new ObjectId(params.id),
        userId: new ObjectId(session.user.id) // ✅ Sécurité
      },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Événement non trouvé'
      }
      return NextResponse.json(response, { status: 404 })
    }

    const updatedEvent = await db.collection<CalendarEvent>('events').findOne({ 
      _id: new ObjectId(params.id) 
    })

    const response: ApiResponse<CalendarEvent> = {
      success: true,
      data: updatedEvent!,
      message: 'Événement mis à jour avec succès'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating event:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: 'Erreur lors de la mise à jour de l\'événement'
    }
    return NextResponse.json(response, { status: 500 })
  }
}

// DELETE - Supprimer un événement
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Non authentifié'
      }
      return NextResponse.json(response, { status: 401 })
    }

    const db = await getDatabase()

    if (!ObjectId.isValid(params.id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'ID d\'événement invalide'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Vérifier que l'événement appartient à l'utilisateur avant suppression
    const result = await db.collection<CalendarEvent>('events').deleteOne({ 
      _id: new ObjectId(params.id),
      userId: new ObjectId(session.user.id) // ✅ Sécurité
    })

    if (result.deletedCount === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Événement non trouvé'
      }
      return NextResponse.json(response, { status: 404 })
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Événement supprimé avec succès'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error deleting event:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: 'Erreur lors de la suppression de l\'événement'
    }
    return NextResponse.json(response, { status: 500 })
  }
}