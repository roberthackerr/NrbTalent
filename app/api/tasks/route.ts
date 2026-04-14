// app/api/tasks/route.ts (CORRIGÉ)
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

    // Valider que projectId est fourni
    if (!body.projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Vérifier si projectId est un ObjectId valide
    let projectId
    try {
      projectId = new ObjectId(body.projectId)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    // Get the highest position for the new task
    const lastTask = await db.collection('tasks')
      .find({ projectId: projectId, status: body.status || 'todo' })
      .sort({ position: -1 })
      .limit(1)
      .toArray()

    const newPosition = lastTask.length > 0 ? lastTask[0].position + 1 : 0

    const newTask = {
      title: body.title,
      description: body.description,
      projectId: projectId,
      // Utiliser l'ID de session directement (pas de conversion ObjectId)
      assigneeId: body.assigneeId || session.user.id,
      createdBy: session.user.id,
      position: newPosition,
      status: body.status || 'todo',
      priority: body.priority || 'medium',
      estimatedHours: body.estimatedHours || 0,
      actualHours: 0,
      labels: body.labels || [],
      attachments: [],
      comments: [],
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('tasks').insertOne(newTask)
    const task = await db.collection('tasks').findOne({ _id: result.insertedId })

    // Formater la réponse
    const formattedTask = {
      ...task,
      id: task._id.toString(),
      projectId: task.projectId.toString(),
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    }

    return NextResponse.json(formattedTask)
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
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

    const db = await getDatabase()
    let query = {}

    if (projectId) {
      try {
        query = { projectId: new ObjectId(projectId) }
      } catch (error) {
        return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
      }
    }

    const tasks = await db.collection('tasks')
      .find(query)
      .sort({ position: 1 })
      .toArray()

    const formattedTasks = tasks.map(task => ({
      ...task,
      id: task._id.toString(),
      projectId: task.projectId.toString(),
      dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    }))

    return NextResponse.json(formattedTasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}