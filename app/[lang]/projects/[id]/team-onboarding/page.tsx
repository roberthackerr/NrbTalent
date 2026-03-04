// app/projects/[id]/team-onboarding/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  CalendarDays,
  Sparkles,
  Brain,
  TrendingUp,
  BarChart3,
  Crown,
  Check,
  X,
  Building2,
  FolderKanban,
  CalendarCheck,
  FileSignature,
  Handshake,
  Rocket,
  TargetIcon,
  Timer,
  Wallet,
  MapPin as MapPinIcon,
  Languages,
  Code,
  Server,
  Palette,
  Database,
  Cpu,
  Cloud,
  Smartphone,
  Lock,
  Shield as ShieldIcon,
  Users as UsersIcon,
  Trophy,
  Gift,
  Coffee,
  Heart,
  Eye
} from 'lucide-react'

// Language dictionary
const dictionary = {
  en: {
    // Page titles and headers
    pageTitle: 'Team Onboarding',
    pageSubtitle: 'Prepare your project with the selected team',
    backButton: 'Back',
    myProjects: 'My Projects',
    loading: 'Loading...',
    
    // Onboarding steps
    discussionAgreement: 'Discussion & Agreement',
    discussionDescription: 'Exchange needs and validate project scope',
    configuration: 'Configuration',
    configurationDescription: 'Define objectives and planning',
    finalization: 'Finalization',
    finalizationDescription: 'Review details and launch project',
    
    // Progress
    progress: 'Progress',
    completed: 'Completed',
    current: 'Current',
    pending: 'Pending',
    
    // Project details
    projectDetails: 'Project Details',
    budget: 'Budget',
    duration: 'Duration',
    status: 'Status',
    milestones: 'Milestones',
    fixedPrice: 'Fixed Price',
    hourlyRate: 'Hourly Rate',
    
    // Team information
    projectClient: 'Project Client',
    selectedTeam: 'Selected Team',
    teamMembers: 'Team Members',
    viewProfile: 'View Profile',
    sendMessage: 'Send Message',
    
    // Skills and roles
    skillsExpertise: 'Skills & Expertise',
    keyMembers: 'Key Members',
    allMembers: 'All Members',
    leadDeveloper: 'Lead Developer',
    uiDesigner: 'UI Designer',
    backendEngineer: 'Backend Engineer',
    devopsEngineer: 'DevOps Engineer',
    projectManager: 'Project Manager',
    
    // Actions
    startProject: 'Start Project',
    startTracking: 'Start Project Tracking',
    initialization: 'Initialization...',
    readyToStart: 'Ready to start?',
    readyDescription: 'Start project tracking to collaborate effectively',
    projectMustBe: 'Project must be in "open" or "onboarding" status',
    
    // Tabs
    overview: 'Overview',
    timeline: 'Timeline',
    team: 'Team',
    documents: 'Documents',
    settings: 'Settings',
    
    // Timeline
    projectTimeline: 'Project Timeline',
    timelineDescription: 'Schedule and important deadlines',
    timelineNotAvailable: 'Timeline will be available once the project is launched',
    
    // Documents
    projectDocuments: 'Project Documents',
    uploadDocument: 'Upload Document',
    contract: 'Contract',
    requirements: 'Requirements',
    wireframes: 'Wireframes',
    designFiles: 'Design Files',
    technicalSpecs: 'Technical Specifications',
    
    // Settings
    projectSettings: 'Project Settings',
    communication: 'Communication',
    notifications: 'Notifications',
    accessControl: 'Access Control',
    
    // Status badges
    ready: 'Ready',
    inConfiguration: 'In Configuration',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    paused: 'Paused',
    
    // Team metrics
    teamRating: 'Team Rating',
    completedProjects: 'Completed Projects',
    successRate: 'Success Rate',
    totalEarnings: 'Total Earnings',
    availability: 'Availability',
    responseTime: 'Average Response Time',
    
    // Dialog messages
    startProjectTitle: 'Start Project Tracking',
    startProjectDescription: 'This will activate project tracking and notify all team members.',
    confirmStart: 'Confirm Start',
    cancel: 'Cancel',
    
    // Empty states
    projectNotFound: 'Project Not Found',
    projectNotFoundMessage: 'This project doesn\'t exist or you don\'t have access.',
    noTeamSelected: 'No Team Selected',
    noTeamSelectedMessage: 'This project doesn\'t have a team assigned yet.',
    
    // Success messages
    projectStarted: 'Project started successfully!',
    trackingActivated: 'Project tracking has been activated',
    
    // Error messages
    errorLoading: 'Error loading project data',
    errorStarting: 'Error starting project',
    
    // Additional info
    company: 'Company',
    location: 'Location',
    bio: 'Bio',
    experience: 'Experience',
    proficiency: 'Proficiency',
    certified: 'Certified',
    
    // Communication
    communicationFrequency: 'Communication Frequency',
    meetingFrequency: 'Meeting Frequency',
    preferredChannels: 'Preferred Channels',
    
    // Skill categories
    frontend: 'Frontend',
    backend: 'Backend',
    design: 'Design',
    database: 'Database',
    mobile: 'Mobile',
    devops: 'DevOps',
    aiMl: 'AI/ML',
    cybersecurity: 'Cybersecurity',
    fullstack: 'Full Stack',
    testing: 'Testing'
  },
  fr: {
    // French translations
    pageTitle: 'Intégration d\'Équipe',
    pageSubtitle: 'Préparez votre projet avec l\'équipe sélectionnée',
    backButton: 'Retour',
    // ... etc.
  }
}

