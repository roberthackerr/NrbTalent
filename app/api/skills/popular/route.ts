import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

export async function GET() {
  try {
    const db = await getDatabase()
    
    // Récupérer les compétences depuis la collection skills
    const skills = await db.collection('listOfSkills')
      .find({})
      .sort({ popularity: -1 })
      .limit(50)
      .toArray()
    
    const skillNames = skills.map(s => s.name)
    
    return NextResponse.json({ skills: skillNames })
  } catch (error) {
    console.error('Error fetching popular skills:', error)
    return NextResponse.json({ 
      skills: [
        "React", "TypeScript", "Node.js", "Python", "Next.js",
        "Vue.js", "Angular", "PHP", "Laravel", "Symfony",
        "Java", "Spring Boot", "C#", ".NET", "Swift",
        "Kotlin", "Flutter", "React Native", "Docker", "Kubernetes"
      ]
    })
  }
}