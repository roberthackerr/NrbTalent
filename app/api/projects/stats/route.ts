import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const userRole = (session.user as any).role

    // Statistiques pour les clients
    if (userRole === "client") {
      const clientStats = await db.collection("projects").aggregate([
        { $match: { clientId: userId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalBudget: { $sum: "$budget.max" }
          }
        }
      ]).toArray()

      const statusCounts = {
        draft: 0,
        open: 0,
        "in-progress": 0,
        completed: 0,
        cancelled: 0
      }

      clientStats.forEach(stat => {
        statusCounts[stat._id as keyof typeof statusCounts] = stat.count
      })

      const totalProjects = Object.values(statusCounts).reduce((a, b) => a + b, 0)

      return NextResponse.json({
        role: "client",
        totalProjects,
        statusCounts,
        totalSpent: clientStats.reduce((sum, stat) => sum + (stat.totalBudget || 0), 0),
        activeProjects: statusCounts.open + statusCounts["in-progress"]
      })
    }

    // Statistiques pour les freelances
    if (userRole === "freelance") {
      const freelanceStats = await db.collection("projects").aggregate([
        { $match: { freelancerId: userId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalEarned: { 
              $sum: { 
                $cond: [
                  { $eq: ["$status", "completed"] }, 
                  "$budget.max", 
                  0 
                ] 
              } 
            }
          }
        }
      ]).toArray()

      const applicationsStats = await db.collection("applications").aggregate([
        { $match: { freelancerId: userId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]).toArray()

      const statusCounts = {
        "in-progress": 0,
        completed: 0,
        cancelled: 0
      }

      freelanceStats.forEach(stat => {
        statusCounts[stat._id as keyof typeof statusCounts] = stat.count
      })

      const applicationStatus = {
        pending: 0,
        accepted: 0,
        rejected: 0
      }

      applicationsStats.forEach(stat => {
        applicationStatus[stat._id as keyof typeof applicationStatus] = stat.count
      })

      return NextResponse.json({
        role: "freelance",
        activeProjects: statusCounts["in-progress"],
        completedProjects: statusCounts.completed,
        totalEarned: freelanceStats.reduce((sum, stat) => sum + (stat.totalEarned || 0), 0),
        applications: applicationStatus,
        successRate: applicationStatus.accepted > 0 ? 
          (applicationStatus.accepted / (applicationStatus.pending + applicationStatus.accepted + applicationStatus.rejected)) * 100 : 0
      })
    }

    return NextResponse.json({ error: "Rôle utilisateur invalide" }, { status: 400 })
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}