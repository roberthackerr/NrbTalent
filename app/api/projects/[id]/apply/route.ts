import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

// Extended validation schema
const ApplicationSchema = z.object({
  coverLetter: z.string()
    .min(1, "Cover letter is required")
    .max(2000, "Cover letter must not exceed 2000 characters"),
  
  proposedBudget: z.number()
    .min(1, "Budget must be greater than 0"),
    
  estimatedDuration: z.string()
    .min(1, "Estimated duration is required")
    .max(100, "Estimated duration is too long"),
    
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url("Invalid URL format"),
    type: z.string()
  }))
  .max(5, "Maximum 5 attachments allowed")
  .optional()
  .default([]),
  
  applyMode: z.enum(['individual', 'team'])
    .default('individual'),
    
  teamId: z.string()
    .optional()
    .refine(
      (val) => !val || ObjectId.isValid(val),
      { message: "Invalid team ID format" }
    )
})
.refine(data => {
  // If applying as team, teamId is required
  if (data.applyMode === 'team') {
    return !!data.teamId && ObjectId.isValid(data.teamId!)
  }
  return true
}, {
  message: "Team ID is required for team applications",
  path: ["teamId"]
})

export async function POST(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== "freelance") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    const data = await request.json()
    const validationResult = ApplicationSchema.safeParse(data)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid application data", 
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const freelancerId = new ObjectId((session.user as any).id)
    const projectId = new ObjectId(id)

    // Check if project exists and is open
    const project = await db.collection("projects").findOne({
      _id: projectId,
      status: "open"
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or not available" }, 
        { status: 404 }
      )
    }

    // Check if user is not the client
    if (project.clientId.toString() === freelancerId.toString()) {
      return NextResponse.json(
        { error: "You cannot apply to your own project" }, 
        { status: 400 }
      )
    }

    // BUDGET VALIDATION
    const proposedBudget = data.proposedBudget
    const minBudget = project.budget.min
    const maxBudget = project.budget.max
    const currency = project.budget.currency

    if (proposedBudget < minBudget) {
      return NextResponse.json(
        { 
          error: "Budget too low",
          message: `Your proposal (${proposedBudget} ${currency}) is below the minimum budget (${minBudget} ${currency})`,
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
          error: "Budget too high",
          message: `Your proposal (${proposedBudget} ${currency}) exceeds the maximum budget (${maxBudget} ${currency})`,
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

    // TEAM APPLICATION LOGIC
    if (data.applyMode === 'team' && data.teamId) {
      const teamId = new ObjectId(data.teamId)
      
      // Check if user is a member of the team
      const team = await db.collection("teams").findOne({
        _id: teamId,
        "members.userId": freelancerId
      })

      if (!team) {
        return NextResponse.json(
          { error: "You are not a member of this team or team does not exist" }, 
          { status: 403 }
        )
      }

      // Check if user is team lead
      const isTeamLead = team.members.some(
        (member: any) => 
          member.userId.toString() === freelancerId.toString() && 
          member.isLead === true
      )

      if (!isTeamLead) {
        return NextResponse.json(
          { error: "Only team leads can submit team applications" }, 
          { status: 403 }
        )
      }

      // Check if team has already applied
      const existingTeamApplication = await db.collection("team_applications").findOne({
        projectId,
        teamId,
        status: { $in: ["pending", "accepted"] }
      })

      if (existingTeamApplication) {
        return NextResponse.json(
          { error: "This team has already applied to this project" }, 
          { status: 400 }
        )
      }

      // Check if any team member has applied individually
      const teamMemberIds = team.members.map((m: any) => m.userId)
      const existingIndividualApplications = await db.collection("applications").find({
        projectId,
        freelancerId: { $in: teamMemberIds },
        status: { $in: ["pending", "accepted"] }
      }).toArray()

      if (existingIndividualApplications.length > 0) {
        const conflictingUsers = existingIndividualApplications.map(app => 
          team.members.find((m: any) => m.userId.toString() === app.freelancerId.toString())?.userInfo?.name
        ).filter(Boolean)
        
        return NextResponse.json(
          { 
            error: "Team members have individual applications",
            message: `The following team members have already applied individually: ${conflictingUsers.join(', ')}`,
            details: { conflictingUsers }
          }, 
          { status: 400 }
        )
      }

      // Create team application
      const teamApplication = {
        teamId,
        projectId,
        submittedBy: freelancerId,
        coverLetter: data.coverLetter,
        proposedBudget: data.proposedBudget,
        estimatedDuration: data.estimatedDuration,
        attachments: data.attachments || [],
        status: "pending",
        clientViewed: false,
        teamSummary: {
          name: team.name,
          memberCount: team.members.length,
          roles: team.members.map((m: any) => m.role || "member"),
          skills: team.skills || [],
          leadName: session.user?.name || "Team Lead"
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        budgetRange: {
          min: project.budget.min,
          max: project.budget.max,
          currency: project.budget.currency
        },
        projectTitle: project.title
      }

      const result = await db.collection("team_applications").insertOne(teamApplication)

      // Notify all team members
      const teamMembers = team.members.map((m: any) => m.userId)
      const notificationPromises = teamMembers.map(async (memberId: ObjectId) => {
        await db.collection("notifications").insertOne({
          userId: memberId,
          type: "team_application_submitted",
          title: "Team Application Submitted",
          message: `Your team "${team.name}" has applied to project "${project.title}"`,
          projectId,
          applicationId: result.insertedId,
          read: false,
          createdAt: new Date(),
          metadata: {
            submittedBy: session.user?.name,
            proposedBudget: data.proposedBudget,
            currency: currency
          }
        })
      })
      await Promise.all(notificationPromises)

      // Notify the client
      await db.collection("notifications").insertOne({
        userId: project.clientId,
        type: "new_team_application",
        title: "New Team Application",
        message: `Team "${team.name}" has applied to your project "${project.title}"`,
        projectId,
        applicationId: result.insertedId,
        read: false,
        createdAt: new Date(),
        metadata: {
          teamName: team.name,
          teamSize: team.members.length,
          proposedBudget: data.proposedBudget,
          currency: currency
        }
      })

      // Update project application count
      await db.collection("projects").updateOne(
        { _id: projectId },
        {
          $inc: { applicationCount: 1 },
          $set: { updatedAt: new Date() }
        }
      )

      return NextResponse.json(
        { 
          success: true,
          message: "Team application submitted successfully",
          applicationId: result.insertedId,
          applicationType: "team",
          budget: {
            proposed: data.proposedBudget,
            min: minBudget,
            max: maxBudget,
            currency: currency
          },
          team: {
            name: team.name,
            memberCount: team.members.length
          }
        }, 
        { status: 201 }
      )
    } 
    // INDIVIDUAL APPLICATION LOGIC
    else {
      // Check if user has already applied
      const existingApplication = await db.collection("applications").findOne({
        projectId,
        freelancerId,
        status: { $in: ["pending", "accepted"] }
      })

      if (existingApplication) {
        return NextResponse.json(
          { error: "You have already applied to this project" }, 
          { status: 400 }
        )
      }

      // Check daily application limit
      const applicationCount = await db.collection("applications").countDocuments({
        freelancerId,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })

      if (applicationCount >= 10) {
        return NextResponse.json(
          { error: "Daily application limit reached" }, 
          { status: 429 }
        )
      }

      // Create individual application
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
        budgetRange: {
          min: project.budget.min,
          max: project.budget.max,
          currency: project.budget.currency
        },
        projectTitle: project.title
      }

      const result = await db.collection("applications").insertOne(application)

      // Update project application count
      await db.collection("projects").updateOne(
        { _id: projectId },
        {
          $inc: { applicationCount: 1 },
          $set: { updatedAt: new Date() }
        }
      )

      // Notify client
      await db.collection("notifications").insertOne({
        userId: project.clientId,
        type: "new_application",
        title: "New Application",
        message: `You have a new application for "${project.title}"`,
        projectId,
        applicationId: result.insertedId,
        read: false,
        createdAt: new Date(),
        metadata: {
          proposedBudget: data.proposedBudget,
          currency: currency
        }
      })

      // Notify freelancer
      await db.collection("notifications").insertOne({
        userId: freelancerId,
        type: "application_submitted",
        title: "Application Submitted",
        message: `Your application for "${project.title}" has been submitted`,
        projectId,
        read: false,
        createdAt: new Date(),
      })

      return NextResponse.json(
        { 
          success: true,
          message: "Application submitted successfully",
          applicationId: result.insertedId,
          applicationType: "individual",
          budget: {
            proposed: data.proposedBudget,
            min: minBudget,
            max: maxBudget,
            currency: currency
          }
        }, 
        { status: 201 }
      )
    }

  } catch (error) {
    console.error("Error submitting application:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}