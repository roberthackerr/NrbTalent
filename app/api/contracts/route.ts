// app/api/contracts/route.ts
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateDefaultTerms } from "@/lib/contract-helpers"
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
  contractCreated: {
    fr: {
      client: {
        title: "📄 Contrat créé",
        message: (title: string) => `Votre contrat "${title}" a été créé et envoyé au freelance`
      },
      freelancer: {
        title: "📄 Nouveau contrat",
        message: (clientName: string, title: string) => `${clientName} vous a envoyé un contrat pour "${title}"`
      }
    },
    en: {
      client: {
        title: "📄 Contract created",
        message: (title: string) => `Your contract "${title}" has been created and sent to the freelancer`
      },
      freelancer: {
        title: "📄 New contract",
        message: (clientName: string, title: string) => `${clientName} sent you a contract for "${title}"`
      }
    },
    mg: {
      client: {
        title: "📄 Fifanarahana noforonina",
        message: (title: string) => `Ny fifanarahanao "${title}" dia noforonina sy nalefa tany amin'ny freelance`
      },
      freelancer: {
        title: "📄 Fifanarahana vaovao",
        message: (clientName: string, title: string) => `${clientName} nandefa fifanarahana ho an'ny "${title}"`
      }
    }
  },
  contractSigned: {
    fr: {
      client: {
        title: "✍️ Contrat signé",
        message: (freelancerName: string, title: string) => `${freelancerName} a signé le contrat "${title}"`
      },
      freelancer: {
        title: "✍️ Contrat signé",
        message: (clientName: string, title: string) => `Vous avez signé le contrat "${title}" avec ${clientName}`
      }
    },
    en: {
      client: {
        title: "✍️ Contract signed",
        message: (freelancerName: string, title: string) => `${freelancerName} signed the contract "${title}"`
      },
      freelancer: {
        title: "✍️ Contract signed",
        message: (clientName: string, title: string) => `You signed the contract "${title}" with ${clientName}`
      }
    },
    mg: {
      client: {
        title: "✍️ Fifanarahana nosoniavina",
        message: (freelancerName: string, title: string) => `Nosoniavin'i ${freelancerName} ny fifanarahana "${title}"`
      },
      freelancer: {
        title: "✍️ Fifanarahana nosoniavina",
        message: (clientName: string, title: string) => `Nosoniavinao ny fifanarahana "${title}" miaraka amin'i ${clientName}`
      }
    }
  },
  contractStatusChanged: {
    fr: {
      accepted: {
        title: "✅ Contrat accepté",
        message: (title: string) => `Le contrat "${title}" a été accepté`
      },
      rejected: {
        title: "❌ Contrat refusé",
        message: (title: string) => `Le contrat "${title}" a été refusé`
      },
      completed: {
        title: "🏁 Contrat terminé",
        message: (title: string) => `Le contrat "${title}" est terminé`
      }
    },
    en: {
      accepted: {
        title: "✅ Contract accepted",
        message: (title: string) => `The contract "${title}" has been accepted`
      },
      rejected: {
        title: "❌ Contract rejected",
        message: (title: string) => `The contract "${title}" has been rejected`
      },
      completed: {
        title: "🏁 Contract completed",
        message: (title: string) => `The contract "${title}" is completed`
      }
    },
    mg: {
      accepted: {
        title: "✅ Fifanarahana ekena",
        message: (title: string) => `Ekena ny fifanarahana "${title}"`
      },
      rejected: {
        title: "❌ Fifanarahana lavina",
        message: (title: string) => `Lavina ny fifanarahana "${title}"`
      },
      completed: {
        title: "🏁 Fifanarahana vita",
        message: (title: string) => `Vita ny fifanarahana "${title}"`
      }
    }
  }
}

