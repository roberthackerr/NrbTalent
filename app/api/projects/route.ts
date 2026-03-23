// app/api/projects/route.ts - Version avec notifications multilingues
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"
import { notificationService } from "@/services/NotificationService"

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

// Schéma de validation pour POST
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

// Helper pour récupérer la langue d'un utilisateur
async function getUserLanguage(userId: string): Promise<'fr' | 'en' | 'mg'> {
  try {
    const db = await getDatabase()
    let objectId
    try {
      objectId = new ObjectId(userId)
    } catch {
      return 'fr'
    }
    const user = await db.collection("users").findOne(
      { _id: objectId },
      { projection: { language: 1, preferences: 1 } }
    )
    const userLang = user?.language || user?.preferences?.language || 'fr'
    return userLang === 'fr' || userLang === 'en' || userLang === 'mg' ? userLang : 'fr'
  } catch {
    return 'fr'
  }
}

// Messages multilingues pour les notifications
const notificationMessages = {
  projectCreated: {
    fr: {
      title: "📋 Projet publié",
      message: (title: string) => `Votre projet "${title}" a été publié avec succès`
    },
    en: {
      title: "📋 Project published",
      message: (title: string) => `Your project "${title}" has been published successfully`
    },
    mg: {
      title: "📋 Tetikasa navoaka",
      message: (title: string) => `Nivoaka soa aman-tsara ny tetikasanao "${title}"`
    }
  },
  newProjectAvailable: {
    fr: {
      title: "📋 Nouveau projet disponible",
      message: (title: string, skills: string[]) => `"${title}" - ${skills.slice(0, 3).join(', ')}`
    },
    en: {
      title: "📋 New project available",
      message: (title: string, skills: string[]) => `"${title}" - ${skills.slice(0, 3).join(', ')}`
    },
    mg: {
      title: "📋 Tetikasa vaovao misy",
      message: (title: string, skills: string[]) => `"${title}" - ${skills.slice(0, 3).join(', ')}`
    }
  },
  projectStatusChanged: {
    fr: {
      open: { title: "📋 Projet ouvert", message: (title: string) => `Le projet "${title}" est maintenant ouvert aux candidatures` },
      inProgress: { title: "🚀 Projet en cours", message: (title: string) => `Le projet "${title}" est maintenant en cours de réalisation` },
      completed: { title: "✅ Projet terminé", message: (title: string) => `Le projet "${title}" est terminé. N'oubliez pas de laisser un avis !` },
      cancelled: { title: "❌ Projet annulé", message: (title: string) => `Le projet "${title}" a été annulé` },
      updated: { title: "📝 Projet mis à jour", message: (title: string) => `Le projet "${title}" a été mis à jour` }
    },
    en: {
      open: { title: "📋 Project open", message: (title: string) => `Project "${title}" is now open for applications` },
      inProgress: { title: "🚀 Project in progress", message: (title: string) => `Project "${title}" is now in progress` },
      completed: { title: "✅ Project completed", message: (title: string) => `Project "${title}" is completed. Don't forget to leave a review!` },
      cancelled: { title: "❌ Project cancelled", message: (title: string) => `Project "${title}" has been cancelled` },
      updated: { title: "📝 Project updated", message: (title: string) => `Project "${title}" has been updated` }
    },
    mg: {
      open: { title: "📋 Tetikasa misokatra", message: (title: string) => `Misokatra ho an'ny fangatahana ny tetikasa "${title}"` },
      inProgress: { title: "🚀 Tetikasa mitohy", message: (title: string) => `Mitohy ny tetikasa "${title}"` },
      completed: { title: "✅ Tetikasa vita", message: (title: string) => `Vita ny tetikasa "${title}". Aza adino ny mamela hevitra!` },
      cancelled: { title: "❌ Tetikasa nofoanana", message: (title: string) => `Nofoanana ny tetikasa "${title}"` },
      updated: { title: "📝 Tetikasa nohavaozina", message: (title: string) => `Nohavaozina ny tetikasa "${title}"` }
    }
  },
  projectDeleted: {
    fr: {
      title: "🗑️ Projet supprimé",
      message: (title: string) => `Votre projet "${title}" a été supprimé`
    },
    en: {
      title: "🗑️ Project deleted",
      message: (title: string) => `Your project "${title}" has been deleted`
    },
    mg: {
      title: "🗑️ Tetikasa voafafa",
      message: (title: string) => `Nofafana ny tetikasanao "${title}"`
    }
  },
  projectDeletedForApplicant: {
    fr: {
      title: "🗑️ Projet supprimé",
      message: (title: string) => `Le projet "${title}" auquel vous avez postulé a été supprimé`
    },
    en: {
      title: "🗑️ Project deleted",
      message: (title: string) => `The project "${title}" you applied to has been deleted`
    },
    mg: {
      title: "🗑️ Tetikasa voafafa",
      message: (title: string) => `Nofafana ny tetikasa "${title}" nangatahanao`
    }
  }
}

