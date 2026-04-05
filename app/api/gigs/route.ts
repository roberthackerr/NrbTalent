// app/api/gigs/route.ts
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
const gigNotificationMessages = {
  gigCreated: {
    fr: {
      title: "📦 Service créé",
      message: (title: string) => `Votre service "${title}" a été publié avec succès`
    },
    en: {
      title: "📦 Gig created",
      message: (title: string) => `Your gig "${title}" has been published successfully`
    },
    mg: {
      title: "📦 Asa natao",
      message: (title: string) => `Nivoaka soa aman-tsara ny asanao "${title}"`
    }
  },
  gigPublished: {
    fr: {
      title: "🚀 Service publié",
      message: (title: string) => `Votre service "${title}" est maintenant visible par tous les clients`
    },
    en: {
      title: "🚀 Gig published",
      message: (title: string) => `Your gig "${title}" is now visible to all clients`
    },
    mg: {
      title: "🚀 Asa navoaka",
      message: (title: string) => `Hitan'ny mpanjifa rehetra ny asanao "${title}"`
    }
  },
  gigUpdated: {
    fr: {
      title: "✏️ Service mis à jour",
      message: (title: string) => `Votre service "${title}" a été mis à jour`
    },
    en: {
      title: "✏️ Gig updated",
      message: (title: string) => `Your gig "${title}" has been updated`
    },
    mg: {
      title: "✏️ Asa nohavaozina",
      message: (title: string) => `Nohavaozina ny asanao "${title}"`
    }
  },
  gigDeleted: {
    fr: {
      title: "🗑️ Service supprimé",
      message: (title: string) => `Votre service "${title}" a été supprimé`
    },
    en: {
      title: "🗑️ Gig deleted",
      message: (title: string) => `Your gig "${title}" has been deleted`
    },
    mg: {
      title: "🗑️ Asa voafafa",
      message: (title: string) => `Nofafana ny asanao "${title}"`
    }
  },
  newOrder: {
    fr: {
      title: "🛒 Nouvelle commande",
      message: (gigTitle: string, buyerName: string) => `${buyerName} a commandé "${gigTitle}"`
    },
    en: {
      title: "🛒 New order",
      message: (gigTitle: string, buyerName: string) => `${buyerName} ordered "${gigTitle}"`
    },
    mg: {
      title: "🛒 Baiko vaovao",
      message: (gigTitle: string, buyerName: string) => `Nividy "${gigTitle}" i ${buyerName}`
    }
  }
}

async function sendGigNotification(
  userId: string,
  templateKey: keyof typeof gigNotificationMessages,
  data: any
) {
  try {
    const userLang = await getUserLanguage(userId)
    const messages = gigNotificationMessages[templateKey] as any
    const localeMessages = messages[userLang] ?? messages.fr
    
    let title = localeMessages.title
    let message = typeof localeMessages.message === 'function'
      ? localeMessages.message(data.title, data.buyerName)
      : localeMessages.message
    
    return await notificationService.send({
      userId,
      category: "ORDER",
      priority: "MEDIUM",
      title,
      message,
      actionUrl: `/gigs/${data.gigId}`,
      data: { 
        entityId: data.gigId, 
        entityType: "gig",
        ...data 
      },
    })
  } catch (error) {
    console.error("Error sending gig notification:", error)
    return null
  }
}

// ─── GET - Lister les services ─────────────────────────────────────────────────
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
      page, limit, category, search, minPrice, maxPrice, sortBy
    })

    const db = await getDatabase()

    const totalGigs = await db.collection('gigs').countDocuments({})
    console.log('📊 Total gigs in database:', totalGigs)

    const activeGigs = await db.collection('gigs').countDocuments({ status: 'active' })
    console.log('✅ Active gigs:', activeGigs)

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
    }
    
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = parseInt(minPrice)
      if (maxPrice) filter.price.$lte = parseInt(maxPrice)
    }

    const sort: any = {}
    if (sortBy === 'price') sort.price = 1
    else if (sortBy === 'price_desc') sort.price = -1
    else if (sortBy === 'rating') sort.rating = -1
    else sort.createdAt = -1

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

