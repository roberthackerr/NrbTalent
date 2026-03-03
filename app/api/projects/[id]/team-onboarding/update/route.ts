// app/api/projects/[id]/team-onboarding/update/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { z } from 'zod'

// Validation schema for onboarding updates
const UpdateOnboardingSchema = z.object({
  timeline: z.string().optional(),
  finalBudget: z.number().min(0).optional(),
  milestones: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    dueDate: z.string().datetime(),
    estimatedHours: z.number().min(0).optional(),
    amount: z.number().min(0).optional()
  })).optional(),
  communicationPreferences: z.object({
    frequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly']),
    channels: z.array(z.enum(['email', 'in_app', 'slack', 'whatsapp', 'teams'])),
    meetingFrequency: z.enum(['weekly', 'bi-weekly', 'monthly', 'as_needed']),
    preferredTime: z.string().optional()
  }).optional(),
  documents: z.array(z.object({
    name: z.string(),
    type: z.string(),
    url: z.string().url(),
    description: z.string().optional()
  })).optional()
}).strict()

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const { id } = await params
    
    // Validate project ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid project ID' 
      }, { status: 400 })
    }

    const body = await request.json()
    const validationResult = UpdateOnboardingSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid data',
        details: validationResult.error.issues 
      }, { status: 400 })
    }

    const updates = validationResult.data
    const db = await getDatabase()
    const projectId = new ObjectId(id)
    const clientId = new ObjectId((session.user as any).id)

    // Check if project exists and user is the client
    const project = await db.collection('projects').findOne({ 
      _id: projectId,
      clientId: clientId,
      status: { $in: ['open', 'onboarding'] }
    })

    if (!project) {
      return NextResponse.json({ 
        success: false, 
        error: 'Project not found or unauthorized access' 
      }, { status: 404 })
    }

    // Prepare update object
    const updateData: any = {
      updatedAt: new Date()
    }

    // Add timeline if provided
    if (updates.timeline) {
      updateData.timeline = updates.timeline
    }

    // Add final budget if provided
    if (updates.finalBudget !== undefined) {
      updateData.finalBudget = updates.finalBudget
    }

    // Add milestones if provided
    if (updates.milestones && updates.milestones.length > 0) {
      updateData.milestones = updates.milestones.map((milestone: any) => ({
        ...milestone,
        id: new ObjectId(),
        status: 'pending',
        createdAt: new Date()
      }))
    }

    // Add communication preferences if provided
    if (updates.communicationPreferences) {
      updateData.communicationPreferences = updates.communicationPreferences
    }

    // Add documents if provided
    if (updates.documents && updates.documents.length > 0) {
      const newDocuments = updates.documents.map((doc: any) => ({
        ...doc,
        id: new ObjectId(),
        uploadedAt: new Date(),
        uploadedBy: clientId
      }))

      updateData.documents = project.documents 
        ? [...project.documents, ...newDocuments]
        : newDocuments
    }

    // Update project
    const result = await db.collection('projects').updateOne(
      { _id: projectId },
      { $set: updateData }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update project details' 
      }, { status: 500 })
    }

    // Get team for notifications
    const team = await db.collection('teams').findOne({ 
      _id: project.teamId 
    })

    // Create notification for team lead about updates
    if (team) {
      const teamLead = team.members.find((member: any) => member.isLead)
      
      if (teamLead) {
        await db.collection('notifications').insertOne({
          userId: teamLead.userId,
          type: 'onboarding_updated',
          title: 'Project Details Updated',
          message: `The client has updated details for project "${project.title}"`,
          projectId: projectId,
          read: false,
          createdAt: new Date(),
          metadata: {
            updatedFields: Object.keys(updates),
            clientName: session.user?.name
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Project details updated successfully',
      updatedFields: Object.keys(updates)
    })

  } catch (error) {
    console.error('Error updating team onboarding details:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}