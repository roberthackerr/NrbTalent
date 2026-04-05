// app/api/contracts/[id]/route.ts
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { notificationService } from "@/services/NotificationService"

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
const contractNotificationMessages = {
  contractSigned: {
    fr: {
      client: {
        title: "✍️ Contrat signé",
        message: (freelancerName: string, title: string) => `${freelancerName} a signé le contrat "${title}"`
      },
      freelancer: {
        title: "✍️ Contrat signé",
        message: (clientName: string, title: string) => `${clientName} a signé le contrat "${title}"`
      }
    },
    en: {
      client: {
        title: "✍️ Contract signed",
        message: (freelancerName: string, title: string) => `${freelancerName} signed the contract "${title}"`
      },
      freelancer: {
        title: "✍️ Contract signed",
        message: (clientName: string, title: string) => `${clientName} signed the contract "${title}"`
      }
    },
    mg: {
      client: {
        title: "✍️ Fifanarahana nosoniavina",
        message: (freelancerName: string, title: string) => `Nosoniavin'i ${freelancerName} ny fifanarahana "${title}"`
      },
      freelancer: {
        title: "✍️ Fifanarahana nosoniavina",
        message: (clientName: string, title: string) => `Nosoniavin'i ${clientName} ny fifanarahana "${title}"`
      }
    }
  },
  contractSignaturePending: {
    fr: {
      title: "⏳ Signature en attente",
      message: (signerName: string, title: string) => `${signerName} a signé le contrat "${title}". En attente de votre signature.`
    },
    en: {
      title: "⏳ Signature pending",
      message: (signerName: string, title: string) => `${signerName} signed the contract "${title}". Awaiting your signature.`
    },
    mg: {
      title: "⏳ Miandry sonia",
      message: (signerName: string, title: string) => `Nosoniavin'i ${signerName} ny fifanarahana "${title}". Miandry ny sonianao.`
    }
  },
  contractRevisionRequested: {
    fr: {
      title: "📝 Modifications demandées",
      message: (requesterName: string, title: string) => `${requesterName} a demandé des modifications sur le contrat "${title}"`
    },
    en: {
      title: "📝 Changes requested",
      message: (requesterName: string, title: string) => `${requesterName} requested changes to the contract "${title}"`
    },
    mg: {
      title: "📝 Fanovana nangatahina",
      message: (requesterName: string, title: string) => `Nangataka fanovana ny fifanarahana "${title}" i ${requesterName}`
    }
  },
  contractCancelled: {
    fr: {
      title: "❌ Contrat annulé",
      message: (cancellerName: string, title: string) => `${cancellerName} a annulé le contrat "${title}"`
    },
    en: {
      title: "❌ Contract cancelled",
      message: (cancellerName: string, title: string) => `${cancellerName} cancelled the contract "${title}"`
    },
    mg: {
      title: "❌ Fifanarahana nofoanana",
      message: (cancellerName: string, title: string) => `Nofoanani ${cancellerName} ny fifanarahana "${title}"`
    }
  },
  contractActivated: {
    fr: {
      client: {
        title: "✅ Contrat activé",
        message: (title: string) => `Le contrat "${title}" est maintenant actif. Le projet peut commencer !`
      },
      freelancer: {
        title: "✅ Contrat activé",
        message: (title: string) => `Le contrat "${title}" est maintenant actif. Le projet peut commencer !`
      }
    },
    en: {
      client: {
        title: "✅ Contract activated",
        message: (title: string) => `The contract "${title}" is now active. The project can begin!`
      },
      freelancer: {
        title: "✅ Contract activated",
        message: (title: string) => `The contract "${title}" is now active. The project can begin!`
      }
    },
    mg: {
      client: {
        title: "✅ Fifanarahana navitrika",
        message: (title: string) => `Navitrika ny fifanarahana "${title}". Afaka manomboka ny tetikasa!`
      },
      freelancer: {
        title: "✅ Fifanarahana navitrika",
        message: (title: string) => `Navitrika ny fifanarahana "${title}". Afaka manomboka ny tetikasa!`
      }
    }
  }
}

async function sendContractNotification(
  userId: string,
  templateKey: keyof typeof contractNotificationMessages,
  role: 'client' | 'freelancer' | null,
  data: any
) {
  try {
    const userLang = await getUserLanguage(userId)
    const messages = contractNotificationMessages[templateKey] as any
    
    let title: string
    let message: string
    
    if (role && messages[userLang]?.[role]) {
      const roleMessages = messages[userLang][role]
      title = roleMessages.title
      message = typeof roleMessages.message === 'function' 
        ? roleMessages.message(data.signerName, data.title)
        : roleMessages.message
    } else if (messages[userLang]) {
      const genericMessages = messages[userLang]
      title = genericMessages.title
      message = typeof genericMessages.message === 'function'
        ? genericMessages.message(data.signerName, data.title)
        : genericMessages.message
    } else {
      const fallback = messages.fr
      title = fallback.title
      message = typeof fallback.message === 'function'
        ? fallback.message(data.signerName, data.title)
        : fallback.message
    }
    
    return await notificationService.send({
      userId,
      category: "ORDER",
      priority: "HIGH",
      title,
      message,
      actionUrl: `/contracts/${data.contractId}`,
      data: { 
        entityId: data.contractId, 
        entityType: "contract",
        contractId: data.contractId,
        projectId: data.projectId,
        ...data 
      },
    })
  } catch (error) {
    console.error("Error sending contract notification:", error)
    return null
  }
}

