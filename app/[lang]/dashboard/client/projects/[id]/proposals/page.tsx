"use client"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Card } from "@/components/ui/card"
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
  Users
} from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Skill {
  id: string
  name: string
  category: string
  level: string
  yearsOfExperience: number
  featured: boolean
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
}

interface Application {
  _id: string
  freelancerId: string
  coverLetter: string
  proposedBudget: number
  estimatedDuration: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
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
}

interface ProposalsPageProps {
  params: Promise<{ id: string }>
}

export default function ProposalsPage({ params }: ProposalsPageProps) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  // Résoudre les params asynchrones
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params
      setResolvedParams(resolved)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (resolvedParams?.id) {
      fetchProjectWithApplications()
    }
  }, [resolvedParams?.id])

  // Utiliser la nouvelle API pour récupérer projet + candidatures
  async function fetchProjectWithApplications() {
    if (!resolvedParams?.id) return

    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${resolvedParams.id}/applications`)
     
      if (!response.ok) {
        throw new Error('Failed to fetch project applications')
      }
     
      const data = await response.json()
      setProject(data.project)
      // S'assurer que applications est toujours un tableau
      setApplications(Array.isArray(data.applications) ? data.applications : [])
    } catch (error) {
      console.error("Error fetching project applications:", error)
      toast.error("Erreur lors du chargement des candidatures")
      // S'assurer que applications est un tableau même en cas d'erreur
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
        toast.success(`Candidature ${status === 'accepted' ? 'acceptée' : 'rejetée'} !`)
       
        // Mettre à jour localement
        setApplications(prev => prev.map(app =>
          app._id === applicationId ? { ...app, status } : app
        ))
        
        // Si accepté, mettre à jour le projet aussi
        if (status === 'accepted') {
          const acceptedApp = applications.find(a => a._id === applicationId)
          setProject(prev => prev ? {
            ...prev,
            status: 'in-progress',
            freelancerId: acceptedApp?.freelancerId
          } : null)
         
          // Rediriger vers l'onboarding
          setTimeout(() => {
            router.push(`/projects/${resolvedParams?.id}/onboarding`)
          }, 1500)
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Erreur lors de la mise à jour")
      }
    } catch (error) {
      toast.error("Une erreur est survenue")
    } finally {
      setProcessingAction(null)
    }
  }

  const navigateToProfile = (userId: string) => {
    router.push(`/profile/${userId}`)
  }

  const startChat = (freelancerId: string) => {
    // Implémentation de la discussion
    toast.info("Fonctionnalité de discussion bientôt disponible")
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <DashboardSidebar role="client" />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-6">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="h-20 bg-gray-200 rounded"></div>
                          <div className="h-20 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-screen">
        <DashboardSidebar role="client" />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Projet non trouvé</h1>
            <p className="text-gray-600 mb-6">Le projet que vous recherchez n'existe pas ou vous n'y avez pas accès.</p>
            <Button asChild>
              <Link href="/dashboard/client/projects">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux projets
              </Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // S'assurer que les applications sont toujours des tableaux
  const pendingApps = Array.isArray(applications) ? applications.filter((app: Application) => app.status === "pending") : []
  const acceptedApps = Array.isArray(applications) ? applications.filter((app: Application) => app.status === "accepted") : []
  const rejectedApps = Array.isArray(applications) ? applications.filter((app: Application) => app.status === "rejected") : []

  return (
    <div className="flex h-screen bg-gray-50/30">
      <DashboardSidebar role="client" />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button variant="ghost" asChild className="mb-4 gap-2">
                <Link href="/dashboard/client/projects">
                  <ArrowLeft className="h-4 w-4" />
                  Retour aux projets
                </Link>
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
              <p className="mt-2 text-gray-600 max-w-2xl">{project.description}</p>
             
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
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
                <span>•</span>
                <Badge variant={project.status === 'open' ? 'default' : 'secondary'}>
                  {project.status === 'open' ? 'Public' : 'En cours'}
                </Badge>
              </div>
            </div>
          </div>

          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="bg-white border">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                En attente ({pendingApps.length})
              </TabsTrigger>
              <TabsTrigger value="accepted" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Acceptées ({acceptedApps.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Rejetées ({rejectedApps.length})
              </TabsTrigger>
            </TabsList>

            {/* CANDIDATURES EN ATTENTE */}
            <TabsContent value="pending" className="space-y-4">
              {pendingApps.length === 0 ? (
                <Card className="p-12 text-center bg-white border-0 shadow-sm">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune candidature en attente</h3>
                  <p className="text-gray-600 mb-6">Les candidatures pour votre projet apparaîtront ici.</p>
                  <div className="flex gap-3 justify-center">
                    <Button asChild variant="outline">
                      <Link href={`/projects/${resolvedParams?.id}/edit`}>
                        Modifier le projet
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href="/dashboard/client/projects">
                        Voir mes autres projets
                      </Link>
                    </Button>
                  </div>
                </Card>
              ) : (
                pendingApps.map((app: Application) => (
                  <Card key={app._id} className="p-6 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-6">
                      {/* Avatar et infos freelancer */}
                      <div className="flex-shrink-0">
                        <Avatar
                          className="h-16 w-16 border-2 border-white shadow-md cursor-pointer"
                          onClick={() => app.freelancer && navigateToProfile(app.freelancer._id)}
                        >
                          <AvatarImage src={app.freelancer?.avatar} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold">
                            {app.freelancer?.name?.charAt(0) || 'F'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* En-tête */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div
                              className="flex items-center gap-2 mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => app.freelancer && navigateToProfile(app.freelancer._id)}
                            >
                              <h3 className="text-xl font-semibold text-gray-900">
                                {app.freelancer?.name || 'Freelancer'}
                              </h3>
                              <Eye className="h-4 w-4 text-gray-400" />
                            </div>
                           
                            <div className="flex items-center gap-4 flex-wrap">
                              {app.freelancer?.title && (
                                <span className="text-sm text-gray-600">{app.freelancer.title}</span>
                              )}
                              {app.freelancer?.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium text-gray-900">{app.freelancer.rating}</span>
                                  <span className="text-sm text-gray-500">
                                    ({app.freelancer.completedProjects || 0} projets)
                                  </span>
                                </div>
                              )}
                              {app.freelancer?.location && (
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <MapPin className="h-3 w-3" />
                                  {app.freelancer.location}
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                            En attente
                          </Badge>
                        </div>

                        {/* Compétences */}
                        {app.freelancer?.skills && app.freelancer.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {app.freelancer.skills.slice(0, 5).map((skill, index) => (
                              <Badge key={skill.id || index} variant="outline" className="text-xs">
                                {skill.name} {/* Afficher le nom de la compétence, pas l'objet entier */}
                              </Badge>
                            ))}
                            {app.freelancer.skills.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{app.freelancer.skills.length - 5}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Détails de la proposition */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
                              <DollarSign className="h-4 w-4" />
                              <span>Budget proposé</span>
                            </div>
                            <p className="text-lg font-bold text-blue-900">
                              {app.proposedBudget?.toLocaleString()} {project.budget.currency}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              {project.budget.type === 'fixed' ? 'Forfait fixe' : 'Taux horaire'}
                            </p>
                          </div>
                         
                          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                            <div className="flex items-center gap-2 text-sm text-green-700 mb-1">
                              <Clock className="h-4 w-4" />
                              <span>Durée estimée</span>
                            </div>
                            <p className="text-lg font-bold text-green-900">{app.estimatedDuration}</p>
                            <p className="text-xs text-green-600 mt-1">Livraison estimée</p>
                          </div>
                        </div>

                        {/* Lettre de motivation */}
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Message du freelancer
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-4 border">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {app.coverLetter || "Aucun message fourni."}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3">
                          <Button
                            onClick={() => handleApplicationAction(app._id, "accepted")}
                            disabled={processingAction === app._id}
                            className="bg-green-600 hover:bg-green-700 gap-2"
                          >
                            {processingAction === app._id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            Accepter
                          </Button>
                         
                          <Button
                            variant="outline"
                            onClick={() => handleApplicationAction(app._id, "rejected")}
                            disabled={processingAction === app._id}
                            className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                            Refuser
                          </Button>
                         
                          <Button
                            variant="ghost"
                            onClick={() => app.freelancer && navigateToProfile(app.freelancer._id)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Voir le profil
                          </Button>
                         
                          <Button
                            variant="ghost"
                            onClick={() => startChat(app.freelancerId)}
                            className="gap-2"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Discuter
                          </Button>
                        </div>

                        {/* Date de candidature */}
                        <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Candidature reçue le {new Date(app.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* CANDIDATURES ACCEPTÉES */}
            <TabsContent value="accepted" className="space-y-4">
              {acceptedApps.length === 0 ? (
                <Card className="p-12 text-center bg-white border-0 shadow-sm">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune candidature acceptée</h3>
                  <p className="text-gray-600">Les candidatures que vous acceptez apparaîtront ici.</p>
                </Card>
              ) : (
                acceptedApps.map((app: Application) => (
                  <Card key={app._id} className="p-6 bg-white border-0 shadow-sm border-l-4 border-l-green-500">
                    <div className="flex items-start gap-6">
                      <Avatar
                        className="h-16 w-16 border-2 border-white shadow-md cursor-pointer"
                        onClick={() => app.freelancer && navigateToProfile(app.freelancer._id)}
                      >
                        <AvatarImage src={app.freelancer?.avatar} />
                        <AvatarFallback className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold">
                          {app.freelancer?.name?.charAt(0) || 'F'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                              {app.freelancer?.name || 'Freelancer'}
                            </h3>
                            <p className="text-gray-600">
                              Budget: {app.proposedBudget?.toLocaleString()} {project.budget.currency}
                            </p>
                          </div>
                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Accepté
                          </Badge>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-green-800 font-medium">Prêt à commencer</p>
                              <p className="text-xs text-green-600 mt-1">
                                Le freelancer attend les détails du projet
                              </p>
                            </div>
                            <Button
                              onClick={() => router.push(`/projects/${resolvedParams?.id}/onboarding`)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Démarrer le projet
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* CANDIDATURES REJETÉES */}
            <TabsContent value="rejected" className="space-y-4">
              {rejectedApps.length === 0 ? (
                <Card className="p-12 text-center bg-white border-0 shadow-sm">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune candidature rejetée</h3>
                  <p className="text-gray-600">Les candidatures que vous refusez apparaîtront ici.</p>
                </Card>
              ) : (
                rejectedApps.map((app: Application) => (
                  <Card key={app._id} className="p-6 bg-white border-0 shadow-sm opacity-70">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={app.freelancer?.avatar} />
                        <AvatarFallback className="bg-gray-400 text-white">
                          {app.freelancer?.name?.charAt(0) || 'F'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{app.freelancer?.name || 'Freelancer'}</h3>
                        <p className="text-sm text-gray-600">
                          Budget: {app.proposedBudget?.toLocaleString()} {project.budget.currency}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                        Rejeté
                      </Badge>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}