import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/user"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const skills = searchParams.get('skills')?.split(',') || []
    const location = searchParams.get('location')
    const minRating = searchParams.get('minRating')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const sortBy = searchParams.get('sortBy') || 'relevance'

    const db = await getDatabase()
    const skip = (page - 1) * limit

    const query: any = {
      _id: { $ne: new ObjectId((session.user as any).id) },
      isActive: true,
      verified: true
    }

    if (role) query.role = role
    if (skills.length > 0) query.skills = { $in: skills.map(s => new RegExp(s, 'i')) }
    if (location) query.location = { $regex: location, $options: 'i' }
    if (minRating) query['statistics.clientSatisfaction'] = { $gte: parseFloat(minRating) }

    let sortOptions: any = {}
    switch (sortBy) {
      case 'rating': sortOptions = { 'statistics.clientSatisfaction': -1 }; break
      case 'newest': sortOptions = { createdAt: -1 }; break
      case 'hourlyRate': sortOptions = { hourlyRate: -1 }; break
      default: sortOptions = { completionScore: -1, 'statistics.clientSatisfaction': -1 }
    }

    const projection = {
      password: 0,
      email: 0,
      phone: 0,
      preferences: 0,
      statistics: 0,
      enrolledCourses: 0,
      savedProjects: 0,
      following: 0,
      followers: 0
    }

    const [users, total] = await Promise.all([
      db.collection<User>("users").find(query, { projection })
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<User>("users").countDocuments(query)
    ])

    return NextResponse.json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}