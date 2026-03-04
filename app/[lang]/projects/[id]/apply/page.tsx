'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Clock, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Calendar, 
  MapPin, 
  Users, 
  Star, 
  X, 
  Euro, 
  Sparkles, 
  Wand2, 
  Brain, 
  Target, 
  Zap,
  User,
  Building2,
  Crown,
  Loader2,
  ChevronDown,
  ExternalLink
} from 'lucide-react'
import { ProposalAssistantWidget } from '@/components/proposal-assistant/ProposalAssistantWidget'
import { useToast } from '@/hooks/use-toast'
import { useSession } from 'next-auth/react'
import AccessDenied from '@/components/auth/access-denied'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

interface ApplicationData {
  coverLetter: string
  proposedBudget: number
  estimatedDuration: string
  attachments: Array<{
    name: string
    url: string
    type: string
  }>
  applyMode: 'individual' | 'team'
  teamId?: string
}

interface ProjectData {
  _id: string
  title: string
  description: string
  budget: {
    min: number
    max: number
    type: string
    currency: string
  }
  category: string
  skills: string[]
  deadline: string
  location?: string
  applicationCount: number
  saveCount: number
  createdAt: string
  milestones: any[]
  client?: {
    _id: string
    name: string
    avatar?: string
    title?: string
    rating?: number
    completedProjects?: number
  }
}

interface FreelancerData {
  _id: string
  name: string
  title?: string
  skills: string[]
  hourlyRate?: number
  bio?: string
  experience?: any[]
  portfolio?: any[]
  rating?: number
  completedProjects?: number
  avatar?: string
}

interface TeamData {
  id: string
  name: string
  description: string
  memberCount: number
  skills: string[]
  isLead: boolean
  availability: string
  members?: Array<{
    userId: string
    role: string
    isLead: boolean
    userInfo?: {
      name: string
      avatar?: string
      title?: string
    }
  }>
}

