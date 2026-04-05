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

    // Fetch projects
    const projects = await db.collection("projects").find(baseFilter).toArray()
    
    // If no projects, return empty stats
    if (projects.length === 0) {
      return NextResponse.json({
        success: true,
        period,
        summary: {
          period,
          generatedAt: new Date().toISOString(),
          hasData: false,
          score: { activity: 0, engagement: 0, financial: 0, satisfaction: 0, overall: 0 }
        },
        projects: {
          total: 0,
          byStatus: { draft: 0, open: 0, inProgress: 0, completed: 0, cancelled: 0, paused: 0 },
          byVisibility: { public: 0, private: 0 },
          byCategory: {},
          totalBudget: { min: 0, max: 0, average: 0 },
          averageApplications: 0,
          completionRate: 0,
          successRate: 0
        },
        applications: {
          total: 0,
          byStatus: { pending: 0, accepted: 0, rejected: 0, withdrawn: 0 },
          averagePerProject: 0,
          acceptanceRate: 0,
          averageProposedBudget: 0,
          byProject: []
        },
        financial: {
          totalSpent: 0,
          totalCommitted: 0,
          totalBudget: 0,
          averageProjectCost: 0,
          currency: 'EUR',
          monthlyTrend: [],
          byCategory: {}
        },
        timeline: {
          averageCompletionTime: 0,
          fastestProject: null,
          slowestProject: null,
          projectsByMonth: [],
          completionByMonth: []
        },
        freelancers: {
          totalHired: 0,
          averageRating: 0,
          topFreelancers: [],
          mostHiredSkills: {}
        },
        trends: {
          projectGrowth: 0,
          applicationGrowth: 0,
          spendingGrowth: 0,
          popularCategories: [],
          bestPerformingProjects: [],
          recommendations: []
        }
      })
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 1. PROJECT STATISTICS
    // ──────────────────────────────────────────────────────────────────────────
    let draftCount = 0, openCount = 0, inProgressCount = 0, completedCount = 0, cancelledCount = 0, pausedCount = 0
    let publicCount = 0, privateCount = 0
    const categoryMap: Record<string, number> = {}
    let totalBudgetMin = 0, totalBudgetMax = 0
    let totalApplicationsSum = 0

    for (const project of projects) {
      // Status counts
      switch (project.status) {
        case 'draft': draftCount++; break
        case 'open': openCount++; break
        case 'in-progress': inProgressCount++; break
        case 'completed': completedCount++; break
        case 'cancelled': cancelledCount++; break
        case 'paused': pausedCount++; break
      }
      
      // Visibility counts
      if (project.visibility === 'public') publicCount++
      else if (project.visibility === 'private') privateCount++
      
      // Category counts
      if (project.category) {
        categoryMap[project.category] = (categoryMap[project.category] || 0) + 1
      }
      
      // Budget
      totalBudgetMin += project.budget?.min || 0
      totalBudgetMax += project.budget?.max || 0
      
      // Applications
      totalApplicationsSum += project.applicationCount || 0
    }

    const projectStats = {
      total: projects.length,
      byStatus: {
        draft: draftCount,
        open: openCount,
        inProgress: inProgressCount,
        completed: completedCount,
        cancelled: cancelledCount,
        paused: pausedCount
      },
      byVisibility: {
        public: publicCount,
        private: privateCount
      },
      byCategory: categoryMap,
      totalBudget: {
        min: totalBudgetMin,
        max: totalBudgetMax,
        average: projects.length > 0 ? Math.round(totalBudgetMax / projects.length) : 0
      },
      averageApplications: projects.length > 0 ? Math.round(totalApplicationsSum / projects.length) : 0,
      completionRate: projects.length > 0 ? Math.round((completedCount / projects.length) * 100) : 0,
      successRate: (completedCount + cancelledCount) > 0 ? Math.round((completedCount / (completedCount + cancelledCount)) * 100) : 0
    }

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

    let pendingApps = 0, acceptedApps = 0, rejectedApps = 0, withdrawnApps = 0
    let totalProposedBudget = 0
    
    for (const app of applications) {
      switch (app.status) {
        case 'pending': pendingApps++; break
        case 'accepted': acceptedApps++; break
        case 'rejected': rejectedApps++; break
        case 'withdrawn': withdrawnApps++; break
      }
      totalProposedBudget += app.proposedBudget || 0
    }

    // Applications by project
    const appsByProjectList: Array<{ projectId: string; projectTitle: string; count: number }> = []
    for (const project of projects) {
      const appCount = applications.filter(a => a.projectId.toString() === project._id.toString()).length
      if (appCount > 0) {
        appsByProjectList.push({
          projectId: project._id.toString(),
          projectTitle: project.title,
          count: appCount
        })
      }
    }
    appsByProjectList.sort((a, b) => b.count - a.count)

    const applicationStats = {
      total: applications.length,
      byStatus: {
        pending: pendingApps,
        accepted: acceptedApps,
        rejected: rejectedApps,
        withdrawn: withdrawnApps
      },
      averagePerProject: projects.length > 0 ? applications.length / projects.length : 0,
      acceptanceRate: applications.length > 0 ? Math.round((acceptedApps / applications.length) * 100) : 0,
      averageProposedBudget: applications.length > 0 ? Math.round(totalProposedBudget / applications.length) : 0,
      byProject: appsByProjectList.slice(0, 5)
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. FINANCIAL STATISTICS
    // ──────────────────────────────────────────────────────────────────────────
    const completedProjects = projects.filter(p => p.status === 'completed')
    const inProgressProjects = projects.filter(p => p.status === 'in-progress')
    
    let totalSpent = 0
    for (const p of completedProjects) {
      totalSpent += p.budget?.max || 0
    }
    
    let totalCommitted = 0
    for (const p of inProgressProjects) {
      totalCommitted += p.budget?.max || 0
    }
    
    // Spending by category
    const spendingByCategory: Record<string, number> = {}
    for (const p of completedProjects) {
      if (p.category) {
        spendingByCategory[p.category] = (spendingByCategory[p.category] || 0) + (p.budget?.max || 0)
      }
    }
    
    // Monthly trend (last 6 months)
    const monthlyTrendList: Array<{ month: string; spent: number; committed: number }> = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
      
      let monthSpent = 0
      let monthCommitted = 0
      
      for (const p of completedProjects) {
        if (p.completedAt) {
          const pDate = new Date(p.completedAt)
          const pMonthKey = pDate.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
          if (pMonthKey === monthKey) {
            monthSpent += p.budget?.max || 0
          }
        }
      }
      
      for (const p of inProgressProjects) {
        if (p.createdAt) {
          const pDate = new Date(p.createdAt)
          const pMonthKey = pDate.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
          if (pMonthKey === monthKey) {
            monthCommitted += p.budget?.max || 0
          }
        }
      }
      
      monthlyTrendList.push({ month: monthKey, spent: monthSpent, committed: monthCommitted })
    }

    const financialStats = {
      totalSpent,
      totalCommitted,
      totalBudget: projectStats.totalBudget.max,
      averageProjectCost: projects.length > 0 ? Math.round(projectStats.totalBudget.max / projects.length) : 0,
      currency: projects[0]?.budget?.currency || 'EUR',
      monthlyTrend: monthlyTrendList,
      byCategory: spendingByCategory
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. TIMELINE STATISTICS
    // ──────────────────────────────────────────────────────────────────────────
    const completionTimesList: number[] = []
    let fastestDays = Infinity, fastestTitle = ''
    let slowestDays = 0, slowestTitle = ''
    
    for (const p of completedProjects) {
      if (p.createdAt && p.completedAt) {
        const created = new Date(p.createdAt)
        const completed = new Date(p.completedAt)
        const days = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
        completionTimesList.push(days)
        
        if (days < fastestDays) {
          fastestDays = days
          fastestTitle = p.title
        }
        if (days > slowestDays) {
          slowestDays = days
          slowestTitle = p.title
        }
      }
    }
    
    let avgCompletionTime = 0
    if (completionTimesList.length > 0) {
      let sum = 0
      for (const t of completionTimesList) sum += t
      avgCompletionTime = Math.round(sum / completionTimesList.length)
    }
    
    // Projects by month (last 12 months)
    const projectsByMonthList: Array<{ month: string; count: number }> = []
    const completionByMonthList: Array<{ month: string; count: number }> = []
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
      
      let monthProjectCount = 0
      let monthCompletionCount = 0
      
      for (const p of projects) {
        const pDate = new Date(p.createdAt)
        const pMonthKey = pDate.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
        if (pMonthKey === monthKey) monthProjectCount++
      }
      
      for (const p of completedProjects) {
        if (p.completedAt) {
          const pDate = new Date(p.completedAt)
          const pMonthKey = pDate.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
          if (pMonthKey === monthKey) monthCompletionCount++
        }
      }
      
      projectsByMonthList.push({ month: monthKey, count: monthProjectCount })
      completionByMonthList.push({ month: monthKey, count: monthCompletionCount })
    }

    const timelineStats = {
      averageCompletionTime: avgCompletionTime,
      fastestProject: fastestDays !== Infinity ? { title: fastestTitle, days: fastestDays } : null,
      slowestProject: slowestDays > 0 ? { title: slowestTitle, days: slowestDays } : null,
      projectsByMonth: projectsByMonthList,
      completionByMonth: completionByMonthList
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5. FREELANCER STATISTICS
    // ──────────────────────────────────────────────────────────────────────────
    const acceptedApplications = applications.filter(a => a.status === 'accepted')
    const freelancerIdSet: Set<string> = new Set()
    for (const app of acceptedApplications) {
      freelancerIdSet.add(app.freelancerId.toString())
    }
    const freelancerIds = Array.from(freelancerIdSet)
    
    let freelancersList: any[] = []
    if (freelancerIds.length > 0) {
      freelancersList = await db.collection("users")
        .find({ _id: { $in: freelancerIds.map(id => new ObjectId(id)) } })
        .project({ _id: 1, name: 1, avatar: 1, rating: 1, skills: 1, statistics: 1 })
        .toArray()
    }
    
    let totalRating = 0
    const freelancerProjectsMap: Record<string, number> = {}
    const skillsMap: Record<string, number> = {}
    
    for (const f of freelancersList) {
      totalRating += f.rating || 0
      const count = acceptedApplications.filter(a => a.freelancerId.toString() === f._id.toString()).length
      freelancerProjectsMap[f._id.toString()] = count
      
      for (const skill of (f.skills || [])) {
        skillsMap[skill] = (skillsMap[skill] || 0) + 1
      }
    }
    
    const topFreelancersList = freelancersList.map(f => ({
      _id: f._id.toString(),
      name: f.name,
      rating: f.rating || 0,
      projectsCount: freelancerProjectsMap[f._id.toString()] || 0
    })).sort((a, b) => b.rating - a.rating).slice(0, 5)
    
    const freelancerStats = {
      totalHired: freelancerIds.length,
      averageRating: freelancersList.length > 0 ? totalRating / freelancersList.length : 0,
      topFreelancers: topFreelancersList,
      mostHiredSkills: skillsMap
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 6. TRENDS & INSIGHTS
    // ──────────────────────────────────────────────────────────────────────────
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
    
    let recentProjectsCount = 0, previousProjectsCount = 0
    let recentAppsCount = 0, previousAppsCount = 0
    let recentSpending = 0, previousSpending = 0
    
    for (const p of projects) {
      const pDate = new Date(p.createdAt)
      if (pDate >= threeMonthsAgo) recentProjectsCount++
      else if (pDate >= sixMonthsAgo && pDate < threeMonthsAgo) previousProjectsCount++
    }
    
    for (const a of applications) {
      const aDate = new Date(a.createdAt)
      if (aDate >= threeMonthsAgo) recentAppsCount++
      else if (aDate >= sixMonthsAgo && aDate < threeMonthsAgo) previousAppsCount++
    }
    
    for (const p of completedProjects) {
      if (p.completedAt) {
        const pDate = new Date(p.completedAt)
        if (pDate >= threeMonthsAgo) recentSpending += p.budget?.max || 0
        else if (pDate >= sixMonthsAgo && pDate < threeMonthsAgo) previousSpending += p.budget?.max || 0
      }
    }
    
    const projectGrowth = previousProjectsCount > 0 
      ? Math.round(((recentProjectsCount - previousProjectsCount) / previousProjectsCount) * 100)
      : recentProjectsCount > 0 ? 100 : 0
    const applicationGrowth = previousAppsCount > 0
      ? Math.round(((recentAppsCount - previousAppsCount) / previousAppsCount) * 100)
      : recentAppsCount > 0 ? 100 : 0
    const spendingGrowth = previousSpending > 0
      ? Math.round(((recentSpending - previousSpending) / previousSpending) * 100)
      : recentSpending > 0 ? 100 : 0
    
    // Popular categories
    const popularCategoriesList = Object.entries(categoryMap)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / projects.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    // Best performing projects
    const bestProjectsList = projects.map(p => {
      const projectApps = applications.filter(a => a.projectId.toString() === p._id.toString())
      const acceptedCount = projectApps.filter(a => a.status === 'accepted').length
      return {
        title: p.title,
        applications: p.applicationCount || 0,
        acceptanceRate: p.applicationCount > 0 ? (acceptedCount / p.applicationCount) * 100 : 0
      }
    }).sort((a, b) => b.applications - a.applications).slice(0, 5)
    
    // Recommendations
    const recommendationsList: string[] = []
    if (projectStats.byStatus.draft > 0) {
      recommendationsList.push(`Vous avez ${projectStats.byStatus.draft} projet(s) en brouillon. Publiez-les pour recevoir des candidatures.`)
    }
    if (projectStats.averageApplications < 3 && projectStats.byStatus.open > 0) {
      recommendationsList.push("Vos projets reçoivent peu de candidatures. Améliorez la description ou augmentez le budget.")
    }
    if (applicationStats.acceptanceRate < 30 && applicationStats.total > 5) {
      recommendationsList.push("Votre taux d'acceptation des candidatures est bas. Soyez plus sélectif ou clarifiez vos attentes.")
    }
    if (financialStats.totalSpent > 10000 && freelancerStats.totalHired > 0) {
      recommendationsList.push("Vous avez dépensé un montant significatif. Envisagez de fidéliser vos meilleurs freelances.")
    }
    if (projectGrowth > 50) {
      recommendationsList.push("Votre activité est en forte croissance ! Continuez sur cette lancée.")
    }
    
    const trendsStats = {
      projectGrowth,
      applicationGrowth,
      spendingGrowth,
      popularCategories: popularCategoriesList,
      bestPerformingProjects: bestProjectsList,
      recommendations: recommendationsList
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 7. SUMMARY SCORES
    // ──────────────────────────────────────────────────────────────────────────
    const activityScore = Math.min(100, Math.round((projects.length / 10) * 100))
    const engagementScore = Math.min(100, Math.round((applicationStats.averagePerProject / 5) * 100))
    const financialScore = Math.min(100, Math.round((financialStats.totalSpent / 10000) * 100))
    const satisfactionScore = Math.min(100, Math.round((freelancerStats.averageRating || 0) * 20))
    const overallScore = Math.round((activityScore + engagementScore + financialScore + satisfactionScore) / 4)

    const summary = {
      period,
      generatedAt: new Date().toISOString(),
      hasData: true,
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
      trends: trendsStats
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