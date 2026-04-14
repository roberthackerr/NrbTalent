// app/api/time-entries/[id]/route.ts (version améliorée)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// Helper pour valider l'ID
function validateId(id: string): ObjectId | null {
  try {
    return ObjectId.isValid(id) ? new ObjectId(id) : null
  } catch {
    return null
  }
}

// Helper pour formater la réponse
function formatTimeEntry(entry: any) {
  return {
    id: entry._id.toString(),
    userId: entry.userId.toString(),
    taskId: entry.taskId.toString(),
    projectId: entry.projectId?.toString(),
    startTime: entry.startTime.toISOString(),
    endTime: entry.endTime?.toISOString() || null,
    duration: entry.duration || 0,
    description: entry.description || '',
    billable: entry.billable !== false,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString()
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const { id } = await params
    
    const objectId = validateId(id)
    if (!objectId) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid time entry ID' 
      }, { status: 400 })
    }

    const body = await request.json()
    const db = await getDatabase()

    // Construire les champs à mettre à jour
    const updateFields: any = {}
    
    if (body.endTime !== undefined) {
      updateFields.endTime = new Date(body.endTime)
    }
    if (body.duration !== undefined) {
      updateFields.duration = body.duration
    }
    if (body.description !== undefined) {
      updateFields.description = body.description
    }
    if (body.billable !== undefined) {
      updateFields.billable = body.billable
    }

    // Vérifier qu'il y a des champs à mettre à jour
    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'No fields to update' 
      }, { status: 400 })
    }

    updateFields.updatedAt = new Date()

    const result = await db.collection('time_entries').updateOne(
      { 
        _id: objectId,
        userId: new ObjectId(session.user.id)
      },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Time entry not found or access denied' 
      }, { status: 404 })
    }

    const updatedEntry = await db.collection('time_entries').findOne({ _id: objectId })

    return NextResponse.json({ 
      success: true,
      data: formatTimeEntry(updatedEntry)
    })
  } catch (error) {
    console.error('Error updating time entry:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const { id } = await params
    
    const objectId = validateId(id)
    if (!objectId) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid time entry ID' 
      }, { status: 400 })
    }

    const db = await getDatabase()

    const result = await db.collection('time_entries').deleteOne({
      _id: objectId,
      userId: new ObjectId(session.user.id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Time entry not found or access denied' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Time entry deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting time entry:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}