// app/[lang]/dashboard/freelance/gigs/page.tsx
'use client'

import { useState, useEffect } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus, Search, MoreVertical, Edit, Trash2, Eye, EyeOff, 
  TrendingUp, Star, Clock, DollarSign, Package, Zap,
  Loader2, AlertCircle, CheckCircle2, XCircle, PauseCircle,
  BarChart3, Users, ShoppingBag, ArrowUpRight,
  Play
} from "lucide-react"
import { toast } from "sonner"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { cn } from "@/lib/utils"
import { DashboardSidebar } from "@/components/dashboard/sidebar"

interface Gig {
  _id: string
  title: string
  description: string
  category: string
  price: number
  deliveryTime: number
  revisions: number
  status: 'draft' | 'active' | 'paused' | 'deleted'
  views: number
  ordersCount: number
  rating: number
  isPremium: boolean
  isPrivate: boolean
  createdAt: string
  updatedAt: string
  images: Array<{ url: string; thumbnail: string }>
}

interface GigStats {
  totalGigs: number
  activeGigs: number
  draftGigs: number
  pausedGigs: number
  totalViews: number
  totalOrders: number
  totalEarnings: number
  averageRating: number
  recentOrders: Array<{
    _id: string
    amount: number
    status: string
    createdAt: string
    buyerName: string
  }>
  topPerformingGigs: Array<{
    _id: string
    title: string
    ordersCount: number
    views: number
    earnings: number
  }>
}

