// app/api/time-entries/[id]/route.ts
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

    const updateData: any = {
      updatedAt: new Date()
    }

    if (body.endTime) updateData.endTime = new Date(body.endTime)
    if (body.duration !== undefined) updateData.duration = body.duration
    if (body.description !== undefined) updateData.description = body.description
    if (body.billable !== undefined) updateData.billable = body.billable

    const result = await db.collection('time_entries').updateOne(
      { 
        _id: new ObjectId(params.id),
        userId: new ObjectId(session.user.id) // Sécurité : seul le propriétaire peut modifier
      },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
    }

    const updatedEntry = await db.collection('time_entries').findOne({ _id: new ObjectId(params.id) })

    const normalizedEntry = {
      ...updatedEntry,
      id: updatedEntry._id.toString(),
      userId: updatedEntry.userId.toString(),
      startTime: updatedEntry.startTime.toISOString(),
      endTime: updatedEntry.endTime ? updatedEntry.endTime.toISOString() : null,
      createdAt: updatedEntry.createdAt.toISOString(),
      updatedAt: updatedEntry.updatedAt.toISOString()
    }

    return NextResponse.json(normalizedEntry)
  } catch (error) {
    console.error('Error updating time entry:', error)
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

    const result = await db.collection('time_entries').deleteOne({
      _id: new ObjectId(params.id),
      userId: new ObjectId(session.user.id) // Sécurité : seul le propriétaire peut supprimer
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting time entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}