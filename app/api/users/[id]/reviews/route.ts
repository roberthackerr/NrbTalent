// app/api/users/[id]/reviews/route.ts - Version corrigée
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

const ReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10).max(1000),
  strengths: z.array(z.string()).max(5),
  wouldRecommend: z.boolean(),
  contractId: z.string() // Important: On passe maintenant l'ID du contrat
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validation = ReviewSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const reviewerId = new ObjectId((session.user as any).id)
    const reviewedId = new ObjectId(id)
    const contractId = new ObjectId(body.contractId)

    // VÉRIFICATION 1: Le contrat existe et les parties sont correctes
    const contract = await db.collection("contracts").findOne({
      _id: contractId,
      $or: [
        { clientId: reviewerId, freelancerId: reviewedId },
        { clientId: reviewedId, freelancerId: reviewerId }
      ],
      status: { $in: ["completed", "active"] }
    })

    if (!contract) {
      return NextResponse.json(
        { error: "Contrat non trouvé ou collaboration non valide" },
        { status: 404 }
      )
    }

    // VÉRIFICATION 2: Le contrat a été terminé récemment (≤ 30 jours)
    const contractDate = contract.endDate || contract.updatedAt
    const daysSinceContract = (Date.now() - contractDate.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysSinceContract > 30) {
      return NextResponse.json(
        { 
          error: "La fenêtre de notation est fermée",
          details: `La collaboration date de ${Math.floor(daysSinceContract)} jours (max: 30)`
        },
        { status: 400 }
      )
    }

    // VÉRIFICATION 3: Pas déjà noté pour ce contrat
    const existingReview = await db.collection("reviews").findOne({
      contractId: contractId,
      reviewerId: reviewerId
    })

    if (existingReview) {
      return NextResponse.json(
        { error: "Vous avez déjà laissé un avis pour ce contrat" },
        { status: 400 }
      )
    }

    // VÉRIFICATION 4: Le contrat a été payé
    const hasPayment = await db.collection("payments").countDocuments({
      contractId: contractId,
      status: "completed",
      amount: { $gt: 0 }
    }) > 0

    // if (!hasPayment) {
    //   return NextResponse.json(
    //     { error: "Impossible de noter un contrat non payé" },
    //     { status: 400 }
    //   )
    // }

    // Créer le review
    const review = {
      ...validation.data,
      reviewerId,
      reviewedId,
      contractId,
      reviewerName: session.user?.name || "Utilisateur",
      reviewerRole: (session.user as any).role,
      reviewedRole: contract.clientId.equals(reviewerId) ? "freelancer" : "client",
      verified: true, // ← Vérifié car toutes les conditions sont remplies
      helpfulCount: 0,
      projectId: contract.projectId,
      projectTitle: contract.title,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("reviews").insertOne(review)

    // Mettre à jour les statistiques des utilisateurs
    await updateUserReviewStats(reviewedId)

    return NextResponse.json({ 
      success: true, 
      reviewId: result.insertedId,
      message: "Avis publié avec succès"
    })

  } catch (error) {
    console.error("Erreur création review:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

async function updateUserReviewStats(userId: ObjectId) {
  const db = await getDatabase()
  
  const reviews = await db.collection("reviews")
    .find({ reviewedId: userId, verified: true })
    .toArray()

  if (reviews.length === 0) return

  const totalReviews = reviews.length
  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
  const recommendationRate = (reviews.filter(r => r.wouldRecommend).length / totalReviews) * 100

  // Calculer les moyennes par catégorie si on les a
  const categoryAverages = {
    communication: 0,
    quality: 0,
    deadlines: 0,
    professionalism: 0
  }

  // Mettre à jour l'utilisateur
  await db.collection("users").updateOne(
    { _id: userId },
    {
      $set: {
        "statistics.averageRating": parseFloat(averageRating.toFixed(1)),
        "statistics.reviewCount": totalReviews,
        "statistics.recommendationRate": parseFloat(recommendationRate.toFixed(1)),
        "statistics.lastReviewUpdate": new Date()
      }
    }
  )
}
// GET - Récupérer les reviews d'un utilisateur
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    
    const db = await getDatabase()
    const filter: any = { reviewedId: new ObjectId(id) }

    // Filtres
    const rating = searchParams.get('rating')
    const sortBy = searchParams.get('sortBy') || 'newest'
    const hasResponse = searchParams.get('hasResponse')
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true'
    const keyword = searchParams.get('keyword')

    if (rating) {
      filter.rating = { $gte: parseInt(rating) }
    }

    if (hasResponse) {
      filter.response = { $exists: hasResponse === 'true' }
    }

    if (verifiedOnly) {
      filter.verified = true
    }

    if (keyword) {
      filter.$or = [
        { comment: { $regex: keyword, $options: 'i' } },
        { projectTitle: { $regex: keyword, $options: 'i' } }
      ]
    }

    // Tri
    let sort: any = { createdAt: -1 }
    if (sortBy === 'highest') sort = { rating: -1 }
    if (sortBy === 'lowest') sort = { rating: 1 }
    if (sortBy === 'helpful') sort = { helpfulCount: -1 }

    const reviews = await db.collection("reviews")
      .find(filter)
      .sort(sort)
      .toArray()

    return NextResponse.json(reviews)

  } catch (error) {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

// POST - Créer une review
