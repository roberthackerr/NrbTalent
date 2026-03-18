//app\api\users\search\route.ts
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { User } from "@/lib/models/user"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const role = searchParams.get('role') || 'freelance'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    const db = await getDatabase()
    const skip = (page - 1) * limit

    // Construction de la requête
    const searchQuery: any = { role: role }

    // Recherche textuelle
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } },
        { 'skills.name': { $regex: query, $options: 'i' } }
      ]
    }

    // Récupération des données
    const users = await db.collection<User>("users")
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Nettoyer et normaliser les données
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user
      
      // Assurer que tous les champs requis existent avec des valeurs par défaut
      return {
        _id: safeUser._id?.toString() || '',
        name: safeUser.name || 'Utilisateur sans nom',
        email: safeUser.email || '',
        title: safeUser.title || 'Freelance',
        description: safeUser.bio || '',
        bio: safeUser.bio || '',
        avatar: safeUser.avatar || '',
        coverImage: safeUser.coverImage || '',
        skills: safeUser.skills || [],
        location: safeUser.location || '',
        hourlyRate: safeUser.hourlyRate || 0,
        statistics: safeUser.statistics || { 
          rating: 0, 
          completedProjects: 0,
          responseRate: 0,
          clientSatisfaction: 0
        },
        verified: safeUser.verified || false,
        isActive: safeUser.isActive !== undefined ? safeUser.isActive : true,
        createdAt: safeUser.createdAt || new Date().toISOString(),
        updatedAt: safeUser.updatedAt || new Date().toISOString()
      }
    })

    const total = await db.collection<User>("users").countDocuments(searchQuery)

    return NextResponse.json({
      users: safeUsers,
      pagination: { 
        page, 
        limit, 
        total, 
        pages: Math.ceil(total / limit) 
      }
    })

  } catch (error) {
    console.error("Error searching users:", error)
    return NextResponse.json({ 
      error: "Internal server error"
    }, { status: 500 })
  }
}