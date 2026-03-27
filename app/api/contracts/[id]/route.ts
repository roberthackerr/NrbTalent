// app/api/contracts/[id]/route.ts
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET - Détails d'un contrat
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
    const contractId = id
    
    if (!ObjectId.isValid(contractId)) {
      return NextResponse.json({ error: "ID de contrat invalide" }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Récupérer le contrat avec les infos utilisateur
    const contract = await db.collection("contracts").aggregate([
      { $match: { _id: new ObjectId(contractId) } },
      {
        $lookup: {
          from: "users",
          localField: "clientId",
          foreignField: "_id",
          as: "client"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "freelancerId",
          foreignField: "_id",
          as: "freelancer"
        }
      },
      {
        $lookup: {
          from: "projects",
          localField: "projectId",
          foreignField: "_id",
          as: "project"
        }
      },
      { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$freelancer", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          "client.password": 0,
          "client.email": 0,
          "freelancer.password": 0,
          "freelancer.email": 0
        }
      }
    ]).next()

    if (!contract) {
      return NextResponse.json({ error: "Contrat non trouvé" }, { status: 404 })
    }

    // Normaliser les IDs pour le frontend (les convertir en string)
    const normalizedContract = {
      ...contract,
      clientId: contract.clientId?.toString(),
      freelancerId: contract.freelancerId?.toString(),
      projectId: contract.projectId?.toString(),
      client: contract.client ? {
        ...contract.client,
        _id: contract.client._id?.toString()
      } : null,
      freelancer: contract.freelancer ? {
        ...contract.freelancer,
        _id: contract.freelancer._id?.toString()
      } : null,
      project: contract.project ? {
        ...contract.project,
        _id: contract.project._id?.toString()
      } : null
    }

    return NextResponse.json({ contract: normalizedContract })
  } catch (error) {
    console.error("Erreur récupération contrat:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

// PUT - Signer un contrat
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    
    const { id } = await params
    const contractId = id
    
    if (!ObjectId.isValid(contractId)) {
      return NextResponse.json({ error: "ID de contrat invalide" }, { status: 400 })
    }

    const { action } = await request.json()
    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    
    // Récupérer l'adresse IP et user agent
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor?.split(',')[0] || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const contract = await db.collection("contracts").findOne({
      _id: new ObjectId(contractId)
    })

    if (!contract) {
      return NextResponse.json({ error: "Contrat non trouvé" }, { status: 404 })
    }

    const userIsClient = contract.clientId.equals(userId)
    const userIsFreelancer = contract.freelancerId.equals(userId)

    if (!userIsClient && !userIsFreelancer) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    if (action === "sign") {
      // Vérifier si l'utilisateur a déjà signé
      if (userIsClient && contract.clientSignature) {
        return NextResponse.json({ error: "Vous avez déjà signé ce contrat" }, { status: 400 })
      }
      if (userIsFreelancer && contract.freelancerSignature) {
        return NextResponse.json({ error: "Vous avez déjà signé ce contrat" }, { status: 400 })
      }

      // Signer le contrat
      const updateData: any = {
        updatedAt: new Date()
      }

      if (userIsClient) {
        updateData.clientSignature = {
          signedAt: new Date(),
          ipAddress,
          userAgent
        }
      } else if (userIsFreelancer) {
        updateData.freelancerSignature = {
          signedAt: new Date(),
          ipAddress,
          userAgent
        }
      }

      // Mettre à jour et récupérer le contrat mis à jour
      const updatedContract = await db.collection("contracts").findOneAndUpdate(
        { _id: new ObjectId(contractId) },
        { $set: updateData },
        { returnDocument: "after" }
      )

      if (updatedContract) {
        const clientSigned = updatedContract.clientSignature
        const freelancerSigned = updatedContract.freelancerSignature

        // Si les deux ont signé
        if (clientSigned && freelancerSigned) {
          await db.collection("contracts").updateOne(
            { _id: new ObjectId(contractId) },
            { 
              $set: { 
                status: "active",
                signedAt: new Date()
              }
            }
          )

          // Mettre à jour le projet
          await db.collection("projects").updateOne(
            { _id: contract.projectId },
            { $set: { status: "in_progress", updatedAt: new Date() } }
          )

          // Notifier l'autre partie
          const otherUserId = userIsClient ? contract.freelancerId : contract.clientId
          await db.collection("notifications").insertOne({
            userId: otherUserId,
            type: "contract_signed",
            title: "Contrat signé",
            message: `${session.user?.name} a signé le contrat "${contract.title}"`,
            data: { contractId, projectId: contract.projectId },
            createdAt: new Date(),
            read: false
          })
        } else {
          // Notifier l'autre partie qu'une signature est en attente
          const otherUserId = userIsClient ? contract.freelancerId : contract.clientId
          await db.collection("notifications").insertOne({
            userId: otherUserId,
            type: "contract_signed_pending",
            title: "Signature reçue",
            message: `${session.user?.name} a signé le contrat. En attente de votre signature.`,
            data: { contractId },
            createdAt: new Date(),
            read: false
          })
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: "Contrat signé avec succès" 
      })
    }
    else if (action === "request_changes") {
      const { changesRequested } = await request.json()
      
      if (!changesRequested || !changesRequested.trim()) {
        return NextResponse.json({ error: "Description des modifications requise" }, { status: 400 })
      }

      await db.collection("contracts").updateOne(
        { _id: new ObjectId(contractId) },
        { 
          $set: { 
            status: "pending",
            updatedAt: new Date()
          },
          $push: {
            revisionRequests: {
              requestedBy: userId,
              requestedByRole: userIsClient ? "client" : "freelancer",
              changes: changesRequested,
              requestedAt: new Date()
            }
          }
        }
      )

      // Notifier l'autre partie
      const otherUserId = userIsClient ? contract.freelancerId : contract.clientId
      await db.collection("notifications").insertOne({
        userId: otherUserId,
        type: "contract_revision_requested",
        title: "Modifications demandées",
        message: `${session.user?.name} a demandé des modifications sur le contrat "${contract.title}"`,
        data: { contractId },
        createdAt: new Date(),
        read: false
      })

      return NextResponse.json({ 
        success: true, 
        message: "Demande de modifications envoyée" 
      })
    }
    else if (action === "cancel") {
      if (contract.status === "active") {
        return NextResponse.json({ 
          error: "Impossible d'annuler un contrat actif" 
        }, { status: 400 })
      }

      await db.collection("contracts").updateOne(
        { _id: new ObjectId(contractId) },
        { 
          $set: { 
            status: "cancelled",
            updatedAt: new Date(),
            cancelledBy: userId,
            cancelledAt: new Date()
          }
        }
      )

      // Réinitialiser le projet
      await db.collection("projects").updateOne(
        { _id: contract.projectId },
        { 
          $set: { 
            status: "open",
            freelancerId: null,
            updatedAt: new Date()
          }
        }
      )

      // Notifier l'autre partie
      const otherUserId = userIsClient ? contract.freelancerId : contract.clientId
      await db.collection("notifications").insertOne({
        userId: otherUserId,
        type: "contract_cancelled",
        title: "Contrat annulé",
        message: `${session.user?.name} a annulé le contrat "${contract.title}"`,
        data: { contractId },
        createdAt: new Date(),
        read: false
      })

      return NextResponse.json({ 
        success: true, 
        message: "Contrat annulé" 
      })
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 })
  } catch (error) {
    console.error("Erreur mise à jour contrat:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}