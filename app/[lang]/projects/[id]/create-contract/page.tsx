// app/[lang]/projects/[id]/create-contract/page.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { 
  Loader2, 
  ArrowLeft, 
  Euro, 
  Calendar, 
  Tag, 
  Clock, 
  User,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Star,
  Briefcase,
  Shield,
  Sparkles,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  Globe,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  Send,
  Eye,
  EyeOff,
  Zap,
  TrendingUp,
  Award,
  Heart,
  Users,
  BarChart3,
  CreditCard,
  Smartphone,
  Laptop,
  Tablet,
  Moon,
  Sun,
  Palette,
  Sparkle,
  Crown,
  Diamond,
  Rocket,
  Gem,
  Target,
  Brain,
  Code,
  HeartHandshake
} from "lucide-react"
import { toast } from "sonner"
import { generateDefaultTerms } from "@/lib/contract-helpers"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

interface Freelancer {
  _id: string
  name: string
  avatar?: string
  title?: string
  rating?: number
  completedProjects?: number
  skills?: string[]
  location?: string
  email?: string
  hourlyRate?: number
  successRate?: number
  responseTime?: string
  languages?: string[]
  badges?: string[]
}

interface Application {
  _id: string
  freelancerId: string
  freelancer?: Freelancer
  coverLetter: string
  proposedBudget: number
  estimatedDuration: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  timeline?: string
  attachments?: string[]
}

interface Project {
  _id: string
  title: string
  description: string
  budget: {
    min: number
    max: number
    type: string
    currency: string
  }
  skills: string[]
  deadline?: string
  status: string
  clientId: any
  client?: {
    _id: string
    name: string
    avatar?: string
    title?: string
  }
}

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const scaleOnHover = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 }
}

