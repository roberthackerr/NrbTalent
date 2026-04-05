// app/api/client/stats/route.ts
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

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'year'
    const projectId = searchParams.get('projectId')
    
    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const userRole = (session.user as any).role

    if (userRole !== "client") {
      return NextResponse.json({ error: "Accès réservé aux clients" }, { status: 403 })
    }

    // Base filter for client's projects
    const baseFilter: any = { clientId: userId }
    
    // Date filter based on period
    const now = new Date()
    
    if (period === 'month') {
      baseFilter.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()) }
    } else if (period === 'quarter') {
      baseFilter.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()) }
    } else if (period === 'year') {
      baseFilter.createdAt = { $gte: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()) }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 1. PROJECT STATISTICS
    // ──────────────────────────────────────────────────────────────────────────
    const projects = await db.collection("projects").find(baseFilter).toArray()
    
    const projectStats = {
      total: projects.length,
      byStatus: {
        draft: projects.filter(p => p.status === 'draft').length,
        open: projects.filter(p => p.status === 'open').length,
        inProgress: projects.filter(p => p.status === 'in-progress').length,
        completed: projects.filter(p => p.status === 'completed').length,
        cancelled: projects.filter(p => p.status === 'cancelled').length,
        paused: projects.filter(p => p.status === 'paused').length
      },
      byVisibility: {
        public: projects.filter(p => p.visibility === 'public').length,
        private: projects.filter(p => p.visibility === 'private').length
      },
      byCategory: {} as Record<string, number>,
      totalBudget: {
        min: projects.reduce((sum, p) => sum + (p.budget?.min || 0), 0),
        max: projects.reduce((sum, p) => sum + (p.budget?.max || 0), 0),
        average: 0
      },
      averageApplications: 0,
      completionRate: 0,
      successRate: 0
    }

    // Calculate category distribution
    projects.forEach(project => {
      if (project.category) {
        projectStats.byCategory[project.category] = (projectStats.byCategory[project.category] || 0) + 1
      }
    })

    const totalBudgetMax = projectStats.totalBudget.max
    projectStats.totalBudget.average = projectStats.total > 0 ? Math.round(totalBudgetMax / projectStats.total) : 0
    
    const totalApplications = projects.reduce((sum, p) => sum + (p.applicationCount || 0), 0)
    projectStats.averageApplications = projectStats.total > 0 ? Math.round(totalApplications / projectStats.total) : 0
    
    projectStats.completionRate = projectStats.total > 0 ? Math.round((projectStats.byStatus.completed / projectStats.total) * 100) : 0
    
    const completedAndCancelled = projectStats.byStatus.completed + projectStats.byStatus.cancelled
    projectStats.successRate = completedAndCancelled > 0 ? Math.round((projectStats.byStatus.completed / completedAndCancelled) * 100) : 0

    // ──────────────────────────────────────────────────────────────────────────
    // 2. APPLICATIONS STATISTICS
    // ──────────────────────────────────────────────────────────────────────────
    const projectIds = projects.map(p => p._id)
    
    let applications: any[] = []
    if (projectIds.length > 0) {
      applications = await db.collection("applications")
        .find({ projectId: { $in: projectIds } })
        .toArray()
    }

    const acceptedApplicationsCount = applications.filter(a => a.status === 'accepted').length
    const pendingApplicationsCount = applications.filter(a => a.status === 'pending').length
    const rejectedApplicationsCount = applications.filter(a => a.status === 'rejected').length
    const withdrawnApplicationsCount = applications.filter(a => a.status === 'withdrawn').length

    const applicationStats = {
      total: applications.length,
      byStatus: {
        pending: pendingApplicationsCount,
        accepted: acceptedApplicationsCount,
        rejected: rejectedApplicationsCount,
        withdrawn: withdrawnApplicationsCount
      },
      averagePerProject: projectStats.total > 0 ? applications.length / projectStats.total : 0,
      acceptanceRate: 0,
      averageProposedBudget: 0,
      byProject: [] as Array<{ projectId: string; projectTitle: string; count: number }>
    }

    applicationStats.acceptanceRate = applications.length > 0 ? Math.round((acceptedApplicationsCount / applications.length) * 100) : 0
    
    const totalProposedBudget = applications.reduce((sum, a) => sum + (a.proposedBudget || 0), 0)
    applicationStats.averageProposedBudget = applications.length > 0 ? Math.round(totalProposedBudget / applications.length) : 0

    // Applications by project
    const appsByProject = new Map<string, { projectId: string; projectTitle: string; count: number }>()
    applications.forEach(app => {
      const project = projects.find(p => p._id.toString() === app.projectId.toString())
      if (project) {
        const key = project._id.toString()
        const existing = appsByProject.get(key)
        if (existing) {
          existing.count++
        } else {
          appsByProject.set(key, {
            projectId: project._id.toString(),
            projectTitle: project.title,
            count: 1
          })
        }
      }
    })
    applicationStats.byProject = Array.from(appsByProject.values()).sort((a, b) => b.count - a.count)

    // ──────────────────────────────────────────────────────────────────────────
    // 3. FINANCIAL STATISTICS
    // ──────────────────────────────────────────────────────────────────────────
    const completedProjects = projects.filter(p => p.status === 'completed')
    const inProgressProjects = projects.filter(p => p.status === 'in-progress')
    
    const totalSpent = completedProjects.reduce((sum, p) => sum + (p.budget?.max || 0), 0)
    const totalCommitted = inProgressProjects.reduce((sum, p) => sum + (p.budget?.max || 0), 0)
    
    const financialStats = {
      totalSpent,
      totalCommitted,
      totalBudget: projectStats.totalBudget.max,
      averageProjectCost: projectStats.total > 0 ? Math.round(projectStats.totalBudget.max / projectStats.total) : 0,
      currency: projects[0]?.budget?.currency || 'EUR',
      monthlyTrend: [] as Array<{ month: string; spent: number; committed: number }>,
      byCategory: {} as Record<string, number>
    }

    // Calculate spending by category
    completedProjects.forEach(project => {
      if (project.category) {
        const current = financialStats.byCategory[project.category] || 0
        financialStats.byCategory[project.category] = current + (project.budget?.max || 0)
      }
    })

    // Monthly trend for last 6 months
    const monthlyData = new Map<string, { month: string; spent: number; committed: number }>()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
      monthlyData.set(monthKey, { month: monthKey, spent: 0, committed: 0 })
    }

    completedProjects.forEach(project => {
      if (project.completedAt) {
        const date = new Date(project.completedAt)
        const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
        const existing = monthlyData.get(monthKey)
        if (existing) {
          existing.spent += project.budget?.max || 0
        }
      }
    })

    inProgressProjects.forEach(project => {
      if (project.createdAt) {
        const date = new Date(project.createdAt)
        const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
        const existing = monthlyData.get(monthKey)
        if (existing) {
          existing.committed += project.budget?.max || 0
        }
      }
    })

    financialStats.monthlyTrend = Array.from(monthlyData.values())

    // ──────────────────────────────────────────────────────────────────────────
    // 4. TIMELINE STATISTICS
    // ──────────────────────────────────────────────────────────────────────────
    const timelineStats = {
      averageCompletionTime: 0,
      fastestProject: null as { title: string; days: number } | null,
      slowestProject: null as { title: string; days: number } | null,
      projectsByMonth: [] as Array<{ month: string; count: number }>,
      completionByMonth: [] as Array<{ month: string; count: number }>
    }

    // Calculate completion times for completed projects
    const completionTimes: number[] = []
    let fastestDays = Infinity
    let fastestTitle = ''
    let slowestDays = 0
    let slowestTitle = ''
    
    completedProjects.forEach(project => {
      if (project.createdAt && project.completedAt) {
        const created = new Date(project.createdAt)
        const completed = new Date(project.completedAt)
        const days = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
        completionTimes.push(days)
        
        if (days < fastestDays) {
          fastestDays = days
          fastestTitle = project.title
        }
        if (days > slowestDays) {
          slowestDays = days
          slowestTitle = project.title
        }
      }
    })

    timelineStats.averageCompletionTime = completionTimes.length > 0
      ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
      : 0
    timelineStats.fastestProject = fastestDays !== Infinity ? { title: fastestTitle, days: fastestDays } : null
    timelineStats.slowestProject = slowestDays > 0 ? { title: slowestTitle, days: slowestDays } : null

    // Projects by month (last 12 months)
    const projectsByMonth = new Map<string, { month: string; count: number; completed: number }>()
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
      projectsByMonth.set(monthKey, { month: monthKey, count: 0, completed: 0 })
    }

    projects.forEach(project => {
      const date = new Date(project.createdAt)
      const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
      const existing = projectsByMonth.get(monthKey)
      if (existing) {
        existing.count++
      }
    })

    completedProjects.forEach(project => {
      if (project.completedAt) {
        const date = new Date(project.completedAt)
        const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
        const existing = projectsByMonth.get(monthKey)
        if (existing) {
          existing.completed++
        }
      }
    })

    timelineStats.projectsByMonth = Array.from(projectsByMonth.values()).map(v => ({ month: v.month, count: v.count }))
    timelineStats.completionByMonth = Array.from(projectsByMonth.values()).map(v => ({ month: v.month, count: v.completed }))

    // ──────────────────────────────────────────────────────────────────────────
    // 5. FREELANCER STATISTICS
    // ──────────────────────────────────────────────────────────────────────────
    const acceptedApplicationsList = applications.filter(a => a.status === 'accepted')
    const freelancerIdsSet = new Set<string>()
    acceptedApplicationsList.forEach(a => freelancerIdsSet.add(a.freelancerId.toString()))
    const freelancerIdsArray = Array.from(freelancerIdsSet)
    
    let freelancersList: any[] = []
    if (freelancerIdsArray.length > 0) {
      freelancersList = await db.collection("users")
        .find({ _id: { $in: freelancerIdsArray.map(id => new ObjectId(id)) } })
        .project({ _id: 1, name: 1, avatar: 1, rating: 1, skills: 1, statistics: 1 })
        .toArray()
    }

    const freelancerStats = {
      totalHired: freelancerIdsArray.length,
      averageRating: 0,
      topFreelancers: [] as Array<{ _id: string; name: string; rating: number; projectsCount: number }>,
      mostHiredSkills: {} as Record<string, number>
    }

    // Calculate average rating
    let totalRatingSum = 0
    const freelancerProjectsCount = new Map<string, number>()
    
    freelancersList.forEach(f => {
      totalRatingSum += f.rating || 0
      
      // Count projects per freelancer
      const count = acceptedApplicationsList.filter(a => a.freelancerId.toString() === f._id.toString()).length
      freelancerProjectsCount.set(f._id.toString(), count)
      
      // Count skills
      (f.skills || []).forEach((skill: string) => {
        freelancerStats.mostHiredSkills[skill] = (freelancerStats.mostHiredSkills[skill] || 0) + 1
      })
    })

    freelancerStats.averageRating = freelancersList.length > 0 ? totalRatingSum / freelancersList.length : 0
    freelancerStats.topFreelancers = freelancersList
      .map(f => ({
        _id: f._id.toString(),
        name: f.name,
        rating: f.rating || 0,
        projectsCount: freelancerProjectsCount.get(f._id.toString()) || 0
      }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5)

    // ──────────────────────────────────────────────────────────────────────────
    // 6. TRENDS & INSIGHTS
    // ──────────────────────────────────────────────────────────────────────────
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())

    const recentProjectsList = projects.filter(p => new Date(p.createdAt) >= threeMonthsAgo)
    const previousProjectsList = projects.filter(p => new Date(p.createdAt) >= sixMonthsAgo && new Date(p.createdAt) < threeMonthsAgo)
    
    const recentApplicationsList = applications.filter(a => new Date(a.createdAt) >= threeMonthsAgo)
    const previousApplicationsList = applications.filter(a => new Date(a.createdAt) >= sixMonthsAgo && new Date(a.createdAt) < threeMonthsAgo)
    
    const recentSpending = completedProjects
      .filter(p => p.completedAt && new Date(p.completedAt) >= threeMonthsAgo)
      .reduce((sum, p) => sum + (p.budget?.max || 0), 0)
    const previousSpending = completedProjects
      .filter(p => p.completedAt && new Date(p.completedAt) >= sixMonthsAgo && new Date(p.completedAt) < threeMonthsAgo)
      .reduce((sum, p) => sum + (p.budget?.max || 0), 0)

    const trendsStats = {
      projectGrowth: 0,
      applicationGrowth: 0,
      spendingGrowth: 0,
      popularCategories: [] as Array<{ category: string; count: number; percentage: number }>,
      bestPerformingProjects: [] as Array<{ title: string; applications: number; acceptanceRate: number }>,
      recommendations: [] as string[]
    }

    trendsStats.projectGrowth = previousProjectsList.length > 0 
      ? Math.round(((recentProjectsList.length - previousProjectsList.length) / previousProjectsList.length) * 100)
      : recentProjectsList.length > 0 ? 100 : 0
    trendsStats.applicationGrowth = previousApplicationsList.length > 0
      ? Math.round(((recentApplicationsList.length - previousApplicationsList.length) / previousApplicationsList.length) * 100)
      : recentApplicationsList.length > 0 ? 100 : 0
    trendsStats.spendingGrowth = previousSpending > 0
      ? Math.round(((recentSpending - previousSpending) / previousSpending) * 100)
      : recentSpending > 0 ? 100 : 0

    // Popular categories
    const totalProjectsWithCategory = projects.filter(p => p.category).length
    trendsStats.popularCategories = Object.entries(projectStats.byCategory)
      .map(([category, count]) => ({
        category,
        count,
        percentage: totalProjectsWithCategory > 0 ? Math.round((count / totalProjectsWithCategory) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Best performing projects
    trendsStats.bestPerformingProjects = projects
      .map(p => {
        const projectApplications = applications.filter(a => a.projectId.toString() === p._id.toString())
        const acceptedCount = projectApplications.filter(a => a.status === 'accepted').length
        return {
          title: p.title,
          applications: p.applicationCount || 0,
          acceptanceRate: p.applicationCount > 0 ? (acceptedCount / p.applicationCount) * 100 : 0
        }
      })
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 5)

    // Generate recommendations
    const recommendations: string[] = []
    if (projectStats.byStatus.draft > 0) {
      recommendations.push(`Vous avez ${projectStats.byStatus.draft} projet(s) en brouillon. Publiez-les pour recevoir des candidatures.`)
    }
    if (projectStats.averageApplications < 3 && projectStats.byStatus.open > 0) {
      recommendations.push("Vos projets reçoivent peu de candidatures. Améliorez la description ou augmentez le budget.")
    }
    if (applicationStats.acceptanceRate < 30 && applicationStats.total > 5) {
      recommendations.push("Votre taux d'acceptation des candidatures est bas. Soyez plus sélectif ou clarifiez vos attentes.")
    }
    if (financialStats.totalSpent > 10000 && freelancerStats.totalHired > 0) {
      recommendations.push("Vous avez dépensé un montant significatif. Envisagez de fidéliser vos meilleurs freelances.")
    }
    if (trendsStats.projectGrowth > 50) {
      recommendations.push("Votre activité est en forte croissance ! Continuez sur cette lancée.")
    }
    trendsStats.recommendations = recommendations

    // ──────────────────────────────────────────────────────────────────────────
    // 7. SUMMARY SCORES
    // ──────────────────────────────────────────────────────────────────────────
    const activityScore = Math.min(100, Math.round((projectStats.total / 10) * 100))
    const engagementScore = Math.min(100, Math.round((applicationStats.averagePerProject / 5) * 100))
    const financialScore = Math.min(100, Math.round((financialStats.totalSpent / 10000) * 100))
    const satisfactionScore = Math.min(100, Math.round((freelancerStats.averageRating || 0) * 20))
    const overallScore = Math.round((activityScore + engagementScore + financialScore + satisfactionScore) / 4)

    const summary = {
      period,
      generatedAt: new Date().toISOString(),
      hasData: projects.length > 0,
      score: {
        activity: activityScore,
        engagement: engagementScore,
        financial: financialScore,
        satisfaction: satisfactionScore,
        overall: overallScore
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // FINAL RESPONSE
    // ──────────────────────────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      period,
      summary,
      projects: projectStats,
      applications: applicationStats,
      financial: financialStats,
      timeline: timelineStats,
      freelancers: freelancerStats,
      trends: trendsStats,
      raw: {
        projectsCount: projects.length,
        applicationsCount: applications.length,
        completedProjectsCount: completedProjects.length,
        totalSpent: financialStats.totalSpent
      }
    })

  } catch (error) {
    console.error("Error fetching client stats:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}