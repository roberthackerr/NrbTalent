// app/api/gigs/stats/route.ts
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

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Récupérer tous les services de l'utilisateur
    const gigs = await db.collection('gigs')
      .find({ createdBy: userId })
      .toArray()

    // Calculer les statistiques
    const stats = {
        recentOrders:{},
      totalGigs: gigs.length,
      activeGigs: gigs.filter(g => g.status === 'active').length,
      draftGigs: gigs.filter(g => g.status === 'draft').length,
      pausedGigs: gigs.filter(g => g.status === 'paused').length,
      totalViews: gigs.reduce((sum, g) => sum + (g.views || 0), 0),
      totalOrders: gigs.reduce((sum, g) => sum + (g.ordersCount || 0), 0),
      totalEarnings: gigs.reduce((sum, g) => sum + (g.earnings || 0), 0),
      averageRating: 0,
      topPerformingGigs: {}
    }

    // Calculer la note moyenne
    const gigsWithRating = gigs.filter(g => g.rating > 0)
    if (gigsWithRating.length > 0) {
      stats.averageRating = gigsWithRating.reduce((sum, g) => sum + g.rating, 0) / gigsWithRating.length
    }

    // Récupérer les services les plus performants
    const topPerforming = [...gigs]
      .sort((a, b) => (b.ordersCount || 0) - (a.ordersCount || 0))
      .slice(0, 3)
      .map(g => ({
        _id: g._id,
        title: g.title,
        ordersCount: g.ordersCount || 0,
        views: g.views || 0,
        earnings: g.earnings || 0
      }))

    stats.topPerformingGigs = topPerforming

    // Récupérer les commandes récentes
    const orders = await db.collection('orders')
      .aggregate([
        { $match: { sellerId: userId, status: 'completed' } },
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: 'buyerId',
            foreignField: '_id',
            as: 'buyer'
          }
        },
        { $unwind: { path: '$buyer', preserveNullAndEmptyArrays: true } }
      ])
      .toArray()

    stats.recentOrders = orders.map(o => ({
      _id: o._id,
      amount: o.amount,
      status: o.status,
      createdAt: o.createdAt,
      buyerName: o.buyer?.name || 'Client'
    }))

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error fetching gig stats:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}