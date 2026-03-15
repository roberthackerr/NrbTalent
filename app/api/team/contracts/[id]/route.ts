
// app/api/team/contracts/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

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
      return NextResponse.json({ error: "Invalid contract ID" }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const contractId = new ObjectId(id)

    const contract = await db.collection("team_contracts").findOne({
      _id: contractId
    })

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Check if user has access
    const isClient = contract.clientId.toString() === userId.toString()
    const isTeamMember = contract.signatures.members.some(
      (member: any) => member.userId.toString() === userId.toString()
    )

    if (!isClient && !isTeamMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get team and client details
    const [team, client] = await Promise.all([
      db.collection("teams").findOne({ _id: contract.teamId }),
      db.collection("users").findOne({ _id: contract.clientId })
    ])

    // Get member details
    const memberIds = contract.signatures.members.map((m: any) => m.userId)
    const members = await db.collection("users")
      .find({ _id: { $in: memberIds } })
      .project({ name: 1, avatar: 1, email: 1, title: 1 })
      .toArray()

    const enrichedContract = {
      ...contract,
      id: contract._id.toString(),
      team: team ? {
        id: team._id.toString(),
        name: team.name,
        avatar: team.avatar,
        lead: team.members.find((m: any) => m.isLead),
        members: team.members.map((member: any) => {
          const user = members.find((u: any) => u._id.toString() === member.userId.toString())
          const signature = contract.signatures.members.find(
            (s: any) => s.userId.toString() === member.userId.toString()
          )
          return {
            ...member,
            userId: member.userId.toString(),
            userInfo: user ? {
              name: user.name,
              avatar: user.avatar,
              email: user.email,
              title: user.title
            } : null,
            signed: signature?.signed || false,
            signedAt: signature?.signedAt,
            ipAddress: signature?.ipAddress,
            userAgent: signature?.userAgent
          }
        })
      } : null,
      client: client ? {
        id: client._id.toString(),
        name: client.name,
        avatar: client.avatar,
        email: client.email,
        phone: client.phone,
        signed: contract.signatures.client.signed,
        signedAt: contract.signatures.client.signedAt,
        ipAddress: contract.signatures.client.ipAddress,
        userAgent: contract.signatures.client.userAgent
      } : null,
      currentUser: {
        isClient,
        isTeamMember,
        isTeamLead: isTeamMember && contract.signatures.members.find(
          (m: any) => m.userId.toString() === userId.toString() && m.isLead
        ),
        hasSigned: isClient 
          ? contract.signatures.client.signed
          : contract.signatures.members.find(
              (m: any) => m.userId.toString() === userId.toString()
            )?.signed || false
      }
    }

    return NextResponse.json({
      success: true,
      contract: enrichedContract
    })
  } catch (error) {
    console.error("Error fetching team contract:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

const UpdateContractSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  scopeOfWork: z.string().optional(),
  deliverables: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    status: z.enum(['pending', 'in-progress', 'completed']).optional()
  })).optional(),
  milestones: z.array(z.object({
    title: z.string().min(1),
    amount: z.number().min(0),
    dueDate: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['pending', 'paid']).optional()
  })).optional(),
  specialTerms: z.string().optional(),
  status: z.enum(['draft', 'pending', 'active', 'completed', 'cancelled']).optional(),
  progress: z.number().min(0).max(100).optional()
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
      return NextResponse.json({ error: "Invalid contract ID" }, { status: 400 })
    }

    const data = await request.json()
    const validationResult = UpdateContractSchema.safeParse(data)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const contractId = new ObjectId(id)

    // Get current contract
    const contract = await db.collection("team_contracts").findOne({
      _id: contractId
    })

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Check permissions (only client or team lead can update)
    const isClient = contract.clientId.toString() === userId.toString()
    const isTeamLead = contract.signatures.members.some(
      (member: any) => member.userId.toString() === userId.toString() && member.isLead
    )

    if (!isClient && !isTeamLead) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Update contract
    const updates = validationResult.data
    const updateResult = await db.collection("team_contracts").updateOne(
      { _id: contractId },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        },
        $push: {
          activity: {
            type: 'contract_updated',
            userId: userId,
            description: 'Contract updated',
            timestamp: new Date(),
            changes: Object.keys(updates)
          }
        }
      }
    )

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to update contract" }, { status: 500 })
    }

    // Create notification for other party
    const otherPartyId = isClient 
      ? contract.signatures.members.find((m: any) => m.isLead)?.userId
      : contract.clientId

    if (otherPartyId) {
      await db.collection("notifications").insertOne({
        userId: otherPartyId,
        type: 'team_contract_updated',
        title: 'Contract Updated',
        message: `Contract "${contract.title}" has been updated`,
        contractId: contractId,
        read: false,
        createdAt: new Date()
      })
    }

    return NextResponse.json({
      success: true,
      message: "Contract updated successfully"
    })
  } catch (error) {
    console.error("Error updating team contract:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
      return NextResponse.json({ error: "Invalid contract ID" }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const contractId = new ObjectId(id)

    // Get contract to check permissions
    const contract = await db.collection("team_contracts").findOne({
      _id: contractId
    })

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Only client can delete draft contracts
    if (contract.status !== 'draft' || contract.clientId.toString() !== userId.toString()) {
      return NextResponse.json(
        { error: "Only clients can delete draft contracts" },
        { status: 403 }
      )
    }

    // Delete contract
    await db.collection("team_contracts").deleteOne({ _id: contractId })

    return NextResponse.json({
      success: true,
      message: "Contract deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting team contract:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}