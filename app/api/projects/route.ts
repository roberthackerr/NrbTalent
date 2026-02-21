import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"


// Schéma simplifié pour éviter les erreurs de validation
const GetProjectsSchema = z.object({
  page: z.string().optional().transform(val => {
    const num = Number(val)
    return isNaN(num) || num < 1 ? 1 : num
  }).default("1"),
  limit: z.string().optional().transform(val => {
    const num = Number(val)
    return isNaN(num) || num < 1 || num > 100 ? 12 : num
  }).default("12"),
  category: z.string().optional().catch(undefined),
  skills: z.string().optional().catch(undefined),
  budgetMin: z.string().optional().transform(val => {
    const num = Number(val)
    return isNaN(num) ? undefined : num
  }).catch(undefined),
  budgetMax: z.string().optional().transform(val => {
    const num = Number(val)
    return isNaN(num) ? undefined : num
  }).catch(undefined),
  type: z.string().optional().catch(undefined),
  status: z.string().optional().default("open"),
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.string().optional().default("desc"),
  search: z.string().optional().catch(undefined)
})
const GetUserProjectsSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1).default(1)),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50).default(12)),
  status: z.string().optional(),
  role: z.enum(["client", "freelancer"]).optional()
})

const CreateProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  budget: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
    type: z.enum(["fixed", "hourly"]),
    currency: z.string().length(3).default("USD")
  }),
  skills: z.array(z.string()).min(1).max(20),
  // ✅ Accepter string et convertir en Date
  deadline: z.string().transform((str) => new Date(str)),
  visibility: z.enum(["public", "private"]).default("public"),
  tags: z.array(z.string()).max(10).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string()
  })).max(5).optional(),
  milestones: z.array(z.object({
    title: z.string(),
    amount: z.number().min(0),
    // ✅ Même traitement pour les milestones
    dueDate: z.string().transform((str) => new Date(str)),
    description: z.string().optional()
  })).max(10).optional(),
  status: z.enum(["draft", "open"]).default("draft")
})


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // ✅ Préparation des paramètres avec gestion des null
    const queryParams: Record<string, string | undefined> = {}
    
    // Copier seulement les paramètres qui existent
    for (const [key, value] of searchParams.entries()) {
      if (value !== null && value !== undefined && value !== '') {
        queryParams[key] = value
      }
    }

    console.log("📥 Paramètres nettoyés:", queryParams)

    // ✅ Validation ultra-permissive
    const validationResult = GetProjectsSchema.safeParse(queryParams)
    
    if (!validationResult.success) {
      console.log("❌ Erreur validation paramètres:", validationResult.error.issues)
      // ✅ Utiliser des valeurs par défaut au lieu de retourner une erreur
      console.log("🔄 Utilisation des valeurs par défaut...")
    }

    // ✅ Utiliser les données validées ou les valeurs par défaut
    const safeData = validationResult.success ? validationResult.data : {
      page: 1,
      limit: 12,
      status: "open",
      sortBy: "createdAt",
      sortOrder: "desc"
    }

    const {
      page,
      limit,
      category,
      skills,
      budgetMin,
      budgetMax,
      type,
      status,
      sortBy,
      sortOrder,
      search
    } = safeData

    const db = await getDatabase()
    const skip = (page - 1) * limit

    // ✅ Construction du filtre simple
    const filter: any = { 
      status: status || "open"
    }

    // Filtre par catégorie
    if (category && category !== "all") {
      filter.category = category
    }

    // Filtre par compétences
    if (skills) {
      const skillsArray = skills.split(",").map((skill: string) => skill.trim())
      filter.skills = { $in: skillsArray }
    }

    // Filtre par budget
    if (budgetMin !== undefined || budgetMax !== undefined) {
      filter["budget.min"] = {}
      if (budgetMin !== undefined) filter["budget.min"].$gte = budgetMin
      if (budgetMax !== undefined) filter["budget.min"].$lte = budgetMax
    }

    // Filtre par type de budget
    if (type && (type === "fixed" || type === "hourly")) {
      filter["budget.type"] = type
    }

    // Recherche texte
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { skills: { $in: [new RegExp(search, "i")] } }
      ]
    }

    console.log("🔍 Filtre final:", filter)

    // Tri
    const sortOptions: any = {}
    if (sortBy === "deadline") {
      sortOptions.deadline = sortOrder === "asc" ? 1 : -1
    } else if (sortBy === "budget") {
      sortOptions["budget.min"] = sortOrder === "asc" ? 1 : -1
    } else {
      sortOptions.createdAt = sortOrder === "asc" ? 1 : -1
    }

    // ✅ Requête simple sans aggregation complexe
    let projects = await db.collection("projects")
      .find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray()

    const totalCount = await db.collection("projects").countDocuments(filter)

    // ✅ Enrichir avec les données client
    if (projects.length > 0) {
      const clientIds = projects.map(p => p.clientId).filter(id => id)
      const clients = await db.collection("users")
        .find({ _id: { $in: clientIds } })
        .project({ name: 1, avatar: 1, title: 1 })
        .toArray()

      const clientMap = new Map(clients.map(client => [client._id.toString(), client]))

      projects = projects.map(project => ({
        ...project,
        client: clientMap.get(project.clientId?.toString())
      }))
    }

    const totalPages = Math.ceil(totalCount / limit)

    console.log(`✅ ${projects.length} projets trouvés sur ${totalCount}`)

    return NextResponse.json({
      projects: projects || [],
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des projets:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any).role !== "client") {
      return NextResponse.json(
        { error: "Non autorisé. Seuls les clients peuvent créer des projets." },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log("📥 Données reçues du frontend:", body)

    const validationResult = CreateProjectSchema.safeParse(body)

    if (!validationResult.success) {
      console.log("❌ Erreur de validation:", validationResult.error.issues)
      return NextResponse.json(
        { 
          error: "Données de projet invalides", 
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    console.log("🔄 Données après validation Zod:", validationResult.data)

    const db = await getDatabase()
    const clientId = new ObjectId((session.user as any).id)

    // Vérifier le nombre de projets actifs
    const activeProjectsCount = await db.collection("projects").countDocuments({
      clientId,
      status: { $in: ["draft", "open", "in-progress"] }
    })

    const userPlan = (session.user as any).plan || "free"
    const planLimits = {
      free: 5,
      premium: 50,
      enterprise: 100
    }
    const planLimit = planLimits[userPlan as keyof typeof planLimits] || planLimits.free

    if (activeProjectsCount >= planLimit) {
      return NextResponse.json(
        { 
          error: `Limite de projets actifs atteinte. Maximum: ${planLimit} projets.`,
          currentCount: activeProjectsCount,
          limit: planLimit,
          upgradeRequired: userPlan === "free"
        },
        { status: 400 }
      )
    }

    // Préparer les données du projet
    const projectData = {
      ...validationResult.data,
      clientId,
      applications: [],
      applicationCount: 0,
      freelancerId: null,
      milestones: validationResult.data.milestones?.map(milestone => ({
        ...milestone,
        status: "pending",
        dueDate: milestone.dueDate,
        completedAt: null
      })) || [],
      deadline: validationResult.data.deadline,
      attachments: validationResult.data.attachments || [],
      tags: validationResult.data.tags || [],
      skills: validationResult.data.skills,
      visibility: validationResult.data.visibility,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      featured: false,
      urgency: "normal",
      complexity: "medium",
      subcategory: validationResult.data.subcategory || ""
    }

    console.log("📤 Données à insérer en base:", projectData)

    // Insérer le projet
    const result = await db.collection("projects").insertOne(projectData)

    if (!result.insertedId) {
      throw new Error("Échec de l'insertion du projet")
    }

    // ✅ CORRECTION: Gérer les statistiques de manière robuste
    // D'abord récupérer l'état actuel de l'utilisateur
    const user = await db.collection("users").findOne(
      { _id: clientId },
      { projection: { statistics: 1 } }
    )

    console.log("👤 État actuel de l'utilisateur:", user)

    // Mettre à jour les statistiques selon l'état actuel
    if (user && user.statistics === null) {
      // Cas: statistics est null
      console.log("🔄 Réinitialisation des statistiques (étaient null)")
      await db.collection("users").updateOne(
        { _id: clientId },
        {
          $set: {
            statistics: {
              projectsCreated: 1,
              activeProjects: validationResult.data.status === "open" ? 1 : 0,
              completedProjects: 0,
              successRate: 0,
              onTimeDelivery: 0,
              clientSatisfaction: 0,
              responseRate: 0,
              avgResponseTime: 0,
              totalHoursWorked: 0,
              repeatClientRate: 0,
              earnings: {
                total: 0,
                thisMonth: 0,
                lastMonth: 0
              },
              profileViews: 0,
              proposalAcceptanceRate: 0
            },
            updatedAt: new Date()
          }
        }
      )
    } else if (user && user.statistics) {
      // Cas: statistics existe déjà
      console.log("📈 Incrémentation des statistiques existantes")
      await db.collection("users").updateOne(
        { _id: clientId },
        {
          $inc: {
            "statistics.projectsCreated": 1,
            "statistics.activeProjects": validationResult.data.status === "open" ? 1 : 0
          },
          $set: {
            updatedAt: new Date()
          }
        }
      )
    } else {
      // Cas: statistics n'existe pas
      console.log("🆕 Création des statistiques")
      await db.collection("users").updateOne(
        { _id: clientId },
        {
          $set: {
            statistics: {
              projectsCreated: 1,
              activeProjects: validationResult.data.status === "open" ? 1 : 0,
              completedProjects: 0,
              successRate: 0,
              onTimeDelivery: 0,
              clientSatisfaction: 0,
              responseRate: 0,
              avgResponseTime: 0,
              totalHoursWorked: 0,
              repeatClientRate: 0,
              earnings: {
                total: 0,
                thisMonth: 0,
                lastMonth: 0
              },
              profileViews: 0,
              proposalAcceptanceRate: 0
            },
            updatedAt: new Date()
          }
        }
      )
    }

    // Créer une notification pour l'utilisateur
await db.collection("notifications").insertOne({
  userId: clientId.toString(),
  category: "PROJECT", // ✅ Nouveau champ
  priority: validationResult.data.status === "open" ? "HIGH" : "MEDIUM", // ✅ Nouveau champ
  title: validationResult.data.status === "open" ? "🎉 Projet publié" : "📝 Brouillon créé",
  message: validationResult.data.status === "open" 
    ? `Votre projet "${projectData.title}" a été publié avec succès et est maintenant visible par les freelancers` 
    : `Votre projet "${projectData.title}" a été sauvegardé en brouillon`,
  data: {
    entityId: result.insertedId.toString(), // ✅ Format cohérent
    entityType: "project",
    metadata: {
      projectTitle: projectData.title,
      status: projectData.status,
      category: projectData.category,
      budgetType: projectData.budget.type,
      skills: projectData.skills,
      clientName: session.user.name
    }
  },
  actionUrl: `/projects/${result.insertedId}`, // ✅ URL d'action
  image: null, // ✅ Champ image
  status: "UNREAD", // ✅ Au lieu de "read: false"
  createdAt: new Date(),
  updatedAt: new Date() // ✅ Champ updatedAt requis
})

    console.log("✅ Projet créé avec succès:", {
      projectId: result.insertedId,
      title: projectData.title,
      status: projectData.status
    })

    return NextResponse.json(
      { 
        message: validationResult.data.status === "open" 
          ? "Projet publié avec succès" 
          : "Projet sauvegardé en brouillon",
        projectId: result.insertedId,
        status: validationResult.data.status,
        stats: {
          activeProjects: activeProjectsCount + (validationResult.data.status === "open" ? 1 : 0),
          limit: planLimit
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("❌ Erreur lors de la création du projet:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}


// Méthode PUT pour mettre à jour un projet existant
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, updates } = body

    if (!projectId) {
      return NextResponse.json({ error: "ID de projet requis" }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Vérifier que l'utilisateur est le propriétaire du projet
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      clientId: userId
    })

    if (!project) {
      return NextResponse.json(
        { error: "Projet non trouvé ou accès non autorisé" },
        { status: 404 }
      )
    }

    // Empêcher certaines modifications selon le statut
    if (project.status === "in-progress" || project.status === "completed") {
      const allowedUpdates = ["title", "description", "tags", "attachments"]
      const invalidUpdates = Object.keys(updates).filter(key => !allowedUpdates.includes(key))
      
      if (invalidUpdates.length > 0) {
        return NextResponse.json(
          { error: "Impossible de modifier certains champs sur un projet en cours ou terminé" },
          { status: 400 }
        )
      }
    }

    // Mettre à jour le projet
    const result = await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 })
    }

    // Créer une notification de mise à jour
    await db.collection("notifications").insertOne({
      userId: userId,
      type: "project_updated",
      title: "Projet mis à jour",
      message: `Votre projet "${project.title}" a été mis à jour`,
      projectId: new ObjectId(projectId),
      read: false,
      createdAt: new Date()
    })

    return NextResponse.json({
      message: "Projet mis à jour avec succès",
      updated: true
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour du projet:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}