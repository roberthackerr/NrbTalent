import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Project from "@/lib/models/project"
import Application from "@/lib/models/application"
import User from "@/lib/models/user"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const user = await User.findById(session.user.id)

    if (user.role === "freelance") {
      // Freelancer analytics
      const applications = await Application.find({ freelancer: user._id })
      const acceptedApps = applications.filter((a) => a.status === "accepted")
      const projects = await Project.find({ assignedFreelancer: user._id })

      const completedProjects = projects.filter((p) => p.status === "completed")
      const inProgressProjects = projects.filter((p) => p.status === "in_progress")

      // Calculate earnings over time
      const earningsOverTime = await Application.aggregate([
        { $match: { freelancer: user._id, paymentStatus: "paid" } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$paidAt" } },
            total: { $sum: "$proposedBudget" },
          },
        },
        { $sort: { _id: 1 } },
      ])

      // Success rate by category
      const successByCategory = await Application.aggregate([
        { $match: { freelancer: user._id } },
        { $lookup: { from: "projects", localField: "project", foreignField: "_id", as: "projectData" } },
        { $unwind: "$projectData" },
        {
          $group: {
            _id: "$projectData.category",
            total: { $sum: 1 },
            accepted: { $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] } },
          },
        },
        {
          $project: {
            category: "$_id",
            successRate: { $multiply: [{ $divide: ["$accepted", "$total"] }, 100] },
          },
        },
      ])

      return NextResponse.json({
        totalApplications: applications.length,
        acceptanceRate: ((acceptedApps.length / applications.length) * 100).toFixed(1),
        completedProjects: completedProjects.length,
        inProgressProjects: inProgressProjects.length,
        totalEarnings: user.totalEarnings || 0,
        averageRating: user.rating || 0,
        earningsOverTime,
        successByCategory,
      })
    } else {
      // Client analytics
      const projects = await Project.find({ client: user._id })
      const completedProjects = projects.filter((p) => p.status === "completed")
      const inProgressProjects = projects.filter((p) => p.status === "in_progress")

      const totalApplications = await Application.countDocuments({
        project: { $in: projects.map((p) => p._id) },
      })

      // Spending over time
      const spendingOverTime = await Application.aggregate([
        {
          $match: {
            project: { $in: projects.map((p) => p._id) },
            paymentStatus: "paid",
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$paidAt" } },
            total: { $sum: "$proposedBudget" },
          },
        },
        { $sort: { _id: 1 } },
      ])

      // Projects by category
      const projectsByCategory = await Project.aggregate([
        { $match: { client: user._id } },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
      ])

      return NextResponse.json({
        totalProjects: projects.length,
        completedProjects: completedProjects.length,
        inProgressProjects: inProgressProjects.length,
        totalApplications,
        spendingOverTime,
        projectsByCategory,
      })
    }
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
