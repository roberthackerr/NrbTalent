// app/api/contracts/route.ts - CORRECTION COMPLÈTE POUR FILTRAGE
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateDefaultTerms } from "@/lib/contract-helpers"

// GET - Lister les contrats avec les informations utilisateurs
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const role = searchParams.get("role")
    const projectId = searchParams.get("projectId") || searchParams.get("project") // Support both
    const freelancerId = searchParams.get("freelancerId") || searchParams.get("freelancer") // Support both
    
    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const userRole = (session.user as any).role

    console.log("🔍 GET contracts - User:", userId.toString(), "Role:", userRole)
    console.log("📊 Query params:", { status, role, projectId, freelancerId })

    const filter: any = {}

    // 🔥 CRITICAL: Filter by projectId if specified
    if (projectId && ObjectId.isValid(projectId)) {
      filter.projectId = new ObjectId(projectId)
      console.log("🔍 Filtering by projectId:", projectId)
    }

    // 🔥 CRITICAL: Filter by freelancerId if specified
    if (freelancerId && ObjectId.isValid(freelancerId)) {
      filter.freelancerId = new ObjectId(freelancerId)
      console.log("🔍 Filtering by freelancerId:", freelancerId)
    }

    // If both projectId and freelancerId are specified, we already have the filter
    // If not, add role-based filtering
    if (!projectId && !freelancerId) {
      if (role === "client") {
        filter.clientId = userId
      } else if (role === "freelancer") {
        filter.freelancerId = userId
      } else {
        // Par défaut: voir tous les contrats où l'utilisateur est impliqué
        filter.$or = [
          { clientId: userId },
          { freelancerId: userId }
        ]
      }
    }

    // Add status filter if specified
    if (status && status !== "all") {
      filter.status = status
    }

    console.log("📊 Final filter:", JSON.stringify(filter, null, 2))

    // Utiliser aggregation pour inclure les informations utilisateurs
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

// POST - Créer un contrat (reste inchangé)
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

    // Validation
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

    // Calculer la durée si endDate est fourni
    let duration: number | undefined = undefined
    if (endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    // Créer le contrat
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
    console.log("✅ Contract created with ID:", result.insertedId)

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

    // Envoyer notification au freelancer
    await db.collection("notifications").insertOne({
      userId: new ObjectId(freelancerId),
      type: "contract_created",
      title: "Nouveau contrat reçu",
      message: `${session.user?.name} vous a envoyé un contrat pour "${title}"`,
      data: { 
        contractId: result.insertedId, 
        projectId: new ObjectId(projectId) 
      },
      read: false,
      createdAt: new Date()
    })

    console.log("✅ Notification sent")

    return NextResponse.json({ 
      success: true, 
      contractId: result.insertedId,
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