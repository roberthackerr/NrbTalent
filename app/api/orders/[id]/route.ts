// app/api/orders/[id]/route.ts
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
const orderStatusMessages = {
  accepted: {
    fr: {
      buyer: {
        title: "✅ Commande acceptée",
        message: (title: string) => `Votre commande "${title}" a été acceptée par le vendeur`
      },
      seller: {
        title: "✅ Commande acceptée",
        message: (title: string) => `Vous avez accepté la commande "${title}"`
      }
    },
    en: {
      buyer: {
        title: "✅ Order accepted",
        message: (title: string) => `Your order "${title}" has been accepted by the seller`
      },
      seller: {
        title: "✅ Order accepted",
        message: (title: string) => `You accepted order "${title}"`
      }
    },
    mg: {
      buyer: {
        title: "✅ Baiko ekena",
        message: (title: string) => `Eken'ny mpivarotra ny baikonao "${title}"`
      },
      seller: {
        title: "✅ Baiko ekena",
        message: (title: string) => `Nekenao ny baiko "${title}"`
      }
    }
  },
  inProgress: {
    fr: {
      buyer: {
        title: "🚀 Travail en cours",
        message: (title: string) => `Le travail sur "${title}" a commencé`
      },
      seller: {
        title: "🚀 Travail commencé",
        message: (title: string) => `Vous avez commencé à travailler sur "${title}"`
      }
    },
    en: {
      buyer: {
        title: "🚀 Work in progress",
        message: (title: string) => `Work on "${title}" has started`
      },
      seller: {
        title: "🚀 Work started",
        message: (title: string) => `You started working on "${title}"`
      }
    },
    mg: {
      buyer: {
        title: "🚀 Asa mitohy",
        message: (title: string) => `Nanomboka ny asa amin'ny "${title}"`
      },
      seller: {
        title: "🚀 Asa nanomboka",
        message: (title: string) => `Nanombokanao ny asa amin'ny "${title}"`
      }
    }
  },
  delivered: {
    fr: {
      buyer: {
        title: "📦 Travail livré",
        message: (title: string) => `Le vendeur a livré "${title}". Veuillez vérifier et valider.`
      },
      seller: {
        title: "📦 Travail livré",
        message: (title: string) => `Vous avez livré "${title}". En attente de validation.`
      }
    },
    en: {
      buyer: {
        title: "📦 Work delivered",
        message: (title: string) => `The seller delivered "${title}". Please review and confirm.`
      },
      seller: {
        title: "📦 Work delivered",
        message: (title: string) => `You delivered "${title}". Awaiting buyer confirmation.`
      }
    },
    mg: {
      buyer: {
        title: "📦 Asa natolotra",
        message: (title: string) => `Natolotr'ilay mpivarotra ny "${title}". Hamarino ary manatomboha.`
      },
      seller: {
        title: "📦 Asa natolotra",
        message: (title: string) => `Natolotrao ny "${title}". Miandry fanamarinana.`
      }
    }
  },
  completed: {
    fr: {
      buyer: {
        title: "🎉 Commande terminée",
        message: (title: string) => `La commande "${title}" est terminée. Merci !`
      },
      seller: {
        title: "🎉 Paiement disponible",
        message: (title: string) => `Le client a validé "${title}". Le paiement sera disponible sous 24h.`
      }
    },
    en: {
      buyer: {
        title: "🎉 Order completed",
        message: (title: string) => `Order "${title}" is complete. Thank you!`
      },
      seller: {
        title: "🎉 Payment available",
        message: (title: string) => `The buyer confirmed "${title}". Payment will be available within 24h.`
      }
    },
    mg: {
      buyer: {
        title: "🎉 Baiko vita",
        message: (title: string) => `Vita ny baiko "${title}". Misaotra!`
      },
      seller: {
        title: "🎉 Karama ho azo",
        message: (title: string) => `Namafy ny "${title}" ny mpividy. Ho azonao ny karama ao anatin'ny 24h.`
      }
    }
  },
  cancelled: {
    fr: {
      buyer: {
        title: "❌ Commande annulée",
        message: (title: string) => `La commande "${title}" a été annulée.`
      },
      seller: {
        title: "❌ Commande annulée",
        message: (title: string) => `La commande "${title}" a été annulée.`
      }
    },
    en: {
      buyer: {
        title: "❌ Order cancelled",
        message: (title: string) => `Order "${title}" has been cancelled.`
      },
      seller: {
        title: "❌ Order cancelled",
        message: (title: string) => `Order "${title}" has been cancelled.`
      }
    },
    mg: {
      buyer: {
        title: "❌ Baiko nofoanana",
        message: (title: string) => `Nofoanana ny baiko "${title}".`
      },
      seller: {
        title: "❌ Baiko nofoanana",
        message: (title: string) => `Nofoanana ny baiko "${title}".`
      }
    }
  },
  disputed: {
    fr: {
      buyer: {
        title: "⚠️ Litige ouvert",
        message: (title: string) => `Un litige a été ouvert pour "${title}". Notre équipe va examiner le dossier.`
      },
      seller: {
        title: "⚠️ Litige ouvert",
        message: (title: string) => `Un litige a été ouvert pour "${title}". Notre équipe va examiner le dossier.`
      }
    },
    en: {
      buyer: {
        title: "⚠️ Dispute opened",
        message: (title: string) => `A dispute has been opened for "${title}". Our team will review the case.`
      },
      seller: {
        title: "⚠️ Dispute opened",
        message: (title: string) => `A dispute has been opened for "${title}". Our team will review the case.`
      }
    },
    mg: {
      buyer: {
        title: "⚠️ Ady hevitra",
        message: (title: string) => `Nisokatra ny ady hevitra momba ny "${title}". Hodinihin'ny ekipanay ny raharaha.`
      },
      seller: {
        title: "⚠️ Ady hevitra",
        message: (title: string) => `Nisokatra ny ady hevitra momba ny "${title}". Hodinihin'ny ekipanay ny raharaha.`
      }
    }
  }
}

