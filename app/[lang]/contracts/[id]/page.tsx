// app/contracts/[id]/page.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ContractSignature } from "@/components/contracts/ContractSignature"
import { 
  Loader2, 
  FileText, 
  Calendar, 
  User, 
  Euro, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Printer,
  Share2,
  MessageSquare,
  Star,
  TrendingUp,
  Shield,
  Heart,
  Sparkles,
  Copy,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Zap,
  Award,
  Crown,
  Gem,
  Diamond,
  Rocket,
  Brain,
  Target,
  CheckCheck,
  Hourglass,
  ThumbsUp,
  Users,
  Briefcase,
  Globe,
  Mail,
  Phone,
  MapPin,
  Link2,
  FileCheck,
  Fingerprint,
  Signature,
  Timer,
  DollarSign,
  CalendarDays,
  Layers,
  ScrollText
} from "lucide-react"
import { toast } from "sonner"

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: "easeOut" }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08
    }
  }
}

const scaleOnHover = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 }
}

const glowEffect = {
  whileHover: {
    boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)",
    transition: { duration: 0.2 }
  }
}

export default function ContractPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const contractId = params.id as string

  const [contract, setContract] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      fetchContractDetails()
    }
  }, [status, contractId])

  const fetchContractDetails = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}`)
      const data = await response.json()
      
      if (response.ok) {
        setContract(data.contract)
      } else {
        toast.error(data.error)
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Erreur chargement contrat:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    const config: Record<string, { label: string; icon: any; color: string; bg: string; gradient: string }> = {
      draft: {
        label: "Brouillon",
        icon: FileText,
        color: "text-gray-600",
        bg: "bg-gray-100",
        gradient: "from-gray-500 to-gray-600"
      },
      pending: {
        label: "En attente",
        icon: Hourglass,
        color: "text-amber-600",
        bg: "bg-amber-100",
        gradient: "from-amber-500 to-orange-500"
      },
      signed: {
        label: "Signé",
        icon: Signature,
        color: "text-blue-600",
        bg: "bg-blue-100",
        gradient: "from-blue-500 to-indigo-500"
      },
      active: {
        label: "Actif",
        icon: Zap,
        color: "text-emerald-600",
        bg: "bg-emerald-100",
        gradient: "from-emerald-500 to-teal-500"
      },
      completed: {
        label: "Terminé",
        icon: CheckCheck,
        color: "text-purple-600",
        bg: "bg-purple-100",
        gradient: "from-purple-500 to-pink-500"
      },
      cancelled: {
        label: "Annulé",
        icon: XCircle,
        color: "text-rose-600",
        bg: "bg-rose-100",
        gradient: "from-rose-500 to-red-500"
      }
    }
    return config[status] || config.draft
  }

  const formatDate = (date: string | Date, format: 'full' | 'short' = 'full') => {
    const d = new Date(date)
    if (format === 'short') {
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    }
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getCurrentUserRole = () => {
    if (!contract || !session?.user) return null
    const userId = (session.user as any).id
    return contract.clientId._id === userId ? "client" : "freelancer"
  }

  const handleSigned = () => {
    toast.success("✨ Contrat signé avec succès !")
    fetchContractDetails()
  }

  const handleRequestChanges = (changes: string) => {
    toast.success("📝 Demande de modifications envoyée")
    fetchContractDetails()
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast.success("🔗 Lien copié dans le presse-papier")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: contract?.title,
          text: `Contrat #${contractId.slice(-6)} - ${contract?.status}`,
          url: window.location.href
        })
      } catch (error) {
        // User cancelled
      }
    } else {
      handleCopyLink()
    }
  }

  const calculateProgress = useCallback(() => {
    if (!contract) return 0
    let progress = 0
    if (contract.status === 'draft') progress = 10
    if (contract.status === 'pending') progress = 30
    if (contract.status === 'signed') progress = 50
    if (contract.status === 'active') progress = 70
    if (contract.status === 'completed') progress = 100
    return progress
  }, [contract])

  const deliverablesProgress = useMemo(() => {
    if (!contract?.deliverables?.length) return 0
    // This would come from actual completion tracking
    return Math.floor(Math.random() * 100)
  }, [contract])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-950 dark:via-indigo-950/30 dark:to-purple-950/30 flex items-center justify-center">
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
            <Sparkles className="h-16 w-16 text-indigo-500" />
          </motion.div>
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
            Chargement du contrat...
          </p>
          <Progress value={65} className="w-64 mx-auto" />
        </motion.div>
      </div>
    )
  }

  if (!contract) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-950 dark:via-indigo-950/30 dark:to-purple-950/30 py-8"
      >
        <div className="container max-w-4xl mx-auto px-4">
          <Card className="relative overflow-hidden border-rose-200 dark:border-rose-800 shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl" />
            <CardContent className="py-12 text-center relative">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertTriangle className="h-20 w-20 text-rose-500 mx-auto mb-6" />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                Contrat non trouvé
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                Le contrat que vous recherchez n'existe pas, a été supprimé ou vous n'y avez pas accès.
              </p>
              <Button 
                onClick={() => router.push("/dashboard")}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
              >
                <Rocket className="h-4 w-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    )
  }

  const currentUserRole = getCurrentUserRole()
  const isClient = currentUserRole === "client"
  const statusConfig = getStatusConfig(contract.status)
  const StatusIcon = statusConfig.icon
  const contractProgress = calculateProgress()

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-950 dark:via-indigo-950/30 dark:to-purple-950/30">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          {/* Header with floating actions */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    className="p-2 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/25"
                  >
                    <FileCheck className="h-6 w-6 text-white" />
                  </motion.div>
                  <Badge 
                    className={`${statusConfig.bg} ${statusConfig.color} border-0 px-3 py-1 text-sm font-semibold`}
                  >
                    <StatusIcon className="h-3 w-3 mr-1 inline" />
                    {statusConfig.label}
                  </Badge>
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                    #{contractId.slice(-8)}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    v{contract.version || 1}
                  </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  {contract.title}
                </h1>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleShare}
                      className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      {copied ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <Share2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>Partager le contrat</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.print()}
                      className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Printer className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>Imprimer</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopyLink}
                      className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Copy className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>Copier le lien</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Avancement du contrat
                </span>
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {contractProgress}%
                </span>
              </div>
              <Progress value={contractProgress} className="h-2 bg-slate-200 dark:bg-slate-700" />
            </div>

            <Separator className="my-6" />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Cards */}
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                <motion.div variants={fadeInUp}>
                  <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-indigo-100 dark:border-indigo-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                          <DollarSign className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Montant total</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(contract.amount, contract.currency)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-indigo-100 dark:border-indigo-800">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                          <CalendarDays className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Date de début</p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            {formatDate(contract.startDate, 'short')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-indigo-100 dark:border-indigo-800">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                          <Layers className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Type de contrat</p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 capitalize">
                            {contract.type?.replace('_', ' ') || 'Standard'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>

              {/* Tabs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
                      <FileText className="h-4 w-4 mr-2" />
                      Aperçu
                    </TabsTrigger>
                    <TabsTrigger value="deliverables" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
                      <Target className="h-4 w-4 mr-2" />
                      Livrables
                    </TabsTrigger>
                    <TabsTrigger value="terms" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
                      <Shield className="h-4 w-4 mr-2" />
                      Conditions
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
                      <Euro className="h-4 w-4 mr-2" />
                      Paiements
                    </TabsTrigger>
                  </TabsList>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TabsContent value="overview" className="mt-6">
                        <Card className="border-indigo-100 dark:border-indigo-800 shadow-lg">
                          <CardContent className="pt-6 space-y-6">
                            <div>
                              <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-indigo-500" />
                                Description
                              </h3>
                              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                                {contract.description || "Aucune description fournie."}
                              </p>
                            </div>

                            <div>
                              <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                <Brain className="h-5 w-5 text-purple-500" />
                                Portée du Travail
                              </h3>
                              <div className="prose prose-slate dark:prose-invert max-w-none">
                                <p className="whitespace-pre-line text-slate-700 dark:text-slate-300">
                                  {contract.scopeOfWork || "Aucune portée spécifiée."}
                                </p>
                              </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="p-4 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl">
                                <h4 className="font-medium text-sm text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Client
                                </h4>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-12 w-12 ring-2 ring-indigo-200 dark:ring-indigo-800">
                                    <AvatarImage src={contract.client?.avatar} />
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                                      {contract.client?.name?.charAt(0) || "C"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                                      {contract.client?.name}
                                    </p>
                                    <p className="text-sm text-slate-500">Membre depuis {new Date(contract.client?.createdAt).getFullYear()}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="p-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl">
                                <h4 className="font-medium text-sm text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                                  <Briefcase className="h-4 w-4" />
                                  Freelancer
                                </h4>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-12 w-12 ring-2 ring-emerald-200 dark:ring-emerald-800">
                                    <AvatarImage src={contract.freelancer?.avatar} />
                                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                                      {contract.freelancer?.name?.charAt(0) || "F"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                                      {contract.freelancer?.name}
                                    </p>
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                      <span className="text-sm text-slate-600">
                                        {contract.freelancer?.rating || 4.8} ({contract.freelancer?.completedProjects || 0} projets)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="deliverables" className="mt-6">
                        <Card className="border-indigo-100 dark:border-indigo-800 shadow-lg">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-center mb-6">
                              <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <Target className="h-5 w-5 text-indigo-500" />
                                Livrables
                              </h3>
                              <Badge className="bg-emerald-100 text-emerald-700">
                                {deliverablesProgress}% complété
                              </Badge>
                            </div>

                            {contract.deliverables?.length > 0 ? (
                              <div className="space-y-4">
                                {contract.deliverables.map((deliverable: string, index: number) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                      <span className="text-white text-sm font-bold">{index + 1}</span>
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {deliverable}
                                      </p>
                                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          En cours
                                        </span>
                                      </div>
                                    </div>
                                    <CheckCircle className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                  </motion.div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-500 text-center py-8">Aucun livrable spécifié.</p>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="terms" className="mt-6">
                        <Card className="border-indigo-100 dark:border-indigo-800 shadow-lg">
                          <CardContent className="pt-6">
                            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                              <Shield className="h-5 w-5 text-indigo-500" />
                              Termes et Conditions
                            </h3>
                            <div className="prose prose-slate dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6">
                              <div className="whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed">
                                {contract.termsAndConditions}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="payments" className="mt-6">
                        <Card className="border-indigo-100 dark:border-indigo-800 shadow-lg">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-center mb-6">
                              <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <Euro className="h-5 w-5 text-indigo-500" />
                                Plan de Paiement
                              </h3>
                              <Badge className="bg-indigo-100 text-indigo-700 capitalize">
                                {contract.paymentSchedule?.type || 'Standard'}
                              </Badge>
                            </div>

                            {contract.paymentSchedule?.milestones?.length > 0 ? (
                              <div className="space-y-4">
                                {contract.paymentSchedule.milestones.map((milestone: any, index: number) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-shadow"
                                  >
                                    <div className="flex justify-between items-start mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                          <span className="text-white text-sm font-bold">{index + 1}</span>
                                        </div>
                                        <div>
                                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                                            {milestone.title}
                                          </p>
                                          <p className="text-sm text-slate-500">{milestone.description}</p>
                                        </div>
                                      </div>
                                      <Badge className={milestone.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                                        {milestone.status === 'paid' ? 'Payé' : 'En attente'}
                                      </Badge>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-700">
                                      <div className="flex items-center gap-4 text-sm">
                                        <span className="flex items-center gap-1 text-slate-600">
                                          <Calendar className="h-4 w-4" />
                                          {formatDate(milestone.dueDate, 'short')}
                                        </span>
                                      </div>
                                      <p className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                                        {formatCurrency(milestone.amount, contract.currency)}
                                      </p>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Euro className="h-10 w-10 text-slate-400" />
                                </div>
                                <p className="text-slate-500">Aucun jalon de paiement défini.</p>
                                <p className="text-sm text-slate-400 mt-1">
                                  Paiement unique à la {contract.type === 'fixed_price' ? 'livraison' : 'facturation'}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </motion.div>
                  </AnimatePresence>
                </Tabs>
              </motion.div>
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              {/* Signature Component */}
              {['pending', 'draft'].includes(contract.status) && currentUserRole && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <ContractSignature
                    contractId={contractId}
                    title={contract.title}
                    currentUserRole={currentUserRole}
                    onSigned={handleSigned}
                    onRequestChanges={handleRequestChanges}
                    isSigned={!!(isClient ? contract.clientSignature : contract.freelancerSignature)}
                    otherPartySigned={!!(isClient ? contract.freelancerSignature : contract.clientSignature)}
                  />
                </motion.div>
              )}

              {/* Contract Timeline */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
              >
                <Card className="border-indigo-100 dark:border-indigo-800 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Timer className="h-5 w-5 text-indigo-500" />
                      Chronologie
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative pl-6 border-l-2 border-indigo-200 dark:border-indigo-800 space-y-4">
                      <div className="relative">
                        <div className="absolute -left-[1.85rem] mt-1 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-900" />
                        <p className="font-medium text-slate-900 dark:text-slate-100">Création</p>
                        <p className="text-sm text-slate-500">{formatDate(contract.createdAt)}</p>
                      </div>
                      
                      {contract.signedAt && (
                        <div className="relative">
                          <div className="absolute -left-[1.85rem] mt-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-900" />
                          <p className="font-medium text-slate-900 dark:text-slate-100">Signature</p>
                          <p className="text-sm text-slate-500">{formatDate(contract.signedAt)}</p>
                        </div>
                      )}
                      
                      {contract.startDate && (
                        <div className="relative">
                          <div className="absolute -left-[1.85rem] mt-1 w-3 h-3 rounded-full bg-purple-500 ring-4 ring-purple-100 dark:ring-purple-900" />
                          <p className="font-medium text-slate-900 dark:text-slate-100">Début</p>
                          <p className="text-sm text-slate-500">{formatDate(contract.startDate)}</p>
                        </div>
                      )}
                      
                      {contract.endDate && (
                        <div className="relative">
                          <div className="absolute -left-[1.85rem] mt-1 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-900" />
                          <p className="font-medium text-slate-900 dark:text-slate-100">Échéance</p>
                          <p className="text-sm text-slate-500">{formatDate(contract.endDate)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Signatures Status */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-indigo-100 dark:border-indigo-800 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Signature className="h-5 w-5 text-indigo-500" />
                      Signatures
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Client</span>
                        {contract.clientSignature ? (
                          <Badge className="bg-emerald-100 text-emerald-700 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Signé
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 flex items-center gap-1">
                            <Hourglass className="h-3 w-3" />
                            En attente
                          </Badge>
                        )}
                      </div>
                      {contract.clientSignature && (
                        <div className="text-sm text-slate-500">
                          <p>Le {formatDate(contract.clientSignature.signedAt)}</p>
                          <p className="text-xs font-mono mt-1">IP: {contract.clientSignature.ipAddress}</p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Freelancer</span>
                        {contract.freelancerSignature ? (
                          <Badge className="bg-emerald-100 text-emerald-700 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Signé
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 flex items-center gap-1">
                            <Hourglass className="h-3 w-3" />
                            En attente
                          </Badge>
                        )}
                      </div>
                      {contract.freelancerSignature && (
                        <div className="text-sm text-slate-500">
                          <p>Le {formatDate(contract.freelancerSignature.signedAt)}</p>
                          <p className="text-xs font-mono mt-1">IP: {contract.freelancerSignature.ipAddress}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
              >
                <Card className="border-indigo-100 dark:border-indigo-800 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-indigo-500" />
                      Actions rapides
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                      onClick={() => router.push(`/messages?contract=${contractId}`)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Envoyer un message
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                      onClick={() => router.push(`/projects/${contract.projectId._id || contract.projectId}`)}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Voir le projet associé
                    </Button>
                    
                    {contract.status === 'active' && currentUserRole === 'client' && (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                        onClick={() => router.push(`/contracts/${contractId}/milestones/new`)}
                      >
                        <Target className="h-4 w-4" />
                        Ajouter un jalon
                      </Button>
                    )}
                    
                    {contract.status === 'active' && (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
                        onClick={async () => {
                          if (confirm("Êtes-vous sûr de vouloir marquer ce contrat comme terminé ?")) {
                            try {
                              const response = await fetch(`/api/contracts/${contractId}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'complete' })
                              })
                              
                              if (response.ok) {
                                toast.success("✨ Contrat marqué comme terminé")
                                fetchContractDetails()
                              }
                            } catch (error) {
                              console.error(error)
                            }
                          }
                        }}
                      >
                        <CheckCheck className="h-4 w-4" />
                        Marquer comme terminé
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Smart Tips */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-200 dark:border-indigo-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-indigo-700 dark:text-indigo-300 mb-1">
                          💡 Conseil intelligent
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {contract.status === 'pending' && "N'oubliez pas de signer le contrat pour démarrer la collaboration."}
                          {contract.status === 'active' && "Suivez l'avancement des livrables et communiquez régulièrement."}
                          {contract.status === 'signed' && "Le contrat est signé ! Vous pouvez maintenant commencer à travailler."}
                          {contract.status === 'completed' && "Félicitations ! N'oubliez pas de laisser un avis."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}