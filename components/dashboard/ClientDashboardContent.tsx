// components/dashboard/ClientDashboardContent.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Plus, Users, TrendingUp, Clock, DollarSign,
  Briefcase, Target, Wallet, ArrowRight, Building,
  CheckCircle, XCircle, Calendar, Star,
  BarChart3, PieChart, Activity, Zap, Award,
  Download, RefreshCw, AlertCircle, Rocket, Shield,
  TrendingDown, Smile, Frown, Meh, Crown, Medal
} from "lucide-react"
import { AIMatchingWidget } from "@/components/ai/AIMatchingWidget"
import {
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

interface Project {
  _id: string
  title: string
  description: string
  status: string
  visibility: string
  budget: { min: number; max: number; type: string; currency: string }
  applicationCount: number
  createdAt: string
  updatedAt: string
  completedAt?: string
  category?: string
}

interface ClientDashboardContentProps {
  dict: any
  lang: string
}

interface ClientStatsData {
  success: boolean
  period: string
  summary: {
    period: string
    generatedAt: string
    hasData: boolean
    score: {
      activity: number
      engagement: number
      financial: number
      satisfaction: number
      overall: number
    }
  }
  projects: {
    total: number
    byStatus: {
      draft: number
      open: number
      inProgress: number
      completed: number
      cancelled: number
      paused: number
    }
    byVisibility: { public: number; private: number }
    byCategory: Record<string, number>
    totalBudget: { min: number; max: number; average: number }
    averageApplications: number
    completionRate: number
    successRate: number
  }
  applications: {
    total: number
    byStatus: { pending: number; accepted: number; rejected: number; withdrawn: number }
    averagePerProject: number
    acceptanceRate: number
    averageProposedBudget: number
    byProject: Array<{ projectId: string; projectTitle: string; count: number }>
  }
  financial: {
    totalSpent: number
    totalCommitted: number
    totalBudget: number
    averageProjectCost: number
    currency: string
    monthlyTrend: Array<{ month: string; spent: number; committed: number }>
    byCategory: Record<string, number>
  }
  timeline: {
    averageCompletionTime: number
    fastestProject: { title: string; days: number } | null
    slowestProject: { title: string; days: number } | null
    projectsByMonth: Array<{ month: string; count: number }>
    completionByMonth: Array<{ month: string; count: number }>
  }
  freelancers: {
    totalHired: number
    averageRating: number
    topFreelancers: Array<{ _id: string; name: string; rating: number; projectsCount: number }>
    mostHiredSkills: Record<string, number>
  }
  trends: {
    projectGrowth: number
    applicationGrowth: number
    spendingGrowth: number
    popularCategories: Array<{ category: string; count: number; percentage: number }>
    bestPerformingProjects: Array<{ title: string; applications: number; acceptanceRate: number }>
    recommendations: string[]
  }
}

export function ClientDashboardContent({ dict, lang }: ClientDashboardContentProps) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<ClientStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeChart, setActiveChart] = useState<'projects' | 'applications' | 'spent'>('projects')
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year' | 'all'>('year')

  const t = dict?.dashboard?.client || {}
  const commonT = dict?.common || {}

  useEffect(() => {
    fetchClientData()
  }, [period])

  const fetchClientData = async () => {
    try {
      setLoading(true)
      
      // Fetch projects
      const projectsRes = await fetch('/api/projects/client?limit=5')
      let projectsData = { projects: [] }
      if (projectsRes.ok) {
        projectsData = await projectsRes.json()
        setProjects(projectsData.projects || [])
      }

      // Fetch comprehensive stats from new API
      const statsRes = await fetch(`/api/client/stats?period=${period}`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

    } catch (error) {
      console.error('Error fetching client data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchClientData()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 20) return <Rocket className="h-4 w-4 text-green-500" />
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Activity className="h-4 w-4 text-yellow-500" />
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 20) return 'text-green-600 dark:text-green-400'
    if (growth > 0) return 'text-green-500 dark:text-green-500'
    if (growth < 0) return 'text-red-500 dark:text-red-400'
    return 'text-yellow-500 dark:text-yellow-400'
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-blue-600 dark:text-blue-400'
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Crown className="h-5 w-5" />
    if (score >= 60) return <Medal className="h-5 w-5" />
    if (score >= 40) return <Smile className="h-5 w-5" />
    return <Frown className="h-5 w-5" />
  }

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6b7280', '#06b6d4', '#ec4899']

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
          <div className="space-y-6">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  const summaryScore = stats?.summary?.score || { activity: 0, engagement: 0, financial: 0, satisfaction: 0, overall: 0 }
  const projectStats = stats?.projects || { total: 0, byStatus: { draft: 0, open: 0, inProgress: 0, completed: 0, cancelled: 0, paused: 0 }, byVisibility: { public: 0, private: 0 }, byCategory: {}, totalBudget: { min: 0, max: 0, average: 0 }, averageApplications: 0, completionRate: 0, successRate: 0 }
  const applicationStats = stats?.applications || { total: 0, byStatus: { pending: 0, accepted: 0, rejected: 0, withdrawn: 0 }, averagePerProject: 0, acceptanceRate: 0, averageProposedBudget: 0, byProject: [] }
  const financialStats = stats?.financial || { totalSpent: 0, totalCommitted: 0, totalBudget: 0, averageProjectCost: 0, currency: 'EUR', monthlyTrend: [], byCategory: {} }
  const timelineStats = stats?.timeline || { averageCompletionTime: 0, fastestProject: null, slowestProject: null, projectsByMonth: [], completionByMonth: [] }
  const freelancerStats = stats?.freelancers || { totalHired: 0, averageRating: 0, topFreelancers: [], mostHiredSkills: {} }
  const trendsStats = stats?.trends || { projectGrowth: 0, applicationGrowth: 0, spendingGrowth: 0, popularCategories: [], bestPerformingProjects: [], recommendations: [] }

  const activeProjects = (projectStats.byStatus.open || 0) + (projectStats.byStatus.inProgress || 0)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 dark:from-blue-300 dark:to-purple-300 bg-clip-text text-transparent">
              {t.title || 'Tableau de Bord Client'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              {t.subtitle || 'Gérez vos projets et trouvez des talents'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-1">
              <button
                onClick={() => setPeriod('month')}
                className={`px-3 py-1.5 text-xs rounded-md transition-all ${period === 'month' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {t.month || 'Mois'}
              </button>
              <button
                onClick={() => setPeriod('quarter')}
                className={`px-3 py-1.5 text-xs rounded-md transition-all ${period === 'quarter' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {t.quarter || 'Trimestre'}
              </button>
              <button
                onClick={() => setPeriod('year')}
                className={`px-3 py-1.5 text-xs rounded-md transition-all ${period === 'year' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {t.year || 'Année'}
              </button>
              <button
                onClick={() => setPeriod('all')}
                className={`px-3 py-1.5 text-xs rounded-md transition-all ${period === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {t.all || 'Tout'}
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-slate-300 dark:border-slate-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {commonT.refresh || 'Actualiser'}
            </Button>
            <Link href={`/${lang}/projects/create`}>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25">
                <Plus className="mr-2 h-4 w-4" />
                {t.newProject || 'Nouveau Projet'}
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Score Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: t.activityScore || 'Activité', value: summaryScore.activity, color: 'blue' },
            { label: t.engagementScore || 'Engagement', value: summaryScore.engagement, color: 'purple' },
            { label: t.financialScore || 'Finances', value: summaryScore.financial, color: 'green' },
            { label: t.satisfactionScore || 'Satisfaction', value: summaryScore.satisfaction, color: 'amber' },
            { label: t.globalScore || 'Global', value: summaryScore.overall, color: 'pink' }
          ].map((score, index) => (
            <motion.div
              key={score.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-slate-200 dark:border-slate-800 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/80">
                <CardContent className="p-4 text-center">
                  <div className={`flex items-center justify-center gap-1 mb-2 ${getScoreColor(score.value)}`}>
                    {getScoreIcon(score.value)}
                    <span className="text-xs font-medium">{score.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{score.value}%</div>
                  <Progress value={score.value} className="h-1.5 mt-2" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">{t.activeProjects || 'Projets Actifs'}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-200 mt-1">{activeProjects}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-600 dark:text-blue-400">{t.completed || 'Terminés'}: {projectStats.byStatus.completed}</span>
                    <span className="text-blue-600 dark:text-blue-400">{t.draft || 'Brouillons'}: {projectStats.byStatus.draft}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-slate-900">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">{t.applications || 'Candidatures'}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-200 mt-1">{applicationStats.total}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-green-100 dark:border-green-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600 dark:text-green-400">{t.accepted || 'Acceptées'}: {applicationStats.byStatus.accepted}</span>
                    <span className="text-green-600 dark:text-green-400">{t.pending || 'En attente'}: {applicationStats.byStatus.pending}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-slate-900">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">{t.totalSpent || 'Total Dépensé'}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-200 mt-1">
                      {financialStats.totalSpent.toLocaleString()} {financialStats.currency}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-purple-100 dark:border-purple-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-600 dark:text-purple-400">{t.averageBudget || 'Budget moyen'}: {financialStats.averageProjectCost.toLocaleString()} {financialStats.currency}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">{t.successRate || 'Taux de Succès'}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-amber-900 dark:text-amber-200 mt-1">{projectStats.successRate}%</p>
                  </div>
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                    <Award className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-amber-100 dark:border-amber-800">
                  <Progress value={projectStats.successRate} className="h-1.5 bg-amber-200 dark:bg-amber-800" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Growth Indicators */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.projectGrowth || 'Croissance Projets'}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getGrowthIcon(trendsStats.projectGrowth)}
                    <span className={`text-lg font-bold ${getGrowthColor(trendsStats.projectGrowth)}`}>
                      {trendsStats.projectGrowth > 0 ? '+' : ''}{trendsStats.projectGrowth}%
                    </span>
                  </div>
                </div>
                <Briefcase className="h-8 w-8 text-slate-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.applicationGrowth || 'Croissance Candidatures'}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getGrowthIcon(trendsStats.applicationGrowth)}
                    <span className={`text-lg font-bold ${getGrowthColor(trendsStats.applicationGrowth)}`}>
                      {trendsStats.applicationGrowth > 0 ? '+' : ''}{trendsStats.applicationGrowth}%
                    </span>
                  </div>
                </div>
                <Users className="h-8 w-8 text-slate-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.spendingGrowth || 'Croissance Dépenses'}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getGrowthIcon(trendsStats.spendingGrowth)}
                    <span className={`text-lg font-bold ${getGrowthColor(trendsStats.spendingGrowth)}`}>
                      {trendsStats.spendingGrowth > 0 ? '+' : ''}{trendsStats.spendingGrowth}%
                    </span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-slate-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Evolution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    {t.evolution || 'Évolution'}
                  </CardTitle>
                  <Tabs value={activeChart} onValueChange={(v) => setActiveChart(v as any)} className="w-full sm:w-auto">
                    <TabsList className="bg-slate-100 dark:bg-slate-800">
                      <TabsTrigger value="projects" className="text-xs sm:text-sm">{t.projects || 'Projets'}</TabsTrigger>
                      <TabsTrigger value="applications" className="text-xs sm:text-sm">{t.applications || 'Candidatures'}</TabsTrigger>
                      <TabsTrigger value="spent" className="text-xs sm:text-sm">{t.spent || 'Dépenses'}</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <CardDescription>{t.evolutionDesc || 'Évolution mensuelle de votre activité'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {activeChart === 'projects' && (
                      <AreaChart data={timelineStats.projectsByMonth}>
                        <defs><linearGradient id="projectsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                        <Legend />
                        <Area type="monotone" dataKey="count" name={t.projects || 'Projets'} stroke="#3b82f6" fill="url(#projectsGradient)" strokeWidth={2} />
                      </AreaChart>
                    )}
                    {activeChart === 'applications' && (
                      <BarChart data={stats?.financial?.monthlyTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                        <Legend />
                        <Bar dataKey="applications" name={t.applications || 'Candidatures'} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                    {activeChart === 'spent' && (
                      <AreaChart data={financialStats.monthlyTrend}>
                        <defs><linearGradient id="spentGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip formatter={(value: number) => [`${value.toLocaleString()}€`, t.spent || 'Dépenses']} contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                        <Legend />
                        <Area type="monotone" dataKey="spent" name={t.spent || 'Dépenses'} stroke="#10b981" fill="url(#spentGradient)" strokeWidth={2} />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Popular Categories */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <PieChart className="h-5 w-5 text-purple-500" />
                  {t.popularCategories || 'Catégories Populaires'}
                </CardTitle>
                <CardDescription>{t.categoriesDesc || 'Répartition par catégorie'}</CardDescription>
              </CardHeader>
              <CardContent>
                {trendsStats.popularCategories.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie data={trendsStats.popularCategories} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="count" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {trendsStats.popularCategories.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value} projet(s)`, '']} contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (<div className="text-center py-12"><PieChart className="h-12 w-12 text-slate-400 mx-auto mb-3" /><p className="text-slate-500 dark:text-slate-400">{t.noData || 'Aucune donnée disponible'}</p></div>)}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {trendsStats.popularCategories.slice(0, 4).map((item, index) => (
                    <div key={index} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} /><span className="text-xs text-slate-600 dark:text-slate-400">{item.category}: {item.count}</span></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Top Freelancers */}
        {freelancerStats.topFreelancers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white"><Star className="h-5 w-5 text-yellow-500" />{t.topFreelancers || 'Meilleurs Freelances'}</CardTitle>
                <CardDescription>{t.topFreelancersDesc || 'Freelances les plus performants'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {freelancerStats.topFreelancers.map((freelancer, index) => (
                    <div key={freelancer._id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white font-bold">{index + 1}</div>
                      <div className="flex-1"><p className="font-medium text-slate-900 dark:text-white">{freelancer.name}</p><div className="flex items-center gap-2 text-sm text-slate-500"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /><span>{freelancer.rating.toFixed(1)}</span><span>•</span><span>{freelancer.projectsCount} {t.projects || 'projets'}</span></div></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* AI Matching Widget */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mb-8">
          <AIMatchingWidget type="client" quickAction={true} maxResults={3} dict={dict} lang={lang} />
        </motion.div>

        {/* Recommendations */}
        {trendsStats.recommendations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-8">
            <Card className="border-amber-200 dark:border-amber-800 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
              <CardHeader><CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300"><AlertCircle className="h-5 w-5" />{t.recommendations || 'Recommandations'}</CardTitle></CardHeader>
              <CardContent><ul className="space-y-2">{trendsStats.recommendations.map((rec, index) => (<li key={index} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-400"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" /><span>{rec}</span></li>))}</ul></CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Projects */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white"><Building className="h-5 w-5 text-blue-500" />{t.recentProjects || 'Mes Projets Récents'}</CardTitle><CardDescription className="mt-1">{t.recentProjectsDesc || 'Derniers projets créés et leur statut'}</CardDescription></div>
                <Link href={`/${lang}/dashboard/client/projects`}><Button variant="outline" size="sm" className="group">{t.viewAll || 'Voir tous'}<ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></Button></Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {projects.length === 0 ? (
                <div className="text-center py-12 px-4"><div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4"><Building className="h-10 w-10 text-slate-400" /></div><h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t.noProjects || 'Aucun projet créé'}</h3><p className="text-slate-600 dark:text-slate-400 mb-6">{t.noProjectsDesc || 'Commencez par créer votre premier projet'}</p><Link href={`/${lang}/projects/create`}><Button><Plus className="mr-2 h-4 w-4" />{t.createFirst || 'Créer votre premier projet'}</Button></Link></div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {projects.map((project, index) => (
                    <motion.div key={project._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2"><h3 className="font-semibold text-slate-900 dark:text-white">{project.title}</h3>
                            <Badge className={project.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : project.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : project.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : project.status === 'draft' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}>
                              {project.status === 'open' ? (t.open || 'Ouvert') : project.status === 'in-progress' ? (t.inProgress || 'En cours') : project.status === 'completed' ? (t.completed || 'Terminé') : project.status === 'draft' ? (t.draft || 'Brouillon') : (t.cancelled || 'Annulé')}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{project.budget.min.toLocaleString()} - {project.budget.max.toLocaleString()} {project.budget.currency}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{project.applicationCount} {t.applications || 'candidatures'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(project.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/${lang}/projects/${project._id}`}><Button size="sm" className="bg-blue-600 hover:bg-blue-700">{t.manage || 'Gérer'}</Button></Link>
                          {project.applicationCount > 0 && (<Link href={`/${lang}/projects/${project._id}/applications`}><Button size="sm" variant="outline"><Users className="h-4 w-4 mr-1" />{project.applicationCount}</Button></Link>)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}