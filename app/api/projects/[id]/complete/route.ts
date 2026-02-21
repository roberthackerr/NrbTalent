import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

const CompleteProjectSchema = z.object({
  finalNotes: z.string().max(1000).optional(),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().max(2000).optional()
})

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "ID de projet invalide" }, { status: 400 })
    }

    const data = await request.json()
    const validationResult = CompleteProjectSchema.safeParse(data)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const projectId = new ObjectId(params.id)

    const project = await db.collection("projects").findOne({
      _id: projectId,
      status: "in-progress"
    })

    if (!project) {
      return NextResponse.json(
        { error: "Projet non trouvé ou non en cours" }, 
        { status: 404 }
      )
    }

    // Vérifier les permissions
    const isClient = project.clientId.toString() === userId.toString()
    const isFreelancer = project.freelancerId?.toString() === userId.toString()

    if (!isClient && !isFreelancer) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Vérifier que tous les milestones sont complétés
    const incompleteMilestones = project.milestones?.filter(
      (m: any) => m.status !== "completed" && m.status !== "paid"
    )

    if (incompleteMilestones && incompleteMilestones.length > 0) {
      return NextResponse.json(
        { 
          error: "Tous les jalons doivent être complétés avant de terminer le projet",
          incompleteMilestones 
        }, 
        { status: 400 }
      )
    }

    // Mettre à jour le projet
    const updateData: any = {
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date()
    }

    // Ajouter les notes finales et évaluation
    if (isClient && (data.finalNotes || data.rating)) {
      updateData.clientCompletion = {
        finalNotes: data.finalNotes,
        rating: data.rating,
        feedback: data.feedback,
        completedAt: new Date()
      }
    } else if (isFreelancer && data.finalNotes) {
      updateData.freelancerCompletion = {
        finalNotes: data.finalNotes,
        completedAt: new Date()
      }
    }

    await db.collection("projects").updateOne(
      { _id: projectId },
      { $set: updateData }
    )

    // Mettre à jour les statistiques des utilisateurs
    if (isClient && project.freelancerId) {
      await db.collection("users").updateOne(
        { _id: project.freelancerId },
        {
          $inc: {
            "statistics.completedProjects": 1,
            "statistics.totalHoursWorked": project.totalHours || 0
          }
        }
      )
    }

    // Créer des notifications
    const notificationPayload = {
      type: "project_completed" as const,
      title: "Projet complété",
      message: `Le projet "${project.title}" a été marqué comme complété`,
      projectId,
      read: false,
      createdAt: new Date(),
    }

    if (isClient && project.freelancerId) {
      await db.collection("notifications").insertOne({
        ...notificationPayload,
        userId: project.freelancerId,
        message: `Le client a marqué le projet "${project.title}" comme complété`
      })
    } else if (isFreelancer) {
      await db.collection("notifications").insertOne({
        ...notificationPayload,
        userId: project.clientId,
        message: `Le freelance a marqué le projet "${project.title}" comme complété`
      })
    }

    // Créer une review automatique si le client a fourni une évaluation
    if (isClient && data.rating && project.freelancerId) {
      await db.collection("reviews").insertOne({
        projectId,
        reviewerId: userId,
        reviewerName: session.user.name,
        reviewerAvatar: session.user.image,
        reviewedId: project.freelancerId,
        rating: data.rating,
        comment: data.feedback || "Projet complété avec succès",
        wouldRecommend: data.rating >= 4,
        strengths: data.rating >= 4 ? ["Professionnel", "Dans les délais", "Bonne communication"] : [],
        createdAt: new Date()
      })
    }

    return NextResponse.json({ 
      message: "Projet marqué comme complété avec succès",
      project: await db.collection("projects").findOne({ _id: projectId })
    })
  } catch (error) {
    console.error("Erreur lors de la complétion du projet:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" }, 
      { status: 500 }
    )
  }
}