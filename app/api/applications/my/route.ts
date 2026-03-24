// app/api/applications/my/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "freelance") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const db = await getDatabase()
    const freelancerId = new ObjectId((session.user as any).id)

    // Construire le filtre
    const filter: any = { freelancerId }
    if (status !== 'all') {
      filter.status = status
    }

    const skip = (page - 1) * limit
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

    // Récupérer les candidatures
    let applications = await db.collection("applications")
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()

    // Récupérer les détails des projets
    const projectIds = applications.map(app => app.projectId)
    const projects = await db.collection("projects")
      .find({ _id: { $in: projectIds } })
      .toArray()

    // Récupérer les détails des clients
    const clientIds = projects.map(p => p.clientId)
    const clients = await db.collection("users")
      .find({ _id: { $in: clientIds } })
      .project({ name: 1, avatar: 1, rating: 1, completedProjects: 1 })
      .toArray()

    const clientMap = new Map(clients.map(c => [c._id.toString(), c]))

    // Enrichir les candidatures avec les détails des projets et clients
    const enrichedApplications = applications.map(app => {
      const project = projects.find(p => p._id.toString() === app.projectId.toString())
      return {
        ...app,
        projectTitle: project?.title || "Projet supprimé",
        project: project ? {
          ...project,
          client: clientMap.get(project.clientId.toString())
        } : null
      }
    })

    const total = await db.collection("applications").countDocuments(filter)
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      applications: enrichedApplications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error("Error fetching applications:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// app/api/applications/my/stats/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "freelance") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const db = await getDatabase()
    const freelancerId = new ObjectId((session.user as any).id)

    const applications = await db.collection("applications")
      .find({ freelancerId })
      .toArray()

    const stats = {
      total: applications.length,
      pending: applications.filter(a => a.status === 'pending').length,
      accepted: applications.filter(a => a.status === 'accepted').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
      withdrawn: applications.filter(a => a.status === 'withdrawn').length,
      totalProposedBudget: applications.reduce((sum, a) => sum + (a.proposedBudget || 0), 0),
      averageProposedBudget: applications.length > 0 
        ? applications.reduce((sum, a) => sum + (a.proposedBudget || 0), 0) / applications.length 
        : 0
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error("Error fetching application stats:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}