// app/api/orders/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { notificationService } from '@/services/NotificationService'

// ─── Helpers multilingues ─────────────────────────────────────────────────────
async function getUserLanguage(userId: string): Promise<"fr" | "en" | "mg"> {
  try {
    const db = await getDatabase()
    let objectId: ObjectId
    try { objectId = new ObjectId(userId) } catch { return "fr" }
    const user = await db.collection("users").findOne(
      { _id: objectId },
      { projection: { language: 1, preferences: 1 } }
    )
    const lang = user?.language || user?.preferences?.language || "fr"
    return lang === "fr" || lang === "en" || lang === "mg" ? lang : "fr"
  } catch {
    return "fr"
  }
}

// ─── Templates de notifications ────────────────────────────────────────────────
const orderNotificationMessages = {
  orderCreated: {
    fr: {
      buyer: {
        title: "🛒 Commande créée",
        message: (title: string) => `Votre commande "${title}" a été créée avec succès`
      },
      seller: {
        title: "🛒 Nouvelle commande",
        message: (buyerName: string, title: string) => `${buyerName} a commandé "${title}"`
      }
    },
    en: {
      buyer: {
        title: "🛒 Order created",
        message: (title: string) => `Your order "${title}" has been created successfully`
      },
      seller: {
        title: "🛒 New order",
        message: (buyerName: string, title: string) => `${buyerName} ordered "${title}"`
      }
    },
    mg: {
      buyer: {
        title: "🛒 Baiko natao",
        message: (title: string) => `Vita ny baikonao "${title}"`
      },
      seller: {
        title: "🛒 Baiko vaovao",
        message: (buyerName: string, title: string) => `Nanao baiko "${title}" i ${buyerName}`
      }
    }
  },
  orderStatusChanged: {
    fr: {
      accepted: {
        title: "✅ Commande acceptée",
        message: (title: string) => `Votre commande "${title}" a été acceptée par le vendeur`
      },
      inProgress: {
        title: "🚀 Commande en cours",
        message: (title: string) => `Le travail sur "${title}" a commencé`
      },
      delivered: {
        title: "📦 Livraison en attente",
        message: (title: string) => `Le vendeur a livré "${title}". Veuillez vérifier et valider.`
      },
      completed: {
        title: "🎉 Commande terminée",
        message: (title: string) => `La commande "${title}" est terminée. Merci !`
      },
      cancelled: {
        title: "❌ Commande annulée",
        message: (title: string) => `La commande "${title}" a été annulée`
      },
      disputed: {
        title: "⚠️ Litige ouvert",
        message: (title: string) => `Un litige a été ouvert pour la commande "${title}"`
      }
    },
    en: {
      accepted: {
        title: "✅ Order accepted",
        message: (title: string) => `Your order "${title}" has been accepted by the seller`
      },
      inProgress: {
        title: "🚀 Order in progress",
        message: (title: string) => `Work on "${title}" has started`
      },
      delivered: {
        title: "📦 Delivery pending",
        message: (title: string) => `The seller has delivered "${title}". Please review and confirm.`
      },
      completed: {
        title: "🎉 Order completed",
        message: (title: string) => `Order "${title}" is complete. Thank you!`
      },
      cancelled: {
        title: "❌ Order cancelled",
        message: (title: string) => `Order "${title}" has been cancelled`
      },
      disputed: {
        title: "⚠️ Dispute opened",
        message: (title: string) => `A dispute has been opened for order "${title}"`
      }
    },
    mg: {
      accepted: {
        title: "✅ Baiko ekena",
        message: (title: string) => `Eken'ny mpivarotra ny baikonao "${title}"`
      },
      inProgress: {
        title: "🚀 Baiko mitohy",
        message: (title: string) => `Nanomboka ny asa amin'ny "${title}"`
      },
      delivered: {
        title: "📦 Fanaterana miandry",
        message: (title: string) => `Naterin'ny mpivarotra ny "${title}". Hamarino ary manatomboha.`
      },
      completed: {
        title: "🎉 Baiko vita",
        message: (title: string) => `Vita ny baiko "${title}". Misaotra!`
      },
      cancelled: {
        title: "❌ Baiko nofoanana",
        message: (title: string) => `Nofoanana ny baiko "${title}"`
      },
      disputed: {
        title: "⚠️ Ady hevitra",
        message: (title: string) => `Nisokatra ny ady hevitra momba ny baiko "${title}"`
      }
    }
  },
  orderDelivered: {
    fr: {
      buyer: {
        title: "📦 Commande livrée",
        message: (title: string) => `La commande "${title}" a été livrée. Vérifiez et validez.`
      },
      seller: {
        title: "📦 Livraison effectuée",
        message: (title: string) => `Vous avez marqué "${title}" comme livré. En attente de validation.`
      }
    },
    en: {
      buyer: {
        title: "📦 Order delivered",
        message: (title: string) => `Order "${title}" has been delivered. Please review and confirm.`
      },
      seller: {
        title: "📦 Delivery completed",
        message: (title: string) => `You marked "${title}" as delivered. Awaiting buyer confirmation.`
      }
    },
    mg: {
      buyer: {
        title: "📦 Baiko natolotra",
        message: (title: string) => `Natolotra ny baiko "${title}". Hamarino ary manatomboha.`
      },
      seller: {
        title: "📦 Fanaterana vita",
        message: (title: string) => `Namarika ny "${title}" ho natolotra ianao. Miandry fanamarinana.`
      }
    }
  },
  orderCompleted: {
    fr: {
      buyer: {
        title: "🎉 Félicitations !",
        message: (title: string) => `La commande "${title}" est terminée. N'hésitez pas à laisser un avis !`
      },
      seller: {
        title: "🎉 Travail terminé",
        message: (title: string) => `Le client a validé la commande "${title}". Paiement disponible sous 24h.`
      }
    },
    en: {
      buyer: {
        title: "🎉 Congratulations!",
        message: (title: string) => `Order "${title}" is complete. Don't forget to leave a review!`
      },
      seller: {
        title: "🎉 Work completed",
        message: (title: string) => `The buyer confirmed order "${title}". Payment available within 24h.`
      }
    },
    mg: {
      buyer: {
        title: "🎉 Arahabaina!",
        message: (title: string) => `Vita ny baiko "${title}". Aza adino ny mamela hevitra!`
      },
      seller: {
        title: "🎉 Asa vita",
        message: (title: string) => `Namafy ny baiko "${title}" ny mpividy. Ho azonao ny karama ao anatin'ny 24h.`
      }
    }
  },
  orderCancelled: {
    fr: {
      buyer: {
        title: "❌ Commande annulée",
        message: (title: string) => `La commande "${title}" a été annulée. Le remboursement sera effectué sous 3-5 jours.`
      },
      seller: {
        title: "❌ Commande annulée",
        message: (title: string) => `La commande "${title}" a été annulée par l'acheteur.`
      }
    },
    en: {
      buyer: {
        title: "❌ Order cancelled",
        message: (title: string) => `Order "${title}" has been cancelled. Refund will be processed in 3-5 days.`
      },
      seller: {
        title: "❌ Order cancelled",
        message: (title: string) => `Order "${title}" has been cancelled by the buyer.`
      }
    },
    mg: {
      buyer: {
        title: "❌ Baiko nofoanana",
        message: (title: string) => `Nofoanana ny baiko "${title}". Ho averina ny volanao ao anatin'ny 3-5 andro.`
      },
      seller: {
        title: "❌ Baiko nofoanana",
        message: (title: string) => `Nofoanani ny mpividy ny baiko "${title}".`
      }
    }
  }
}

