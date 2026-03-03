//api/projects/[id]/route.ts

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

// Schémas de validation
const UpdateProjectSchema = z.object({
  // Informations de base
  title: z.string()
    .min(1, "Le titre est requis")
    .max(200, "Le titre ne doit pas dépasser 200 caractères")
    .optional(),
  
  description: z.string()
    .min(1, "La description est requise")
    .max(5000, "La description ne doit pas dépasser 5000 caractères")
    .optional(),
  
  category: z.string()
    .min(1, "La catégorie est requise")
    .optional(),
  
  subcategory: z.string()
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val),
  
  // Compétences
  skills: z.array(z.string())
    .max(20, "Maximum 20 compétences")
    .optional(),
  
  // Budget
  budget: z.object({
    min: z.number()
      .min(0, "Le budget minimum doit être positif")
      .refine(val => val <= 1000000, "Le budget minimum est trop élevé"),
    max: z.number()
      .min(0, "Le budget maximum doit être positif")
      .refine(val => val <= 1000000, "Le budget maximum est trop élevé"),
    type: z.enum(["fixed", "hourly"]),
    currency: z.string().default("EUR")
  })
  .refine(data => data.min <= data.max, {
    message: "Le budget minimum doit être inférieur ou égal au budget maximum",
    path: ["budget.min"]
  })
  .optional(),
  
  // Dates
  deadline: z.string()
    .datetime({ message: "Format de date invalide" })
    .optional(),
  
  // Localisation
  location: z.string()
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val),
  
  // Visibilité et statut
  visibility: z.enum(["public", "private"])
    .optional(),
  
  status: z.enum(["draft", "open", "in-progress", "completed", "cancelled", "paused"])
    .optional(),
  
  // Tags et métadonnées
  tags: z.array(z.string())
    .max(10, "Maximum 10 tags")
    .optional(),
  
  urgency: z.enum(["low", "medium", "high"])
    .optional(),
  
  complexity: z.enum(["beginner", "intermediate", "expert"])
    .optional(),
})
.refine(data => {
  // Validation conditionnelle : si budget est fourni, il doit être complet
  if (data.budget) {
    return data.budget.min !== undefined && 
           data.budget.max !== undefined && 
           data.budget.type !== undefined
  }
  return true
}, {
  message: "Le budget doit inclure min, max et type",
  path: ["budget"]
})

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> } // Note: params is a Promise
) {
  try {
    const session = await getServerSession(authOptions)
    const {id}= await params;
    // Validation de l'ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ 
        error: "ID de projet invalide", 
        id: id
      }, { status: 400 })
    }
    const db = await getDatabase()
    const projectId = new ObjectId(id)

    // Récupérer le projet avec les données client
    const project = await db.collection("projects").aggregate([
      { $match: { _id: projectId } },
      {
        $lookup: {
          from: "users",
          localField: "clientId",
          foreignField: "_id",
          as: "client"
        }
      },
      { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          category: 1,
          subcategory: 1,
          budget: 1,
          skills: 1,
          deadline: 1,
          visibility: 1,
          tags: 1,
          attachments: 1,
          milestones: 1,
          status: 1,
          clientId: 1,
          applications: 1,
          applicationCount: 1,
          freelancerId: 1,
          createdAt: 1,
          updatedAt: 1,
          views: 1,
          featured: 1,
          urgency: 1,
          complexity: 1,
          saveCount: 1,
          "client._id": 1,
          "client.name": 1,
          "client.avatar": 1,
          "client.title": 1,
          "client.rating": 1,
          "client.completedProjects": 1
        }
      }
    ]).next()

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 })
    }

    // Vérifier les permissions si l'utilisateur est connecté
    if (session) {
      const userId = new ObjectId((session.user as any).id)
      const isClient = project.clientId?.toString() === userId.toString()
      const isParticipant = project.freelancerId?.toString() === userId.toString()

      if (project.visibility === "private" && !isClient && !isParticipant) {
        return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
      }

      // Inclure les applications seulement pour le client
      if (isClient) {
        const applications = await db.collection("applications")
          .aggregate([
            { $match: { projectId: projectId } },
            {
              $lookup: {
                from: "users",
                localField: "freelancerId",
                foreignField: "_id",
                as: "freelancer"
              }
            },
            { $unwind: { path: "$freelancer", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 1,
                coverLetter: 1,
                proposedBudget: 1,
                estimatedDuration: 1,
                attachments: 1,
                status: 1,
                clientViewed: 1,
                createdAt: 1,
                updatedAt: 1,
                "freelancer._id": 1,
                "freelancer.name": 1,
                "freelancer.avatar": 1,
                "freelancer.title": 1,
                "freelancer.rating": 1
              }
            },
            { $sort: { createdAt: -1 } }
          ])
          .toArray()

        return NextResponse.json({
          ...project,
          applications
        })
      }
    } else {
      // Pour les utilisateurs non connectés, seulement les projets publics
      if (project.visibility !== "public") {
        return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
      }
    }

    // Retourner le projet sans les applications pour les non-clients
    const { applications, ...projectWithoutApplications } = project
    return NextResponse.json({
      ...projectWithoutApplications,
      applications: [] // Retourner un tableau vide pour maintenir la structure
    })

  } catch (error) {
    console.error("Erreur lors de la récupération du projet:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" }, 
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    const {id}=await params
    // Validation de l'ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de projet invalide" }, { status: 400 })
    }

    const body = await request.json()
    const validationResult = UpdateProjectSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Vérifier que l'utilisateur est le client du projet
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(id),
      clientId: new ObjectId((session.user as any).id)
    })

    if (!project) {
      return NextResponse.json(
        { error: "Projet non trouvé ou accès non autorisé" }, 
        { status: 404 }
      )
    }
    const updates = validationResult.data
    const result = await db.collection("projects").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 })
    }

    // Créer une notification si le statut a changé
    if (updates.status && updates.status !== project.status) {
      await db.collection("notifications").insertOne({
        userId: project.clientId,
        type: "project_updated",
        title: "Projet mis à jour",
        message: `Le statut de votre projet "${project.title}" a été changé à ${updates.status}`,
        projectId: new ObjectId(id),
        read: false,
        createdAt: new Date(),
      })
    }

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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "ID de projet invalide" }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Vérifier que l'utilisateur est le client et que le projet peut être supprimé
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(params.id),
      clientId: new ObjectId((session.user as any).id)
    })

    if (!project) {
      return NextResponse.json(
        { error: "Projet non trouvé ou accès non autorisé" }, 
        { status: 404 }
      )
    }

    // Empêcher la suppression si le projet est en cours ou complété
    if (["in-progress", "completed"].includes(project.status)) {
      return NextResponse.json(
        { error: "Impossible de supprimer un projet en cours ou complété" }, 
        { status: 400 }
      )
    }

    const result = await db.collection("projects").deleteOne({
      _id: new ObjectId(params.id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 })
    }

    // Supprimer les applications associées
    await db.collection("applications").deleteMany({
      projectId: new ObjectId(params.id)
    })

    return NextResponse.json({ 
      message: "Projet supprimé avec succès" 
    })
  } catch (error) {
    console.error("Erreur lors de la suppression du projet:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" }, 
      { status: 500 }
    )
  }
}