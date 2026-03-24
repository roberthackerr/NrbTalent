// app/api/gigs/[id]/view/route.ts
import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const gigId = params.id

    if (!ObjectId.isValid(gigId)) {
      return NextResponse.json({ error: 'ID de service invalide' }, { status: 400 })
    }

    const db = await getDatabase()

    await db.collection('gigs').updateOne(
      { _id: new ObjectId(gigId) },
      { $inc: { views: 1 } }
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error incrementing view count:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}