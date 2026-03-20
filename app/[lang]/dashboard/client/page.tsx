// app/[lang]/dashboard/client/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Building, 
  Plus, 
  Users, 
  TrendingUp, 
  Eye, 
  EyeOff, 
  Clock, 
  CheckCircle2, 
  DollarSign,
  Menu,
  X,
  ChevronRight,
  Briefcase,
  FileText,
  Sparkles,
  Target,
  Award,
  Calendar,
  MessageSquare,
  BarChart3,
  Wallet,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Search,
  Filter,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { AIMatchingWidget } from "@/components/ai/AIMatchingWidget"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { ClientDashboardContent } from '@/components/dashboard/ClientDashboardContent'

interface Project {
  _id: string
  title: string
  description: string
  status: 'draft' | 'open' | 'in-progress' | 'completed' | 'cancelled'
  visibility: 'public' | 'private'
  budget: {
    min: number
    max: number
    type: 'fixed' | 'hourly'
    currency: string
  }
  applicationCount: number
  createdAt: string
  category: string
}

interface ClientStats {
  totalProjects: number
  activeProjects: number
  totalApplications: number
  matchingRate: number
  pendingApplications?: number
  totalSpent?: number
  completedProjects?: number
  averageRating?: number
}

export default function ClientDashboardPage() {
  const { data: session } = useSession()
  const params = useParams()
  const lang = params.lang as Locale
  
  const [dict, setDict] = useState<any>(null)
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  useEffect(() => {
    if (dict) {
      fetchClientData()
    }
  }, [dict])

  const fetchClientData = async () => {
    try {
      const [projectsRes, statsRes] = await Promise.all([
        fetch('/api/projects/client?limit=5'),
        fetch('/api/stats/client')
      ])

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(Array.isArray(projectsData.projects) ? projectsData.projects : [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats({
          totalProjects: statsData.totalProjects || 0,
          activeProjects: statsData.activeProjects || 0,
          totalApplications: statsData.totalApplications || 0,
          matchingRate: statsData.matchingRate || 85,
          pendingApplications: statsData.pendingApplications || 0,
          totalSpent: statsData.totalSpent || 0,
          completedProjects: statsData.completedProjects || 0,
          averageRating: statsData.averageRating || 0
        })
      }
    } catch (error) {
      console.error('Error fetching client data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProjectVisibility = async (projectId: string, visibility: 'public' | 'private') => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility })
      })

      if (response.ok) {
        fetchClientData()
      }
    } catch (error) {
      console.error('Error updating project visibility:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: any }> = {
      'draft': { label: dict?.projects?.draft || 'Brouillon', variant: 'secondary' as const, icon: FileText },
      'open': { label: dict?.projects?.open || 'Ouvert', variant: 'default' as const, icon: Eye },
      'in-progress': { label: dict?.projects?.inProgress || 'En cours', variant: 'default' as const, icon: Clock },
      'completed': { label: dict?.projects?.completed || 'Terminé', variant: 'secondary' as const, icon: CheckCircle2 },
      'cancelled': { label: dict?.projects?.cancelled || 'Annulé', variant: 'outline' as const, icon: X }
    }
    
    const config = statusConfig[status] || { label: status, variant: 'secondary', icon: FileText }
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getVisibilityBadge = (visibility: string) => {
    return visibility === 'public' ? (
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300">
        <Eye className="h-3 w-3 mr-1" />
        {dict?.projects?.public || 'Public'}
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
        <EyeOff className="h-3 w-3 mr-1" />
        {dict?.projects?.private || 'Privé'}
      </Badge>
    )
  }

  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">{dict?.common?.loading || 'Chargement...'}</p>
        </div>
      </div>
    )
  }

  const t = dict?.dashboard?.client || {}

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">
      {/* Sidebar Desktop */}
          <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">
      <DashboardSidebar role="client" />
      <ClientDashboardContent dict={dict} lang={lang} />
    </div>
      
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          className="bg-white/80 backdrop-blur-sm shadow-lg border-slate-200"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg" />
                <span className="font-bold text-xl">NRBTalents</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-70px)]">
              <DashboardSidebar role="client" />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
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

          {/* Stats Cards - Mobile Friendly Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
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

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{t.totalApplications || 'Candidatures'}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalApplications}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
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

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
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

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 sm:mb-8">
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 text-center border border-slate-200 dark:border-slate-800">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalProjects}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{t.totalProjects || 'Total Projets'}</p>
            </div>
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 text-center border border-slate-200 dark:border-slate-800">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completedProjects || 0}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{t.completed || 'Terminés'}</p>
            </div>
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 text-center border border-slate-200 dark:border-slate-800">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingApplications || 0}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{t.pending || 'En attente'}</p>
            </div>
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl p-3 text-center border border-slate-200 dark:border-slate-800">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.averageRating?.toFixed(1) || '0'}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{t.rating || 'Note'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Matching Widget */}
              <AIMatchingWidget 
                type="client"
                quickAction={true}
                maxResults={3}
                dict={dict}
                lang={lang}
              />

              {/* Recent Projects */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
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
                          <div className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
                            <div className="space-y-2">
                              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
                            </div>
                            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Building className="h-10 w-10 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        {t.noProjects || 'Aucun projet créé'}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                        {t.noProjectsDesc || 'Commencez par créer votre premier projet pour trouver des talents'}
                      </p>
                      <Link href={`/${lang}/projects/create`}>
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                          <Plus className="mr-2 h-4 w-4" />
                          {t.createFirstProject || 'Créer votre premier projet'}
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                      {projects.map((project) => (
                        <div key={project._id} className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 className="font-semibold text-slate-900 dark:text-white text-base sm:text-lg truncate">
                                  {project.title}
                                </h3>
                                {getStatusBadge(project.status)}
                                {getVisibilityBadge(project.visibility)}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {project.budget.min.toLocaleString()} - {project.budget.max.toLocaleString()} {project.budget.currency}
                                </span>
                                <span className="hidden sm:inline">•</span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {project.applicationCount} {t.applications || 'candidature(s)'}
                                </span>
                                <span className="hidden sm:inline">•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(project.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'en' ? 'en-US' : 'fr-FR')}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {project.status === 'open' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateProjectVisibility(
                                    project._id, 
                                    project.visibility === 'public' ? 'private' : 'public'
                                  )}
                                  className="text-xs"
                                >
                                  {project.visibility === 'public' ? (
                                    <EyeOff className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Eye className="h-3 w-3 mr-1" />
                                  )}
                                  {project.visibility === 'public' ? 
                                    (t.makePrivate || 'Privé') : 
                                    (t.makePublic || 'Public')}
                                </Button>
                              )}
                              <Link href={`/${lang}/dashboard/client/projects/${project._id}/proposals`}>
                                <Button variant="outline" size="sm" className="text-xs">
                                  <Users className="mr-1 h-3 w-3" />
                                  {t.viewApplications || 'Voir candidatures'}
                                </Button>
                              </Link>
                              <Link href={`/${lang}/projects/${project._id}`}>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
                                  {t.manage || 'Gérer'}
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Widgets */}
            <div className="space-y-6">
              {/* Quick Navigation */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
                <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    {t.quickActions || 'Actions Rapides'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <Link href={`/${lang}/projects/create`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                      <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t.createProject || 'Créer un projet'}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  
                  <Link href={`/${lang}/ai-matching/clients`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                      <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t.aiMatching || 'Trouver des talents'}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  
                  <Link href={`/${lang}/messages`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                      <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t.messages || 'Messages'}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  
                  <Link href={`/${lang}/dashboard/settings`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                      <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t.settings || 'Paramètres'}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
                <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                    <Clock className="h-5 w-5 text-blue-500" />
                    {t.recentActivity || 'Activité Récente'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {t.newApplication || 'Nouvelle candidature reçue'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {dict?.common?.justNow || 'À l\'instant'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {t.projectViewed || 'Votre projet a été consulté 12 fois'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {dict?.common?.hoursAgo?.replace('{count}', '2') || 'Il y a 2h'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {t.aiMatchFound || 'Un nouveau talent correspond à votre profil'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {dict?.common?.yesterday || 'Hier'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}