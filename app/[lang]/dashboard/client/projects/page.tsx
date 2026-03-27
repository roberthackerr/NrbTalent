// app/dashboard/client/projects/page.tsx
"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Building, 
  Plus, 
  Users, 
  Eye, 
  EyeOff, 
  Clock, 
  DollarSign, 
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  ExternalLink,
  Download,
  BarChart3,
  Copy,
  ChevronDown,
  Grid3x3,
  List,
  Sparkles,
  Target,
  Zap,
  Calendar,
  Tag,
  TrendingDown,
  MessageSquare,
  Star,
  Check,
  X,
  Bell,
  BarChart,
  PieChart,
  Filter as FilterIcon,
  RefreshCw,
  ChevronRight,
  Award,
  Rocket,
  TrendingUp as TrendingUpIcon,
  Globe,
  Lock,
  Mail,
  Phone,
  MapPin,
  Briefcase
} from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AIArchitectBadge, AIArchitectMiniBadge } from '@/components/projects/AIArchitectBadge'
import { useSession } from 'next-auth/react'
import { cn } from "@/lib/utils"

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
  const {data: session }=useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('list')
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 100000])
  const [showNewProjectsOnly, setShowNewProjectsOnly] = useState(false)

  // Categories from existing projects
  const categories = useMemo(() => {
    const cats = new Set(projects.map(p => p.category).filter(Boolean))
    return ['all', ...Array.from(cats)]
  }, [projects])

  // Skills from existing projects
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
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive"
      })
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
        toast({
          title: "Succès",
          description: `Projet ${visibility === 'public' ? 'publié' : 'rendu privé'}`,
        })
        fetchProjects()
      }
    } catch (error) {
      console.error('Error updating project visibility:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la visibilité",
        variant: "destructive"
      })
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.')) return
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Projet supprimé avec succès",
        })
        fetchProjects()
        fetchStats()
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet",
        variant: "destructive"
      })
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
        toast({
          title: "Succès",
          description: `${selectedProjects.length} projet(s) supprimé(s)`,
        })
        setSelectedProjects([])
        fetchProjects()
        fetchStats()
      }
    } catch (error) {
      console.error('Error deleting projects:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les projets",
        variant: "destructive"
      })
    }
  }

  const duplicateProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/duplicate`, {
        method: 'POST'
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Projet dupliqué avec succès",
        })
        fetchProjects()
        fetchStats()
      }
    } catch (error) {
      console.error('Error duplicating project:', error)
      toast({
        title: "Erreur",
        description: "Impossible de dupliquer le projet",
        variant: "destructive"
      })
    }
  }

  const markAllAsRead = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/applications/mark-read`, {
        method: 'POST'
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Notifications marquées comme lues",
        })
        fetchProjects()
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  // Filtrage et tri
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
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          case 'applications':
            return b.applicationCount - a.applicationCount
          case 'budget':
            return b.budget.max - a.budget.max
          case 'title':
            return a.title.localeCompare(b.title)
          case 'urgency':
            const urgencyOrder = { high: 3, medium: 2, low: 1 }
            return (urgencyOrder[b.urgency] || 0) - (urgencyOrder[a.urgency] || 0)
          default:
            return 0
        }
      })
  }, [projects, searchTerm, statusFilter, categoryFilter, sortBy, budgetRange, showNewProjectsOnly])

  const getStatusConfig = (status: string) => {
    const configs = {
      'draft': { 
        label: 'Brouillon', 
        variant: 'secondary' as const, 
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        icon: FileText,
        gradient: 'from-gray-500 to-gray-600'
      },
      'open': { 
        label: 'Public', 
        variant: 'default' as const, 
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        icon: Eye,
        gradient: 'from-green-500 to-emerald-600'
      },
      'in-progress': { 
        label: 'En cours', 
        variant: 'default' as const, 
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        icon: TrendingUp,
        gradient: 'from-blue-500 to-cyan-600'
      },
      'completed': { 
        label: 'Terminé', 
        variant: 'secondary' as const, 
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        icon: CheckCircle2,
        gradient: 'from-purple-500 to-violet-600'
      },
      'cancelled': { 
        label: 'Annulé', 
        variant: 'outline' as const, 
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        icon: XCircle,
        gradient: 'from-red-500 to-pink-600'
      }
    }
    
    return configs[status as keyof typeof configs] || { 
      label: status, 
      variant: 'secondary', 
      color: '', 
      icon: AlertCircle,
      gradient: 'from-gray-500 to-gray-600'
    }
  }

  const statusCounts = useMemo(() => ({
    all: projects.length,
    draft: projects.filter(p => p.status === 'draft').length,
    open: projects.filter(p => p.status === 'open').length,
    'in-progress': projects.filter(p => p.status === 'in-progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    cancelled: projects.filter(p => p.status === 'cancelled').length,
  }), [projects])

  const getApplicationStats = (project: Project) => {
    const total = project.applicationCount || 0
    const pending = project.pendingApplications || 0
    const accepted = project.acceptedCount || 0
    const newApps = project.newApplications || 0
    return { total, pending, accepted, newApps }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-500 dark:bg-red-600'
      case 'medium': return 'bg-amber-500 dark:bg-amber-600'
      case 'low': return 'bg-emerald-500 dark:bg-emerald-600'
      default: return 'bg-gray-500 dark:bg-gray-600'
    }
  }

  const handleSelectProject = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const handleSelectAll = () => {
    if (selectedProjects.length === filteredAndSortedProjects.length) {
      setSelectedProjects([])
    } else {
      setSelectedProjects(filteredAndSortedProjects.map(p => p._id))
    }
  }

  const totalPendingApplications = useMemo(() => 
    projects.reduce((sum, p) => sum + (p.pendingApplications || 0), 0), 
    [projects]
  )

  const totalNewApplications = useMemo(() => 
    projects.reduce((sum, p) => sum + (p.newApplications || 0), 0), 
    [projects]
  )

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/30">
      <DashboardSidebar role="client" />

      <main className="flex-1 overflow-y-auto">
        {/* Animated Background Elements - Dark mode aware */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-300 dark:bg-purple-950 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-yellow-300 dark:bg-yellow-950 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-300 dark:bg-pink-950 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-4000"></div>
        </div>

        <div className="p-6 max-w-7xl mx-auto">
          {/* Header avec notifications */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Mes Projets
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Gérez tous vos projets en un seul endroit
                  </p>
                </div>
              </div>
              
              {/* Notification Badge */}
              {totalNewApplications > 0 && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg animate-pulse">
                    <Bell className="h-3 w-3 mr-1" />
                    {totalNewApplications} nouvelle(s) candidature(s)
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {/* Quick Stats - Dark mode aware */}
              <div className="hidden lg:flex items-center gap-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{projects.length}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Projets</div>
                </div>
                <Separator orientation="vertical" className="h-8 bg-gray-200 dark:bg-gray-800" />
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {projects.filter(p => p.status === 'open').length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Actifs</div>
                </div>
                <Separator orientation="vertical" className="h-8 bg-gray-200 dark:bg-gray-800" />
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {totalPendingApplications}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">En attente</div>
                </div>
              </div>

              <div className="flex gap-2">
                {selectedProjects.length > 0 && (
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleSelectAll}
                            className="gap-2 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
                          >
                            {selectedProjects.length === filteredAndSortedProjects.length ? 'Désélectionner' : 'Tout sélectionner'}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Sélectionner/désélectionner tous les projets</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={deleteSelectedProjects}
                            className="gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 border-0"
                          >
                            <Trash2 className="h-4 w-4" />
                            Supprimer ({selectedProjects.length})
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Supprimer les projets sélectionnés</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}
                <Link href="/projects/create">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2 shadow-lg hover:shadow-xl transition-all duration-300">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Nouveau Projet</span>
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Statistiques globales - Enhanced with dark mode */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950/30 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Projets Actifs</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {projects.filter(p => ['open', 'in-progress'].includes(p.status)).length}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl group-hover:scale-110 transition-transform">
                      <Rocket className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress value={stats.completionRate || 75} className="h-2 bg-gray-200 dark:bg-gray-700" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                      <TrendingUpIcon className="h-3 w-3 text-green-500" />
                      {stats.completionRate || 75}% de taux de réussite
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-green-50 dark:from-gray-900 dark:to-green-950/30 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Candidatures</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.totalApplications}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                      <Users className="h-3 w-3 mr-1" />
                      {stats.avgApplicationsPerProject.toFixed(1)}/projet
                    </Badge>
                    {totalNewApplications > 0 && (
                      <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0">
                        {totalNewApplications} nouvelles
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950/30 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Budget Engagé</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        ${(stats.totalBudget / 1000).toFixed(1)}k
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl group-hover:scale-110 transition-transform">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 flex items-center gap-1">
                    <Target className="h-3 w-3 text-purple-500" />
                    Moyenne: ${(stats.totalBudget / (projects.length || 1)).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-amber-50 dark:from-gray-900 dark:to-amber-950/30 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Performance</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">92%</p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl group-hover:scale-110 transition-transform">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-500" />
                    Réponse: {stats.avgResponseTime || 2.3} jours
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Actions Bar - Dark mode */}
          <div className="mb-6 flex flex-wrap gap-3">
            <Link href="/dashboard/client/proposals">
              <Button variant="outline" className="gap-2 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                <Users className="h-4 w-4" />
                Toutes les candidatures
                {totalPendingApplications > 0 && (
                  <Badge className="ml-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    {totalPendingApplications}
                  </Badge>
                )}
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="gap-2 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon className="h-4 w-4" />
              Filtres avancés
              {showFilters && (
                <Badge variant="secondary" className="ml-1">Actifs</Badge>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="gap-2 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
              onClick={fetchProjects}
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
          </div>

          {/* Filtres avancés - Dark mode */}
          {showFilters && (
            <Card className="mb-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Tag className="h-4 w-4" />
                      Catégorie
                    </Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectValue placeholder="Toutes catégories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes catégories</SelectItem>
                        {categories.filter(c => c !== 'all').map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <DollarSign className="h-4 w-4" />
                      Budget
                    </Label>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>${budgetRange[0].toLocaleString()}</span>
                        <span>${budgetRange[1].toLocaleString()}</span>
                      </div>
                      <Input
                        type="range"
                        min="0"
                        max="100000"
                        step="1000"
                        value={budgetRange[1]}
                        onChange={(e) => setBudgetRange([budgetRange[0], parseInt(e.target.value)])}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Clock className="h-4 w-4" />
                      Tri par
                    </Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectValue placeholder="Trier par" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Plus récents</SelectItem>
                        <SelectItem value="oldest">Plus anciens</SelectItem>
                        <SelectItem value="applications">Plus de candidatures</SelectItem>
                        <SelectItem value="budget">Budget élevé</SelectItem>
                        <SelectItem value="urgency">Urgence</SelectItem>
                        <SelectItem value="title">Ordre alphabétique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={showNewProjectsOnly} 
                        onCheckedChange={setShowNewProjectsOnly}
                        id="new-projects"
                      />
                      <Label htmlFor="new-projects" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Bell className="h-4 w-4" />
                        Nouvelles candidatures seulement
                      </Label>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSearchTerm('')
                        setStatusFilter('all')
                        setCategoryFilter('all')
                        setBudgetRange([0, 100000])
                        setShowNewProjectsOnly(false)
                      }}
                    >
                      Réinitialiser
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Header avec stats et recherche - Dark mode */}
          <Card className="mb-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                {/* Recherche avec suggestions */}
                <div className="flex-1 w-full">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                    <Input
                      placeholder="Rechercher projets, compétences, descriptions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-10 py-6 text-lg rounded-2xl border-2 border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all dark:bg-gray-800 dark:text-white"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setSearchTerm('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* View controls */}
                <div className="flex gap-2">
                  <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            className={`rounded-lg gap-2 ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}
                            onClick={() => setViewMode('list')}
                          >
                            <List className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Vue liste</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            className={`rounded-lg gap-2 ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}
                            onClick={() => setViewMode('grid')}
                          >
                            <Grid3x3 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Vue grille</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2 dark:bg-gray-800 dark:border-gray-700">
                        <Filter className="h-4 w-4" />
                        Filtres
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl dark:bg-gray-900">
                      <DialogHeader>
                        <DialogTitle className="dark:text-white">Filtres avancés</DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                          Affinez votre recherche avec des critères spécifiques
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        {/* Filtres détaillés */}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Quick status filters - Dark mode */}
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {[
                  { value: 'all', label: 'Tous', count: statusCounts.all, color: 'from-gray-500 to-gray-600' },
                  { value: 'open', label: 'Publics', count: statusCounts.open, color: 'from-green-500 to-emerald-600' },
                  { value: 'in-progress', label: 'En cours', count: statusCounts['in-progress'], color: 'from-blue-500 to-cyan-600' },
                  { value: 'draft', label: 'Brouillons', count: statusCounts.draft, color: 'from-gray-400 to-gray-500' },
                  { value: 'completed', label: 'Terminés', count: statusCounts.completed, color: 'from-purple-500 to-violet-600' },
                  { value: 'cancelled', label: 'Annulés', count: statusCounts.cancelled, color: 'from-red-500 to-pink-600' },
                ].map((filter) => (
                  <Button
                    key={filter.value}
                    variant={statusFilter === filter.value ? "default" : "outline"}
                    onClick={() => setStatusFilter(filter.value)}
                    className={cn(
                      "relative rounded-full px-4",
                      statusFilter === filter.value 
                        ? `bg-gradient-to-r ${filter.color} text-white border-0` 
                        : "bg-white/50 dark:bg-gray-800/50"
                    )}
                  >
                    {filter.label}
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "ml-2",
                        statusFilter === filter.value 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700'
                      )}
                    >
                      {filter.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-lg animate-pulse">
                  <div className="flex items-start justify-between">
                    <div className="space-y-4 flex-1">
                      <Skeleton className="h-8 w-1/3 rounded-xl dark:bg-gray-800" />
                      <Skeleton className="h-4 w-1/2 rounded dark:bg-gray-800" />
                      <div className="flex gap-3">
                        <Skeleton className="h-6 w-24 rounded-full dark:bg-gray-800" />
                        <Skeleton className="h-6 w-24 rounded-full dark:bg-gray-800" />
                        <Skeleton className="h-6 w-24 rounded-full dark:bg-gray-800" />
                      </div>
                    </div>
                    <Skeleton className="h-10 w-32 rounded-lg ml-4 dark:bg-gray-800" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredAndSortedProjects.length === 0 ? (
            <Card className="p-12 text-center bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950/30 border-0 shadow-xl">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
                  ? 'Aucun projet trouvé' 
                  : 'Commencez votre aventure !'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Ajustez vos filtres pour trouver ce que vous cherchez.' 
                  : 'Créez votre premier projet et découvrez les meilleurs talents.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/projects/create">
                  <Button size="lg" className="gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-6 text-lg">
                    <Plus className="h-5 w-5" />
                    Créer un projet
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="gap-3 px-8 py-6 text-lg border-2 dark:border-gray-700"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setCategoryFilter('all')
                    setShowFilters(false)
                  }}
                >
                  <RefreshCw className="h-5 w-5" />
                  Voir tous les projets
                </Button>
              </div>
            </Card>
          ) : viewMode === 'list' ? (
            <div className="space-y-6">
              {/* Header de la liste */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {filteredAndSortedProjects.length} projet{filteredAndSortedProjects.length > 1 ? 's' : ''} trouvé{filteredAndSortedProjects.length > 1 ? 's' : ''}
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Tri: <span className="font-medium">{sortBy.replace('-', ' ')}</span>
                </div>
              </div>

              {filteredAndSortedProjects.map((project) => {
                const stats = getApplicationStats(project)
                const statusConfig = getStatusConfig(project.status)
                const StatusIcon = statusConfig.icon
                const hasNewApplications = stats.newApps > 0
                const hasPendingApplications = stats.pending > 0
                
                return (
                  <Card 
                    key={project._id} 
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        {/* Sélection et Urgence */}
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={selectedProjects.includes(project._id)}
                            onChange={() => handleSelectProject(project._id)}
                            className="mt-1 h-5 w-5 text-blue-600 rounded border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:ring-2 dark:bg-gray-800"
                          />
                          
                          {/* Indicateur d'urgence */}
                          <div className={`w-3 h-3 rounded-full mt-2 ${getUrgencyColor(project.urgency)}`}></div>
                        </div>

                        <div className="flex-1 min-w-0 ml-4">
                          {/* Header avec titre et statut */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-3 flex-wrap">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {project.title}
                                </h3>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge 
                                    variant={statusConfig.variant} 
                                    className={`${statusConfig.color} border-0 shadow-sm`}
                                  >
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {statusConfig.label}
                                  </Badge>
                                  
                                  {/* Badge de visibilité */}
                                  <Badge 
                                    variant="outline" 
                                    className="gap-1 dark:border-gray-700"
                                  >
                                    {project.visibility === 'public' ? (
                                      <>
                                        <Globe className="h-3 w-3" />
                                        Public
                                      </>
                                    ) : (
                                      <>
                                        <Lock className="h-3 w-3" />
                                        Privé
                                      </>
                                    )}
                                  </Badge>

                                  {/* Badge de nouvelles candidatures */}
                                  {hasNewApplications && (
                                    <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 animate-pulse">
                                      <Bell className="h-3 w-3 mr-1" />
                                      {stats.newApps} nouvelle(s)
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              {/* Description */}
                              <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-2 text-lg leading-relaxed">
                                {project.description}
                              </p>

                              {/* Stats en ligne */}
                              <div className="flex flex-wrap items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                    <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-gray-900 dark:text-white">
                                      {project.budget.min.toLocaleString()} - {project.budget.max.toLocaleString()} {project.budget.currency}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {project.budget.type === 'fixed' ? 'Forfait' : 'Taux horaire'}
                                    </div>
                                  </div>
                                </div>

                                {/* Candidatures avec lien clair vers les propositions */}
                                <div className="flex items-center gap-2">
                                  <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                    <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-gray-900 dark:text-white">
                                      <Link 
                                        href={`/dashboard/client/projects/${project._id}/proposals`}
                                        className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
                                      >
                                        {stats.total} candidature{stats.total !== 1 ? 's' : ''}
                                      </Link>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-2">
                                      {hasPendingApplications && (
                                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                                          {stats.pending} en attente
                                        </span>
                                      )}
                                      {stats.accepted > 0 && (
                                        <span className="text-green-600 dark:text-green-400 font-medium">
                                          {stats.accepted} acceptée{stats.accepted !== 1 ? 's' : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                                    <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-gray-900 dark:text-white">
                                      {new Date(project.createdAt).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Créé le</div>
                                  </div>
                                </div>

                                {project.category && (
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                                      <Tag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                      <div className="font-bold text-gray-900 dark:text-white">{project.category}</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">Catégorie</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Compétences */}
                          {project.skills && project.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {project.skills.slice(0, 5).map((skill, index) => (
                                <Badge 
                                  key={index} 
                                  variant="outline" 
                                  className="text-sm px-3 py-1 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                >
                                  {skill}
                                </Badge>
                              ))}
                              {project.skills.length > 5 && (
                                <Badge variant="secondary" className="text-sm px-3 py-1 dark:bg-gray-800">
                                  +{project.skills.length - 5}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-end gap-3 ml-6 min-w-[200px]">
                          {/* Bouton PRINCIPAL vers les propositions */}
                          {project.status === 'open' && stats.total > 0 && (
                            <Link href={`/dashboard/client/projects/${project._id}/proposals`}>
                              <Button 
                                size="sm" 
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl gap-2"
                              >
                                <Users className="h-4 w-4" />
                                Voir les propositions
                                <Badge 
                                  variant="secondary" 
                                  className="ml-1 bg-white/20 text-white hover:bg-white/30"
                                >
                                  {stats.total}
                                </Badge>
                              </Button>
                            </Link>
                          )}

                          {/* Boutons secondaires */}
                          <div className="flex gap-2">
                            {project.status === 'open' && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateProjectVisibility(
                                        project._id, 
                                        project.visibility === 'public' ? 'private' : 'public'
                                      )}
                                      className="gap-2 dark:border-gray-700"
                                    >
                                      {project.visibility === 'public' ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Basculer la visibilité</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link href={`/projects/${project._id}`}>
                                    <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
                                        <ExternalLink className="h-4 w-4" />
                                        Gérer
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ouvrir le tableau de bord du projet</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {/* Menu déroulant */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="dark:hover:bg-gray-800">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 dark:bg-gray-900 dark:border-gray-800">
                                <DropdownMenuItem asChild className="dark:hover:bg-gray-800">
                                  <Link href={`/projects/${project._id}/edit`} className="flex items-center gap-2">
                                    <Edit2 className="h-4 w-4" />
                                    Modifier
                                  </Link>
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem asChild className="dark:hover:bg-gray-800">
                                  <Link href={`/projects/${project._id}`} className="flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    Voir détails
                                  </Link>
                                </DropdownMenuItem>
                                     
                                <DropdownMenuItem asChild className="dark:hover:bg-gray-800">
                                  <AIArchitectBadge projectId={project._id} clientId={session?.user?.id} /> 
                                </DropdownMenuItem>

                                <DropdownMenuItem asChild className="dark:hover:bg-gray-800">
                                  <Link 
                                    href={`/dashboard/client/projects/${project._id}/proposals`}
                                    className="flex items-center gap-2"
                                  >
                                    <Users className="h-4 w-4" />
                                    Voir toutes les propositions
                                    {stats.total > 0 && (
                                      <Badge variant="secondary" className="ml-auto dark:bg-gray-800">
                                        {stats.total}
                                      </Badge>
                                    )}
                                  </Link>
                                </DropdownMenuItem>

                                {hasNewApplications && (
                                  <DropdownMenuItem 
                                    onClick={() => markAllAsRead(project._id)}
                                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 dark:hover:bg-gray-800"
                                  >
                                    <Check className="h-4 w-4" />
                                    Marquer comme lu
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuItem 
                                  onClick={() => duplicateProject(project._id)}
                                  className="flex items-center gap-2 dark:hover:bg-gray-800"
                                >
                                  <Copy className="h-4 w-4" />
                                  Dupliquer
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="dark:bg-gray-800" />

                                <DropdownMenuItem 
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/projects/${project._id}`)
                                    toast({
                                      title: "Lien copié",
                                      description: "Le lien du projet a été copié dans le presse-papier",
                                    })
                                  }}
                                  className="flex items-center gap-2 dark:hover:bg-gray-800"
                                >
                                  <Copy className="h-4 w-4" />
                                  Copier le lien
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="dark:bg-gray-800" />

                                <DropdownMenuItem 
                                  onClick={() => deleteProject(project._id)}
                                  className="flex items-center gap-2 text-red-600 dark:text-red-400 dark:hover:bg-gray-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Informations rapides */}
                          <div className="text-xs text-gray-500 dark:text-gray-400 text-right mt-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Mis à jour: {new Date(project.updatedAt).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            // Vue Grille améliorée avec dark mode
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedProjects.map((project) => {
                const stats = getApplicationStats(project)
                const statusConfig = getStatusConfig(project.status)
                const StatusIcon = statusConfig.icon
                const hasNewApplications = stats.newApps > 0
                
                return (
                  <Card 
                    key={project._id} 
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2"
                  >
                    <CardContent className="p-6">
                      {/* Header avec badge d'urgence */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getUrgencyColor(project.urgency)}`}></div>
                          <Badge variant={statusConfig.variant} className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="dark:hover:bg-gray-800">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 dark:bg-gray-900 dark:border-gray-800">
                            <DropdownMenuItem asChild className="dark:hover:bg-gray-800">
                              <Link href={`/projects/${project._id}`}>Gérer</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="dark:hover:bg-gray-800">
                              <Link href={`/projects/${project._id}/edit`}>Modifier</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="dark:hover:bg-gray-800">
                              <Link href={`/dashboard/client/projects/${project._id}/proposals`}>
                                Voir les propositions
                                {stats.total > 0 && (
                                  <Badge variant="secondary" className="ml-auto dark:bg-gray-800">
                                    {stats.total}
                                  </Badge>
                                )}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteProject(project._id)}
                              className="text-red-600 dark:text-red-400 dark:hover:bg-gray-800"
                            >
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Titre avec notification */}
                      <div className="mb-3">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {project.title}
                        </h3>
                        {hasNewApplications && (
                          <Badge className="mb-2 bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 text-xs">
                            <Bell className="h-3 w-3 mr-1" />
                            {stats.newApps} nouvelle(s)
                          </Badge>
                        )}
                      </div>
                      
                      {/* Description */}
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-3">
                        {project.description}
                      </p>

                      {/* Stats */}
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Budget</span>
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {project.budget.min.toLocaleString()} - {project.budget.max.toLocaleString()} {project.budget.currency}
                          </span>
                        </div>

                        {/* Candidatures avec lien clair */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Candidatures</span>
                          </div>
                          <Link 
                            href={`/dashboard/client/projects/${project._id}/proposals`}
                            className="font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
                          >
                            {stats.total}
                          </Link>
                        </div>

                        {project.category && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-purple-500" />
                              <span className="text-sm text-gray-500 dark:text-gray-400">Catégorie</span>
                            </div>
                            <Badge variant="outline" className="text-xs dark:border-gray-700">
                              {project.category}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Compétences */}
                      {project.skills && project.skills.length > 0 && (
                        <div className="pt-4 border-t dark:border-gray-800 mb-6">
                          <div className="flex flex-wrap gap-1">
                            {project.skills.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs dark:border-gray-700">
                                {skill}
                              </Badge>
                            ))}
                            {project.skills.length > 3 && (
                              <Badge variant="secondary" className="text-xs dark:bg-gray-800">
                                +{project.skills.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-4 border-t dark:border-gray-800">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="flex-1 dark:border-gray-700 dark:hover:bg-gray-800"
                          >
                            <Link href={`/projects/${project._id}`}>
                              Détails
                            </Link>
                          </Button>
                          
                          {/* Bouton PROPOSITIONS très visible */}
                          {project.status === 'open' && stats.total > 0 && (
                            <Button
                              size="sm"
                              asChild
                              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                            >
                              <Link href={`/dashboard/client/projects/${project._id}/proposals`}>
                                Voir ({stats.total})
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Footer avec pagination et stats - Dark mode */}
          {!loading && projects.length > 0 && (
            <Card className="mt-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-medium text-gray-900 dark:text-white mb-1 text-lg">
                      📊 Résumé des résultats
                    </p>
                    <p>
                      {filteredAndSortedProjects.length} projet{filteredAndSortedProjects.length > 1 ? 's' : ''} correspondant à vos critères
                      <span className="mx-2">•</span>
                      Sur {projects.length} projet{projects.length > 1 ? 's' : ''} total
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{statusCounts.open} public(s)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{statusCounts['in-progress']} en cours</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{projects.reduce((sum, p) => sum + p.applicationCount, 0)} candidatures total</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{totalNewApplications} nouvelles</span>
                    </div>
                  </div>
                </div>

                {/* Prochaines actions suggérées */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">💡 Prochaines actions suggérées:</p>
                  <div className="flex flex-wrap gap-3">
                    {totalPendingApplications > 0 && (
                      <Link href="/dashboard/client/proposals">
                        <Button variant="outline" className="gap-2 border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30">
                          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          Réviser {totalPendingApplications} candidature{totalPendingApplications > 1 ? 's' : ''} en attente
                        </Button>
                      </Link>
                    )}
                    <Link href="/projects/create">
                      <Button variant="outline" className="gap-2 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                        <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Créer un nouveau projet
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="gap-2 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                      onClick={fetchProjects}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Actualiser les données
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Styles CSS pour l'animation blob */}
      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}