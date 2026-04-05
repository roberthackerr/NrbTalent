// components/dashboard/ClientDashboardContent.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Plus, Users, TrendingUp, Eye, EyeOff, Clock, DollarSign,
  Briefcase, Target, Wallet, ArrowRight, Sparkles, Building,
  CheckCircle, XCircle, Clock as ClockIcon, Calendar, Star,
  BarChart3, PieChart, LineChart, Activity, Zap, Award,
  TrendingDown, AlertCircle, Download, RefreshCw
} from "lucide-react"
import { AIMatchingWidget } from "@/components/ai/AIMatchingWidget"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

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
}

interface Application {
  _id: string
  freelancerId: string
  proposedBudget: number
  status: string
  createdAt: string
  freelancer?: {
    name: string
    avatar?: string
    rating?: number
  }
}

interface ClientStats {
  totalProjects: number
  activeProjects: number
  totalApplications: number
  pendingApplications: number
  totalSpent: number
  completedProjects: number
  cancelledProjects: number
  draftProjects: number
  averageBudget: number
  averageApplicationsPerProject: number
  successRate: number
  monthlyData: Array<{ month: string; projects: number; applications: number; spent: number }>
  statusDistribution: Array<{ name: string; value: number; color: string }>
  recentApplications: Application[]
}

interface ClientDashboardContentProps {
  dict: any
  lang: string
}

