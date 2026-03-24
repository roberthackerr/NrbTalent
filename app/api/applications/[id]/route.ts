// app/api/applications/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

// Schéma pour la mise à jour du statut
const UpdateApplicationSchema = z.object({
  status: z.enum(["accepted", "rejected", "pending"])
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    
    const { id } = await params
    
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
    const userId = new ObjectId((session.user as any).id)

    // Récupérer la candidature avec les infos du projet
    const application = await db.collection("applications").findOne({
      _id: applicationId
    })

    if (!application) {
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    const project = await db.collection("projects").findOne({
      _id: application.projectId
    })

    if (!project) {
      return NextResponse.json({ error: "Projet associé non trouvé" }, { status: 404 })
    }

    // Vérifier que l'utilisateur est le client du projet
    const isClient = project.clientId.toString() === userId.toString()
    if (!isClient) {
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
     const notificationMessages = {
        accepted: {
          fr: {
            title: "🎉 Candidature acceptée !",
            message: `Votre candidature pour "${project.title}" a été acceptée. Budget: ${application.proposedBudget} ${project.budget?.currency || '€'}`
          },
          en: {
            title: "🎉 Application accepted!",
            message: `Your application for "${project.title}" has been accepted. Budget: ${application.proposedBudget} ${project.budget?.currency || '€'}`
          },
          mg: {
            title: "🎉 Neken'ny mpampiasa ny fangatahanao!",
            message: `Neken'ny mpampiasa ny fangatahanao ho an'ny tetikasa "${project.title}". Vidin'ny tetikasa: ${application.proposedBudget} ${project.budget?.currency || '€'}`
          }
        },
        rejected: {
          fr: {
            title: "❌ Candidature non retenue",
            message: `Votre candidature pour "${project.title}" n'a pas été retenue.`
          },
          en: {
            title: "❌ Application rejected",
            message: `Your application for "${project.title}" has been rejected.`
          },
          mg: {
            title: "❌ Nolavina ny fangatahanao",
            message: `Nolavina ny fangatahanao ho an'ny tetikasa "${project.title}".`
          }
        }
      }

    // 📢 NOTIFICATION selon le statut
    try {
      const userLang = (session.user as any).language || 'fr'
      
 
      const messages = notificationMessages[status as keyof typeof notificationMessages]
      if (messages) {
        const msg = messages[userLang as keyof typeof messages] || messages.fr
        
        await db.collection("notifications").insertOne({
          userId: application.freelancerId,
          category: "ORDER",
          priority: status === "accepted" ? "HIGH" : "MEDIUM",
          title: msg.title,
          message: msg.message,
          actionUrl: `/projects/${application.projectId}`,
          data: {
            entityType: "application",
            action: status,
            applicationId: applicationId.toString(),
            projectId: application.projectId.toString(),
            projectTitle: project.title,
            proposedBudget: application.proposedBudget,
            timestamp: new Date().toISOString()
          },
          status: "UNREAD",
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    } catch (notifError) {
      console.error("Failed to send notification:", notifError)
    }

    // Si la candidature est acceptée, mettre à jour le projet
    if (status === "accepted") {
      await db.collection("projects").updateOne(
        { _id: application.projectId },
        {
          $set: {
            selectedFreelancerId: application.freelancerId,
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

      // Notifier les freelancers rejetés
      const rejectedApplications = await db.collection("applications").find({
        projectId: application.projectId,
        _id: { $ne: applicationId },
        status: "rejected"
      }).toArray()

      for (const app of rejectedApplications) {
        const userLang = await getUserLanguage(app.freelancerId.toString())
        const messages = notificationMessages.rejected[userLang as keyof typeof notificationMessages.rejected] || notificationMessages.rejected.fr
        
        await db.collection("notifications").insertOne({
          userId: app.freelancerId,
          category: "ORDER",
          priority: "MEDIUM",
          title: messages.title,
          message: messages.message,
          actionUrl: `/projects/${application.projectId}`,
          data: {
            entityType: "application",
            action: "rejected",
            projectId: application.projectId.toString(),
            projectTitle: project.title
          },
          status: "UNREAD",
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: status === "accepted" 
        ? "Candidature acceptée avec succès" 
        : "Candidature rejetée avec succès",
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    
    const { id } = await params
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de candidature invalide" }, { status: 400 })
    }

    const db = await getDatabase()
    const applicationId = new ObjectId(id)
    const userId = new ObjectId((session.user as any).id)

    // Récupérer la candidature
    const application = await db.collection("applications").findOne({
      _id: applicationId
    })

    if (!application) {
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Vérifier que l'utilisateur est le propriétaire de la candidature (freelancer)
    const isOwner = application.freelancerId.toString() === userId.toString()
    
    if (!isOwner) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer cette candidature" }, 
        { status: 403 }
      )
    }

    // Vérifier que la candidature est encore en attente
    if (application.status !== "pending") {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer une candidature déjà traitée" }, 
        { status: 400 }
      )
    }

    // Récupérer les détails du projet pour la notification
    const project = await db.collection("projects").findOne({
      _id: application.projectId
    })

    // Supprimer la candidature physiquement
    const result = await db.collection("applications").deleteOne({
      _id: applicationId
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Échec de la suppression" }, { status: 500 })
    }

    // Décrémenter le compteur de candidatures du projet
    if (project) {
      await db.collection("projects").updateOne(
        { _id: application.projectId },
        {
          $inc: { applicationCount: -1 },
          $set: { updatedAt: new Date() }
        }
      )
    }

    // 📢 NOTIFICATION DE SUPPRESSION
    try {
      const userLang = (session.user as any).language || 'fr'
      
      const deleteMessages = {
        fr: {
          title: "🗑️ Candidature supprimée",
          message: `Vous avez supprimé votre candidature pour "${project?.title || 'le projet'}"`
        },
        en: {
          title: "🗑️ Application deleted",
          message: `You have deleted your application for "${project?.title || 'the project'}"`
        },
        mg: {
          title: "🗑️ Nofafana ny fangatahana",
          message: `Nofafanao ny fangatahanao ho an'ny tetikasa "${project?.title || 'ny tetikasa'}"`
        }
      }

      const msg = deleteMessages[userLang as keyof typeof deleteMessages] || deleteMessages.fr

      await db.collection("notifications").insertOne({
        userId: userId.toString(),
        category: "ORDER",
        priority: "MEDIUM",
        title: msg.title,
        message: msg.message,
        actionUrl: `/projects/${application.projectId}`,
        data: {
          entityType: "application",
          action: "delete",
          applicationId: applicationId.toString(),
          projectId: application.projectId.toString(),
          projectTitle: project?.title,
          timestamp: new Date().toISOString()
        },
        status: "UNREAD",
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } catch (notifError) {
      console.error("Failed to send deletion notification:", notifError)
    }

    return NextResponse.json({
      success: true,
      message: "Candidature supprimée avec succès",
      applicationId: id
    })

  } catch (error) {
    console.error("Erreur suppression candidature:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// Helper pour récupérer la langue de l'utilisateur
async function getUserLanguage(userId: string): Promise<'fr' | 'en' | 'mg'> {
  try {
    const db = await getDatabase()
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      { projection: { language: 1, preferences: 1 } }
    )
    const userLang = user?.language || user?.preferences?.language || 'fr'
    return userLang === 'fr' || userLang === 'en' || userLang === 'mg' ? userLang : 'fr'
  } catch {
    return 'fr'
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