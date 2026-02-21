// app/api/users/[userId]/projects/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

// Schéma de validation des query params
const GetUserProjectsSchema = z.object({
  page: z.string().optional().transform(val => {
    const num = Number(val)
    return isNaN(num) || num < 1 ? 1 : num
  }).default("1"),
  limit: z.string().optional().transform(val => {
    const num = Number(val)
    return isNaN(num) || num < 1 || num > 50 ? 12 : num
  }).default("12"),
  status: z.string().optional().default("all"),
  search: z.string().optional().catch(undefined),
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.string().optional().default("desc")
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Vérifier que l'utilisateur est authentifié
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur accède à ses propres projets
    if (session?.user.id !== params.id) {
        console.log(session?.user.id,params.id)
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Vérifier que l'utilisateur est un client
    if (session?.user.role !== "client" && session.user.role !== "freelance" && session.user.role !== "freelancer") {
      return NextResponse.json({ error: "Seuls les clients peuvent gérer des projets" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    
    // Préparer les paramètres
    const queryParams: Record<string, string | undefined> = {}
    for (const [key, value] of searchParams.entries()) {
      if (value !== null && value !== undefined && value !== '') {
        queryParams[key] = value
      }
    }

    console.log("📥 Paramètres projets utilisateur:", queryParams)

    // Validation des paramètres
    const validationResult = GetUserProjectsSchema.safeParse(queryParams)
    const safeData = validationResult.success ? validationResult.data : {
      page: 1,
      limit: 12,
      status: "all",
      sortBy: "createdAt",
      sortOrder: "desc"
    }

    const {
      page,
      limit,
      status,
      search,
      sortBy,
      sortOrder
    } = safeData

    const db = await getDatabase()
    const skip = (page - 1) * limit
    const clientId = new ObjectId(params.id)

    // Construction du filtre
    const filter: any = { 
      clientId: clientId
    }

    // Filtre par statut
    if (status && status !== "all") {
      filter.status = status
    }

    // Recherche texte
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { skills: { $in: [new RegExp(search, "i")] } },
        { category: { $regex: search, $options: "i" } }
      ]
    }

    console.log("🔍 Filtre projets utilisateur:", filter)

    // Options de tri
    const sortOptions: any = {}
    if (sortBy === "deadline") {
      sortOptions.deadline = sortOrder === "asc" ? 1 : -1
    } else if (sortBy === "budget") {
      sortOptions["budget.min"] = sortOrder === "asc" ? 1 : -1
    } else if (sortBy === "title") {
      sortOptions.title = sortOrder === "asc" ? 1 : -1
    } else if (sortBy === "applicationCount") {
      sortOptions.applicationCount = sortOrder === "asc" ? 1 : -1
    } else {
      sortOptions.createdAt = sortOrder === "asc" ? 1 : -1
    }

    // Requête avec pagination
    const [projects, totalCount] = await Promise.all([
      db.collection("projects")
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("projects").countDocuments(filter)
    ])

    // Calcul des statistiques
    const stats = await db.collection("projects").aggregate([
      { $match: { clientId: clientId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalBudget: { $sum: "$budget.min" }
        }
      }
    ]).toArray()

    const statusStats = {
      all: totalCount,
      draft: stats.find((s: any) => s._id === "draft")?.count || 0,
      open: stats.find((s: any) => s._id === "open")?.count || 0,
      "in-progress": stats.find((s: any) => s._id === "in-progress")?.count || 0,
      completed: stats.find((s: any) => s._id === "completed")?.count || 0
    }

    console.log(`✅ ${projects.length} projets trouvés pour l'utilisateur ${params.id}`)

    return NextResponse.json({
      success: true,
      projects: projects || [],
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      stats: statusStats,
      filters: {
        status,
        search,
        sortBy,
        sortOrder
      }
    })

  } catch (error) {
    console.error("❌ Erreur lors de la récupération des projets utilisateur:", error)
    return NextResponse.json(
      { 
        error: "Erreur interne du serveur",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}