async function sendContractNotification(
  userId: string,
  templateKey: keyof typeof contractNotificationMessages,
  role: 'client' | 'freelancer',
  data: any
) {
  try {
    const userLang = await getUserLanguage(userId)
    const messages = contractNotificationMessages[templateKey] as any
    const roleMessages = messages[userLang]?.[role] ?? messages.fr[role]
    
    let title: string
    let message: string
    
    if (typeof roleMessages.message === 'function') {
      title = roleMessages.title
      message = roleMessages.message(data.clientName, data.title)
    } else {
      title = roleMessages.title
      message = roleMessages.message
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

// ─── GET - Lister les contrats ─────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const role = searchParams.get("role")
    const projectId = searchParams.get("projectId") || searchParams.get("project")
    const freelancerId = searchParams.get("freelancerId") || searchParams.get("freelancer")
    
    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const userRole = (session.user as any).role

    console.log("🔍 GET contracts - User:", userId.toString(), "Role:", userRole)
    console.log("📊 Query params:", { status, role, projectId, freelancerId })

    const filter: any = {}

    if (projectId && ObjectId.isValid(projectId)) {
      filter.projectId = new ObjectId(projectId)
    }

    if (freelancerId && ObjectId.isValid(freelancerId)) {
      filter.freelancerId = new ObjectId(freelancerId)
    }

    if (!projectId && !freelancerId) {
      if (role === "client") {
        filter.clientId = userId
      } else if (role === "freelancer") {
        filter.freelancerId = userId
      } else {
        filter.$or = [
          { clientId: userId },
          { freelancerId: userId }
        ]
      }
    }

    if (status && status !== "all") {
      filter.status = status
    }

    const contracts = await db.collection("contracts").aggregate([
      { $match: filter },
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
          _id: 1,
          projectId: 1,
          clientId: 1,
          freelancerId: 1,
          title: 1,
          description: 1,
          status: 1,
          type: 1,
          amount: 1,
          currency: 1,
          paymentSchedule: 1,
          startDate: 1,
          endDate: 1,
          duration: 1,
          deliverables: 1,
          scopeOfWork: 1,
          termsAndConditions: 1,
          clientSignature: 1,
          freelancerSignature: 1,
          createdAt: 1,
          updatedAt: 1,
          signedAt: 1,
          version: 1,
          previousVersionId: 1,
          "client._id": 1,
          "client.name": 1,
          "client.avatar": 1,
          "client.title": 1,
          "client.rating": 1,
          "freelancer._id": 1,
          "freelancer.name": 1,
          "freelancer.avatar": 1,
          "freelancer.title": 1,
          "freelancer.rating": 1,
          "freelancer.skills": 1,
          "project._id": 1,
          "project.title": 1,
          "project.description": 1,
          "project.status": 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]).toArray()

    console.log(`✅ Found ${contracts.length} contracts`)

    return NextResponse.json({ contracts })
  } catch (error) {
    console.error("Erreur récupération contrats:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

// ─── POST - Créer un contrat ──────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    console.log("📝 POST /api/contracts called")
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log("❌ No session found")
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    console.log("📦 Request body:", JSON.stringify(body, null, 2))
    
    const {
      projectId,
      freelancerId,
      title,
      description,
      amount,
      currency = "EUR",
      type = "fixed_price",
      startDate,
      endDate,
      deliverables,
      scopeOfWork,
      termsAndConditions,
      paymentSchedule
    } = body

    if (!projectId || !freelancerId || !title || !amount) {
      console.log("❌ Missing required fields")
      return NextResponse.json({ 
        error: "Champs requis manquants",
        details: {
          projectId: !projectId,
          freelancerId: !freelancerId,
          title: !title,
          amount: !amount
        }
      }, { status: 400 })
    }

    const db = await getDatabase()
    const clientId = new ObjectId((session.user as any).id)
    const clientName = (session.user as any).name

    console.log("👤 Client ID:", clientId.toString())

    // Vérifier que le client est propriétaire du projet
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      clientId: clientId
    })

    if (!project) {
      console.log("❌ Project not found or not owned by client")
      return NextResponse.json({ 
        error: "Projet non trouvé ou accès refusé",
        details: { projectId, clientId: clientId.toString() }
      }, { status: 404 })
    }

    console.log("✅ Project found:", project.title)

    // Vérifier que le freelancer existe
    console.log("🔍 Looking for freelancer with ID:", freelancerId)
    const freelancer = await db.collection("users").findOne({
      _id: new ObjectId(freelancerId),
      role: { $in: ["freelancer", "freelance"] }
    })

    if (!freelancer) {
      console.log("❌ Freelancer not found or wrong role")
      return NextResponse.json({ 
        error: "Freelancer non trouvé",
        details: { 
          freelancerId,
          isValidObjectId: ObjectId.isValid(freelancerId)
        }
      }, { status: 404 })
    }

    console.log("✅ Freelancer found:", freelancer.name, "- Role:", freelancer.role)

    let duration: number | undefined = undefined
    if (endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    const contract = {
      projectId: new ObjectId(projectId),
      clientId,
      freelancerId: new ObjectId(freelancerId),
      title,
      description: description || "",
      status: "draft",
      type,
      amount: parseFloat(amount),
      currency,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      duration,
      deliverables: deliverables || [],
      scopeOfWork: scopeOfWork || "",
      termsAndConditions: termsAndConditions || generateDefaultTerms(),
      paymentSchedule: paymentSchedule || {
        type: type === "fixed_price" ? "completion" : "hourly",
        milestones: []
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    }

    console.log("📄 Creating contract:", contract)

    const result = await db.collection("contracts").insertOne(contract)
    const contractId = result.insertedId.toString()
    console.log("✅ Contract created with ID:", contractId)

    // Mettre à jour le projet
    await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      { 
        $set: { 
          status: "contract_pending",
          selectedFreelancerId: new ObjectId(freelancerId),
          updatedAt: new Date() 
        } 
      }
    )

    console.log("✅ Project updated")

    // ──────────────────────────────────────────────────────────────────────────
    // 📢 ENVOI DES NOTIFICATIONS MULTILINGUES
    // ──────────────────────────────────────────────────────────────────────────
    
    // 1. Notification au client (créateur du contrat)
    await sendContractNotification(
      clientId.toString(),
      "contractCreated",
      "client",
      {
        clientName: clientName,
        title: title,
        contractId: contractId,
        projectId: projectId,
        freelancerName: freelancer.name
      }
    )
    console.log("✅ Notification sent to client")

    // 2. Notification au freelance
    await sendContractNotification(
      freelancerId,
      "contractCreated",
      "freelancer",
      {
        clientName: clientName,
        title: title,
        contractId: contractId,
        projectId: projectId
      }
    )
    console.log("✅ Notification sent to freelancer")

    // 3. Notification supplémentaire via la collection notifications (fallback)
    await db.collection("notifications").insertMany([
      {
        userId: clientId,
        type: "contract_created",
        title: "📄 Contrat créé",
        message: `Votre contrat "${title}" a été créé et envoyé à ${freelancer.name}`,
        data: { 
          contractId: contractId, 
          projectId: new ObjectId(projectId),
          freelancerId: new ObjectId(freelancerId)
        },
        read: false,
        createdAt: new Date(),
        category: "ORDER",
        priority: "HIGH"
      },
      {
        userId: new ObjectId(freelancerId),
        type: "contract_received",
        title: "📄 Nouveau contrat",
        message: `${clientName} vous a envoyé un contrat pour "${title}"`,
        data: { 
          contractId: contractId, 
          projectId: new ObjectId(projectId),
          clientId: clientId
        },
        read: false,
        createdAt: new Date(),
        category: "ORDER",
        priority: "HIGH"
      }
    ])

    console.log("✅ Fallback notifications sent")

    return NextResponse.json({ 
      success: true, 
      contractId: contractId,
      message: "Contrat créé avec succès" 
    }, { status: 201 })
  } catch (error: any) {
    console.error("❌ Erreur création contrat:", error)
    console.error("Stack trace:", error.stack)
    return NextResponse.json({ 
      error: "Erreur interne",
      details: error.message 
    }, { status: 500 })
  }
}

// ─── PATCH - Mettre à jour le statut du contrat ───────────────────────────────
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { contractId, status, action } = body

    if (!contractId || !ObjectId.isValid(contractId)) {
      return NextResponse.json({ error: "ID de contrat invalide" }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const userName = (session.user as any).name

    const contract = await db.collection("contracts").findOne({
      _id: new ObjectId(contractId)
    })

    if (!contract) {
      return NextResponse.json({ error: "Contrat non trouvé" }, { status: 404 })
    }

    const isClient = contract.clientId.toString() === userId.toString()
    const isFreelancer = contract.freelancerId.toString() === userId.toString()

    let updateData: any = { status, updatedAt: new Date() }
    let notificationRole: 'client' | 'freelancer' | null = null
    let notificationData: any = {}

    if (action === 'sign' && status === 'signed') {
      if (isClient) {
        updateData.clientSignature = { signedAt: new Date(), ip: "pending" }
        if (contract.freelancerSignature) {
          updateData.status = 'active'
          updateData.signedAt = new Date()
        }
        notificationRole = isFreelancer ? 'freelancer' : 'client'
      } else if (isFreelancer) {
        updateData.freelancerSignature = { signedAt: new Date(), ip: "pending" }
        if (contract.clientSignature) {
          updateData.status = 'active'
          updateData.signedAt = new Date()
        }
        notificationRole = isClient ? 'client' : 'freelancer'
      }
      notificationData = { contractId, title: contract.title, projectId: contract.projectId }
    } else if (action === 'accept' && status === 'accepted') {
      updateData.status = 'accepted'
      notificationRole = 'client'
      notificationData = { contractId, title: contract.title, projectId: contract.projectId }
    } else if (action === 'reject' && status === 'rejected') {
      updateData.status = 'rejected'
      notificationRole = 'client'
      notificationData = { contractId, title: contract.title, projectId: contract.projectId }
    }

    await db.collection("contracts").updateOne(
      { _id: new ObjectId(contractId) },
      { $set: updateData }
    )

    // Envoyer notification si nécessaire
    if (notificationRole && notificationData) {
      await sendContractNotification(
        notificationRole === 'client' ? contract.clientId.toString() : contract.freelancerId.toString(),
        "contractSigned",
        notificationRole,
        {
          clientName: userName,
          title: contract.title,
          contractId: contractId,
          projectId: contract.projectId
        }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: "Contrat mis à jour avec succès" 
    })
  } catch (error) {
    console.error("❌ Error updating contract:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}