// Interfaces
interface Skill {
  name: string;
  category?: string;
  level?: number;
  years?: number;
  certification?: boolean;
}

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  isLead: boolean;
  skills: Skill[];
  title?: string;
  bio?: string;
  location?: string;
  rating?: number;
  completedProjects?: number;
  joinDate?: string;
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  avatar?: string;
  rating?: number;
  completedProjects?: number;
  totalEarnings?: number;
  successRate?: number;
  availability: 'available' | 'busy' | 'unavailable';
  responseTime?: string;
  skills: Skill[];
  members: TeamMember[];
  memberCount: number;
  preferredProjectTypes?: string[];
  communicationPreferences?: {
    frequency: string;
    channels: string[];
    meetingFrequency: string;
  };
}

interface Client {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  rating?: number;
  title?: string;
  bio?: string;
  location?: string;
  company?: string;
  completedProjects?: number;
  memberSince?: string;
  responseRate?: number;
}

interface Project {
  _id: string;
  title: string;
  description?: string;
  status: 'draft' | 'open' | 'onboarding' | 'in-progress' | 'completed' | 'cancelled' | 'paused';
  client: Client;
  team?: Team;
  budget?: {
    min: number;
    max: number;
    type: 'fixed' | 'hourly';
    currency: string;
  };
  finalBudget?: number;
  timeline?: string;
  milestones?: any[];
  communicationPreferences?: any;
  onboardingCompleted?: boolean;
  trackingStartedAt?: string;
  createdAt: string;
  updatedAt: string;
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  }>;
}

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: any;
  status: 'completed' | 'current' | 'pending';
  color: string;
}

// Helper function to get skill icon
const getSkillIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'frontend':
    case 'web':
      return <Code className="h-4 w-4" />;
    case 'backend':
    case 'api':
      return <Server className="h-4 w-4" />;
    case 'design':
    case 'ui/ux':
      return <Palette className="h-4 w-4" />;
    case 'database':
      return <Database className="h-4 w-4" />;
    case 'mobile':
      return <Smartphone className="h-4 w-4" />;
    case 'devops':
    case 'cloud':
      return <Cloud className="h-4 w-4" />;
    case 'ai':
    case 'ml':
      return <Cpu className="h-4 w-4" />;
    case 'security':
      return <Lock className="h-4 w-4" />;
    default:
      return <Code className="h-4 w-4" />;
  }
};

