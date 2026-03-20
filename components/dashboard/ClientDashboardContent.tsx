// components/dashboard/ClientDashboardContent.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, Users, TrendingUp, Eye, EyeOff, Clock, DollarSign, 
  Briefcase, Target, Wallet, ArrowRight, Sparkles, Building
} from "lucide-react"
import { AIMatchingWidget } from "@/components/ai/AIMatchingWidget"

interface Project {
  _id: string
  title: string
  description: string
  status: string
  visibility: string
  budget: { min: number; max: number; type: string; currency: string }
  applicationCount: number
  createdAt: string
}

interface ClientStats {
  totalProjects: number
  activeProjects: number
  totalApplications: number
  matchingRate: number
  pendingApplications: number
  totalSpent: number
  completedProjects: number
  averageRating: number
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
    matchingRate: 85,
    pendingApplications: 0,
    totalSpent: 0,
    completedProjects: 0,
    averageRating: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClientData()
  }, [])

  const fetchClientData = async () => {
    try {
      const [projectsRes, statsRes] = await Promise.all([
        fetch('/api/projects/client?limit=5'),
        fetch('/api/stats/client')
      ])

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData.projects || [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(prev => ({ ...prev, ...statsData }))
      }
    } catch (error) {
      console.error('Error fetching client data:', error)
    } finally {
      setLoading(false)
    }
  }

  const t = dict?.dashboard?.client || {}

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              {t.title || 'Tableau de Bord Client'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              {t.subtitle || 'Gérez vos projets et trouvez des talents'}
            </p>
          </div>
          <Link href={`/${lang}/projects/create`}>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              {t.newProject || 'Nouveau Projet'}
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t.activeProjects || 'Projets Actifs'}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.activeProjects}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t.applications || 'Candidatures'}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalApplications}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t.matchingRate || 'Taux de Matching'}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.matchingRate}%</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t.totalSpent || 'Total Dépensé'}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {stats.totalSpent?.toLocaleString()}€
                  </p>
                </div>
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <Wallet className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Matching Widget */}
    <AIMatchingWidget 
  type="client"
  quickAction={true}
  maxResults={3}
  dict={dict}
  lang={lang}
/>

        {/* Recent Projects */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-lg mt-6">
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
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-32"></div>
                        <div className="h-3 bg-slate-200 rounded w-48"></div>
                      </div>
                      <div className="h-8 bg-slate-200 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
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
                {projects.map((project) => (
                  <div key={project._id} className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{project.title}</h3>
                          <Badge variant={project.status === 'open' ? 'default' : 'secondary'}>
                            {project.status === 'open' ? 'Ouvert' : project.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {project.budget.min} - {project.budget.max} {project.budget.currency}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {project.applicationCount} candidatures
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(project.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                          </span>
                        </div>
                      </div>
                      <Link href={`/${lang}/projects/${project._id}`}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          {t.manage || 'Gérer'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}