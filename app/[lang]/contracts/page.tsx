// app/contracts/page.tsx - VERSION PURPLE MODERN
"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Loader2, 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Euro,
  Clock,
  PlusCircle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Briefcase,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Crown,
  Gem,
  Diamond,
  Shield,
  Star,
  Zap,
  Heart,
  Users,
  Award,
  BarChart3,
  PieChart,
  LineChart,
  Wallet,
  CreditCard,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Eye,
  Bookmark,
  Share2,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  List,
  SortAsc,
  SortDesc
} from "lucide-react"
import { toast } from "sonner"
import type { Contract } from "@/types/contract"

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: "easeOut" }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
}

const scaleOnHover = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 }
}

const cardHover = {
  whileHover: { 
    y: -8,
    transition: { duration: 0.2 }
  }
}

export default function ContractsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<"date" | "amount" | "status">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      fetchContracts()
    }
  }, [status])

  const fetchContracts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/contracts")
      const data = await response.json()
      
      if (response.ok) {
        const formattedContracts = data.contracts?.map((contract: any) => ({
          ...contract,
          startDate: new Date(contract.startDate),
          createdAt: new Date(contract.createdAt),
          updatedAt: new Date(contract.updatedAt),
          endDate: contract.endDate ? new Date(contract.endDate) : undefined,
          signedAt: contract.signedAt ? new Date(contract.signedAt) : undefined
        })) || []
        
        setContracts(formattedContracts)
      } else {
        toast.error(data.error || "Erreur lors du chargement des contrats")
      }
    } catch (error) {
      console.error("Erreur chargement contrats:", error)
      toast.error("Erreur lors du chargement des contrats")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredAndSortedContracts = useMemo(() => {
    let filtered = [...contracts]

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(contract =>
        contract.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.freelancer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtre par statut
    if (activeTab !== "all") {
      filtered = filtered.filter(contract => contract.status === activeTab)
    }

    // Tri
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB
      }
      if (sortBy === "amount") {
        return sortOrder === "desc" ? b.amount - a.amount : a.amount - b.amount
      }
      if (sortBy === "status") {
        return sortOrder === "desc" 
          ? b.status.localeCompare(a.status)
          : a.status.localeCompare(b.status)
      }
      return 0
    })

    return filtered
  }, [contracts, searchTerm, activeTab, sortBy, sortOrder])

  const stats = useMemo(() => {
    const totalActive = contracts.filter(c => c.status === 'active')
    const totalPending = contracts.filter(c => c.status === 'pending')
    const totalCompleted = contracts.filter(c => c.status === 'completed')
    const totalValue = contracts.reduce((sum, c) => sum + c.amount, 0)
    const activeValue = totalActive.reduce((sum, c) => sum + c.amount, 0)
    
    return {
      total: contracts.length,
      active: totalActive.length,
      pending: totalPending.length,
      completed: totalCompleted.length,
      totalValue,
      activeValue,
      averageValue: contracts.length > 0 ? totalValue / contracts.length : 0
    }
  }, [contracts])

  const getStatusConfig = (status: string) => {
    const config: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
      draft: {
        label: "Brouillon",
        icon: FileText,
        color: "text-purple-600",
        bg: "bg-purple-50 dark:bg-purple-900/30",
        border: "border-purple-200 dark:border-purple-800"
      },
      pending: {
        label: "En attente",
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-900/30",
        border: "border-amber-200 dark:border-amber-800"
      },
      signed: {
        label: "Signé",
        icon: CheckCircle,
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-900/30",
        border: "border-blue-200 dark:border-blue-800"
      },
      active: {
        label: "Actif",
        icon: Zap,
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-900/30",
        border: "border-emerald-200 dark:border-emerald-800"
      },
      completed: {
        label: "Terminé",
        icon: Award,
        color: "text-purple-600",
        bg: "bg-purple-50 dark:bg-purple-900/30",
        border: "border-purple-200 dark:border-purple-800"
      },
      cancelled: {
        label: "Annulé",
        icon: XCircle,
        color: "text-rose-600",
        bg: "bg-rose-50 dark:bg-rose-900/30",
        border: "border-rose-200 dark:border-rose-800"
      }
    }
    return config[status] || config.draft
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { label: string; icon: any }> = {
      fixed_price: { label: "Prix Fixe", icon: Euro },
      hourly: { label: "À l'Heure", icon: Clock },
      milestone: { label: "Par Jalons", icon: Calendar }
    }
    return labels[type] || { label: type, icon: FileText }
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-4"
          >
            <Sparkles className="h-16 w-16 text-purple-500" />
          </motion.div>
          <p className="text-lg font-medium text-purple-700 dark:text-purple-300 mb-2">
            Chargement de vos contrats...
          </p>
          <Progress value={65} className="w-64 mx-auto bg-purple-100 dark:bg-purple-900" />
        </motion.div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin?callbackUrl=/contracts")
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950">
      {/* Decorative elements */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-fuchsia-300/20 dark:bg-fuchsia-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
      
      <div className="container max-w-7xl mx-auto px-4 py-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl shadow-lg shadow-purple-500/25">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-700 via-fuchsia-700 to-pink-700 dark:from-purple-300 dark:via-fuchsia-300 dark:to-pink-300 bg-clip-text text-transparent">
                  Mes Contrats
                </h1>
              </div>
              <p className="text-purple-600 dark:text-purple-400 ml-11">
                Gérez tous vos contrats avec vos clients et freelancers
              </p>
            </div>
            
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              className="border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Retour au Dashboard
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <motion.div variants={fadeInUp}>
            <Card className="bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">Total contrats</span>
                  <Gem className="h-5 w-5 opacity-90" />
                </div>
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="flex items-center gap-1 mt-2 text-xs opacity-80">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{Math.floor(stats.total * 0.1)}% ce mois</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-200 dark:border-purple-800 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-purple-600 dark:text-purple-400">Valeur totale</span>
                  <DollarSign className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {formatCurrency(stats.totalValue, 'EUR')}
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+12.5%</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-200 dark:border-purple-800 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-purple-600 dark:text-purple-400">Contrats actifs</span>
                  <Zap className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.active}</div>
                <div className="text-xs text-purple-500 mt-2">
                  Valeur: {formatCurrency(stats.activeValue, 'EUR')}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-200 dark:border-purple-800 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-purple-600 dark:text-purple-400">Moyenne contrat</span>
                  <Award className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {formatCurrency(stats.averageValue, 'EUR')}
                </div>
                <Progress value={75} className="mt-2 h-1 bg-purple-100 dark:bg-purple-900" />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
              <Input
                placeholder="Rechercher un contrat, client, freelancer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30"
              >
                {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl border border-purple-200 dark:border-purple-800"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-purple-600 dark:text-purple-400">Trier par:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-1 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800 text-sm"
                    >
                      <option value="date">Date</option>
                      <option value="amount">Montant</option>
                      <option value="status">Statut</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                      className="p-2"
                    >
                      {sortOrder === "desc" ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="text-sm text-purple-500">
                    {filteredAndSortedContracts.length} contrat(s) trouvé(s)
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-7 gap-2 bg-purple-100/50 dark:bg-purple-900/30 p-1 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-purple-600">
              <FileText className="h-3 w-3 mr-2" />
              Tous
              <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-700">
                {stats.total}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
              <Zap className="h-3 w-3 mr-2" />
              Actifs
              <Badge variant="secondary" className="ml-1">{stats.active}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
              <Clock className="h-3 w-3 mr-2" />
              En attente
              <Badge variant="secondary" className="ml-1">{stats.pending}</Badge>
            </TabsTrigger>
            <TabsTrigger value="draft" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
              <FileText className="h-3 w-3 mr-2" />
              Brouillons
            </TabsTrigger>
            <TabsTrigger value="signed" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
              <CheckCircle className="h-3 w-3 mr-2" />
              Signés
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
              <Award className="h-3 w-3 mr-2" />
              Terminés
              <Badge variant="secondary" className="ml-1">{stats.completed}</Badge>
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
              <XCircle className="h-3 w-3 mr-2" />
              Annulés
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <AnimatePresence mode="wait">
              {filteredAndSortedContracts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="border-purple-200 dark:border-purple-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                    <CardContent className="py-12 text-center">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <FileText className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                      </motion.div>
                      <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-2">
                        {searchTerm ? "Aucun contrat trouvé" : "Aucun contrat"}
                      </h3>
                      <p className="text-purple-600 dark:text-purple-400 mb-4">
                        {searchTerm 
                          ? "Essayez avec d'autres termes de recherche"
                          : activeTab === "all"
                            ? "Vous n'avez pas encore de contrats"
                            : `Vous n'avez pas de contrats avec le statut "${activeTab}"`
                        }
                      </p>
                      {searchTerm && (
                        <Button
                          variant="outline"
                          onClick={() => setSearchTerm("")}
                          className="border-purple-200 hover:bg-purple-50"
                        >
                          Effacer la recherche
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className={viewMode === "grid" 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                  }
                >
                  <AnimatePresence>
                    {filteredAndSortedContracts.map((contract, index) => {
                      const statusConfig = getStatusConfig(contract.status)
                      const StatusIcon = statusConfig.icon
                      const typeConfig = getTypeLabel(contract.type)
                      const TypeIcon = typeConfig.icon
                      
                      return (
                        <motion.div
                          key={contract._id}
                          variants={fadeInUp}
                          whileHover={{ y: -4 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card 
                            className="cursor-pointer hover:shadow-xl transition-all duration-300 border-purple-200 dark:border-purple-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden group"
                            onClick={() => router.push(`/contracts/${contract._id}`)}
                          >
                            {/* Gradient top bar */}
                            <div className={`h-1 w-full bg-gradient-to-r ${statusConfig.border.replace('border', 'from').replace('dark:border', 'to')}`} />
                            
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1">
                                  <CardTitle className="text-lg font-semibold line-clamp-1 text-purple-900 dark:text-purple-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    {contract.title}
                                  </CardTitle>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className={`${statusConfig.bg} ${statusConfig.color} border-0 flex items-center gap-1 text-xs`}>
                                      <StatusIcon className="h-3 w-3" />
                                      {statusConfig.label}
                                    </Badge>
                                    <Badge variant="outline" className="border-purple-200 dark:border-purple-800 text-xs flex items-center gap-1">
                                      <TypeIcon className="h-3 w-3" />
                                      {typeConfig.label}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                                    {formatCurrency(contract.amount, contract.currency)}
                                  </p>
                                  <p className="text-xs text-purple-500">Contrat #{contract._id?.slice(-6)}</p>
                                </div>
                              </div>
                            </CardHeader>
                            
                            <CardContent className="space-y-4">
                              <p className="text-sm text-purple-600 dark:text-purple-400 line-clamp-2">
                                {contract.description || "Aucune description"}
                              </p>

                              {/* Parties */}
                              <div className="flex items-center gap-3">
                                <div className="flex-1 flex items-center gap-2 p-2 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg">
                                  <Avatar className="h-8 w-8 ring-2 ring-purple-200 dark:ring-purple-800">
                                    <AvatarImage src={contract.client?.avatar} />
                                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white text-xs">
                                      {contract.client?.name?.charAt(0) || "C"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-purple-500">Client</p>
                                    <p className="text-sm font-medium truncate text-purple-900 dark:text-purple-100">
                                      {contract.client?.name || "Non spécifié"}
                                    </p>
                                  </div>
                                </div>
                                
                                <ArrowRight className="h-4 w-4 text-purple-400" />
                                
                                <div className="flex-1 flex items-center gap-2 p-2 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg">
                                  <Avatar className="h-8 w-8 ring-2 ring-purple-200 dark:ring-purple-800">
                                    <AvatarImage src={contract.freelancer?.avatar} />
                                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs">
                                      {contract.freelancer?.name?.charAt(0) || "F"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-purple-500">Freelancer</p>
                                    <p className="text-sm font-medium truncate text-purple-900 dark:text-purple-100">
                                      {contract.freelancer?.name || "Non spécifié"}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Dates */}
                              <div className="flex items-center justify-between pt-2 border-t border-purple-100 dark:border-purple-800">
                                <div className="flex items-center gap-1 text-xs text-purple-500">
                                  <Calendar className="h-3 w-3" />
                                  <span>Début: {formatDate(contract.startDate)}</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/contracts/${contract._id}`)
                                  }}
                                >
                                  Voir détails
                                  <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}