// Helper function to get skill color
const getSkillColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'frontend':
    case 'web':
      return 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    case 'backend':
    case 'api':
      return 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
    case 'design':
    case 'ui/ux':
      return 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    case 'database':
      return 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    case 'mobile':
      return 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800';
    case 'devops':
    case 'cloud':
      return 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800';
    case 'ai':
    case 'ml':
      return 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800';
    case 'security':
      return 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
    default:
      return 'bg-slate-50 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800';
  }
};

export default function TeamProjectOnboardingPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<'client' | 'team'>('client')
  const [loading, setLoading] = useState(true)
  const [startingProject, setStartingProject] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'team' | 'documents' | 'settings'>('overview')
  const [language, setLanguage] = useState('en')
  const [startDialogOpen, setStartDialogOpen] = useState(false)
  
  const dict = dictionary[language as keyof typeof dictionary]

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 1,
      title: dict.discussionAgreement,
      description: dict.discussionDescription,
      icon: MessageSquare,
      status: "completed",
      color: "text-green-600 bg-green-100 dark:bg-green-900/30"
    },
    {
      id: 2,
      title: dict.configuration,
      description: dict.configurationDescription,
      icon: Target,
      status: "current",
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30"
    },
    {
      id: 3,
      title: dict.finalization,
      description: dict.finalizationDescription,
      icon: CheckCircle2,
      status: "pending",
      color: "text-slate-400 bg-slate-100 dark:bg-slate-800"
    }
  ]

  useEffect(() => {
    const loadOnboardingData = async () => {
      try {
        setLoading(true)
        
        const response = await fetch(`/api/projects/${projectId}/team-onboarding`)
        
        if (!response.ok) {
          throw new Error('Failed to load onboarding data')
        }

        const data = await response.json()
        setProject(data.project)
        setCurrentUserRole(data.currentUserRole)

      } catch (error) {
        console.error('Error loading onboarding:', error)
        toast({
          title: dict.errorLoading,
          description: "Unable to load project data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadOnboardingData()
  }, [projectId, toast, dict.errorLoading])

  const startProjectTracking = async () => {
    try {
      setStartingProject(true)
      
      const response = await fetch(`/api/projects/${projectId}/team-onboarding/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error starting project tracking')
      }

      toast({
        title: dict.projectStarted,
        description: dict.trackingActivated,
        className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0'
      })

      setStartDialogOpen(false)
      router.push(data.redirectUrl || `/projects/${projectId}/tracking`)
      
    } catch (error) {
      console.error('Error starting project:', error)
      toast({
        title: dict.errorStarting,
        description: error instanceof Error ? error.message : "Unable to start tracking",
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

  const navigateToTeamProfile = () => {
    if (project?.team?._id) {
      router.push(`/teams/${project.team._id}`)
    }
  }

  const navigateToMemberProfile = (memberId: string) => {
    router.push(`/profile/${memberId}`)
  }

  const renderSkillBadge = (skill: Skill, index: number) => {
    return (
      <Badge 
        key={index}
        variant="secondary" 
        className={`${getSkillColor(skill.category || 'other')} hover:opacity-90 transition-opacity text-xs`}
      >
        <div className="flex items-center gap-1">
          {getSkillIcon(skill.category || 'other')}
          <span>{skill.name}</span>
          {skill.level && (
            <span className="ml-1 text-xs opacity-70">• {skill.level}/5</span>
          )}
        </div>
      </Badge>
    )
  }

  const getTeamLead = () => {
    return project?.team?.members.find(member => member.isLead)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-20 animate-pulse rounded-full"></div>
            <Loader2 className="h-16 w-16 text-blue-600 dark:text-blue-400 animate-spin relative z-10" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {dict.loading}
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Preparing your workspace...
          </p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center p-4">
        <Card className="max-w-md border-0 shadow-2xl bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-900">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-20 animate-pulse rounded-full"></div>
              <Briefcase className="h-12 w-12 text-slate-400 dark:text-slate-600 relative z-10" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {dict.projectNotFound}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {dict.projectNotFoundMessage}
            </p>
            <Button 
              onClick={() => router.push('/dashboard/client/projects')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {dict.myProjects}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!project.team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center p-4">
        <Card className="max-w-md border-0 shadow-2xl bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-900">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-20 animate-pulse rounded-full"></div>
              <Users className="h-12 w-12 text-slate-400 dark:text-slate-600 relative z-10" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {dict.noTeamSelected}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {dict.noTeamSelectedMessage}
            </p>
            <Button 
              onClick={() => router.push(`/projects/${projectId}/applications`)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              View Applications
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOnboardingEligible = ['open', 'onboarding'].includes(project.status)
  const teamLead = getTeamLead()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-slate-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="container mx-auto px-4 py-8 relative">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-6 group transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowRight className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform rotate-180" />
                {dict.backButton}
              </Button>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {dict.pageTitle}
                  </h1>
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                    <Users className="h-3 w-3 mr-1" />
                    Team Project
                  </Badge>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  {dict.pageSubtitle} <span className="font-semibold text-slate-900 dark:text-white">"{project.title}"</span>
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <Badge 
                  variant={project.status === 'onboarding' ? 'default' : 'secondary'}
                  className="capitalize border-0 shadow-sm bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  {dict.status}: {project.status}
                </Badge>
                <div className="text-right bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-900 p-3 rounded-xl shadow-sm">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{dict.budget}</p>
                  <p className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {project.finalBudget 
                      ? `${project.finalBudget.toLocaleString()} ${project.budget?.currency || '€'}` 
                      : `${project.budget?.min?.toLocaleString()} - ${project.budget?.max?.toLocaleString()} ${project.budget?.currency || '€'}`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Progress Card */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {dict.progress}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {onboardingSteps.map((step) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                      step.status === "completed" && "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
                      step.status === "current" && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                      step.status === "pending" && "bg-slate-100 dark:bg-slate-800 text-slate-400"
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
                        step.status === "completed" && "text-green-900 dark:text-green-300",
                        step.status === "current" && "text-blue-900 dark:text-blue-300",
                        step.status === "pending" && "text-slate-500 dark:text-slate-400"
                      )}>
                        {step.title}
                      </h4>
                      <p className={cn(
                        "text-xs mt-1",
                        step.status === "completed" && "text-green-700 dark:text-green-400",
                        step.status === "current" && "text-blue-700 dark:text-blue-400",
                        step.status === "pending" && "text-slate-400 dark:text-slate-500"
                      )}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="pt-4 border-t border-slate-100 dark:border-gray-700">
                <div className="w-full">
                  <Progress value={project.onboardingCompleted ? 100 : 50} className="h-2" />
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mt-2">
                    <span>{project.onboardingCompleted ? '100%' : '50%'} {dict.completed}</span>
                    <span>{project.onboardingCompleted ? '3/3' : '2/3'} steps</span>
                  </div>
                </div>
              </CardFooter>
            </Card>

            {/* Project Details Card */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  {dict.projectDetails}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">{dict.budget}</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {project.finalBudget 
                      ? `${project.finalBudget.toLocaleString()} ${project.budget?.currency || '€'}` 
                      : `${project.budget?.min?.toLocaleString()} - ${project.budget?.max?.toLocaleString()} ${project.budget?.currency || '€'}`
                    }
                  </span>
                </div>

                {project.timeline && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <CalendarDays className="h-4 w-4" />
                      <span className="text-sm">{dict.duration}</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">{project.timeline}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Target className="h-4 w-4" />
                    <span className="text-sm">{dict.status}</span>
                  </div>
                  <Badge variant={
                    project.status === 'onboarding' ? 'default' :
                    project.status === 'completed' ? 'secondary' :
                    'outline'
                  } className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                    {project.status}
                  </Badge>
                </div>

                {project.milestones && project.milestones.length > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Award className="h-4 w-4" />
                      <span className="text-sm">{dict.milestones}</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">{project.milestones.length}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Stats Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-slate-900 dark:text-white">Team Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{dict.teamRating}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {project.team?.rating?.toFixed(1) || 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{dict.completedProjects}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {project.team?.completedProjects || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{dict.successRate}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {project.team?.successRate ? `${project.team.successRate}%` : 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Team Size</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {project.team?.memberCount || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Start Project Card */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900 dark:text-white">{dict.readyToStart}</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  {dict.readyDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 shadow-lg hover:shadow-xl"
                      disabled={!isOnboardingEligible}
                      size="lg"
                    >
                      {startingProject ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {dict.initialization}
                        </>
                      ) : (
                        <>
                          <Rocket className="h-4 w-4 mr-2" />
                          {dict.startProject}
                        </>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {dict.startProjectTitle}
                      </DialogTitle>
                      <DialogDescription>
                        {dict.startProjectDescription}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-lg mb-4">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Project Details:</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Project:</span>
                            <span className="font-medium">{project.title}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Team:</span>
                            <span className="font-medium">{project.team?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Budget:</span>
                            <span className="font-medium">{project.finalBudget || project.budget?.max} {project.budget?.currency || '€'}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        All team members will be notified and project tracking will be activated.
                      </p>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setStartDialogOpen(false)}
                        disabled={startingProject}
                      >
                        {dict.cancel}
                      </Button>
                      <Button
                        onClick={startProjectTracking}
                        disabled={startingProject}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      >
                        {startingProject ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        {dict.confirmStart}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                {!isOnboardingEligible && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
                    {dict.projectMustBe}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Project Header */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">{project.title}</h1>
                    <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">{project.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                      {project.budget?.type === 'fixed' ? dict.fixedPrice : dict.hourlyRate}
                    </Badge>
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                      <Handshake className="h-3 w-3 mr-1" />
                      Team Project
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs Navigation */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-0">
                <Tabs defaultValue="overview" value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
                  <TabsList className="w-full justify-start h-14 bg-transparent border-b rounded-none">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/10 data-[state=active]:to-purple-500/10 rounded-none h-full px-6 border-b-2 border-transparent data-[state=active]:border-blue-500">
                      <Briefcase className="h-4 w-4 mr-2" />
                      {dict.overview}
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/10 data-[state=active]:to-purple-500/10 rounded-none h-full px-6 border-b-2 border-transparent data-[state=active]:border-blue-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      {dict.timeline}
                    </TabsTrigger>
                    <TabsTrigger value="team" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/10 data-[state=active]:to-purple-500/10 rounded-none h-full px-6 border-b-2 border-transparent data-[state=active]:border-blue-500">
                      <Users className="h-4 w-4 mr-2" />
                      {dict.team}
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/10 data-[state=active]:to-purple-500/10 rounded-none h-full px-6 border-b-2 border-transparent data-[state=active]:border-blue-500">
                      <FileText className="h-4 w-4 mr-2" />
                      {dict.documents}
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/10 data-[state=active]:to-purple-500/10 rounded-none h-full px-6 border-b-2 border-transparent data-[state=active]:border-blue-500">
                      <ShieldIcon className="h-4 w-4 mr-2" />
                      {dict.settings}
                    </TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Client Card */}
                      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-900 hover:shadow-xl transition-shadow">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            {dict.projectClient}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div 
                            className="flex items-center gap-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer transition-colors group"
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
                                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {project.client?.name}
                                  </h3>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{project.client?.title}</p>
                                  {project.client?.company && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                      <Building className="h-3 w-3" />
                                      {project.client.company}
                                    </p>
                                  )}
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500 dark:text-slate-400">
                                {project.client?.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPinIcon className="h-3 w-3" />
                                    {project.client.location}
                                  </div>
                                )}
                                {project.client?.completedProjects && (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {project.client.completedProjects} {dict.completedProjects.toLowerCase()}
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
                            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700">
                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{project.client.bio}</p>
                            </div>
                          )}

                          <div className="mt-4 flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                              onClick={navigateToClientProfile}
                            >
                              {dict.viewProfile}
                            </Button>
                            <Button variant="outline" size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-900/30">
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Team Card */}
                      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-900 hover:shadow-xl transition-shadow">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            {dict.selectedTeam}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div 
                            className="flex items-center gap-4 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 cursor-pointer transition-colors group"
                            onClick={navigateToTeamProfile}
                          >
                            <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                              <AvatarImage src={project.team?.avatar} />
                              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold">
                                {project.team?.name?.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                      {project.team?.name}
                                    </h3>
                                    <Badge className={`${
                                      project.team?.availability === 'available' ? 'bg-green-500' :
                                      project.team?.availability === 'busy' ? 'bg-amber-500' :
                                      'bg-red-500'
                                    } text-white border-0 text-xs`}>
                                      {project.team?.availability}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">{project.team?.description}</p>
                                  
                                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-1">
                                      <UsersIcon className="h-3 w-3" />
                                      {project.team?.memberCount} {dict.teamMembers.toLowerCase()}
                                    </div>
                                    {project.team?.rating && (
                                      <div className="flex items-center gap-1">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        {project.team.rating.toFixed(1)}
                                      </div>
                                    )}
                                    {project.team?.successRate && (
                                      <div className="flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        {project.team.successRate}% success
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                              </div>
                              
                              {/* Team Skills */}
                              {project.team?.skills && project.team.skills.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {project.team.skills.slice(0, 3).map((skill, index) => renderSkillBadge(skill, index))}
                                  {project.team.skills.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{project.team.skills.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                              onClick={navigateToTeamProfile}
                            >
                              {dict.viewProfile}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="hover:bg-purple-50 dark:hover:bg-purple-900/30"
                              onClick={() => router.push(`/messages?team=${project.team?._id}&project=${projectId}`)}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Timeline Tab */}
                  <TabsContent value="timeline" className="p-6">
                    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-xl">{dict.projectTimeline}</CardTitle>
                        <CardDescription>
                          {dict.timelineDescription}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                          <div className="relative inline-block mb-6">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-20 animate-pulse rounded-full"></div>
                            <Calendar className="h-16 w-16 text-slate-400 dark:text-slate-600 relative z-10" />
                          </div>
                          <p className="text-lg mb-4">{dict.timelineNotAvailable}</p>
                          <Button 
                            onClick={() => setStartDialogOpen(true)}
                            disabled={startingProject || !isOnboardingEligible}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          >
                            <Rocket className="h-4 w-4 mr-2" />
                            {dict.startProject}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Team Tab */}
                  <TabsContent value="team" className="p-6">
                    <div className="space-y-6">
                      {/* Team Overview */}
                      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            {dict.selectedTeam}: {project.team?.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Team Stats */}
                            <div className="space-y-4">
                              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-slate-600 dark:text-slate-400">{dict.teamRating}</span>
                                  <span className="font-bold text-xl text-slate-900 dark:text-white">
                                    {project.team?.rating?.toFixed(1) || 'N/A'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                      key={star}
                                      className={`h-4 w-4 ${
                                        star <= Math.round(project.team?.rating || 0) 
                                          ? 'fill-yellow-400 text-yellow-400' 
                                          : 'text-slate-300 dark:text-slate-600'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-slate-600 dark:text-slate-400">{dict.successRate}</span>
                                  <span className="font-bold text-xl text-slate-900 dark:text-white">
                                    {project.team?.successRate ? `${project.team.successRate}%` : 'N/A'}
                                  </span>
                                </div>
                                <Progress value={project.team?.successRate || 0} className="h-2" />
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-slate-600 dark:text-slate-400">{dict.completedProjects}</span>
                                  <span className="font-bold text-xl text-slate-900 dark:text-white">
                                    {project.team?.completedProjects || 0}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  <span>Proven track record</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Team Members */}
                      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                        <CardHeader>
                          <CardTitle className="text-xl">{dict.teamMembers}</CardTitle>
                          <CardDescription>
                            {project.team?.memberCount} professionals working on your project
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-4">
                              {project.team?.members.map((member) => (
                                <Card 
                                  key={member._id} 
                                  className="border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-900"
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3 flex-1">
                                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                          <AvatarImage src={member.avatar} />
                                          <AvatarFallback className={`${
                                            member.isLead 
                                              ? 'bg-gradient-to-r from-purple-500 to-purple-600' 
                                              : 'bg-gradient-to-r from-blue-500 to-blue-600'
                                          } text-white`}>
                                            {member.name?.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                                              {member.name}
                                            </h4>
                                            {member.isLead && (
                                              <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 text-xs">
                                                <Crown className="h-3 w-3 mr-1" />
                                                Team Lead
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-sm text-slate-600 dark:text-slate-400">{member.role}</p>
                                          {member.rating && (
                                            <div className="flex items-center gap-1 mt-1">
                                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {member.rating} ({member.completedProjects || 0} projects)
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => navigateToMemberProfile(member._id)}
                                          className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                        >
                                          <Mail className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {/* Member Skills */}
                                    {member.skills && member.skills.length > 0 && (
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {member.skills.slice(0, 3).map((skill, index) => renderSkillBadge(skill, index))}
                                        {member.skills.length > 3 && (
                                          <Badge variant="outline" className="text-xs">
                                            +{member.skills.length - 3} more
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                    
                                    {member.bio && (
                                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 line-clamp-2">
                                        {member.bio}
                                      </p>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Documents Tab */}
                  <TabsContent value="documents" className="p-6">
                    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-xl">{dict.projectDocuments}</CardTitle>
                        <CardDescription>
                          Important project documents and files
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                          <div className="relative inline-block mb-6">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-20 animate-pulse rounded-full"></div>
                            <FileText className="h-16 w-16 text-slate-400 dark:text-slate-600 relative z-10" />
                          </div>
                          <p className="text-lg mb-4">Documents will be available once the project starts</p>
                          <div className="flex flex-wrap justify-center gap-2 mb-6">
                            <Badge variant="outline" className="text-sm">{dict.contract}</Badge>
                            <Badge variant="outline" className="text-sm">{dict.requirements}</Badge>
                            <Badge variant="outline" className="text-sm">{dict.wireframes}</Badge>
                            <Badge variant="outline" className="text-sm">{dict.designFiles}</Badge>
                            <Badge variant="outline" className="text-sm">{dict.technicalSpecs}</Badge>
                          </div>
                          <Button 
                            onClick={() => setStartDialogOpen(true)}
                            disabled={startingProject || !isOnboardingEligible}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          >
                            <Rocket className="h-4 w-4 mr-2" />
                            {dict.startProject}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Settings Tab */}
                  <TabsContent value="settings" className="p-6">
                    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-xl">{dict.projectSettings}</CardTitle>
                        <CardDescription>
                          Configure project preferences and communication
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Communication Settings */}
                            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                              <CardHeader>
                                <CardTitle className="text-lg">{dict.communication}</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div>
                                  <Label className="text-sm">{dict.communicationFrequency}</Label>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {['daily', 'weekly', 'bi-weekly', 'monthly'].map((freq) => (
                                      <Badge 
                                        key={freq}
                                        variant={project.communicationPreferences?.frequency === freq ? 'default' : 'outline'}
                                        className="cursor-pointer"
                                      >
                                        {freq}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm">{dict.preferredChannels}</Label>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {['email', 'in_app', 'slack', 'whatsapp'].map((channel) => (
                                      <Badge 
                                        key={channel}
                                        variant={project.communicationPreferences?.channels?.includes(channel) ? 'default' : 'outline'}
                                        className="cursor-pointer"
                                      >
                                        {channel}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Notification Settings */}
                            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                              <CardHeader>
                                <CardTitle className="text-lg">{dict.notifications}</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-sm">Milestone updates</Label>
                                    <Badge variant="default">Active</Badge>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <Label className="text-sm">Task assignments</Label>
                                    <Badge variant="default">Active</Badge>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <Label className="text-sm">Weekly reports</Label>
                                    <Badge variant="outline">Inactive</Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Access Control */}
                          <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                            <CardHeader>
                              <CardTitle className="text-lg">{dict.accessControl}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-slate-900 dark:text-white">Client Access</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Full project access</p>
                                  </div>
                                  <Badge variant="default">Owner</Badge>
                                </div>
                                
                                <Separator />
                                
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-slate-900 dark:text-white">Team Access</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                      {project.team?.memberCount} team members
                                    </p>
                                  </div>
                                  <Badge variant="outline">Collaborator</Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}