// app/api/projects/[id]/applications/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: Request, 
  { params }: { params: Promise<{ id: string }> } // Note: params is now a Promise
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Await the params Promise to get the actual parameters
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de projet invalide" }, { status: 400 })
    }

    const db = await getDatabase()
    const projectId = new ObjectId(id)
    const userId = new ObjectId((session.user as any).id)

    // Vérifier que l'utilisateur est le client du projet
    const project = await db.collection("projects").findOne({
      _id: projectId,
      clientId: userId
    })

    if (!project) {
      return NextResponse.json(
        { error: "Projet non trouvé ou accès non autorisé" }, 
        { status: 404 }
      )
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
          "freelancer.bio": 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]).toArray()

    return NextResponse.json({
      applications,
      project: {
        _id: project._id,
        title: project.title,
        description: project.description,
        budget: project.budget,
        status: project.status,
        applicationCount: project.applicationCount
      }
    })

  } catch (error) {
    console.error("Erreur récupération candidatures:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}