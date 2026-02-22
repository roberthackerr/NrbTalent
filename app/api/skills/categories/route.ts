import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

export async function GET() {
  try {
    const db = await getDatabase()
    
    // Récupérer les catégories UNIQUES depuis la collection skills
    const categories = await db.collection('listOfSkills')
      .aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
      .toArray()
    
    if (categories.length > 0) {
      return NextResponse.json({ 
        categories: categories.map(c => c._id)
      })
    }
    
    // Fallback
    return NextResponse.json({ 
      categories: [
        "Développement Web",
        "Développement Mobile",
        "Design UI/UX",
        "DevOps",
        "Data Science",
        "Marketing Digital",
        "Rédaction",
        "Traduction",
        "Consulting",
        "Autre"
      ]
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ 
      categories: [
        "Développement Web",
        "Développement Mobile",
        "Design UI/UX",
        "DevOps",
        "Data Science",
        "Marketing Digital",
        "Rédaction",
        "Traduction",
        "Consulting",
        "Autre"
      ]
    })
  }
}