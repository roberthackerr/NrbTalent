// app/api/projects/search/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_PAGE  = 1
const DEFAULT_LIMIT = 12
const MAX_LIMIT     = 50
const MIN_BUDGET    = 0
const MAX_BUDGET    = 1_000_000

// ─── Validation Schema ────────────────────────────────────────────────────────
const SearchProjectsSchema = z.object({
  q: z.string().optional().transform(val => val?.trim()),
  page: z.string().optional().default(DEFAULT_PAGE.toString()).transform(val => {
    const num = parseInt(val, 10)
    return isNaN(num) || num < 1 ? DEFAULT_PAGE : num
  }),
  limit: z.string().optional().default(DEFAULT_LIMIT.toString()).transform(val => {
    const num = parseInt(val, 10)
    return isNaN(num) || num < 1 || num > MAX_LIMIT ? DEFAULT_LIMIT : num
  }),
  category: z.string().optional().transform(val => val === "all" ? undefined : val),
  skills: z.string().optional().transform(val => {
    if (!val) return undefined
    const skills = val.split(",").map(s => s.trim()).filter(s => s.length > 0)
    return skills.length > 0 ? skills : undefined
  }),
  budgetMin: z.string().optional().default(MIN_BUDGET.toString()).transform(val => {
    const num = parseInt(val, 10)
    return isNaN(num) || num < MIN_BUDGET ? MIN_BUDGET : num
  }),
  budgetMax: z.string().optional().default(MAX_BUDGET.toString()).transform(val => {
    const num = parseInt(val, 10)
    return isNaN(num) || num > MAX_BUDGET ? MAX_BUDGET : num
  }),
  budgetType: z.enum(["fixed", "hourly", ""]).optional().transform(val => val === "" ? undefined : val),
  status: z.enum(["open", "in-progress", "completed", ""]).optional().default("open").transform(val => val === "" ? "open" : val),
  location: z.string().optional().transform(val => val?.trim()),
  sortBy: z.enum(["relevance", "createdAt", "deadline", "budget", "applications", "views", ""]).optional().default("relevance"),
  sortOrder: z.enum(["asc", "desc", ""]).optional().default("desc").transform(val => val === "" ? "desc" : val),
  minRating: z.string().optional().transform(val => {
    const num = parseFloat(val || "0")
    return isNaN(num) ? 0 : num
  }),
  freelancerId: z.string().optional().refine(val => !val || ObjectId.isValid(val), { message: "Invalid freelancerId format" }),
})

type SearchProjectsQuery = z.infer<typeof SearchProjectsSchema>

// ─── Helper: Build search filter ─────────────────────────────────────────────
function buildSearchFilter(query: SearchProjectsQuery) {
  const filter: any = {
    visibility: "public",
    status: "open",
  }

  // Recherche textuelle
  if (query.q) {
    const searchRegex = { $regex: query.q, $options: "i" }
    filter.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { skills: searchRegex },
      { category: searchRegex },
      { subcategory: searchRegex },
    ]
  }

  // Catégorie
  if (query.category) {
    filter.$or = filter.$or || []
    filter.$or.push(
      { category: query.category },
      { subcategory: query.category }
    )
  }

  // Compétences
  if (query.skills && query.skills.length > 0) {
    filter.skills = { $in: query.skills }
  }

  // Budget
  if (query.budgetMin > MIN_BUDGET || query.budgetMax < MAX_BUDGET) {
    filter.$and = filter.$and || []
    filter.$and.push(
      { "budget.min": { $gte: query.budgetMin } },
      { "budget.max": { $lte: query.budgetMax } }
    )
  }

  // Type de budget
  if (query.budgetType) {
    filter["budget.type"] = query.budgetType
  }

  // Localisation
  if (query.location) {
    const locationRegex = { $regex: query.location, $options: "i" }
    filter.$or = filter.$or || []
    filter.$or.push(
      { "location.country": locationRegex },
      { "location.city": locationRegex }
    )
  }

  // Projets auxquels un freelance a postulé
  if (query.freelancerId) {
    filter.applications = { $elemMatch: { freelancerId: new ObjectId(query.freelancerId) } }
  }

  // Exclure les projets sans titre valide
  filter.title = { $exists: true, $ne: "" }

  return filter
}

