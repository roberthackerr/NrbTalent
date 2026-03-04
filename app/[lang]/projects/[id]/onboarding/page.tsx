// app/projects/[id]/onboarding/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Users, 
  FileText, 
  ArrowRight,
  Star,
  Shield,
  Zap,
  Loader2,
  MapPin,
  Briefcase,
  Award,
  Mail,
  Phone,
  Globe,
  ChevronRight,
  Building,
  Target,
  DollarSign,
  CalendarDays
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

// Add Skill interface based on the error
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
  email: string
  avatar?: string
  rating?: number
  skills?: Skill[]  // Changed from string[] to Skill[]
  title?: string
  bio?: string
  location?: string
}

interface Client {
  _id: string
  name: string
  email: string
  avatar?: string
  rating?: number
  title?: string
  bio?: string
  location?: string
  company?: string
  completedProjects?: number
  memberSince?: string
  responseRate?: number
}

interface Project {
  _id: string
  title: string
  description?: string
  status: 'draft' | 'open' | 'onboarding' | 'in-progress' | 'completed' | 'cancelled' | 'paused'
  client?: Client
  freelancer?: Freelancer
  budget?: {
    min: number
    max: number
    type: 'fixed' | 'hourly'
    currency: string
  }
  finalBudget?: number
  timeline?: string
  milestones?: any[]
  communicationPreferences?: any
  onboardingCompleted?: boolean
  trackingStartedAt?: string
  createdAt: string
  updatedAt: string
}

interface Message {
  _id: string
  content: string
  senderId: string
  senderType: 'client' | 'freelancer'
  timestamp: string
  read: boolean
}

const onboardingSteps = [
  {
    id: 1,
    title: "Discussion & Accord",
    description: "Échange des besoins et validation du projet",
    icon: MessageSquare,
    status: "completed",
    color: "text-green-600 bg-green-100"
  },
  {
    id: 2,
    title: "Configuration",
    description: "Définition des objectifs et planning",
    icon: Target,
    status: "current",
    color: "text-blue-600 bg-blue-100"
  },
  {
    id: 3,
    title: "Finalisation",
    description: "Revue des détails et lancement",
    icon: CheckCircle2,
    status: "pending",
    color: "text-slate-400 bg-slate-100"
  }
]

