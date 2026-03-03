 // app/api/users/[id]/reviews/can-review/route.ts

// app/api/users/[id]/reviews/can-review/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params
    const reviewerId = (session.user as any).id
    const reviewedId = id

    console.log("🔍 Vérification review (relaxée):", { reviewerId, reviewedId })

    const db = await getDatabase()
    
    // Vérification 1: Est-ce que c'est la même personne ?
    if (reviewerId === reviewedId) {
      return NextResponse.json({
        canReview: false,
        reason: "Vous ne pouvez pas vous noter vous-même",
        code: "SELF_REVIEW"
      })
    }

    // Vérification relaxée: Y a-t-il une collaboration quelconque entre eux ?
    // On cherche plus largement pour voir s'il y a eu interaction
    const collaborationExists = await db.collection("contracts").findOne({
      $or: [
        {
          clientId: new ObjectId(reviewerId),
          freelancerId: new ObjectId(reviewedId)
        },
        {
          clientId: new ObjectId(reviewedId),
          freelancerId: new ObjectId(reviewerId)
        }
      ]
    })

    console.log("🤝 Collaboration existante?:", !!collaborationExists)

    // Même si pas de contrat, on vérifie s'il y a eu d'autres interactions
    if (!collaborationExists) {
      // Vérifier s'il y a eu des conversations, des soumissions, etc.
      const hasMessages = await db.collection("messages").countDocuments({
        $or: [
          { senderId: reviewerId, receiverId: reviewedId },
          { senderId: reviewedId, receiverId: reviewerId }
        ]
      }) > 0

      const hasProposals = await db.collection("proposals").countDocuments({
        freelancerId: reviewerId,
        "project.clientId": reviewedId
      }) > 0

      console.log("💬 Interactions:", { hasMessages, hasProposals })

      if (!hasMessages && !hasProposals) {
        return NextResponse.json({
          canReview: false,
          reason: "Vous n'avez pas encore collaboré avec cette personne",
          code: "NO_COLLABORATION",
          suggestions: [
            "Envoyez un message pour discuter",
            "Soumettez une proposition si elle a des projets"
          ]
        })
      }

      // Permettre la review même sans contrat formel si interaction significative
      const interactionData = {
        hasMessages,
        hasProposals,
        interactionType: hasProposals ? "proposal" : "message"
      }

      return NextResponse.json({
        canReview: true,
        reason: "Interaction détectée, vous pouvez laisser un avis",
        code: "INTERACTION_DETECTED",
        interactionData,
        isInformalReview: true // Marqueur que ce n'est pas pour un contrat formel
      })
    }

    // Si contrat existe, vérifications plus souples
    const contracts = await db.collection("contracts").find({
      $or: [
        { clientId: new ObjectId(reviewerId), freelancerId: new ObjectId(reviewedId) },
        { clientId: new ObjectId(reviewedId), freelancerId: new ObjectId(reviewerId) }
      ]
    }).toArray()

    console.log("📜 Contrats trouvés:", contracts.length)

    // Vérification 2: Y a-t-il déjà un avis récent ?
    const existingReviews = await db.collection("reviews").find({
      reviewerId: new ObjectId(reviewerId),
      reviewedId: new ObjectId(reviewedId)
    }).toArray()

    console.log("📝 Reviews existants:", existingReviews.length)

    if (existingReviews.length > 0) {
      const lastReview = existingReviews[0]
      const daysSinceLastReview = Math.floor(
        (Date.now() - lastReview.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Permettre une nouvelle review après 90 jours (au lieu d'empêcher complètement)
      if (daysSinceLastReview < 90) {
        return NextResponse.json({
          canReview: false,
          reason: `Vous avez déjà laissé un avis il y a ${daysSinceLastReview} jours`,
          code: "REVIEW_TOO_RECENT",
          existingReviewId: lastReview._id,
          daysSinceLastReview,
          canReviewAgainIn: 90 - daysSinceLastReview
        })
      }

      // Permettre un nouvel avis après 90 jours
      return NextResponse.json({
        canReview: true,
        reason: `Vous pouvez mettre à jour votre avis précédent (${daysSinceLastReview} jours)`,
        code: "UPDATE_REVIEW",
        existingReviewId: lastReview._id,
        isUpdate: true
      })
    }

    // Sélectionner le contrat le plus récent
    const latestContract = contracts.sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    )[0]

    // Vérifications relaxées sur le contrat
    const contractStatus = latestContract.status
    
    // Permettre les reviews même sur contrats actifs ou annulés
    const allowedStatuses = ["active", "completed", "cancelled", "paused"]
    
    if (!allowedStatuses.includes(contractStatus)) {
      return NextResponse.json({
        canReview: false,
        reason: `Le contrat est en statut "${contractStatus}"`,
        code: "CONTRACT_STATUS_INVALID",
        contractStatus
      })
    }

    // Vérifier si le contrat a au moins commencé
    const contractStartDate = latestContract.startDate
    if (contractStartDate && contractStartDate > new Date()) {
      return NextResponse.json({
        canReview: false,
        reason: "Le contrat n'a pas encore commencé",
        code: "CONTRACT_NOT_STARTED",
        startDate: contractStartDate
      })
    }

    // Pour les contrats actifs, vérifier qu'au moins quelques jours se sont écoulés
    if (contractStatus === "active") {
      const daysActive = Math.floor(
        (Date.now() - contractStartDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysActive < 1) {
        return NextResponse.json({
          canReview: false,
          reason: "Attendez au moins un jour de collaboration",
          code: "CONTRACT_TOO_NEW",
          daysActive
        })
      }
    }

    // Pour les contrats terminés, on est plus souple sur la date
    if (contractStatus === "completed") {
      const completedDate = latestContract.endDate || latestContract.updatedAt
      const daysSinceCompletion = Math.floor(
        (Date.now() - completedDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      // Permettre jusqu'à 180 jours après complétion (au lieu de 30)
      if (daysSinceCompletion > 180) {
        return NextResponse.json({
          canReview: false,
          reason: `La collaboration date de plus de 6 mois (${daysSinceCompletion} jours)`,
          code: "CONTRACT_TOO_OLD",
          daysSinceCompletion,
          maxDaysAllowed: 180
        })
      }
    }

    // Vérification optionnelle des paiements (pas bloquant)
    const payments = await db.collection("payments").find({
      contractId: latestContract._id,
      status: { $in: ["completed", "pending", "processing"] }
    }).toArray()

    const hasPayments = payments.length > 0
    
    if (!hasPayments) {
      // Juste un warning, pas un blocage
      console.log("⚠️ Aucun paiement détecté, mais review autorisée")
    }

    // Si toutes les vérifications passent
    return NextResponse.json({
      canReview: true,
      reason: "Vous pouvez laisser un avis",
      code: "CAN_REVIEW",
      contract: {
        id: latestContract._id.toString(),
        title: latestContract.title,
        status: latestContract.status,
        type: latestContract.type,
        amount: latestContract.amount,
        currency: latestContract.currency,
        startDate: latestContract.startDate,
        endDate: latestContract.endDate,
        duration: latestContract.duration
      },
      role: latestContract.clientId.toString() === reviewerId ? "client" : "freelancer",
      collaborationInfo: {
        withName: session.user?.name,
        otherName: latestContract.clientId.toString() === reviewerId 
          ? (await db.collection("users").findOne({ _id: latestContract.freelancerId }))?.name
          : (await db.collection("users").findOne({ _id: latestContract.clientId }))?.name,
        daysSinceStart: latestContract.startDate 
          ? Math.floor((Date.now() - latestContract.startDate.getTime()) / (1000 * 60 * 60 * 24))
          : null,
        hasPayments,
        isFormalContract: true
      },
      warnings: !hasPayments ? ["Aucun paiement détecté pour ce contrat"] : []
    })

  } catch (error) {
    console.error("❌ Erreur vérification review:", error)
    return NextResponse.json({ 
      error: "Erreur interne",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
// import { NextResponse } from "next/server"
// import { getServerSession } from "next-auth"
// import { authOptions } from "@/lib/auth"
// import { getDatabase } from "@/lib/mongodb"
// import { ObjectId } from "mongodb"

// export async function GET(
//   request: Request,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const session = await getServerSession(authOptions)
//     if (!session) {
//       return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
//     }

//     const { id } = await params
//     const reviewerId = (session.user as any).id
//     const reviewedId = id

//     console.log("🔍 Vérification review:", { reviewerId, reviewedId })

//     const db = await getDatabase()
    
//     // Vérification 1: Est-ce que c'est la même personne ?
//     if (reviewerId === reviewedId) {
//       return NextResponse.json({
//         canReview: false,
//         reason: "Vous ne pouvez pas vous noter vous-même"
//       })
//     }

//     // Vérification 2: Y a-t-il un contrat entre eux ?
//     const contracts = await db.collection("contracts").find({
//       $or: [
//         {
//           clientId: new ObjectId(reviewerId),
//           freelancerId: new ObjectId(reviewedId),
//           status: { $in: ["completed", "active"] }
//         },
//         {
//           clientId: new ObjectId(reviewedId),
//           freelancerId: new ObjectId(reviewerId),
//           status: { $in: ["completed", "active"] }
//         }
//       ]
//     }).toArray()

//     console.log("📜 Contrats trouvés:", contracts.length)

//     if (contracts.length === 0) {
//       return NextResponse.json({
//         canReview: false,
//         reason: "Vous devez avoir eu un contrat avec cette personne pour laisser un avis"
//       })
//     }

//     // Vérification 3: Le contrat a-t-il été terminé récemment ?
//     const recentContracts = contracts.filter(contract => {
//       // Vérifier si le contrat a été complété dans les 30 derniers jours
//       const completedDate = contract.endDate || contract.updatedAt
//       const daysSinceCompletion = (Date.now() - completedDate.getTime()) / (1000 * 60 * 60 * 24)
//       return daysSinceCompletion <= 30
//     })

//     if (recentContracts.length === 0) {
//       const oldestContract = contracts[0]
//       const completedDate = oldestContract.endDate || oldestContract.updatedAt
//       const daysSinceCompletion = Math.floor((Date.now() - completedDate.getTime()) / (1000 * 60 * 60 * 24))
      
//       return NextResponse.json({
//         canReview: false,
//         reason: `Votre collaboration date de plus de 30 jours (${daysSinceCompletion} jours)`,
//         daysSinceCompletion
//       })
//     }

//     // Vérification 4: Y a-t-il déjà un avis pour ce contrat ?
//     const existingReviews = await db.collection("reviews").find({
//       reviewerId: new ObjectId(reviewerId),
//       reviewedId: new ObjectId(reviewedId),
//       contractId: { $in: recentContracts.map(c => c._id) }
//     }).toArray()

//     console.log("📝 Reviews existants:", existingReviews.length)

//     if (existingReviews.length > 0) {
//       return NextResponse.json({
//         canReview: false,
//         reason: "Vous avez déjà laissé un avis pour cette collaboration",
//         existingReviewId: existingReviews[0]._id
//       })
//     }

//     // Vérification 5: Le contrat a-t-il été payé ?
//     const hasPayments = await db.collection("payments").countDocuments({
//       contractId: { $in: recentContracts.map(c => c._id) },
//       status: "completed",
//       amount: { $gt: 0 }
//     }) > 0

//     if (!hasPayments) {
//       return NextResponse.json({
//         canReview: false,
//         reason: "Le contrat doit avoir été payé pour laisser un avis"
//       })
//     }

//     // Si toutes les vérifications passent
//     const contract = recentContracts[0]
    
//     return NextResponse.json({
//       canReview: true,
//       contract: {
//         id: contract._id.toString(),
//         title: contract.title,
//         type: contract.type,
//         amount: contract.amount,
//         currency: contract.currency,
//         startDate: contract.startDate,
//         endDate: contract.endDate,
//         duration: contract.duration
//       },
//       role: contract.clientId.toString() === reviewerId ? "client" : "freelancer",
//       collaborationInfo: {
//         withName: session.user?.name,
//         otherName: contract.clientId.toString() === reviewerId 
//           ? (await db.collection("users").findOne({ _id: contract.freelancerId }))?.name
//           : (await db.collection("users").findOne({ _id: contract.clientId }))?.name,
//         daysSinceCompletion: Math.floor(
//           (Date.now() - (contract.endDate || contract.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
//         )
//       }
//     })

//   } catch (error) {
//     console.error("Erreur vérification review:", error)
//     return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
//   }
// }