// app/api/orders/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { gigId, package: gigPackage, requirements } = await request.json()
    const buyerId = new ObjectId((session.user as any).id)

    if (!gigId || !gigPackage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = await getDatabase()

    // Get gig details
    const gig = await db.collection('gigs').findOne({ 
      _id: new ObjectId(gigId),
      status: 'active'
    })

    if (!gig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 })
    }

    // Calculate delivery date
    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + gig.deliveryTime)

    const order = {
      gigId: new ObjectId(gigId),
      buyerId,
      sellerId: gig.createdBy,
      package: gigPackage,
      price: gig.price,
      status: 'pending',
      requirements: requirements || '',
      deliveryDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    }

    const result = await db.collection('orders').insertOne(order)

    // Create conversation between buyer and seller
    const conversation = await db.collection('conversations').findOne({
      participants: { 
        $all: [buyerId, gig.createdBy],
        $size: 2
      }
    })

    if (!conversation) {
      await db.collection('conversations').insertOne({
        participants: [buyerId, gig.createdBy],
        orderId: result.insertedId,
        createdAt: new Date(),
        updatedAt: new Date(),
        type: 'order'
      })
    }

    return NextResponse.json({ 
      order: { ...order, _id: result.insertedId },
      message: 'Order created successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'buyer' // 'buyer' ou 'seller'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const skip = (page - 1) * limit

    const filter = role === 'buyer' 
      ? { buyerId: userId }
      : { sellerId: userId }

    const [orders, total] = await Promise.all([
      db.collection('orders')
        .aggregate([
          { $match: filter },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'gigs',
              localField: 'gigId',
              foreignField: '_id',
              as: 'gig'
            }
          },
          { $unwind: '$gig' },
          {
            $lookup: {
              from: 'users',
              localField: 'buyerId',
              foreignField: '_id',
              as: 'buyer'
            }
          },
          { $unwind: '$buyer' },
          {
            $lookup: {
              from: 'users',
              localField: 'sellerId',
              foreignField: '_id',
              as: 'seller'
            }
          },
          { $unwind: '$seller' },
          {
            $project: {
              'buyer.password': 0,
              'buyer.email': 0,
              'seller.password': 0,
              'seller.email': 0,
              'gig.createdBy': 0
            }
          }
        ])
        .toArray(),
      db.collection('orders').countDocuments(filter)
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

