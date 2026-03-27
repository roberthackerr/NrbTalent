// app/api/projects/[id]/apply/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"
import { v2 as cloudinary } from "cloudinary"
import { notificationService } from "@/services/NotificationService"

// ─── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  url: {
    secure: true,
    private_cdn: false,
    sign_url: false
  }
})

// ─── Types ────────────────────────────────────────────────────────────────────
type ProcessedAttachment = {
  url: string
  publicId: string
  name: string
  type: string
  size: number
  thumbnail?: string
  resourceType: string
}

// ─── Attachment Schema ───────────────────────────────────────────────────────
const AttachmentSchema = z.object({
  url: z.string().optional(),
  publicId: z.string().optional(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
  thumbnail: z.string().optional(),
  resourceType: z.string().optional(),
  base64Data: z.string().optional(),
})

// ─── Validation Schema ───────────────────────────────────────────────────────
const ApplicationSchema = z.object({
  coverLetter: z.string()
    .min(1, "Cover letter is required")
    .max(2000, "Cover letter must not exceed 2000 characters"),
  
  proposedBudget: z.number()
    .min(1, "Budget must be greater than 0"),
    
  estimatedDuration: z.string()
    .min(1, "Estimated duration is required")
    .max(100, "Estimated duration is too long"),
    
  attachments: z.array(AttachmentSchema)
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
  if (data.applyMode === 'team') {
    return !!data.teamId && ObjectId.isValid(data.teamId!)
  }
  return true
}, {
  message: "Team ID is required for team applications",
  path: ["teamId"]
})

// ─── Upload file from FormData to Cloudinary ─────────────────────────────────
async function uploadFileToCloudinary(file: File, folder: string = 'applications'): Promise<ProcessedAttachment | null> {
  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Data = buffer.toString('base64')
    
    const isPdf = file.type === 'application/pdf'
    const isImage = file.type.startsWith('image/')
    
    const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
    const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_')
    const publicIdWithExt = `${Date.now()}_${safeName}.${fileExt}`
    
    let base64WithPrefix = base64Data
    if (!base64Data.startsWith('data:')) {
      if (isPdf) {
        base64WithPrefix = `data:application/pdf;base64,${base64Data}`
      } else if (isImage) {
        base64WithPrefix = `data:${file.type};base64,${base64Data}`
      } else {
        base64WithPrefix = `data:application/octet-stream;base64,${base64Data}`
      }
    }

    const uploadOptions: Record<string, any> = {
      folder: `nrbtalents/${folder}`,
      public_id: publicIdWithExt,
      resource_type: isPdf ? 'raw' : isImage ? 'image' : 'raw',
      access_mode: 'public',
      tags: ['application', folder],
    }

    if (isPdf) {
      uploadOptions.flags = 'attachment'
    }

    if (isImage) {
      uploadOptions.transformation = [
        { width: 1200, crop: 'limit', quality: 'auto' }
      ]
    }

    const result = await cloudinary.uploader.upload(base64WithPrefix, uploadOptions)
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      name: file.name,
      type: file.type,
      size: file.size,
      thumbnail: isImage ? result.secure_url : undefined,
      resourceType: result.resource_type,
    }
  } catch (error) {
    console.error('Upload error:', error)
    return null
  }
}

