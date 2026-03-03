// app/api/projects/[id]/team-applications/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    const db = await getDatabase()
    const projectId = new ObjectId(id)
    const clientId = new ObjectId((session.user as any).id)

    // Verify the user is the client of the project
    const project = await db.collection("projects").findOne({
      _id: projectId,
      clientId
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or unauthorized access" }, 
        { status: 404 }
      )
    }

    // Get team applications with team details
    const teamApplications = await db.collection("team_applications").aggregate([
      { $match: { projectId } },
      {
        $lookup: {
          from: "teams",
          localField: "teamId",
          foreignField: "_id",
          as: "team"
        }
      },
      { $unwind: { path: "$team", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          coverLetter: 1,
          proposedBudget: 1,
          estimatedDuration: 1,
          status: 1,
          clientViewed: 1,
          createdAt: 1,
          "team._id": 1,
          "team.name": 1,
          "team.members": 1,
          "team.skills": 1,
          "team.rating": 1,
          "team.completedProjects": 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]).toArray()

    // Format the response
    const formattedApplications = teamApplications.map(app => ({
      id: app._id.toString(),
      teamId: app.team?._id?.toString() || "",
      teamName: app.team?.name || "Unknown Team",
      coverLetter: app.coverLetter,
      proposedBudget: app.proposedBudget,
      estimatedTimeline: app.estimatedDuration,
      status: app.status,
      clientViewed: app.clientViewed || false,
      createdAt: app.createdAt,
      teamSummary: {
        memberCount: app.team?.members?.length || 0,
        roles: app.team?.members?.map((m: any) => m.role || "member") || [],
        skills: app.team?.skills || []
      }
    }))

    return NextResponse.json({
      success: true,
      project: {
        id: project._id.toString(),
        title: project.title,
        budget: project.budget,
        status: project.status
      },
      applications: formattedApplications
    })

  } catch (error) {
    console.error("Error fetching team applications:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}