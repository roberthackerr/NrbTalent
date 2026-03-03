// app/api/projects/[id]/time-entries/route.ts (CORRIGÉ)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // AWAIT params
    const { id } = await params
    const db = await getDatabase()

    console.log('🔍 Fetching time entries for project:', id)

    // Valider l'ID du projet
    let projectId
    try {
      projectId = new ObjectId(id)
    } catch (error) {
      console.error('❌ Invalid project ID:', id)
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    // Récupérer les tâches du projet
    const tasks = await db.collection('tasks')
      .find({ projectId: projectId })
      .project({ _id: 1 })
      .toArray()

    const taskIds = tasks.map(task => task._id.toString())

    console.log('📋 Project task IDs:', taskIds)

    // Récupérer les time entries pour ces tâches
    const entries = await db.collection('time_entries')
      .find({ 
        userId: new ObjectId(session.user.id),
        taskId: { $in: taskIds }
      })
      .sort({ startTime: -1 })
      .toArray()

    console.log('✅ Found time entries:', entries.length)

    const normalizedEntries = entries.map(entry => ({
      id: entry._id.toString(),
      taskId: entry.taskId,
      userId: entry.userId.toString(),
      startTime: entry.startTime.toISOString(),
      endTime: entry.endTime ? entry.endTime.toISOString() : null,
      duration: entry.duration || 0,
      description: entry.description,
      billable: entry.billable,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString()
    }))

    return NextResponse.json(normalizedEntries)
  } catch (error) {
    console.error('💥 Error fetching project time entries:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}