// Helper pour envoyer une notification multilingue
async function sendMultilingualNotification(
  userId: string,
  templateKey: keyof typeof notificationMessages,
  data: any,
  subKey?: string
) {
  try {
    const userLang = await getUserLanguage(userId)
    const messages = notificationMessages[templateKey]
    
    let title: string
    let message: string
    
    if (subKey && messages[subKey as keyof typeof messages]) {
      const subMessages = messages[subKey as keyof typeof messages] as any
      title = subMessages[userLang]?.title || subMessages.fr.title
      message = subMessages[userLang]?.message(data.title || data) || subMessages.fr.message(data.title || data)
    } else {
      const msg = messages[userLang] || messages.fr
      title = msg.title
      message = typeof msg.message === 'function' ? msg.message(data.title || data) : msg.message
    }
    
    return await notificationService.send({
      userId,
      category: 'ORDER',
      priority: templateKey === 'projectStatusChanged' && data.status === 'completed' ? 'HIGH' : 'MEDIUM',
      title,
      message,
      actionUrl: `/projects/${data.projectId}`,
      data: {
        entityId: data.projectId,
        entityType: 'project',
        ...data
      }
    })
  } catch (error) {
    console.error('Error sending multilingual notification:', error)
    return null
  }
}

// Helper functions
const validateObjectId = (id: string): ObjectId | null => {
  try {
    return ObjectId.isValid(id) ? new ObjectId(id) : null
  } catch {
    return null
  }
}

const buildFilter = (data: z.infer<typeof GetProjectsQuerySchema>) => {
  const filter: any = { status: "open" }

  if (data.category) {
    filter.$or = [
      { category: data.category },
      { subcategory: data.category }
    ]
  }

  if (data.skills && data.skills.length > 0) {
    filter.skills = { $all: data.skills }
  }

  if (data.budgetMin > MIN_BUDGET || data.budgetMax < MAX_BUDGET) {
    filter.$and = [
      { "budget.min": { $gte: data.budgetMin } },
      { "budget.max": { $lte: data.budgetMax } }
    ]
  }

  if (data.type) {
    filter["budget.type"] = data.type
  }

  if (data.search) {
    const searchRegex = { $regex: data.search, $options: "i" }
    filter.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { "skills": searchRegex },
      { category: searchRegex },
      { subcategory: searchRegex }
    ]
  }

  if (data.clientId) {
    const clientId = validateObjectId(data.clientId)
    if (clientId) {
      filter.clientId = clientId
    }
  }

  filter.title = { $exists: true, $ne: "" }
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

