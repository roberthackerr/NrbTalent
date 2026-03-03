// app/api/projects/[id]/edit/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

// Schéma de validation pour l'édition
const EditProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  category: z.string().min(1).optional(),
  subcategory: z.string().optional(),
  skills: z.array(z.string()).max(20).optional(),
  budget: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
    type: z.enum(["fixed", "hourly"]),
    currency: z.string().length(3)
  }).optional(),
  deadline: z.string().datetime().optional(),
  location: z.string().optional(),
  visibility: z.enum(["public", "private"]).optional(),
  status: z.enum(["draft", "open", "in-progress", "completed", "cancelled", "paused"]).optional(),
  tags: z.array(z.string()).max(10).optional(),
  urgency: z.enum(["low", "medium", "high"]).optional(),
  complexity: z.enum(["beginner", "intermediate", "expert"]).optional(),
}).strict()

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params
    const userId = (session.user as any).id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de projet invalide" }, { status: 400 })
    }

    const db = await getDatabase()
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(id),
      clientId: new ObjectId(userId)
    })

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé ou accès non autorisé" }, { status: 404 })
    }

    return NextResponse.json(project)

  } catch (error) {
    console.error("Erreur GET edit:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params
    const userId = (session.user as any).id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de projet invalide" }, { status: 400 })
    }

    const body = await request.json()
    const validation = EditProjectSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Vérifier que l'utilisateur est le propriétaire
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(id),
      clientId: new ObjectId(userId)
    })

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé ou accès non autorisé" }, { status: 404 })
    }

    // Empêcher certaines modifications si le projet est en cours
    if (project.status === "in-progress") {
      const disallowedFields = ["budget", "deadline", "title", "description", "skills"]
      const hasDisallowedChanges = Object.keys(body).some(key => 
        disallowedFields.includes(key) && JSON.stringify(body[key]) !== JSON.stringify(project[key])
      )

      if (hasDisallowedChanges) {
        return NextResponse.json(
          { error: "Impossible de modifier ces champs sur un projet en cours" },
          { status: 400 }
        )
      }
    }

    // Mettre à jour le projet
    const updateData = {
      ...validation.data,
      updatedAt: new Date()
    }

    const result = await db.collection("projects").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 })
    }

    // Créer une notification si le statut a changé
    if (body.status && body.status !== project.status) {
      await db.collection("notifications").insertOne({
        userId: new ObjectId(userId),
        type: "project_status_changed",
        title: "Statut du projet modifié",
        message: `Le statut de votre projet "${project.title}" est maintenant "${body.status}"`,
        projectId: new ObjectId(id),
        read: false,
        createdAt: new Date()
      })
    }

    return NextResponse.json({
      success: true,
      message: "Projet mis à jour avec succès"
    })

  } catch (error) {
    console.error("Erreur POST edit:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}