import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Récupérer l'utilisateur avec ses projets sauvegardés
    const user = await db.collection("users").findOne(
      { _id: userId },
      { 
        projection: { 
          savedProjects: { $slice: [skip, limit] } 
        } 
      }
    )

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Récupérer les détails complets des projets sauvegardés
    const savedProjectIds = user.savedProjects?.map((sp: any) => sp.projectId) || []
    
    const projects = await db.collection("projects")
      .aggregate([
        { $match: { _id: { $in: savedProjectIds } } },
        {
          $lookup: {
            from: "users",
            localField: "clientId",
            foreignField: "_id",
            as: "client"
          }
        },
        { $unwind: "$client" },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            budget: 1,
            category: 1,
            skills: 1,
            deadline: 1,
            status: 1,
            visibility: 1,
            createdAt: 1,
            updatedAt: 1,
            applicationCount: 1,
            saveCount: 1,
            "client.name": 1,
            "client.avatar": 1,
            "client.title": 1
          }
        }
      ])
      .toArray()

    // Reorganiser les projets dans l'ordre de sauvegarde
    const orderedProjects = savedProjectIds.map((projectId: ObjectId) => 
      projects.find(p => p._id.toString() === projectId.toString())
    ).filter(Boolean)

    // Compter le nombre total de projets sauvegardés
    const totalCount = user.savedProjects?.length || 0
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      savedProjects: orderedProjects,
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
    console.error("❌ Erreur lors de la récupération des projets sauvegardés:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const { projectId } = await request.json()
    
    if (!projectId) {
      return NextResponse.json(
        { error: "ID du projet requis" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const projectObjectId = new ObjectId(projectId)

    // Vérifier si le projet existe
    const project = await db.collection("projects").findOne({ _id: projectObjectId })
    if (!project) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      )
    }

    // Ajouter le projet aux sauvegardes de l'utilisateur
    const result = await db.collection("users").updateOne(
      { _id: userId },
      { 
        $addToSet: { 
          savedProjects: { 
            projectId: projectObjectId,
            savedAt: new Date()
          } 
        } 
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Projet déjà sauvegardé" },
        { status: 400 }
      )
    }

    // Incrémenter le compteur de sauvegardes du projet
    await db.collection("projects").updateOne(
      { _id: projectObjectId },
      { $inc: { saveCount: 1 } }
    )

    return NextResponse.json({ 
      message: "Projet sauvegardé avec succès",
      saved: true 
    })

  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde du projet:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    if (!projectId) {
      return NextResponse.json(
        { error: "ID du projet requis" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const projectObjectId = new ObjectId(projectId)

    // Retirer le projet des sauvegardes de l'utilisateur
    const result = await db.collection("users").updateOne(
      { _id: userId },
      { 
        $pull: { 
          savedProjects: { 
            projectId: projectObjectId 
          } 
        } 
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Projet non trouvé dans les sauvegardes" },
        { status: 404 }
      )
    }

    // Décrémenter le compteur de sauvegardes du projet
    await db.collection("projects").updateOne(
      { _id: projectObjectId },
      { $inc: { saveCount: -1 } }
    )

    return NextResponse.json({ 
      message: "Projet retiré des sauvegardes",
      saved: false 
    })

  } catch (error) {
    console.error("❌ Erreur lors de la suppression du projet sauvegardé:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}