export default function ApplyPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()
  const id = params.id as string
  
  // États principaux
  const [loading, setLoading] = useState(true)
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [step, setStep] = useState(1)
  const [applyMode, setApplyMode] = useState<'individual' | 'team'>('individual')
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [availableTeams, setAvailableTeams] = useState<TeamData[]>([])
  const [selectedTeamDetails, setSelectedTeamDetails] = useState<TeamData | null>(null)
  
  // Données du formulaire
  const [formData, setFormData] = useState<ApplicationData>({
    coverLetter: '',
    proposedBudget: 0,
    estimatedDuration: '',
    attachments: [],
    applyMode: 'individual'
  })
  
  // Données du projet et utilisateur
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [freelancerData, setFreelancerData] = useState<FreelancerData | null>(null)
  
  // États UI
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<any>(null)
  const [showAiAssistant, setShowAiAssistant] = useState(false)
  const [showTeamDetails, setShowTeamDetails] = useState(false)

  // Vérification d'authentification
  if (!session || (session.user?.role !== "freelance" && session.user?.role !== "freelancer")) {
    return <AccessDenied />
  }

  // Charger les données initiales
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true)
        
        // Charger le projet
        const projectResponse = await fetch(`/api/projects/${id}`)
        if (!projectResponse.ok) {
          throw new Error('Project not found')
        }
        const projectData = await projectResponse.json()
        setProjectData(projectData)
        
        // Initialiser le budget avec la valeur minimale
        if (projectData?.budget?.min) {
          setFormData(prev => ({
            ...prev,
            proposedBudget: projectData.budget.min
          }))
        }

        // Charger les données du freelance
        const freelancerResponse = await fetch('/api/users/profile')
        if (freelancerResponse.ok) {
          const freelancerData = await freelancerResponse.json()
          setFreelancerData(freelancerData)
        }

        // Charger les équipes du freelance
        await loadUserTeams()

      } catch (error) {
        console.error('Error loading data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load project details',
          variant: 'destructive',
        })
        router.push(`/projects/${id}`)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [id, router, toast])

  // Charger les équipes de l'utilisateur
  const loadUserTeams = async () => {
    try {
      setLoadingTeams(true)
      const response = await fetch('/api/teams/my-teams')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAvailableTeams(data.teams)
          if (data.teams.length > 0) {
            setSelectedTeam(data.teams[0].id)
            await loadTeamDetails(data.teams[0].id)
          }
        }
      }
    } catch (error) {
      console.error('Error loading teams:', error)
    } finally {
      setLoadingTeams(false)
    }
  }

  // Charger les détails d'une équipe spécifique
  const loadTeamDetails = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSelectedTeamDetails(data.team)
        }
      }
    } catch (error) {
      console.error('Error loading team details:', error)
    }
  }

  // Gérer le changement de mode d'application
  const handleModeChange = async (mode: 'individual' | 'team') => {
    setApplyMode(mode)
    setFormData(prev => ({ ...prev, applyMode: mode }))
    
    if (mode === 'team' && selectedTeam) {
      await loadTeamDetails(selectedTeam)
    }
  }

  // Gérer le changement d'équipe sélectionnée
  const handleTeamChange = async (teamId: string) => {
    setSelectedTeam(teamId)
    setFormData(prev => ({ ...prev, teamId }))
    await loadTeamDetails(teamId)
  }

  // Gérer les changements de formulaire
  const handleInputChange = (field: keyof ApplicationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Fonctions AI (simplifiées pour l'exemple)
  const handleGenerateAISuggestion = async () => {
    if (!projectData) return
    
    setAiLoading(true)
    try {
      // Simuler une génération AI
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const suggestion = {
        coverLetter: `Dear Client,

I'm excited to apply for your project "${projectData.title}". With my expertise in ${projectData.skills?.join(', ') || 'relevant skills'}, I'm confident I can deliver exceptional results.

My approach includes:
- Comprehensive analysis of your requirements
- Regular communication and updates
- High-quality deliverables within the agreed timeline
- Post-delivery support and revisions

Looking forward to discussing how I can contribute to your project's success.

Best regards,
${freelancerData?.name || 'Your Name'}`,
        budgetSuggestion: Math.round((projectData.budget.min + projectData.budget.max) / 2),
        estimatedDuration: '2-3 weeks'
      }
      
      setAiSuggestion(suggestion)
      setFormData(prev => ({
        ...prev,
        coverLetter: suggestion.coverLetter,
        proposedBudget: suggestion.budgetSuggestion,
        estimatedDuration: suggestion.estimatedDuration
      }))
      
      toast({
        title: 'AI Suggestion Applied',
        description: 'Professional proposal generated successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate AI suggestion',
        variant: 'destructive',
      })
    } finally {
      setAiLoading(false)
    }
  }

  // Gérer l'upload de fichiers
  const handleFileUpload = async (file: File) => {
    if (formData.attachments.length >= 5) {
      setErrors(prev => ({ ...prev, attachments: 'Maximum 5 files allowed' }))
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, attachments: 'File too large (max 10MB)' }))
      return
    }

    setUploading(true)
    try {
      // Simuler l'upload
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newAttachment = {
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type
      }

      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, newAttachment]
      }))
      
      toast({
        title: 'File Uploaded',
        description: `${file.name} has been uploaded successfully`,
      })
    } catch (error) {
      setErrors(prev => ({ ...prev, attachments: 'Upload failed' }))
      toast({
        title: 'Upload Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  // Validation
  const validateStep = (step: number): boolean => {
    if (!projectData?.budget) return false

    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.coverLetter.trim()) {
        newErrors.coverLetter = 'Cover letter is required'
      } else if (formData.coverLetter.length < 50) {
        newErrors.coverLetter = 'Cover letter must be at least 50 characters'
      } else if (formData.coverLetter.length > 2000) {
        newErrors.coverLetter = 'Cover letter must not exceed 2000 characters'
      }
    }

    if (step === 2) {
      if (!formData.proposedBudget || formData.proposedBudget < 1) {
        newErrors.proposedBudget = 'Invalid proposed budget'
      } else if (formData.proposedBudget < projectData.budget.min) {
        newErrors.proposedBudget = `Minimum budget is ${projectData.budget.min} ${projectData.budget.currency}`
      } else if (formData.proposedBudget > projectData.budget.max) {
        newErrors.proposedBudget = `Maximum budget is ${projectData.budget.max} ${projectData.budget.currency}`
      }
      
      if (!formData.estimatedDuration.trim()) {
        newErrors.estimatedDuration = 'Estimated duration is required'
      }
    }

    if (step === 3 && applyMode === 'team' && !selectedTeam) {
      newErrors.team = 'Please select a team'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  // Soumettre l'application
  const handleSubmit = async () => {
    if (!validateStep(3) || !projectData) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/projects/${id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Application failed')
      }

      // Succès
      toast({
        title: 'Application Submitted!',
        description: applyMode === 'team' 
          ? `Your team application has been sent successfully. You can track it in your team dashboard.`
          : `Your individual application has been sent successfully.`,
      })
      
      // Rediriger
      if (applyMode === 'team' && selectedTeam) {
        router.push(`/teams/${selectedTeam}/applications`)
      } else {
        router.push(`/projects/${id}?message=application_success`)
      }
      
    } catch (error) {
      setErrors(prev => ({ ...prev, submit: (error as Error).message }))
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Calculer l'indicateur de budget
  const getBudgetIndicator = (budget: number) => {
    if (!projectData?.budget) return { position: 0, color: 'bg-gray-400', label: 'Loading...' }

    const range = projectData.budget.max - projectData.budget.min
    const position = range > 0 ? ((budget - projectData.budget.min) / range) * 100 : 0
    
    let color = 'bg-emerald-500'
    let label = 'Reasonable budget'
    
    if (budget < projectData.budget.min) {
      color = 'bg-gray-400'
      label = 'Below minimum budget'
    } else if (budget > projectData.budget.max) {
      color = 'bg-rose-500'
      label = 'Above maximum budget'
    }

    return { position: Math.min(Math.max(position, 0), 100), color, label }
  }

  const budgetIndicator = getBudgetIndicator(formData.proposedBudget)
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('fr-FR')

  // Afficher le chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 text-sky-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading project details...</p>
          </div>
        </div>
      </div>
    )
  }

  // Si le projet n'existe pas
  if (!projectData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="h-12 w-12 text-rose-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Project Not Found</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              The project you're looking for doesn't exist or is no longer available.
            </p>
            <Button
              onClick={() => router.push('/projects')}
              className="bg-sky-600 text-white hover:bg-sky-700"
            >
              Browse All Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Apply to "{projectData.title}"
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Submit your proposal for this project
                </p>
              </div>
              
              <Button
                onClick={() => setShowAiAssistant(!showAiAssistant)}
                className="bg-gradient-to-r from-sky-600 to-purple-600 text-white hover:opacity-90"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
            </div>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Select Application Mode
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Individual Mode */}
            <div 
              className={`border-2 rounded-xl p-5 cursor-pointer transition-all duration-300 ${
                applyMode === 'individual' 
                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 shadow-lg scale-[1.02]' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
              }`}
              onClick={() => handleModeChange('individual')}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-lg ${
                  applyMode === 'individual' 
                    ? 'bg-sky-100 dark:bg-sky-900/30' 
                    : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  <User className={`h-6 w-6 ${
                    applyMode === 'individual' 
                      ? 'text-sky-600 dark:text-sky-400' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
                    Individual Application
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Apply as an individual freelancer
                  </p>
                </div>
              </div>
              
              <ul className="space-y-3 mb-4">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Apply with your personal profile
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Direct communication with client
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Full control over project delivery
                  </span>
                </li>
              </ul>
              
              {applyMode === 'individual' && (
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Selected</span>
                </div>
              )}
            </div>

            {/* Team Mode */}
            <div 
              className={`border-2 rounded-xl p-5 cursor-pointer transition-all duration-300 ${
                applyMode === 'team' 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg scale-[1.02]' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
              } ${(loadingTeams || availableTeams.length === 0) ? 'opacity-70 cursor-not-allowed' : ''}`}
              onClick={() => !loadingTeams && availableTeams.length > 0 && handleModeChange('team')}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-lg ${
                  applyMode === 'team' 
                    ? 'bg-purple-100 dark:bg-purple-900/30' 
                    : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  <Users className={`h-6 w-6 ${
                    applyMode === 'team' 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                      Team Application
                    </h3>
                    {availableTeams.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {availableTeams.length} team{availableTeams.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Apply as part of a team
                  </p>
                </div>
              </div>
              
              {loadingTeams ? (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 text-purple-600 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Loading your teams...</p>
                </div>
              ) : availableTeams.length === 0 ? (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      You need to join or create a team first
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/teams')}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Browse Teams
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Select Team
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTeam || ''}
                        onChange={(e) => handleTeamChange(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                      >
                        {availableTeams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name} ({team.memberCount} members)
                            {team.isLead && ' 👑'}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                    
                    {selectedTeamDetails && (
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          onClick={() => setShowTeamDetails(!showTeamDetails)}
                        >
                          {showTeamDetails ? 'Hide' : 'Show'} team details
                        </Button>
                        
                        {showTeamDetails && (
                          <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-slate-900 dark:text-white">
                                {selectedTeamDetails.name}
                              </span>
                              <Badge variant={selectedTeamDetails.availability === 'available' ? 'success' : 'secondary'}>
                                {selectedTeamDetails.availability}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                              {selectedTeamDetails.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedTeamDetails.skills.slice(0, 5).map((skill, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {selectedTeamDetails.skills.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{selectedTeamDetails.skills.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <ul className="space-y-3 mb-4">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Apply with combined team expertise
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Higher chance for complex projects
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Shared responsibility and workload
                      </span>
                    </li>
                  </ul>
                  
                  {applyMode === 'team' && (
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Selected</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {applyMode === 'team' && selectedTeamDetails && (
            <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300">
                      Applying as: {selectedTeamDetails.name}
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-400">
                      {selectedTeamDetails.memberCount} members • Team lead: {freelancerData?.name}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/teams/${selectedTeam}`)}
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Team
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire Principal */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
              {/* Steps Navigation */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center justify-between max-w-md mx-auto">
                  {[1, 2, 3].map((stepNumber) => (
                    <div key={stepNumber} className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                          step >= stepNumber
                            ? 'bg-sky-600 text-white shadow-lg'
                            : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {stepNumber}
                      </div>
                      {stepNumber < 3 && (
                        <div
                          className={`w-16 h-1 mx-4 transition-all duration-300 ${
                            step > stepNumber ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
                  <span>Cover Letter</span>
                  <span>Budget & Timeline</span>
                  <span>Review & Submit</span>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6">
                {errors.submit && (
                  <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    <span className="text-rose-800 dark:text-rose-300 font-medium">{errors.submit}</span>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Cover Letter *
                        </label>
                        <Button
                          type="button"
                          onClick={handleGenerateAISuggestion}
                          disabled={aiLoading}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          <Brain className="h-3 w-3 mr-2" />
                          {aiLoading ? 'Generating...' : 'Generate with AI'}
                        </Button>
                      </div>
                      
                      <Textarea
                        value={formData.coverLetter}
                        onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                        rows={10}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-800 dark:text-white dark:border-slate-600 ${
                          errors.coverLetter ? 'border-rose-500 dark:border-rose-400 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-600'
                        }`}
                        placeholder={`Introduce yourself and explain why you're the perfect ${
                          applyMode === 'team' ? 'team' : 'freelancer'
                        } for "${projectData.title}". Highlight your relevant experience, skills, and approach to the project...`}
                      />
                      
                      {errors.coverLetter && (
                        <p className="text-rose-600 dark:text-rose-400 text-sm mt-2 font-medium">{errors.coverLetter}</p>
                      )}
                      
                      <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mt-2">
                        <span>Minimum 50 characters</span>
                        <span>{formData.coverLetter.length}/2000</span>
                      </div>
                    </div>

                    {/* Tips for Team Applications */}
                    {applyMode === 'team' && selectedTeamDetails && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Team Application Tips
                        </h4>
                        <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-400">
                          <li>• Highlight your team's combined expertise and how it matches the project requirements</li>
                          <li>• Mention key team members and their specific roles in the project</li>
                          <li>• Explain your team's collaboration process and communication style</li>
                          <li>• Share previous team projects or success stories (if any)</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    {/* Budget Range Info */}
                    <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          <span className="text-sm font-medium text-sky-900 dark:text-sky-100">
                            Client's Budget Range
                          </span>
                        </div>
                        <Badge variant="outline">
                          {projectData.budget.type === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm text-sky-800 dark:text-sky-200">
                        <span>Minimum: {projectData.budget.min} {projectData.budget.currency}</span>
                        <span>Maximum: {projectData.budget.max} {projectData.budget.currency}</span>
                      </div>
                    </div>

                    {/* Proposed Budget */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        <DollarSign className="w-4 w-4 inline mr-1" />
                        Proposed Budget ({projectData.budget.currency}) *
                      </label>
                      
                      <div className="mb-6">
                        <input
                          type="range"
                          min={projectData.budget.min}
                          max={projectData.budget.max}
                          step="50"
                          value={formData.proposedBudget}
                          onChange={(e) => handleInputChange('proposedBudget', Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg"
                        />
                        
                        {/* Budget Indicator */}
                        <div className="relative h-2 bg-slate-200 dark:bg-slate-600 rounded-lg mt-4">
                          <div 
                            className="absolute h-2 rounded-lg bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400"
                            style={{ width: '100%' }}
                          />
                          <div 
                            className={`absolute w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 shadow-lg -top-1 -ml-2 ${budgetIndicator.color}`}
                            style={{ left: `${budgetIndicator.position}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>{projectData.budget.min}</span>
                          <span className="font-medium">{budgetIndicator.label}</span>
                          <span>{projectData.budget.max}</span>
                        </div>
                      </div>

                      {/* Budget Input */}
                      <div className="relative mb-4">
                        <Input
                          type="number"
                          value={formData.proposedBudget}
                          onChange={(e) => handleInputChange('proposedBudget', Number(e.target.value))}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-800 dark:text-white dark:border-slate-600 ${
                            errors.proposedBudget ? 'border-rose-500 dark:border-rose-400 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-600'
                          }`}
                          min={projectData.budget.min}
                          max={projectData.budget.max}
                          step="50"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-slate-500 dark:text-slate-400">{projectData.budget.currency}</span>
                        </div>
                      </div>
                      
                      {errors.proposedBudget && (
                        <p className="text-rose-600 dark:text-rose-400 text-sm mt-1 font-medium">{errors.proposedBudget}</p>
                      )}
                      
                      {/* Quick Budget Buttons */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          type="button"
                          onClick={() => handleInputChange('proposedBudget', projectData.budget.min)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          Min ({projectData.budget.min})
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleInputChange('proposedBudget', Math.round((projectData.budget.min + projectData.budget.max) / 2))}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          Average ({Math.round((projectData.budget.min + projectData.budget.max) / 2)})
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleInputChange('proposedBudget', projectData.budget.max)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          Max ({projectData.budget.max})
                        </Button>
                      </div>
                    </div>

                    {/* Estimated Duration */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Estimated Duration *
                      </label>
                      <Input
                        type="text"
                        value={formData.estimatedDuration}
                        onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-800 dark:text-white dark:border-slate-600 ${
                          errors.estimatedDuration ? 'border-rose-500 dark:border-rose-400 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-600'
                        }`}
                        placeholder="e.g., 2 weeks, 1 month, 3-4 days..."
                      />
                      {errors.estimatedDuration && (
                        <p className="text-rose-600 dark:text-rose-400 text-sm mt-1 font-medium">{errors.estimatedDuration}</p>
                      )}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    {/* Application Summary */}
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                        Application Summary
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Application Mode</span>
                          <Badge variant={applyMode === 'team' ? 'default' : 'outline'}>
                            {applyMode === 'team' ? (
                              <>
                                <Users className="h-3 w-3 mr-1" />
                                Team Application
                              </>
                            ) : (
                              <>
                                <User className="h-3 w-3 mr-1" />
                                Individual Application
                              </>
                            )}
                          </Badge>
                        </div>
                        
                        {applyMode === 'team' && selectedTeamDetails && (
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Selected Team</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {selectedTeamDetails.name}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Proposed Budget</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formData.proposedBudget} {projectData.budget.currency}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Estimated Duration</span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {formData.estimatedDuration}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Attachments</span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {formData.attachments.length} file{formData.attachments.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Attachments */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Attachments (Optional)
                        <span className="text-slate-500 dark:text-slate-400 text-xs font-normal ml-2">
                          Max 5 files, 10MB each
                        </span>
                      </label>
                      
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-sky-400 dark:hover:border-sky-500 transition-colors">
                        <input
                          type="file"
                          id="file-upload"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || [])
                            files.forEach(handleFileUpload)
                          }}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Upload className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                          <p className="text-slate-600 dark:text-slate-400 font-medium">
                            Click to upload files
                          </p>
                          <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
                            Supports PDF, DOC, JPG, PNG, ZIP
                          </p>
                        </label>
                      </div>

                      {uploading && (
                        <div className="mt-4 text-center">
                          <Loader2 className="h-6 w-6 text-sky-600 animate-spin mx-auto mb-2" />
                          <p className="text-slate-600 dark:text-slate-400">Uploading files...</p>
                        </div>
                      )}

                      {formData.attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {formData.attachments.map((attachment, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                <div>
                                  <p className="font-medium text-sm text-slate-900 dark:text-white truncate max-w-xs">
                                    {attachment.name}
                                  </p>
                                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                                    {attachment.type}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAttachment(index)}
                                className="h-8 w-8 p-0 text-slate-500 hover:text-rose-600"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {errors.attachments && (
                        <p className="text-rose-600 dark:text-rose-400 text-sm mt-2 font-medium">{errors.attachments}</p>
                      )}
                    </div>

                    {/* Final Validation */}
                    {errors.team && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-amber-800 dark:text-amber-400 font-medium">{errors.team}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between items-center pt-8 border-t border-slate-200 dark:border-slate-700 mt-8">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Step {step} of 3
                  </div>
                  <div className="flex gap-3">
                    {step > 1 && (
                      <Button
                        onClick={handleBack}
                        disabled={isProcessing}
                        variant="outline"
                        className="min-w-[100px]"
                      >
                        Back
                      </Button>
                    )}
                    {step < 3 ? (
                      <Button
                        onClick={handleNext}
                        disabled={isProcessing}
                        className="min-w-[100px] bg-sky-600 hover:bg-sky-700"
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        disabled={isProcessing}
                        className="min-w-[150px] bg-emerald-600 hover:bg-emerald-700"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Submit Application
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Project Details */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Project Details
              </h3>

              {/* Client Info */}
              {projectData.client && (
                <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                  <h4 className="font-medium text-slate-900 dark:text-white mb-3">Client</h4>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {projectData.client.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{projectData.client.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{projectData.client.title || 'Client'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                    <span className="font-medium text-slate-900 dark:text-white">
                      {(projectData.client.rating || 0).toFixed(1)}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">•</span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {projectData.client.completedProjects || 0} projects
                    </span>
                  </div>
                </div>
              )}

              {/* Project Stats */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Budget Range</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {projectData.budget.min} - {projectData.budget.max} {projectData.budget.currency}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Deadline</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatDate(projectData.deadline)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Applications</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {projectData.applicationCount}
                  </span>
                </div>
                
                {projectData.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Location</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {projectData.location}
                    </span>
                  </div>
                )}
              </div>

              {/* Required Skills */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <h4 className="font-medium text-slate-900 dark:text-white mb-3">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {projectData.skills?.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-sky-50 to-purple-50 dark:from-sky-900/20 dark:to-purple-900/20 border border-sky-200 dark:border-sky-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                Pro Tips
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                    For {applyMode === 'team' ? 'Team' : 'Individual'} Applications:
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-2">
                      <Target className="h-3 w-3 text-sky-500 mt-0.5 flex-shrink-0" />
                      <span>Address specific project requirements in your cover letter</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Target className="h-3 w-3 text-sky-500 mt-0.5 flex-shrink-0" />
                      <span>Provide relevant examples of similar work</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Target className="h-3 w-3 text-sky-500 mt-0.5 flex-shrink-0" />
                      <span>Be transparent about your availability and timeline</span>
                    </li>
                    {applyMode === 'team' && (
                      <li className="flex items-start gap-2">
                        <Users className="h-3 w-3 text-purple-500 mt-0.5 flex-shrink-0" />
                        <span>Highlight team collaboration and workflow</span>
                      </li>
                    )}
                  </ul>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">Budget Advice</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Propose a competitive but realistic budget that reflects the project's complexity and your expertise.
                  </p>
                </div>
                
                <Button
                  onClick={() => setShowAiAssistant(true)}
                  className="w-full bg-gradient-to-r from-sky-600 to-purple-600 text-white hover:opacity-90"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Open AI Assistant
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Widget */}
      {projectData && freelancerData && (
        <ProposalAssistantWidget
          projectData={projectData}
          freelancerData={freelancerData}
          isOpen={showAiAssistant}
          onClose={() => setShowAiAssistant(false)}
          onApplySuggestion={(suggestion) => {
            setFormData(prev => ({
              ...prev,
              coverLetter: suggestion.coverLetter || prev.coverLetter,
              proposedBudget: suggestion.proposedBudget || prev.proposedBudget,
              estimatedDuration: suggestion.estimatedDuration || prev.estimatedDuration
            }))
            toast({
              title: 'AI Suggestion Applied',
              description: 'Proposal updated with AI suggestions',
            })
          }}
        />
      )}
    </div>
  )
}