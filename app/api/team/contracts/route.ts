// app/api/team/contracts/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

const CreateTeamContractSchema = z.object({
  title: z.string().min(1, "Contract title is required").max(200),
  description: z.string().max(1000).optional(),
  teamId: z.string().refine(val => ObjectId.isValid(val), "Invalid team ID"),
  clientId: z.string().refine(val => ObjectId.isValid(val), "Invalid client ID"),
  type: z.enum(['fixedPrice', 'hourlyRate', 'milestoneBased', 'retainer']),
  value: z.number().min(0, "Value must be positive"),
  currency: z.string().default('USD'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  scopeOfWork: z.string().min(1, "Scope of work is required"),
  deliverables: z.array(z.object({
    title: z.string().min(1, "Deliverable title is required"),
    description: z.string().optional(),
    dueDate: z.string().optional()
  })).min(1, "At least one deliverable is required"),
  milestones: z.array(z.object({
    title: z.string().min(1, "Milestone title is required"),
    amount: z.number().min(0),
    dueDate: z.string().optional(),
    description: z.string().optional()
  })).optional().default([]),
  paymentTerms: z.string().optional(),
  specialTerms: z.string().optional(),
  requiresAllSignatures: z.boolean().default(true),
  isRecurring: z.boolean().default(false),
  autoRenew: z.boolean().default(false)
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = new ObjectId((session.user as any).id)
    const role = searchParams.get('role') // client, team, member
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const db = await getDatabase()
    const skip = (page - 1) * limit

    // ✅ CRITICAL FIX: Always filter by user, even without role parameter
    let query: any = {
      $or: [
        { clientId: userId }, // User is the client
        { 
          // User is a team member
          teamId: { 
            $in: await db.collection("teams")
              .find({ "members.userId": userId })
              .project({ _id: 1 })
              .map(team => team._id)
              .toArray()
          }
        },
        { createdBy: userId } // User created the contract
      ]
    }

    // Override with role-specific filter if provided
    if (role === 'client') {
      query = { clientId: userId }
    } else if (role === 'team' || role === 'member') {
      const userTeams = await db.collection("teams").find({
        "members.userId": userId
      }).project({ _id: 1 }).toArray()

      const teamIds = userTeams.map(team => team._id)
     // query = { teamId: { $in: teamIds } }
      query= { teamId: { $in: teamIds } }
    }

    // Apply filters
    if (status && status !== 'all') {
      query.status = status
    }
    if (type && type !== 'all') {
      query.type = type
    }

    const [contracts, total] = await Promise.all([
      db.collection("team_contracts")
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("team_contracts").countDocuments(query)
    ])
    const enrichedContracts = await Promise.all(
      contracts.map(async (contract) => {
        const [team, client] = await Promise.all([
          db.collection("teams").findOne({ _id: contract.teamId }),
          db.collection("users").findOne({ _id: contract.clientId })
        ])

        return {
          ...contract,
          id: contract._id.toString(),
          team: team ? {
            id: team._id.toString(),
            name: team.name,
            avatar: team.avatar,
            members: team.members.length
          } : null,
          client: client ? {
            id: client._id.toString(),
            name: client.name,
            avatar: client.avatar,
            email: client.email
          } : null
        }
      })
    )

    return NextResponse.json({
      success: true,
      contracts: enrichedContracts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Error fetching team contracts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const validationResult = CreateTeamContractSchema.safeParse(data)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data
    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Verify client owns the clientId
    if (validatedData.clientId.toString() !== userId.toString()) {
      return NextResponse.json(
        { error: "You can only create contracts for yourself as client" },
        { status: 403 }
      )
    }

    // Verify team exists and get members
    const team = await db.collection("teams").findOne({
      _id: new ObjectId(validatedData.teamId)
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Create contract
    const contract = {
      ...validatedData,
      teamId: new ObjectId(validatedData.teamId),
      clientId: new ObjectId(validatedData.clientId),
      createdBy: userId,
      status: 'draft',
      progress: 0,
      signatures: {
        total: team.members.length + 1, // Team members + client
        completed: 0,
        members: team.members.map((member: any) => ({
          userId: member.userId,
          role: member.role,
          isLead: member.isLead || false,
          signed: false,
          signedAt: null,
          ipAddress: null,
          userAgent: null
        })),
        client: {
          userId: userId,
          signed: false,
          signedAt: null,
          ipAddress: null,
          userAgent: null
        }
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      activity: [{
        type: 'contract_created',
        userId: userId,
        description: 'Contract created',
        timestamp: new Date()
      }]
    }

    const result = await db.collection("team_contracts").insertOne(contract)

    // Create notifications for team members
    const notificationPromises = team.members.map(async (member: any) => {
      await db.collection("notifications").insertOne({
        userId: member.userId,
        type: 'team_contract_created',
        title: 'New Team Contract',
        message: `A new contract "${validatedData.title}" has been created for your team`,
        contractId: result.insertedId,
        read: false,
        createdAt: new Date()
      })
    })

    await Promise.all(notificationPromises)

    return NextResponse.json({
      success: true,
      message: "Team contract created successfully",
      contractId: result.insertedId
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating team contract:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
// const [contracts, total] = await Promise.all([
//       db.collection("team_contracts")
//         .find(query)
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .toArray(),
//       db.collection("team_contracts").countDocuments(query)
//     ])

//     // Get team and client details
//     const enrichedContracts = await Promise.all(
//       contracts.map(async (contract) => {
//         const [team, client] = await Promise.all([
//           db.collection("teams").findOne({ _id: contract.teamId }),
//           db.collection("users").findOne({ _id: contract.clientId })
//         ])

//         return {
//           ...contract,
//           id: contract._id.toString(),
//           team: team ? {
//             id: team._id.toString(),
//             name: team.name,
//             avatar: team.avatar,
//             members: team.members.length
//           } : null,
//           client: client ? {
//             id: client._id.toString(),
//             name: client.name,
//             avatar: client.avatar,
//             email: client.email
//           } : null
//         }
//       })
//     )

//     return NextResponse.json({
//       success: true,
//       contracts: enrichedContracts,
//       pagination: {
//         page,
//         limit,
//         total,
//         pages: Math.ceil(total / limit)
//       }
//     })
//   } catch (error) {
//     console.error("Error fetching team contracts:", error)
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     )
//   }