// ─── GET - Détails d'un contrat ───────────────────────────────────────────────
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

// ─── PUT - Signer / Modifier / Annuler un contrat ─────────────────────────────
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

    const { action, changesRequested } = await request.json()
    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const userName = (session.user as any).name
    
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

    // ──────────────────────────────────────────────────────────────────────────
    // ACTION: SIGNER
    // ──────────────────────────────────────────────────────────────────────────
    if (action === "sign") {
      if (userIsClient && contract.clientSignature) {
        return NextResponse.json({ error: "Vous avez déjà signé ce contrat" }, { status: 400 })
      }
      if (userIsFreelancer && contract.freelancerSignature) {
        return NextResponse.json({ error: "Vous avez déjà signé ce contrat" }, { status: 400 })
      }

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

          await db.collection("projects").updateOne(
            { _id: contract.projectId },
            { $set: { status: "in_progress", updatedAt: new Date() } }
          )

          // Notifier l'autre partie que le contrat est actif
          const otherUserId = userIsClient ? contract.freelancerId : contract.clientId
          const otherRole = userIsClient ? 'freelancer' : 'client'
          
          await sendContractNotification(
            otherUserId.toString(),
            "contractActivated",
            otherRole,
            {
              contractId: contractId,
              projectId: contract.projectId.toString(),
              title: contract.title
            }
          )
          
          // Notification pour le signataire aussi
          await sendContractNotification(
            userId.toString(),
            "contractActivated",
            userIsClient ? 'client' : 'freelancer',
            {
              contractId: contractId,
              projectId: contract.projectId.toString(),
              title: contract.title
            }
          )

          // Fallback notification
          await db.collection("notifications").insertOne({
            userId: otherUserId,
            type: "contract_activated",
            title: "✅ Contrat activé",
            message: `Le contrat "${contract.title}" est maintenant actif. Le projet peut commencer !`,
            data: { contractId, projectId: contract.projectId },
            createdAt: new Date(),
            read: false,
            category: "ORDER",
            priority: "HIGH"
          })
        } else {
          // Notifier l'autre partie qu'une signature est en attente
          const otherUserId = userIsClient ? contract.freelancerId : contract.clientId
          const signerName = userName
          
          await sendContractNotification(
            otherUserId.toString(),
            "contractSignaturePending",
            null,
            {
              contractId: contractId,
              projectId: contract.projectId.toString(),
              title: contract.title,
              signerName: signerName
            }
          )

          // Fallback notification
          await db.collection("notifications").insertOne({
            userId: otherUserId,
            type: "contract_signed_pending",
            title: "⏳ Signature reçue",
            message: `${signerName} a signé le contrat "${contract.title}". En attente de votre signature.`,
            data: { contractId },
            createdAt: new Date(),
            read: false,
            category: "ORDER",
            priority: "MEDIUM"
          })
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: "Contrat signé avec succès" 
      })
    }
    
    // ──────────────────────────────────────────────────────────────────────────
    // ACTION: DEMANDER DES MODIFICATIONS
    // ──────────────────────────────────────────────────────────────────────────
    else if (action === "request_changes") {
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

      const otherUserId = userIsClient ? contract.freelancerId : contract.clientId
      const requesterName = userName
      
      await sendContractNotification(
        otherUserId.toString(),
        "contractRevisionRequested",
        null,
        {
          contractId: contractId,
          projectId: contract.projectId.toString(),
          title: contract.title,
          requesterName: requesterName,
          changesRequested: changesRequested
        }
      )

      // Fallback notification
      await db.collection("notifications").insertOne({
        userId: otherUserId,
        type: "contract_revision_requested",
        title: "📝 Modifications demandées",
        message: `${requesterName} a demandé des modifications sur le contrat "${contract.title}"`,
        data: { contractId, changesRequested },
        createdAt: new Date(),
        read: false,
        category: "ORDER",
        priority: "MEDIUM"
      })

      return NextResponse.json({ 
        success: true, 
        message: "Demande de modifications envoyée" 
      })
    }
    
    // ──────────────────────────────────────────────────────────────────────────
    // ACTION: ANNULER
    // ──────────────────────────────────────────────────────────────────────────
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

      await db.collection("projects").updateOne(
        { _id: contract.projectId },
        { 
          $set: { 
            status: "open",
            selectedFreelancerId: null,
            updatedAt: new Date()
          }
        }
      )

      const otherUserId = userIsClient ? contract.freelancerId : contract.clientId
      const cancellerName = userName
      
      await sendContractNotification(
        otherUserId.toString(),
        "contractCancelled",
        null,
        {
          contractId: contractId,
          projectId: contract.projectId.toString(),
          title: contract.title,
          cancellerName: cancellerName
        }
      )

      // Fallback notification
      await db.collection("notifications").insertOne({
        userId: otherUserId,
        type: "contract_cancelled",
        title: "❌ Contrat annulé",
        message: `${cancellerName} a annulé le contrat "${contract.title}"`,
        data: { contractId },
        createdAt: new Date(),
        read: false,
        category: "ORDER",
        priority: "HIGH"
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