// ─── POST Handler ────────────────────────────────────────────────────────────
export async function POST(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== "freelance") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { id } = await params
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    const contentType = request.headers.get("content-type") || ""
    let data: any
    let attachments: ProcessedAttachment[] = []

    // Handle multipart/form-data
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      
      // Check if this is a file-only upload (action=upload)
      const action = formData.get("action") as string
      
      if (action === "upload") {
        // Handle file upload only
        const file = formData.get("file") as File
        const folder = formData.get("folder") as string || "applications"
        
        if (!file) {
          return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
        }
        
        const uploaded = await uploadFileToCloudinary(file, folder)
        
        if (!uploaded) {
          return NextResponse.json({ error: "Upload failed" }, { status: 500 })
        }
        
        return NextResponse.json(uploaded)
      }
      
      // Handle full application submission
      // Extract form fields - handle null/undefined values
      const coverLetter = formData.get("coverLetter") as string
      const proposedBudgetStr = formData.get("proposedBudget") as string
      const estimatedDuration = formData.get("estimatedDuration") as string
      const applyMode = formData.get("applyMode") as "individual" | "team" || "individual"
      const teamId = formData.get("teamId") as string || undefined
      const attachmentsJson = formData.get("attachments") as string
      
      // Parse attachments if provided as JSON string
      if (attachmentsJson) {
        try {
          const parsedAttachments = JSON.parse(attachmentsJson)
          attachments = parsedAttachments
        } catch (e) {
          console.error("Failed to parse attachments JSON:", e)
        }
      }
      
      // Build data object with proper types
      data = {
        coverLetter: coverLetter || "",
        proposedBudget: proposedBudgetStr ? parseFloat(proposedBudgetStr) : 0,
        estimatedDuration: estimatedDuration || "",
        applyMode: applyMode,
        teamId: teamId,
        attachments: attachments
      }
    } 
    // Handle JSON
    else {
      data = await request.json()
      
      // Process attachments if they exist (for base64 uploads)
      if (data.attachments && data.attachments.length > 0) {
        const processedAttachments: ProcessedAttachment[] = []
        
        for (const attachment of data.attachments) {
          if (attachment.base64Data) {
            const isPdf = attachment.type === 'application/pdf'
            const isImage = attachment.type.startsWith('image/')
            
            const fileExt = attachment.name.split('.').pop()?.toLowerCase() || ''
            const nameWithoutExt = attachment.name.replace(/\.[^/.]+$/, '')
            const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_')
            const publicIdWithExt = `${Date.now()}_${safeName}.${fileExt}`
            
            let base64WithPrefix = attachment.base64Data
            if (!attachment.base64Data.startsWith('data:')) {
              if (isPdf) {
                base64WithPrefix = `data:application/pdf;base64,${attachment.base64Data}`
              } else if (isImage) {
                base64WithPrefix = `data:${attachment.type};base64,${attachment.base64Data}`
              } else {
                base64WithPrefix = `data:application/octet-stream;base64,${attachment.base64Data}`
              }
            }

            const uploadOptions: Record<string, any> = {
              folder: 'nrbtalents/applications',
              public_id: publicIdWithExt,
              resource_type: isPdf ? 'raw' : isImage ? 'image' : 'raw',
              access_mode: 'public',
              tags: ['application', 'attachment'],
            }

            if (isPdf) uploadOptions.flags = 'attachment'
            if (isImage) {
              uploadOptions.transformation = [
                { width: 1200, crop: 'limit', quality: 'auto' }
              ]
            }

            const result = await cloudinary.uploader.upload(base64WithPrefix, uploadOptions)
            
            processedAttachments.push({
              url: result.secure_url,
              publicId: result.public_id,
              name: attachment.name,
              type: attachment.type,
              size: attachment.size,
              thumbnail: isImage ? result.secure_url : undefined,
              resourceType: result.resource_type,
            })
          } else if (attachment.url && attachment.publicId) {
            processedAttachments.push({
              url: attachment.url,
              publicId: attachment.publicId,
              name: attachment.name,
              type: attachment.type,
              size: attachment.size,
              thumbnail: attachment.thumbnail,
              resourceType: attachment.resourceType ?? "auto",
            })
          }
        }
        
        data.attachments = processedAttachments
        attachments = processedAttachments
      }
    }
    
    // Validate application data
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
        }, 
        { status: 400 }
      )
    }

    if (proposedBudget > maxBudget) {
      return NextResponse.json(
        { 
          error: "Budget too high",
          message: `Your proposal (${proposedBudget} ${currency}) exceeds the maximum budget (${maxBudget} ${currency})`,
        }, 
        { status: 400 }
      )
    }

    // Get freelancer name for notifications
    const freelancer = await db.collection("users").findOne(
      { _id: freelancerId },
      { projection: { name: 1, avatar: 1 } }
    )
    const freelancerName = freelancer?.name || session.user?.name || "A freelancer"

    // ──────────────────────────────────────────────────────────────────────────
    // TEAM APPLICATION LOGIC
    // ──────────────────────────────────────────────────────────────────────────
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
        attachments: attachments,
        status: "pending",
        clientViewed: false,
        teamSummary: {
          name: team.name,
          memberCount: team.members.length,
          roles: team.members.map((m: any) => m.role || "member"),
          skills: team.skills || [],
          leadName: freelancerName
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

      // ✅ NOTIFICATIONS FOR TEAM APPLICATION
      
      // 1. Notify the client (project owner)
      await notificationService.send({
        userId: project.clientId.toString(),
        category: 'ORDER',
        priority: 'MEDIUM',
        title: '👥 New Team Application',
        message: `Team "${team.name}" (${team.members.length} members) has applied to your project "${project.title}"`,
        actionUrl: `/projects/${projectId.toString()}/applications`,
        data: {
          applicationId: result.insertedId.toString(),
          applicationType: 'team',
          projectId: projectId.toString(),
          projectTitle: project.title,
          teamName: team.name,
          teamSize: team.members.length,
          proposedBudget: data.proposedBudget,
          currency: currency,
          attachmentsCount: attachments.length
        }
      })

      // 2. Notify all team members
      const teamMembers = team.members.map((m: any) => m.userId)
      await Promise.all(
        teamMembers.map(async (memberId: ObjectId) => {
          await notificationService.send({
            userId: memberId.toString(),
            category: 'ORDER',
            priority: 'MEDIUM',
            title: '🤝 Team Application Submitted',
            message: `Your team "${team.name}" has applied to project "${project.title}"`,
            actionUrl: `/teams/${teamId.toString()}/applications`,
            data: {
              applicationId: result.insertedId.toString(),
              projectId: projectId.toString(),
              projectTitle: project.title,
              teamId: teamId.toString(),
              teamName: team.name
            }
          })
        })
      )

      // 3. Update project application count
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
          attachmentsUploaded: attachments.length,
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
    
    // ──────────────────────────────────────────────────────────────────────────
    // INDIVIDUAL APPLICATION LOGIC
    // ──────────────────────────────────────────────────────────────────────────
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
        attachments: attachments,
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

      // ✅ NOTIFICATIONS FOR INDIVIDUAL APPLICATION
      
      // 1. Notify the client (project owner)
      await notificationService.send({
        userId: project.clientId.toString(),
        category: 'ORDER',
        priority: 'MEDIUM',
        title: '📝 New Application',
        message: `${freelancerName} has applied to your project "${project.title}"`,
        actionUrl: `/projects/${projectId.toString()}/applications`,
        data: {
          applicationId: result.insertedId.toString(),
          applicationType: 'individual',
          projectId: projectId.toString(),
          projectTitle: project.title,
          freelancerId: freelancerId.toString(),
          freelancerName: freelancerName,
          proposedBudget: data.proposedBudget,
          currency: currency,
          estimatedDuration: data.estimatedDuration,
          attachmentsCount: attachments.length
        }
      })

      // 2. Notify the freelancer (applicant)
      await notificationService.send({
        userId: freelancerId.toString(),
        category: 'ORDER',
        priority: 'MEDIUM',
        title: '✅ Application Submitted',
        message: `Your application for "${project.title}" has been submitted successfully`,
        actionUrl: `/projects/${projectId.toString()}`,
        data: {
          applicationId: result.insertedId.toString(),
          projectId: projectId.toString(),
          projectTitle: project.title,
          proposedBudget: data.proposedBudget,
          currency: currency,
          estimatedDuration: data.estimatedDuration,
          attachmentsCount: attachments.length
        }
      })

      // 3. Update project application count
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
          message: "Application submitted successfully",
          applicationId: result.insertedId,
          applicationType: "individual",
          attachmentsUploaded: attachments.length,
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