export default function MyGigsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const lang = params.lang as Locale
  
  const [dict, setDict] = useState<any>(null)
  const [gigs, setGigs] = useState<Gig[]>([])
  const [stats, setStats] = useState<GigStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const itemsPerPage = 10

  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  // Charger les gigs et statistiques
  useEffect(() => {
    if (dict) {
      fetchGigs()
      fetchStats()
    }
  }, [dict, searchTerm, statusFilter, sortBy, sortOrder, currentPage])

  const fetchGigs = async () => {
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

      const response = await fetch(`/api/gigs/my?${params}`)
      if (response.ok) {
        const data = await response.json()
        setGigs(data.gigs)
        setTotalPages(data.pagination.totalPages)
      } else {
        throw new Error("Failed to fetch gigs")
      }
    } catch (error) {
      console.error("Error fetching gigs:", error)
      toast.error(dict?.my_gigs?.errors?.fetchFailed || "Erreur lors du chargement des services")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/gigs/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const handleStatusChange = async (gigId: string, newStatus: string) => {
    setUpdatingStatus(gigId)
    try {
      const response = await fetch(`/api/gigs/${gigId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success(
          newStatus === 'active' ? dict?.my_gigs?.success?.activated || "Service activé" :
          newStatus === 'paused' ? dict?.my_gigs?.success?.paused || "Service mis en pause" :
          dict?.my_gigs?.success?.updated || "Service mis à jour"
        )
        fetchGigs()
        fetchStats()
      } else {
        throw new Error("Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error(dict?.my_gigs?.errors?.statusUpdateFailed || "Erreur lors de la mise à jour")
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleDelete = async (gigId: string, gigTitle: string) => {
    const confirmMessage = dict?.my_gigs?.confirmDelete?.replace('{title}', gigTitle) || 
      `Êtes-vous sûr de vouloir supprimer "${gigTitle}" ? Cette action est irréversible.`
    
    if (!confirm(confirmMessage)) return

    setDeletingId(gigId)
    try {
      const response = await fetch(`/api/gigs/${gigId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success(dict?.my_gigs?.success?.deleted || "Service supprimé avec succès")
        fetchGigs()
        fetchStats()
      } else {
        throw new Error("Failed to delete gig")
      }
    } catch (error) {
      console.error("Error deleting gig:", error)
      toast.error(dict?.my_gigs?.errors?.deleteFailed || "Erreur lors de la suppression")
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { 
        label: dict?.my_gigs?.status?.active || "Actif", 
        className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        icon: <CheckCircle2 className="h-3 w-3" />
      },
      draft: { 
        label: dict?.my_gigs?.status?.draft || "Brouillon", 
        className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
        icon: <AlertCircle className="h-3 w-3" />
      },
      paused: { 
        label: dict?.my_gigs?.status?.paused || "En pause", 
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: <PauseCircle className="h-3 w-3" />
      },
      deleted: { 
        label: dict?.my_gigs?.status?.deleted || "Supprimé", 
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        icon: <XCircle className="h-3 w-3" />
      }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return (
      <Badge className={`flex items-center gap-1 w-fit ${config.className}`}>
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            {dict?.my_gigs?.title || "Mes services"}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {dict?.my_gigs?.subtitle || "Gérez vos services et suivez leurs performances"}
          </p>
        </div>
        <Button 
          onClick={() => router.push(`/${lang}/gigs/create`)}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          {dict?.my_gigs?.createNew || "Créer un service"}
        </Button>
      </div>
       <DashboardSidebar role="freelance" />
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {dict?.my_gigs?.stats?.totalServices || "Total services"}
                  </p>
                  <p className="text-2xl font-bold mt-2">{stats.totalGigs}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Package className="h-3 w-3" />
                    <span>
                      {stats.activeGigs} {dict?.my_gigs?.stats?.active || "actifs"} • 
                      {stats.draftGigs} {dict?.my_gigs?.stats?.draft || "brouillons"}
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {dict?.my_gigs?.stats?.totalViews || "Vues totales"}
                  </p>
                  <p className="text-2xl font-bold mt-2">{stats.totalViews.toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>{dict?.my_gigs?.stats?.allTime || "Toutes périodes"}</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {dict?.my_gigs?.stats?.totalOrders || "Commandes totales"}
                  </p>
                  <p className="text-2xl font-bold mt-2">{stats.totalOrders}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <ShoppingBag className="h-3 w-3" />
                    <span>{dict?.my_gigs?.stats?.completed || "commandes complétées"}</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {dict?.my_gigs?.stats?.totalEarnings || "Gains totaux"}
                  </p>
                  <p className="text-2xl font-bold mt-2">{stats.totalEarnings.toLocaleString()}€</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Star className="h-3 w-3" />
                    <span>{stats.averageRating.toFixed(1)} ★ {dict?.my_gigs?.stats?.averageRating || "note moyenne"}</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={dict?.my_gigs?.searchPlaceholder || "Rechercher un service..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={dict?.my_gigs?.filterStatus || "Statut"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{dict?.my_gigs?.allStatus || "Tous"}</SelectItem>
                  <SelectItem value="active">{dict?.my_gigs?.status?.active || "Actif"}</SelectItem>
                  <SelectItem value="draft">{dict?.my_gigs?.status?.draft || "Brouillon"}</SelectItem>
                  <SelectItem value="paused">{dict?.my_gigs?.status?.paused || "En pause"}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={dict?.my_gigs?.sortBy || "Trier par"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">{dict?.my_gigs?.sort?.createdAt || "Date de création"}</SelectItem>
                  <SelectItem value="views">{dict?.my_gigs?.sort?.views || "Vues"}</SelectItem>
                  <SelectItem value="ordersCount">{dict?.my_gigs?.sort?.orders || "Commandes"}</SelectItem>
                  <SelectItem value="price">{dict?.my_gigs?.sort?.price || "Prix"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gigs Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {dict?.my_gigs?.servicesList || "Liste des services"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {gigs.length} {dict?.my_gigs?.services || "services"}
            </p>
          </div>
          <CardDescription>
            {dict?.my_gigs?.tableDescription || "Gérez vos services, suivez leurs performances"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : gigs.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {dict?.my_gigs?.emptyTitle || "Aucun service"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {dict?.my_gigs?.emptyDescription || "Vous n'avez pas encore créé de service"}
              </p>
              <Button onClick={() => router.push(`/${lang}/gigs/create`)}>
                <Plus className="h-4 w-4 mr-2" />
                {dict?.my_gigs?.createFirst || "Créer votre premier service"}
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{dict?.my_gigs?.table?.service || "Service"}</TableHead>
                      <TableHead className="hidden sm:table-cell">{dict?.my_gigs?.table?.category || "Catégorie"}</TableHead>
                      <TableHead className="hidden md:table-cell">{dict?.my_gigs?.table?.price || "Prix"}</TableHead>
                      <TableHead className="hidden lg:table-cell">{dict?.my_gigs?.table?.views || "Vues"}</TableHead>
                      <TableHead className="hidden lg:table-cell">{dict?.my_gigs?.table?.orders || "Commandes"}</TableHead>
                      <TableHead className="hidden md:table-cell">{dict?.my_gigs?.table?.rating || "Note"}</TableHead>
                      <TableHead>{dict?.my_gigs?.table?.status || "Statut"}</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gigs.map((gig) => (
                      <TableRow key={gig._id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="flex items-center gap-2">
                              {gig.images?.[0] && (
                                <img
                                  src={gig.images[0].thumbnail || gig.images[0].url}
                                  alt={gig.title}
                                  className="h-10 w-10 rounded-lg object-cover hidden sm:block"
                                />
                              )}
                              <div>
                                <p className="line-clamp-1">{gig.title}</p>
                                <p className="text-xs text-muted-foreground sm:hidden">
                                  {gig.price}€ • {gig.ordersCount} {dict?.my_gigs?.orders || "cmd"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1 sm:hidden">
                              {gig.isPremium && (
                                <Badge variant="outline" className="text-[10px] text-yellow-600 border-yellow-300">
                                  Premium
                                </Badge>
                              )}
                              {gig.isPrivate && (
                                <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-300">
                                  Privé
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-sm">{gig.category}</span>
                          <div className="flex items-center gap-1 mt-1">
                            {gig.isPremium && (
                              <Badge variant="outline" className="text-[10px] text-yellow-600 border-yellow-300">
                                Premium
                              </Badge>
                            )}
                            {gig.isPrivate && (
                              <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-300">
                                Privé
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="font-semibold">{gig.price}€</span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3 text-muted-foreground" />
                            <span>{gig.views.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1">
                            <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                            <span>{gig.ordersCount}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            <span>{gig.rating.toFixed(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(gig.status)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>
                                {dict?.my_gigs?.actions || "Actions"}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => router.push(`/${lang}/gigs/${gig._id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                {dict?.my_gigs?.view || "Voir"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/${lang}/gigs/${gig._id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                {dict?.my_gigs?.edit || "Modifier"}
                              </DropdownMenuItem>
                              {gig.status === 'active' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(gig._id, 'paused')}>
                                  <PauseCircle className="h-4 w-4 mr-2" />
                                  {dict?.my_gigs?.pause || "Mettre en pause"}
                                </DropdownMenuItem>
                              )}
                              {gig.status === 'paused' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(gig._id, 'active')}>
                                  <Play className="h-4 w-4 mr-2" />
                                  {dict?.my_gigs?.activate || "Activer"}
                                </DropdownMenuItem>
                              )}
                              {gig.status === 'draft' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(gig._id, 'active')}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  {dict?.my_gigs?.publish || "Publier"}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(gig._id, gig.title)}
                                className="text-red-600 focus:text-red-600"
                                disabled={deletingId === gig._id}
                              >
                                {deletingId === gig._id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 mr-2" />
                                )}
                                {dict?.my_gigs?.delete || "Supprimer"}
                              </DropdownMenuItem>
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
                <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {dict?.my_gigs?.page || "Page"} {currentPage} / {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      {dict?.my_gigs?.previous || "Précédent"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      {dict?.my_gigs?.next || "Suivant"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Top Performing Gigs */}
      {stats?.topPerformingGigs && stats.topPerformingGigs.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {dict?.my_gigs?.topPerforming || "Services les plus performants"}
            </CardTitle>
            <CardDescription>
              {dict?.my_gigs?.topPerformingDesc || "Vos services qui génèrent le plus de vues et de commandes"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.topPerformingGigs.map((gig) => (
                <div
                  key={gig._id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/${lang}/gigs/${gig._id}`)}
                >
                  <h4 className="font-semibold line-clamp-1 mb-2">{gig.title}</h4>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Eye className="h-3 w-3" />
                      <span>{gig.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-3 w-3" />
                      <span>{gig.ordersCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3" />
                      <span>{gig.earnings.toLocaleString()}€</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (gig.ordersCount / stats.topPerformingGigs[0].ordersCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}