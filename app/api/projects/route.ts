// app/api/projects/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"
import { notificationService } from "@/services/NotificationService"
import { v2 as cloudinary } from "cloudinary"

// ─── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
    url: {
    secure: true,
    private_cdn: false,
    sign_url: false // ← Important!
  }
});

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_PAGE  = 1
const DEFAULT_LIMIT = 12
const MAX_LIMIT     = 100
const MIN_BUDGET    = 0
const MAX_BUDGET    = 1_000_000

// ─── Schemas ──────────────────────────────────────────────────────────────────
const GetProjectsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default(DEFAULT_PAGE.toString())
    .transform((val) => {
      const num = parseInt(val, 10)
      return isNaN(num) || num < 1 ? DEFAULT_PAGE : num
    }),
  limit: z
    .string()
    .optional()
    .default(DEFAULT_LIMIT.toString())
    .transform((val) => {
      const num = parseInt(val, 10)
      return isNaN(num) || num < 1 || num > MAX_LIMIT ? DEFAULT_LIMIT : num
    }),
  category: z
    .string()
    .optional()
    .transform((val) => (val === "all" ? undefined : val)),
  skills: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined
      const skills = val.split(",").map((s) => s.trim()).filter((s) => s.length > 0)
      return skills.length > 0 ? skills : undefined
    }),
  budgetMin: z
    .string()
    .optional()
    .default(MIN_BUDGET.toString())
    .transform((val) => {
      const num = parseInt(val, 10)
      return isNaN(num) || num < MIN_BUDGET ? MIN_BUDGET : num
    }),
  budgetMax: z
    .string()
    .optional()
    .default(MAX_BUDGET.toString())
    .transform((val) => {
      const num = parseInt(val, 10)
      return isNaN(num) || num > MAX_BUDGET ? MAX_BUDGET : num
    }),
  type: z
    .enum(["fixed", "hourly", ""])
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  status: z
    .enum(["draft", "open", "in-progress", "completed", "cancelled", "paused", ""])
    .optional()
    .default("open")
    .transform((val) => (val === "" ? "open" : val)),
  sortBy: z
    .enum(["createdAt", "deadline", "budget.min", "budget.max", "applicationCount", "views", ""])
    .optional()
    .default("createdAt"),
  sortOrder: z
    .enum(["asc", "desc", ""])
    .optional()
    .default("desc")
    .transform((val) => (val === "" ? "desc" : val)),
  search: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined
      const trimmed = val.trim()
      return trimmed.length > 0 ? trimmed : undefined
    }),
  clientId: z
    .string()
    .optional()
    .refine((val) => !val || ObjectId.isValid(val), {
      message: "Invalid clientId format",
    }),
})

// FIX: resourceType stocké en base pour la suppression correcte
const AttachmentSchema = z.object({
  url:          z.string(),
  publicId:     z.string(),
  name:         z.string(),
  type:         z.string(),
  size:         z.number(),
  thumbnail:    z.string().optional(),
  resourceType: z.string().optional(), // "image" | "video" | "raw" — retourné par Cloudinary
  base64Data:   z.string().optional(), // base64 envoyé par le client pour l'upload
})

const CreateProjectSchema = z.object({
  title:       z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category:    z.string().min(1),
  subcategory: z.string().optional().default(""),
  skills:      z.array(z.string()).min(1).max(20),
  budget: z.object({
    min:              z.number().min(0).max(MAX_BUDGET),
    max:              z.number().min(0).max(MAX_BUDGET),
    type:             z.enum(["fixed", "hourly"]),
    currency:         z.string().default("EUR"),
    originalCurrency: z.string().optional(),
    exchangeRate:     z.number().optional(),
  }),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  status:      z.enum(["draft", "open"]).default("draft"),
  visibility:  z.enum(["public", "private"]).optional().default("public"),
  tags:        z.array(z.string()).optional().default([]),
  attachments: z.array(AttachmentSchema).optional().default([]),
  location: z
    .object({
      remote:   z.boolean().default(true),
      country:  z.string().optional(),
      city:     z.string().optional(),
      timezone: z.string().optional(),
    })
    .optional()
    .default({ remote: true }),
  metadata: z
    .object({
      urgency:    z.enum(["low", "medium", "high"]).optional().default("medium"),
      complexity: z.enum(["beginner", "intermediate", "expert"]).optional().default("intermediate"),
      milestones: z
        .array(
          z.object({
            title:       z.string(),
            amount:      z.number(),
            dueDate:     z.string(),
            description: z.string(),
            currency:    z.string(),
          })
        )
        .optional()
        .default([]),
    })
    .optional()
    .default({}),
})

