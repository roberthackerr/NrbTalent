// app/api/projects/[id]/team-onboarding/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(
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

    const db = await getDatabase()
    const projectId = new ObjectId(id)
    const userId = new ObjectId((session.user as any).id)

    // Check if project exists and user has access
    const project = await db.collection('projects').findOne({ 
      _id: projectId,
      clientId: userId // Only client can access onboarding
    })

    if (!project) {
      return NextResponse.json({ 
        success: false, 
        error: 'Project not found or unauthorized access' 
      }, { status: 404 })
    }

    // Check if project has a team assigned
    if (!project.teamId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No team assigned to this project' 
      }, { status: 400 })
    }

    // Get detailed project with team information
    const detailedProject = await db.collection('projects').aggregate([
      { 
        $match: { 
          _id: projectId
        } 
      },
      // Lookup client details
      {
        $lookup: {
          from: 'users',
          localField: 'clientId',
          foreignField: '_id',
          as: 'client'
        }
      },
      // Lookup team details
      {
        $lookup: {
          from: 'teams',
          localField: 'teamId',
          foreignField: '_id',
          as: 'team'
        }
      },
      // Lookup team applications (for reference)
      {
        $lookup: {
          from: 'team_applications',
          let: { projectId: '$_id', teamId: '$teamId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$projectId', '$$projectId'] },
                    { $eq: ['$teamId', '$$teamId'] }
                  ]
                }
              }
            }
          ],
          as: 'teamApplication'
        }
      },
      { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$team', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$teamApplication', preserveNullAndEmptyArrays: true } },
      // Lookup team members with their user details
      {
        $lookup: {
          from: 'users',
          let: { memberIds: { $ifNull: ['$team.members.userId', []] } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$_id', '$$memberIds']
                }
              }
            },
            {
              $project: {
                name: 1,
                avatar: 1,
                email: 1,
                title: 1,
                rating: 1,
                skills: 1,
                bio: 1,
                location: 1,
                completedProjects: 1
              }
            }
          ],
          as: 'teamMemberDetails'
        }
      },
      // Add team members with their roles
      {
        $addFields: {
          'team.members': {
            $map: {
              input: '$team.members',
              as: 'member',
              in: {
                $mergeObjects: [
                  '$$member',
                  {
                    userDetails: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$teamMemberDetails',
                            as: 'user',
                            cond: { $eq: ['$$user._id', '$$member.userId'] }
                          }
                        },
                        0
                      ]
                    }
                  }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          status: 1,
          budget: 1,
          finalBudget: 1,
          timeline: 1,
          milestones: 1,
          documents: 1,
          communicationPreferences: 1,
          onboardingCompleted: 1,
          trackingStartedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          clientId: 1,
          teamId: 1,
          // Client details
          'client._id': 1,
          'client.name': 1,
          'client.avatar': 1,
          'client.email': 1,
          'client.rating': 1,
          'client.title': 1,
          'client.bio': 1,
          'client.location': 1,
          'client.company': 1,
          'client.completedProjects': 1,
          'client.memberSince': 1,
          'client.responseRate': 1,
          // Team details
          'team._id': 1,
          'team.name': 1,
          'team.description': 1,
          'team.avatar': 1,
          'team.rating': 1,
          'team.completedProjects': 1,
          'team.totalEarnings': 1,
          'team.successRate': 1,
          'team.availability': 1,
          'team.responseTime': 1,
          'team.skills': 1,
          'team.members': 1,
          'team.memberCount': 1,
          'team.preferredProjectTypes': 1,
          'team.communicationPreferences': 1,
          // Team application details
          'teamApplication.coverLetter': 1,
          'teamApplication.proposedBudget': 1,
          'teamApplication.estimatedDuration': 1,
          'teamApplication.createdAt': 1
        }
      }
    ]).next()

    if (!detailedProject) {
      return NextResponse.json({ 
        success: false, 
        error: 'Error loading project details' 
      }, { status: 500 })
    }

    // Transform team members data
    const transformedProject = {
      ...detailedProject,
      team: detailedProject.team ? {
        ...detailedProject.team,
        members: detailedProject.team.members?.map((member: any) => ({
          _id: member.userId,
          ...member.userDetails,
          role: member.role,
          isLead: member.isLead,
          joinDate: member.joinDate,
          skills: member.skills || member.userDetails?.skills || []
        })) || []
      } : null
    }

    // Get recent messages for this project
    const messages = await db.collection('messages')
      .find({
        projectId: projectId,
        $or: [
          { type: 'team' },
          { 
            participants: { 
              $elemMatch: { 
                userId: userId,
                type: 'client' 
              } 
            } 
          }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    return NextResponse.json({
      success: true,
      project: transformedProject,
      messages: messages.reverse(),
      onboardingEligible: ['open', 'onboarding'].includes(detailedProject.status),
      currentUserRole: 'client'
    })

  } catch (error) {
    console.error('Error fetching team onboarding data:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}