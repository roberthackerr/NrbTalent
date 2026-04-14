// app/api/time-entries/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, taskId, description, entryId, startTime, endTime, duration } = body

    const db = await getDatabase()
    const userId = new ObjectId(session.user.id)

    if (action === 'start') {
      // Vérifier s'il y a déjà un timer actif
      const existingActive = await db.collection('time_entries').findOne({
        userId,
        endTime: null
      })

      if (existingActive) {
        return NextResponse.json({ 
          error: 'An active timer already exists',
          activeTimer: existingActive
        }, { status: 409 })
      }

      // Créer une nouvelle entrée
      const newEntry = {
        userId,
        taskId: new ObjectId(taskId),
        startTime: new Date(startTime),
        endTime: null,
        duration: 0,
        description: description || 'Travail en cours',
        billable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await db.collection('time_entries').insertOne(newEntry)
      
      return NextResponse.json({
        success: true,
        entryId: result.insertedId.toString(),
        entry: {
          ...newEntry,
          id: result.insertedId.toString(),
          taskId: newEntry.taskId.toString(),
          userId: newEntry.userId.toString()
        }
      })
    }

    if (action === 'stop') {
      if (!entryId) {
        return NextResponse.json({ error: 'Entry ID required' }, { status: 400 })
      }

      const result = await db.collection('time_entries').updateOne(
        {
          _id: new ObjectId(entryId),
          userId,
          endTime: null
        },
        {
          $set: {
            endTime: new Date(endTime),
            duration: duration,
            description: description,
            updatedAt: new Date()
          }
        }
      )

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'sync') {
      // Récupérer le timer actif s'il existe
      const activeEntry = await db.collection('time_entries').findOne({
        userId,
        endTime: null
      })

      if (activeEntry) {
        return NextResponse.json({
          hasActiveTimer: true,
          timer: {
            entryId: activeEntry._id.toString(),
            taskId: activeEntry.taskId.toString(),
            startTime: activeEntry.startTime.toISOString(),
            description: activeEntry.description
          }
        })
      }

      return NextResponse.json({ hasActiveTimer: false })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error syncing time entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}