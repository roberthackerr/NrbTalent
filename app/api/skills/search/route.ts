import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    
    const db = await getDatabase()
    
    // Construire la requête de recherche
    const filter: any = {}
    
    if (query) {
      filter.name = { $regex: query, $options: 'i' }
    }
    
    if (category) {
      filter.category = category
    }
    
    // Rechercher dans la collection skills
    const skills = await db.collection('listOfSkills')
      .find(filter)
      .sort({ popularity: -1 })
      .limit(20)
      .toArray()
    
    return NextResponse.json({ 
      skills: skills.map(s => ({
        name: s.name,
        category: s.category,
        popularity: s.popularity || 0
      }))
    })
  } catch (error) {
    console.error('Error searching skills:', error)
    return NextResponse.json({ skills: [] })
  }
}