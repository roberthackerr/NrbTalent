// api/projects/route.ts - Version corrigée

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

// Configuration
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 12
const MAX_LIMIT = 100
const MIN_BUDGET = 0
const MAX_BUDGET = 1000000

// Schéma de validation pour GET
const GetProjectsQuerySchema = z.object({
  page: z.string()
    .optional()
    .default(DEFAULT_PAGE.toString())
    .transform(val => {
      const num = parseInt(val, 10)
      return isNaN(num) || num < 1 ? DEFAULT_PAGE : num
    }),
  limit: z.string()
    .optional()
    .default(DEFAULT_LIMIT.toString())
    .transform(val => {
      const num = parseInt(val, 10)
      return isNaN(num) || num < 1 || num > MAX_LIMIT ? DEFAULT_LIMIT : num
    }),
  category: z.string()
    .optional()
    .transform(val => val === "all" ? undefined : val),
  skills: z.string()
    .optional()
    .transform(val => {
      if (!val) return undefined
      const skills = val.split(",")
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0)
      return skills.length > 0 ? skills : undefined
    }),
  budgetMin: z.string()
    .optional()
    .default(MIN_BUDGET.toString())
    .transform(val => {
      const num = parseInt(val, 10)
      return isNaN(num) || num < MIN_BUDGET ? MIN_BUDGET : num
    }),
  budgetMax: z.string()
    .optional()
    .default(MAX_BUDGET.toString())
    .transform(val => {
      const num = parseInt(val, 10)
      return isNaN(num) || num > MAX_BUDGET ? MAX_BUDGET : num
    }),
  type: z.enum(["fixed", "hourly", ""])
    .optional()
    .transform(val => val === "" ? undefined : val),
  status: z.enum(["draft", "open", "in-progress", "completed", "cancelled", "paused", ""])
    .optional()
    .default("open")
    .transform(val => val === "" ? "open" : val),
  sortBy: z.enum(["createdAt", "deadline", "budget.min", "budget.max", "applicationCount", "views", ""])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc", ""])
    .optional()
    .default("desc")
    .transform(val => val === "" ? "desc" : val),
  search: z.string()
    .optional()
    .transform(val => {
      if (!val) return undefined
      const trimmed = val.trim()
      return trimmed.length > 0 ? trimmed : undefined
    }),
  clientId: z.string()
    .optional()
    .refine(val => !val || ObjectId.isValid(val), {
      message: "Invalid clientId format"
    })
})

// Helper functions
const validateObjectId = (id: string): ObjectId | null => {
  try {
    return ObjectId.isValid(id) ? new ObjectId(id) : null
  } catch {
    return null
  }
}

const buildFilter = (data: z.infer<typeof GetProjectsQuerySchema>) => {
  const filter: any = { status: data.status }

  // IMPORTANT: Filtrer seulement les projets "open" par défaut
  // Si vous voulez voir tous les statuts, retirez cette ligne
  filter.status = "open"

  // Category filter - CORRIGÉ: Chercher aussi dans subcategory
  if (data.category) {
    filter.$or = [
      { category: data.category },
      { subcategory: data.category }
    ]
  }

  // Skills filter - CORRIGÉ: Utiliser $all au lieu de $in
  if (data.skills && data.skills.length > 0) {
    filter.skills = { $all: data.skills }
  }

  // Budget filter - CORRIGÉ: Chercher dans budget.min et budget.max
  if (data.budgetMin > MIN_BUDGET || data.budgetMax < MAX_BUDGET) {
    filter.$and = [
      { "budget.min": { $gte: data.budgetMin } },
      { "budget.max": { $lte: data.budgetMax } }
    ]
  }

  // Budget type filter
  if (data.type) {
    filter["budget.type"] = data.type
  }

  // Search filter - CORRIGÉ: Amélioré
  if (data.search) {
    const searchRegex = { $regex: data.search, $options: "i" }
    filter.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { "skills": searchRegex }, // Recherche dans les compétences
      { category: searchRegex }, // Recherche dans la catégorie
      { subcategory: searchRegex } // Recherche dans la sous-catégorie
    ]
  }

  // Client filter
  if (data.clientId) {
    const clientId = validateObjectId(data.clientId)
    if (clientId) {
      filter.clientId = clientId
    }
  }

  // Filtre par défaut pour éviter les projets vides
  filter.title = { $exists: true, $ne: "" }
  
  console.log("🔍 Filter built:", JSON.stringify(filter, null, 2))
  return filter
}

const buildSortOptions = (sortBy: string, sortOrder: string) => {
  const sortOptions: any = {}
  
  switch (sortBy) {
    case "deadline":
      sortOptions.deadline = sortOrder === "asc" ? 1 : -1
      break
    case "budget.min":
      sortOptions["budget.min"] = sortOrder === "asc" ? 1 : -1
      break
    case "budget.max":
      sortOptions["budget.max"] = sortOrder === "asc" ? 1 : -1
      break
    case "applicationCount":
      sortOptions.applicationCount = sortOrder === "asc" ? 1 : -1
      break
    case "views":
      sortOptions.views = sortOrder === "asc" ? 1 : -1
      break
    default:
      sortOptions.createdAt = sortOrder === "asc" ? 1 : -1
  }
  
  return sortOptions
}

