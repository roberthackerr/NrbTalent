// app/[lang]/dashboard/freelance/applications/page.tsx
'use client'

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Eye, Search, MoreVertical, Calendar, DollarSign, Clock, 
  CheckCircle2, XCircle, Loader2, Briefcase, 
  User, FileText, Star, TrendingUp, AlertCircle, Trash2,
  ExternalLink, Building, Archive, Menu
} from "lucide-react"
import { toast } from "sonner"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { cn } from "@/lib/utils"
import { DashboardSidebar } from "@/components/dashboard/sidebar"

interface Application {
  _id: string
  projectId: string
  projectTitle: string
  coverLetter: string
  proposedBudget: number
  estimatedDuration: string
  attachments: Array<{ name: string; url: string; type: string }>
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  clientViewed: boolean
  createdAt: string
  updatedAt: string
  project?: {
    _id: string
    title: string
    description: string
    category: string
    budget: {
      min: number
      max: number
      type: string
      currency: string
    }
    deadline: string
    status: string
    skills: string[]
    client?: {
      _id: string
      name: string
      avatar: string
      rating: number
      completedProjects: number
    }
  }
}

interface ApplicationStats {
  total: number
  pending: number
  accepted: number
  rejected: number
  withdrawn: number
  totalProposedBudget: number
  averageProposedBudget: number
}

