// app/api/projects/[id]/tasks/route.ts (CORRIGÉ)
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
    
    console.log('🔍 Fetching tasks for project:', id)

    const tasks = await db.collection('tasks')
      .find({ projectId: new ObjectId(id) })
      .sort({ position: 1 })
      .toArray()

    console.log('✅ Found tasks:', tasks.length)

    // Normaliser les données pour le frontend
    const normalizedTasks = tasks.map(task => ({
      id: task._id.toString(),
      _id: task._id.toString(),
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      position: task.position,
      dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
      projectId: task.projectId.toString(),
      assigneeId: task.assigneeId?.toString(),
      createdBy: task.createdBy?.toString(),
      labels: task.labels || [],
      attachments: task.attachments || [],
      comments: task.comments || [],
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    }))

    console.log('📋 Normalized tasks sample:', normalizedTasks.slice(0, 2))

    return NextResponse.json(normalizedTasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
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
    const body = await request.json()
    const db = await getDatabase()

    const newTask = {
      ...body,
      projectId: new ObjectId(id),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: new ObjectId(session.user.id),
      attachments: [],
      comments: [],
      actualHours: 0,
      position: 0
    }

    const result = await db.collection('tasks').insertOne(newTask)
    const task = await db.collection('tasks').findOne({ _id: result.insertedId })

    // Normaliser la tâche créée
    const normalizedTask = {
      id: task._id.toString(),
      _id: task._id.toString(),
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      position: task.position,
      dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
      projectId: task.projectId.toString(),
      assigneeId: task.assigneeId?.toString(),
      createdBy: task.createdBy?.toString(),
      labels: task.labels || [],
      attachments: task.attachments || [],
      comments: task.comments || [],
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    }

    return NextResponse.json(normalizedTask)
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}