// ─── Types ────────────────────────────────────────────────────────────────────
type ProcessedAttachment = {
  url:          string
  publicId:     string
  name:         string
  type:         string
  size:         number
  thumbnail?:   string
  resourceType: string  // stocké pour la suppression correcte
}

// ─── Cloudinary upload helper ─────────────────────────────────────────────────
// ─── Cloudinary upload helper ─────────────────────────────────────────────────
// In your projects route.ts
async function uploadAttachmentToCloudinary(attachment: {
  base64Data: string
  name: string
  type: string
  size: number
}) {
  try {
    const isPdf = attachment.type === 'application/pdf'
    const isImage = attachment.type.startsWith('image/')
    
    // Ensure base64 has the correct MIME prefix
    let base64WithPrefix = attachment.base64Data
    if (!attachment.base64Data.startsWith('data:')) {
      base64WithPrefix = isPdf 
        ? `data:application/pdf;base64,${attachment.base64Data}`
        : `data:${attachment.type};base64,${attachment.base64Data}`
    }

    const uploadOptions: Record<string, any> = {
      folder: 'nrbtalents/projects', // Match verification folder structure
      public_id: `project_attachments/${Date.now()}_${attachment.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      resource_type: isPdf ? 'raw' : isImage ? 'image' : 'raw',
      access_mode: 'public',
      tags: ['project', 'attachment'],
    }

    // For PDFs, don't add transformation that forces download
    if (!isPdf) {
      uploadOptions.transformation = [
        { width: 1200, crop: 'limit', quality: 'auto' }
      ]
    }

    const result = await cloudinary.uploader.upload(base64WithPrefix, uploadOptions)
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      thumbnail: isImage ? result.secure_url : undefined,
      resourceType: result.resource_type,
    }
  } catch (error) {
    console.error('Upload error:', error)
    return null
  }
}
// Traite tous les attachements :
// - base64Data présent → upload vers Cloudinary
// - url + publicId présents → déjà uploadé, on conserve
// - sinon → ignoré
async function processAttachments(
  rawAttachments: z.infer<typeof AttachmentSchema>[]
): Promise<ProcessedAttachment[]> {
  if (!rawAttachments || rawAttachments.length === 0) return []

  const processed: ProcessedAttachment[] = []

  for (const attachment of rawAttachments) {
    if (attachment.base64Data) {
      console.log(`⬆️  Uploading [${attachment.name}]…`)
      const uploaded = await uploadAttachmentToCloudinary({
        base64Data: attachment.base64Data,
        name:       attachment.name,
        type:       attachment.type,
        size:       attachment.size,
      })

      if (uploaded) {
        processed.push({
          url:          uploaded.url,
          publicId:     uploaded.publicId,
          name:         attachment.name,
          type:         attachment.type,
          size:         attachment.size,
          thumbnail:    uploaded.thumbnail,
          resourceType: uploaded.resourceType,
        })
      } else {
        console.warn(`⚠️  Skipped [${attachment.name}] — upload failed`)
      }
    } else if (attachment.url && attachment.publicId) {
      // Fichier déjà uploadé — on conserve avec son resourceType
      processed.push({
        url:          attachment.url,
        publicId:     attachment.publicId,
        name:         attachment.name,
        type:         attachment.type,
        size:         attachment.size,
        thumbnail:    attachment.thumbnail,
        resourceType: attachment.resourceType ?? "auto",
      })
    }
    // sinon: attachment invalide → ignoré
  }

  return processed
}

// Supprime un fichier Cloudinary avec le bon resource_type
async function deleteCloudinaryFile(publicId: string, resourceType = "auto") {
  try {
    await cloudinary.uploader.destroy(publicId, {
      // FIX: utiliser le resourceType stocké en base
      // plutôt qu'une détection par extension peu fiable
      resource_type: resourceType as any,
    })
    console.log(`✅ Deleted Cloudinary [${publicId}] (${resourceType})`)
  } catch (err) {
    console.error(`⚠️  Failed to delete Cloudinary [${publicId}]:`, err)
  }
}

// ─── Notification helpers ─────────────────────────────────────────────────────
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

const notificationMessages = {
  projectCreated: {
    fr: { title: "📋 Projet publié",    message: (t: string) => `Votre projet "${t}" a été publié avec succès` },
    en: { title: "📋 Project published", message: (t: string) => `Your project "${t}" has been published successfully` },
    mg: { title: "📋 Tetikasa navoaka", message: (t: string) => `Nivoaka soa aman-tsara ny tetikasanao "${t}"` },
  },
  newProjectAvailable: {
    fr: { title: "📋 Nouveau projet disponible", message: (t: string, s: string[]) => `"${t}" - ${s.slice(0, 3).join(", ")}` },
    en: { title: "📋 New project available",     message: (t: string, s: string[]) => `"${t}" - ${s.slice(0, 3).join(", ")}` },
    mg: { title: "📋 Tetikasa vaovao misy",      message: (t: string, s: string[]) => `"${t}" - ${s.slice(0, 3).join(", ")}` },
  },
  projectStatusChanged: {
    fr: {
      open:       { title: "📋 Projet ouvert",     message: (t: string) => `Le projet "${t}" est maintenant ouvert aux candidatures` },
      inProgress: { title: "🚀 Projet en cours",   message: (t: string) => `Le projet "${t}" est maintenant en cours de réalisation` },
      completed:  { title: "✅ Projet terminé",    message: (t: string) => `Le projet "${t}" est terminé. N'oubliez pas de laisser un avis !` },
      cancelled:  { title: "❌ Projet annulé",     message: (t: string) => `Le projet "${t}" a été annulé` },
      updated:    { title: "📝 Projet mis à jour", message: (t: string) => `Le projet "${t}" a été mis à jour` },
    },
    en: {
      open:       { title: "📋 Project open",       message: (t: string) => `Project "${t}" is now open for applications` },
      inProgress: { title: "🚀 Project in progress", message: (t: string) => `Project "${t}" is now in progress` },
      completed:  { title: "✅ Project completed",  message: (t: string) => `Project "${t}" is completed. Don't forget to leave a review!` },
      cancelled:  { title: "❌ Project cancelled",  message: (t: string) => `Project "${t}" has been cancelled` },
      updated:    { title: "📝 Project updated",    message: (t: string) => `Project "${t}" has been updated` },
    },
    mg: {
      open:       { title: "📋 Tetikasa misokatra",   message: (t: string) => `Misokatra ho an'ny fangatahana ny tetikasa "${t}"` },
      inProgress: { title: "🚀 Tetikasa mitohy",      message: (t: string) => `Mitohy ny tetikasa "${t}"` },
      completed:  { title: "✅ Tetikasa vita",        message: (t: string) => `Vita ny tetikasa "${t}". Aza adino ny mamela hevitra!` },
      cancelled:  { title: "❌ Tetikasa nofoanana",   message: (t: string) => `Nofoanana ny tetikasa "${t}"` },
      updated:    { title: "📝 Tetikasa nohavaozina", message: (t: string) => `Nohavaozina ny tetikasa "${t}"` },
    },
  },
  projectDeleted: {
    fr: { title: "🗑️ Projet supprimé",  message: (t: string) => `Votre projet "${t}" a été supprimé` },
    en: { title: "🗑️ Project deleted",  message: (t: string) => `Your project "${t}" has been deleted` },
    mg: { title: "🗑️ Tetikasa voafafa", message: (t: string) => `Nofafana ny tetikasanao "${t}"` },
  },
  projectDeletedForApplicant: {
    fr: { title: "🗑️ Projet supprimé",  message: (t: string) => `Le projet "${t}" auquel vous avez postulé a été supprimé` },
    en: { title: "🗑️ Project deleted",  message: (t: string) => `The project "${t}" you applied to has been deleted` },
    mg: { title: "🗑️ Tetikasa voafafa", message: (t: string) => `Nofafana ny tetikasa "${t}" nangatahanao` },
  },
}

