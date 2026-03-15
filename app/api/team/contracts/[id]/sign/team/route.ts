// app/api/team/contracts/[id]/sign/team/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

const TeamSignSchema = z.object({
  comment: z.string().optional()
})

export async function POST(
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
    const validationResult = TeamSignSchema.safeParse(data)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const contractId = new ObjectId(id)

    // Get contract
    const contract = await db.collection("team_contracts").findOne({
      _id: contractId
    })

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Check if user is a team member
    const teamMember = contract.signatures.members.find(
      (member: any) => member.userId.toString() === userId.toString()
    )

    if (!teamMember) {
      return NextResponse.json(
        { error: "You are not a team member on this contract" },
        { status: 403 }
      )
    }

    if (teamMember.signed) {
      return NextResponse.json(
        { error: "You have already signed this contract" },
        { status: 400 }
      )
    }

    // Check contract status
    if (contract.status !== 'pending') {
      return NextResponse.json(
        { error: "Contract is not in pending status" },
        { status: 400 }
      )
    }

    // Get user IP and user agent
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Update signature
    const now = new Date()
    await db.collection("team_contracts").updateOne(
      { 
        _id: contractId,
        "signatures.members.userId": userId
      },
      {
        $set: {
          "signatures.members.$.signed": true,
          "signatures.members.$.signedAt": now,
          "signatures.members.$.ipAddress": ip,
          "signatures.members.$.userAgent": userAgent,
          "signatures.completed": contract.signatures.completed + 1,
          updatedAt: now
        },
        $push: {
          activity: {
            type: 'team_signed',
            userId: userId,
            description: `Team member signed: ${(session.user as any).name}`,
            timestamp: now,
            metadata: {
              comment: validationResult.data.comment,
              ipAddress: ip
            }
          }
        }
      }
    )

    // Check if all signatures are complete
    const updatedContract = await db.collection("team_contracts").findOne({ _id: contractId })
    const allTeamSigned = updatedContract.signatures.members.every((m: any) => m.signed)
    const clientSigned = updatedContract.signatures.client.signed
    const allSigned = allTeamSigned && clientSigned

    if (allSigned) {
      // Activate contract
      await db.collection("team_contracts").updateOne(
        { _id: contractId },
        {
          $set: {
            status: 'active',
            updatedAt: now
          },
          $push: {
            activity: {
              type: 'contract_active',
              userId: null,
              description: 'Contract is now active (all signatures received)',
              timestamp: now
            }
          }
        }
      )

      // Create notifications
      await db.collection("notifications").insertMany([
        {
          userId: contract.clientId,
          type: 'contract_active',
          title: 'Contract Active',
          message: `Contract "${contract.title}" is now active. All signatures have been received.`,
          contractId: contractId,
          read: false,
          createdAt: now
        },
        {
          userId: contract.teamId,
          type: 'contract_active',
          title: 'Contract Active',
          message: `Contract "${contract.title}" is now active. All signatures have been received.`,
          contractId: contractId,
          read: false,
          createdAt: now
        }
      ])
    }

    // Create notification for client
    await db.collection("notifications").insertOne({
      userId: contract.clientId,
      type: 'team_member_signed',
      title: 'Team Member Signed',
      message: `A team member has signed contract "${contract.title}"`,
      contractId: contractId,
      read: false,
      createdAt: now
    })

    return NextResponse.json({
      success: true,
      message: "Contract signed successfully",
      allSigned
    })
  } catch (error) {
    console.error("Error signing contract as team member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}