// GET - Récupérer les projets avec pagination et filtres
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    // Validation des paramètres
    const validationResult = GetProjectsQuerySchema.safeParse(params)
    if (!validationResult.success) {
      console.error("❌ Validation error:", validationResult.error.issues)
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid query parameters",
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const query = validationResult.data
    const db = await getDatabase()
    
    // Construire le filtre
    const filter = buildFilter(query)
    const skip = (query.page - 1) * query.limit
    
    // Construire les options de tri
    const sortOptions = buildSortOptions(query.sortBy, query.sortOrder)

    console.log(`📊 Fetching projects: page=${query.page}, limit=${query.limit}, skip=${skip}`)
    console.log(`🎯 Filter:`, JSON.stringify(filter, null, 2))
    console.log(`📈 Sort: ${query.sortBy} ${query.sortOrder}`)

    // Exécuter les requêtes
    const [projects, totalCount] = await Promise.all([
      db.collection("projects")
        .find({visibility: "public", ...filter})
        .sort(sortOptions)
        .skip(skip)
        .limit(query.limit)
        .toArray(),
      db.collection("projects").countDocuments(filter)
    ])

    console.log(`✅ Found ${projects.length} projects out of ${totalCount}`)

    // Récupérer les informations des clients si nécessaire
    if (projects.length > 0) {
      const clientIds = projects
        .map(p => p.clientId)
        .filter(id => id)
        .map(id => id.toString())
      
      const uniqueClientIds = [...new Set(clientIds)]
      
      if (uniqueClientIds.length > 0) {
        const objectIds = uniqueClientIds.map(id => new ObjectId(id))
        const clients = await db.collection("users")
          .find({ _id: { $in: objectIds } })
          .project({ 
            _id: 1, 
            name: 1, 
            avatar: 1, 
            title: 1,
            rating: 1,
            completedProjects: 1 
          })
          .toArray()

        const clientMap = new Map(
          clients.map(client => [client._id.toString(), client])
        )

        // Enrichir les projets avec les informations client
        projects.forEach(project => {
          if (project.clientId) {
            project.client = clientMap.get(project.clientId.toString())
          }
        })
      }
    }

    const totalPages = Math.ceil(totalCount / query.limit)

    return NextResponse.json({
      success: true,
      data: {
        projects: projects || [],
        pagination: {
          page: query.page,
          limit: query.limit,
          total: totalCount,
          totalPages,
          hasNext: query.page < totalPages,
          hasPrev: query.page > 1
        },
        filters: {
          category: query.category,
          skills: query.skills,
          budgetMin: query.budgetMin,
          budgetMax: query.budgetMax,
          type: query.type
        }
      }
    })

  } catch (error) {
    console.error("❌ Error fetching projects:", error)
    
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau projet
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { 
          success: false,
          error: "Authentication required" 
        },
        { status: 401 }
      )
    }

    const userRole = (session.user as any).role
    if (userRole !== "client") {
      return NextResponse.json(
        { 
          success: false,
          error: "Only clients can create projects" 
        },
        { status: 403 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid JSON format" 
        },
        { status: 400 }
      )
    }

// Replace the existing CreateProjectSchema with this:
const CreateProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.string().min(1),
  subcategory: z.string().optional().default(""),
  skills: z.array(z.string()).min(1).max(20),
  budget: z.object({
    min: z.number().min(0).max(MAX_BUDGET),
    max: z.number().min(0).max(MAX_BUDGET),
    type: z.enum(["fixed", "hourly"]),
    currency: z.string().default("USD"),
    originalCurrency: z.string().optional(),
    exchangeRate: z.number().optional()
  }),
  deadline: z.string().refine(val => {
    // Accept both date string and ISO datetime
    return !isNaN(Date.parse(val));
  }, { message: "Invalid date format" }),
  status: z.enum(["draft", "open"]).default("draft"),
  visibility: z.enum(["public", "private"]).optional().default("public"),
  tags: z.array(z.string()).optional().default([]),
  location: z.object({
    remote: z.boolean().default(true),
    country: z.string().optional(),
    city: z.string().optional(),
    timezone: z.string().optional()
  }).optional().default({ remote: true }),
  metadata: z.object({}).optional().default({})
})

    const validationResult = CreateProjectSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: "Validation failed",
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const projectData = validationResult.data
    const db = await getDatabase()
    const clientId = new ObjectId((session.user as any).id)

    const projectDocument = {
      ...projectData,
      clientId,
      applications: [],
      applicationCount: 0,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      subcategory: "",
      tags: [],
      location: { remote: true },
      metadata: {}
    }

    const result = await db.collection("projects").insertOne(projectDocument)

    if (!result.insertedId) {
      throw new Error("Failed to insert project")
    }

    return NextResponse.json(
      { 
        success: true,
        message: "Project created successfully",
        data: {
          projectId: result.insertedId,
          status: projectData.status
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("❌ Error creating project:", error)
    
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer les parties inutiles
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { 
          success: false,
          error: "Authentication required" 
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('id')
    
    if (!projectId || !ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { 
          success: false,
          error: "Valid project ID is required" 
        },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const userRole = (session.user as any).role

    // Vérifier l'existence
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId)
    })

    if (!project) {
      return NextResponse.json(
        { 
          success: false,
          error: "Project not found" 
        },
        { status: 404 }
      )
    }

    // Vérifier les permissions
    const isOwner = project.clientId.toString() === userId.toString()
    const isAdmin = userRole === "admin"
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized to delete this project" 
        },
        { status: 403 }
      )
    }

    // Supprimer le projet
    const result = await db.collection("projects").deleteOne({
      _id: new ObjectId(projectId)
    })

    if (result.deletedCount === 0) {
      throw new Error("Failed to delete project")
    }

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully"
    })

  } catch (error) {
    console.error("❌ Error deleting project:", error)
    
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}