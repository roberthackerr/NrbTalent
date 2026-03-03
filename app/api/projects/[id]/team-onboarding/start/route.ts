// app/api/projects/[id]/team-onboarding/start/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  try {
    const authSession = await getServerSession(authOptions)
    
    if (!authSession) {
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

    const db = await getDatabase()
    const projectId = new ObjectId(id)
    const clientId = new ObjectId((authSession.user as any).id)

    // Check if project exists and user is the client
    const project = await db.collection('projects').findOne({ 
      _id: projectId,
      clientId: clientId
    })

    if (!project) {
      return NextResponse.json({ 
        success: false, 
        error: 'Project not found or unauthorized access' 
      }, { status: 404 })
    }

    // Check if project is in valid state for starting
    if (!['open', 'onboarding'].includes(project.status)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Project cannot be started in its current state' 
      }, { status: 400 })
    }

    // Check if project has a team assigned
    if (!project.teamId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No team assigned to this project' 
      }, { status: 400 })
    }

    // Get team details for notifications
    const team = await db.collection('teams').findOne({ 
      _id: project.teamId 
    })

    if (!team) {
      return NextResponse.json({ 
        success: false, 
        error: 'Team not found' 
      }, { status: 404 })
    }

    // Start MongoDB transaction session
    const mongoSession = db.client.startSession()
    
    try {
      await mongoSession.withTransaction(async () => {
        // Update project status to in-progress
        const updateResult = await db.collection('projects').updateOne(
          { _id: projectId },
          {
            $set: {
              status: 'in-progress',
              onboardingCompleted: true,
              trackingStartedAt: new Date(),
              updatedAt: new Date()
            }
          },
          { session: mongoSession }
        )

        if (updateResult.modifiedCount === 0) {
          throw new Error('Failed to update project status')
        }

        // Update team application status to accepted (if exists)
        await db.collection('team_applications').updateOne(
          {
            projectId: projectId,
            teamId: project.teamId,
            status: 'pending'
          },
          {
            $set: {
              status: 'accepted',
              acceptedAt: new Date(),
              updatedAt: new Date()
            }
          },
          { session: mongoSession }
        )

        // Create initial project workspace
        const workspace = {
          _id: new ObjectId(),
          projectId: projectId,
          type: 'team',
          name: `${project.title} - Team Workspace`,
          description: `Workspace for team ${team.name}`,
          createdBy: clientId,
          createdAt: new Date(),
          updatedAt: new Date(),
          members: [
            // Add client as workspace owner
            {
              userId: clientId,
              role: 'owner',
              joinedAt: new Date(),
              permissions: ['admin', 'write', 'read']
            },
            // Add team lead
            ...team.members
              .filter((member: any) => member.isLead)
              .map((member: any) => ({
                userId: member.userId,
                role: 'lead',
                joinedAt: new Date(),
                permissions: ['write', 'read']
              })),
            // Add team members
            ...team.members
              .filter((member: any) => !member.isLead)
              .map((member: any) => ({
                userId: member.userId,
                role: 'member',
                joinedAt: new Date(),
                permissions: ['read']
              }))
          ],
          channels: [
            {
              id: 'general',
              name: 'General',
              type: 'text',
              description: 'General project discussions',
              createdBy: clientId,
              createdAt: new Date()
            },
            {
              id: 'announcements',
              name: 'Announcements',
              type: 'text',
              description: 'Project announcements and updates',
              createdBy: clientId,
              createdAt: new Date()
            },
            {
              id: 'tasks',
              name: 'Tasks & Progress',
              type: 'text',
              description: 'Task discussions and progress updates',
              createdBy: clientId,
              createdAt: new Date()
            }
          ]
        }

        await db.collection('workspaces').insertOne(workspace, { session: mongoSession })

        // Get team lead for tasks
        const teamLead = team.members.find((member: any) => member.isLead)

        // Create initial project tasks from milestones (if any)
        if (project.milestones && project.milestones.length > 0) {
          const tasks = project.milestones.map((milestone: any, index: number) => ({
            _id: new ObjectId(),
            projectId: projectId,
            workspaceId: workspace._id,
            title: milestone.title,
            description: milestone.description || `Task for milestone: ${milestone.title}`,
            type: 'milestone',
            status: 'todo',
            priority: index === 0 ? 'high' : 'medium',
            assignedTo: teamLead?.userId || null,
            createdBy: clientId,
            dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null,
            estimatedHours: milestone.estimatedHours || 8,
            createdAt: new Date(),
            updatedAt: new Date()
          }))

          if (tasks.length > 0) {
            await db.collection('tasks').insertMany(tasks, { session: mongoSession })
          }
        }

        // Create notifications for team members
        const notifications = team.members.map((member: any) => ({
          userId: member.userId,
          type: 'project_started',
          title: 'Project Started!',
          message: `The project "${project.title}" has been started by the client.`,
          projectId: projectId,
          workspaceId: workspace._id,
          read: false,
          createdAt: new Date(),
          metadata: {
            clientName: authSession.user?.name,
            teamName: team.name,
            projectTitle: project.title
          }
        }))

        // Add notification for client
        notifications.push({
          userId: clientId,
          type: 'project_tracking_started',
          title: 'Project Tracking Started',
          message: `You have started tracking for project "${project.title}" with team ${team.name}`,
          projectId: projectId,
          workspaceId: workspace._id,
          read: false,
          createdAt: new Date(),
          metadata: {
            teamName: team.name,
            teamSize: team.members.length
          }
        })

        await db.collection('notifications').insertMany(notifications, { session: mongoSession })

        // Create initial welcome message in workspace
        const welcomeMessage = {
          _id: new ObjectId(),
          workspaceId: workspace._id,
          channelId: 'general',
          content: `🎉 **Project "${project.title}" has officially started!**\n\nWelcome ${team.name} team! Let's work together to make this project a success.`,
          senderId: clientId,
          senderType: 'client',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        await db.collection('messages').insertOne(welcomeMessage, { session: mongoSession })

      })

      return NextResponse.json({
        success: true,
        message: 'Project tracking started successfully',
        redirectUrl: `/projects/${projectId}/tracking`,
        project: {
          id: projectId.toString(),
          status: 'in-progress',
          trackingStartedAt: new Date().toISOString()
        }
      })

    } catch (error) {
      await mongoSession.abortTransaction()
      throw error
    } finally {
      await mongoSession.endSession()
    }

  } catch (error) {
    console.error('Error starting team project tracking:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}