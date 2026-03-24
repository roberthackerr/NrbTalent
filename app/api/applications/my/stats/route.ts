// app/api/applications/my/stats/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "freelance") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const db = await getDatabase()
    const freelancerId = new ObjectId((session.user as any).id)

    const applications = await db.collection("applications")
      .find({ freelancerId })
      .toArray()

    const stats = {
      total: applications.length,
      pending: applications.filter(a => a.status === 'pending').length,
      accepted: applications.filter(a => a.status === 'accepted').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
      withdrawn: applications.filter(a => a.status === 'withdrawn').length,
      totalProposedBudget: applications.reduce((sum, a) => sum + (a.proposedBudget || 0), 0),
      averageProposedBudget: applications.length > 0 
        ? applications.reduce((sum, a) => sum + (a.proposedBudget || 0), 0) / applications.length 
        : 0
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error("Error fetching application stats:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}