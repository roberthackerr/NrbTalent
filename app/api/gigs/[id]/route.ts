// app/api/gigs/[id]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { notificationService } from '@/services/NotificationService'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    const gigId = id

    // Validation de l'ID
    if (!ObjectId.isValid(gigId)) {
      return NextResponse.json({ error: 'ID de service invalide' }, { status: 400 })
    }

    const db = await getDatabase()

    const gig = await db.collection('gigs')
      .aggregate([
        { 
          $match: { 
            _id: new ObjectId(gigId),
            $or: [
              { status: 'active' },
              session ? { 
                status: 'draft', 
                createdBy: new ObjectId((session.user as any).id) 
              } : { status: 'active' }
            ]
          } 
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'seller'
          }
        },
        { $unwind: '$seller' },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'gigId',
            as: 'reviews'
          }
        },
        {
          $addFields: {
            rating: { $avg: '$reviews.rating' },
            reviewsCount: { $size: '$reviews' },
            ordersCount: {
              $size: {
                $filter: {
                  input: '$reviews',
                  as: 'review',
                  cond: { $ne: ['$$review.rating', null] }
                }
              }
            }
          }
        },
        {
          $project: {
            'seller.password': 0,
            'seller.email': 0,
            'seller.createdAt': 0,
            'seller.updatedAt': 0,
            'reviews': 0
          }
        }
      ])
      .next()

    if (!gig) {
      return NextResponse.json({ error: 'Service non trouvé' }, { status: 404 })
    }

    // Incrémenter le compteur de vues
    await db.collection('gigs').updateOne(
      { _id: new ObjectId(gigId) },
      { $inc: { views: 1 } }
    )

    return NextResponse.json({ gig })
  } catch (error) {
    console.error('Error fetching gig:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const gigId = id
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
      isPremium,
      isPrivate,
      status 
    } = body

    if (!ObjectId.isValid(gigId)) {
      return NextResponse.json({ error: 'ID de service invalide' }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    const existingGig = await db.collection('gigs').findOne({
      _id: new ObjectId(gigId),
      createdBy: userId
    })

    if (!existingGig) {
      return NextResponse.json({ error: 'Service non trouvé ou accès refusé' }, { status: 404 })
    }

    const updateData: any = {
      updatedAt: new Date()
    }

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (subcategory !== undefined) updateData.subcategory = subcategory
    if (tags !== undefined) updateData.tags = tags
    if (price !== undefined) updateData.price = parseFloat(price)
    if (deliveryTime !== undefined) updateData.deliveryTime = parseInt(deliveryTime)
    if (revisions !== undefined) updateData.revisions = parseInt(revisions)
    if (features !== undefined) updateData.features = features
    if (requirements !== undefined) updateData.requirements = requirements
    if (isPremium !== undefined) updateData.isPremium = isPremium
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate
    if (status !== undefined) updateData.status = status

    const result = await db.collection('gigs').updateOne(
      { _id: new ObjectId(gigId) },
      { $set: updateData }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Aucune modification effectuée' }, { status: 400 })
    }

    // 📢 NOTIFICATION DE MISE À JOUR
    try {
      const userLang = (session.user as any).language || 'fr'
      
      const notificationMessages = {
        fr: {
          title: '📝 Service mis à jour',
          message: `Votre service "${title || existingGig.title}" a été mis à jour avec succès`
        },
        en: {
          title: '📝 Gig updated',
          message: `Your gig "${title || existingGig.title}" has been updated successfully`
        },
        mg: {
          title: '📝 Serivisy nohavaozina',
          message: `Nohavaozina soa aman-tsara ny serivisy "${title || existingGig.title}"`
        }
      }

      const messages = notificationMessages[userLang as keyof typeof notificationMessages] || notificationMessages.fr

      await notificationService.send({
        userId: userId.toString(),
        category: 'SYSTEM',
        priority: 'MEDIUM',
        title: messages.title,
        message: messages.message,
        actionUrl: `/gigs/${gigId}`,
        data: {
          entityType: 'gig',
          action: 'update',
          gigId,
          gigTitle: title || existingGig.title,
          updatedFields: Object.keys(updateData).filter(k => k !== 'updatedAt'),
          timestamp: new Date().toISOString()
        },
        checkPreferences: true
      })

      console.log(`✅ Gig update notification sent to user: ${userId}`)
    } catch (notifError) {
      console.error('⚠️ Failed to send gig update notification:', notifError)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Service mis à jour avec succès',
      gig: { ...existingGig, ...updateData, _id: gigId }
    })
  } catch (error) {
    console.error('Error updating gig:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const gigId = id

    // Validation de l'ID
    if (!ObjectId.isValid(gigId)) {
      return NextResponse.json({ error: 'ID de service invalide' }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Vérifier que l'utilisateur est le propriétaire du gig
    const gig = await db.collection('gigs').findOne({
      _id: new ObjectId(gigId),
      createdBy: userId
    })

    if (!gig) {
      return NextResponse.json({ error: 'Service non trouvé ou accès refusé' }, { status: 404 })
    }

    // Sauvegarder le titre pour la notification
    const gigTitle = gig.title

    // Supprimer le gig
    const result = await db.collection('gigs').deleteOne({
      _id: new ObjectId(gigId)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }

    // Supprimer les reviews associées
    await db.collection('reviews').deleteMany({
      gigId: gigId
    })

    // Marquer les commandes associées comme annulées
    await db.collection('orders').updateMany(
      { gigId: gigId },
      { $set: { status: 'cancelled', cancelledAt: new Date() } }
    )

    // 📢 NOTIFICATION DE SUPPRESSION
    try {
      const userLang = (session.user as any).language || 'fr'
      
      const deleteMessages = {
        fr: {
          title: '🗑️ Service supprimé',
          message: `Votre service "${gigTitle}" a été supprimé avec succès`
        },
        en: {
          title: '🗑️ Service deleted',
          message: `Your service "${gigTitle}" has been deleted successfully`
        },
        mg: {
          title: '🗑️ Serivisy voafafa',
          message: `Nofafana soa aman-tsara ny serivisy "${gigTitle}"`
        }
      }

      const messages = deleteMessages[userLang as keyof typeof deleteMessages] || deleteMessages.fr

      await notificationService.send({
        userId: userId.toString(),
        category: 'SYSTEM',
        priority: 'MEDIUM',
        title: messages.title,
        message: messages.message,
        actionUrl: '/dashboard/freelance/gigs',
        data: {
          entityType: 'gig',
          action: 'delete',
          gigId,
          gigTitle,
          timestamp: new Date().toISOString()
        },
        checkPreferences: true
      })

      console.log(`✅ Gig deletion notification sent to user: ${userId}`)
    } catch (notifError) {
      console.error('⚠️ Failed to send deletion notification:', notifError)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Service supprimé avec succès'
    })
  } catch (error) {
    console.error('Error deleting gig:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}