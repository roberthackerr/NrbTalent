// app/api/applications/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

const UpdateApplicationSchema = z.object({
  status: z.enum(["accepted", "rejected", "pending"])
})

export async function PATCH(request: Request,  { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    const {id}=await params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de candidature invalide" }, { status: 400 })
    }

    const body = await request.json()
    const validationResult = UpdateApplicationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { status } = validationResult.data
    const db = await getDatabase()
    const applicationId = new ObjectId(id)
    const clientId = new ObjectId((session.user as any).id)

    // Récupérer la candidature avec les infos du projet
    const application = await db.collection("applications").findOne({
      _id: applicationId
    })

    if (!application) {
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Vérifier que l'utilisateur est le client du projet
    const project = await db.collection("projects").findOne({
      _id: application.projectId,
      clientId
    })

    if (!project) {
      return NextResponse.json(
        { error: "Accès non autorisé à cette candidature" }, 
        { status: 403 }
      )
    }

    // Mettre à jour la candidature
    const result = await db.collection("applications").updateOne(
      { _id: applicationId },
      {
        $set: {
          status,
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Échec de la mise à jour" }, { status: 500 })
    }

    // Si la candidature est acceptée, mettre à jour le projet
    if (status === "accepted") {
      await db.collection("projects").updateOne(
        { _id: application.projectId },
        {
          $set: {
            freelancerId: application.freelancerId,
            status: "in-progress",
            updatedAt: new Date()
          }
        }
      )

      // Rejeter automatiquement les autres candidatures
      await db.collection("applications").updateMany(
        {
          projectId: application.projectId,
          _id: { $ne: applicationId },
          status: "pending"
        },
        {
          $set: {
            status: "rejected",
            updatedAt: new Date()
          }
        }
      )

      // Notification pour le freelancer accepté
      await db.collection("notifications").insertOne({
        userId: application.freelancerId,
        type: "application_accepted",
        title: "Candidature acceptée !",
        message: `Votre candidature pour "${project.title}" a été acceptée. Budget: ${application.proposedBudget} ${project.budget.currency}`,
        projectId: application.projectId,
        read: false,
        createdAt: new Date()
      })

      // Notifications pour les freelancers rejetés
      const rejectedApplications = await db.collection("applications").find({
        projectId: application.projectId,
        _id: { $ne: applicationId },
        status: "rejected"
      }).toArray()

      for (const app of rejectedApplications) {
        await db.collection("notifications").insertOne({
          userId: app.freelancerId,
          type: "application_rejected",
          title: "Candidature non retenue",
          message: `Votre candidature pour "${project.title}" n'a pas été retenue.`,
          projectId: application.projectId,
          read: false,
          createdAt: new Date()
        })
      }
    }

    return NextResponse.json({
      message: `Candidature ${status === 'accepted' ? 'acceptée' : 'rejetée'} avec succès`,
      applicationId: id,
      status
    })

  } catch (error) {
    console.error("Erreur mise à jour candidature:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "ID de candidature invalide" }, { status: 400 })
    }

    const db = await getDatabase()
    const applicationId = new ObjectId(params.id)
    const userId = new ObjectId((session.user as any).id)

    const application = await db.collection("applications").aggregate([
      { $match: { _id: applicationId } },
      {
        $lookup: {
          from: "projects",
          localField: "projectId",
          foreignField: "_id",
          as: "project"
        }
      },
      { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "freelancerId",
          foreignField: "_id",
          as: "freelancer"
        }
      },
      { $unwind: { path: "$freelancer", preserveNullAndEmptyArrays: true } }
    ]).next()

    if (!application) {
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Vérifier les permissions
    const isClient = application.project.clientId.toString() === userId.toString()
    const isFreelancer = application.freelancerId.toString() === userId.toString()

    if (!isClient && !isFreelancer) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    return NextResponse.json({ application })

  } catch (error) {
    console.error("Erreur récupération candidature:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}