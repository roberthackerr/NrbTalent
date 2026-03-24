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
import {
  Plus, Search, MoreVertical, Edit, Trash2, Eye, EyeOff, 
  TrendingUp, Star, Clock, DollarSign, Package, Zap,
  Loader2, AlertCircle, CheckCircle2, XCircle, PauseCircle,
  ShoppingBag, ArrowUpRight, Play, Sparkles, Crown, Gem
} from "lucide-react"
import { toast } from "sonner"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { cn } from "@/lib/utils"

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

  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

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
        className: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800",
        icon: <CheckCircle2 className="h-3 w-3" />
      },
      draft: { 
        label: dict?.my_gigs?.status?.draft || "Brouillon", 
        className: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800",
        icon: <AlertCircle className="h-3 w-3" />
      },
      paused: { 
        label: dict?.my_gigs?.status?.paused || "En pause", 
        className: "bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800",
        icon: <PauseCircle className="h-3 w-3" />
      },
      deleted: { 
        label: dict?.my_gigs?.status?.deleted || "Supprimé", 
        className: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800",
        icon: <XCircle className="h-3 w-3" />
      }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return (
      <Badge className={`flex items-center gap-1 w-fit border ${config.className}`}>
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950">
      <div className="p-6 md:p-8">
        {/* Header avec effet glassmorphique */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl shadow-lg shadow-purple-500/25">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-700 via-fuchsia-700 to-pink-700 dark:from-purple-300 dark:via-fuchsia-300 dark:to-pink-300 bg-clip-text text-transparent">
                  {dict?.my_gigs?.title || "Mes services"}
                </h1>
              </div>
              <p className="text-slate-600 dark:text-slate-400 ml-11">
                {dict?.my_gigs?.subtitle || "Gérez vos services et suivez leurs performances"}
              </p>
            </div>
            <Button 
              onClick={() => router.push(`/${lang}/gigs/create`)}
              className="gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 shadow-lg shadow-purple-500/25"
            >
              <Plus className="h-4 w-4" />
              {dict?.my_gigs?.createNew || "Créer un service"}
            </Button>
          </div>
        </div>

        {/* Statistics Cards avec gradient purple */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      {dict?.my_gigs?.stats?.totalServices || "Total services"}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{stats.totalGigs}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <Package className="h-3 w-3" />
                      <span>
                        {stats.activeGigs} {dict?.my_gigs?.stats?.active || "actifs"} • 
                        {stats.draftGigs} {dict?.my_gigs?.stats?.draft || "brouillons"}
                      </span>
                    </div>
                  </div>
                  <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Package className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      {dict?.my_gigs?.stats?.totalViews || "Vues totales"}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{stats.totalViews.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <TrendingUp className="h-3 w-3" />
                      <span>{dict?.my_gigs?.stats?.allTime || "Toutes périodes"}</span>
                    </div>
                  </div>
                  <div className="h-14 w-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Eye className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      {dict?.my_gigs?.stats?.totalOrders || "Commandes totales"}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{stats.totalOrders}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <ShoppingBag className="h-3 w-3" />
                      <span>{dict?.my_gigs?.stats?.completed || "commandes complétées"}</span>
                    </div>
                  </div>
                  <div className="h-14 w-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <ShoppingBag className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      {dict?.my_gigs?.stats?.totalEarnings || "Gains totaux"}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{stats.totalEarnings.toLocaleString()}€</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      <span>{stats.averageRating.toFixed(1)} ★ {dict?.my_gigs?.stats?.averageRating || "note moyenne"}</span>
                    </div>
                  </div>
                  <div className="h-14 w-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <DollarSign className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10 mb-8">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                  <Input
                    placeholder={dict?.my_gigs?.searchPlaceholder || "Rechercher un service..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] border-purple-200 dark:border-purple-800">
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
                  <SelectTrigger className="w-[140px] border-purple-200 dark:border-purple-800">
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
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
          <CardHeader className="pb-3 border-b border-purple-100 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg bg-gradient-to-r from-purple-700 to-fuchsia-700 dark:from-purple-300 dark:to-fuchsia-300 bg-clip-text text-transparent">
                {dict?.my_gigs?.servicesList || "Liste des services"}
              </CardTitle>
              <p className="text-sm text-purple-600 dark:text-purple-400">
                {gigs.length} {dict?.my_gigs?.services || "services"}
              </p>
            </div>
            <CardDescription className="text-slate-500">
              {dict?.my_gigs?.tableDescription || "Gérez vos services, suivez leurs performances"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : gigs.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-20 w-20 bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-800/30 dark:to-fuchsia-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package className="h-10 w-10 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {dict?.my_gigs?.emptyTitle || "Aucun service"}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {dict?.my_gigs?.emptyDescription || "Vous n'avez pas encore créé de service"}
                </p>
                <Button onClick={() => router.push(`/${lang}/gigs/create`)} className="bg-gradient-to-r from-purple-600 to-fuchsia-600">
                  <Plus className="h-4 w-4 mr-2" />
                  {dict?.my_gigs?.createFirst || "Créer votre premier service"}
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-purple-50/50 dark:bg-purple-900/20">
                      <TableRow className="border-purple-100 dark:border-purple-800">
                        <TableHead className="text-purple-700 dark:text-purple-300">{dict?.my_gigs?.table?.service || "Service"}</TableHead>
                        <TableHead className="hidden sm:table-cell text-purple-700 dark:text-purple-300">{dict?.my_gigs?.table?.category || "Catégorie"}</TableHead>
                        <TableHead className="hidden md:table-cell text-purple-700 dark:text-purple-300">{dict?.my_gigs?.table?.price || "Prix"}</TableHead>
                        <TableHead className="hidden lg:table-cell text-purple-700 dark:text-purple-300">{dict?.my_gigs?.table?.views || "Vues"}</TableHead>
                        <TableHead className="hidden lg:table-cell text-purple-700 dark:text-purple-300">{dict?.my_gigs?.table?.orders || "Commandes"}</TableHead>
                        <TableHead className="hidden md:table-cell text-purple-700 dark:text-purple-300">{dict?.my_gigs?.table?.rating || "Note"}</TableHead>
                        <TableHead className="text-purple-700 dark:text-purple-300">{dict?.my_gigs?.table?.status || "Statut"}</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gigs.map((gig) => (
                        <TableRow key={gig._id} className="border-purple-100 dark:border-purple-800 hover:bg-purple-50/30 dark:hover:bg-purple-900/10">
                          <TableCell className="font-medium">
                            <div>
                              <div className="flex items-center gap-2">
                                {gig.images?.[0] && (
                                  <img
                                    src={gig.images[0].thumbnail || gig.images[0].url}
                                    alt={gig.title}
                                    className="h-10 w-10 rounded-lg object-cover hidden sm:block ring-1 ring-purple-200"
                                  />
                                )}
                                <div>
                                  <p className="line-clamp-1 text-slate-900 dark:text-slate-100">{gig.title}</p>
                                  <p className="text-xs text-slate-500 sm:hidden">
                                    {gig.price}€ • {gig.ordersCount} {dict?.my_gigs?.orders || "cmd"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-1 sm:hidden">
                                {gig.isPremium && (
                                  <Badge className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                                    Premium
                                  </Badge>
                                )}
                                {gig.isPrivate && (
                                  <Badge className="text-[10px] bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white border-0">
                                    Privé
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-sm text-slate-600 dark:text-slate-400">{gig.category}</span>
                            <div className="flex items-center gap-1 mt-1">
                              {gig.isPremium && (
                                <Badge className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                                  <Crown className="h-2 w-2 mr-1" />
                                  Premium
                                </Badge>
                              )}
                              {gig.isPrivate && (
                                <Badge className="text-[10px] bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white border-0">
                                  <Gem className="h-2 w-2 mr-1" />
                                  Privé
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="font-semibold text-purple-600 dark:text-purple-400">{gig.price}€</span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <Eye className="h-3 w-3" />
                              <span>{gig.views.toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <ShoppingBag className="h-3 w-3" />
                              <span>{gig.ordersCount}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                              <span className="text-slate-600 dark:text-slate-400">{gig.rating.toFixed(1)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(gig.status)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-purple-100 dark:hover:bg-purple-800">
                                  <MoreVertical className="h-4 w-4 text-purple-500" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="border-purple-100 dark:border-purple-800">
                                <DropdownMenuLabel className="text-purple-700 dark:text-purple-300">
                                  {dict?.my_gigs?.actions || "Actions"}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-purple-100 dark:bg-purple-800" />
                                <DropdownMenuItem onClick={() => router.push(`/${lang}/gigs/${gig._id}`)} className="hover:bg-purple-50 dark:hover:bg-purple-900/50">
                                  <Eye className="h-4 w-4 mr-2 text-purple-500" />
                                  {dict?.my_gigs?.view || "Voir"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/${lang}/gigs/${gig._id}/edit`)} className="hover:bg-purple-50 dark:hover:bg-purple-900/50">
                                  <Edit className="h-4 w-4 mr-2 text-purple-500" />
                                  {dict?.my_gigs?.edit || "Modifier"}
                                </DropdownMenuItem>
                                {gig.status === 'active' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(gig._id, 'paused')} className="hover:bg-purple-50 dark:hover:bg-purple-900/50">
                                    <PauseCircle className="h-4 w-4 mr-2 text-amber-500" />
                                    {dict?.my_gigs?.pause || "Mettre en pause"}
                                  </DropdownMenuItem>
                                )}
                                {gig.status === 'paused' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(gig._id, 'active')} className="hover:bg-purple-50 dark:hover:bg-purple-900/50">
                                    <Play className="h-4 w-4 mr-2 text-emerald-500" />
                                    {dict?.my_gigs?.activate || "Activer"}
                                  </DropdownMenuItem>
                                )}
                                {gig.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(gig._id, 'active')} className="hover:bg-purple-50 dark:hover:bg-purple-900/50">
                                    <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                                    {dict?.my_gigs?.publish || "Publier"}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator className="bg-purple-100 dark:bg-purple-800" />
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(gig._id, gig.title)}
                                  className="text-rose-600 focus:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/50"
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
                  <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-purple-100 dark:border-purple-800 px-6 py-4">
                    <p className="text-sm text-slate-500">
                      {dict?.my_gigs?.page || "Page"} {currentPage} / {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/50"
                      >
                        {dict?.my_gigs?.previous || "Précédent"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/50"
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
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10 mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                {dict?.my_gigs?.topPerforming || "Services les plus performants"}
              </CardTitle>
              <CardDescription className="text-slate-500">
                {dict?.my_gigs?.topPerformingDesc || "Vos services qui génèrent le plus de vues et de commandes"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.topPerformingGigs.map((gig, index) => (
                  <div
                    key={gig._id}
                    className="group p-4 border border-purple-100 dark:border-purple-800 rounded-xl bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-900 dark:to-purple-900/20 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer"
                    onClick={() => router.push(`/${lang}/gigs/${gig._id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-md">
                          <span className="text-white font-bold text-sm">#{index + 1}</span>
                        </div>
                        <h4 className="font-semibold line-clamp-1 text-slate-900 dark:text-slate-100">{gig.title}</h4>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
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
                      <div className="w-full bg-purple-100 dark:bg-purple-800 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-fuchsia-500 h-2 rounded-full transition-all duration-500"
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
    </div>
  )
}