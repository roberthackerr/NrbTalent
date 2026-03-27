'use client'

import { useState, useEffect, useCallback } from 'react'
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
  ExternalLink,
  Trash2,
  Image as ImageIcon,
  File,
  Globe,
  Languages
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
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { cn } from '@/lib/utils'

// Types
interface ApplicationData {
  coverLetter: string
  proposedBudget: number
  estimatedDuration: string
  attachments: Array<{
    name: string
    url: string
    type: string
    size: number
    publicId?: string
    resourceType?: string
    base64Data?: string
  }>
  applyMode: 'individual' | 'team'
  teamId?: string | null
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

// File upload helper
// File upload helper - UPDATED with FormData

// File upload helper - Uses your apply API for uploads


export default function ApplyPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()
  const id = params.id as string
  const currentLang = (params.lang as Locale) || 'fr'
  
  // États principaux
  const [loading, setLoading] = useState(true)
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [step, setStep] = useState(1)
  const [applyMode, setApplyMode] = useState<'individual' | 'team'>('individual')
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [availableTeams, setAvailableTeams] = useState<TeamData[]>([])
  const [selectedTeamDetails, setSelectedTeamDetails] = useState<TeamData | null>(null)
  const [dict, setDict] = useState<any>(null)
  const [lang, setLang] = useState<Locale>('fr')
  
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
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<any>(null)
  const [showAiAssistant, setShowAiAssistant] = useState(false)
  const [showTeamDetails, setShowTeamDetails] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Charger le dictionnaire
  useEffect(() => {
    const l = (params.lang as Locale) || 'fr'
    setLang(l)
    getDictionarySafe(l).then(setDict)
  }, [params.lang])

