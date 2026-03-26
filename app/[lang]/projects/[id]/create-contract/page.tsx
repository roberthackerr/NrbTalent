// app/[lang]/projects/[id]/create-contract/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  EyeOff
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
  clientId: string
  client?: {
    _id: string
    name: string
    avatar?: string
    title?: string
  }
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
    }
  })

  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  useEffect(() => {
    if (status === "authenticated" && projectId && dict) {
      fetchProjectAndApplications()
    }
  }, [status, projectId, dict])

  const fetchProjectAndApplications = async () => {
    setIsLoading(true)
    try {
      // Récupérer le projet
      const projectResponse = await fetch(`/api/projects/${projectId}`)
      const projectData = await projectResponse.json()
      
      if (!projectResponse.ok) {
        throw new Error(projectData.error || "Erreur lors du chargement du projet")
      }

      setProject(projectData)
      setClient(projectData.client)

      // Récupérer les candidatures
      const applicationsResponse = await fetch(`/api/projects/${projectId}/applications`)
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
        title: projectData.title ? `Contrat pour ${projectData.title}` : "",
        description: projectData.description || "",
        amount: calculateDefaultAmount().toString(),
        currency: projectData.budget?.currency || "EUR",
        type: projectData.budget?.type === "hourly" ? "hourly" : "fixed_price",
        startDate: today.toISOString().split('T')[0],
        endDate: defaultEndDate.toISOString().split('T')[0],
        scopeOfWork: projectData.description || "",
        deliverables: projectData.skills?.length > 0 
          ? [
              `Développement des fonctionnalités principales`,
              `Implémentation des spécifications techniques`,
              `Tests et validation de qualité`,
              `Documentation et livraison`
            ]
          : [""]
      }))

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

    if (!formData.startDate) {
      toast.error(t("startDateRequired", "La date de début est requise"))
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
          deliverables: validDeliverables,
          paymentSchedule: formData.paymentSchedule || {
            type: formData.type === "fixed_price" ? "completion" : "hourly",
            milestones: []
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(t("success", "Contrat créé avec succès !"))
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
      accepted: { className: "bg-emerald-100 text-emerald-700 border-emerald-200", label: t("accepted", "Accepté") },
      pending: { className: "bg-amber-100 text-amber-700 border-amber-200", label: t("pending", "En attente") },
      rejected: { className: "bg-rose-100 text-rose-700 border-rose-200", label: t("rejected", "Rejeté") }
    }
    const c = config[status as keyof typeof config] || config.pending
    return <Badge className={`${c.className} text-xs font-medium px-2 py-1`}>{c.label}</Badge>
  }

  const isClient = () => {
    if (!session?.user?.id || !project?.clientId) return false
    const userId = session.user.id
    const clientId = typeof project.clientId === 'object' && project.clientId !== null
      ? (project.clientId._id || project.clientId).toString()
      : project.clientId.toString()
    return userId === clientId
  }

  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">{t("loading", "Chargement des données...")}</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push(`/${lang}/auth/signin?callbackUrl=/${lang}/projects/${projectId}/create-contract`)
    return null
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 py-8">
        <div className="container max-w-7xl mx-auto px-4">
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {t("projectNotFound", "Projet non trouvé")}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {t("projectNotFoundDesc", "Le projet que vous recherchez n'existe pas ou vous n'y avez pas accès.")}
              </p>
              <Button onClick={() => router.push(`/${lang}/dashboard`)} className="bg-gradient-to-r from-purple-600 to-fuchsia-600">
                {t("backToDashboard", "Retour au tableau de bord")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isClient()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 py-8">
        <div className="container max-w-7xl mx-auto px-4">
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
            <CardContent className="py-12 text-center">
              <XCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {t("unauthorized", "Accès non autorisé")}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {t("unauthorizedDesc", "Vous devez être le propriétaire de ce projet pour créer un contrat.")}
              </p>
              <Button onClick={() => router.push(`/${lang}/projects/${projectId}`)} className="bg-gradient-to-r from-purple-600 to-fuchsia-600">
                {t("backToProject", "Retour au projet")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950 py-8">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Navigation */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${lang}/projects/${projectId}`)}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToProject", "Retour au projet")}
          </Button>
          <div className="h-6 w-px bg-purple-200 dark:bg-purple-800" />
          <span className="text-sm text-purple-600 dark:text-purple-400">
            {t("createContract", "Création de contrat")}
          </span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl shadow-lg shadow-purple-500/25">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-700 via-fuchsia-700 to-pink-700 dark:from-purple-300 dark:via-fuchsia-300 dark:to-pink-300 bg-clip-text text-transparent">
              {t("title", "Créer un Contrat")}
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 ml-11">
            {t("subtitle", "Établissez un contrat formel pour le projet :")}{" "}
            <span className="font-semibold text-purple-600 dark:text-purple-400">{project.title}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Project Summary & Freelancers */}
          <div className="space-y-6">
            {/* Project Summary Card */}
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10 sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <FileText className="h-5 w-5" />
                  {t("projectSummary", "Résumé du Projet")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 truncate">
                      {project.title}
                    </h3>
                    <Badge className={project.status === "open" 
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                      : "bg-slate-100 text-slate-700 border-slate-200"
                    }>
                      {project.status === "open" ? t("open", "Ouvert") : project.status}
                    </Badge>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3">
                    {project.description}
                  </p>
                </div>

                <Separator className="bg-purple-100 dark:bg-purple-800" />

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t("projectBudget", "Budget du projet")}</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {project.budget?.min} - {project.budget?.max} {project.budget?.currency}
                      </p>
                      <p className="text-xs text-slate-400 capitalize">
                        {project.budget?.type === "fixed" ? t("fixed", "Prix fixe") : t("hourly", "À l'heure")}
                      </p>
                    </div>
                  </div>

                  {project.deadline && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t("deadline", "Date limite")}</p>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {formatDate(project.deadline)}
                        </p>
                      </div>
                    </div>
                  )}

                  {project.skills && project.skills.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-lg mt-1">
                        <Tag className="h-4 w-4 text-fuchsia-600 dark:text-fuchsia-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t("skills", "Compétences requises")}</p>
                        <div className="flex flex-wrap gap-1">
                          {project.skills.slice(0, 4).map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-purple-200 dark:border-purple-800">
                              {skill}
                            </Badge>
                          ))}
                          {project.skills.length > 4 && (
                            <span className="text-xs text-slate-400">+{project.skills.length - 4}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {client && (
                    <>
                      <Separator className="bg-purple-100 dark:bg-purple-800" />
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{t("youAreClient", "Vous êtes le client")}</p>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-bold">
                            {client.name?.charAt(0).toUpperCase() || "C"}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{client.name}</p>
                            {client.title && (
                              <p className="text-sm text-slate-500">{client.title}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Available Freelancers Card */}
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <User className="h-5 w-5" />
                  {t("freelancers", "Freelancers Disponibles")}
                  <Badge variant="outline" className="ml-auto border-purple-200 dark:border-purple-800">
                    {applications.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-8 w-8 text-purple-400" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-2">{t("noFreelancers", "Aucun freelancer disponible")}</p>
                    <p className="text-sm text-slate-500">
                      {t("acceptApplicationFirst", "Vous devez d'abord accepter une candidature")}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[500px] pr-2">
                    <div className="space-y-3">
                      {applications.map((application) => {
                        const freelancer = application.freelancer || { _id: application.freelancerId, name: "Freelancer" }
                        const isSelected = selectedFreelancer === freelancer._id
                        
                        return (
                          <div
                            key={application._id}
                            className={`p-4 border rounded-xl cursor-pointer transition-all ${
                              isSelected
                                ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-500/30"
                                : "border-purple-200 dark:border-purple-800 hover:bg-purple-50/30 dark:hover:bg-purple-950/20"
                            }`}
                            onClick={() => setSelectedFreelancer(freelancer._id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="relative">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-bold">
                                  {freelancer.name?.charAt(0).toUpperCase() || "F"}
                                </div>
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                    <CheckCircle className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                      {freelancer.name}
                                    </p>
                                    {freelancer.title && (
                                      <p className="text-sm text-slate-500 truncate">{freelancer.title}</p>
                                    )}
                                  </div>
                                  {getApplicationStatusBadge(application.status)}
                                </div>

                                {freelancer.rating && (
                                  <div className="flex items-center gap-1 mb-2">
                                    <div className="flex">
                                      {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`h-3 w-3 ${i < Math.floor(freelancer.rating) ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
                                      ))}
                                    </div>
                                    <span className="text-xs text-slate-500">{freelancer.rating.toFixed(1)}</span>
                                    <span className="text-xs text-slate-400 mx-1">•</span>
                                    <span className="text-xs text-slate-500">{freelancer.completedProjects || 0} {t("projects", "projets")}</span>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-2">
                                    <p className="text-xs text-slate-500">{t("proposedBudget", "Budget proposé")}</p>
                                    <p className="font-semibold text-purple-700 dark:text-purple-300">
                                      {application.proposedBudget} {project.budget?.currency || "EUR"}
                                    </p>
                                  </div>
                                  <div className="bg-fuchsia-50 dark:bg-fuchsia-950/30 rounded-lg p-2">
                                    <p className="text-xs text-slate-500">{t("estimatedDuration", "Durée estimée")}</p>
                                    <p className="font-semibold text-fuchsia-700 dark:text-fuchsia-300">
                                      {application.estimatedDuration || "N/A"}
                                    </p>
                                  </div>
                                </div>

                                {freelancer.skills && freelancer.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {freelancer.skills.slice(0, 3).map((skill, index) => (
                                      <Badge key={index} variant="outline" className="text-xs border-purple-200 dark:border-purple-800">
                                        {typeof skill === 'string' ? skill : skill.name || skill.id}
                                      </Badge>
                                    ))}
                                    {freelancer.skills.length > 3 && (
                                      <span className="text-xs text-slate-400">+{freelancer.skills.length - 3}</span>
                                    )}
                                  </div>
                                )}

                                {application.coverLetter && (
                                  <div className="mt-3 pt-3 border-t border-purple-100 dark:border-purple-800">
                                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                      <MessageSquare className="h-3 w-3" />
                                      {t("freelancerMessage", "Message du freelance")}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                      {application.coverLetter}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contract Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contract Details Card */}
              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-purple-700 dark:text-purple-300">
                    {t("contractDetails", "Détails du Contrat")}
                  </CardTitle>
                  <p className="text-sm text-slate-500">{t("contractDetailsDesc", "Remplissez les informations principales du contrat")}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="title" className="text-purple-700 dark:text-purple-300 mb-2 block">
                      {t("contractTitle", "Titre du Contrat")} *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                      placeholder={t("contractTitlePlaceholder", "Ex: Développement d'application web pour...")}
                      className="border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-purple-700 dark:text-purple-300 mb-2 block">
                      {t("description", "Description détaillée")} *
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                      required
                      placeholder={t("descriptionPlaceholder", "Décrivez en détail le travail à réaliser...")}
                      className="border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="amount" className="text-purple-700 dark:text-purple-300 mb-2 block">
                        {t("amount", "Montant total")} *
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                        <Input
                          id="amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) => setFormData({...formData, amount: e.target.value})}
                          required
                          placeholder="0.00"
                          className="pl-9 border-purple-200 dark:border-purple-800"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="currency" className="text-purple-700 dark:text-purple-300 mb-2 block">
                        {t("currency", "Devise")}
                      </Label>
                      <select
                        id="currency"
                        value={formData.currency}
                        onChange={(e) => setFormData({...formData, currency: e.target.value})}
                        className="w-full border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:border-purple-500 focus:ring-purple-500"
                      >
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="MGA">MGA (Ar)</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="type" className="text-purple-700 dark:text-purple-300 mb-2 block">
                        {t("contractType", "Type de contrat")} *
                      </Label>
                      <select
                        id="type"
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        className="w-full border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:border-purple-500 focus:ring-purple-500"
                      >
                        <option value="fixed_price">{t("fixedPrice", "Prix Fixe")}</option>
                        <option value="hourly">{t("hourly", "À l'Heure")}</option>
                        <option value="milestone">{t("milestone", "Par Jalons")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate" className="text-purple-700 dark:text-purple-300 mb-2 block">
                        {t("startDate", "Date de début")} *
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="border-purple-200 dark:border-purple-800"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate" className="text-purple-700 dark:text-purple-300 mb-2 block">
                        {t("endDate", "Date de fin")}
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                        className="border-purple-200 dark:border-purple-800"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Deliverables Card */}
              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-purple-700 dark:text-purple-300">
                    {t("deliverables", "Livrables attendus")} *
                  </CardTitle>
                  <p className="text-sm text-slate-500">{t("deliverablesDesc", "Définissez précisément ce que le freelancer doit livrer")}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.deliverables.map((deliverable, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex items-center gap-2 mt-2 flex-shrink-0">
                        <div className="h-7 w-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">{index + 1}</span>
                        </div>
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDeliverable(index)}
                            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="flex-1">
                        <Textarea
                          value={deliverable}
                          onChange={(e) => updateDeliverable(index, e.target.value)}
                          placeholder={t("deliverablePlaceholder", "Décrivez précisément ce livrable...")}
                          rows={2}
                          required={index === 0}
                          className="border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500 resize-y"
                        />
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addDeliverable}
                    className="w-full border-dashed border-purple-200 dark:border-purple-800 hover:bg-purple-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("addDeliverable", "Ajouter un livrable")}
                  </Button>
                </CardContent>
              </Card>

              {/* Scope of Work Card */}
              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-purple-700 dark:text-purple-300">
                    {t("scopeOfWork", "Portée du travail")}
                  </CardTitle>
                  <p className="text-sm text-slate-500">{t("scopeOfWorkDesc", "Décrivez les responsabilités, méthodologies et communications")}</p>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.scopeOfWork}
                    onChange={(e) => setFormData({...formData, scopeOfWork: e.target.value})}
                    rows={8}
                    placeholder={t("scopeOfWorkPlaceholder", `# Portée du travail

## Responsabilités du Freelancer
• Développement selon les spécifications
• Tests et assurance qualité
• Documentation technique
• Support pendant la période de garantie

## Méthodologie de travail
• Réunions hebdomadaires
• Utilisation de Git pour le versionnement
• Déploiement progressif

## Communications
• Mises à jour quotidiennes via la plateforme
• Réunions de suivi chaque lundi

## Période de garantie
• 30 jours après livraison pour corrections
• Support technique pendant cette période`)}
                    className="border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500 font-mono text-sm resize-y min-h-[200px]"
                  />
                </CardContent>
              </Card>

              {/* Terms and Conditions Card */}
              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-purple-700 dark:text-purple-300">
                    {t("termsAndConditions", "Termes et conditions")}
                  </CardTitle>
                  <p className="text-sm text-slate-500">{t("termsDesc", "Les conditions légales du contrat. Modifiez selon vos besoins.")}</p>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.termsAndConditions}
                    onChange={(e) => setFormData({...formData, termsAndConditions: e.target.value})}
                    rows={12}
                    className="border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500 font-mono text-sm resize-y min-h-[300px]"
                  />
                  <div className="mt-4 p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      💡 <span className="font-medium">{t("tip", "Conseil :")}</span> {t("termsTip", "Ces termes sont générés par défaut. Consultez un avocat pour des contrats complexes ou de montant élevé.")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Preview Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="w-full border-purple-200 dark:border-purple-800 hover:bg-purple-50"
              >
                {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showPreview ? t("hidePreview", "Masquer l'aperçu") : t("showPreview", "Afficher l'aperçu")}
              </Button>

              {showPreview && (
                <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-purple-700 dark:text-purple-300">
                      {t("preview", "Aperçu du contrat")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div><p className="font-medium text-purple-600">{t("title", "Titre")}</p><p>{formData.title}</p></div>
                    <div><p className="font-medium text-purple-600">{t("amount", "Montant")}</p><p>{formData.amount} {formData.currency}</p></div>
                    <div><p className="font-medium text-purple-600">{t("deliverables", "Livrables")}</p><ul className="list-disc list-inside">{formData.deliverables.filter(d => d.trim()).map((d, i) => <li key={i}>{d}</li>)}</ul></div>
                  </CardContent>
                </Card>
              )}

              {/* Submit Section */}
              <div className="sticky bottom-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-4 border border-purple-200 dark:border-purple-800 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{t("contractFor", "Contrat pour")} {project.title}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      {selectedFreelancer && applications.find(app => 
                        (app.freelancer?._id || app.freelancerId) === selectedFreelancer
                      ) ? (
                        <>
                          <User className="h-3 w-3" />
                          <span>{applications.find(app => 
                            (app.freelancer?._id || app.freelancerId) === selectedFreelancer
                          )?.freelancer?.name || "Freelancer"}</span>
                          <span>•</span>
                          <DollarSign className="h-3 w-3" />
                          <span>{formData.amount || "0"} {formData.currency}</span>
                        </>
                      ) : (
                        <span className="text-amber-600">{t("selectFreelancer", "Sélectionnez un freelancer")}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push(`/${lang}/projects/${projectId}`)}
                      disabled={isSubmitting}
                      className="border-purple-200 hover:bg-purple-50"
                    >
                      {t("cancel", "Annuler")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || applications.length === 0 || !selectedFreelancer}
                      className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 shadow-lg shadow-purple-500/25"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t("creating", "Création en cours...")}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t("create", "Créer le contrat")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {applications.length === 0 && (
                  <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg">
                    <p className="text-sm text-rose-800 dark:text-rose-400 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      {t("noFreelancerWarning", "Vous ne pouvez pas créer de contrat sans freelancer. Acceptez d'abord une candidature.")}
                    </p>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}