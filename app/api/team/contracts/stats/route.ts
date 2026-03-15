// app/api/team/contracts/stats/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Get user's contracts (as client or team member)
    const userTeams = await db.collection("teams").find({
      "members.userId": userId
    }).project({ _id: 1 }).toArray()

    const teamIds = userTeams.map(team => team._id)
    const query = {
      $or: [
        { clientId: userId },
        { teamId: { $in: teamIds } }
      ]
    }

    const contracts = await db.collection("team_contracts")
      .find(query)
      .toArray()

    // Calculate stats
    const totalValue = contracts.reduce((acc, contract) => acc + contract.value, 0)
    const activeContracts = contracts.filter(c => c.status === 'active').length
    const completedContracts = contracts.filter(c => c.status === 'completed').length
    const pendingSignatures = contracts.reduce((acc, contract) => {
      return acc + (contract.signatures.total - contract.signatures.completed)
    }, 0)

    // Calculate average duration
    const totalDuration = contracts.reduce((acc, contract) => {
      const start = new Date(contract.startDate)
      const end = new Date(contract.endDate)
      const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      return acc + duration
    }, 0)
    const averageDuration = contracts.length > 0 ? Math.round(totalDuration / contracts.length) : 0

    // Calculate completion rate (only for completed contracts)
    const completionRate = contracts.length > 0 
      ? Math.round((completedContracts / contracts.filter(c => ['completed', 'cancelled'].includes(c.status)).length) * 100)
      : 0

    // Calculate renewal rate (estimated)
    const renewalRate = contracts.length > 0 
      ? Math.round((contracts.filter(c => c.isRecurring || c.autoRenew).length / contracts.length) * 100)
      : 0

    const stats = {
      totalContracts: contracts.length,
      activeContracts,
      pendingSignatures,
      totalValue,
      averageDuration,
      completionRate,
      renewalRate
    }

    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error("Error fetching contract stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}