export default function CreateContractPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const lang = params.lang as Locale
  const projectId = params.id as string

  const [dict, setDict] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [project, setProject] = useState<Project | null>(null)
  const [selectedFreelancer, setSelectedFreelancer] = useState("")
  const [applications, setApplications] = useState<Application[]>([])
  const [client, setClient] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [formProgress, setFormProgress] = useState(0)
  const [darkMode, setDarkMode] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    currency: "EUR",
    type: "fixed_price",
    startDate: "",
    endDate: "",
    deliverables: [""],
    scopeOfWork: "",
    termsAndConditions: generateDefaultTerms(),
    paymentSchedule: {
      type: "completion",
      milestones: []
    },
    deposit: 30,
    revisionCount: 2,
    warrantyDays: 30,
    confidentiality: true,
    intellectualProperty: "full"
  })

  // Theme management
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setDarkMode(isDark)
  }, [])

  const toggleTheme = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  useEffect(() => {
    if (status === "authenticated" && projectId && dict) {
      fetchProjectAndApplications()
    }
  }, [status, projectId, dict])

  // Calculate form progress
  useEffect(() => {
    const requiredFields = [
      formData.title,
      formData.description,
      formData.amount,
      formData.startDate,
      formData.deliverables.filter(d => d.trim()).length > 0
    ]
    const completed = requiredFields.filter(Boolean).length
    setFormProgress((completed / requiredFields.length) * 100)
  }, [formData])

  const fetchProjectAndApplications = async () => {
    setIsLoading(true)
    try {
      const [projectResponse, applicationsResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/applications`)
      ])
      
      const projectData = await projectResponse.json()
      if (!projectResponse.ok) throw new Error(projectData.error)

      setProject(projectData)
      setClient(projectData.client)

      const applicationsData = await applicationsResponse.json()
      if (applicationsResponse.ok) {
        const acceptedApplications = applicationsData.applications?.filter(
          (app: any) => app.status === "accepted"
        ) || []
        
        const applicationsToShow = acceptedApplications.length > 0 
          ? acceptedApplications 
          : applicationsData.applications || []
        
        setApplications(applicationsToShow)
        if (applicationsToShow.length > 0) {
          setSelectedFreelancer(applicationsToShow[0].freelancer?._id || applicationsToShow[0].freelancerId)
        }
      }

      // Pré-remplir le formulaire
      const today = new Date()
      const defaultEndDate = new Date(today)
      defaultEndDate.setDate(today.getDate() + 30)

      const calculateDefaultAmount = () => {
        if (projectData.budget) {
          const avg = (projectData.budget.min + projectData.budget.max) / 2
          return Math.round(avg)
        }
        return ""
      }

      setFormData(prev => ({
        ...prev,
        title: `Contrat de prestation : ${projectData.title}`,
        description: projectData.description || "",
        amount: calculateDefaultAmount().toString(),
        currency: projectData.budget?.currency || "EUR",
        type: projectData.budget?.type === "hourly" ? "hourly" : "fixed_price",
        startDate: today.toISOString().split('T')[0],
        endDate: defaultEndDate.toISOString().split('T')[0],
        scopeOfWork: `# 📋 Objectif du projet\n${projectData.description || ""}\n\n# 🎯 Livrables principaux\n${projectData.skills?.map(s => `- ${s}`).join("\n") || ""}\n\n# 📅 Planning et jalons\n- Phase 1: Analyse et conception (J1-J5)\n- Phase 2: Développement (J6-J20)\n- Phase 3: Tests et validation (J21-J25)\n- Phase 4: Livraison et documentation (J26-J30)\n\n# 🤝 Modalités de collaboration\n- Réunions hebdomadaires de suivi\n- Communication via la plateforme\n- Rapports d'avancement bi-hebdomadaires\n\n# ✅ Critères d'acceptation\n- Respect des spécifications fonctionnelles\n- Code propre et documenté\n- Tests unitaires et d'intégration\n- Performance et sécurité`,
        deliverables: projectData.skills?.length > 0 
          ? [
              `✅ ${projectData.skills[0]} fonctionnel et optimisé`,
              `✅ Documentation technique complète`,
              `✅ Guide utilisateur détaillé`,
              `✅ Code source commenté`,
              `✅ Tests de performance validés`
            ]
          : [""]
      }))

      // Generate AI suggestion
      if (projectData.skills?.length > 0) {
        setAiSuggestion(`Basé sur les compétences requises (${projectData.skills.slice(0, 3).join(", ")}), je recommande d'inclure une clause de garantie de 30 jours et ${Math.min(projectData.skills.length, 3)} livrables intermédiaires.`)
      }
    } catch (error: any) {
      console.error("Erreur chargement données:", error)
      toast.error(error.message || "Erreur lors du chargement des données")
      router.push(`/${lang}/projects/${projectId}`)
    } finally {
      setIsLoading(false)
    }
  }

  const t = (key: string, fallback: string = key): string => {
    if (!dict?.contracts?.create) return fallback
    const value = dict.contracts.create[key]
    return value || fallback
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFreelancer) {
      toast.error(t("selectFreelancer", "Veuillez sélectionner un freelancer"))
      return
    }

    if (!formData.title.trim()) {
      toast.error(t("titleRequired", "Le titre du contrat est requis"))
      return
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error(t("amountRequired", "Le montant doit être supérieur à 0"))
      return
    }

    const validDeliverables = formData.deliverables.filter(d => d.trim() !== "")
    if (validDeliverables.length === 0) {
      toast.error(t("deliverablesRequired", "Au moins un livrable doit être spécifié"))
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          freelancerId: selectedFreelancer,
          ...formData,
          amount: parseFloat(formData.amount),
          deliverables: validDeliverables
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(t("success", "✨ Contrat créé avec succès !"))
        router.push(`/${lang}/contracts/${data.contractId}`)
      } else {
        toast.error(data.error || t("error", "Erreur lors de la création du contrat"))
      }
    } catch (error) {
      console.error("Erreur création contrat:", error)
      toast.error(t("error", "Une erreur est survenue lors de la création du contrat"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const addDeliverable = () => {
    setFormData({ ...formData, deliverables: [...formData.deliverables, ""] })
  }

  const removeDeliverable = (index: number) => {
    const newDeliverables = formData.deliverables.filter((_, i) => i !== index)
    setFormData({ ...formData, deliverables: newDeliverables })
  }

  const updateDeliverable = (index: number, value: string) => {
    const newDeliverables = [...formData.deliverables]
    newDeliverables[index] = value
    setFormData({ ...formData, deliverables: newDeliverables })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'mg' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getApplicationStatusBadge = (status: string) => {
    const config = {
      accepted: { className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle, label: t("accepted", "Accepté") },
      pending: { className: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock, label: t("pending", "En attente") },
      rejected: { className: "bg-rose-100 text-rose-700 border-rose-200", icon: XCircle, label: t("rejected", "Rejeté") }
    }
    const c = config[status as keyof typeof config] || config.pending
    const Icon = c.icon
    return <Badge className={`${c.className} text-xs font-medium px-2 py-1 flex items-center gap-1`}><Icon className="h-3 w-3" /> {c.label}</Badge>
  }

  const isClient = () => {
    if (!session?.user?.id || !project?.clientId) return false
    const userId = session.user.id
    const clientId = typeof project.clientId === 'object' && project.clientId !== null
      ? (project.clientId._id || project.clientId).toString()
      : project.clientId.toString()
    return userId === clientId
  }

  const selectedFreelancerData = useMemo(() => {
    return applications.find(app => 
      (app.freelancer?._id || app.freelancerId) === selectedFreelancer
    )?.freelancer
  }, [applications, selectedFreelancer])

  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Chargement...</p>
        </motion.div>
      </div>
    )
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-16 w-16 text-purple-500 mx-auto mb-4" />
          </motion.div>
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">{t("loading", "Préparation de votre contrat")}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("loadingDesc", "Nous rassemblons toutes les informations nécessaires...")}</p>
          <Progress value={45} className="mt-4 w-64 mx-auto" />
        </motion.div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push(`/${lang}/auth/signin?callbackUrl=/${lang}/projects/${projectId}/create-contract`)
    return null
  }

  if (!project) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 py-8"
      >
        <div className="container max-w-7xl mx-auto px-4">
          <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-indigo-200 dark:border-indigo-800 shadow-xl">
            <CardContent className="py-12 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {t("projectNotFound", "Projet non trouvé")}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {t("projectNotFoundDesc", "Le projet que vous recherchez n'existe pas ou vous n'y avez pas accès.")}
              </p>
              <Button onClick={() => router.push(`/${lang}/dashboard`)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("backToDashboard", "Retour au tableau de bord")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    )
  }

  if (!isClient()) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 py-8"
      >
        <div className="container max-w-7xl mx-auto px-4">
          <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-indigo-200 dark:border-indigo-800 shadow-xl">
            <CardContent className="py-12 text-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <XCircle className="h-16 w-16 text-rose-500 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {t("unauthorized", "Accès non autorisé")}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {t("unauthorizedDesc", "Vous devez être le propriétaire de ce projet pour créer un contrat.")}
              </p>
              <Button onClick={() => router.push(`/${lang}/projects/${projectId}`)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("backToProject", "Retour au projet")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
      {/* Floating Theme Toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 z-50 p-3 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-indigo-200 dark:border-indigo-700 hover:shadow-xl transition-shadow"
      >
        {darkMode ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-600" />}
      </motion.button>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Navigation with animation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-wrap items-center gap-4 mb-8"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${lang}/projects/${projectId}`)}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 group"
          >
            <motion.div
              whileHover={{ x: -3 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
            </motion.div>
            {t("backToProject", "Retour au projet")}
          </Button>
          <div className="h-6 w-px bg-purple-200 dark:bg-purple-800" />
          <span className="text-sm text-purple-600 dark:text-purple-400 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {t("createContract", "Création de contrat intelligente")}
          </span>
        </motion.div>

        {/* Header with animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="p-2 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/25"
            >
              <Diamond className="h-6 w-6 text-white" />
            </motion.div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 dark:from-indigo-300 dark:via-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
              {t("title", "Créer un Contrat Professionnel")}
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 ml-11">
            {t("subtitle", "Établissez un contrat formel et sécurisé pour le projet")}{" "}
            <span className="font-semibold text-purple-600 dark:text-purple-400">{project.title}</span>
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">{t("completion", "Complétion du contrat")}</span>
            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">{Math.round(formProgress)}%</span>
          </div>
          <Progress value={formProgress} className="h-2 bg-purple-100 dark:bg-purple-900" />
        </motion.div>

        {/* Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 mb-6"
        >
          {[
            { id: "details", icon: FileText, label: t("details", "Détails") },
            { id: "deliverables", icon: Target, label: t("deliverables", "Livrables") },
            { id: "scope", icon: Brain, label: t("scope", "Portée") },
            { id: "legal", icon: Shield, label: t("legal", "Légal") }
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                    : "bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/80"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </motion.button>
            )
          })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Project Summary & Freelancers */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Project Summary Card with 3D effect */}
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-20" />
              <Card className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-indigo-200 dark:border-indigo-800 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                    <Gem className="h-5 w-5" />
                    {t("projectSummary", "Aperçu du Projet")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 mb-2">{project.title}</h3>
                    <Badge className={project.status === "open" 
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                      : "bg-slate-100 text-slate-700 border-slate-200"
                    }>
                      {project.status === "open" ? "🔓 Ouvert" : project.status}
                    </Badge>
                  </div>

                  <Separator className="bg-indigo-100 dark:bg-indigo-800" />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-xl p-3">
                      <DollarSign className="h-4 w-4 text-indigo-600 mb-1" />
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {project.budget?.min} - {project.budget?.max}
                      </p>
                      <p className="text-xs text-slate-500">{project.budget?.currency}</p>
                    </div>
                    {project.deadline && (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 rounded-xl p-3">
                        <Calendar className="h-4 w-4 text-amber-600 mb-1" />
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {formatDate(project.deadline)}
                        </p>
                        <p className="text-xs text-slate-500">{t("deadline", "Date limite")}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Available Freelancers Card */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-indigo-200 dark:border-indigo-800 shadow-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                    <Users className="h-5 w-5" />
                    {t("freelancers", "Talents Disponibles")}
                    <Badge variant="outline" className="ml-auto border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30">
                      {applications.length} candidat{applications.length > 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {applications.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <div className="h-20 w-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-10 w-10 text-indigo-400" />
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mb-2">{t("noFreelancers", "Aucun candidat disponible")}</p>
                      <p className="text-sm text-slate-500">
                        {t("acceptApplicationFirst", "Acceptez d'abord une candidature")}
                      </p>
                    </motion.div>
                  ) : (
                    <ScrollArea className="max-h-[600px] pr-2">
                      <AnimatePresence>
                        {applications.map((application, idx) => {
                          const freelancer = application.freelancer || { _id: application.freelancerId, name: "Freelancer" }
                          const isSelected = selectedFreelancer === freelancer._id
                          
                          return (
                            <motion.div
                              key={application._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              whileHover={{ scale: 1.01 }}
                              className={`p-4 border rounded-xl cursor-pointer transition-all mb-3 ${
                                isSelected
                                  ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/30 shadow-lg"
                                  : "border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20"
                              }`}
                              onClick={() => setSelectedFreelancer(freelancer._id)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="relative">
                                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                    {freelancer.name?.charAt(0).toUpperCase() || "F"}
                                  </div>
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute -top-1 -right-1 h-6 w-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                                    >
                                      <CheckCircle className="h-4 w-4 text-white" />
                                    </motion.div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start mb-1">
                                    <div>
                                      <p className="font-bold text-slate-900 dark:text-slate-100">
                                        {freelancer.name}
                                      </p>
                                      {freelancer.title && (
                                        <p className="text-sm text-slate-500">{freelancer.title}</p>
                                      )}
                                    </div>
                                    {getApplicationStatusBadge(application.status)}
                                  </div>

                                  {freelancer.rating && (
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                          <Star key={i} className={`h-3 w-3 ${i < Math.floor(freelancer.rating) ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
                                        ))}
                                      </div>
                                      <span className="text-xs text-slate-500">{freelancer.rating.toFixed(1)}</span>
                                      <span className="text-xs text-slate-400">•</span>
                                      <span className="text-xs text-slate-500">{freelancer.completedProjects || 0} {t("projects", "projets")}</span>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-2">
                                      <p className="text-xs text-slate-500">{t("proposedBudget", "Budget proposé")}</p>
                                      <p className="font-bold text-indigo-700 dark:text-indigo-300">
                                        {application.proposedBudget} {project.budget?.currency || "EUR"}
                                      </p>
                                    </div>
                                    <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-2">
                                      <p className="text-xs text-slate-500">{t("estimatedDuration", "Durée estimée")}</p>
                                      <p className="font-bold text-purple-700 dark:text-purple-300">
                                        {application.estimatedDuration || "N/A"}
                                      </p>
                                    </div>
                                  </div>

                                  {application.coverLetter && (
                                    <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-800">
                                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                        <MessageSquare className="h-3 w-3" />
                                        {t("freelancerMessage", "Motivation")}
                                      </p>
                                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                        {application.coverLetter}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Assistant Card */}
            {showAIAssistant && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative"
              >
                <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Brain className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-1">🤖 Assistant IA</p>
                        <p className="text-sm text-white/90">{aiSuggestion}</p>
                      </div>
                      <button
                        onClick={() => setShowAIAssistant(false)}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>

          {/* Right Column - Contract Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contract Details Card */}
              <motion.div
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                className="relative"
              >
                <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-indigo-200 dark:border-indigo-800 shadow-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {t("contractDetails", "Détails du Contrat")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <motion.div variants={fadeInUp}>
                      <Label className="text-indigo-700 dark:text-indigo-300 mb-2 block font-semibold">
                        {t("contractTitle", "Titre du Contrat")} <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        required
                        placeholder="Ex: Contrat de développement d'application web"
                        className="border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </motion.div>

                    <motion.div variants={fadeInUp}>
                      <Label className="text-indigo-700 dark:text-indigo-300 mb-2 block font-semibold">
                        {t("description", "Description détaillée")} <span className="text-rose-500">*</span>
                      </Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={4}
                        required
                        placeholder="Décrivez en détail le travail à réaliser..."
                        className="border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </motion.div>

                    <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-indigo-700 dark:text-indigo-300 mb-2 block font-semibold">
                          {t("amount", "Montant")} <span className="text-rose-500">*</span>
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400" />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            required
                            placeholder="0.00"
                            className="pl-9 border-indigo-200 dark:border-indigo-800"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-indigo-700 dark:text-indigo-300 mb-2 block font-semibold">
                          {t("currency", "Devise")}
                        </Label>
                        <select
                          value={formData.currency}
                          onChange={(e) => setFormData({...formData, currency: e.target.value})}
                          className="w-full border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="EUR">EUR (€)</option>
                          <option value="USD">USD ($)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="MGA">MGA (Ar)</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-indigo-700 dark:text-indigo-300 mb-2 block font-semibold">
                          {t("contractType", "Type de contrat")}
                        </Label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value})}
                          className="w-full border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="fixed_price">💰 Prix Fixe</option>
                          <option value="hourly">⏱️ À l'Heure</option>
                          <option value="milestone">🎯 Par Jalons</option>
                        </select>
                      </div>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-indigo-700 dark:text-indigo-300 mb-2 block font-semibold">
                          {t("startDate", "Date de début")} <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                          required
                          min={new Date().toISOString().split('T')[0]}
                          className="border-indigo-200 dark:border-indigo-800"
                        />
                      </div>
                      <div>
                        <Label className="text-indigo-700 dark:text-indigo-300 mb-2 block font-semibold">
                          {t("endDate", "Date de fin")}
                        </Label>
                        <Input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                          min={formData.startDate || new Date().toISOString().split('T')[0]}
                          className="border-indigo-200 dark:border-indigo-800"
                        />
                      </div>
                    </motion.div>

                    {/* Advanced Options */}
                    <motion.div variants={fadeInUp}>
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                          {t("advancedOptions", "Options avancées")}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-slate-600 dark:text-slate-400 mb-1 block">
                            {t("deposit", "Acompte (%)")}
                          </Label>
                          <div className="flex items-center gap-3">
                            <Slider
                              value={[formData.deposit]}
                              onValueChange={(val) => setFormData({...formData, deposit: val[0]})}
                              min={0}
                              max={50}
                              step={5}
                              className="flex-1"
                            />
                            <span className="text-sm font-medium text-indigo-600 w-12">{formData.deposit}%</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm text-slate-600 dark:text-slate-400 mb-1 block">
                            {t("revisions", "Nombre de révisions")}
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={formData.revisionCount}
                            onChange={(e) => setFormData({...formData, revisionCount: parseInt(e.target.value)})}
                            className="border-indigo-200 dark:border-indigo-800"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-slate-600 dark:text-slate-400 mb-1 block">
                            {t("warranty", "Garantie (jours)")}
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            max="180"
                            value={formData.warrantyDays}
                            onChange={(e) => setFormData({...formData, warrantyDays: parseInt(e.target.value)})}
                            className="border-indigo-200 dark:border-indigo-800"
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg">
                          <span className="text-sm text-slate-700 dark:text-slate-300">{t("confidentiality", "Clause de confidentialité")}</span>
                          <Switch
                            checked={formData.confidentiality}
                            onCheckedChange={(checked) => setFormData({...formData, confidentiality: checked})}
                          />
                        </div>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Deliverables Card - Visible based on activeTab or always for better UX */}
              {(activeTab === "deliverables" || true) && (
                <motion.div
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                >
                  <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-indigo-200 dark:border-indigo-800 shadow-xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        {t("deliverables", "Livrables attendus")} <span className="text-rose-500">*</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <AnimatePresence>
                        {formData.deliverables.map((deliverable, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex gap-3 items-start"
                          >
                            <div className="flex items-center gap-2 mt-2 flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                                <span className="text-white text-sm font-bold">{index + 1}</span>
                              </div>
                              {index > 0 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeDeliverable(index)}
                                  className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <div className="flex-1">
                              <Textarea
                                value={deliverable}
                                onChange={(e) => updateDeliverable(index, e.target.value)}
                                placeholder={`📦 ${t("deliverablePlaceholder", "Décrivez le livrable")} ${index + 1}...`}
                                rows={2}
                                required={index === 0}
                                className="border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 focus:ring-indigo-500 resize-y"
                              />
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addDeliverable}
                        className="w-full border-dashed border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 group"
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          {t("addDeliverable", "Ajouter un livrable")}
                        </motion.div>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Scope of Work Card */}
              {(activeTab === "scope" || true) && (
                <motion.div
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                >
                  <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-indigo-200 dark:border-indigo-800 shadow-xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        {t("scopeOfWork", "Portée du travail")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={formData.scopeOfWork}
                        onChange={(e) => setFormData({...formData, scopeOfWork: e.target.value})}
                        rows={12}
                        className="border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm resize-y"
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Terms and Conditions Card */}
              {(activeTab === "legal" || true) && (
                <motion.div
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                >
                  <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-indigo-200 dark:border-indigo-800 shadow-xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        {t("termsAndConditions", "Termes et conditions")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={formData.termsAndConditions}
                        onChange={(e) => setFormData({...formData, termsAndConditions: e.target.value})}
                        rows={12}
                        className="border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm resize-y"
                      />
                      <div className="mt-4 p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        <p className="text-sm text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          <span className="font-medium">{t("tip", "💡 Conseil juridique :")}</span>
                          {t("termsTip", "Ces termes sont générés par défaut. Consultez un avocat pour des contrats complexes ou de montant élevé.")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Preview Button */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 group"
                >
                  {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showPreview ? t("hidePreview", "Masquer l'aperçu") : t("showPreview", "Aperçu du contrat")}
                </Button>
              </motion.div>

              <AnimatePresence>
                {showPreview && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {t("preview", "Aperçu du contrat")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                          <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 mb-2">{formData.title || "Titre du contrat"}</h3>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-slate-500">Montant</p>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{formData.amount} {formData.currency}</p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Type</p>
                              <p className="font-semibold text-slate-900 dark:text-slate-100 capitalize">{formData.type.replace('_', ' ')}</p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Période</p>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{formatDate(formData.startDate)} - {formData.endDate ? formatDate(formData.endDate) : "À définir"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Freelancer</p>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedFreelancerData?.name || "Non sélectionné"}</p>
                            </div>
                          </div>
                          <Separator className="my-3" />
                          <div>
                            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">📦 Livrables</p>
                            <ul className="list-disc list-inside space-y-1">
                              {formData.deliverables.filter(d => d.trim()).map((d, i) => (
                                <li key={i} className="text-sm text-slate-600 dark:text-slate-400">{d}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Section */}
              <motion.div
                whileHover={{ y: -2 }}
                className="sticky bottom-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-4 border border-indigo-200 dark:border-indigo-800 rounded-xl shadow-xl"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Diamond className="h-4 w-4 text-indigo-500" />
                      {t("contractFor", "Contrat pour")} {project.title}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      {selectedFreelancerData ? (
                        <>
                          <User className="h-3 w-3" />
                          <span>{selectedFreelancerData.name}</span>
                          <span>•</span>
                          <DollarSign className="h-3 w-3" />
                          <span>{formData.amount || "0"} {formData.currency}</span>
                        </>
                      ) : (
                        <span className="text-amber-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {t("selectFreelancer", "Sélectionnez un freelancer")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push(`/${lang}/projects/${projectId}`)}
                      disabled={isSubmitting}
                      className="border-indigo-200 hover:bg-indigo-50"
                    >
                      {t("cancel", "Annuler")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || applications.length === 0 || !selectedFreelancer}
                      className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 group"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t("creating", "Création en cours...")}
                        </>
                      ) : (
                        <>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="flex items-center gap-2"
                          >
                            <Send className="h-4 w-4" />
                            {t("create", "Créer le contrat")}
                          </motion.div>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {applications.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg"
                  >
                    <p className="text-sm text-rose-800 dark:text-rose-400 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      {t("noFreelancerWarning", "Vous ne pouvez pas créer de contrat sans freelancer. Acceptez d'abord une candidature.")}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}