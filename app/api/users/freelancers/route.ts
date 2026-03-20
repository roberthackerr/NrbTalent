// app/api/users/freelancers/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const availability = searchParams.get('availability')
    const minRate = searchParams.get('minRate')
    const maxRate = searchParams.get('maxRate')
    const minRating = searchParams.get('minRating')
    const skills = searchParams.get('skills')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const db = await getDatabase()

    // Construire le filtre
   // Support des deux versions du rôle
const filter: any = { 
  $or: [
    { role: 'freelance' },
    { role: 'freelancer' }
  ],
 // isActive: true 
}

    // Recherche par nom ou compétences
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { 'skills.name': { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    // Filtre disponibilité
    if (availability && availability !== 'all') {
      filter.availability = availability
    }

    // Filtre taux horaire
    if (minRate || maxRate) {
      filter.hourlyRate = {}
      if (minRate) filter.hourlyRate.$gte = parseInt(minRate)
      if (maxRate) filter.hourlyRate.$lte = parseInt(maxRate)
    }

    // Filtre note minimale
    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) }
    }

    // Filtre compétences
    if (skills) {
      const skillList = skills.split(',')
      filter.skills = { $in: skillList }
    }

    // Construction du tri
    const sort: any = {}
    if (sortBy === 'rating') sort.rating = -1
    else if (sortBy === 'hourlyRate') sort.hourlyRate = 1
    else if (sortBy === 'recent') sort.createdAt = -1
    else sort.createdAt = -1

    // Récupérer les freelancers
    const freelancers = await db.collection('users')
      .find(filter)
      .project({
        password: 0,
        email: 0,
        phone: 0,
        __v: 0
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()

    // Compter le total
    const total = await db.collection('users').countDocuments(filter)

    return NextResponse.json({
      success: true,
      freelancers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching freelancers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}