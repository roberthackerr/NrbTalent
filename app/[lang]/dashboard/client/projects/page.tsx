"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Building, Plus, Users, Eye, EyeOff, Clock, DollarSign, Search,
  Filter, ArrowUpDown, MoreHorizontal, TrendingUp, FileText, AlertCircle,
  CheckCircle2, XCircle, Edit2, Trash2, ExternalLink, Download, BarChart3,
  Copy, ChevronDown, Grid3x3, List, Sparkles, Target, Zap, Calendar, Tag,
  TrendingDown, MessageSquare, Star, Check, X, Bell, BarChart, PieChart,
  Filter as FilterIcon, RefreshCw, ChevronRight, Award, Rocket,
  TrendingUp as TrendingUpIcon, Globe, Lock, Mail, Phone, MapPin, Briefcase, Menu
} from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { AIArchitectBadge, AIArchitectMiniBadge } from '@/components/projects/AIArchitectBadge'
import { useSession } from 'next-auth/react'
import { cn } from "@/lib/utils"

// ── All interfaces and types unchanged ───────────────────────────────────────

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
  shortlistedCount: number
  acceptedCount: number
  pendingApplications: number
  newApplications: number
  createdAt: string
  updatedAt: string
  category: string
  skills: string[]
  location: string
  urgency: 'low' | 'medium' | 'high'
  proposals?: Array<{
    status: 'pending' | 'accepted' | 'rejected'
    freelancerName: string
    budget: number
    createdAt: string
  }>
}

interface ProjectStats {
  total: number
  totalApplications: number
  avgApplicationsPerProject: number
  totalBudget: number
  pendingApplications: number
  acceptedApplications: number
  completionRate: number
  avgResponseTime: number
}

