import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orderId = params.id

    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    const order = await db.collection('orders')
      .aggregate([
        { 
          $match: { 
            _id: new ObjectId(orderId),
            $or: [
              { buyerId: userId },
              { sellerId: userId }
            ]
          } 
        },
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
      .next()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orderId = params.id
    const { status, message } = await request.json()

    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Vérifier que l'utilisateur a accès à cette commande
    const existingOrder = await db.collection('orders').findOne({
      _id: new ObjectId(orderId),
      $or: [
        { buyerId: userId },
        { sellerId: userId }
      ]
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 })
    }

    const updateData: any = {
      updatedAt: new Date()
    }

    // Mettre à jour le statut si fourni
    if (status) {
      const validStatuses = ['pending', 'in_progress', 'delivered', 'completed', 'cancelled', 'disputed']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updateData.status = status
    }

    // Ajouter un message système si nécessaire
    if (message) {
      const systemMessage = {
        _id: new ObjectId(),
        senderId: userId,
        content: message,
        isSystemMessage: true,
        createdAt: new Date()
      }

      updateData.$push = { messages: systemMessage }
    }

    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      updateData
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'No changes made' }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Order updated successfully',
      order: { ...existingOrder, ...updateData }
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}