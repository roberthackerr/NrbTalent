// app/[lang]/dashboard/client/projects/[id]/proposals/page.tsx
"use client"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Star,
  DollarSign,
  Clock,
  CheckCircle2,
  X,
  MapPin,
  Briefcase,
  MessageSquare,
  Eye,
  Calendar,
  Users,
  FileText,
  Download,
  ExternalLink,
  Paperclip,
  Sparkles,
  TrendingUp,
  Shield,
  Award,
  Menu,
  Loader2,
  Filter,
  Search,
  Crown,
  Target,
  Building2,
  AlertCircle
} from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Skill {
  id: string
  name: string
  category: string
  level: string
  yearsOfExperience: number
  featured: boolean
}

interface Attachment {
  name: string
  url: string
  type: string
  size?: number
}

interface Freelancer {
  _id: string
  name: string
  avatar?: string
  title?: string
  rating?: number
  completedProjects?: number
  location?: string
  skills?: Skill[]
  responseTime?: string
  successRate?: number
  verified?: boolean
}

interface Application {
  _id: string
  freelancerId: string
  coverLetter: string
  proposedBudget: number
  estimatedDuration: string
  attachments?: Attachment[]
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  updatedAt: string
  freelancer?: Freelancer
}

interface Project {
  _id: string
  title: string
  description: string
  budget: {
    min: number
    max: number
    type: 'fixed' | 'hourly'
    currency: string
  }
  applications?: Application[]
  status: string
  clientId: string
  applicationCount?: number
  skills?: string[]
  deadline?: string
}

