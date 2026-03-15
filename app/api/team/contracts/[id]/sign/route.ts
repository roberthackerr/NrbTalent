// app/api/team/contracts/[id]/sign/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

const SignContractSchema = z.object({
  comment: z.string().max(500).optional(),
  signAs: z.enum(['client', 'team-member']).optional()
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
    const validationResult = SignContractSchema.safeParse(data)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const contractId = new ObjectId(id)

    const contract = await db.collection("team_contracts").findOne({
      _id: contractId,
      status: { $in: ['draft', 'pending'] }
    })

    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found or not signable" },
        { status: 404 }
      )
    }

    // Get request headers for signature data
    const headers = Object.fromEntries(request.headers)
    const ipAddress = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown'
    const userAgent = headers['user-agent'] || 'unknown'

    const isClient = contract.clientId.toString() === userId.toString()
    const isTeamMember = contract.signatures.members.some(
      (member: any) => member.userId.toString() === userId.toString()
    )

    if (!isClient && !isTeamMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Determine where to record signature
    let updatePath = ''
    if (isClient) {
      updatePath = 'signatures.client'
    } else {
      updatePath = `signatures.members.$[member]`
    }

    // Update signature
    const updateData: any = {
      [`${updatePath}.signed`]: true,
      [`${updatePath}.signedAt`]: new Date(),
      [`${updatePath}.ipAddress`]: ipAddress,
      [`${updatePath}.userAgent`]: userAgent,
      [`${updatePath}.comment`]: validationResult.data.comment,
      updatedAt: new Date()
    }

    const arrayFilters = isClient ? [] : [{ 'member.userId': userId }]

    const updateResult = await db.collection("team_contracts").updateOne(
      { _id: contractId },
      { $set: updateData },
      { arrayFilters }
    )

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to sign contract" }, { status: 500 })
    }

    // Get updated contract to check if all signatures are complete
    const updatedContract = await db.collection("team_contracts").findOne({
      _id: contractId
    })

    const allMembersSigned = updatedContract?.signatures.members.every(
      (member: any) => member.signed
    )
    const clientSigned = updatedContract?.signatures.client.signed

    // Update contract status if all signatures are complete
    if (allMembersSigned && clientSigned && updatedContract.status === 'pending') {
      await db.collection("team_contracts").updateOne(
        { _id: contractId },
        {
          $set: {
            status: 'active',
            activatedAt: new Date(),
            updatedAt: new Date()
          },
          $push: {
            activity: {
              type: 'contract_activated',
              userId: userId,
              description: 'Contract activated (all signatures complete)',
              timestamp: new Date()
            }
          }
        }
      )
    }

    // Create activity log
    await db.collection("team_contracts").updateOne(
      { _id: contractId },
      {
        $push: {
          activity: {
            type: 'contract_signed',
            userId: userId,
            description: `${isClient ? 'Client' : 'Team member'} signed the contract`,
            timestamp: new Date(),
            comment: validationResult.data.comment
          }
        }
      }
    )

    // Notify other parties
    let notificationPromises = []
    
    if (isClient) {
      // Notify team lead
      const teamLead = updatedContract?.signatures.members.find((m: any) => m.isLead)
      if (teamLead && !teamLead.signed) {
        notificationPromises.push(
          db.collection("notifications").insertOne({
            userId: teamLead.userId,
            type: 'contract_signed',
            title: 'Client Signed Contract',
            message: `The client has signed contract "${contract.title}"`,
            contractId: contractId,
            read: false,
            createdAt: new Date()
          })
        )
      }
    } else {
      // Notify client if team member signed
      if (!updatedContract?.signatures.client.signed) {
        notificationPromises.push(
          db.collection("notifications").insertOne({
            userId: updatedContract?.clientId,
            type: 'contract_signed',
            title: 'Team Member Signed Contract',
            message: `A team member has signed contract "${contract.title}"`,
            contractId: contractId,
            read: false,
            createdAt: new Date()
          })
        )
      }
      
      // Notify team lead if this is not the lead
      const signer = updatedContract?.signatures.members.find(
        (m: any) => m.userId.toString() === userId.toString()
      )
      if (!signer.isLead) {
        const teamLead = updatedContract?.signatures.members.find((m: any) => m.isLead)
        if (teamLead && teamLead.userId.toString() !== userId.toString()) {
          notificationPromises.push(
            db.collection("notifications").insertOne({
              userId: teamLead.userId,
              type: 'team_member_signed',
              title: 'Team Member Signed',
              message: `A team member has signed contract "${contract.title}"`,
              contractId: contractId,
              read: false,
              createdAt: new Date()
            })
          )
        }
      }
    }

    if (notificationPromises.length > 0) {
      await Promise.all(notificationPromises)
    }

    return NextResponse.json({
      success: true,
      message: "Contract signed successfully",
      allSignaturesComplete: allMembersSigned && clientSigned
    })
  } catch (error) {
    console.error("Error signing team contract:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}