async function sendMultilingualNotification(
  userId:      string,
  templateKey: keyof typeof notificationMessages,
  data:        any,
  subKey?:     string
) {
  try {
    const userLang = await getUserLanguage(userId)
    const messages = notificationMessages[templateKey] as any

    let title:   string
    let message: string

    if (subKey && messages[subKey]) {
      const sub = messages[subKey]
      const loc = sub[userLang] ?? sub.fr
      title   = loc.title
      message = loc.message(data.title || data)
    } else {
      const loc = messages[userLang] ?? messages.fr
      title   = loc.title
      message = typeof loc.message === "function"
        ? loc.message(data.title || data, data.skills || [])
        : loc.message
    }

    return await notificationService.send({
      userId,
      category:  "ORDER",
      priority:
        templateKey === "projectStatusChanged" && data.status === "completed"
          ? "HIGH"
          : "MEDIUM",
      title,
      message,
      actionUrl: `/projects/${data.projectId}`,
      data: { entityId: data.projectId, entityType: "project", ...data },
    })
  } catch (error) {
    console.error("Error sending multilingual notification:", error)
    return null
  }
}

// ─── Query helpers ────────────────────────────────────────────────────────────
const validateObjectId = (id: string): ObjectId | null => {
  try { return ObjectId.isValid(id) ? new ObjectId(id) : null } catch { return null }
}