// GET - Récupérer les projets
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    const validationResult = GetProjectsQuerySchema.safeParse(params)
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const query = validationResult.data
    const db = await getDatabase()
    
    const filter = buildFilter(query)
    const skip = (query.page - 1) * query.limit
    const sortOptions = buildSortOptions(query.sortBy, query.sortOrder)

    const [projects, totalCount] = await Promise.all([
      db.collection("projects")
        .find({ visibility: "public", ...filter })
        .sort(sortOptions)
        .skip(skip)
        .limit(query.limit)
        .toArray(),
      db.collection("projects").countDocuments(filter)
    ])

    if (projects.length > 0) {
      const clientIds = projects.map(p => p.clientId).filter(id => id)
      const uniqueClientIds = [...new Set(clientIds.map(id => id.toString()))]
      
      if (uniqueClientIds.length > 0) {
        const objectIds = uniqueClientIds.map(id => new ObjectId(id))
        const clients = await db.collection("users")
          .find({ _id: { $in: objectIds } })
          .project({ _id: 1, name: 1, avatar: 1, title: 1, rating: 1, completedProjects: 1 })
          .toArray()

        const clientMap = new Map(clients.map(client => [client._id.toString(), client]))
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
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Créer un projet
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const userRole = (session.user as any).role
    if (userRole !== "client") {
      return NextResponse.json(
        { success: false, error: "Only clients can create projects" },
        { status: 403 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON format" },
        { status: 400 }
      )
    }

    const validationResult = CreateProjectSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validationResult.error.errors },
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
    }

    const result = await db.collection("projects").insertOne(projectDocument)

    if (!result.insertedId) {
      throw new Error("Failed to insert project")
    }

    // 📢 NOTIFICATION MULTILINGUE: Projet créé
    await sendMultilingualNotification(
      clientId.toString(),
      'projectCreated',
      { title: projectData.title, projectId: result.insertedId.toString() }
    )

    // Si le projet est public, notifier les freelancers intéressés
    if (projectData.visibility === "public" && projectData.status === "open") {
      try {
        const freelancers = await db.collection("users")
          .find({
            role: "freelance",
            skills: { $in: projectData.skills },
            "preferences.notifications.newProjects": { $ne: false }
          })
          .project({ _id: 1 })
          .limit(50)
          .toArray()

        if (freelancers.length > 0) {
          await Promise.all(
            freelancers.map(freelancer => 
              sendMultilingualNotification(
                freelancer._id.toString(),
                'newProjectAvailable',
                { title: projectData.title, skills: projectData.skills, projectId: result.insertedId.toString() }
              )
            )
          )
          console.log(`📢 Notified ${freelancers.length} freelancers in their preferred language`)
        }
      } catch (broadcastError) {
        console.error('⚠️ Failed to notify freelancers:', broadcastError)
      }
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
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un projet
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { projectId, status, ...updates } = body

    if (!projectId || !ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { success: false, error: "Valid project ID is required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const userRole = (session.user as any).role

    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId)
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      )
    }

    const isOwner = project.clientId.toString() === userId.toString()
    const isAdmin = userRole === "admin"

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to update this project" },
        { status: 403 }
      )
    }

    const oldStatus = project.status
    const updateData = {
      ...updates,
      ...(status && { status }),
      updatedAt: new Date()
    }

    await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      { $set: updateData }
    )

    // 📢 NOTIFICATION MULTILINGUE: Changement de statut
    if (status && status !== oldStatus) {
      const statusKey = status as keyof typeof notificationMessages.projectStatusChanged.fr
      
      // Notifier le client
      await sendMultilingualNotification(
        project.clientId.toString(),
        'projectStatusChanged',
        { title: project.title, projectId, status, oldStatus },
        statusKey
      )

      // Si le projet est annulé, notifier les candidats
      if (status === 'cancelled' && project.applications?.length > 0) {
        const applicantIds = project.applications.map((app: any) => app.freelancerId)
        await Promise.all(
          applicantIds.map(applicantId =>
            sendMultilingualNotification(
              applicantId,
              'projectStatusChanged',
              { title: project.title, projectId, status: 'cancelled' },
              'cancelled'
            )
          )
        )
      }

      // Si le projet est terminé, notifier le freelancer sélectionné
      if (status === 'completed' && project.selectedFreelancerId) {
        await sendMultilingualNotification(
          project.selectedFreelancerId.toString(),
          'projectStatusChanged',
          { title: project.title, projectId, status: 'completed' },
          'completed'
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Project updated successfully"
    })

  } catch (error) {
    console.error("❌ Error updating project:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un projet
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('id')
    
    if (!projectId || !ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { success: false, error: "Valid project ID is required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const userRole = (session.user as any).role

    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId)
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      )
    }

    const isOwner = project.clientId.toString() === userId.toString()
    const isAdmin = userRole === "admin"
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to delete this project" },
        { status: 403 }
      )
    }

    const projectTitle = project.title
    const applicantIds = project.applications?.map((app: any) => app.freelancerId) || []

    const result = await db.collection("projects").deleteOne({
      _id: new ObjectId(projectId)
    })

    if (result.deletedCount === 0) {
      throw new Error("Failed to delete project")
    }

    // 📢 NOTIFICATION MULTILINGUE: Projet supprimé
    // Notifier le client
    await sendMultilingualNotification(
      project.clientId.toString(),
      'projectDeleted',
      { title: projectTitle, projectId }
    )

    // Notifier les candidats
    if (applicantIds.length > 0) {
      await Promise.all(
        applicantIds.map(applicantId =>
          sendMultilingualNotification(
            applicantId,
            'projectDeletedForApplicant',
            { title: projectTitle, projectId }
          )
        )
      )
    }

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully"
    })

  } catch (error) {
    console.error("❌ Error deleting project:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}