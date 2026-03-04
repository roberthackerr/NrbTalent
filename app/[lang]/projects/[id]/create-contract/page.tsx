// app/projects/[id]/create-contract/page.tsx
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
  Star
} from "lucide-react"
import { toast } from "sonner"
import { generateDefaultTerms } from "@/lib/contract-helpers"

export default function CreateContractPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [project, setProject] = useState<any>(null)
  const [selectedFreelancer, setSelectedFreelancer] = useState("")
  const [applications, setApplications] = useState<any[]>([])
  const [client, setClient] = useState<any>(null)

  // Form data - Initialisé avec les données du projet
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

  useEffect(() => {
    if (status === "authenticated" && projectId) {
      fetchProjectAndApplications()
    }
  }, [status, projectId])

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
        // Filtrer pour n'avoir que les candidatures acceptées
        const acceptedApplications = applicationsData.applications?.filter(
          (app: any) => app.status === "accepted"
        ) || []

        // Si aucune candidature acceptée, montrer toutes les candidatures
        const applicationsToShow = acceptedApplications.length > 0 
          ? acceptedApplications 
          : applicationsData.applications || []

        setApplications(applicationsToShow)

        // Sélectionner le premier freelancer par défaut s'il y en a
        if (applicationsToShow.length > 0) {
          setSelectedFreelancer(applicationsToShow[0].freelancer._id)
        }
      }

      // Pré-remplir le formulaire avec les données du projet
      const today = new Date()
      const defaultEndDate = new Date(today)
      defaultEndDate.setDate(today.getDate() + 30) // 30 jours par défaut

      // Calculer le budget moyen si disponible
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
        // Convertir les compétences en livrables suggérés
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
      router.push(`/projects/${projectId}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFreelancer) {
      toast.error("Veuillez sélectionner un freelancer")
      return
    }

    // Validation des champs requis
    if (!formData.title.trim()) {
      toast.error("Le titre du contrat est requis")
      return
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Le montant doit être supérieur à 0")
      return
    }

    if (!formData.startDate) {
      toast.error("La date de début est requise")
      return
    }

    const validDeliverables = formData.deliverables.filter(d => d.trim() !== "")
    if (validDeliverables.length === 0) {
      toast.error("Au moins un livrable doit être spécifié")
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
          // Si payment schedule n'est pas défini, utiliser des valeurs par défaut
          paymentSchedule: formData.paymentSchedule || {
            type: formData.type === "fixed_price" ? "completion" : "hourly",
            milestones: []
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Contrat créé avec succès !")
        router.push(`/contracts/${data.contractId}`)
      } else {
        toast.error(data.error || "Erreur lors de la création du contrat")
      }
    } catch (error) {
      console.error("Erreur création contrat:", error)
      toast.error("Une erreur est survenue lors de la création du contrat")
    } finally {
      setIsSubmitting(false)
    }
  }

  const addDeliverable = () => {
    setFormData({
      ...formData,
      deliverables: [...formData.deliverables, ""]
    })
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
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getApplicationStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      accepted: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      rejected: "bg-red-100 text-red-800 border-red-200"
    }
    
    const labels: Record<string, string> = {
      accepted: "Accepté",
      pending: "En attente",
      rejected: "Rejeté"
    }

    return (
      <Badge className={`${variants[status] || 'bg-gray-100'} text-xs font-medium px-2 py-1`}>
        {labels[status] || status}
      </Badge>
    )
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des données du projet...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push(`/auth/signin?callbackUrl=/projects/${projectId}/create-contract`)
    return null
  }

  if (!project) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Projet non trouvé</h2>
            <p className="text-gray-600 mb-4">
              Le projet que vous recherchez n'existe pas ou vous n'y avez pas accès.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
const checkIfUserIsClient = () => {
  if (!session?.user?.id || !project?.clientId) {
    return false
  }
  
  const userId = session.user.id
  const clientId = project.clientId
  
  console.log("Debug comparison:", {
    userId,
    clientId,
    clientIdObject: project.clientId,
    clientIdType: typeof project.clientId,
    clientIdHas_id: project.clientId?._id,
    userIdType: typeof userId,
    userIdToString: userId.toString(),
    clientIdToString: clientId.toString(),
    clientId_idToString: clientId?._id?.toString()
  })
  
  // Si clientId est un objet avec _id (venant d'une aggregation MongoDB)
  if (typeof clientId === 'object' && clientId !== null) {
    // Cas 1: clientId a une propriété _id (objet complet)
    if (clientId._id) {
      return clientId._id.toString() === userId.toString()
    }
    // Cas 2: clientId est directement un ObjectId
    else {
      return clientId.toString() === userId.toString()
    }
  }
  // Si clientId est une string
  else if (typeof clientId === 'string') {
    return clientId === userId.toString()
  }
  
  return false
}
  // Vérifier que l'utilisateur est bien le client
  const isClient = checkIfUserIsClient()

// Et ajouter cette fonction en haut du composant:

  if (!isClient) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Accès non autorisé</h2>
            <p className="text-gray-600 mb-4">
              Vous devez être le propriétaire de ce projet pour créer un contrat.
            </p>
            <Button onClick={() => router.push(`/projects/${projectId}`)}>
              Retour au projet
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl py-8">
      {/* Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/projects/${projectId}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au projet
        </Button>
        <div className="h-6 w-px bg-gray-300" />
        <span className="text-sm text-gray-600">
          Création de contrat
        </span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Créer un Contrat</h1>
        <p className="text-gray-600 text-lg">
          Établissez un contrat formel pour le projet : <span className="font-semibold text-blue-600">{project.title}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Project Summary & Freelancers */}
        <div className="space-y-6">
          {/* Project Summary Card */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Résumé du Projet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg truncate">{project.title}</h3>
                  <Badge variant={project.status === "open" ? "default" : "secondary"}>
                    {project.status === "open" ? "Ouvert" : project.status}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {project.description}
                </p>
              </div>

              <Separator />

              {/* Project Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Euro className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Budget du projet</p>
                    <p className="font-medium">
                      {project.budget?.min} - {project.budget?.max} {project.budget?.currency}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {project.budget?.type === "fixed" ? "Prix fixe" : "À l'heure"}
                    </p>
                  </div>
                </div>

                {project.deadline && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date limite</p>
                      <p className="font-medium">
                        {formatDate(project.deadline)}
                      </p>
                    </div>
                  </div>
                )}

                {project.skills && project.skills.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg mt-1">
                      <Tag className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Compétences requises</p>
                      <div className="flex flex-wrap gap-1">
                        {project.skills.slice(0, 4).map((skill: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {project.skills.length > 4 && (
                          <span className="text-xs text-gray-500">
                            +{project.skills.length - 4} autres
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Client Info */}
                {client && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Vous êtes le client</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {client.avatar ? (
                            <img 
                              src={client.avatar} 
                              alt={client.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          {client.title && (
                            <p className="text-sm text-gray-600">{client.title}</p>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Freelancers Disponibles
                <Badge variant="outline" className="ml-auto">
                  {applications.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-6">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-3">
                    Aucun freelancer n'a postulé à ce projet.
                  </p>
                  <p className="text-sm text-gray-400">
                    Vous devez d'abord accepter une candidature avant de créer un contrat.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {applications.map((application) => {
                    const freelancer = application.freelancer || application.freelancerId
                    const isSelected = selectedFreelancer === freelancer._id
                    
                    return (
                      <div
                        key={application._id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                            : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedFreelancer(freelancer._id)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="relative">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              {freelancer.avatar ? (
                                <img 
                                  src={freelancer.avatar} 
                                  alt={freelancer.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <User className="h-6 w-6 text-gray-500" />
                              )}
                            </div>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Freelancer Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <p className="font-semibold truncate">
                                  {freelancer.name}
                                </p>
                                {freelancer.title && (
                                  <p className="text-sm text-gray-600 truncate">
                                    {freelancer.title}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {getApplicationStatusBadge(application.status)}
                              </div>
                            </div>

                            {/* Rating */}
                            {freelancer.rating && (
                              <div className="flex items-center gap-1 mb-2">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < Math.floor(freelancer.rating || 0)
                                          ? "text-yellow-500 fill-yellow-500"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-gray-600">
                                  {freelancer.rating?.toFixed(1) || "0.0"}
                                </span>
                                <span className="text-xs text-gray-400 mx-1">•</span>
                                <span className="text-xs text-gray-600">
                                  {freelancer.completedProjects || 0} projets
                                </span>
                              </div>
                            )}

                            {/* Proposal Details */}
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="bg-green-50 p-2 rounded">
                                <p className="text-xs text-gray-600">Budget proposé</p>
                                <p className="font-semibold text-green-700">
                                  {application.proposedBudget} {project.budget?.currency || "EUR"}
                                </p>
                              </div>
                              <div className="bg-blue-50 p-2 rounded">
                                <p className="text-xs text-gray-600">Durée estimée</p>
                                <p className="font-semibold text-blue-700">
                                  {application.estimatedDuration || "N/A"}
                                </p>
                              </div>
                            </div>

                            {/* Skills */}
                         {freelancer.skills && freelancer.skills.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-2">
    {freelancer.skills.slice(0, 3).map((skill: any, index: number) => {
      // Si skill est un objet, prendre la propriété 'name' ou 'id'
      const skillName = typeof skill === 'string' 
        ? skill 
        : skill.name || skill.id || JSON.stringify(skill)
      
      return (
        <Badge key={index} variant="secondary" className="text-xs">
          {skillName}
        </Badge>
      )
    })}
    {freelancer.skills.length > 3 && (
      <span className="text-xs text-gray-500">
        +{freelancer.skills.length - 3}
      </span>
    )}
  </div>
)}
                          </div>
                        </div>

                        {/* Cover Letter Preview */}
                        {application.coverLetter && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              Message du freelance
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {application.coverLetter}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* No Accepted Applications Warning */}
              {applications.length > 0 && applications.every((app: any) => app.status !== "accepted") && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Aucune candidature acceptée
                      </p>
                      <p className="text-xs text-yellow-700">
                        Pour créer un contrat, vous devez d'abord accepter une candidature.
                        Tous les freelancers affichés ont un statut "en attente".
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Contract Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contract Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Détails du Contrat</CardTitle>
                <p className="text-sm text-gray-500">
                  Remplissez les informations principales du contrat
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div>
                  <Label htmlFor="title" className="mb-2 flex items-center gap-2">
                    Titre du Contrat *
                    <span className="text-xs font-normal text-gray-500">
                      (Basé sur le titre du projet)
                    </span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="Ex: Développement d'application web pour..."
                    className="text-lg"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="mb-2">
                    Description détaillée *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    required
                    placeholder="Décrivez en détail le travail à réaliser, les objectifs, les spécifications techniques..."
                    className="resize-y min-h-[120px]"
                  />
                </div>

                {/* Financial Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="amount" className="mb-2">
                      Montant total *
                    </Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        required
                        placeholder="0.00"
                        className="pl-9"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Budget projet: {project.budget?.min} - {project.budget?.max} {project.budget?.currency}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="currency" className="mb-2">
                      Devise
                    </Label>
                    <select
                      id="currency"
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CHF">CHF (CHF)</option>
                      <option value="CAD">CAD ($)</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="type" className="mb-2">
                      Type de contrat *
                    </Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="fixed_price">Prix Fixe</option>
                      <option value="hourly">À l'Heure</option>
                      <option value="milestone">Par Jalons</option>
                    </select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="mb-2 flex items-center gap-2">
                      Date de début *
                      <Clock className="h-3 w-3 text-gray-500" />
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="mb-2">
                      Date de fin (optionnel)
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deliverables Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Livrables attendus *</CardTitle>
                <p className="text-sm text-gray-500">
                  Définissez précisément ce que le freelancer doit livrer
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.deliverables.map((deliverable, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex items-center gap-2 mt-3 flex-shrink-0">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDeliverable(index)}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`deliverable-${index}`} className="text-sm mb-1">
                        Livrable {index + 1} {index === 0 && "*"}
                      </Label>
                      <Textarea
                        id={`deliverable-${index}`}
                        value={deliverable}
                        onChange={(e) => updateDeliverable(index, e.target.value)}
                        placeholder="Décrivez précisément ce livrable (ex: 'Page d'accueil responsive avec animations', 'API REST complète avec documentation', etc.)"
                        rows={2}
                        required={index === 0}
                        className="resize-y min-h-[60px]"
                      />
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addDeliverable}
                  className="w-full border-dashed"
                >
                  + Ajouter un autre livrable
                </Button>
              </CardContent>
            </Card>

            {/* Scope of Work Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Portée du travail</CardTitle>
                <p className="text-sm text-gray-500">
                  Décrivez les responsabilités, méthodologies et communications
                </p>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.scopeOfWork}
                  onChange={(e) => setFormData({...formData, scopeOfWork: e.target.value})}
                  rows={6}
                  placeholder={`# Portée du travail

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
• Communication via [Méthode privilégiée]

## Période de garantie
• 30 jours après livraison pour corrections
• Support technique pendant cette période

## Exclusions (Hors scope)
• Hébergement et maintenance à long terme
• Formation des utilisateurs finaux
• Marketing et promotion`}
                  className="resize-y min-h-[180px] font-mono text-sm"
                />
              </CardContent>
            </Card>

            {/* Terms and Conditions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Termes et conditions</CardTitle>
                <p className="text-sm text-gray-500">
                  Les conditions légales du contrat. Modifiez selon vos besoins.
                </p>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.termsAndConditions}
                  onChange={(e) => setFormData({...formData, termsAndConditions: e.target.value})}
                  rows={10}
                  className="resize-y min-h-[250px] font-mono text-sm"
                />
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    💡 <span className="font-medium">Conseil :</span> Ces termes sont générés par défaut. 
                    Consultez un avocat pour des contrats complexes ou de montant élevé.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Submit Section */}
            <div className="sticky bottom-6 bg-white p-4 border rounded-lg shadow-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Contrat pour {project.title}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {selectedFreelancer && applications.find(app => 
                      (app.freelancer || app.freelancerId)?._id === selectedFreelancer
                    ) ? (
                      <>
                        <User className="h-3 w-3" />
                        <span>
                          Avec {
                            applications.find(app => 
                              (app.freelancer || app.freelancerId)?._id === selectedFreelancer
                            )?.freelancer?.name || 
                            applications.find(app => 
                              (app.freelancer || app.freelancerId)?._id === selectedFreelancer
                            )?.freelancerId?.name
                          }
                        </span>
                        <span>•</span>
                        <Euro className="h-3 w-3" />
                        <span>{formData.amount || "0"} {formData.currency}</span>
                      </>
                    ) : (
                      <span className="text-yellow-600">Sélectionnez un freelancer</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/projects/${projectId}`)}
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || applications.length === 0 || !selectedFreelancer}
                    className="min-w-[180px] bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Créer le contrat
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Warnings */}
              {applications.length === 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Vous ne pouvez pas créer de contrat sans freelancer. 
                    Acceptez d'abord une candidature depuis la page du projet.
                  </p>
                </div>
              )}

              {applications.length > 0 && applications.every(app => app.status !== "accepted") && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Aucune candidature acceptée. 
                    Vous pouvez créer un contrat avec une candidature "en attente", 
                    mais il est recommandé d'accepter d'abord la candidature.
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}