const buildFilter = (data: z.infer<typeof GetProjectsQuerySchema>) => {
  const filter: any = { status: "open" }

  if (data.category) {
    filter.$or = [{ category: data.category }, { subcategory: data.category }]
  }

  if (data.skills && data.skills.length > 0) {
    filter.skills = { $all: data.skills }
  }

  if (data.budgetMin > MIN_BUDGET || data.budgetMax < MAX_BUDGET) {
    filter.$and = [
      { "budget.min": { $gte: data.budgetMin } },
      { "budget.max": { $lte: data.budgetMax } },
    ]
  }

  if (data.type) filter["budget.type"] = data.type

  if (data.search) {
    const searchRegex = { $regex: data.search, $options: "i" }
    filter.$or = [
      { title:       searchRegex },
      { description: searchRegex },
      { skills:      searchRegex },
      { category:    searchRegex },
      { subcategory: searchRegex },
    ]
  }

  if (data.clientId) {
    const clientId = validateObjectId(data.clientId)
    if (clientId) filter.clientId = clientId
  }

  filter.title = { $exists: true, $ne: "" }
  return filter
}

const buildSortOptions = (sortBy: string, sortOrder: string) => {
  const dir = sortOrder === "asc" ? 1 : -1
  const map: Record<string, any> = {
    "deadline":         { deadline:         dir },
    "budget.min":       { "budget.min":     dir },
    "budget.max":       { "budget.max":     dir },
    "applicationCount": { applicationCount: dir },
    "views":            { views:            dir },
  }
  return map[sortBy] ?? { createdAt: dir }
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const params           = Object.fromEntries(searchParams.entries())

    const validation = GetProjectsQuerySchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters", details: validation.error.issues },
        { status: 400 }
      )
    }

    const query = validation.data
    const db    = await getDatabase()

    const filter      = buildFilter(query)
    const skip        = (query.page - 1) * query.limit
    const sortOptions = buildSortOptions(query.sortBy, query.sortOrder)

    const [projects, totalCount] = await Promise.all([
      db.collection("projects")
        .find({ visibility: "public", ...filter })
        .sort(sortOptions)
        .skip(skip)
        .limit(query.limit)
        .toArray(),
      db.collection("projects").countDocuments(filter),
    ])

    // Hydrate client info
    if (projects.length > 0) {
      const uniqueClientIds = [
        ...new Set(projects.map((p) => p.clientId?.toString()).filter(Boolean)),
      ].map((id) => new ObjectId(id!))

      if (uniqueClientIds.length > 0) {
        const clients = await db
          .collection("users")
          .find({ _id: { $in: uniqueClientIds } })
          .project({ _id: 1, name: 1, avatar: 1, title: 1, rating: 1, completedProjects: 1 })
          .toArray()

        const clientMap = new Map(clients.map((c) => [c._id.toString(), c]))
        projects.forEach((p) => {
          if (p.clientId) p.client = clientMap.get(p.clientId.toString())
        })
      }
    }

    const totalPages = Math.ceil(totalCount / query.limit)

    return NextResponse.json({
      success: true,
      data: {
        projects,
        pagination: {
          page:      query.page,
          limit:     query.limit,
          total:     totalCount,
          totalPages,
          hasNext:   query.page < totalPages,
          hasPrev:   query.page > 1,
        },
        filters: {
          category:  query.category,
          skills:    query.skills,
          budgetMin: query.budgetMin,
          budgetMax: query.budgetMax,
          type:      query.type,
        },
      },
    })
  } catch (error) {
    console.error("❌ Error fetching projects:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== "client") {
      return NextResponse.json({ success: false, error: "Only clients can create projects" }, { status: 403 })
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON format" }, { status: 400 })
    }

    const validation = CreateProjectSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      )
    }

    const projectData = validation.data
    const db          = await getDatabase()
    const clientId    = new ObjectId((session.user as any).id)

    // ✅ Upload des attachements directement vers Cloudinary
    // resource_type "auto" + access_mode "public" = pas de HTTP 401
    let processedAttachments: ProcessedAttachment[] = []
    if (projectData.attachments && projectData.attachments.length > 0) {
      console.log(`📎 Processing ${projectData.attachments.length} attachment(s)…`)
      processedAttachments = await processAttachments(projectData.attachments)
      console.log(`✅ ${processedAttachments.length}/${projectData.attachments.length} attachment(s) ready`)
    }

    const projectDocument = {
      ...projectData,
      // Stocke les URLs Cloudinary — jamais de base64 en base de données
      attachments:      processedAttachments,
      clientId,
      applications:     [],
      applicationCount: 0,
      views:            0,
      metadata: {
        ...projectData.metadata,
        createdAt:      new Date(),
        lastActivityAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("projects").insertOne(projectDocument)
    if (!result.insertedId) throw new Error("Failed to insert project")

    const projectId = result.insertedId.toString()

    // 📢 Notification au client
    await sendMultilingualNotification(
      clientId.toString(),
      "projectCreated",
      { title: projectData.title, projectId }
    )

    // 📢 Notifications aux freelancers si projet public & ouvert
    if (projectData.visibility === "public" && projectData.status === "open") {
      try {
        const freelancers = await db
          .collection("users")
          .find({
            role:   "freelance",
            skills: { $in: projectData.skills },
            "preferences.notifications.newProjects": { $ne: false },
          })
          .project({ _id: 1 })
          .limit(50)
          .toArray()

        if (freelancers.length > 0) {
          await Promise.all(
            freelancers.map((f) =>
              sendMultilingualNotification(f._id.toString(), "newProjectAvailable", {
                title:     projectData.title,
                skills:    projectData.skills,
                projectId,
              })
            )
          )
          console.log(`📢 Notified ${freelancers.length} freelancer(s)`)
        }
      } catch (err) {
        console.error("⚠️  Failed to notify freelancers:", err)
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Project created successfully",
        data: {
          projectId,
          status:              projectData.status,
          attachmentsUploaded: processedAttachments.length,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("❌ Error creating project:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON format" }, { status: 400 })
    }

    const { projectId, status, attachments: rawAttachments, ...updates } = body

    if (!projectId || !ObjectId.isValid(projectId)) {
      return NextResponse.json({ success: false, error: "Valid project ID is required" }, { status: 400 })
    }

    const db       = await getDatabase()
    const userId   = new ObjectId((session.user as any).id)
    const userRole = (session.user as any).role

    const project = await db.collection("projects").findOne({ _id: new ObjectId(projectId) })
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    const isOwner = project.clientId.toString() === userId.toString()
    const isAdmin = userRole === "admin"
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized to update this project" }, { status: 403 })
    }

    // ✅ Traiter les nouveaux attachements si fournis
    let processedAttachments: ProcessedAttachment[] = project.attachments || []
    if (rawAttachments && Array.isArray(rawAttachments) && rawAttachments.length > 0) {
      const validation = z.array(AttachmentSchema).safeParse(rawAttachments)
      if (validation.success) {
        console.log(`📎 Updating attachments for project ${projectId}…`)
        processedAttachments = await processAttachments(validation.data)
      }
    }

    const oldStatus  = project.status
    const updateData = {
      ...updates,
      attachments: processedAttachments,
      ...(status && { status }),
      updatedAt: new Date(),
    }

    await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      { $set: updateData }
    )

    // 📢 Notifications sur changement de statut
    if (status && status !== oldStatus) {
      await sendMultilingualNotification(
        project.clientId.toString(),
        "projectStatusChanged",
        { title: project.title, projectId, status, oldStatus },
        status
      )

      if (status === "cancelled" && project.applications?.length > 0) {
        await Promise.all(
          project.applications.map((app: any) =>
            sendMultilingualNotification(
              app.freelancerId,
              "projectStatusChanged",
              { title: project.title, projectId, status: "cancelled" },
              "cancelled"
            )
          )
        )
      }

      if (status === "completed" && project.selectedFreelancerId) {
        await sendMultilingualNotification(
          project.selectedFreelancerId.toString(),
          "projectStatusChanged",
          { title: project.title, projectId, status: "completed" },
          "completed"
        )
      }
    }

    return NextResponse.json({ success: true, message: "Project updated successfully" })
  } catch (error) {
    console.error("❌ Error updating project:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId        = searchParams.get("id")

    if (!projectId || !ObjectId.isValid(projectId)) {
      return NextResponse.json({ success: false, error: "Valid project ID is required" }, { status: 400 })
    }

    const db       = await getDatabase()
    const userId   = new ObjectId((session.user as any).id)
    const userRole = (session.user as any).role

    const project = await db.collection("projects").findOne({ _id: new ObjectId(projectId) })
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    const isOwner = project.clientId.toString() === userId.toString()
    const isAdmin = userRole === "admin"
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized to delete this project" }, { status: 403 })
    }

    const projectTitle = project.title
    const applicantIds = project.applications?.map((app: any) => app.freelancerId) || []

    // ✅ Supprimer les fichiers Cloudinary avec le bon resource_type
    // FIX: on utilise le resourceType stocké en base (retourné par Cloudinary lors de l'upload)
    // au lieu d'une détection par extension peu fiable qui causait des erreurs de suppression
    const attachments: ProcessedAttachment[] = project.attachments || []
    if (attachments.length > 0) {
      console.log(`🗑️  Deleting ${attachments.length} Cloudinary file(s)…`)
      await Promise.allSettled(
        attachments
          .filter((a) => a.publicId)
          .map((a) => deleteCloudinaryFile(a.publicId, a.resourceType ?? "auto"))
      )
    }

    const result = await db.collection("projects").deleteOne({ _id: new ObjectId(projectId) })
    if (result.deletedCount === 0) throw new Error("Failed to delete project")

    // 📢 Notification au client
    await sendMultilingualNotification(
      project.clientId.toString(),
      "projectDeleted",
      { title: projectTitle, projectId }
    )

    // 📢 Notifications aux candidats
    if (applicantIds.length > 0) {
      await Promise.all(
        applicantIds.map((id: string) =>
          sendMultilingualNotification(id, "projectDeletedForApplicant", {
            title: projectTitle,
            projectId,
          })
        )
      )
    }

    return NextResponse.json({ success: true, message: "Project deleted successfully" })
  } catch (error) {
    console.error("❌ Error deleting project:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}