async function sendOrderStatusNotification(
  userId: string,
  status: string,
  role: 'buyer' | 'seller',
  data: any
) {
  try {
    const userLang = await getUserLanguage(userId)
    const messages = orderStatusMessages[status as keyof typeof orderStatusMessages]
    if (!messages) return null
    
    const roleMessages = messages[userLang]?.[role] ?? messages.fr[role]
    
    return await notificationService.send({
      userId,
      category: "ORDER",
      priority: status === 'disputed' ? "URGENT" : "MEDIUM",
      title: roleMessages.title,
      message: roleMessages.message(data.title),
      actionUrl: `/orders/${data.orderId}`,
      data: { 
        entityId: data.orderId, 
        entityType: "order",
        orderId: data.orderId,
        gigId: data.gigId,
        status: status,
        ...data 
      },
    })
  } catch (error) {
    console.error(`Error sending ${status} notification:`, error)
    return null
  }
}

// ─── GET - Détails d'une commande ──────────────────────────────────────────────
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    const orderId = id

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
        { $unwind: { path: '$gig', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'buyerId',
            foreignField: '_id',
            as: 'buyer'
          }
        },
        { $unwind: { path: '$buyer', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'sellerId',
            foreignField: '_id',
            as: 'seller'
          }
        },
        { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'conversations',
            localField: '_id',
            foreignField: 'orderId',
            as: 'conversation'
          }
        },
        { $unwind: { path: '$conversation', preserveNullAndEmptyArrays: true } },
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