export function ClientDashboardContent({ dict, lang }: ClientDashboardContentProps) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<ClientStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalApplications: 0,
    pendingApplications: 0,
    totalSpent: 0,
    completedProjects: 0,
    cancelledProjects: 0,
    draftProjects: 0,
    averageBudget: 0,
    averageApplicationsPerProject: 0,
    successRate: 0,
    monthlyData: [],
    statusDistribution: [],
    recentApplications: []
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeChart, setActiveChart] = useState<'projects' | 'applications' | 'spent'>('projects')

  useEffect(() => {
    fetchClientData()
  }, [])

  const fetchClientData = async () => {
    try {
      setLoading(true)
      const [projectsRes, statsRes, applicationsRes] = await Promise.all([
        fetch('/api/projects/client?limit=5'),
        fetch('/api/stats/client'),
        fetch('/api/projects/client/applications/recent')
      ])

      let projectsData = { projects: [] }
      if (projectsRes.ok) {
        projectsData = await projectsRes.json()
        setProjects(projectsData.projects || [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        
        // Calculer les données mensuelles à partir des projets
        const monthlyMap = new Map()
        const now = new Date()
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const monthKey = date.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', year: 'numeric' })
          monthlyMap.set(monthKey, { month: monthKey, projects: 0, applications: 0, spent: 0 })
        }

        projectsData.projects?.forEach((project: any) => {
          const projectDate = new Date(project.createdAt)
          const monthKey = projectDate.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', year: 'numeric' })
          if (monthlyMap.has(monthKey)) {
            const data = monthlyMap.get(monthKey)
            data.projects++
            data.applications += project.applicationCount || 0
            data.spent += (project.status === 'completed' ? project.budget?.max || 0 : 0)
          }
        })

        const monthlyData = Array.from(monthlyMap.values())

        // Distribution des statuts
        const statusCount = {
          open: 0,
          'in-progress': 0,
          completed: 0,
          draft: 0,
          cancelled: 0
        }
        projectsData.projects?.forEach((project: any) => {
          if (statusCount[project.status as keyof typeof statusCount] !== undefined) {
            statusCount[project.status as keyof typeof statusCount]++
          }
        })

        const statusDistribution = [
          { name: t.open || 'Ouverts', value: statusCount.open, color: '#3b82f6' },
          { name: t.inProgress || 'En cours', value: statusCount['in-progress'], color: '#8b5cf6' },
          { name: t.completed || 'Terminés', value: statusCount.completed, color: '#10b981' },
          { name: t.draft || 'Brouillons', value: statusCount.draft, color: '#6b7280' },
          { name: t.cancelled || 'Annulés', value: statusCount.cancelled, color: '#ef4444' }
        ].filter(s => s.value > 0)

        setStats({
          ...statsData,
          monthlyData,
          statusDistribution,
          averageBudget: statsData.totalProjects > 0 ? Math.round(statsData.totalSpent / statsData.totalProjects) : 0,
          averageApplicationsPerProject: statsData.totalProjects > 0 ? Math.round(statsData.totalApplications / statsData.totalProjects) : 0,
          successRate: statsData.completedProjects > 0 ? Math.round((statsData.completedProjects / (statsData.completedProjects + statsData.cancelledProjects)) * 100) : 0
        })
      }

      if (applicationsRes.ok) {
        const applicationsData = await applicationsRes.json()
        setStats(prev => ({ ...prev, recentApplications: applicationsData.applications || [] }))
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

  const t = dict?.dashboard?.client || {}
  const commonT = dict?.common || {}

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6b7280']

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
          <div className="flex gap-2">
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
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                {t.newProject || 'Nouveau Projet'}
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">{t.activeProjects || 'Projets Actifs'}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-200 mt-1">{stats.activeProjects}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-600 dark:text-blue-400">{t.completed || 'Terminés'}: {stats.completedProjects}</span>
                    <span className="text-blue-600 dark:text-blue-400">{t.draft || 'Brouillons'}: {stats.draftProjects}</span>
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
                    <p className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-200 mt-1">{stats.totalApplications}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-green-100 dark:border-green-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600 dark:text-green-400">{t.pending || 'En attente'}: {stats.pendingApplications}</span>
                    <span className="text-green-600 dark:text-green-400">Moy: {stats.averageApplicationsPerProject}/projet</span>
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
                      {stats.totalSpent.toLocaleString()}€
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-purple-100 dark:border-purple-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-600 dark:text-purple-400">{t.averageBudget || 'Budget moyen'}: {stats.averageBudget.toLocaleString()}€</span>
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
                    <p className="text-2xl sm:text-3xl font-bold text-amber-900 dark:text-amber-200 mt-1">{stats.successRate}%</p>
                  </div>
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                    <Award className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-amber-100 dark:border-amber-800">
                  <Progress value={stats.successRate} className="h-1.5 bg-amber-200 dark:bg-amber-800" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
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
                      <TabsTrigger value="projects" className="text-xs sm:text-sm">
                        {t.projects || 'Projets'}
                      </TabsTrigger>
                      <TabsTrigger value="applications" className="text-xs sm:text-sm">
                        {t.applications || 'Candidatures'}
                      </TabsTrigger>
                      <TabsTrigger value="spent" className="text-xs sm:text-sm">
                        {t.spent || 'Dépenses'}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <CardDescription>
                  {t.evolutionDesc || 'Évolution mensuelle de votre activité'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {activeChart === 'projects' && (
                      <AreaChart data={stats.monthlyData}>
                        <defs>
                          <linearGradient id="projectsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}
                          labelStyle={{ color: '#1e293b' }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="projects"
                          name={t.projects || 'Projets'}
                          stroke="#3b82f6"
                          fill="url(#projectsGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    )}
                    {activeChart === 'applications' && (
                      <BarChart data={stats.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="applications"
                          name={t.applications || 'Candidatures'}
                          fill="#8b5cf6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    )}
                    {activeChart === 'spent' && (
                      <AreaChart data={stats.monthlyData}>
                        <defs>
                          <linearGradient id="spentGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip
                          formatter={(value: number) => [`${value.toLocaleString()}€`, t.spent || 'Dépenses']}
                          contentStyle={{
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="spent"
                          name={t.spent || 'Dépenses'}
                          stroke="#10b981"
                          fill="url(#spentGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status Distribution Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <PieChart className="h-5 w-5 text-purple-500" />
                  {t.statusDistribution || 'Répartition des Projets'}
                </CardTitle>
                <CardDescription>
                  {t.statusDistributionDesc || 'Statut de vos projets'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.statusDistribution.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={stats.statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {stats.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`${value} projet(s)`, '']}
                          contentStyle={{
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <PieChart className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">{t.noData || 'Aucune donnée disponible'}</p>
                  </div>
                )}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {stats.statusDistribution.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-slate-600 dark:text-slate-400">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* AI Matching Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <AIMatchingWidget
            type="client"
            quickAction={true}
            maxResults={3}
            dict={dict}
            lang={lang}
          />
        </motion.div>

        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <Building className="h-5 w-5 text-blue-500" />
                    {t.recentProjects || 'Mes Projets Récents'}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t.recentProjectsDesc || 'Derniers projets créés et leur statut'}
                  </CardDescription>
                </div>
                <Link href={`/${lang}/dashboard/client/projects`}>
                  <Button variant="outline" size="sm" className="group">
                    {t.viewAll || 'Voir tous'}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {projects.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Building className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {t.noProjects || 'Aucun projet créé'}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {t.noProjectsDesc || 'Commencez par créer votre premier projet'}
                  </p>
                  <Link href={`/${lang}/projects/create`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      {t.createFirst || 'Créer votre premier projet'}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {projects.map((project, index) => (
                    <motion.div
                      key={project._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">{project.title}</h3>
                            <Badge
                              variant={project.status === 'open' ? 'default' : 'secondary'}
                              className={
                                project.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                project.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                project.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                project.status === 'draft' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }
                            >
                              {project.status === 'open' ? (t.open || 'Ouvert') :
                               project.status === 'in-progress' ? (t.inProgress || 'En cours') :
                               project.status === 'completed' ? (t.completed || 'Terminé') :
                               project.status === 'draft' ? (t.draft || 'Brouillon') :
                               (t.cancelled || 'Annulé')}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {project.budget.min.toLocaleString()} - {project.budget.max.toLocaleString()} {project.budget.currency}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {project.applicationCount} {t.applications || 'candidatures'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(project.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/${lang}/projects/${project._id}`}>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              {t.manage || 'Gérer'}
                            </Button>
                          </Link>
                          {project.applicationCount > 0 && (
                            <Link href={`/${lang}/projects/${project._id}/applications`}>
                              <Button size="sm" variant="outline">
                                <Users className="h-4 w-4 mr-1" />
                                {project.applicationCount}
                              </Button>
                            </Link>
                          )}
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