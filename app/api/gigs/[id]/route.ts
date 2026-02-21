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
    const gigId = params.id

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
            // L'utilisateur peut voir les gigs actifs OU ses propres drafts
            $or: [
              { status: 'active' },
              session ? { 
                status: 'draft', 
                createdBy: new ObjectId((session.user as any).id) 
              } : { status: 'active' } // Les non-connectés ne voient que les actifs
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
            // Calculer les commandes complétées
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
            'reviews': 0 // On ne retourne pas tous les reviews détaillés ici
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const gigId = params.id
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
      status 
    } = body

    // Validation de l'ID
    if (!ObjectId.isValid(gigId)) {
      return NextResponse.json({ error: 'ID de service invalide' }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Vérifier que l'utilisateur est le propriétaire du gig
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

    // Mettre à jour seulement les champs fournis
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
    if (status !== undefined) updateData.status = status

    const result = await db.collection('gigs').updateOne(
      { _id: new ObjectId(gigId) },
      { $set: updateData }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Aucune modification effectuée' }, { status: 400 })
    }

    return NextResponse.json({ 
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const gigId = params.id

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

    // Supprimer le gig
    const result = await db.collection('gigs').deleteOne({
      _id: new ObjectId(gigId)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }

    // Optionnel : Supprimer aussi les reviews associées
    await db.collection('reviews').deleteMany({
      gigId: gigId
    })

    // Optionnel : Supprimer les commandes associées ou les marquer comme annulées
    await db.collection('orders').updateMany(
      { gigId: gigId },
      { $set: { status: 'cancelled' } }
    )

    return NextResponse.json({ 
      message: 'Service supprimé avec succès'
    })
  } catch (error) {
    console.error('Error deleting gig:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}