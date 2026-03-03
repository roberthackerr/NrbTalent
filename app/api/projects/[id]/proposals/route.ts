// app/api/projects/[id]/proposals/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request,{ params }: { params: Promise<{ id: string }> }) {
   const {id}= await params;
  try {
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de projet invalide" }, { status: 400 })
    }

    const db = await getDatabase()
    const projectId = new ObjectId(id)

    // Récupérer le projet de base
    const project = await db.collection("projects").findOne(
      { _id: projectId },
      {
        projection: {
          _id: 1,
          title: 1,
          description: 1,
          budget: 1,
          status: 1,
          applicationCount: 1,
          clientId: 1,
          category: 1,
          skills: 1,
          createdAt: 1
        }
      }
    )

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 })
    }

    // Récupérer les candidatures avec les données des freelancers
    const applications = await db.collection("applications").aggregate([
      { $match: { projectId } },
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
          "freelancer.rating": 1,
          "freelancer.completedProjects": 1,
          "freelancer.location": 1,
          "freelancer.skills": 1,
          "freelancer.bio": 1,
          "freelancer.languages": 1,
          "freelancer.verified": 1,
          "freelancer.joinDate": 1,
          "freelancer.responseTime": 1,
          "freelancer.successRate": 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]).toArray()

    return NextResponse.json({
      project,
      applications
    })

  } catch (error) {
    console.error("Erreur récupération propositions publiques:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}