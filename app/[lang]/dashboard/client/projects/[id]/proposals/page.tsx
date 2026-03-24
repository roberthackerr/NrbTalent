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
  Menu
} from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { cn } from "@/lib/utils"

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
        body: JSON.stringify({ status }),
      })
      
      if (response.ok) {
        toast.success(status === 'accepted' 
          ? dict?.proposals?.success?.accepted || "Candidature acceptée !" 
          : dict?.proposals?.success?.rejected || "Candidature rejetée !")
       
        setApplications(prev => prev.map(app =>
          app._id === applicationId ? { ...app, status } : app
        ))
        
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

  if (loading || !dict) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950">
        <DashboardSidebar role="client" isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
          </div>
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

  const pendingApps = applications.filter(app => app.status === "pending")
  const acceptedApps = applications.filter(app => app.status === "accepted")
  const rejectedApps = applications.filter(app => app.status === "rejected")

  const renderApplicationCard = (app: Application, type: 'pending' | 'accepted' | 'rejected') => {
    const isAccepted = type === 'accepted'
    const isRejected = type === 'rejected'
    const freelancer = app.freelancer

    return (
      <Card key={app._id} className={cn(
        "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10 hover:shadow-xl transition-all",
        isAccepted && "border-l-4 border-l-emerald-500",
        isRejected && "opacity-70"
      )}>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Avatar et infos freelance */}
            <div className="flex-shrink-0">
              <Avatar 
                className="h-20 w-20 border-2 border-purple-200 dark:border-purple-800 shadow-md cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigateToProfile(app.freelancerId)}
              >
                <AvatarImage src={freelancer?.avatar} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-semibold text-xl">
                  {freelancer?.name?.charAt(0) || 'F'}
                </AvatarFallback>
              </Avatar>
              {freelancer?.verified && (
                <div className="flex justify-center mt-1">
                  <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Vérifié
                  </Badge>
                </div>
              )}
            </div>

            {/* Contenu principal */}
            <div className="flex-1 min-w-0">
              {/* En-tête */}
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 
                      className="text-xl font-semibold text-slate-900 dark:text-slate-100 cursor-pointer hover:text-purple-600 transition-colors"
                      onClick={() => navigateToProfile(app.freelancerId)}
                    >
                      {freelancer?.name || 'Freelancer'}
                    </h3>
                    {freelancer?.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500 " />
                        <span className="font-medium text-slate-900 dark:text-slate-100">{freelancer.rating}</span>
                        <span className="text-sm text-slate-500">
                          ({freelancer.completedProjects || 0} projets)
                        </span>
                      </div>
                    )}
                    {freelancer?.successRate && (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {freelancer.successRate}% succès
                      </Badge>
                    )}
                  </div>
                  {freelancer?.title && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{freelancer.title}</p>
                  )}
                  {freelancer?.location && (
                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                      <MapPin className="h-3 w-3" />
                      {freelancer.location}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isAccepted && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {dict?.proposals?.status?.accepted || "Acceptée"}
                    </Badge>
                  )}
                  {isRejected && (
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200 gap-1">
                      <X className="h-3 w-3" />
                      {dict?.proposals?.status?.rejected || "Rejetée"}
                    </Badge>
                  )}
                  {!isAccepted && !isRejected && (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                      <Clock className="h-3 w-3" />
                      {dict?.proposals?.status?.pending || "En attente"}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Compétences */}
              {freelancer?.skills && freelancer.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {freelancer.skills.slice(0, 5).map((skill, index) => (
                    <Badge key={skill.id || index} variant="outline" className="text-xs border-purple-200 dark:border-purple-800">
                      {skill.name}
                    </Badge>
                  ))}
                  {freelancer.skills.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{freelancer.skills.length - 5}
                    </Badge>
                  )}
                </div>
              )}

              {/* Détails de la proposition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                  <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-400 mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span>{dict?.proposals?.proposedBudget || "Budget proposé"}</span>
                  </div>
                  <p className="text-xl font-bold text-purple-900 dark:text-purple-300">
                    {app.proposedBudget?.toLocaleString()} {project.budget.currency}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">
                    {project.budget.type === 'fixed' ? 'Forfait fixe' : 'Taux horaire'}
                  </p>
                </div>
               
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
                  <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 mb-1">
                    <Clock className="h-4 w-4" />
                    <span>{dict?.proposals?.estimatedDuration || "Durée estimée"}</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-900 dark:text-emerald-300">{app.estimatedDuration}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                    {dict?.proposals?.deliveryEstimate || "Livraison estimée"}
                  </p>
                </div>
              </div>

              {/* Lettre de motivation */}
              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                  {dict?.proposals?.coverLetter || "Lettre de motivation"}
                </h4>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {app.coverLetter || dict?.proposals?.noCoverLetter || "Aucun message fourni."}
                  </p>
                </div>
              </div>

              {/* Pièces jointes */}
              {app.attachments && app.attachments.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-purple-500" />
                    {dict?.proposals?.attachments || "Pièces jointes"} ({app.attachments.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {app.attachments.map((file, idx) => (
                      <a
                        key={idx}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-purple-100 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all group"
                      >
                        {getFileIcon(file.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate group-hover:text-purple-600 transition-colors">
                            {file.name}
                          </p>
                          {file.size && (
                            <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                          )}
                        </div>
                        <Download className="h-4 w-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {!isAccepted && !isRejected && (
                <div className="flex flex-wrap gap-3 mt-4">
                  <Button
                    onClick={() => handleApplicationAction(app._id, "accepted")}
                    disabled={processingAction === app._id}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 gap-2 shadow-lg shadow-emerald-500/25"
                  >
                    {processingAction === app._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {dict?.proposals?.accept || "Accepter"}
                  </Button>
                 
                  <Button
                    variant="outline"
                    onClick={() => handleApplicationAction(app._id, "rejected")}
                    disabled={processingAction === app._id}
                    className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
                  >
                    <X className="h-4 w-4" />
                    {dict?.proposals?.reject || "Refuser"}
                  </Button>
                 
                  <Button
                    variant="ghost"
                    onClick={() => navigateToProfile(app.freelancerId)}
                    className="gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950/30"
                  >
                    <Eye className="h-4 w-4" />
                    {dict?.proposals?.viewProfile || "Voir le profil"}
                  </Button>
                </div>
              )}

              {/* Date de candidature */}
              <div className="mt-4 pt-4 border-t border-purple-100 dark:border-purple-800">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar className="h-3 w-3" />
                  {dict?.proposals?.submittedOn || "Candidature reçue le"} {new Date(app.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                  {app.updatedAt !== app.createdAt && (
                    <>
                      <span className="mx-1">•</span>
                      <span>{dict?.proposals?.updatedOn || "Modifiée le"} {new Date(app.updatedAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
            className="bg-white/80 backdrop-blur-sm border-purple-200 shadow-lg hover:bg-purple-50"
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
              <Badge className={cn (
                "w-fit",
                project.status === 'open' 
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                  : "bg-slate-100 text-slate-700 border-slate-200"
              )}>
                {project.status === 'open' ? 'Ouvert' : 'En cours'}
              </Badge>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-purple-100 dark:border-purple-800 p-1">
              <TabsTrigger value="pending" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white">
                <Clock className="h-4 w-4" />
                En attente ({pendingApps.length})
              </TabsTrigger>
              <TabsTrigger value="accepted" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white">
                <CheckCircle2 className="h-4 w-4" />
                Acceptées ({acceptedApps.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white">
                <X className="h-4 w-4" />
                Rejetées ({rejectedApps.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingApps.length === 0 ? (
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="h-10 w-10 text-purple-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      {dict?.proposals?.noPendingApplications || "Aucune candidature en attente"}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      {dict?.proposals?.noPendingDesc || "Les candidatures pour votre projet apparaîtront ici."}
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button asChild variant="outline" className="border-purple-200 dark:border-purple-800">
                        <Link href={`/${lang}/projects/${projectId}/edit`}>
                          {dict?.proposals?.editProject || "Modifier le projet"}
                        </Link>
                      </Button>
                      <Button asChild className="bg-gradient-to-r from-purple-600 to-fuchsia-600">
                        <Link href={`/${lang}/dashboard/client/projects`}>
                          {dict?.proposals?.viewProjects || "Voir mes projets"}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                pendingApps.map(app => renderApplicationCard(app, 'pending'))
              )}
            </TabsContent>

            <TabsContent value="accepted" className="space-y-4">
              {acceptedApps.length === 0 ? (
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      {dict?.proposals?.noAcceptedApplications || "Aucune candidature acceptée"}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {dict?.proposals?.noAcceptedDesc || "Les candidatures que vous acceptez apparaîtront ici."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                acceptedApps.map(app => renderApplicationCard(app, 'accepted'))
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {rejectedApps.length === 0 ? (
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <X className="h-10 w-10 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      {dict?.proposals?.noRejectedApplications || "Aucune candidature rejetée"}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {dict?.proposals?.noRejectedDesc || "Les candidatures que vous refusez apparaîtront ici."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                rejectedApps.map(app => renderApplicationCard(app, 'rejected'))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}