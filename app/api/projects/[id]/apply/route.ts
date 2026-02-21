import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

// Schéma de validation
// Dans votre API route
const ApplicationSchema = z.object({
  coverLetter: z.string().min(1).max(2000),
  proposedBudget: z.number().min(1),
  estimatedDuration: z.string().min(1).max(100),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string()
  })).max(5).optional()
})

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== "freelance") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "ID de projet invalide" }, { status: 400 })
    }

    const data = await request.json()
    const validationResult = ApplicationSchema.safeParse(data)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Données de candidature invalides", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const freelancerId = new ObjectId((session.user as any).id)
    const projectId = new ObjectId(params.id)

    // Vérifier si le projet existe et est ouvert
    const project = await db.collection("projects").findOne({
      _id: projectId,
      status: "open"
    })

    if (!project) {
      return NextResponse.json(
        { error: "Projet non trouvé ou non disponible" }, 
        { status: 404 }
      )
    }

    // Vérifier si l'utilisateur n'est pas le client
    if (project.clientId.toString() === freelancerId.toString()) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas postuler à votre propre projet" }, 
        { status: 400 }
      )
    }

    // VALIDATION COMPLÈTE DU BUDGET
    const proposedBudget = data.proposedBudget;
    const minBudget = project.budget.min;
    const maxBudget = project.budget.max;
    const currency = project.budget.currency;

    if (proposedBudget < minBudget) {
      return NextResponse.json(
        { 
          error: "Budget trop bas",
          message: `Votre proposition (${proposedBudget} ${currency}) est inférieure au budget minimum (${minBudget} ${currency})`,
          details: {
            proposed: proposedBudget,
            min: minBudget,
            max: maxBudget,
            currency: currency
          }
        }, 
        { status: 400 }
      )
    }

    if (proposedBudget > maxBudget) {
      return NextResponse.json(
        { 
          error: "Budget trop élevé",
          message: `Votre proposition (${proposedBudget} ${currency}) dépasse le budget maximum (${maxBudget} ${currency})`,
          details: {
            proposed: proposedBudget,
            min: minBudget,
            max: maxBudget,
            currency: currency
          }
        }, 
        { status: 400 }
      )
    }

    // Vérifier si une candidature existe déjà
    const existingApplication = await db.collection("applications").findOne({
      projectId,
      freelancerId,
      status: { $in: ["pending", "accepted"] }
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: "Vous avez déjà postulé à ce projet" }, 
        { status: 400 }
      )
    }

    // Vérifier le nombre maximum de candidatures
    const applicationCount = await db.collection("applications").countDocuments({
      freelancerId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 heures
    })

    if (applicationCount >= 10) {
      return NextResponse.json(
        { error: "Limite de candidatures quotidienne atteinte" }, 
        { status: 429 }
      )
    }

    const application = {
      freelancerId,
      projectId,
      coverLetter: data.coverLetter,
      proposedBudget: data.proposedBudget,
      estimatedDuration: data.estimatedDuration,
      attachments: data.attachments || [],
      status: "pending",
      clientViewed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Ajouter des informations supplémentaires pour le tracking
      budgetRange: {
        min: project.budget.min,
        max: project.budget.max,
        currency: project.budget.currency
      },
      projectTitle: project.title // Pour les notifications et rapports
    }

    // Insérer la candidature
    const result = await db.collection("applications").insertOne(application)

    // Mettre à jour le compteur de candidatures du projet
    await db.collection("projects").updateOne(
      { _id: projectId },
      {
        $inc: { applicationCount: 1 },
        $set: { updatedAt: new Date() }
      }
    )

    // Créer une notification pour le client
    await db.collection("notifications").insertOne({
      userId: project.clientId,
      type: "new_application",
      title: "Nouvelle candidature reçue",
      message: `Vous avez reçu une nouvelle candidature pour "${project.title}" - Budget proposé: ${data.proposedBudget} ${currency}`,
      projectId,
      applicationId: result.insertedId,
      read: false,
      createdAt: new Date(),
      metadata: {
        proposedBudget: data.proposedBudget,
        currency: currency
      }
    })

    // Notification pour le freelance
    await db.collection("notifications").insertOne({
      userId: freelancerId,
      type: "application_submitted",
      title: "Candidature envoyée",
      message: `Votre candidature pour "${project.title}" a été envoyée avec succès`,
      projectId,
      read: false,
      createdAt: new Date(),
    })

    return NextResponse.json(
      { 
        message: "Candidature envoyée avec succès",
        applicationId: result.insertedId,
        budget: {
          proposed: data.proposedBudget,
          min: minBudget,
          max: maxBudget,
          currency: currency
        }
      }, 
      { status: 201 }
    )
  } catch (error) {
    console.error("Erreur lors de l'envoi de la candidature:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" }, 
      { status: 500 }
    )
  }
}