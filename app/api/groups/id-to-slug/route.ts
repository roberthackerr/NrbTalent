// app/api/groups/id-to-slug/route.ts
import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    
    if (!groupId) {
      return NextResponse.json({ error: 'groupId required' }, { status: 400 })
    }
    
    const  db = await getDatabase()
    
    // Chercher le groupe par ID MongoDB
    let group = null
    if (ObjectId.isValid(groupId)) {
      group = await db.collection('groups').findOne({ 
        _id: new ObjectId(groupId) 
      })
    }
    
    // Si pas trouvé par ID, chercher par slug
    if (!group) {
      group = await db.collection('groups').findOne({ 
        slug: groupId 
      })
    }
    
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      slug: group.slug,
      _id: group._id.toString()
    })
    
  } catch (error) {
    console.error('Error resolving group:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}