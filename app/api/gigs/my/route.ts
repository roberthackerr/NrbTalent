// app/api/gigs/my/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Construire le filtre
    const filter: any = { createdBy: userId }
    
    if (status !== 'all') {
      filter.status = status
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    // Construire le tri
    const sort: any = {}
    switch (sortBy) {
      case 'createdAt':
        sort.createdAt = sortOrder === 'asc' ? 1 : -1
        break
      case 'views':
        sort.views = sortOrder === 'asc' ? 1 : -1
        break
      case 'ordersCount':
        sort.ordersCount = sortOrder === 'asc' ? 1 : -1
        break
      case 'price':
        sort.price = sortOrder === 'asc' ? 1 : -1
        break
      default:
        sort.createdAt = -1
    }

    const skip = (page - 1) * limit

    // Exécuter les requêtes
    const [gigs, total] = await Promise.all([
      db.collection('gigs')
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('gigs').countDocuments(filter)
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      gigs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching user gigs:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}