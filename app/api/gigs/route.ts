// app/api/gigs/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// app/api/gigs/route.ts - Version avec logs
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const sortBy = searchParams.get('sortBy') || 'createdAt'

    console.log('🔍 Fetching gigs with params:', {
      page,
      limit,
      category,
      search,
      minPrice,
      maxPrice,
      sortBy
    })

    const db = await getDatabase()

    // Compter d'abord tous les gigs sans filtre
    const totalGigs = await db.collection('gigs').countDocuments({})
    console.log('📊 Total gigs in database:', totalGigs)

    // Compter les gigs actifs
    const activeGigs = await db.collection('gigs').countDocuments({ status: 'active' })
    console.log('✅ Active gigs:', activeGigs)

    // Build filter
    const filter: any = { status: 'active' }
    
    if (category && category !== 'all') {
      filter.category = category
      console.log('🏷️ Filter by category:', category)
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
      console.log('🔎 Search filter:', filter.$or)
    }
    
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) {
        filter.price.$gte = parseInt(minPrice)
        console.log('💰 Min price:', minPrice)
      }
      if (maxPrice) {
        filter.price.$lte = parseInt(maxPrice)
        console.log('💰 Max price:', maxPrice)
      }
    }

    console.log('🎯 Final filter:', JSON.stringify(filter, null, 2))

    // Build sort
    const sort: any = {}
    if (sortBy === 'price') sort.price = 1
    else if (sortBy === 'price_desc') sort.price = -1
    else if (sortBy === 'rating') sort.rating = -1
    else sort.createdAt = -1

    console.log('📋 Sort order:', sort)

    const skip = (page - 1) * limit

    const [gigs, total] = await Promise.all([
      db.collection('gigs')
        .aggregate([
          { $match: filter },
          { $sort: sort },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: 'createdBy',
              foreignField: '_id',
              as: 'seller'
            }
          },
          { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              'seller.password': 0,
              'seller.email': 0
            }
          }
        ])
        .toArray(),
      db.collection('gigs').countDocuments(filter)
    ])

    console.log('📦 Gigs found:', gigs.length)
    console.log('📊 Total matching filter:', total)
    
    if (gigs.length > 0) {
      console.log('📝 First gig sample:', JSON.stringify(gigs[0], null, 2))
    }

    return NextResponse.json({
      gigs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('❌ Error fetching gigs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
// app/api/gigs/route.ts




export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      title, 
      description, 
      category, 
      subcategory, 
      tags, 
      price, 
      deliveryTime, 
      revisions, 
      features, 
      requirements,
      images // This now contains the uploaded image URLs
    } = body

    // Validation
    if (!title || !description || !category || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    const gig = {
      title,
      description,
      category,
      subcategory: subcategory || '',
      tags: tags || [],
      price: parseFloat(price),
      currency: 'EUR',
      deliveryTime: parseInt(deliveryTime) || 7,
      revisions: parseInt(revisions) || 1,
      features: features.filter((f: string) => f.trim() !== ""),
      requirements: requirements.filter((r: string) => r.trim() !== ""),
      images: images || [], // This stores the image URLs in the database
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      rating: 0,
      reviewsCount: 0,
      ordersCount: 0,
      isActive: true
    }

    const result = await db.collection('gigs').insertOne(gig)

    // Return the complete gig with images
    return NextResponse.json({ 
      gig: { 
        ...gig, 
        _id: result.insertedId,
        images: gig.images // Ensure images are included in response
      },
      message: 'Gig created successfully' 
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating gig:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}