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
    const period = searchParams.get('period') || 'year' // month, quarter, year, all
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
    const dateFilter: any = {}
    const now = new Date()
    
    if (period === 'month') {
      dateFilter.$gte = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    } else if (period === 'quarter') {
      dateFilter.$gte = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    } else if (period === 'year') {
      dateFilter.$gte = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    }
    
    if (dateFilter.$gte) {
      baseFilter.createdAt = dateFilter
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

    projectStats.totalBudget.average = projectStats.total > 0 
      ? Math.round(projectStats.totalBudget.max / projectStats.total) 
      : 0
    projectStats.averageApplications = projectStats.total > 0 
      ? Math.round(projects.reduce((sum, p) => sum + (p.applicationCount || 0), 0) / projectStats.total) 
      : 0
    projectStats.completionRate = projectStats.total > 0 
      ? Math.round((projectStats.byStatus.completed / projectStats.total) * 100) 
      : 0
    projectStats.successRate = (projectStats.byStatus.completed + projectStats.byStatus.inProgress) > 0
      ? Math.round((projectStats.byStatus.completed / (projectStats.byStatus.completed + projectStats.byStatus.cancelled)) * 100)
      : 0

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

    const applicationStats = {
      total: applications.length,
      byStatus: {
        pending: applications.filter(a => a.status === 'pending').length,
        accepted: applications.filter(a => a.status === 'accepted').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        withdrawn: applications.filter(a => a.status === 'withdrawn').length
      },
      averagePerProject: projectStats.total > 0 ? applications.length / projectStats.total : 0,
      acceptanceRate: 0,
      averageProposedBudget: 0,
      byProject: [] as Array<{ projectId: string; projectTitle: string; count: number }>
    }

    applicationStats.acceptanceRate = applications.length > 0
      ? Math.round((applicationStats.byStatus.accepted / applications.length) * 100)
      : 0
    applicationStats.averageProposedBudget = applications.length > 0
      ? Math.round(applications.reduce((sum, a) => sum + (a.proposedBudget || 0), 0) / applications.length)
      : 0

    // Applications by project
    const appsByProject = new Map()
    applications.forEach(app => {
      const project = projects.find(p => p._id.toString() === app.projectId.toString())
      if (project) {
        const key = project._id.toString()
        appsByProject.set(key, {
          projectId: project._id.toString(),
          projectTitle: project.title,
          count: (appsByProject.get(key)?.count || 0) + 1
        })
      }
    })
    applicationStats.byProject = Array.from(appsByProject.values()).sort((a, b) => b.count - a.count)

    // ──────────────────────────────────────────────────────────────────────────
    // 3. FINANCIAL STATISTICS
    // ──────────────────────────────────────────────────────────────────────────
    const completedProjects = projects.filter(p => p.status === 'completed')
    const inProgressProjects = projects.filter(p => p.status === 'in-progress')
    
    const financialStats = {
      totalSpent: completedProjects.reduce((sum, p) => sum + (p.budget?.max || 0), 0),
      totalCommitted: inProgressProjects.reduce((sum, p) => sum + (p.budget?.max || 0), 0),
      totalBudget: projectStats.totalBudget.max,
      averageProjectCost: projectStats.total > 0 ? Math.round(projectStats.totalBudget.max / projectStats.total) : 0,
      currency: projects[0]?.budget?.currency || 'EUR',
      monthlyTrend: [] as Array<{ month: string; spent: number; committed: number }>,
      byCategory: {} as Record<string, number>
    }

    // Calculate spending by category
    completedProjects.forEach(project => {
      if (project.category) {
        financialStats.byCategory[project.category] = (financialStats.byCategory[project.category] || 0) + (project.budget?.max || 0)
      }
    })

    // Monthly trend for last 6 months
    const monthlyData = new Map()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
      monthlyData.set(monthKey, { month: monthKey, spent: 0, committed: 0 })
    }

    completedProjects.forEach(project => {
      if (project.completedAt) {
        const date = new Date(project.completedAt)
        const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
        if (monthlyData.has(monthKey)) {
          monthlyData.get(monthKey).spent += project.budget?.max || 0
        }
      }
    })

    inProgressProjects.forEach(project => {
      if (project.createdAt) {
        const date = new Date(project.createdAt)
        const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
        if (monthlyData.has(monthKey)) {
          monthlyData.get(monthKey).committed += project.budget?.max || 0
        }
      }
    })

    financialStats.monthlyTrend = Array.from(monthlyData.values())

    // ──────────────────────────────────────────────────────────────────────────
    // 4. TIMELINE STATISTICS
    // ──────────────────────────────────────────────────────────────────────────
    const timelineStats = {
      averageCompletionTime: 0,
      fastestProject: null as any,
      slowestProject: null as any,
      projectsByMonth: [] as Array<{ month: string; count: number }>,
      completionByMonth: [] as Array<{ month: string; count: number }>
    }

    // Calculate completion times for completed projects
    const completionTimes: number[] = []
    completedProjects.forEach(project => {
      if (project.createdAt && project.completedAt) {
        const created = new Date(project.createdAt)
        const completed = new Date(project.completedAt)
        const days = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
        completionTimes.push(days)
        
        if (!timelineStats.fastestProject || days < timelineStats.fastestProject.days) {
          timelineStats.fastestProject = { title: project.title, days }
        }
        if (!timelineStats.slowestProject || days > timelineStats.slowestProject.days) {
          timelineStats.slowestProject = { title: project.title, days }
        }
      }
    })

    timelineStats.averageCompletionTime = completionTimes.length > 0
      ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
      : 0

    // Projects by month (last 12 months)
    const projectsByMonth = new Map()
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
      projectsByMonth.set(monthKey, { month: monthKey, count: 0, completed: 0 })
    }

    projects.forEach(project => {
      const date = new Date(project.createdAt)
      const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
      if (projectsByMonth.has(monthKey)) {
        projectsByMonth.get(monthKey).count++
      }
    })

    completedProjects.forEach(project => {
      if (project.completedAt) {
        const date = new Date(project.completedAt)
        const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
        if (projectsByMonth.has(monthKey)) {
          projectsByMonth.get(monthKey).completed = (projectsByMonth.get(monthKey).completed || 0) + 1
        }
      }
    })

    timelineStats.projectsByMonth = Array.from(projectsByMonth.values()).map(v => ({ month: v.month, count: v.count }))
    timelineStats.completionByMonth = Array.from(projectsByMonth.values()).map(v => ({ month: v.month, count: v.completed }))

    // ──────────────────────────────────────────────────────────────────────────
    // 5. FREELANCER STATISTICS
    // ──────────────────────────────────────────────────────────────────────────
    const acceptedApplications = applications.filter(a => a.status === 'accepted')
    const freelancerIds = [...new Set(acceptedApplications.map(a => a.freelancerId.toString()))]
    
    let freelancers: any[] = []
    if (freelancerIds.length > 0) {
      freelancers = await db.collection("users")
        .find({ _id: { $in: freelancerIds.map(id => new ObjectId(id)) } })
        .project({ _id: 1, name: 1, avatar: 1, rating: 1, skills: 1, statistics: 1 })
        .toArray()
    }

    const freelancerStats = {
      totalHired: freelancerIds.length,
      averageRating: 0,
      topFreelancers: [] as Array<{ _id: string; name: string; rating: number; projectsCount: number }>,
      mostHiredSkills: {} as Record<string, number>
    }

    // Calculate average rating
    let totalRating = 0
    const freelancerProjectsCount = new Map()
    
    freelancers.forEach(f => {
      totalRating += f.rating || 0
      
      // Count projects per freelancer
      const count = acceptedApplications.filter(a => a.freelancerId.toString() === f._id.toString()).length
      freelancerProjectsCount.set(f._id.toString(), count)
      
      // Count skills
      (f.skills || []).forEach((skill: string) => {
        freelancerStats.mostHiredSkills[skill] = (freelancerStats.mostHiredSkills[skill] || 0) + 1
      })
    })

    freelancerStats.averageRating = freelancers.length > 0 ? totalRating / freelancers.length : 0
    freelancerStats.topFreelancers = freelancers
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
    const trendsStats = {
      projectGrowth: 0,
      applicationGrowth: 0,
      spendingGrowth: 0,
      popularCategories: [] as Array<{ category: string; count: number; percentage: number }>,
      bestPerformingProjects: [] as Array<{ title: string; applications: number; acceptanceRate: number }>,
      recommendations: [] as string[]
    }

    // Calculate growth rates (compare last 3 months with previous 3 months)
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())

    const recentProjects = projects.filter(p => new Date(p.createdAt) >= threeMonthsAgo)
    const previousProjects = projects.filter(p => new Date(p.createdAt) >= sixMonthsAgo && new Date(p.createdAt) < threeMonthsAgo)
    
    const recentApplications = applications.filter(a => new Date(a.createdAt) >= threeMonthsAgo)
    const previousApplications = applications.filter(a => new Date(a.createdAt) >= sixMonthsAgo && new Date(a.createdAt) < threeMonthsAgo)
    
    const recentSpending = completedProjects
      .filter(p => p.completedAt && new Date(p.completedAt) >= threeMonthsAgo)
      .reduce((sum, p) => sum + (p.budget?.max || 0), 0)
    const previousSpending = completedProjects
      .filter(p => p.completedAt && new Date(p.completedAt) >= sixMonthsAgo && new Date(p.completedAt) < threeMonthsAgo)
      .reduce((sum, p) => sum + (p.budget?.max || 0), 0)

    trendsStats.projectGrowth = previousProjects.length > 0 
      ? Math.round(((recentProjects.length - previousProjects.length) / previousProjects.length) * 100)
      : recentProjects.length > 0 ? 100 : 0
    trendsStats.applicationGrowth = previousApplications.length > 0
      ? Math.round(((recentApplications.length - previousApplications.length) / previousApplications.length) * 100)
      : recentApplications.length > 0 ? 100 : 0
    trendsStats.spendingGrowth = previousSpending > 0
      ? Math.round(((recentSpending - previousSpending) / previousSpending) * 100)
      : recentSpending > 0 ? 100 : 0

    // Popular categories
    const totalProjectsWithCategory = projects.filter(p => p.category).length
    trendsStats.popularCategories = Object.entries(projectStats.byCategory)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / totalProjectsWithCategory) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Best performing projects
    trendsStats.bestPerformingProjects = projects
      .map(p => ({
        title: p.title,
        applications: p.applicationCount || 0,
        acceptanceRate: applications.filter(a => a.projectId.toString() === p._id.toString() && a.status === 'accepted').length / (p.applicationCount || 1) * 100
      }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 5)

    // Generate recommendations
    if (projectStats.byStatus.draft > 0) {
      trendsStats.recommendations.push(`Vous avez ${projectStats.byStatus.draft} projet(s) en brouillon. Publiez-les pour recevoir des candidatures.`)
    }
    if (projectStats.averageApplications < 3 && projectStats.byStatus.open > 0) {
      trendsStats.recommendations.push("Vos projets reçoivent peu de candidatures. Améliorez la description ou augmentez le budget.")
    }
    if (applicationStats.acceptanceRate < 30 && applicationStats.total > 5) {
      trendsStats.recommendations.push("Votre taux d'acceptation des candidatures est bas. Soyez plus sélectif ou clarifiez vos attentes.")
    }
    if (financialStats.totalSpent > 10000 && freelancerStats.totalHired > 0) {
      trendsStats.recommendations.push("Vous avez dépensé un montant significatif. Envisagez de fidéliser vos meilleurs freelances.")
    }
    if (trendsStats.projectGrowth > 50) {
      trendsStats.recommendations.push("Votre activité est en forte croissance ! Continuez sur cette lancée.")
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 7. SUMMARY
    // ──────────────────────────────────────────────────────────────────────────
    const summary = {
      period,
      generatedAt: new Date().toISOString(),
      hasData: projects.length > 0,
      score: {
        activity: Math.min(100, Math.round((projectStats.total / 10) * 100)),
        engagement: Math.min(100, Math.round((applicationStats.averagePerProject / 5) * 100)),
        financial: Math.min(100, Math.round((financialStats.totalSpent / 10000) * 100)),
        satisfaction: Math.min(100, freelancerStats.averageRating * 20),
        overall: 0
      }
    }
    
    summary.score.overall = Math.round(
      (summary.score.activity + summary.score.engagement + summary.score.financial + summary.score.satisfaction) / 4
    )

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