export default function MyApplicationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const lang = params.lang as Locale

  const [dict, setDict] = useState<any>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [stats, setStats] = useState<ApplicationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const itemsPerPage = 10

  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  // Fonctions avec useCallback pour éviter les re-créations
  const fetchApplications = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        sortBy,
        sortOrder,
      })

      const response = await fetch(`/api/applications/my?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch applications")
      }
    } catch (error) {
      console.error("Error fetching applications:", error)
      toast.error(dict?.applications?.errors?.fetchFailed || "Erreur lors du chargement de vos candidatures")
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder, itemsPerPage, dict])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/applications/my/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }, [])

  // Effet principal - attend que le dictionnaire ET la session soient prêts
  useEffect(() => {
    if (dict && session?.user) {
      fetchApplications()
      fetchStats()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [dict, session, status, fetchApplications, fetchStats])

  // Effet pour les changements de filtres
  useEffect(() => {
    if (dict && session?.user) {
      fetchApplications()
    }
  }, [searchTerm, statusFilter, sortBy, sortOrder, currentPage, dict, session, fetchApplications])

  const handleWithdraw = async (applicationId: string) => {
    setWithdrawingId(applicationId)
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        toast.success(dict?.applications?.success?.withdrawn || "Candidature supprimée avec succès")
        fetchApplications()
        fetchStats()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete application")
      }
    } catch (error) {
      console.error("Error deleting application:", error)
      toast.error(dict?.applications?.errors?.withdrawFailed || "Erreur lors de la suppression de la candidature")
    } finally {
      setWithdrawingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        label: dict?.applications?.status?.pending || "En attente",
        className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
        icon: <Clock className="h-3 w-3" />
      },
      accepted: {
        label: dict?.applications?.status?.accepted || "Acceptée",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
        icon: <CheckCircle2 className="h-3 w-3" />
      },
      rejected: {
        label: dict?.applications?.status?.rejected || "Refusée",
        className: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400",
        icon: <XCircle className="h-3 w-3" />
      },
      withdrawn: {
        label: dict?.applications?.status?.withdrawn || "Retirée",
        className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400",
        icon: <Archive className="h-3 w-3" />
      }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <Badge className={`flex items-center gap-1 w-fit border ${config.className}`}>
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'mg' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getBudgetTypeLabel = (type: string) => {
    if (type === 'fixed') return dict?.projects?.fixed || "Forfait"
    if (type === 'hourly') return dict?.projects?.hourly || "Horaire"
    return type
  }

  // Afficher un loader pendant le chargement initial
  if (!dict || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  // Rediriger si non authentifié
  if (status === 'unauthenticated') {
    router.push(`/${lang}/auth/signin`)
    return null
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950">
      {/* Sidebar */}
      <DashboardSidebar 
        role="freelance" 
        isMobileOpen={isSidebarOpen}
        onMobileClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content - avec marge gauche sur desktop */}
      <div className="md:ml-72 min-h-screen transition-all duration-300">
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
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl shadow-lg shadow-purple-500/25">
                    <FileText className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-700 via-fuchsia-700 to-pink-700 dark:from-purple-300 dark:via-fuchsia-300 dark:to-pink-300 bg-clip-text text-transparent">
                    {dict?.applications?.title || "Mes candidatures"}
                  </h1>
                </div>
                <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 ml-11">
                  {dict?.applications?.subtitle || "Suivez l'état de vos candidatures aux projets"}
                </p>
              </div>
              <Button
                onClick={() => router.push(`/${lang}/projects`)}
                variant="outline"
                className="border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                {dict?.applications?.browseProjects || "Parcourir les projets"}
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-purple-600 dark:text-purple-400">{dict?.applications?.stats?.total || "Total"}</p>
                      <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.total}</p>
                    </div>
                    <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
                      <FileText className="h-4 w-4 md:h-5 md:w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-amber-600 dark:text-amber-400">{dict?.applications?.stats?.pending || "En attente"}</p>
                      <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.pending}</p>
                    </div>
                    <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <Clock className="h-4 w-4 md:h-5 md:w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">{dict?.applications?.stats?.accepted || "Acceptées"}</p>
                      <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.accepted}</p>
                    </div>
                    <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-purple-600 dark:text-purple-400">{dict?.applications?.stats?.totalBudget || "Budget proposé"}</p>
                      <p className="text-sm md:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.totalProposedBudget.toLocaleString()}€</p>
                    </div>
                    <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
                      <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10 mb-6 md:mb-8">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                    <Input
                      placeholder={dict?.applications?.searchPlaceholder || "Rechercher un projet..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px] md:w-[140px] border-purple-200 dark:border-purple-800">
                      <SelectValue placeholder={dict?.applications?.filterStatus || "Statut"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{dict?.applications?.allStatus || "Tous"}</SelectItem>
                      <SelectItem value="pending">{dict?.applications?.status?.pending || "En attente"}</SelectItem>
                      <SelectItem value="accepted">{dict?.applications?.status?.accepted || "Acceptées"}</SelectItem>
                      <SelectItem value="rejected">{dict?.applications?.status?.rejected || "Refusées"}</SelectItem>
                      <SelectItem value="withdrawn">{dict?.applications?.status?.withdrawn || "Retirées"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[130px] md:w-[140px] border-purple-200 dark:border-purple-800">
                      <SelectValue placeholder={dict?.applications?.sortBy || "Trier par"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">{dict?.applications?.sort?.date || "Date"}</SelectItem>
                      <SelectItem value="proposedBudget">{dict?.applications?.sort?.budget || "Budget"}</SelectItem>
                      <SelectItem value="status">{dict?.applications?.sort?.status || "Statut"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applications Table */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
            <CardHeader className="pb-3 border-b border-purple-100 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base md:text-lg bg-gradient-to-r from-purple-700 to-fuchsia-700 dark:from-purple-300 dark:to-fuchsia-300 bg-clip-text text-transparent">
                  {dict?.applications?.listTitle || "Mes candidatures"}
                </CardTitle>
                <p className="text-xs md:text-sm text-purple-600 dark:text-purple-400">
                  {applications.length} {dict?.applications?.applications || "candidatures"}
                </p>
              </div>
              <CardDescription className="text-xs md:text-sm text-slate-500">
                {dict?.applications?.tableDescription || "Liste des projets auxquels vous avez postulé"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 md:h-20 md:w-20 bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-800/30 dark:to-fuchsia-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 md:h-10 md:w-10 text-purple-400" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {dict?.applications?.emptyTitle || "Aucune candidature"}
                  </h3>
                  <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mb-6">
                    {dict?.applications?.emptyDescription || "Vous n'avez pas encore postulé à des projets"}
                  </p>
                  <Button onClick={() => router.push(`/${lang}/projects`)} className="bg-gradient-to-r from-purple-600 to-fuchsia-600">
                    <Briefcase className="h-4 w-4 mr-2" />
                    {dict?.applications?.browseProjects || "Parcourir les projets"}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-purple-50/50 dark:bg-purple-900/20">
                        <TableRow className="border-purple-100 dark:border-purple-800">
                          <TableHead className="text-purple-700 dark:text-purple-300 text-xs md:text-sm">{dict?.applications?.table?.project || "Projet"}</TableHead>
                          <TableHead className="hidden sm:table-cell text-purple-700 dark:text-purple-300 text-xs md:text-sm">{dict?.applications?.table?.budget || "Budget proposé"}</TableHead>
                          <TableHead className="hidden md:table-cell text-purple-700 dark:text-purple-300 text-xs md:text-sm">{dict?.applications?.table?.client || "Client"}</TableHead>
                          <TableHead className="hidden lg:table-cell text-purple-700 dark:text-purple-300 text-xs md:text-sm">{dict?.applications?.table?.date || "Date"}</TableHead>
                          <TableHead className="text-purple-700 dark:text-purple-300 text-xs md:text-sm">{dict?.applications?.table?.status || "Statut"}</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applications.map((app) => (
                          <TableRow key={app._id} className="border-purple-100 dark:border-purple-800 hover:bg-purple-50/30 dark:hover:bg-purple-900/10 cursor-pointer" onClick={() => {
                            setSelectedApplication(app)
                            setDetailsOpen(true)
                          }}>
                            <TableCell className="font-medium">
                              <div>
                                <p className="line-clamp-1 text-slate-900 dark:text-slate-100 font-semibold text-sm md:text-base">{app.projectTitle}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <Briefcase className="h-3 w-3" />
                                    <span>{app.project?.category || "Non catégorisé"}</span>
                                  </div>
                                  {app.project?.budget && (
                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                      <DollarSign className="h-3 w-3" />
                                      <span>{app.project.budget.min}€ - {app.project.budget.max}€ ({getBudgetTypeLabel(app.project.budget.type)})</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <span className="font-semibold text-purple-600 dark:text-purple-400 text-sm md:text-base">{app.proposedBudget}€</span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
                                  <User className="h-3 w-3 text-white" />
                                </div>
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                  {app.project?.client?.name || "Client"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <div className="flex items-center gap-1 text-sm text-slate-500">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(app.createdAt)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(app.status)}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-purple-100 dark:hover:bg-purple-800">
                                    <MoreVertical className="h-4 w-4 text-purple-500" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="border-purple-100 dark:border-purple-800">
                                  <DropdownMenuLabel className="text-purple-700 dark:text-purple-300">
                                    {dict?.applications?.actions || "Actions"}
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-purple-100 dark:bg-purple-800" />
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedApplication(app)
                                    setDetailsOpen(true)
                                  }} className="hover:bg-purple-50 dark:hover:bg-purple-900/50">
                                    <Eye className="h-4 w-4 mr-2 text-purple-500" />
                                    {dict?.applications?.viewDetails || "Voir détails"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => router.push(`/${lang}/projects/${app.projectId}`)} className="hover:bg-purple-50 dark:hover:bg-purple-900/50">
                                    <ExternalLink className="h-4 w-4 mr-2 text-purple-500" />
                                    {dict?.applications?.viewProject || "Voir le projet"}
                                  </DropdownMenuItem>
                                  {app.status === 'pending' && (
                                    <>
                                      <DropdownMenuSeparator className="bg-purple-100 dark:bg-purple-800" />
                                      <DropdownMenuItem
                                        onClick={() => handleWithdraw(app._id)}
                                        disabled={withdrawingId === app._id}
                                        className="text-rose-600 focus:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/50"
                                      >
                                        {withdrawingId === app._id ? (
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4 mr-2" />
                                        )}
                                        {dict?.applications?.withdraw || "Retirer la candidature"}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-purple-100 dark:border-purple-800 px-4 md:px-6 py-4">
                      <p className="text-xs md:text-sm text-slate-500">
                        {dict?.applications?.page || "Page"} {currentPage} / {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/50"
                        >
                          {dict?.applications?.previous || "Précédent"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/50"
                        >
                          {dict?.applications?.next || "Suivant"}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Application Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-purple-200 dark:border-purple-800">
          {selectedApplication && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl bg-gradient-to-r from-purple-700 to-fuchsia-700 bg-clip-text text-transparent">
                  {dict?.applications?.applicationDetails || "Détails de votre candidature"}
                </DialogTitle>
                <DialogDescription>
                  {dict?.applications?.detailsDesc || "Informations complètes sur votre candidature"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Project Info */}
                <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                        {selectedApplication.projectTitle}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Building className="h-4 w-4 text-purple-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {selectedApplication.project?.category || "Non catégorisé"}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(selectedApplication.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{dict?.applications?.budgetRange || "Budget du projet"}</p>
                      <p className="font-semibold">
                        {selectedApplication.project?.budget?.min}€ - {selectedApplication.project?.budget?.max}€
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {getBudgetTypeLabel(selectedApplication.project?.budget?.type || 'fixed')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{dict?.applications?.deadline || "Délai"}</p>
                      <p>{selectedApplication.project?.deadline ? formatDate(selectedApplication.project.deadline) : "Non spécifié"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{dict?.applications?.client || "Client"}</p>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
                          <User className="h-3 w-3 text-white" />
                        </div>
                        <span>{selectedApplication.project?.client?.name || "Client"}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{dict?.applications?.skills || "Compétences requises"}</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedApplication.project?.skills?.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Application Details */}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-500" />
                    {dict?.applications?.myProposal || "Ma proposition"}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{dict?.applications?.proposedBudget || "Budget proposé"}</p>
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {selectedApplication.proposedBudget}€
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{dict?.applications?.estimatedDuration || "Durée estimée"}</p>
                      <p className="font-semibold">{selectedApplication.estimatedDuration}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-slate-500 mb-2">{dict?.applications?.coverLetter || "Lettre de motivation"}</p>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                      <p className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                        {selectedApplication.coverLetter}
                      </p>
                    </div>
                  </div>

                  {selectedApplication.attachments && selectedApplication.attachments.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-slate-500 mb-2">{dict?.applications?.attachments || "Pièces jointes"}</p>
                      <div className="space-y-2">
                        {selectedApplication.attachments.map((file, idx) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                          >
                            <FileText className="h-4 w-4 text-purple-500" />
                            <span className="text-sm flex-1">{file.name}</span>
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="text-xs text-slate-500 border-t border-purple-100 dark:border-purple-800 pt-4">
                  <p>{dict?.applications?.submittedOn || "Candidature soumise le"} {formatDate(selectedApplication.createdAt)}</p>
                  {selectedApplication.updatedAt !== selectedApplication.createdAt && (
                    <p>{dict?.applications?.lastUpdated || "Dernière mise à jour"} {formatDate(selectedApplication.updatedAt)}</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                {selectedApplication.status === 'pending' && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleWithdraw(selectedApplication._id)
                      setDetailsOpen(false)
                    }}
                    disabled={withdrawingId === selectedApplication._id}
                  >
                    {withdrawingId === selectedApplication._id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    {dict?.applications?.withdraw || "Retirer la candidature"}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  {dict?.common?.close || "Fermer"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}