// ─── Helper: Build sort options ───────────────────────────────────────────────
function buildSortOptions(query: SearchProjectsQuery) {
  const dir = query.sortOrder === "asc" ? 1 : -1

  const sortMap: Record<string, any> = {
    createdAt: { createdAt: dir },
    deadline: { deadline: dir },
    budget: { "budget.min": dir },
    applications: { applicationCount: dir },
    views: { views: dir },
  }

  if (query.sortBy === "relevance") {
    return { createdAt: -1 }
  }

  return sortMap[query.sortBy] || { createdAt: -1 }
}

// ─── Helper: Get client info for projects ────────────────────────────────────
async function enrichProjectsWithClients(projects: any[], db: any) {
  if (!projects.length) return projects

  const uniqueClientIds = [
    ...new Set(projects.map(p => p.clientId?.toString()).filter(Boolean))
  ].map(id => new ObjectId(id))

  if (!uniqueClientIds.length) return projects

  const clients = await db.collection("users")
    .find({ _id: { $in: uniqueClientIds } })
    .project({
      _id: 1,
      name: 1,
      avatar: 1,
      title: 1,
      "statistics.rating": 1,
      "statistics.completedProjects": 1,
      verified: 1,
    })
    .toArray()

  const clientMap = new Map(clients.map(c => [c._id.toString(), c]))

  return projects.map(project => ({
    ...project,
    client: clientMap.get(project.clientId?.toString()) || null,
  }))
}

// ─── Helper: Get applied projects for a freelancer ───────────────────────────
async function getUserAppliedProjects(freelancerId: string, db: any) {
  try {
    const appliedProjects = await db.collection("projects")
      .find({
        applications: { $elemMatch: { freelancerId: new ObjectId(freelancerId) } },
        visibility: "public",
      })
      .project({ _id: 1 })
      .toArray()

    return new Set(appliedProjects.map(p => p._id.toString()))
  } catch {
    return new Set()
  }
}

// ─── Main GET handler ─────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    // Validation des paramètres
    const validation = SearchProjectsSchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid search parameters",
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const query = validation.data
    const db = await getDatabase()

    // Si l'utilisateur est connecté et c'est un freelance, récupérer ses candidatures
    let appliedProjectIds = new Set<string>()
    if (session?.user && (session.user as any).role === "freelance") {
      appliedProjectIds = await getUserAppliedProjects((session.user as any).id, db)
    }

    // Construction du filtre
    const filter = buildSearchFilter(query)
    const skip = (query.page - 1) * query.limit
    const sortOptions = buildSortOptions(query)

    // Exécution de la recherche
    const [projects, totalCount] = await Promise.all([
      db.collection("projects")
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(query.limit)
        .toArray(),
      db.collection("projects").countDocuments(filter),
    ])

    // Enrichir avec les infos clients
    const enrichedProjects = await enrichProjectsWithClients(projects, db)

    // Ajouter l'information de candidature pour les freelances
    const projectsWithApplicationStatus = enrichedProjects.map(project => ({
      ...project,
      hasApplied: appliedProjectIds.has(project._id.toString()),
    }))

    const totalPages = Math.ceil(totalCount / query.limit)

    // Facettes pour les filtres (compétences et catégories populaires)
    const [popularSkills, popularCategories] = await Promise.all([
      db.collection("projects").aggregate([
        { $match: { visibility: "public", status: "open" } },
        { $unwind: "$skills" },
        { $group: { _id: "$skills", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]).toArray(),
      db.collection("projects").aggregate([
        { $match: { visibility: "public", status: "open" } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]).toArray(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        projects: projectsWithApplicationStatus,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: totalCount,
          totalPages,
          hasNext: query.page < totalPages,
          hasPrev: query.page > 1,
        },
        filters: {
          query: query.q || null,
          category: query.category || null,
          skills: query.skills || null,
          budgetMin: query.budgetMin,
          budgetMax: query.budgetMax,
          budgetType: query.budgetType || null,
          location: query.location || null,
        },
        facets: {
          skills: popularSkills.map(s => ({ name: s._id, count: s.count })),
          categories: popularCategories.map(c => ({ name: c._id, count: c.count })),
        },
      },
    })
  } catch (error) {
    console.error("❌ Error searching projects:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}