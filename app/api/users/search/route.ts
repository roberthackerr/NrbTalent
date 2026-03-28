// app/api/users/search/route.ts
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { User } from "@/lib/models/user"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const role = searchParams.get('role')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const minRating = parseFloat(searchParams.get('minRating') || '0')
    const minCompleted = parseInt(searchParams.get('minCompleted') || '0')
    const skills = searchParams.get('skills')?.split(',') || []
    const location = searchParams.get('location') || ''

    const db = await getDatabase()
    const skip = (page - 1) * limit

    // Construction de la requête
    const searchQuery: any = {}

    // Gestion du rôle - si non spécifié, inclure freelances ET clients
    if (role && ['freelance', 'client', 'freelancer'].includes(role)) {
      // Normaliser le rôle (freelance et freelancer sont équivalents)
      const normalizedRole = role === 'freelancer' ? 'freelance' : role
      searchQuery.role = normalizedRole
    } else {
      // Si pas de rôle spécifié, chercher les freelances ET les clients
      searchQuery.role = { $in: ['freelance', 'client'] }
    }

    // Recherche textuelle
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
        { 'skills.name': { $regex: query, $options: 'i' } },
        { skills: { $regex: query, $options: 'i' } }
      ]
    }

    // Filtres supplémentaires
    if (minRating > 0) {
      searchQuery['statistics.rating'] = { $gte: minRating }
    }

    if (minCompleted > 0) {
      searchQuery['statistics.completedProjects'] = { $gte: minCompleted }
    }

    if (skills.length > 0) {
      searchQuery.skills = { $in: skills }
    }

    if (location) {
      searchQuery.location = { $regex: location, $options: 'i' }
    }

    // Ne pas inclure les utilisateurs désactivés
    searchQuery.isActive = { $ne: false }

    // Construction du tri
    const sortOptions: any = {}
    switch (sortBy) {
      case 'rating':
        sortOptions['statistics.rating'] = sortOrder === 'asc' ? 1 : -1
        break
      case 'completedProjects':
        sortOptions['statistics.completedProjects'] = sortOrder === 'asc' ? 1 : -1
        break
      case 'hourlyRate':
        sortOptions['hourlyRate'] = sortOrder === 'asc' ? 1 : -1
        break
      case 'name':
        sortOptions['name'] = sortOrder === 'asc' ? 1 : -1
        break
      case 'createdAt':
      default:
        sortOptions['createdAt'] = sortOrder === 'asc' ? 1 : -1
        break
    }

    // Récupération des données
    const users = await db.collection<User>("users")
      .find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray()

    // Nettoyer et normaliser les données
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user
      
      // Assurer que tous les champs requis existent avec des valeurs par défaut
      return {
        _id: safeUser._id?.toString() || '',
        name: safeUser.name || (safeUser.role === 'client' ? 'Client sans nom' : 'Utilisateur sans nom'),
        email: safeUser.email || '',
        role: safeUser.role || 'freelance',
        title: safeUser.title || (safeUser.role === 'client' ? 'Client' : 'Freelance'),
        description: safeUser.bio || safeUser.description || '',
        bio: safeUser.bio || '',
        avatar: safeUser.avatar || '',
        coverImage: safeUser.coverImage || '',
        skills: safeUser.skills || [],
        location: safeUser.location || '',
        hourlyRate: safeUser.hourlyRate || 0,
        // statistics: {
        //   rating: safeUser.statistics?.rating || 0,
        //   completedProjects: safeUser.statistics?.completedProjects || 0,
        //   responseRate: safeUser.statistics?.responseRate || 0,
        //   clientSatisfaction: safeUser.statistics?.clientSatisfaction || 0,
        //   totalSpent: safeUser.statistics?.totalSpent || 0,
        //   totalProjects: safeUser.statistics?.totalProjects || 0
        // },
        verified: safeUser.verified || false,
        isActive: safeUser.isActive !== undefined ? safeUser.isActive : true,
        createdAt: safeUser.createdAt || new Date().toISOString(),
        updatedAt: safeUser.updatedAt || new Date().toISOString()
      }
    })

    const total = await db.collection<User>("users").countDocuments(searchQuery)

    return NextResponse.json({
      success: true,
      users: safeUsers,
      pagination: { 
        page, 
        limit, 
        total, 
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      filters: {
        query: query || null,
        role: role || 'all',
        minRating,
        minCompleted,
        skills: skills.length > 0 ? skills : null,
        location: location || null
      }
    })

  } catch (error) {
    console.error("Error searching users:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Erreur lors de la recherche",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}