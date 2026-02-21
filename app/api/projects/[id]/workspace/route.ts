import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

// Schémas de validation
const TaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  assignedTo: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().datetime().optional()
})

const FileSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url(),
  type: z.string(),
  size: z.number().min(0)
})

const MilestoneSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  amount: z.number().min(0),
  dueDate: z.string().datetime()
})

const WorkspaceActionSchema = z.object({
  action: z.enum([
    "add_task", "update_task", "delete_task",
    "add_file", "delete_file",
    "add_milestone", "update_milestone", "delete_milestone",
    "add_team_member", "remove_team_member"
  ]),
  data: z.any()
})

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "ID de projet invalide" }, { status: 400 })
    }

    const db = await getDatabase()
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(params.id)
    })

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 })
    }

    // Vérifier l'accès
    const hasAccess = 
      project.clientId.toString() === (session.user as any).id ||
      project.freelancerId?.toString() === (session.user as any).id ||
      project.teamMembers?.some((m: any) => m.userId.toString() === (session.user as any).id)

    if (!hasAccess) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Récupérer les données enrichies
    const [tasks, files, milestones, teamMembers] = await Promise.all([
      db.collection("tasks").find({ projectId: new ObjectId(params.id) }).toArray(),
      db.collection("files").find({ projectId: new ObjectId(params.id) }).toArray(),
      db.collection("milestones").find({ projectId: new ObjectId(params.id) }).toArray(),
      project.teamMembers ? db.collection("users").find({
        _id: { $in: project.teamMembers.map((m: any) => new ObjectId(m.userId)) }
      }, {
        projection: { name: 1, avatar: 1, title: 1, skills: 1 }
      }).toArray() : Promise.resolve([])
    ])

    return NextResponse.json({
      tasks,
      files,
      milestones,
      teamMembers,
      projectInfo: {
        title: project.title,
        status: project.status,
        deadline: project.deadline
      }
    })
  } catch (error) {
    console.error("Erreur lors de la récupération du workspace:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" }, 
      { status: 500 }
    )
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "ID de projet invalide" }, { status: 400 })
    }

    const body = await request.json()
    const validationResult = WorkspaceActionSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Action invalide", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { action, data } = validationResult.data
    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Vérifier l'accès et les permissions
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(params.id)
    })

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 })
    }

    const isClient = project.clientId.toString() === userId.toString()
    const isFreelancer = project.freelancerId?.toString() === userId.toString()
    const isTeamMember = project.teamMembers?.some((m: any) => m.userId.toString() === userId.toString())

    if (!isClient && !isFreelancer && !isTeamMember) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    let result: any

    switch (action) {
      case "add_task":
        const taskValidation = TaskSchema.safeParse(data)
        if (!taskValidation.success) {
          return NextResponse.json(
            { error: "Données de tâche invalides", details: taskValidation.error.issues },
            { status: 400 }
          )
        }

        result = await db.collection("tasks").insertOne({
          ...taskValidation.data,
          projectId: new ObjectId(params.id),
          status: "todo",
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        break

      case "update_task":
        if (!data.taskId) {
          return NextResponse.json({ error: "ID de tâche requis" }, { status: 400 })
        }

        result = await db.collection("tasks").updateOne(
          { _id: new ObjectId(data.taskId), projectId: new ObjectId(params.id) },
          {
            $set: {
              ...data.updates,
              updatedAt: new Date(),
              ...(data.updates.status === "done" && { completedAt: new Date() })
            }
          }
        )
        break

      case "add_file":
        const fileValidation = FileSchema.safeParse(data)
        if (!fileValidation.success) {
          return NextResponse.json(
            { error: "Données de fichier invalides", details: fileValidation.error.issues },
            { status: 400 }
          )
        }

        result = await db.collection("files").insertOne({
          ...fileValidation.data,
          projectId: new ObjectId(params.id),
          uploadedBy: userId,
          uploadedAt: new Date()
        })
        break

      case "add_milestone":
        const milestoneValidation = MilestoneSchema.safeParse(data)
        if (!milestoneValidation.success) {
          return NextResponse.json(
            { error: "Données de jalon invalides", details: milestoneValidation.error.issues },
            { status: 400 }
          )
        }

        // Seul le client peut ajouter des milestones
        if (!isClient) {
          return NextResponse.json({ error: "Action non autorisée" }, { status: 403 })
        }

        result = await db.collection("milestones").insertOne({
          ...milestoneValidation.data,
          projectId: new ObjectId(params.id),
          status: "pending",
          createdAt: new Date()
        })
        break

      default:
        return NextResponse.json({ error: "Action non supportée" }, { status: 400 })
    }

    // Mettre à jour la date de modification du projet
    await db.collection("projects").updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { updatedAt: new Date() } }
    )

    return NextResponse.json({ 
      success: true, 
      message: "Action effectuée avec succès",
      result 
    })
  } catch (error) {
    console.error("Erreur lors de l'action workspace:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" }, 
      { status: 500 }
    )
  }
}