// app/api/tasks/[id]/route.ts (CORRIGÉ)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const db = await getDatabase()

    // Valider l'ID de la tâche
    let taskId
    try {
      taskId = new ObjectId(params.id)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
    }

    const updateData: any = {
      updatedAt: new Date()
    }

    // Mettre à jour seulement les champs fournis
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.estimatedHours !== undefined) updateData.estimatedHours = body.estimatedHours
    if (body.actualHours !== undefined) updateData.actualHours = body.actualHours
    if (body.labels !== undefined) updateData.labels = body.labels
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null

    // Convertir les IDs seulement s'ils sont fournis et valides
    if (body.projectId) {
      try {
        updateData.projectId = new ObjectId(body.projectId)
      } catch (error) {
        return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
      }
    }

    if (body.assigneeId) {
      updateData.assigneeId = body.assigneeId // Garder comme string
    }

    const result = await db.collection('tasks').updateOne(
      { _id: taskId },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const updatedTask = await db.collection('tasks').findOne({ _id: taskId })

    const formattedTask = {
      ...updatedTask,
      id: updatedTask._id.toString(),
      projectId: updatedTask.projectId.toString(),
      dueDate: updatedTask.dueDate ? updatedTask.dueDate.toISOString() : null,
      createdAt: updatedTask.createdAt.toISOString(),
      updatedAt: updatedTask.updatedAt.toISOString()
    }

    return NextResponse.json(formattedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDatabase()
    
    let taskId
    try {
      taskId = new ObjectId(params.id)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
    }

    const result = await db.collection('tasks').deleteOne({ _id: taskId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}