export default function ProposalsPage() {
  const router = useRouter()
  const params = useParams()
  const lang = params.lang as Locale
  const projectId = params.id as string

  const [dict, setDict] = useState<any>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [activeTab, setActiveTab] = useState("pending")

  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  useEffect(() => {
    if (dict && projectId) {
      fetchProjectWithApplications()
    }
  }, [dict, projectId])

  async function fetchProjectWithApplications() {
    if (!projectId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/applications`)
     
      if (!response.ok) {
        throw new Error('Failed to fetch project applications')
      }
     
      const data = await response.json()
      setProject(data.project)
      setApplications(Array.isArray(data.applications) ? data.applications : [])
      if (data.applications?.length > 0) {
        setSelectedApplication(data.applications[0])
      }
    } catch (error) {
      console.error("Error fetching project applications:", error)
      toast.error(dict?.proposals?.errors?.fetchFailed || "Erreur lors du chargement des candidatures")
      setApplications([])
    } finally {
      setLoading(false)
    }
  }

  async function handleApplicationAction(applicationId: string, status: "accepted" | "rejected") {
    try {
      setProcessingAction(applicationId)
     
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, message: feedback }),
      })
      
      if (response.ok) {
        toast.success(status === 'accepted' 
          ? dict?.proposals?.success?.accepted || "Candidature acceptée !" 
          : dict?.proposals?.success?.rejected || "Candidature rejetée !")
       
        setApplications(prev => prev.map(app =>
          app._id === applicationId ? { ...app, status } : app
        ))
        
        setAcceptDialogOpen(false)
        setRejectDialogOpen(false)
        setFeedback("")
        
        if (status === 'accepted') {
          const acceptedApp = applications.find(a => a._id === applicationId)
          setProject(prev => prev ? {
            ...prev,
            status: 'in-progress',
            freelancerId: acceptedApp?.freelancerId
          } : null)
         
          setTimeout(() => {
            router.push(`/${lang}/projects/${projectId}/onboarding`)
          }, 1500)
        }
        
        fetchProjectWithApplications()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || dict?.proposals?.errors?.updateFailed || "Erreur lors de la mise à jour")
      }
    } catch (error) {
      toast.error(dict?.proposals?.errors?.general || "Une erreur est survenue")
    } finally {
      setProcessingAction(null)
    }
  }

  const navigateToProfile = (userId: string) => {
    router.push(`/${lang}/profile/${userId}`)
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />
    if (type.includes('image')) return <FileText className="h-4 w-4 text-blue-500" />
    if (type.includes('zip') || type.includes('rar')) return <FileText className="h-4 w-4 text-amber-500" />
    return <FileText className="h-4 w-4 text-purple-500" />
  }

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: dict?.proposals?.status?.pending || "En attente", className: "bg-amber-100 text-amber-700 border-amber-200", icon: <Clock className="h-3 w-3" /> },
      accepted: { label: dict?.proposals?.status?.accepted || "Acceptée", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
      rejected: { label: dict?.proposals?.status?.rejected || "Rejetée", className: "bg-rose-100 text-rose-700 border-rose-200", icon: <X className="h-3 w-3" /> }
    }
    const c = config[status as keyof typeof config] || config.pending
    return <Badge className={`flex items-center gap-1 w-fit border ${c.className}`}>{c.icon}{c.label}</Badge>
  }

  const getApplicationScore = (app: Application) => {
    let score = 0
    if (app.freelancer?.rating && app.freelancer.rating >= 4.5) score += 30
    if (app.freelancer?.completedProjects && app.freelancer.completedProjects > 10) score += 20
    if (app.freelancer?.successRate && app.freelancer.successRate > 90) score += 25
    return score
  }

  const filteredApplications = applications
    .filter(app => {
      if (activeTab !== 'all' && app.status !== activeTab) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = app.freelancer?.name?.toLowerCase().includes(query) || false
        const matchesSkills = app.freelancer?.skills?.some(s => s.name.toLowerCase().includes(query)) || false
        if (!matchesName && !matchesSkills) return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'budget-high': return b.proposedBudget - a.proposedBudget
        case 'budget-low': return a.proposedBudget - b.proposedBudget
        case 'rating': return (b.freelancer?.rating || 0) - (a.freelancer?.rating || 0)
        default: return 0
      }
    })

  const pendingApps = applications.filter(app => app.status === "pending")
  const acceptedApps = applications.filter(app => app.status === "accepted")
  const rejectedApps = applications.filter(app => app.status === "rejected")

  if (loading || !dict) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950">
        <DashboardSidebar role="client" isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </main>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950">
        <DashboardSidebar role="client" isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-10 w-10 text-purple-500" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {dict?.proposals?.notFound || "Projet non trouvé"}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {dict?.proposals?.notFoundDesc || "Le projet que vous recherchez n'existe pas ou vous n'y avez pas accès."}
              </p>
              <Button asChild className="bg-gradient-to-r from-purple-600 to-fuchsia-600">
                <Link href={`/${lang}/dashboard/client/projects`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {dict?.proposals?.backToProjects || "Retour aux projets"}
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950">
      <DashboardSidebar 
        role="client" 
        isMobileOpen={isSidebarOpen}
        onMobileClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 overflow-y-auto">
        {/* Mobile menu button */}
        <div className="md:hidden fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="bg-white/80 backdrop-blur-sm border-purple-200 shadow-lg"
          >
            <Menu className="h-5 w-5 text-purple-600" />
          </Button>
        </div>

        <div className="p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4 gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400">
              <Link href={`/${lang}/dashboard/client/projects`}>
                <ArrowLeft className="h-4 w-4" />
                {dict?.proposals?.backToProjects || "Retour aux projets"}
              </Link>
            </Button>
            
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-700 via-fuchsia-700 to-pink-700 dark:from-purple-300 dark:via-fuchsia-300 dark:to-pink-300 bg-clip-text text-transparent">
                  {project.title}
                </h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl">{project.description}</p>
                
                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Budget: {project.budget.min.toLocaleString()} - {project.budget.max.toLocaleString()} {project.budget.currency}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {project.budget.type === 'fixed' ? 'Forfait' : 'Taux horaire'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {project.applicationCount || 0} candidature(s)
                  </span>
                  {project.skills && project.skills.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-4 w-4" />
                        {project.skills.slice(0, 3).join(', ')}
                        {project.skills.length > 3 && ` +${project.skills.length - 3}`}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Badge className={cn(
                "w-fit",
                project.status === 'open' 
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                  : "bg-slate-100 text-slate-700 border-slate-200"
              )}>
                {project.status === 'open' ? 'Ouvert' : 'En cours'}
              </Badge>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-purple-600 dark:text-purple-400">Total candidatures</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{applications.length}</p>
                  </div>
                  <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-600 dark:text-amber-400">En attente</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{pendingApps.length}</p>
                  </div>
                  <div className="h-10 w-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Acceptées</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{acceptedApps.length}</p>
                  </div>
                  <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-rose-600 dark:text-rose-400">Rejetées</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{rejectedApps.length}</p>
                  </div>
                  <div className="h-10 w-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <X className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                    <Input
                      placeholder="Rechercher un candidat..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-purple-200 dark:border-purple-800"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[140px] border-purple-200 dark:border-purple-800">
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Plus récent</SelectItem>
                      <SelectItem value="oldest">Plus ancien</SelectItem>
                      <SelectItem value="budget-high">Budget (décroissant)</SelectItem>
                      <SelectItem value="budget-low">Budget (croissant)</SelectItem>
                      <SelectItem value="rating">Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applications List */}
          <div className="space-y-4">
            {filteredApplications.length === 0 ? (
              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-10 w-10 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Aucune candidature
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Aucune candidature ne correspond à vos critères.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredApplications.map((app) => {
                const score = getApplicationScore(app)
                return (
                  <Card 
                    key={app._id}
                    className={cn(
                      "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10 hover:shadow-xl transition-all cursor-pointer",
                      selectedApplication?._id === app._id && "ring-2 ring-purple-500"
                    )}
                    onClick={() => setSelectedApplication(app)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-shrink-0">
                          <Avatar className="h-16 w-16 border-2 border-purple-200 dark:border-purple-800 shadow-md cursor-pointer hover:scale-105 transition-transform" onClick={(e) => { e.stopPropagation(); navigateToProfile(app.freelancerId) }}>
                            <AvatarImage src={app.freelancer?.avatar} />
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-semibold text-xl">
                              {app.freelancer?.name?.charAt(0) || 'F'}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 cursor-pointer hover:text-purple-600 transition-colors" onClick={(e) => { e.stopPropagation(); navigateToProfile(app.freelancerId) }}>
                                  {app.freelancer?.name || 'Freelancer'}
                                </h3>
                                {app.freelancer?.rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                    <span className="font-medium">{app.freelancer.rating}</span>
                                    <span className="text-sm text-slate-500">({app.freelancer.completedProjects || 0} projets)</span>
                                  </div>
                                )}
                              </div>
                              {app.freelancer?.title && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{app.freelancer.title}</p>
                              )}
                            </div>
                            {getStatusBadge(app.status)}
                          </div>

                          {/* Skills */}
                          {app.freelancer?.skills && app.freelancer.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {app.freelancer.skills.slice(0, 5).map((skill, index) => (
                                <Badge key={skill.id || index} variant="outline" className="text-xs border-purple-200 dark:border-purple-800">
                                  {skill.name}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Budget and Timeline */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30 rounded-xl p-3">
                              <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-400 mb-1">
                                <DollarSign className="h-4 w-4" />
                                <span>Budget proposé</span>
                              </div>
                              <p className="text-xl font-bold text-purple-900 dark:text-purple-300">
                                {app.proposedBudget.toLocaleString()} {project.budget.currency}
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-3">
                              <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 mb-1">
                                <Clock className="h-4 w-4" />
                                <span>Durée estimée</span>
                              </div>
                              <p className="text-xl font-bold text-emerald-900 dark:text-emerald-300">{app.estimatedDuration}</p>
                            </div>
                          </div>

                          {/* Cover Letter Preview */}
                          <div className="mb-4">
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                              {app.coverLetter}
                            </p>
                          </div>

                          {/* Attachments Preview */}
                          {app.attachments && app.attachments.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Paperclip className="h-4 w-4" />
                              <span>{app.attachments.length} pièce(s) jointe(s)</span>
                            </div>
                          )}

                          {/* Date */}
                          <div className="mt-4 text-xs text-slate-500">
                            Candidature reçue le {new Date(app.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </main>

      {/* Application Details Dialog */}
      <Dialog open={detailsOpen && selectedApplication !== null} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-purple-200 dark:border-purple-800">
          {selectedApplication && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl bg-gradient-to-r from-purple-700 to-fuchsia-700 bg-clip-text text-transparent">
                  Détails de la candidature
                </DialogTitle>
                <DialogDescription>
                  {selectedApplication.freelancer?.name || 'Freelancer'} a postulé à votre projet
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Freelancer Info */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30 rounded-xl">
                  <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                    <AvatarImage src={selectedApplication.freelancer?.avatar} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-xl">
                      {selectedApplication.freelancer?.name?.charAt(0) || 'F'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedApplication.freelancer?.name}</h3>
                    {selectedApplication.freelancer?.title && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">{selectedApplication.freelancer.title}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      <span className="font-medium">{selectedApplication.freelancer?.rating || 'N/A'}</span>
                      <span className="text-sm text-slate-500">({selectedApplication.freelancer?.completedProjects || 0} projets)</span>
                    </div>
                  </div>
                </div>

                {/* Cover Letter */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-500" />
                    Lettre de motivation
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                    <p className="whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                  </div>
                </div>

                {/* Proposal Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-4">
                    <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Budget proposé</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                      {selectedApplication.proposedBudget.toLocaleString()} {project.budget.currency}
                    </p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4">
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">Durée estimée</p>
                    <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">{selectedApplication.estimatedDuration}</p>
                  </div>
                </div>

                {/* Attachments */}
                {selectedApplication.attachments && selectedApplication.attachments.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-purple-500" />
                      Pièces jointes ({selectedApplication.attachments.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedApplication.attachments.map((file, idx) => (
                        <a
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-purple-100 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all group"
                        >
                          {getFileIcon(file.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-purple-600 transition-colors">{file.name}</p>
                            {file.size && <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>}
                          </div>
                          <Download className="h-4 w-4 text-slate-400 group-hover:text-purple-500" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedApplication.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-purple-100 dark:border-purple-800">
                    <Button
                      onClick={() => handleApplicationAction(selectedApplication._id, "accepted")}
                      disabled={processingAction === selectedApplication._id}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                    >
                      {processingAction === selectedApplication._id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Accepter
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleApplicationAction(selectedApplication._id, "rejected")}
                      disabled={processingAction === selectedApplication._id}
                      className="flex-1 border-rose-200 text-rose-700 hover:bg-rose-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Refuser
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}