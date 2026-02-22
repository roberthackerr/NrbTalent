import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const skillName = decodeURIComponent(params.name)
    const db = await getDatabase()
    
    // Récupérer les détails de la compétence
    const skill = await db.collection('skills').findOne({ name: skillName })
    
    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }
    
    // Compter combien d'utilisateurs ont cette compétence
    const userCount = await db.collection('users').countDocuments({
      'skills.name': skillName
    })
    
    return NextResponse.json({
      name: skill.name,
      category: skill.category,
      popularity: skill.popularity || 0,
      userCount,
      relatedSkills: await getRelatedSkills(db, skillName, skill.category)
    })
  } catch (error) {
    console.error('Error fetching skill:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getRelatedSkills(db: any, skillName: string, category: string) {
  // Trouver des compétences dans la même catégorie
  const related = await db.collection('skills')
    .find({ 
      category,
      name: { $ne: skillName }
    })
    .sort({ popularity: -1 })
    .limit(5)
    .toArray()
  
  return related.map(s => s.name)
}