async function sendOrderNotification(
  userId: string,
  templateKey: keyof typeof orderNotificationMessages,
  role: 'buyer' | 'seller',
  data: any
) {
  try {
    const userLang = await getUserLanguage(userId)
    const messages = orderNotificationMessages[templateKey] as any
    const roleMessages = messages[userLang]?.[role] ?? messages.fr[role]
    
    let title = roleMessages.title
    let message = typeof roleMessages.message === 'function'
      ? roleMessages.message(data.title, data.buyerName)
      : roleMessages.message
    
    return await notificationService.send({
      userId,
      category: "ORDER",
      priority: templateKey === 'orderStatusChanged' && data.status === 'disputed' ? "URGENT" : "MEDIUM",
      title,
      message,
      actionUrl: `/orders/${data.orderId}`,
      data: { 
        entityId: data.orderId, 
        entityType: "order",
        orderId: data.orderId,
        gigId: data.gigId,
        status: data.status,
        ...data 
      },
    })
  } catch (error) {
    console.error("Error sending order notification:", error)
    return null
  }
}

// ─── POST - Créer une commande ─────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { gigId, package: gigPackage, requirements } = await request.json()
    const buyerId = new ObjectId((session.user as any).id)
    const buyerName = (session.user as any).name

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

    // Vérifier que l'acheteur n'est pas le vendeur
    if (gig.createdBy.toString() === buyerId.toString()) {
      return NextResponse.json({ error: 'You cannot order your own gig' }, { status: 400 })
    }

    // Calculer la date de livraison
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
    const orderId = result.insertedId.toString()

    // Créer une conversation entre l'acheteur et le vendeur
    const conversation = await db.collection('conversations').findOne({
      participants: { 
        $all: [buyerId, gig.createdBy],
        $size: 2
      }
    })

    if (!conversation) {
      await db.collection('conversations').insertOne({
        participants: [buyerId, gig.createdBy],
        orderId: new ObjectId(orderId),
        createdAt: new Date(),
        updatedAt: new Date(),
        type: 'order'
      })
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 📢 ENVOI DES NOTIFICATIONS MULTILINGUES
    // ──────────────────────────────────────────────────────────────────────────
    
    // 1. Notification à l'acheteur
    await sendOrderNotification(
      buyerId.toString(),
      "orderCreated",
      "buyer",
      {
        orderId: orderId,
        gigId: gigId,
        title: gig.title,
        buyerName: buyerName
      }
    )

    // 2. Notification au vendeur
    await sendOrderNotification(
      gig.createdBy.toString(),
      "orderCreated",
      "seller",
      {
        orderId: orderId,
        gigId: gigId,
        title: gig.title,
        buyerName: buyerName
      }
    )

    // 3. Notifications fallback dans MongoDB
    await db.collection("notifications").insertMany([
      {
        userId: buyerId,
        type: "order_created",
        title: "🛒 Commande créée",
        message: `Votre commande "${gig.title}" a été créée avec succès`,
        data: { orderId: orderId, gigId: gigId },
        createdAt: new Date(),
        read: false,
        category: "ORDER",
        priority: "MEDIUM"
      },
      {
        userId: gig.createdBy,
        type: "new_order",
        title: "🛒 Nouvelle commande",
        message: `${buyerName} a commandé "${gig.title}"`,
        data: { orderId: orderId, gigId: gigId, buyerId: buyerId.toString() },
        createdAt: new Date(),
        read: false,
        category: "ORDER",
        priority: "MEDIUM"
      }
    ])

    console.log(`✅ Order ${orderId} created - Notifications sent to buyer and seller`)

    return NextResponse.json({ 
      order: { ...order, _id: result.insertedId },
      message: 'Order created successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── GET - Lister les commandes ────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'buyer'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const skip = (page - 1) * limit

    const filter: any = role === 'buyer' 
      ? { buyerId: userId }
      : { sellerId: userId }

    if (status && status !== 'all') {
      filter.status = status
    }

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

// ─── PUT - Mettre à jour le statut d'une commande ──────────────────────────────
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, status: newStatus, action } = await request.json()

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const userName = (session.user as any).name

    const order = await db.collection('orders').findOne({ 
      _id: new ObjectId(orderId) 
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const isBuyer = order.buyerId.toString() === userId.toString()
    const isSeller = order.sellerId.toString() === userId.toString()

    let updateData: any = { status: newStatus, updatedAt: new Date() }
    let notificationRole: 'buyer' | 'seller' | null = null
    let notificationTemplate: keyof typeof orderNotificationMessages = 'orderStatusChanged'

    // Récupérer les détails du gig
    const gig = await db.collection('gigs').findOne({ _id: order.gigId })

    switch (action) {
      case 'accept':
        if (isSeller && order.status === 'pending') {
          updateData.status = 'in_progress'
          notificationRole = 'buyer'
          notificationTemplate = 'orderStatusChanged'
        }
        break
      
      case 'start':
        if (isSeller && order.status === 'accepted') {
          updateData.status = 'in_progress'
          notificationRole = 'buyer'
          notificationTemplate = 'orderStatusChanged'
        }
        break
      
      case 'deliver':
        if (isSeller && order.status === 'in_progress') {
          updateData.status = 'delivered'
          updateData.deliveredAt = new Date()
          notificationRole = 'buyer'
          notificationTemplate = 'orderDelivered'
        }
        break
      
      case 'complete':
        if (isBuyer && order.status === 'delivered') {
          updateData.status = 'completed'
          updateData.completedAt = new Date()
          notificationRole = 'seller'
          notificationTemplate = 'orderCompleted'
        }
        break
      
      case 'cancel':
        if ((isBuyer && order.status === 'pending') || (isSeller && order.status === 'pending')) {
          updateData.status = 'cancelled'
          updateData.cancelledAt = new Date()
          updateData.cancelledBy = userId
          notificationRole = isBuyer ? 'seller' : 'buyer'
          notificationTemplate = 'orderCancelled'
        }
        break
      
      case 'dispute':
        if (isBuyer || isSeller) {
          updateData.status = 'disputed'
          updateData.disputedAt = new Date()
          updateData.disputedBy = userId
          notificationRole = isBuyer ? 'seller' : 'buyer'
          notificationTemplate = 'orderStatusChanged'
        }
        break
    }

    await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      { $set: updateData }
    )

    // Envoyer notification si nécessaire
    if (notificationRole && gig) {
      const otherUserId = notificationRole === 'buyer' ? order.buyerId : order.sellerId
      
      await sendOrderNotification(
        otherUserId.toString(),
        notificationTemplate,
        notificationRole,
        {
          orderId: orderId,
          gigId: order.gigId.toString(),
          title: gig.title,
          buyerName: userName,
          status: newStatus
        }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Order updated successfully' 
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}