// ─── PUT - Mettre à jour une commande ──────────────────────────────────────────
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const orderId = id

    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    let body;
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { status, message, action } = body

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const userName = (session.user as any).name

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

    const isBuyer = existingOrder.buyerId.toString() === userId.toString()
    const isSeller = existingOrder.sellerId.toString() === userId.toString()

    // Récupérer les détails du gig
    const gig = await db.collection('gigs').findOne({ _id: existingOrder.gigId })

    // Utiliser $set pour les mises à jour
    const updateFields: any = {}
    let notificationStatus: string | null = null
    let notificationRole: 'buyer' | 'seller' | null = null
    let otherUserId: string | null = null

    // Gestion des actions avec notifications
    if (action) {
      switch (action) {
        case 'accept':
          if (isSeller && existingOrder.status === 'pending') {
            updateFields.status = 'accepted'
            notificationStatus = 'accepted'
            notificationRole = 'buyer'
            otherUserId = existingOrder.buyerId.toString()
          }
          break
        
        case 'start':
          if (isSeller && existingOrder.status === 'accepted') {
            updateFields.status = 'in_progress'
            notificationStatus = 'inProgress'
            notificationRole = 'buyer'
            otherUserId = existingOrder.buyerId.toString()
          }
          break
        
        case 'deliver':
          if (isSeller && existingOrder.status === 'in_progress') {
            updateFields.status = 'delivered'
            updateFields.deliveredAt = new Date()
            notificationStatus = 'delivered'
            notificationRole = 'buyer'
            otherUserId = existingOrder.buyerId.toString()
          }
          break
        
        case 'complete':
          if (isBuyer && existingOrder.status === 'delivered') {
            updateFields.status = 'completed'
            updateFields.completedAt = new Date()
            notificationStatus = 'completed'
            notificationRole = 'seller'
            otherUserId = existingOrder.sellerId.toString()
          }
          break
        
        case 'cancel':
          if ((isBuyer || isSeller) && ['pending', 'accepted'].includes(existingOrder.status)) {
            updateFields.status = 'cancelled'
            updateFields.cancelledAt = new Date()
            updateFields.cancelledBy = userId
            notificationStatus = 'cancelled'
            notificationRole = isBuyer ? 'seller' : 'buyer'
            otherUserId = isBuyer ? existingOrder.sellerId.toString() : existingOrder.buyerId.toString()
          }
          break
        
        case 'dispute':
          if (isBuyer || isSeller) {
            updateFields.status = 'disputed'
            updateFields.disputedAt = new Date()
            updateFields.disputedBy = userId
            notificationStatus = 'disputed'
            notificationRole = isBuyer ? 'seller' : 'buyer'
            otherUserId = isBuyer ? existingOrder.sellerId.toString() : existingOrder.buyerId.toString()
          }
          break
      }
    } else if (status) {
      // Mise à jour directe du statut
      const validStatuses = ['pending', 'accepted', 'in_progress', 'delivered', 'completed', 'cancelled', 'disputed']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      
      // Vérifier la transition de statut
      if (status === 'in_progress' && existingOrder.status !== 'accepted') {
        return NextResponse.json({ error: 'Cannot start work on order that is not accepted' }, { status: 400 })
      }
      
      updateFields.status = status
      
      // Déterminer le statut de notification
      if (status === 'accepted') notificationStatus = 'accepted'
      else if (status === 'in_progress') notificationStatus = 'inProgress'
      else if (status === 'delivered') notificationStatus = 'delivered'
      else if (status === 'completed') notificationStatus = 'completed'
      else if (status === 'cancelled') notificationStatus = 'cancelled'
      else if (status === 'disputed') notificationStatus = 'disputed'
      
      if (notificationStatus) {
        notificationRole = isBuyer ? 'seller' : 'buyer'
        otherUserId = isBuyer ? existingOrder.sellerId.toString() : existingOrder.buyerId.toString()
      }
    }

    // Ajouter updatedAt
    updateFields.updatedAt = new Date()

    // Construire l'objet de mise à jour avec $set
    let updateDoc: any = {}
    if (Object.keys(updateFields).length > 0) {
      updateDoc.$set = updateFields
    }

    // Ajouter un message système si nécessaire (avec $push)
    if (message && typeof message === 'string' && message.trim()) {
      updateDoc.$push = {
        messages: {
          _id: new ObjectId(),
          senderId: userId,
          senderName: userName,
          content: message,
          isSystemMessage: true,
          createdAt: new Date()
        }
      }
    }

    // Vérifier qu'il y a des modifications
    if (Object.keys(updateDoc).length === 0) {
      return NextResponse.json({ error: 'No changes to apply' }, { status: 400 })
    }

    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      updateDoc
    )

    if (result.modifiedCount === 0 && !message) {
      return NextResponse.json({ error: 'No changes made' }, { status: 400 })
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 📢 ENVOI DES NOTIFICATIONS
    // ──────────────────────────────────────────────────────────────────────────
    if (notificationStatus && otherUserId && gig) {
      try {
        // Notification à l'autre partie
        await sendOrderStatusNotification(
          otherUserId,
          notificationStatus,
          notificationRole!,
          {
            orderId: orderId,
            gigId: existingOrder.gigId.toString(),
            title: gig.title,
            status: notificationStatus
          }
        )

        // Notification à l'utilisateur qui a fait l'action
        await sendOrderStatusNotification(
          userId.toString(),
          notificationStatus,
          isBuyer ? 'buyer' : 'seller',
          {
            orderId: orderId,
            gigId: existingOrder.gigId.toString(),
            title: gig.title,
            status: notificationStatus
          }
        )
      } catch (notifError) {
        console.error('Error sending notifications:', notifError)
      }

      // Fallback notification
      try {
        const statusNames: Record<string, { fr: string; en: string; mg: string }> = {
          accepted: { fr: 'acceptée', en: 'accepted', mg: 'ekena' },
          inProgress: { fr: 'en cours', en: 'in progress', mg: 'mitohy' },
          delivered: { fr: 'livrée', en: 'delivered', mg: 'natolotra' },
          completed: { fr: 'terminée', en: 'completed', mg: 'vita' },
          cancelled: { fr: 'annulée', en: 'cancelled', mg: 'nofoanana' },
          disputed: { fr: 'en litige', en: 'disputed', mg: 'ady hevitra' }
        }

        await db.collection("notifications").insertOne({
          userId: new ObjectId(otherUserId),
          type: `order_${notificationStatus}`,
          title: `📦 Commande ${statusNames[notificationStatus]?.fr || notificationStatus}`,
          message: `La commande "${gig.title}" a été ${statusNames[notificationStatus]?.fr || notificationStatus}`,
          data: { orderId: orderId, gigId: existingOrder.gigId.toString(), status: notificationStatus },
          createdAt: new Date(),
          read: false,
          category: "ORDER",
          priority: notificationStatus === 'disputed' ? "URGENT" : "MEDIUM"
        })
      } catch (dbError) {
        console.error('Error saving fallback notification:', dbError)
      }
    }

    // Récupérer la commande mise à jour
    const updatedOrder = await db.collection('orders').findOne({ _id: new ObjectId(orderId) })

    return NextResponse.json({ 
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}