// ─── POST - Créer un service ───────────────────────────────────────────────────
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
      images
    } = body

    // Validation
    if (!title || !description || !category || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const userName = (session.user as any).name

    // Vérifier si l'utilisateur est un freelance
    const user = await db.collection('users').findOne({ _id: userId })
    if (user?.role !== 'freelance' && user?.role !== 'freelancer') {
      return NextResponse.json({ 
        error: 'Only freelancers can create gigs' 
      }, { status: 403 })
    }

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
      features: features?.filter((f: string) => f.trim() !== "") || [],
      requirements: requirements?.filter((r: string) => r.trim() !== "") || [],
      images: images || [],
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
    const gigId = result.insertedId.toString()

    // 📢 Envoyer notification au créateur
    await sendGigNotification(
      userId.toString(),
      "gigCreated",
      {
        gigId: gigId,
        title: title
      }
    )

    // Fallback notification
    await db.collection("notifications").insertOne({
      userId: userId,
      type: "gig_created",
      title: "📦 Service créé",
      message: `Votre service "${title}" a été publié avec succès`,
      data: { gigId: gigId },
      createdAt: new Date(),
      read: false,
      category: "ORDER",
      priority: "MEDIUM"
    })

    // Optionnel: Notifier les clients intéressés par cette catégorie
    try {
      const interestedClients = await db.collection('users')
        .find({
          role: 'client',
          'preferences.notifications.newGigs': { $ne: false },
          'preferences.categories': { $in: [category] }
        })
        .project({ _id: 1 })
        .limit(50)
        .toArray()

      if (interestedClients.length > 0) {
        await Promise.all(
          interestedClients.map(client => 
            sendGigNotification(
              client._id.toString(),
              "gigPublished",
              {
                gigId: gigId,
                title: title,
                category: category
              }
            )
          )
        )
        console.log(`📢 Notified ${interestedClients.length} interested clients about new gig`)
      }
    } catch (err) {
      console.error('⚠️ Failed to notify interested clients:', err)
    }

    return NextResponse.json({ 
      gig: { 
        ...gig, 
        _id: result.insertedId,
        images: gig.images
      },
      message: 'Gig created successfully' 
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating gig:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PUT - Mettre à jour un service ────────────────────────────────────────────
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { gigId, ...updates } = body

    if (!gigId || !ObjectId.isValid(gigId)) {
      return NextResponse.json({ error: 'Invalid gig ID' }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    const existingGig = await db.collection('gigs').findOne({ 
      _id: new ObjectId(gigId) 
    })

    if (!existingGig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 })
    }

    if (existingGig.createdBy.toString() !== userId.toString()) {
      return NextResponse.json({ error: 'Unauthorized to update this gig' }, { status: 403 })
    }

    const updateData = {
      ...updates,
      updatedAt: new Date()
    }

    await db.collection('gigs').updateOne(
      { _id: new ObjectId(gigId) },
      { $set: updateData }
    )

    // 📢 Notifier le créateur de la mise à jour
    await sendGigNotification(
      userId.toString(),
      "gigUpdated",
      {
        gigId: gigId,
        title: existingGig.title
      }
    )

    await db.collection("notifications").insertOne({
      userId: userId,
      type: "gig_updated",
      title: "✏️ Service mis à jour",
      message: `Votre service "${existingGig.title}" a été mis à jour`,
      data: { gigId: gigId },
      createdAt: new Date(),
      read: false,
      category: "ORDER",
      priority: "LOW"
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Gig updated successfully' 
    })
  } catch (error) {
    console.error('Error updating gig:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE - Supprimer un service ─────────────────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const gigId = searchParams.get('id')

    if (!gigId || !ObjectId.isValid(gigId)) {
      return NextResponse.json({ error: 'Invalid gig ID' }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    const existingGig = await db.collection('gigs').findOne({ 
      _id: new ObjectId(gigId) 
    })

    if (!existingGig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 })
    }

    if (existingGig.createdBy.toString() !== userId.toString()) {
      return NextResponse.json({ error: 'Unauthorized to delete this gig' }, { status: 403 })
    }

    // Soft delete - marquer comme supprimé plutôt que supprimer définitivement
    await db.collection('gigs').updateOne(
      { _id: new ObjectId(gigId) },
      { 
        $set: { 
          status: 'deleted',
          isActive: false,
          deletedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    )

    // 📢 Notifier le créateur de la suppression
    await sendGigNotification(
      userId.toString(),
      "gigDeleted",
      {
        gigId: gigId,
        title: existingGig.title
      }
    )

    await db.collection("notifications").insertOne({
      userId: userId,
      type: "gig_deleted",
      title: "🗑️ Service supprimé",
      message: `Votre service "${existingGig.title}" a été supprimé`,
      data: { gigId: gigId },
      createdAt: new Date(),
      read: false,
      category: "ORDER",
      priority: "MEDIUM"
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Gig deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting gig:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}