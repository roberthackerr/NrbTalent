"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, DollarSign, Briefcase, Star, Target, Award } from "lucide-react"
import StatsCard from "@/components/dashboard/stats-card"

const COLORS = ["#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"]

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/analytics")
        const data = await res.json()
        setAnalytics(data)
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading || !analytics) {
    return <div className="p-6">Loading analytics...</div>
  }

  const isFreelancer = session?.user?.role === "freelance"

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Track your performance and insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isFreelancer ? (
            <>
              <StatsCard
                title="Total Applications"
                value={analytics.totalApplications}
                icon={Briefcase}
                trend={`${analytics.acceptanceRate}% accepted`}
              />
              <StatsCard
                title="Total Earnings"
                value={`$${analytics.totalEarnings.toLocaleString()}`}
                icon={DollarSign}
                trend="All time"
              />
              <StatsCard
                title="Completed Projects"
                value={analytics.completedProjects}
                icon={Target}
                trend={`${analytics.inProgressProjects} in progress`}
              />
              <StatsCard
                title="Average Rating"
                value={analytics.averageRating.toFixed(1)}
                icon={Star}
                trend="Out of 5.0"
              />
            </>
          ) : (
            <>
              <StatsCard
                title="Total Projects"
                value={analytics.totalProjects}
                icon={Briefcase}
                trend={`${analytics.completedProjects} completed`}
              />
              <StatsCard
                title="Applications Received"
                value={analytics.totalApplications}
                icon={TrendingUp}
                trend="All projects"
              />
              <StatsCard
                title="Active Projects"
                value={analytics.inProgressProjects}
                icon={Target}
                trend="In progress"
              />
              <StatsCard
                title="Success Rate"
                value={`${((analytics.completedProjects / analytics.totalProjects) * 100).toFixed(0)}%`}
                icon={Award}
                trend="Completion rate"
              />
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earnings/Spending Over Time */}
          <Card className="bg-gray-900/50 border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {isFreelancer ? "Earnings Over Time" : "Spending Over Time"}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={isFreelancer ? analytics.earningsOverTime : analytics.spendingOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="_id" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Line type="monotone" dataKey="total" stroke="#06b6d4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Success by Category / Projects by Category */}
          <Card className="bg-gray-900/50 border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {isFreelancer ? "Success Rate by Category" : "Projects by Category"}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={isFreelancer ? analytics.successByCategory : analytics.projectsByCategory}
                  dataKey={isFreelancer ? "successRate" : "count"}
                  nameKey={isFreelancer ? "category" : "_id"}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {(isFreelancer ? analytics.successByCategory : analytics.projectsByCategory).map(
                    (entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ),
                  )}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Performance Insights */}
        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            Performance Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isFreelancer ? (
              <>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Application Success Rate</p>
                  <p className="text-2xl font-bold text-cyan-400">{analytics.acceptanceRate}%</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Average Project Value</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    $
                    {analytics.completedProjects > 0
                      ? (analytics.totalEarnings / analytics.completedProjects).toFixed(0)
                      : 0}
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Client Satisfaction</p>
                  <p className="text-2xl font-bold text-cyan-400">{analytics.averageRating.toFixed(1)}/5.0</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Avg Applications per Project</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    {(analytics.totalApplications / analytics.totalProjects).toFixed(1)}
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Project Completion Rate</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    {((analytics.completedProjects / analytics.totalProjects) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Active Hiring</p>
                  <p className="text-2xl font-bold text-cyan-400">{analytics.inProgressProjects} projects</p>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
