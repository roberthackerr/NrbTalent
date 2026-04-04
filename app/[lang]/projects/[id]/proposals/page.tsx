// app/projects/[id]/proposals/page.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
  CheckCircle,
  Sparkles,
  Zap,
  Heart,
  UserCheck,
  TrendingDown,
  Loader2,
  ChevronDown,
  SlidersHorizontal,
  LayoutGrid,
  List
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)

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

  const filteredApplications = useMemo(() => {
    return applications
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
  }, [applications, searchTerm, filterStatus, sortBy])

  const stats = useMemo(() => ({
    total: applications.length,
    pending: applications.filter(app => app.status === "pending").length,
    accepted: applications.filter(app => app.status === "accepted").length,
    rejected: applications.filter(app => app.status === "rejected").length
  }), [applications])

  const navigateToProfile = (freelancerId: string) => {
    router.push(`/profile/${freelancerId}`)
  }

  const startChat = (freelancerId: string) => {
    toast.info("Fonctionnalité de messagerie bientôt disponible")
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100/50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-purple-600 font-medium">Chargement des propositions...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100/50 to-pink-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="max-w-md w-full mx-4 border-purple-200 shadow-xl">
            <CardContent className="pt-6 text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-10 w-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Projet non trouvé</h2>
              <p className="text-gray-600 mb-6">Le projet que vous recherchez n'existe pas ou a été supprimé.</p>
              <Button asChild className="bg-purple-600 hover:bg-purple-700">
                <Link href="/projects">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour aux projets
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100/50 to-pink-50">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header avec animation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                  className="hover:bg-purple-100 hover:text-purple-700 transition-colors"
                >
                  <Link href={`/projects/${projectId}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Link>
                </Button>
                <div className="h-8 w-px bg-purple-200 hidden lg:block" />
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Propositions reçues
                  </h1>
                  <p className="text-purple-600 mt-1">
                    {stats.total} freelance{stats.total > 1 ? 's' : ''} ont postulé
                  </p>
                </div>
              </div>
              
              <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-sm px-4 py-2 w-fit">
                <Sparkles className="h-4 w-4 mr-2" />
                {stats.total} proposition{stats.total > 1 ? 's' : ''}
              </Badge>
            </div>
          </motion.div>

          {/* Project Summary Card - Modern Purple Design */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="mb-8 bg-white/80 backdrop-blur-sm border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full" />
                      <h2 className="text-xl font-bold text-gray-900">{project.title}</h2>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">
                          {project.budget.min.toLocaleString()} - {project.budget.max.toLocaleString()} {project.budget.currency}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-pink-600 bg-pink-50 px-3 py-1.5 rounded-lg">
                        <Briefcase className="h-4 w-4" />
                        <span>{project.budget.type === 'fixed' ? 'Forfait' : 'Taux horaire'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>Posté le {new Date(project.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Badge variant={project.status === 'open' ? 'default' : 'secondary'} 
                    className={project.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                    {project.status === 'open' ? '🔓 Public' : '📝 ' + project.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Cards - Purple Gradient */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {[
              { label: 'Total propositions', value: stats.total, icon: Users, color: 'purple', gradient: 'from-purple-500 to-purple-600' },
              { label: 'En attente', value: stats.pending, icon: Clock, color: 'amber', gradient: 'from-amber-500 to-amber-600' },
              { label: 'Acceptées', value: stats.accepted, icon: CheckCircle2, color: 'green', gradient: 'from-green-500 to-green-600' },
              { label: 'Rejetées', value: stats.rejected, icon: X, color: 'red', gradient: 'from-red-500 to-red-600' }
            ].map((stat, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Filters Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6"
          >
            <Card className="border-purple-200 shadow-lg">
              <CardContent className="p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 w-full">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
                      <Input
                        placeholder="Rechercher un freelance, compétence..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                    <div className="relative">
                      <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="pl-3 pr-8 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none bg-white cursor-pointer"
                      >
                        <option value="recent">Plus récent</option>
                        <option value="rating">Meilleure note</option>
                        <option value="budget">Budget croissant</option>
                        <option value="experience">Plus d'expérience</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="pl-3 pr-8 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none bg-white cursor-pointer"
                      >
                        <option value="all">Tous les statuts</option>
                        <option value="pending">En attente</option>
                        <option value="accepted">Acceptés</option>
                        <option value="rejected">Rejetés</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400 pointer-events-none" />
                    </div>

                    <div className="flex gap-1 border border-purple-200 rounded-lg p-1 bg-white">
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={viewMode === 'list' ? 'bg-purple-600 hover:bg-purple-700' : 'hover:bg-purple-100'}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className={viewMode === 'grid' ? 'bg-purple-600 hover:bg-purple-700' : 'hover:bg-purple-100'}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="lg:hidden border-purple-200 hover:bg-purple-100"
                    >
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filtres
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Applications List/Grid */}
          <AnimatePresence mode="wait">
            {filteredApplications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="text-center py-16 border-purple-200 shadow-lg">
                  <CardContent>
                    <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-12 w-12 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {stats.total === 0 ? "Aucune proposition reçue" : "Aucun résultat trouvé"}
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      {stats.total === 0 
                        ? "Les freelancers apparaîtront ici lorsqu'ils postuleront sur votre projet."
                        : "Aucun freelance ne correspond à vos critères de recherche."
                      }
                    </p>
                    {stats.total === 0 && (
                      <Button asChild className="bg-purple-600 hover:bg-purple-700">
                        <Link href={`/projects/${projectId}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir le projet
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={viewMode === 'grid' 
                  ? "grid grid-cols-1 lg:grid-cols-2 gap-6" 
                  : "space-y-6"
                }
              >
                <AnimatePresence>
                  {filteredApplications.map((application, index) => (
                    <motion.div
                      key={application._id}
                      variants={itemVariants}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                    >
                      <Card className={`overflow-hidden border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 ${
                        application.status === 'accepted' ? 'border-l-4 border-l-green-500' :
                        application.status === 'rejected' ? 'border-l-4 border-l-red-500 opacity-80' :
                        'border-l-4 border-l-purple-500'
                      }`}>
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row gap-6">
                            {/* Freelancer Avatar & Info */}
                            <div className="flex-shrink-0">
                              <div className="flex items-start gap-4">
                                <Avatar
                                  className="h-20 w-20 border-2 border-purple-200 shadow-lg cursor-pointer hover:scale-105 transition-transform duration-300"
                                  onClick={() => application.freelancer && navigateToProfile(application.freelancer._id)}
                                >
                                  <AvatarImage src={application.freelancer?.avatar} />
                                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xl font-semibold">
                                    {application.freelancer?.name?.charAt(0) || 'F'}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 
                                      className="text-xl font-bold text-gray-900 hover:text-purple-600 cursor-pointer transition-colors"
                                      onClick={() => application.freelancer && navigateToProfile(application.freelancer._id)}
                                    >
                                      {application.freelancer?.name || 'Freelancer'}
                                    </h3>
                                    {application.freelancer?.verified && (
                                      <Badge className="bg-purple-100 text-purple-700 text-xs border-purple-200">
                                        <Shield className="h-3 w-3 mr-1" />
                                        Vérifié
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-purple-600 text-sm mt-1">{application.freelancer?.title}</p>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {application.status === 'accepted' && (
                                    <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      Accepté
                                    </Badge>
                                  )}
                                  {application.status === 'rejected' && (
                                    <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
                                      <X className="h-3 w-3" />
                                      Rejeté
                                    </Badge>
                                  )}
                                  {application.status === 'pending' && (
                                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                      En attente
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                                {application.freelancer?.rating && (
                                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold text-gray-900">{application.freelancer.rating}</span>
                                    <span className="text-gray-500">({application.freelancer.completedProjects || 0})</span>
                                  </div>
                                )}
                                
                                {application.freelancer?.location && (
                                  <div className="flex items-center gap-1 text-gray-500">
                                    <MapPin className="h-3 w-3" />
                                    {application.freelancer.location}
                                  </div>
                                )}
                                
                                {application.freelancer?.responseTime && (
                                  <div className="flex items-center gap-1 text-gray-500">
                                    <Clock className="h-3 w-3" />
                                    {application.freelancer.responseTime}
                                  </div>
                                )}
                              </div>

                              {/* Proposal Stats */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3">
                                  <div className="flex items-center gap-2 text-purple-700 text-xs mb-1">
                                    <DollarSign className="h-3 w-3" />
                                    Budget proposé
                                  </div>
                                  <p className="text-lg font-bold text-purple-900">
                                    {application.proposedBudget?.toLocaleString()} {project.budget.currency}
                                  </p>
                                </div>
                                
                                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-3">
                                  <div className="flex items-center gap-2 text-pink-700 text-xs mb-1">
                                    <Clock className="h-3 w-3" />
                                    Durée estimée
                                  </div>
                                  <p className="text-lg font-bold text-pink-900">{application.estimatedDuration}</p>
                                </div>
                              </div>

                              {/* Cover Letter Preview */}
                              <div className="mb-4">
                                <p className="text-sm text-gray-600 line-clamp-2 italic">
                                  "{application.coverLetter || "Aucun message fourni."}"
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex flex-wrap gap-3 pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => application.freelancer && navigateToProfile(application.freelancer._id)}
                                  className="border-purple-200 hover:bg-purple-100 hover:text-purple-700"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Profil
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startChat(application.freelancerId)}
                                  className="border-purple-200 hover:bg-purple-100 hover:text-purple-700"
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Contacter
                                </Button>
                              </div>

                              {/* Date */}
                              <div className="mt-4 text-xs text-gray-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Postulé le {new Date(application.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}