  // Détecter mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const t = useCallback((key: string, fallback: string = key): string => {
    if (dict?.apply?.[key]) return dict.apply[key]
    if (dict?.navigations?.[key]) return dict.navigations[key]
    // Fallback messages
    const fallbacks: Record<string, Record<string, string>> = {
      fr: {
        backToProject: "Retour au projet",
        applyTo: "Postuler à",
        submitProposal: "Soumettre votre proposition",
        selectMode: "Sélectionnez le mode de candidature",
        individualMode: "Candidature individuelle",
        individualDesc: "Postulez en tant que freelance individuel",
        teamMode: "Candidature en équipe",
        teamDesc: "Postulez en tant qu'équipe",
        coverLetter: "Lettre de motivation",
        coverLetterPlaceholder: "Présentez-vous et expliquez pourquoi vous êtes le candidat idéal...",
        proposedBudget: "Budget proposé",
        estimatedDuration: "Durée estimée",
        attachments: "Pièces jointes",
        submit: "Soumettre",
        loading: "Chargement...",
        fileTooLarge: "Fichier trop volumineux (max 10MB)",
        maxFiles: "Maximum 5 fichiers",
        uploadFailed: "Échec de l'upload",
        uploadSuccess: "Fichier uploadé avec succès",
        applicationSubmitted: "Candidature soumise !",
        individualSuccess: "Votre candidature a été envoyée avec succès.",
        teamSuccess: "Votre candidature en équipe a été envoyée avec succès.",
        error: "Erreur",
        projectNotFound: "Projet non trouvé",
        selectTeam: "Sélectionnez une équipe",
        budgetTooLow: "Budget trop bas",
        budgetTooHigh: "Budget trop élevé",
        dailyLimitReached: "Limite quotidienne atteinte",
        alreadyApplied: "Vous avez déjà postulé à ce projet",
        minChars: "Minimum 50 caractères",
        maxChars: "Maximum 2000 caractères",
        teamTips: "Conseils pour les candidatures en équipe"
      },
      en: {
        backToProject: "Back to Project",
        applyTo: "Apply to",
        submitProposal: "Submit your proposal",
        selectMode: "Select Application Mode",
        individualMode: "Individual Application",
        individualDesc: "Apply as an individual freelancer",
        teamMode: "Team Application",
        teamDesc: "Apply as a team",
        coverLetter: "Cover Letter",
        coverLetterPlaceholder: "Introduce yourself and explain why you're the ideal candidate...",
        proposedBudget: "Proposed Budget",
        estimatedDuration: "Estimated Duration",
        attachments: "Attachments",
        submit: "Submit",
        loading: "Loading...",
        fileTooLarge: "File too large (max 10MB)",
        maxFiles: "Maximum 5 files",
        uploadFailed: "Upload failed",
        uploadSuccess: "File uploaded successfully",
        applicationSubmitted: "Application Submitted!",
        individualSuccess: "Your application has been sent successfully.",
        teamSuccess: "Your team application has been sent successfully.",
        error: "Error",
        projectNotFound: "Project not found",
        selectTeam: "Select a team",
        budgetTooLow: "Budget too low",
        budgetTooHigh: "Budget too high",
        dailyLimitReached: "Daily application limit reached",
        alreadyApplied: "You have already applied to this project",
        minChars: "Minimum 50 characters",
        maxChars: "Maximum 2000 characters",
        teamTips: "Tips for team applications"
      },
      mg: {
        backToProject: "Hiverina amin'ny tetikasa",
        applyTo: "Mangataka amin'ny",
        submitProposal: "Alefaso ny tolo-kevitrao",
        selectMode: "Fidio ny fomba fangatahana",
        individualMode: "Fangatahana tsirairay",
        individualDesc: "Mangataka amin'ny maha-freelance tsirairay",
        teamMode: "Fangatahana ekipa",
        teamDesc: "Mangataka amin'ny maha-ekipa",
        coverLetter: "Taratahy fanolorana",
        coverLetterPlaceholder: "Ampahafantaro ny tenanao ary hazavao ny antony maha-mety anao...",
        proposedBudget: "Tetibola atolotra",
        estimatedDuration: "Faharetana tombanana",
        attachments: "Rakitra mifamatotra",
        submit: "Alefaso",
        loading: "Mampiditra...",
        fileTooLarge: "Rakitra lehibe loatra (max 10MB)",
        maxFiles: "Rakitra 5 fara-fahakeliny",
        uploadFailed: "Tsy nahomby ny fampidirana",
        uploadSuccess: "Fampidirana rakitra nahomby",
        applicationSubmitted: "Fangatahana nalefa!",
        individualSuccess: "Nalefa soa aman-tsara ny fangatahanao.",
        teamSuccess: "Nalefa soa aman-tsara ny fangatahana ekipanao.",
        error: "Hadisoana",
        projectNotFound: "Tetikasa tsy hita",
        selectTeam: "Fidio ekipa",
        budgetTooLow: "Tetibola ambany loatra",
        budgetTooHigh: "Tetibola avo loatra",
        dailyLimitReached: "Efa tratra ny fetran'ny fangatahana isan'andro",
        alreadyApplied: "Efa nangataka tamin'ity tetikasa ity ianao",
        minChars: "Litera 50 fara-fahakeliny",
        maxChars: "Litera 2000 fara-tampony",
        teamTips: "Toro-hevitra ho an'ny fangatahana ekipa"
      }
    }
    return fallbacks[lang]?.[key] || fallbacks.fr[key] || fallback
  }, [dict, lang])

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
          title: t('error', 'Error'),
          description: t('projectNotFound', 'Failed to load project details'),
          variant: 'destructive',
        })
        router.push(`/${lang}/projects/${id}`)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [id, router, toast, t, lang])

  // Charger les équipes de l'utilisateur
  const loadUserTeams = async () => {
    try {
      setLoadingTeams(true)
      const response = await fetch(`/${lang}/api/teams/my-teams`)
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
      const response = await fetch(`/${lang}/api/teams/${teamId}`)
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
    setFormData(prev => ({ 
      ...prev, 
      applyMode: mode,
      teamId: mode === 'team' ? selectedTeam : undefined 
    }))
    
    if (mode === 'team' && selectedTeam) {
      await loadTeamDetails(selectedTeam)
    }
  }

  // Gérer le changement d'équipe sélectionnée
  const handleTeamChange = async (teamId: string) => {
    setSelectedTeam(teamId)
    setFormData(prev => ({ 
      ...prev, 
      teamId: teamId,
      applyMode: 'team'
    }))
    await loadTeamDetails(teamId)
  }

  // Gérer les changements de formulaire
  const handleInputChange = (field: keyof ApplicationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Upload de fichier réel vers Cloudinary
  // Handle file upload
const handleFileUpload = async (file: File) => {
  if (formData.attachments.length >= 5) {
    setErrors(prev => ({ ...prev, attachments: t('maxFiles', 'Maximum 5 files allowed') }))
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    setErrors(prev => ({ ...prev, attachments: t('fileTooLarge', 'File too large (max 10MB)') }))
    return
  }

  setUploading(true)
  setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
  
  try {
    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: Math.min((prev[file.name] || 0) + 10, 90)
      }))
    }, 200)

    // Upload to your apply API
    const uploaded = await uploadFileToCloudinary(file)
    
    clearInterval(progressInterval)
    setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))

    const newAttachment = {
      name: file.name,
      url: uploaded.url,
      type: file.type,
      size: file.size,
      publicId: uploaded.publicId,
      resourceType: uploaded.resourceType
    }

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, newAttachment]
    }))
    
    toast({
      title: t('uploadSuccess', 'File Uploaded'),
      description: `${file.name} ${t('uploadSuccess', 'uploaded successfully')}`,
    })
  } catch (error) {
    console.error('Upload error:', error)
    setErrors(prev => ({ ...prev, attachments: t('uploadFailed', 'Upload failed') }))
    toast({
      title: t('error', 'Error'),
      description: t('uploadFailed', 'Failed to upload file'),
      variant: 'destructive',
    })
  } finally {
    setUploading(false)
    setUploadProgress(prev => {
      const newState = { ...prev }
      delete newState[file.name]
      return newState
    })
  }
}

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  // Fonctions AI
  const handleGenerateAISuggestion = async () => {
    if (!projectData) return
    
    setAiLoading(true)
    try {
      const response = await fetch(`/${lang}/api/ai/generate-proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: projectData.title,
          projectDescription: projectData.description,
          skills: projectData.skills,
          freelancerName: freelancerData?.name,
          freelancerSkills: freelancerData?.skills,
          budgetMin: projectData.budget.min,
          budgetMax: projectData.budget.max,
          currency: projectData.budget.currency,
          applyMode
        })
      })

      if (!response.ok) throw new Error('AI generation failed')

      const suggestion = await response.json()
      
      setAiSuggestion(suggestion)
      setFormData(prev => ({
        ...prev,
        coverLetter: suggestion.coverLetter || prev.coverLetter,
        proposedBudget: suggestion.proposedBudget || prev.proposedBudget,
        estimatedDuration: suggestion.estimatedDuration || prev.estimatedDuration
      }))
      
      toast({
        title: 'AI Suggestion Applied',
        description: 'Professional proposal generated successfully',
      })
    } catch (error) {
      console.error('AI generation error:', error)
      toast({
        title: t('error', 'Error'),
        description: 'Failed to generate AI suggestion',
        variant: 'destructive',
      })
    } finally {
      setAiLoading(false)
    }
  }

  // Validation
  const validateStep = (step: number): boolean => {
    if (!projectData?.budget) return false

    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.coverLetter.trim()) {
        newErrors.coverLetter = t('coverLetter', 'Cover letter is required')
      } else if (formData.coverLetter.length < 50) {
        newErrors.coverLetter = t('minChars', 'Cover letter must be at least 50 characters')
      } else if (formData.coverLetter.length > 2000) {
        newErrors.coverLetter = t('maxChars', 'Cover letter must not exceed 2000 characters')
      }
    }

    if (step === 2) {
      if (!formData.proposedBudget || formData.proposedBudget < 1) {
        newErrors.proposedBudget = 'Invalid proposed budget'
      } else if (formData.proposedBudget < projectData.budget.min) {
        newErrors.proposedBudget = `${t('budgetTooLow', 'Budget too low')}: ${projectData.budget.min} ${projectData.budget.currency}`
      } else if (formData.proposedBudget > projectData.budget.max) {
        newErrors.proposedBudget = `${t('budgetTooHigh', 'Budget too high')}: ${projectData.budget.max} ${projectData.budget.currency}`
      }
      
      if (!formData.estimatedDuration.trim()) {
        newErrors.estimatedDuration = t('estimatedDuration', 'Estimated duration is required')
      }
    }

    if (step === 3 && applyMode === 'team' && !selectedTeam) {
      newErrors.team = t('selectTeam', 'Please select a team')
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
  // Soumettre l'application - UPDATED with FormData
const handleSubmit = async () => {
  if (!validateStep(3) || !projectData) return

  setIsProcessing(true)
  try {
    // Create FormData for submission
    const formDataToSend = new FormData()
    
    // Add text fields
    formDataToSend.append('coverLetter', formData.coverLetter)
    formDataToSend.append('proposedBudget', formData.proposedBudget.toString())
    formDataToSend.append('estimatedDuration', formData.estimatedDuration)
    formDataToSend.append('applyMode', applyMode)
    
    if (applyMode === 'team' && selectedTeam) {
      formDataToSend.append('teamId', selectedTeam)
    }
    
    // Add attachments as JSON string (since they're already uploaded to Cloudinary)
    // We send the attachment metadata, not the files themselves
    const attachmentsMetadata = formData.attachments.map(({ name, url, type, size, publicId, resourceType }) => ({
      name, url, type, size, publicId, resourceType
    }))
    formDataToSend.append('attachments', JSON.stringify(attachmentsMetadata))

    const response = await fetch(`/api/projects/${id}/apply`, {
      method: 'POST',
      body: formDataToSend, // Important: Don't set Content-Type header
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || data.details?.[0]?.message || 'Application failed')
    }

    toast({
      title: t('applicationSubmitted', 'Application Submitted!'),
      description: applyMode === 'team' 
        ? t('teamSuccess', 'Your team application has been sent successfully.')
        : t('individualSuccess', 'Your application has been sent successfully.'),
    })
    
    if (applyMode === 'team' && selectedTeam) {
      router.push(`/${lang}/teams/${selectedTeam}/applications`)
    } else {
      router.push(`/${lang}/projects/${id}?message=application_success`)
    }
    
  } catch (error) {
    console.error('Submission error:', error)
    setErrors(prev => ({ ...prev, submit: (error as Error).message }))
    toast({
      title: t('error', 'Error'),
      description: (error as Error).message,
      variant: 'destructive',
    })
  } finally {
    setIsProcessing(false)
  }
}

  // Calculer l'indicateur de budget
  const getBudgetIndicator = (budget: number) => {
    if (!projectData?.budget) return { position: 0, color: 'bg-gray-400', label: t('loading', 'Loading...') }

    const range = projectData.budget.max - projectData.budget.min
    const position = range > 0 ? ((budget - projectData.budget.min) / range) * 100 : 0
    
    let color = 'bg-emerald-500'
    let label = 'Reasonable budget'
    
    if (budget < projectData.budget.min) {
      color = 'bg-gray-400'
      label = t('budgetTooLow', 'Below minimum budget')
    } else if (budget > projectData.budget.max) {
      color = 'bg-rose-500'
      label = t('budgetTooHigh', 'Above maximum budget')
    }

    return { position: Math.min(Math.max(position, 0), 100), color, label }
  }
const uploadFileToCloudinary = async (file: File): Promise<any> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', 'applications')
  // Add a flag to indicate this is just an upload, not a full application
  formData.append('action', 'upload')

  // Upload to the same apply API endpoint
  const response = await fetch(`/api/projects/${id}/apply`, {
    method: 'POST',
    body: formData,
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Upload failed')
  }
  
  return response.json()
}
  const budgetIndicator = getBudgetIndicator(formData.proposedBudget)
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'mg' ? 'fr-FR' : 'en-US')

  // Afficher le chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 text-sky-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">{t('loading', 'Loading project details...')}</p>
          </div>
        </div>
      </div>
    )
  }

  // Si le projet n'existe pas
  if (!projectData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="h-12 w-12 text-rose-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('projectNotFound', 'Project Not Found')}</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {t('projectNotFound', 'The project you\'re looking for doesn\'t exist or is no longer available.')}
            </p>
            <Button
              onClick={() => router.push(`/${lang}/projects`)}
              className="bg-sky-600 text-white hover:bg-sky-700"
            >
              {t('backToProject', 'Browse All Projects')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-4 sm:py-8">
      <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 sm:mb-6 text-sm sm:text-base"
            size={isMobile ? "sm" : "default"}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToProject', 'Back to Project')}
          </Button>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 break-words">
                  {t('applyTo', 'Apply to')} "{projectData.title}"
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                  {t('submitProposal', 'Submit your proposal for this project')}
                </p>
              </div>
              
              <Button
                onClick={() => setShowAiAssistant(!showAiAssistant)}
                className="bg-gradient-to-r from-sky-600 to-purple-600 text-white hover:opacity-90 w-full sm:w-auto"
                size={isMobile ? "sm" : "default"}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
            </div>
          </div>
        </div>

        {/* Mode Selection - Responsive Grid */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
            {t('selectMode', 'Select Application Mode')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Individual Mode */}
            <div 
              className={`border-2 rounded-xl p-4 sm:p-5 cursor-pointer transition-all duration-300 ${
                applyMode === 'individual' 
                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 shadow-lg scale-[1.01] sm:scale-[1.02]' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
              }`}
              onClick={() => handleModeChange('individual')}
            >
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${
                  applyMode === 'individual' 
                    ? 'bg-sky-100 dark:bg-sky-900/30' 
                    : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  <User className={`h-5 w-5 sm:h-6 sm:w-6 ${
                    applyMode === 'individual' 
                      ? 'text-sky-600 dark:text-sky-400' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`} />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-1">
                    {t('individualMode', 'Individual Application')}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {t('individualDesc', 'Apply as an individual freelancer')}
                  </p>
                </div>
              </div>
              
              <ul className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                <li className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {t('individualDesc', 'Apply with your personal profile')}
                  </span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {t('directCommunication', 'Direct communication with client')}
                  </span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {t('fullControl', 'Full control over project delivery')}
                  </span>
                </li>
              </ul>
              
              {applyMode === 'individual' && (
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-medium text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Selected</span>
                </div>
              )}
            </div>

            {/* Team Mode */}
            <div 
              className={`border-2 rounded-xl p-4 sm:p-5 cursor-pointer transition-all duration-300 ${
                applyMode === 'team' 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg scale-[1.01] sm:scale-[1.02]' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
              } ${(loadingTeams || availableTeams.length === 0) ? 'opacity-70 cursor-not-allowed' : ''}`}
              onClick={() => !loadingTeams && availableTeams.length > 0 && handleModeChange('team')}
            >
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${
                  applyMode === 'team' 
                    ? 'bg-purple-100 dark:bg-purple-900/30' 
                    : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  <Users className={`h-5 w-5 sm:h-6 sm:w-6 ${
                    applyMode === 'team' 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                      {t('teamMode', 'Team Application')}
                    </h3>
                    {availableTeams.length > 0 && (
                      <Badge variant="outline" className="text-[10px] sm:text-xs">
                        {availableTeams.length} {availableTeams.length !== 1 ? 'teams' : 'team'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {t('teamDesc', 'Apply as part of a team')}
                  </p>
                </div>
              </div>
              
              {loadingTeams ? (
                <div className="text-center py-3 sm:py-4">
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-slate-500">{t('loading', 'Loading your teams...')}</p>
                </div>
              ) : availableTeams.length === 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-2 sm:p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400">
                      {t('noTeams', 'You need to join or create a team first')}
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    className="w-full text-sm"
                    size={isMobile ? "sm" : "default"}
                    onClick={() => router.push(`/${lang}/teams`)}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    {t('browseTeams', 'Browse Teams')}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-3 sm:mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('selectTeam', 'Select Team')}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTeam || ''}
                        onChange={(e) => handleTeamChange(e.target.value)}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                      >
                        {availableTeams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name} ({team.memberCount} members)
                            {team.isLead && ' 👑'}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400 pointer-events-none" />
                    </div>
                    
                    {selectedTeamDetails && (
                      <div className="mt-2 sm:mt-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-[10px] sm:text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          onClick={() => setShowTeamDetails(!showTeamDetails)}
                        >
                          {showTeamDetails ? 'Hide' : 'Show'} team details
                        </Button>
                        
                        {showTeamDetails && (
                          <div className="mt-2 p-2 sm:p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                                {selectedTeamDetails.name}
                              </span>
                              <Badge variant={selectedTeamDetails.availability === 'available' ? 'success' : 'secondary'} className="text-[10px] sm:text-xs">
                                {selectedTeamDetails.availability}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2 sm:mb-3 line-clamp-2">
                              {selectedTeamDetails.description}
                            </p>
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              {selectedTeamDetails.skills.slice(0, 5).map((skill, index) => (
                                <Badge key={index} variant="secondary" className="text-[10px] sm:text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {selectedTeamDetails.skills.length > 5 && (
                                <Badge variant="outline" className="text-[10px] sm:text-xs">
                                  +{selectedTeamDetails.skills.length - 5}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <ul className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                    <li className="flex items-center gap-2 sm:gap-3">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t('combinedExpertise', 'Apply with combined team expertise')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-3">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t('higherChance', 'Higher chance for complex projects')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2 sm:gap-3">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        {t('sharedResponsibility', 'Shared responsibility and workload')}
                      </span>
                    </li>
                  </ul>
                  
                  {applyMode === 'team' && (
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Selected</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {applyMode === 'team' && selectedTeamDetails && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-purple-900 dark:text-purple-300">
                      {t('applyingAs', 'Applying as')}: {selectedTeamDetails.name}
                    </h4>
                    <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-400">
                      {selectedTeamDetails.memberCount} members • {t('teamLead', 'Team lead')}: {freelancerData?.name}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/${lang}/teams/${selectedTeam}`)}
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm"
                >
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  {t('viewTeam', 'View Team')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Form Container */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Steps Navigation - Responsive */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center justify-between max-w-md mx-auto">
                  {[1, 2, 3].map((stepNumber) => (
                    <div key={stepNumber} className="flex items-center flex-1">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-300 flex-shrink-0 ${
                          step >= stepNumber
                            ? 'bg-sky-600 text-white shadow-lg'
                            : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {stepNumber}
                      </div>
                      {stepNumber < 3 && (
                        <div
                          className={`h-0.5 flex-1 mx-1 sm:mx-2 transition-all duration-300 ${
                            step > stepNumber ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
                  <span>{t('coverLetter', 'Cover Letter')}</span>
                  <span>{t('budget', 'Budget')} & {t('timeline', 'Timeline')}</span>
                  <span>{t('review', 'Review')}</span>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-4 sm:p-6">
                {errors.submit && (
                  <div className="mb-6 p-3 sm:p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-2 sm:gap-3">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                    <span className="text-rose-800 dark:text-rose-300 font-medium text-sm sm:text-base">{errors.submit}</span>
                  </div>
                )}

                {/* Step 1: Cover Letter */}
                {step === 1 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          {t('coverLetter', 'Cover Letter')} *
                        </label>
                        <Button
                          type="button"
                          onClick={handleGenerateAISuggestion}
                          disabled={aiLoading}
                          variant="outline"
                          size="sm"
                          className="text-xs w-full sm:w-auto"
                        >
                          <Brain className="h-3 w-3 mr-2" />
                          {aiLoading ? t('generating', 'Generating...') : t('generateAI', 'Generate with AI')}
                        </Button>
                      </div>
                      
                      <Textarea
                        value={formData.coverLetter}
                        onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                        rows={isMobile ? 8 : 10}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-800 dark:text-white dark:border-slate-600 ${
                          errors.coverLetter ? 'border-rose-500 dark:border-rose-400 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-600'
                        }`}
                        placeholder={t('coverLetterPlaceholder', `Introduce yourself and explain why you're the perfect ${applyMode === 'team' ? 'team' : 'freelancer'}...`)}
                      />
                      
                      {errors.coverLetter && (
                        <p className="text-rose-600 dark:text-rose-400 text-xs sm:text-sm mt-2 font-medium">{errors.coverLetter}</p>
                      )}
                      
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                        <span>{t('minChars', 'Minimum 50 characters')}</span>
                        <span>{formData.coverLetter.length}/2000</span>
                      </div>
                    </div>

                    {/* Tips for Team Applications */}
                    {applyMode === 'team' && selectedTeamDetails && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 sm:p-4">
                        <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2 text-sm sm:text-base">
                          <Users className="h-4 w-4" />
                          {t('teamTips', 'Team Application Tips')}
                        </h4>
                        <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-purple-800 dark:text-purple-400">
                          <li>• {t('teamTip1', 'Highlight your team\'s combined expertise')}</li>
                          <li>• {t('teamTip2', 'Mention key team members and their roles')}</li>
                          <li>• {t('teamTip3', 'Explain your team\'s collaboration process')}</li>
                          <li>• {t('teamTip4', 'Share previous team projects success stories')}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Budget & Duration */}
                {step === 2 && (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Budget Range Info */}
                    <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Info className="w-3 h-3 sm:w-4 sm:h-4 text-sky-600 dark:text-sky-400" />
                          <span className="text-xs sm:text-sm font-medium text-sky-900 dark:text-sky-100">
                            {t('clientBudget', 'Client\'s Budget Range')}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] sm:text-xs">
                          {projectData.budget.type === 'fixed' ? t('fixedPrice', 'Fixed Price') : t('hourlyRate', 'Hourly Rate')}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm text-sky-800 dark:text-sky-200">
                        <span>{t('min', 'Minimum')}: {projectData.budget.min} {projectData.budget.currency}</span>
                        <span>{t('max', 'Maximum')}: {projectData.budget.max} {projectData.budget.currency}</span>
                      </div>
                    </div>

                    {/* Proposed Budget */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        <DollarSign className="w-4 w-4 inline mr-1" />
                        {t('proposedBudget', 'Proposed Budget')} ({projectData.budget.currency}) *
                      </label>
                      
                      <div className="mb-6">
                        <input
                          type="range"
                          min={projectData.budget.min}
                          max={projectData.budget.max}
                          step="50"
                          value={formData.proposedBudget}
                          onChange={(e) => handleInputChange('proposedBudget', Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
                        />
                        
                        {/* Budget Indicator */}
                        <div className="relative h-2 bg-slate-200 dark:bg-slate-600 rounded-lg mt-4">
                          <div 
                            className="absolute h-2 rounded-lg bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400"
                            style={{ width: '100%' }}
                          />
                          <div 
                            className={`absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white dark:border-slate-800 shadow-lg -top-1 -ml-2 ${budgetIndicator.color}`}
                            style={{ left: `${budgetIndicator.position}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
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
                          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-800 dark:text-white dark:border-slate-600 ${
                            errors.proposedBudget ? 'border-rose-500 dark:border-rose-400 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-600'
                          }`}
                          min={projectData.budget.min}
                          max={projectData.budget.max}
                          step="50"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-slate-500 dark:text-slate-400 text-sm">{projectData.budget.currency}</span>
                        </div>
                      </div>
                      
                      {errors.proposedBudget && (
                        <p className="text-rose-600 dark:text-rose-400 text-xs sm:text-sm mt-1 font-medium">{errors.proposedBudget}</p>
                      )}
                      
                      {/* Quick Budget Buttons */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button
                          type="button"
                          onClick={() => handleInputChange('proposedBudget', projectData.budget.min)}
                          variant="outline"
                          size="sm"
                          className="text-[10px] sm:text-xs"
                        >
                          {t('min', 'Min')} ({projectData.budget.min})
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleInputChange('proposedBudget', Math.round((projectData.budget.min + projectData.budget.max) / 2))}
                          variant="outline"
                          size="sm"
                          className="text-[10px] sm:text-xs"
                        >
                          {t('average', 'Average')} ({Math.round((projectData.budget.min + projectData.budget.max) / 2)})
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleInputChange('proposedBudget', projectData.budget.max)}
                          variant="outline"
                          size="sm"
                          className="text-[10px] sm:text-xs"
                        >
                          {t('max', 'Max')} ({projectData.budget.max})
                        </Button>
                      </div>
                    </div>

                    {/* Estimated Duration */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {t('estimatedDuration', 'Estimated Duration')} *
                      </label>
                      <Input
                        type="text"
                        value={formData.estimatedDuration}
                        onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-800 dark:text-white dark:border-slate-600 ${
                          errors.estimatedDuration ? 'border-rose-500 dark:border-rose-400 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-600'
                        }`}
                        placeholder={t('durationPlaceholder', 'e.g., 2 weeks, 1 month, 3-4 days...')}
                      />
                      {errors.estimatedDuration && (
                        <p className="text-rose-600 dark:text-rose-400 text-xs sm:text-sm mt-1 font-medium">{errors.estimatedDuration}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Attachments */}
                {step === 3 && (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Application Summary */}
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm sm:text-base">
                        {t('applicationSummary', 'Application Summary')}
                      </h4>
                      
                      <div className="space-y-2 sm:space-y-3 text-sm">
                        <div className="flex justify-between flex-wrap gap-2">
                          <span className="text-slate-600 dark:text-slate-400">{t('applicationMode', 'Application Mode')}</span>
                          <Badge variant={applyMode === 'team' ? 'default' : 'outline'}>
                            {applyMode === 'team' ? (
                              <>
                                <Users className="h-3 w-3 mr-1" />
                                {t('team', 'Team')}
                              </>
                            ) : (
                              <>
                                <User className="h-3 w-3 mr-1" />
                                {t('individual', 'Individual')}
                              </>
                            )}
                          </Badge>
                        </div>
                        
                        {applyMode === 'team' && selectedTeamDetails && (
                          <div className="flex justify-between flex-wrap gap-2">
                            <span className="text-slate-600 dark:text-slate-400">{t('selectedTeam', 'Selected Team')}</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {selectedTeamDetails.name}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between flex-wrap gap-2">
                          <span className="text-slate-600 dark:text-slate-400">{t('proposedBudget', 'Proposed Budget')}</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formData.proposedBudget} {projectData.budget.currency}
                          </span>
                        </div>
                        
                        <div className="flex justify-between flex-wrap gap-2">
                          <span className="text-slate-600 dark:text-slate-400">{t('estimatedDuration', 'Estimated Duration')}</span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {formData.estimatedDuration}
                          </span>
                        </div>
                        
                        <div className="flex justify-between flex-wrap gap-2">
                          <span className="text-slate-600 dark:text-slate-400">{t('attachments', 'Attachments')}</span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {formData.attachments.length} file{formData.attachments.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Attachments */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        {t('attachments', 'Attachments')} ({t('optional', 'Optional')})
                        <span className="text-slate-500 dark:text-slate-400 text-xs font-normal ml-2">
                          {t('maxFiles', 'Max 5 files, 10MB each')}
                        </span>
                      </label>
                      
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 sm:p-8 text-center hover:border-sky-400 dark:hover:border-sky-500 transition-colors">
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
                          disabled={uploading}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          {uploading ? (
                            <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-sky-600 animate-spin mx-auto mb-2 sm:mb-3" />
                          ) : (
                            <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400 dark:text-slate-500 mx-auto mb-2 sm:mb-3" />
                          )}
                          <p className="text-slate-600 dark:text-slate-400 font-medium text-sm sm:text-base">
                            {uploading ? t('uploading', 'Uploading...') : t('clickToUpload', 'Click to upload files')}
                          </p>
                          <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">
                            {t('supportedFormats', 'Supports PDF, DOC, JPG, PNG, ZIP')}
                          </p>
                        </label>
                      </div>

                      {/* Upload Progress */}
                      {Object.keys(uploadProgress).length > 0 && (
                        <div className="mt-4 space-y-2">
                          {Object.entries(uploadProgress).map(([fileName, progress]) => (
                            <div key={fileName} className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-sky-600 transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500">{progress}%</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Attachment List */}
                      {formData.attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {formData.attachments.map((attachment, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                            >
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                {attachment.type.startsWith('image/') ? (
                                  <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                                ) : (
                                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                    {attachment.name}
                                  </p>
                                  <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs">
                                    {attachment.type.split('/').pop()?.toUpperCase() || 'FILE'} • {(attachment.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAttachment(index)}
                                className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-slate-500 hover:text-rose-600 flex-shrink-0"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {errors.attachments && (
                        <p className="text-rose-600 dark:text-rose-400 text-xs sm:text-sm mt-2 font-medium">{errors.attachments}</p>
                      )}
                    </div>

                    {/* Final Validation */}
                    {errors.team && (
                      <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-amber-800 dark:text-amber-400 font-medium text-sm">{errors.team}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-6 sm:pt-8 border-t border-slate-200 dark:border-slate-700 mt-6 sm:mt-8">
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {t('step', 'Step')} {step} {t('of', 'of')} 3
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    {step > 1 && (
                      <Button
                        onClick={handleBack}
                        disabled={isProcessing}
                        variant="outline"
                        size={isMobile ? "sm" : "default"}
                        className="min-w-[80px] sm:min-w-[100px]"
                      >
                        {t('back', 'Back')}
                      </Button>
                    )}
                    {step < 3 ? (
                      <Button
                        onClick={handleNext}
                        disabled={isProcessing}
                        size={isMobile ? "sm" : "default"}
                        className="min-w-[80px] sm:min-w-[100px] bg-sky-600 hover:bg-sky-700"
                      >
                        {t('next', 'Next')}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        disabled={isProcessing}
                        size={isMobile ? "sm" : "default"}
                        className="min-w-[120px] sm:min-w-[150px] bg-emerald-600 hover:bg-emerald-700"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                            {t('submitting', 'Submitting...')}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            {t('submit', 'Submit')}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Responsive */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Project Details */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">
                {t('projectDetails', 'Project Details')}
              </h3>

              {/* Client Info */}
              {projectData.client && (
                <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-slate-200 dark:border-slate-700">
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2 sm:mb-3 text-sm sm:text-base">{t('client', 'Client')}</h4>
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-sky-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                      {projectData.client.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">{projectData.client.name}</p>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{projectData.client.title || t('client', 'Client')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 fill-current" />
                    <span className="font-medium text-slate-900 dark:text-white">
                      {(projectData.client.rating || 0).toFixed(1)}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">•</span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {projectData.client.completedProjects || 0} {t('projects', 'projects')}
                    </span>
                  </div>
                </div>
              )}

              {/* Project Stats */}
              <div className="space-y-2 sm:space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">{t('budgetRange', 'Budget Range')}</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {projectData.budget.min} - {projectData.budget.max} {projectData.budget.currency}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">{t('deadline', 'Deadline')}</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatDate(projectData.deadline)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">{t('applications', 'Applications')}</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {projectData.applicationCount}
                  </span>
                </div>
                
                {projectData.location && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">{t('location', 'Location')}</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {projectData.location}
                    </span>
                  </div>
                )}
              </div>

              {/* Required Skills */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200 dark:border-slate-700">
                <h4 className="font-medium text-slate-900 dark:text-white mb-2 sm:mb-3 text-sm sm:text-base">{t('requiredSkills', 'Required Skills')}</h4>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {projectData.skills?.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-[10px] sm:text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-sky-50 to-purple-50 dark:from-sky-900/20 dark:to-purple-900/20 border border-sky-200 dark:border-sky-800 rounded-xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600 dark:text-sky-400" />
                {t('proTips', 'Pro Tips')}
              </h3>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2 text-sm sm:text-base">
                    {t('for', 'For')} {applyMode === 'team' ? t('team', 'Team') : t('individual', 'Individual')} {t('applications', 'Applications')}:
                  </h4>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-2">
                      <Target className="h-3 w-3 text-sky-500 mt-0.5 flex-shrink-0" />
                      <span>{t('tip1', 'Address specific project requirements')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Target className="h-3 w-3 text-sky-500 mt-0.5 flex-shrink-0" />
                      <span>{t('tip2', 'Provide relevant examples of similar work')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Target className="h-3 w-3 text-sky-500 mt-0.5 flex-shrink-0" />
                      <span>{t('tip3', 'Be transparent about availability')}</span>
                    </li>
                    {applyMode === 'team' && (
                      <li className="flex items-start gap-2">
                        <Users className="h-3 w-3 text-purple-500 mt-0.5 flex-shrink-0" />
                        <span>{t('tip4', 'Highlight team collaboration')}</span>
                      </li>
                    )}
                  </ul>
                </div>
                
                <Separator className="my-2 sm:my-3" />
                
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2 text-sm sm:text-base">{t('budgetAdvice', 'Budget Advice')}</h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {t('budgetTip', 'Propose a competitive but realistic budget that reflects the project\'s complexity and your expertise.')}
                  </p>
                </div>
                
                <Button
                  onClick={() => setShowAiAssistant(true)}
                  className="w-full bg-gradient-to-r from-sky-600 to-purple-600 text-white hover:opacity-90 text-sm"
                  size={isMobile ? "sm" : "default"}
                >
                  <Brain className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  {t('openAI', 'Open AI Assistant')}
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
              title: t('aiApplied', 'AI Suggestion Applied'),
              description: t('proposalUpdated', 'Proposal updated with AI suggestions'),
            })
          }}
          lang={lang}
        />
      )}
    </div>
  )
}