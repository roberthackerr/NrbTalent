// app/api/team-applications/[id]/status/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

const UpdateTeamApplicationSchema = z.object({
  status: z.enum(["accepted", "rejected", "pending", "withdrawn"]),
  message: z.string().optional()
})

export async function PATCH(
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
      return NextResponse.json({ error: "Invalid team application ID" }, { status: 400 })
    }

    const body = await request.json()
    const validationResult = UpdateTeamApplicationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { status, message } = validationResult.data
    const db = await getDatabase()
    const applicationId = new ObjectId(id)
    const clientId = new ObjectId((session.user as any).id)

    // 1. Get the team application with project info
    const teamApplication = await db.collection("team_applications").findOne({
      _id: applicationId
    })

    if (!teamApplication) {
      return NextResponse.json({ error: "Team application not found" }, { status: 404 })
    }

    // 2. Verify the user is the client of the project
    const project = await db.collection("projects").findOne({
      _id: teamApplication.projectId,
      clientId
    })

    if (!project) {
      return NextResponse.json(
        { error: "Unauthorized access to this application" }, 
        { status: 403 }
      )
    }

    // 3. Check if project already has an accepted team
    if (status === "accepted") {
      const existingAcceptedTeam = await db.collection("team_applications").findOne({
        projectId: teamApplication.projectId,
        status: "accepted",
        _id: { $ne: applicationId }
      })

      if (existingAcceptedTeam) {
        return NextResponse.json(
          { error: "Another team has already been accepted for this project" }, 
          { status: 400 }
        )
      }

      // Check if any individual has been accepted
      const acceptedIndividual = await db.collection("applications").findOne({
        projectId: teamApplication.projectId,
        status: "accepted"
      })

      if (acceptedIndividual) {
        return NextResponse.json(
          { error: "An individual freelancer has already been accepted for this project" }, 
          { status: 400 }
        )
      }
    }

    // 4. Update the team application status
    const updateResult = await db.collection("team_applications").updateOne(
      { _id: applicationId },
      {
        $set: {
          status,
          updatedAt: new Date(),
          ...(message ? { clientMessage: message } : {})
        }
      }
    )

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to update application" }, { status: 500 })
    }

    // 5. If accepted, update project and handle other applications
    if (status === "accepted") {
      // Update project with team info
      await db.collection("projects").updateOne(
        { _id: teamApplication.projectId },
        {
          $set: {
            teamId: teamApplication.teamId,
            freelancerId: null, // Clear individual freelancer if set
            updatedAt: new Date(),
            selectedBudget: teamApplication.proposedBudget,
            selectedDuration: teamApplication.estimatedDuration
          }
        }
      )

      // Reject all other pending team applications for this project
      await db.collection("team_applications").updateMany(
        {
          projectId: teamApplication.projectId,
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

      // Reject all individual applications for this project
      await db.collection("applications").updateMany(
        {
          projectId: teamApplication.projectId,
          status: "pending"
        },
        {
          $set: {
            status: "rejected",
            updatedAt: new Date()
          }
        }
      )

      // Get team info for notifications
      const team = await db.collection("teams").findOne({
        _id: teamApplication.teamId
      })

      // Notify all team members
      if (team && team.members) {
        const notificationPromises = team.members.map(async (member: any) => {
          await db.collection("notifications").insertOne({
            userId: member.userId,
            type: "team_application_accepted",
            title: "Team Application Accepted!",
            message: `Your team "${team.name}" has been accepted for project "${project.title}"`,
            projectId: teamApplication.projectId,
            applicationId: applicationId,
            read: false,
            createdAt: new Date(),
            metadata: {
              projectTitle: project.title,
              budget: teamApplication.proposedBudget,
              currency: project.budget.currency
            }
          })
        })
        await Promise.all(notificationPromises)
      }

      // Notify client
      await db.collection("notifications").insertOne({
        userId: clientId,
        type: "team_selected",
        title: "Team Selected Successfully",
        message: `You've selected "${team?.name || 'The team'}" for project "${project.title}"`,
        projectId: teamApplication.projectId,
        read: false,
        createdAt: new Date()
      })

    } else if (status === "rejected") {
      // Notify team members about rejection
      const team = await db.collection("teams").findOne({
        _id: teamApplication.teamId
      })

      if (team && team.members) {
        const notificationPromises = team.members.map(async (member: any) => {
          await db.collection("notifications").insertOne({
            userId: member.userId,
            type: "team_application_rejected",
            title: "Team Application Not Selected",
            message: message 
              ? `Your team application for "${project.title}" was not selected. Message: ${message}`
              : `Your team application for "${project.title}" was not selected.`,
            projectId: teamApplication.projectId,
            read: false,
            createdAt: new Date()
          })
        })
        await Promise.all(notificationPromises)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Team application ${status} successfully`,
      applicationId: id,
      status
    })

  } catch (error) {
    console.error("Error updating team application status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}