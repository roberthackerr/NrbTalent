// app/api/time-entries/route.ts
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
    const db = await getDatabase()

    const newEntry = {
      ...body,
      userId: new ObjectId(session.user.id),
      startTime: new Date(body.startTime),
      duration: 0, // Sera mis à jour quand le timer s'arrête
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('time_entries').insertOne(newEntry)
    const entry = await db.collection('time_entries').findOne({ _id: result.insertedId })

    // Normaliser la réponse
    const normalizedEntry = {
      ...entry,
      id: entry._id.toString(),
      userId: entry.userId.toString(),
      startTime: entry.startTime.toISOString(),
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString()
    }

    return NextResponse.json(normalizedEntry)
  } catch (error) {
    console.error('Error creating time entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const active = searchParams.get('active')

    const db = await getDatabase()
    let query: any = { userId: new ObjectId(session.user.id) }

    if (active === 'true') {
      query.endTime = { $exists: false }
    }

    if (projectId) {
      // Pour récupérer via les tâches du projet
      const tasks = await db.collection('tasks')
        .find({ projectId: new ObjectId(projectId) })
        .project({ _id: 1 })
        .toArray()
      
      query.taskId = { $in: tasks.map(t => t._id.toString()) }
    }

    const entries = await db.collection('time_entries')
      .find(query)
      .sort({ startTime: -1 })
      .toArray()

    const normalizedEntries = entries.map(entry => ({
      ...entry,
      id: entry._id.toString(),
      userId: entry.userId.toString(),
      startTime: entry.startTime.toISOString(),
      endTime: entry.endTime ? entry.endTime.toISOString() : null,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString()
    }))

    return NextResponse.json(normalizedEntries)
  } catch (error) {
    console.error('Error fetching time entries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}