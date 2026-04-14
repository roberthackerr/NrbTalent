// app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// Types
interface TaskUpdate {
  status?: string
  position?: number
  title?: string
  description?: string
  priority?: string
  estimatedHours?: number
  actualHours?: number
  assigneeId?: string
  dueDate?: Date | null
  labels?: string[]
}

// GET - Récupérer les tâches
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const assigneeId = searchParams.get('assigneeId')

    const db = await getDatabase()
    let query: any = {}

    if (projectId) {
      try {
        query.projectId = new ObjectId(projectId)
      } catch (error) {
        return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
      }
    }

    if (status && status !== 'all') {
      query.status = status
    }

    if (assigneeId) {
      query.assigneeId = assigneeId
    }

    const tasks = await db.collection('tasks')
      .find(query)
      .sort({ position: 1, createdAt: -1 })
      .toArray()

    const formattedTasks = tasks.map(task => ({
      id: task._id.toString(),
      _id: task._id.toString(),
      title: task.title,
      description: task.description,
      projectId: task.projectId.toString(),
      assigneeId: task.assigneeId,
      createdBy: task.createdBy,
      position: task.position,
      status: task.status,
      priority: task.priority,
      estimatedHours: task.estimatedHours || 0,
      actualHours: task.actualHours || 0,
      labels: task.labels || [],
      attachments: task.attachments || [],
      comments: task.comments || [],
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    }))

    return NextResponse.json({ data: formattedTasks, success: true })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Créer une nouvelle tâche
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const db = await getDatabase()

    // Validation
    if (!body.projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    if (!body.title) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 })
    }

    let projectId
    try {
      projectId = new ObjectId(body.projectId)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    // Get the highest position for the new task
    const lastTask = await db.collection('tasks')
      .find({ projectId, status: body.status || 'todo' })
      .sort({ position: -1 })
      .limit(1)
      .toArray()

    const newPosition = lastTask.length > 0 ? lastTask[0].position + 1 : 0

    const newTask = {
      title: body.title,
      description: body.description || '',
      projectId,
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
    
    // Récupérer la tâche créée
    const task = await db.collection('tasks').findOne({ _id: result.insertedId })

    const formattedTask = {
      id: task._id.toString(),
      _id: task._id.toString(),
      title: task.title,
      description: task.description,
      projectId: task.projectId.toString(),
      assigneeId: task.assigneeId,
      createdBy: task.createdBy,
      position: task.position,
      status: task.status,
      priority: task.priority,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      labels: task.labels,
      attachments: task.attachments,
      comments: task.comments,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    }

    return NextResponse.json({ data: formattedTask, success: true }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT - Mettre à jour une tâche
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, ...updates } = body

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    let taskObjectId
    try {
      taskObjectId = new ObjectId(taskId)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Vérifier que la tâche existe
    const existingTask = await db.collection('tasks').findOne({ _id: taskObjectId })
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Préparer les champs à mettre à jour
    const updateFields: any = {
      updatedAt: new Date()
    }

    if (updates.title !== undefined) updateFields.title = updates.title
    if (updates.description !== undefined) updateFields.description = updates.description
    if (updates.status !== undefined) updateFields.status = updates.status
    if (updates.priority !== undefined) updateFields.priority = updates.priority
    if (updates.estimatedHours !== undefined) updateFields.estimatedHours = updates.estimatedHours
    if (updates.actualHours !== undefined) updateFields.actualHours = updates.actualHours
    if (updates.assigneeId !== undefined) updateFields.assigneeId = updates.assigneeId
    if (updates.labels !== undefined) updateFields.labels = updates.labels
    if (updates.dueDate !== undefined) updateFields.dueDate = updates.dueDate ? new Date(updates.dueDate) : null
    if (updates.position !== undefined) updateFields.position = updates.position

    // Mise à jour
    const result = await db.collection('tasks').updateOne(
      { _id: taskObjectId },
      { $set: updateFields }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'No changes made' }, { status: 400 })
    }

    // Récupérer la tâche mise à jour
    const updatedTask = await db.collection('tasks').findOne({ _id: taskObjectId })

    const formattedTask = {
      id: updatedTask._id.toString(),
      _id: updatedTask._id.toString(),
      title: updatedTask.title,
      description: updatedTask.description,
      projectId: updatedTask.projectId.toString(),
      assigneeId: updatedTask.assigneeId,
      createdBy: updatedTask.createdBy,
      position: updatedTask.position,
      status: updatedTask.status,
      priority: updatedTask.priority,
      estimatedHours: updatedTask.estimatedHours,
      actualHours: updatedTask.actualHours,
      labels: updatedTask.labels,
      attachments: updatedTask.attachments,
      comments: updatedTask.comments,
      dueDate: updatedTask.dueDate ? updatedTask.dueDate.toISOString() : null,
      createdAt: updatedTask.createdAt.toISOString(),
      updatedAt: updatedTask.updatedAt.toISOString()
    }

    return NextResponse.json({ data: formattedTask, success: true })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Supprimer une tâche
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('id')

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    let taskObjectId
    try {
      taskObjectId = new ObjectId(taskId)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Vérifier que la tâche existe
    const task = await db.collection('tasks').findOne({ _id: taskObjectId })
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Supprimer la tâche
    const result = await db.collection('tasks').deleteOne({ _id: taskObjectId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
    }

    // Réorganiser les positions des tâches restantes dans le même statut
    await db.collection('tasks').updateMany(
      { 
        projectId: task.projectId, 
        status: task.status, 
        position: { $gt: task.position } 
      },
      { $inc: { position: -1 } }
    )

    return NextResponse.json({ 
      success: true, 
      message: 'Task deleted successfully',
      deletedId: taskId
    })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PATCH - Mettre à jour le statut ou la position (pour drag & drop)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tasks, sourceStatus, destinationStatus } = body

    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Invalid tasks data' }, { status: 400 })
    }

    const db = await getDatabase()
    const bulkOps = []

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]
      const update: any = { position: i }
      
      if (sourceStatus !== destinationStatus && destinationStatus) {
        update.status = destinationStatus
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: new ObjectId(task.id) },
          update: { 
            $set: { 
              ...update,
              updatedAt: new Date() 
            } 
          }
        }
      })
    }

    if (bulkOps.length > 0) {
      await db.collection('tasks').bulkWrite(bulkOps)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Tasks reordered successfully' 
    })
  } catch (error) {
    console.error('Error reordering tasks:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}