export default function ProjectOnboardingPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<'client' | 'freelancer'>('client')
  const [loading, setLoading] = useState(true)
  const [startingProject, setStartingProject] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'team'>('overview')

  // Charger les données d'onboarding
  useEffect(() => {
    const loadOnboardingData = async () => {
      try {
        setLoading(true)
        
        const response = await fetch(`/api/projects/${projectId}/onboarding`)
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des données')
        }

        const data = await response.json()
        
        // Transform skills if they come as objects
        const transformedProject = {
          ...data.project,
          freelancer: data.project.freelancer ? {
            ...data.project.freelancer,
            skills: Array.isArray(data.project.freelancer.skills) 
              ? data.project.freelancer.skills.map((skill: any) => 
                  typeof skill === 'string' 
                    ? { id: skill, name: skill } 
                    : skill
                )
              : []
          } : undefined
        }
        
        setProject(transformedProject)
        setMessages(data.messages || [])
        setCurrentUserRole(data.currentUserRole)

      } catch (error) {
        console.error('Erreur chargement onboarding:', error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du projet",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadOnboardingData()
  }, [projectId, toast])

  const startProjectTracking = async () => {
    try {
      setStartingProject(true)
      
      const response = await fetch(`/api/projects/${projectId}/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start_tracking'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du démarrage du suivi')
      }

      toast({
        title: "Projet lancé avec succès!",
        description: "Le suivi du projet a été activé",
      })

      router.push(data.redirectUrl || `/projects/${projectId}/tracking`)
      
    } catch (error) {
      console.error('Erreur démarrage projet:', error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de démarrer le suivi",
        variant: "destructive"
      })
    } finally {
      setStartingProject(false)
    }
  }

  const navigateToClientProfile = () => {
    if (project?.client?._id) {
      router.push(`/profile/${project.client._id}`)
    }
  }

  const navigateToFreelancerProfile = () => {
    if (project?.freelancer?._id) {
      router.push(`/profile/${project.freelancer._id}`)
    }
  }

  // Helper function to render skills
  const renderSkills = (skills?: Skill[]) => {
    if (!skills || skills.length === 0) return null
    
    return (
      <div className="flex flex-wrap gap-1 mt-3">
        {skills.slice(0, 3).map((skill, index) => (
          <Badge key={skill.id || index} variant="secondary" className="text-xs">
            {skill.name || skill.id}
          </Badge>
        ))}
        {skills.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{skills.length - 3}
          </Badge>
        )}
      </div>
    )
  }

  // Helper function to get featured skills
  const getFeaturedSkills = (skills?: Skill[]) => {
    if (!skills) return []
    return skills.filter(skill => skill.featured).slice(0, 3)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-slate-900">Chargement du projet</h3>
          <p className="text-slate-600 mt-2">Préparation de votre espace de travail...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="h-8 w-8 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Projet non trouvé</h1>
          <p className="text-slate-600 mb-6">Le projet que vous recherchez n'existe pas ou vous n'y avez pas accès.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    )
  }

  const isOnboardingEligible = ['open', 'onboarding'].includes(project.status)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
                <p className="text-slate-600">Préparation du projet</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {project.onboardingCompleted ? 'Prêt' : 'En configuration'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Sidebar - Progression */}
          <div className="xl:col-span-1 space-y-6">
            {/* Carte Progression */}
            <Card className="bg-white/60 backdrop-blur-sm border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Progression
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {onboardingSteps.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                      step.status === "completed" && "bg-green-100 text-green-600",
                      step.status === "current" && "bg-blue-100 text-blue-600",
                      step.status === "pending" && "bg-slate-100 text-slate-400"
                    )}>
                      {step.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "font-semibold text-sm",
                        step.status === "completed" && "text-green-900",
                        step.status === "current" && "text-blue-900",
                        step.status === "pending" && "text-slate-500"
                      )}>
                        {step.title}
                      </h4>
                      <p className={cn(
                        "text-xs mt-1",
                        step.status === "completed" && "text-green-700",
                        step.status === "current" && "text-blue-700",
                        step.status === "pending" && "text-slate-400"
                      )}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="pt-4 border-t border-slate-100">
                <div className="w-full">
                  <Progress value={project.onboardingCompleted ? 100 : 50} className="h-2" />
                  <div className="flex justify-between text-xs text-slate-600 mt-2">
                    <span>{project.onboardingCompleted ? '100%' : '50%'} complété</span>
                    <span>{project.onboardingCompleted ? '3/3' : '2/3'} étapes</span>
                  </div>
                </div>
              </CardFooter>
            </Card>

            {/* Carte Détails Projet */}
            <Card className="bg-white/60 backdrop-blur-sm border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-slate-600" />
                  Détails du projet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-slate-600">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Budget</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {project.finalBudget 
                      ? `${project.finalBudget.toLocaleString()} €` 
                      : `${project.budget?.min?.toLocaleString()} - ${project.budget?.max?.toLocaleString()} €`
                    }
                  </span>
                </div>

                {project.timeline && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <CalendarDays className="h-4 w-4" />
                      <span className="text-sm">Durée</span>
                    </div>
                    <span className="font-semibold text-slate-900">{project.timeline}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Target className="h-4 w-4" />
                    <span className="text-sm">Statut</span>
                  </div>
                  <Badge variant={
                    project.status === 'in-progress' ? 'default' :
                    project.status === 'completed' ? 'secondary' :
                    'outline'
                  }>
                    {project.status}
                  </Badge>
                </div>

                {project.milestones && project.milestones.length > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Award className="h-4 w-4" />
                      <span className="text-sm">Jalons</span>
                    </div>
                    <span className="font-semibold text-slate-900">{project.milestones.length}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Carte Actions */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">Prêt à commencer?</CardTitle>
                <CardDescription className="text-slate-600">
                  Lancez le suivi de projet pour collaborer efficacement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={startProjectTracking}
                  disabled={startingProject || !isOnboardingEligible}
                  size="lg"
                >
                  {startingProject ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Initialisation...
                    </>
                  ) : (
                    <>
                      Démarrer le projet
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                {!isOnboardingEligible && (
                  <p className="text-xs text-slate-500 text-center mt-2">
                    Le projet doit être en statut "open" ou "onboarding"
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contenu Principal */}
          <div className="xl:col-span-3 space-y-6">
            {/* En-tête du projet */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-slate-900 mb-3">{project.title}</h1>
                    <p className="text-lg text-slate-700 leading-relaxed">{project.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                      {project.budget?.type === 'fixed' ? 'Budget fixe' : 'Taux horaire'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation par onglets */}
            <div className="border-b border-slate-200">
              <nav className="flex space-x-8">
                {[
                  { id: 'overview', label: 'Aperçu', icon: Briefcase },
                  { id: 'timeline', label: 'Planning', icon: Calendar },
                  { id: 'team', label: 'Équipe', icon: Users }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors",
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Contenu des onglets */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profil Client */}
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building className="h-5 w-5 text-blue-600" />
                      Client du projet
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors group"
                      onClick={navigateToClientProfile}
                    >
                      <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                        <AvatarImage src={project.client?.avatar} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold">
                          {project.client?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {project.client?.name}
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">{project.client?.title}</p>
                            {project.client?.company && (
                              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                <Building className="h-3 w-3" />
                                {project.client.company}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                          {project.client?.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {project.client.location}
                            </div>
                          )}
                          {project.client?.completedProjects && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {project.client.completedProjects} projets
                            </div>
                          )}
                          {project.client?.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {project.client.rating}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {project.client?.bio && (
                      <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-700 leading-relaxed">{project.client.bio}</p>
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={navigateToClientProfile}>
                        Voir le profil
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Profil Freelancer */}
                {project.freelancer && (
                  <Card className="bg-white/80 backdrop-blur-sm border-slate-200 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Award className="h-5 w-5 text-green-600" />
                        Freelancer assigné
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="flex items-center gap-4 p-4 rounded-lg bg-green-50 hover:bg-green-100 cursor-pointer transition-colors group"
                        onClick={navigateToFreelancerProfile}
                      >
                        <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                          <AvatarImage src={project.freelancer?.avatar} />
                          <AvatarFallback className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold">
                            {project.freelancer?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-slate-900 group-hover:text-green-600 transition-colors">
                                {project.freelancer?.name}
                              </h3>
                              <p className="text-sm text-slate-600 mt-1">{project.freelancer?.title}</p>
                              {project.freelancer?.rating && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-medium text-slate-700">{project.freelancer.rating}</span>
                                  <span className="text-xs text-slate-500">({project.freelancer.completedProjects || 0} projets)</span>
                                </div>
                              )}
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-green-600 transition-colors" />
                          </div>

                          {/* Use the renderSkills helper function */}
                          {renderSkills(project.freelancer.skills)}
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={navigateToFreelancerProfile}>
                          Voir le profil
                        </Button>
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'team' && (
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="text-xl">Équipe du projet</CardTitle>
                  <CardDescription>
                    Les personnes impliquées dans ce projet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Section Client */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Building className="h-5 w-5 text-blue-600" />
                        Client
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={project.client?.avatar} />
                                <AvatarFallback className="bg-blue-600 text-white">
                                  {project.client?.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-900">{project.client?.name}</h4>
                                <p className="text-sm text-slate-600">Client</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={navigateToClientProfile}>
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Section Freelancer */}
                    {project.freelancer && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                          <Award className="h-5 w-5 text-green-600" />
                          Freelancer
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="bg-green-50 border-green-200">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={project.freelancer?.avatar} />
                                  <AvatarFallback className="bg-green-600 text-white">
                                    {project.freelancer?.name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-slate-900">{project.freelancer?.name}</h4>
                                  <p className="text-sm text-slate-600">Freelancer</p>
                                  {project.freelancer.rating && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      <span className="text-xs text-slate-600">{project.freelancer.rating}</span>
                                    </div>
                                  )}
                                </div>
                                <Button variant="ghost" size="sm" onClick={navigateToFreelancerProfile}>
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'timeline' && (
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="text-xl">Planning du projet</CardTitle>
                  <CardDescription>
                    Calendrier et échéances importantes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-slate-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Le planning sera disponible une fois le projet lancé</p>
                    <Button 
                      className="mt-4" 
                      onClick={startProjectTracking}
                      disabled={startingProject || !isOnboardingEligible}
                    >
                      Démarrer le projet pour accéder au planning
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}