export default function ClientProjectsPage() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 100000])
  const [showNewProjectsOnly, setShowNewProjectsOnly] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ── All logic unchanged ───────────────────────────────────────────────────

  const categories = useMemo(() => {
    const cats = new Set(projects.map(p => p.category).filter(Boolean))
    return ['all', ...Array.from(cats)]
  }, [projects])

  const allSkills = useMemo(() => {
    const skills = new Set<string>()
    projects.forEach(p => p.skills?.forEach(skill => skills.add(skill)))
    return Array.from(skills)
  }, [projects])

  useEffect(() => {
    fetchProjects()
    fetchStats()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/projects/client?limit=100')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast({ title: "Erreur", description: "Impossible de charger les projets", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/projects/client/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
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
        toast({ title: "Succès", description: `Projet ${visibility === 'public' ? 'publié' : 'rendu privé'}` })
        fetchProjects()
      }
    } catch (error) {
      console.error('Error updating project visibility:', error)
      toast({ title: "Erreur", description: "Impossible de mettre à jour la visibilité", variant: "destructive" })
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.')) return
    try {
      const response = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
      if (response.ok) {
        toast({ title: "Succès", description: "Projet supprimé avec succès" })
        fetchProjects()
        fetchStats()
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast({ title: "Erreur", description: "Impossible de supprimer le projet", variant: "destructive" })
    }
  }

  const deleteSelectedProjects = async () => {
    if (!selectedProjects.length || !confirm(`Supprimer ${selectedProjects.length} projet(s) ?`)) return
    try {
      const response = await fetch('/api/projects/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectIds: selectedProjects })
      })
      if (response.ok) {
        toast({ title: "Succès", description: `${selectedProjects.length} projet(s) supprimé(s)` })
        setSelectedProjects([])
        fetchProjects()
        fetchStats()
      }
    } catch (error) {
      console.error('Error deleting projects:', error)
      toast({ title: "Erreur", description: "Impossible de supprimer les projets", variant: "destructive" })
    }
  }

  const duplicateProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/duplicate`, { method: 'POST' })
      if (response.ok) {
        toast({ title: "Succès", description: "Projet dupliqué avec succès" })
        fetchProjects()
        fetchStats()
      }
    } catch (error) {
      console.error('Error duplicating project:', error)
      toast({ title: "Erreur", description: "Impossible de dupliquer le projet", variant: "destructive" })
    }
  }

  const markAllAsRead = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/applications/mark-read`, { method: 'POST' })
      if (response.ok) {
        toast({ title: "Succès", description: "Notifications marquées comme lues" })
        fetchProjects()
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const filteredAndSortedProjects = useMemo(() => {
    return projects
      .filter(project => {
        const matchesSearch = searchTerm === '' ||
          project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter
        const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter
        const matchesBudget = project.budget.min >= budgetRange[0] && project.budget.max <= budgetRange[1]
        const matchesNewOnly = !showNewProjectsOnly || project.newApplications > 0
        return matchesSearch && matchesStatus && matchesCategory && matchesBudget && matchesNewOnly
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest':    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          case 'oldest':    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          case 'applications': return b.applicationCount - a.applicationCount
          case 'budget':    return b.budget.max - a.budget.max
          case 'title':     return a.title.localeCompare(b.title)
          case 'urgency':
            const urgencyOrder = { high: 3, medium: 2, low: 1 }
            return (urgencyOrder[b.urgency] || 0) - (urgencyOrder[a.urgency] || 0)
          default: return 0
        }
      })
  }, [projects, searchTerm, statusFilter, categoryFilter, sortBy, budgetRange, showNewProjectsOnly])

  const getStatusConfig = (status: string) => {
    const configs = {
      'draft':       { label: 'Brouillon', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',         icon: FileText,    gradient: 'from-gray-500 to-gray-600' },
      'open':        { label: 'Public',    variant: 'default' as const,    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',   icon: Eye,         gradient: 'from-green-500 to-emerald-600' },
      'in-progress': { label: 'En cours',  variant: 'default' as const,    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',       icon: TrendingUp,  gradient: 'from-blue-500 to-cyan-600' },
      'completed':   { label: 'Terminé',   variant: 'secondary' as const,  color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: CheckCircle2, gradient: 'from-purple-500 to-violet-600' },
      'cancelled':   { label: 'Annulé',    variant: 'outline' as const,    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',           icon: XCircle,     gradient: 'from-red-500 to-pink-600' },
    }
    return configs[status as keyof typeof configs] || { label: status, variant: 'secondary', color: '', icon: AlertCircle, gradient: 'from-gray-500 to-gray-600' }
  }

  const statusCounts = useMemo(() => ({
    all:           projects.length,
    draft:         projects.filter(p => p.status === 'draft').length,
    open:          projects.filter(p => p.status === 'open').length,
    'in-progress': projects.filter(p => p.status === 'in-progress').length,
    completed:     projects.filter(p => p.status === 'completed').length,
    cancelled:     projects.filter(p => p.status === 'cancelled').length,
  }), [projects])

  const getApplicationStats = (project: Project) => ({
    total:   project.applicationCount  || 0,
    pending: project.pendingApplications || 0,
    accepted: project.acceptedCount    || 0,
    newApps: project.newApplications   || 0,
  })

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':   return 'bg-red-500 dark:bg-red-600'
      case 'medium': return 'bg-amber-500 dark:bg-amber-600'
      case 'low':    return 'bg-emerald-500 dark:bg-emerald-600'
      default:       return 'bg-gray-500 dark:bg-gray-600'
    }
  }

  const handleSelectProject = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    )
  }

  const handleSelectAll = () => {
    setSelectedProjects(
      selectedProjects.length === filteredAndSortedProjects.length
        ? []
        : filteredAndSortedProjects.map(p => p._id)
    )
  }

  const totalPendingApplications = useMemo(() =>
    projects.reduce((sum, p) => sum + (p.pendingApplications || 0), 0), [projects])

  const totalNewApplications = useMemo(() =>
    projects.reduce((sum, p) => sum + (p.newApplications || 0), 0), [projects])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/30">

      {/* Fixed sidebar */}
      <DashboardSidebar
        role="client"
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Content — offset on desktop, full-width on mobile */}
      <div className="md:pl-72 transition-all duration-300 ease-in-out min-h-screen flex flex-col">

        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 md:hidden px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Building className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-slate-800 dark:text-white text-sm">Mes Projets</span>
          {totalNewApplications > 0 && (
            <Badge className="ml-auto bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 text-xs">
              <Bell className="h-3 w-3 mr-1" />{totalNewApplications}
            </Badge>
          )}
        </header>

        {/* Decorative blobs — fixed, behind content */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-300 dark:bg-purple-950 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob" />
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-yellow-300 dark:bg-yellow-950 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-300 dark:bg-pink-950 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-4000" />
        </div>

        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">

          {/* ── Page header ─────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <div className="relative">
              {/* Title — hidden on mobile (shown in top bar) */}
              <div className="hidden md:flex items-center gap-3 mb-1">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Mes Projets
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">
                    Gérez tous vos projets en un seul endroit
                  </p>
                </div>
              </div>
              {totalNewApplications > 0 && (
                <Badge className="hidden md:inline-flex mt-1 bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg">
                  <Bell className="h-3 w-3 mr-1" />
                  {totalNewApplications} nouvelle(s) candidature(s)
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Quick stats — desktop only */}
              <div className="hidden lg:flex items-center gap-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-800 shadow-sm text-sm">
                <div className="text-center">
                  <div className="font-bold text-gray-900 dark:text-white">{projects.length}</div>
                  <div className="text-xs text-gray-500">Projets</div>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center">
                  <div className="font-bold text-green-600 dark:text-green-400">{projects.filter(p => p.status === 'open').length}</div>
                  <div className="text-xs text-gray-500">Actifs</div>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center">
                  <div className="font-bold text-blue-600 dark:text-blue-400">{totalPendingApplications}</div>
                  <div className="text-xs text-gray-500">En attente</div>
                </div>
              </div>

              {selectedProjects.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={handleSelectAll} className="text-xs">
                    {selectedProjects.length === filteredAndSortedProjects.length ? 'Désélectionner' : 'Tout sélectionner'}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={deleteSelectedProjects} className="gap-1 text-xs bg-gradient-to-r from-red-500 to-pink-500 border-0">
                    <Trash2 className="h-3.5 w-3.5" />
                    ({selectedProjects.length})
                  </Button>
                </>
              )}

              <Link href="/projects/create" className="ml-auto sm:ml-0">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2 shadow-md text-sm">
                  <Plus className="h-4 w-4" />
                  <span>Nouveau Projet</span>
                  <Sparkles className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* ── Stats cards ──────────────────────────────────────────────── */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              <Card className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950/30 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Projets Actifs</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        {projects.filter(p => ['open', 'in-progress'].includes(p.status)).length}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl group-hover:scale-110 transition-transform">
                      <Rocket className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <Progress value={stats.completionRate || 75} className="h-1.5 sm:h-2" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                      <TrendingUpIcon className="h-3 w-3 text-green-500" />
                      {stats.completionRate || 75}% réussite
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-green-50 dark:from-gray-900 dark:to-green-950/30 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Candidatures</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats.totalApplications}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
                      <Users className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] sm:text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                      {stats.avgApplicationsPerProject.toFixed(1)}/projet
                    </Badge>
                    {totalNewApplications > 0 && (
                      <Badge className="text-[10px] sm:text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white border-0">
                        {totalNewApplications} new
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950/30 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Budget Engagé</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        ${(stats.totalBudget / 1000).toFixed(1)}k
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl group-hover:scale-110 transition-transform">
                      <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1">
                    <Target className="h-3 w-3 text-purple-500" />
                    Moy: ${(stats.totalBudget / (projects.length || 1)).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-amber-50 dark:from-gray-900 dark:to-amber-950/30 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Performance</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">92%</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl group-hover:scale-110 transition-transform">
                      <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-500" />
                    Réponse: {stats.avgResponseTime || 2.3}j
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Quick action bar ─────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
            <Link href="/dashboard/client/proposals">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                <Users className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Toutes les candidatures</span>
                <span className="sm:hidden">Candidatures</span>
                {totalPendingApplications > 0 && (
                  <Badge className="ml-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[10px] px-1.5">
                    {totalPendingApplications}
                  </Badge>
                )}
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs sm:text-sm border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon className="h-3.5 w-3.5" />
              Filtres
              {showFilters && <Badge variant="secondary" className="ml-0.5 text-[10px] px-1">ON</Badge>}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs sm:text-sm"
              onClick={fetchProjects}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
          </div>

          {/* ── Advanced filters ─────────────────────────────────────────── */}
          {showFilters && (
            <Card className="mb-4 sm:mb-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs sm:text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Tag className="h-3.5 w-3.5" /> Catégorie
                    </Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 text-sm">
                        <SelectValue placeholder="Toutes catégories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes catégories</SelectItem>
                        {categories.filter(c => c !== 'all').map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs sm:text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <DollarSign className="h-3.5 w-3.5" /> Budget max: ${budgetRange[1].toLocaleString()}
                    </Label>
                    <Input
                      type="range" min="0" max="100000" step="1000"
                      value={budgetRange[1]}
                      onChange={(e) => setBudgetRange([budgetRange[0], parseInt(e.target.value)])}
                      className="w-full mt-3"
                    />
                  </div>

                  <div>
                    <Label className="text-xs sm:text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Clock className="h-3.5 w-3.5" /> Tri par
                    </Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 text-sm">
                        <SelectValue placeholder="Trier par" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Plus récents</SelectItem>
                        <SelectItem value="oldest">Plus anciens</SelectItem>
                        <SelectItem value="applications">Plus de candidatures</SelectItem>
                        <SelectItem value="budget">Budget élevé</SelectItem>
                        <SelectItem value="urgency">Urgence</SelectItem>
                        <SelectItem value="title">Alphabétique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center space-x-2">
                      <Switch checked={showNewProjectsOnly} onCheckedChange={setShowNewProjectsOnly} id="new-projects" />
                      <Label htmlFor="new-projects" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <Bell className="h-3.5 w-3.5" /> Nouvelles seulement
                      </Label>
                    </div>
                    <Button variant="ghost" size="sm" className="self-start text-xs" onClick={() => {
                      setSearchTerm(''); setStatusFilter('all'); setCategoryFilter('all')
                      setBudgetRange([0, 100000]); setShowNewProjectsOnly(false)
                    }}>
                      Réinitialiser
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Search + view controls ───────────────────────────────────── */}
          <Card className="mb-4 sm:mb-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-3 sm:p-6">
              <div className="flex gap-2 sm:gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher projets, compétences..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-8 dark:bg-gray-800 dark:text-white text-sm"
                  />
                  {searchTerm && (
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                      onClick={() => setSearchTerm('')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* View toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn("p-1.5 rounded-md transition-colors", viewMode === 'list' ? "bg-white dark:bg-gray-700 shadow" : "hover:bg-gray-200 dark:hover:bg-gray-700")}
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn("p-1.5 rounded-md transition-colors", viewMode === 'grid' ? "bg-white dark:bg-gray-700 shadow" : "hover:bg-gray-200 dark:hover:bg-gray-700")}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Status filter chips — horizontal scroll on mobile */}
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { value: 'all',         label: 'Tous',       count: statusCounts.all,           color: 'from-gray-500 to-gray-600' },
                  { value: 'open',        label: 'Publics',    count: statusCounts.open,           color: 'from-green-500 to-emerald-600' },
                  { value: 'in-progress', label: 'En cours',   count: statusCounts['in-progress'], color: 'from-blue-500 to-cyan-600' },
                  { value: 'draft',       label: 'Brouillons', count: statusCounts.draft,          color: 'from-gray-400 to-gray-500' },
                  { value: 'completed',   label: 'Terminés',   count: statusCounts.completed,      color: 'from-purple-500 to-violet-600' },
                  { value: 'cancelled',   label: 'Annulés',    count: statusCounts.cancelled,      color: 'from-red-500 to-pink-600' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={cn(
                      "flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      statusFilter === f.value
                        ? `bg-gradient-to-r ${f.color} text-white border-transparent`
                        : "bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                    )}
                  >
                    {f.label}
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full",
                      statusFilter === f.value ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    )}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Project list/grid ────────────────────────────────────────── */}
          {loading ? (
            <div className="space-y-3 sm:space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-4 sm:p-6 bg-white/80 dark:bg-gray-900/80 border-0 shadow-lg animate-pulse">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-1/3 rounded-xl dark:bg-gray-800" />
                    <Skeleton className="h-4 w-1/2 rounded dark:bg-gray-800" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-20 rounded-full dark:bg-gray-800" />
                      <Skeleton className="h-5 w-20 rounded-full dark:bg-gray-800" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredAndSortedProjects.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950/30 border-0 shadow-xl">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Building className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Aucun projet trouvé'
                  : 'Commencez votre aventure !'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto text-sm sm:text-base">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Ajustez vos filtres pour trouver ce que vous cherchez.'
                  : 'Créez votre premier projet et découvrez les meilleurs talents.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/projects/create">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 w-full sm:w-auto">
                    <Plus className="h-4 w-4" /> Créer un projet
                  </Button>
                </Link>
                <Button
                  variant="outline" size="lg"
                  className="gap-2 border-2 dark:border-gray-700 w-full sm:w-auto"
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCategoryFilter('all'); setShowFilters(false) }}
                >
                  <RefreshCw className="h-4 w-4" /> Voir tous
                </Button>
              </div>
            </Card>
          ) : viewMode === 'list' ? (

            // ── List view ────────────────────────────────────────────────
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {filteredAndSortedProjects.length} projet{filteredAndSortedProjects.length > 1 ? 's' : ''}
                </span>
                <span className="text-xs text-gray-400">Tri: {sortBy}</span>
              </div>

              {filteredAndSortedProjects.map((project) => {
                const appStats = getApplicationStats(project)
                const statusConfig = getStatusConfig(project.status)
                const StatusIcon = statusConfig.icon
                const hasNewApplications = appStats.newApps > 0
                const hasPendingApplications = appStats.pending > 0

                return (
                  <Card
                    key={project._id}
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-md hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="p-4 sm:p-6">
                      {/* Top row: checkbox + urgency + title + actions */}
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                          <input
                            type="checkbox"
                            checked={selectedProjects.includes(project._id)}
                            onChange={() => handleSelectProject(project._id)}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                          />
                          <div className={`w-2 h-2 rounded-full ${getUrgencyColor(project.urgency)}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Title + badges */}
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                              {project.title}
                            </h3>
                            {/* Desktop actions */}
                            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                              {project.status === 'open' && appStats.total > 0 && (
                                <Link href={`/dashboard/client/projects/${project._id}/proposals`}>
                                  <Button size="sm" className="gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs">
                                    <Users className="h-3.5 w-3.5" />
                                    Propositions
                                    <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">{appStats.total}</span>
                                  </Button>
                                </Link>
                              )}
                              {project.status === 'open' && (
                                <Button variant="outline" size="sm" className="px-2" onClick={() => updateProjectVisibility(project._id, project.visibility === 'public' ? 'private' : 'public')}>
                                  {project.visibility === 'public' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </Button>
                              )}
                              <Link href={`/projects/${project._id}`}>
                                <Button size="sm" className="gap-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs px-2.5">
                                  <ExternalLink className="h-3.5 w-3.5" /> Gérer
                                </Button>
                              </Link>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="px-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 dark:bg-gray-900 dark:border-gray-800">
                                  <DropdownMenuItem asChild><Link href={`/projects/${project._id}/edit`} className="flex items-center gap-2"><Edit2 className="h-3.5 w-3.5" /> Modifier</Link></DropdownMenuItem>
                                  <DropdownMenuItem asChild><Link href={`/projects/${project._id}`} className="flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> Voir détails</Link></DropdownMenuItem>
                                  <DropdownMenuItem asChild><AIArchitectBadge projectId={project._id} clientId={session?.user?.id} /></DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/client/projects/${project._id}/proposals`} className="flex items-center gap-2">
                                      <Users className="h-3.5 w-3.5" /> Toutes les propositions
                                      {appStats.total > 0 && <Badge variant="secondary" className="ml-auto text-[10px]">{appStats.total}</Badge>}
                                    </Link>
                                  </DropdownMenuItem>
                                  {hasNewApplications && (
                                    <DropdownMenuItem onClick={() => markAllAsRead(project._id)} className="text-blue-600 dark:text-blue-400 gap-2">
                                      <Check className="h-3.5 w-3.5" /> Marquer comme lu
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => duplicateProject(project._id)} className="gap-2"><Copy className="h-3.5 w-3.5" /> Dupliquer</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/projects/${project._id}`); toast({ title: "Lien copié" }) }} className="gap-2">
                                    <Copy className="h-3.5 w-3.5" /> Copier le lien
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => deleteProject(project._id)} className="text-red-600 dark:text-red-400 gap-2">
                                    <Trash2 className="h-3.5 w-3.5" /> Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Status badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <Badge variant={statusConfig.variant} className={cn(statusConfig.color, "border-0 text-xs")}>
                              <StatusIcon className="h-3 w-3 mr-1" />{statusConfig.label}
                            </Badge>
                            <Badge variant="outline" className="gap-1 text-xs dark:border-gray-700">
                              {project.visibility === 'public' ? <><Globe className="h-3 w-3" />Public</> : <><Lock className="h-3 w-3" />Privé</>}
                            </Badge>
                            {hasNewApplications && (
                              <Badge className="text-[10px] bg-gradient-to-r from-red-500 to-pink-500 text-white border-0">
                                <Bell className="h-3 w-3 mr-0.5" />{appStats.newApps} new
                              </Badge>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                            {project.description}
                          </p>

                          {/* Stats row — responsive wrap */}
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm mb-3">
                            <div className="flex items-center gap-1.5">
                              <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                <DollarSign className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                              </div>
                              <span className="font-medium text-gray-800 dark:text-gray-200">
                                {project.budget.min.toLocaleString()}–{project.budget.max.toLocaleString()} {project.budget.currency}
                              </span>
                              <span className="text-gray-400 text-[10px]">({project.budget.type === 'fixed' ? 'Forfait' : '/h'})</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="p-1.5 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                <Users className="h-3 w-3 text-green-600 dark:text-green-400" />
                              </div>
                              <Link href={`/dashboard/client/projects/${project._id}/proposals`} className="font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 hover:underline">
                                {appStats.total} candidature{appStats.total !== 1 ? 's' : ''}
                              </Link>
                              {hasPendingApplications && (
                                <span className="text-amber-600 dark:text-amber-400 text-[10px]">({appStats.pending} en attente)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="p-1.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                                <Calendar className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                              </div>
                              <span className="text-gray-600 dark:text-gray-400">
                                {new Date(project.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            {project.category && (
                              <div className="flex items-center gap-1.5">
                                <div className="p-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                                  <Tag className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                </div>
                                <span className="text-gray-600 dark:text-gray-400">{project.category}</span>
                              </div>
                            )}
                          </div>

                          {/* Skills */}
                          {project.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {project.skills.slice(0, 4).map((skill, i) => (
                                <Badge key={i} variant="outline" className="text-[10px] sm:text-xs px-2 py-0.5 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400">
                                  {skill}
                                </Badge>
                              ))}
                              {project.skills.length > 4 && (
                                <Badge variant="secondary" className="text-[10px] sm:text-xs dark:bg-gray-800">+{project.skills.length - 4}</Badge>
                              )}
                            </div>
                          )}

                          {/* Mobile actions */}
                          <div className="flex gap-2 sm:hidden mt-2">
                            {project.status === 'open' && appStats.total > 0 && (
                              <Link href={`/dashboard/client/projects/${project._id}/proposals`} className="flex-1">
                                <Button size="sm" className="w-full gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs">
                                  <Users className="h-3.5 w-3.5" /> Propositions ({appStats.total})
                                </Button>
                              </Link>
                            )}
                            <Link href={`/projects/${project._id}`} className={appStats.total > 0 ? '' : 'flex-1'}>
                              <Button size="sm" className={cn("gap-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs", appStats.total === 0 && "w-full")}>
                                <ExternalLink className="h-3.5 w-3.5" /> Gérer
                              </Button>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="px-2">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 dark:bg-gray-900 dark:border-gray-800">
                                <DropdownMenuItem asChild><Link href={`/projects/${project._id}/edit`} className="flex items-center gap-2"><Edit2 className="h-3.5 w-3.5" /> Modifier</Link></DropdownMenuItem>
                                <DropdownMenuItem onClick={() => duplicateProject(project._id)} className="gap-2"><Copy className="h-3.5 w-3.5" /> Dupliquer</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => deleteProject(project._id)} className="text-red-600 gap-2"><Trash2 className="h-3.5 w-3.5" /> Supprimer</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-2 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            Mis à jour: {new Date(project.updatedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (

            // ── Grid view ────────────────────────────────────────────────
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredAndSortedProjects.map((project) => {
                const appStats = getApplicationStats(project)
                const statusConfig = getStatusConfig(project.status)
                const StatusIcon = statusConfig.icon
                const hasNewApplications = appStats.newApps > 0

                return (
                  <Card
                    key={project._id}
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1"
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getUrgencyColor(project.urgency)}`} />
                          <Badge variant={statusConfig.variant} className={cn(statusConfig.color, "text-xs border-0")}>
                            <StatusIcon className="h-3 w-3 mr-1" />{statusConfig.label}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="px-2 dark:hover:bg-gray-800">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 dark:bg-gray-900 dark:border-gray-800">
                            <DropdownMenuItem asChild><Link href={`/projects/${project._id}`}>Gérer</Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href={`/projects/${project._id}/edit`}>Modifier</Link></DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/client/projects/${project._id}/proposals`} className="flex items-center justify-between">
                                Propositions {appStats.total > 0 && <Badge variant="secondary" className="text-[10px]">{appStats.total}</Badge>}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => deleteProject(project._id)} className="text-red-600 dark:text-red-400">Supprimer</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-1.5 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {project.title}
                      </h3>
                      {hasNewApplications && (
                        <Badge className="mb-2 text-[10px] bg-gradient-to-r from-red-500 to-pink-500 text-white border-0">
                          <Bell className="h-3 w-3 mr-0.5" />{appStats.newApps} nouvelle(s)
                        </Badge>
                      )}
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{project.description}</p>

                      <div className="space-y-2.5 mb-4 text-xs sm:text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-gray-500"><DollarSign className="h-3.5 w-3.5 text-blue-500" />Budget</div>
                          <span className="font-medium text-gray-900 dark:text-white text-xs">
                            {project.budget.min.toLocaleString()}–{project.budget.max.toLocaleString()} {project.budget.currency}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-gray-500"><Users className="h-3.5 w-3.5 text-green-500" />Candidatures</div>
                          <Link href={`/dashboard/client/projects/${project._id}/proposals`} className="font-medium text-gray-900 dark:text-white hover:text-blue-600 hover:underline">{appStats.total}</Link>
                        </div>
                        {project.category && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-gray-500"><Tag className="h-3.5 w-3.5 text-purple-500" />Catégorie</div>
                            <Badge variant="outline" className="text-[10px] dark:border-gray-700">{project.category}</Badge>
                          </div>
                        )}
                      </div>

                      {project.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-3 border-t dark:border-gray-800 mb-4">
                          {project.skills.slice(0, 3).map((skill, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] dark:border-gray-700">{skill}</Badge>
                          ))}
                          {project.skills.length > 3 && <Badge variant="secondary" className="text-[10px] dark:bg-gray-800">+{project.skills.length - 3}</Badge>}
                        </div>
                      )}

                      <div className="flex gap-2 pt-3 border-t dark:border-gray-800">
                        <Button variant="outline" size="sm" asChild className="flex-1 text-xs dark:border-gray-700">
                          <Link href={`/projects/${project._id}`}>Détails</Link>
                        </Button>
                        {project.status === 'open' && appStats.total > 0 && (
                          <Button size="sm" asChild className="flex-1 text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                            <Link href={`/dashboard/client/projects/${project._id}/proposals`}>
                              Voir ({appStats.total})
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* ── Footer summary ───────────────────────────────────────────── */}
          {!loading && projects.length > 0 && (
            <Card className="mt-6 sm:mt-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-semibold text-gray-900 dark:text-white mb-0.5">📊 Résumé</p>
                    <p>{filteredAndSortedProjects.length} projet{filteredAndSortedProjects.length > 1 ? 's' : ''} sur {projects.length} total</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />{statusCounts.open} public(s)</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />{statusCounts['in-progress']} en cours</span>
                    <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-gray-400" />{projects.reduce((s, p) => s + p.applicationCount, 0)} candidatures</span>
                    <span className="flex items-center gap-1.5"><Bell className="h-3.5 w-3.5 text-red-400" />{totalNewApplications} nouvelles</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-gray-500 mb-3">💡 Actions suggérées:</p>
                  <div className="flex flex-wrap gap-2">
                    {totalPendingApplications > 0 && (
                      <Link href="/dashboard/client/proposals">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30">
                          <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          Réviser {totalPendingApplications} en attente
                        </Button>
                      </Link>
                    )}
                    <Link href="/projects/create">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                        <Plus className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Nouveau projet
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={fetchProjects}>
                      <RefreshCw className="h-3.5 w-3.5" /> Actualiser
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(30px, -50px) scale(1.1); }
          66%  { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .scrollbar-none { scrollbar-width: none; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}