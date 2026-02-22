import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const text = searchParams.get('text') || ''
    
    if (text.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }
    
    const db = await getDatabase()
    
    // Suggestions basées sur le texte tapé
    const suggestions = await db.collection('listOfSkills')
      .find({
        name: { $regex: text, $options: 'i' }
      })
      .sort({ popularity: -1 })
      .limit(10)
      .toArray()
    
    return NextResponse.json({ 
      suggestions: suggestions.map(s => ({
        name: s.name,
        category: s.category
      }))
    })
  } catch (error) {
    console.error('Error getting suggestions:', error)
    return NextResponse.json({ suggestions: [] })
  }
}