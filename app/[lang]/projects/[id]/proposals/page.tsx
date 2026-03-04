// app/projects/[id]/proposals/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
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
  Award,
  Globe,
  Search,
  Filter,
  TrendingUp,
  Shield,
  CheckCircle
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Freelancer {
  _id: string
  name: string
  avatar?: string
  title?: string
  rating?: number
  completedProjects?: number
  location?: string
  skills?: string[]
  bio?: string
  languages?: string[]
  verified?: boolean
  joinDate?: string
  responseTime?: string
  successRate?: number
}

interface Application {
  _id: string
  freelancerId: string
  coverLetter: string
  proposedBudget: number
  estimatedDuration: string
  attachments?: string[]
  status: 'pending' | 'accepted' | 'rejected'
  clientViewed: boolean
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
  status: string
  applicationCount: number
  clientId: string
  category: string
  skills: string[]
  createdAt: string
  client?: {
    _id: string
    name: string
    avatar?: string
    rating?: number
    completedProjects?: number
  }
}

export default function PublicProjectProposalsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    fetchProjectProposals()
  }, [projectId])

  const fetchProjectProposals = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/proposals`)
      
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des propositions")
      }

      const data = await response.json()
      setProject(data.project)
      setApplications(data.applications || [])
    } catch (error) {
      console.error("Error fetching proposals:", error)
      toast.error("Erreur lors du chargement des propositions")
    } finally {
      setLoading(false)
    }
  }

  // Filtrer et trier les applications
  const filteredApplications = applications
    .filter(app => {
      const matchesSearch = searchTerm === "" || 
        app.freelancer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.freelancer?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.freelancer?.skills?.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        )
      
      const matchesStatus = filterStatus === "all" || app.status === filterStatus
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.freelancer?.rating || 0) - (a.freelancer?.rating || 0)
        case "budget":
          return a.proposedBudget - b.proposedBudget
        case "experience":
          return (b.freelancer?.completedProjects || 0) - (a.freelancer?.completedProjects || 0)
        case "recent":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

  const pendingApplications = applications.filter(app => app.status === "pending")
  const acceptedApplications = applications.filter(app => app.status === "accepted")
  const rejectedApplications = applications.filter(app => app.status === "rejected")

  const navigateToProfile = (freelancerId: string) => {
    router.push(`/profile/${freelancerId}`)
  }

  const startChat = (freelancerId: string) => {
    // Rediriger vers la messagerie ou ouvrir un chat
    toast.info("Fonctionnalité de messagerie bientôt disponible")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-8">
              {/* Header Skeleton */}
              <div className="flex items-center gap-4 mb-8">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                <div className="h-8 bg-gray-200 rounded w-64"></div>
              </div>
              
              {/* Stats Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Applications Skeleton */}
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
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">Projet non trouvé</div>
            <p className="text-gray-600 mb-4">Le projet que vous recherchez n'existe pas ou a été supprimé.</p>
            <Button asChild>
              <Link href="/projects">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux projets
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/projects/${projectId}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour au projet
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Propositions reçues</h1>
                <p className="text-gray-600 mt-2">
                  {project.applicationCount} freelancers ont postulé sur votre projet
                </p>
              </div>
            </div>
            
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Users className="h-4 w-4 mr-2" />
              {project.applicationCount} propositions
            </Badge>
          </div>

          {/* Project Summary */}
          <Card className="mb-8 bg-white/80 backdrop-blur-sm border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h2>
                  <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
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
                      <Calendar className="h-4 w-4" />
                      Posté le {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Badge variant={project.status === 'open' ? 'default' : 'secondary'}>
                    {project.status === 'open' ? '🔓 Public' : '📝 ' + project.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
                    <div className="text-sm text-blue-700">Total propositions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">{pendingApplications.length}</div>
                    <div className="text-sm text-amber-700">En attente</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{acceptedApplications.length}</div>
                    <div className="text-sm text-green-700">Acceptées</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <X className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{rejectedApplications.length}</div>
                    <div className="text-sm text-red-700">Rejetées</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 w-full md:max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher un freelancer, compétence..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="recent">Plus récent</option>
                    <option value="rating">Meilleure note</option>
                    <option value="budget">Budget croissant</option>
                    <option value="experience">Plus d'expérience</option>
                  </select>

                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="accepted">Acceptés</option>
                    <option value="rejected">Rejetés</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applications List */}
          <div className="space-y-6">
            {filteredApplications.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {applications.length === 0 ? "Aucune proposition reçue" : "Aucun résultat trouvé"}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {applications.length === 0 
                      ? "Les freelancers apparaîtront ici lorsqu'ils postuleront sur votre projet."
                      : "Aucun freelancer ne correspond à vos critères de recherche."
                    }
                  </p>
                  {applications.length === 0 && (
                    <Button asChild>
                      <Link href={`/projects/${projectId}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Voir le projet
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredApplications.map((application) => (
                <Card key={application._id} className={`hover:shadow-lg transition-all duration-300 ${
                  application.status === 'accepted' ? 'border-l-4 border-l-green-500' :
                  application.status === 'rejected' ? 'border-l-4 border-l-red-500 opacity-70' :
                  'border-l-4 border-l-amber-500'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Freelancer Info */}
                      <div className="flex-shrink-0">
                        <div className="flex items-start gap-4">
                          <Avatar
                            className="h-16 w-16 border-2 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => application.freelancer && navigateToProfile(application.freelancer._id)}
                          >
                            <AvatarImage src={application.freelancer?.avatar} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                              {application.freelancer?.name?.charAt(0) || 'F'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 
                                className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                                onClick={() => application.freelancer && navigateToProfile(application.freelancer._id)}
                              >
                                {application.freelancer?.name || 'Freelancer'}
                              </h3>
                              {application.freelancer?.verified && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Vérifié
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-gray-600 mb-2">{application.freelancer?.title}</p>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              {application.freelancer?.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-semibold text-gray-900">{application.freelancer.rating}</span>
                                  <span className="text-gray-500">
                                    ({application.freelancer.completedProjects || 0} projets)
                                  </span>
                                </div>
                              )}
                              
                              {application.freelancer?.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {application.freelancer.location}
                                </div>
                              )}
                              
                              {application.freelancer?.responseTime && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {application.freelancer.responseTime}
                                </div>
                              )}
                            </div>

                            {/* Skills */}
                            {/* {application.freelancer?.skills && application.freelancer.skills.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {application.freelancer.skills.slice(0, 5).map((skill, index) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-gray-50">
                                    {skill}
                                  </Badge>
                                ))}
                                {application.freelancer.skills.length > 5 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{application.freelancer.skills.length - 5}
                                  </Badge>
                                )}
                              </div>
                            )} */}
                          </div>
                        </div>
                      </div>

                      {/* Proposal Details */}
                      <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
                                <DollarSign className="h-4 w-4" />
                                <span>Budget proposé</span>
                              </div>
                              <p className="text-lg font-bold text-blue-900">
                                {application.proposedBudget?.toLocaleString()} {project.budget.currency}
                              </p>
                              <p className="text-xs text-blue-600 mt-1">
                                {project.budget.type === 'fixed' ? 'Forfait fixe' : 'Taux horaire'}
                              </p>
                            </CardContent>
                          </Card>
                          
                          <Card className="bg-green-50 border-green-200">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 text-sm text-green-700 mb-1">
                                <Clock className="h-4 w-4" />
                                <span>Durée estimée</span>
                              </div>
                              <p className="text-lg font-bold text-green-900">{application.estimatedDuration}</p>
                              <p className="text-xs text-green-600 mt-1">Livraison estimée</p>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Cover Letter */}
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Message du freelancer
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {application.coverLetter || "Aucun message fourni."}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3">
                          <Button
                            variant="outline"
                            onClick={() => application.freelancer && navigateToProfile(application.freelancer._id)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Voir le profil
                          </Button>
                          
                          <Button
                            variant="outline"
                            onClick={() => startChat(application.freelancerId)}
                            className="gap-2"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Contacter
                          </Button>

                          {/* Status Badge */}
                          <div className="ml-auto">
                            {application.status === 'accepted' && (
                              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Accepté
                              </Badge>
                            )}
                            {application.status === 'rejected' && (
                              <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200 gap-1">
                                <X className="h-3 w-3" />
                                Rejeté
                              </Badge>
                            )}
                            {application.status === 'pending' && (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                                En attente
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Application Date */}
                        <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Postulé le {new Date(application.createdAt).toLocaleDateString('fr-FR')} à {new Date(application.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}