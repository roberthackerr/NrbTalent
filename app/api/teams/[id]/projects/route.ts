// app/api/teams/[id]/projects/route.ts (FIXED with async params)
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> } // Note: params is Promise!
) {
  try {
    // ✅ AWAIT the params first!
    const params = await context.params
    const teamIdParam = params.id
    
    console.log('🔍 Team ID from params:', teamIdParam, 'Length:', teamIdParam.length)

    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Try to find team by any means necessary
    let team
    
    // FIRST: Check if it's a valid 24-char ObjectId
    if (ObjectId.isValid(teamIdParam) && teamIdParam.length === 24) {
      console.log('🔍 Looking for team by ObjectId:', teamIdParam)
      team = await db.collection("teams").findOne({
        _id: new ObjectId(teamIdParam)
      })
    }
    
    // SECOND: If not found or not valid ObjectId, try other methods
    if (!team) {
      console.log('🔍 ObjectId search failed, trying other methods...')
      
      // Try by custom ID field if you have one
      team = await db.collection("teams").findOne({
        $or: [
          { customId: teamIdParam },
          { slug: teamIdParam },
          { name: teamIdParam }
        ]
      })
    }

    if (!team) {
      return NextResponse.json({ 
        success: false,
        error: "Team not found",
        details: `No team found with identifier: ${teamIdParam} (${teamIdParam.length} chars)`,
        validObjectId: ObjectId.isValid(teamIdParam) && teamIdParam.length === 24
      }, { status: 404 })
    }

    console.log('✅ Team found:', team._id.toString(), team.name)

    // Check if user is a member
    const isMember = team.members?.some((member: any) => 
      member.userId.toString() === userId.toString()
    )
    
    if (!isMember && !team.isPublic) {
      return NextResponse.json({ 
        error: "Access denied",
        details: "You are not a member of this team"
      }, { status: 403 })
    }

    // Get contracts for this team
    const contracts = await db.collection("team_contracts")
      .find({
        teamId: team._id,
        status: { $nin: ['draft', 'cancelled'] }
      })
      .sort({ createdAt: -1 })
      .toArray()

    console.log(`📊 Found ${contracts.length} contracts for team`)

    // Get project details for each contract
    const enrichedProjects = await Promise.all(
      contracts.map(async (contract) => {
        const [client, project] = await Promise.all([
          db.collection("users").findOne({ _id: contract.clientId }),
          contract.projectId 
            ? db.collection("projects").findOne({ _id: contract.projectId })
            : Promise.resolve(null)
        ])

        // Calculate days remaining
        const endDate = new Date(contract.endDate)
        const today = new Date()
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          id: contract._id.toString(),
          contractId: contract._id.toString(),
          title: contract.title,
          description: contract.description,
          client: client ? {
            id: client._id.toString(),
            name: client.name || client.email,
            avatar: client.avatar,
            email: client.email
          } : null,
          project: project ? {
            id: project._id.toString(),
            title: project.title,
            description: project.description,
            category: project.category
          } : null,
          type: contract.type,
          value: contract.value,
          currency: contract.currency,
          status: contract.status,
          progress: contract.progress || 0,
          startDate: contract.startDate,
          endDate: contract.endDate,
          daysRemaining,
          milestones: contract.milestones || [],
          deliverables: contract.deliverables || [],
          signatures: contract.signatures || {
            total: 0,
            completed: 0
          },
          isRecurring: contract.isRecurring || false,
          autoRenew: contract.autoRenew || false,
          createdAt: contract.createdAt,
          updatedAt: contract.updatedAt
        }
      })
    )

    // Calculate team statistics
    const totalProjects = enrichedProjects.length
    const activeProjects = enrichedProjects.filter(p => p.status === 'active').length
    const completedProjects = enrichedProjects.filter(p => p.status === 'completed').length
    const totalRevenue = enrichedProjects.reduce((sum, project) => {
      if (['completed', 'active'].includes(project.status)) {
        return sum + project.value
      }
      return sum
    }, 0)

    const statistics = {
      totalProjects,
      activeProjects,
      completedProjects,
      totalRevenue,
      averageProjectValue: totalProjects > 0 ? totalRevenue / totalProjects : 0,
      completionRate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0
    }

    return NextResponse.json({
      success: true,
      teamId: team._id.toString(),
      projects: enrichedProjects,
      statistics
    })

  } catch (error) {
    console.error("❌ Error fetching team projects:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}