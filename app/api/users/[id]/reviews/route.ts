import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { User, Review } from "@/lib/models/user"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const db = await getDatabase()
    const skip = (page - 1) * limit

    const user = await db.collection<User>("users").findOne(
      { _id: new ObjectId(params.id) },
      { projection: { reviews: 1, name: 1 } }
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const reviews = user.reviews || []
    const paginatedReviews = reviews.slice(skip, skip + limit)

    // Calculer les statistiques des avis
    const stats = {
      averageRating: reviews.length > 0 
        ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
        : 0,
      totalReviews: reviews.length,
      ratingDistribution: [1,2,3,4,5].map(rating => ({
        rating,
        count: reviews.filter(r => r.rating === rating).length
      })),
      wouldRecommend: reviews.filter(r => r.wouldRecommend).length
    }

    return NextResponse.json({
      reviews: paginatedReviews,
      pagination: {
        page,
        limit,
        total: reviews.length,
        pages: Math.ceil(reviews.length / limit)
      },
      stats
    })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}