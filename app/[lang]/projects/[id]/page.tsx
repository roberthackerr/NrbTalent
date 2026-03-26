// app/[lang]/projects/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Euro, 
  Star, 
  Clock, 
  Building2, 
  Eye, 
  Bookmark, 
  Share2, 
  CheckCircle, 
  MessageCircle, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  Briefcase,
  Target,
  Zap,
  Award,
  ChevronRight,
  Home,
  Menu,
  Heart,
  Send,
  User,
  Mail,
  Phone,
  Globe,
  Github,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  Facebook,
  Twitch,
  Discord,
  Slack,
  Figma,
  Dribbble,
  Behance,
  Medium,
  Dev,
  Code,
  Coffee,
  Github as GithubIcon,
  Linkedin as LinkedinIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  Youtube as YoutubeIcon,
  Facebook as FacebookIcon,
  Twitch as TwitchIcon,
  Discord as DiscordIcon,
  Slack as SlackIcon,
  Figma as FigmaIcon,
  Dribbble as DribbbleIcon,
  Behance as BehanceIcon,
  Medium as MediumIcon,
  Dev as DevIcon,
  Code as CodeIcon,
  Coffee as CoffeeIcon,
  ImageIcon,
  Download,
  Edit,
} from 'lucide-react'
import Link from 'next/link'
import { AIArchitectBadge } from '@/components/projects/AIArchitectBadge'
import { useIsProjectOwner } from '@/hooks/project-ownership'
import { useSession } from 'next-auth/react'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

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
  subcategory?: string
  skills: string[]
  deadline: string
  location?: string
  applicationCount: number
  saveCount: number
  views: number
  createdAt: string
  updatedAt: string
  status: string
  visibility: string
  featured: boolean
  urgency: string
  complexity: string
  milestones?: Array<{
    title: string
    amount: number
    dueDate: string
    description: string
    status: string
  }>
  attachments?: Array<{
    name: string
    url: string
    type: string
    size:any
  }>
  client?: {
    _id: string
    name: string
    avatar?: string
    title?: string
    rating?: number
    completedProjects?: number
    createdAt: string
  }
}

export default function ProjectDetailsPage() {
  const { data: session } = useSession()
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = params.id as string
  const lang = params.lang as Locale
  
  const [dict, setDict] = useState<any>(null)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const IsProjectOwner = useIsProjectOwner(projectData?.client?._id)

  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  // Gérer les query params pour les messages
  useEffect(() => {
    const messageParam = searchParams.get('message')
    const errorParam = searchParams.get('error')

    if (messageParam === 'application_success') {
      setMessage({
        type: 'success',
        text: dict?.projects?.applicationSuccess || '🎉 Félicitations ! Votre candidature a été envoyée avec succès.'
      })
      setShowMessage(true)
      
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }

    if (errorParam === 'project_not_found') {
      setMessage({
        type: 'error',
        text: dict?.projects?.projectNotFound || '❌ Le projet que vous cherchez n\'existe pas ou a été supprimé.'
      })
      setShowMessage(true)
      
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams, dict])

  // Auto-masquer le message après 8 secondes
  useEffect(() => {
    if (showMessage) {
      const timer = setTimeout(() => {
        setShowMessage(false)
      }, 8000)

      return () => clearTimeout(timer)
    }
  }, [showMessage])

  // Charger les données du projet
  useEffect(() => {
    async function loadProjectData() {
      try {
        const response = await fetch(`/api/projects/${id}`)
        if (!response.ok) {
          throw new Error('Projet non trouvé')
        }
        const data = await response.json()
        setProjectData(data)
        checkIfSaved(data._id)
      } catch (error) {
        console.error('Erreur lors du chargement du projet:', error)
        setMessage({
          type: 'error',
          text: dict?.projects?.loadError || '❌ Impossible de charger les détails du projet.'
        })
        setShowMessage(true)
      } finally {
        setLoading(false)
      }
    }

    if (dict) {
      loadProjectData()
    }
  }, [id, dict])

  // Vérifier si le projet est sauvegardé
  const checkIfSaved = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/saved`)
      if (response.ok) {
        const data = await response.json()
        setIsSaved(data.isSaved)
      }
    } catch (error) {
      console.error('Erreur vérification sauvegarde:', error)
    }
  }

  // Sauvegarder le projet
  const handleSaveProject = async () => {
    if (!projectData) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/projects/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId: projectData._id }),
      })

      if (response.ok) {
        setIsSaved(!isSaved)
        setProjectData(prev => prev ? {
          ...prev,
          saveCount: isSaved ? prev.saveCount - 1 : prev.saveCount + 1
        } : null)
        
        setMessage({
          type: 'success',
          text: isSaved 
            ? (dict?.projects?.unsaved || '📌 Projet retiré de vos sauvegardes')
            : (dict?.projects?.saved || '⭐ Projet sauvegardé avec succès !')
        })
        setShowMessage(true)
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      setMessage({
        type: 'error',
        text: dict?.projects?.saveError || '❌ Erreur lors de la sauvegarde.'
      })
      setShowMessage(true)
    } finally {
      setSaving(false)
    }
  }

  // Partager le projet
  const handleShareProject = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: projectData?.title,
          text: projectData?.description,
          url: window.location.href,
        })
        setMessage({
          type: 'success',
          text: dict?.projects?.shared || '📤 Projet partagé avec succès !'
        })
        setShowMessage(true)
      } catch (error) {
        // L'utilisateur a annulé le partage
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      setMessage({
        type: 'success',
        text: dict?.projects?.linkCopied || '📋 Lien copié dans le presse-papier !'
      })
      setShowMessage(true)
    }
  }

  // Postuler au projet
  const handleApply = () => {
    router.push(`/${lang}/projects/${id}/apply`)
  }

  // Fermer le message
  const closeMessage = () => {
    setShowMessage(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'en' ? 'en-US' : 'fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : lang === 'en' ? 'en-US' : 'fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  // Calculer les jours restants
  const getDaysLeft = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Obtenir la couleur selon l'urgence
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
    }
  }

  // Obtenir le texte d'urgence
  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'high': return dict?.projects?.urgent || '🔴 Urgent'
      case 'medium': return dict?.projects?.normal || '🟡 Normal'
      case 'low': return dict?.projects?.flexible || '🟢 Flexible'
      default: return dict?.projects?.notSpecified || 'Non spécifié'
    }
  }

  // Afficher le chargement
  if (loading || !dict) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-8">
              {/* Header Skeleton Mobile Friendly */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-full sm:w-64"></div>
              </div>
              
              {/* Content Skeleton Mobile Friendly */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="h-64 sm:h-48 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                  <div className="h-48 sm:h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                  <div className="h-96 sm:h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                </div>
                <div className="space-y-6">
                  <div className="h-64 sm:h-48 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                  <div className="h-48 sm:h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Si le projet n'est pas chargé
  if (!projectData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-rose-600 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {dict?.projects?.notFound || 'Projet non trouvé'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {dict?.projects?.notFoundDesc || 'Le projet que vous cherchez n\'existe pas ou n\'est plus disponible.'}
          </p>
          <button
            onClick={() => router.push(`/${lang}/projects`)}
            className="bg-sky-600 text-white px-6 py-3 rounded-xl hover:bg-sky-700 transition-colors font-medium w-full sm:w-auto"
          >
            {dict?.projects?.viewAll || 'Voir tous les projets'}
          </button>
        </div>
      </div>
    )
  }

  const daysLeft = getDaysLeft(projectData.deadline)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
      {/* Bannière de message mobile friendly */}
      {showMessage && (
        <div className={`fixed top-4 left-4 right-4 md:left-1/2 md:transform md:-translate-x-1/2 z-50 max-w-md mx-auto ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' 
            : 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800'
        } border rounded-lg shadow-lg p-4 animate-in slide-in-from-top duration-300`}>
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 ${
              message.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                message.type === 'success' 
                  ? 'text-emerald-800 dark:text-emerald-300' 
                  : 'text-rose-800 dark:text-rose-300'
              }`}>
                {message.text}
              </p>
            </div>
            <button
              onClick={closeMessage}
              className={`flex-shrink-0 p-1 rounded-full hover:bg-white/50 dark:hover:bg-black/20 transition-colors ${
                message.type === 'success' 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header avec navigation mobile friendly */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">{dict?.common?.back || 'Retour'}</span>
            </button>
            
            {/* Menu mobile */}
            <div className="sm:hidden relative">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {isMobileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
                  <button
                    onClick={() => {
                      handleShareProject()
                      setIsMobileMenuOpen(false)
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    {dict?.common?.share || 'Partager'}
                  </button>
                  <button
                    onClick={() => {
                      handleSaveProject()
                      setIsMobileMenuOpen(false)
                    }}
                    disabled={saving}
                    className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current text-amber-500' : ''}`} />
                    {isSaved 
                      ? (dict?.common?.saved || 'Sauvegardé') 
                      : (dict?.common?.save || 'Sauvegarder')}
                  </button>
                                  <button
                    onClick={() => {
                      router.push(`/${lang}/projects/${id}/edit`);
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    
                    <Edit className={`w-4 h-4 `} />
                    {dict?.common?.edit || 'modifier' }
                  </button>
                </div>
              )}
            </div>

            {/* Actions desktop */}
            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={handleShareProject}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">{dict?.common?.share || 'Partager'}</span>
              </button>
              
              <button
                onClick={handleSaveProject}
                disabled={saving}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors font-medium ${
                  isSaved 
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                <span className="text-sm">{isSaved 
                  ? (dict?.common?.saved || 'Sauvegardé') 
                  : (dict?.common?.save || 'Sauvegarder')}
                </span>
              </button>
                                               <button
                    onClick={() => {
                      router.push(`/${lang}/projects/${id}/edit`);
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    
                    <Edit className={`w-4 h-4 `} />
                    {dict?.common?.edit || 'modifier' }
                  </button>
              
              <AIArchitectBadge
                projectId={projectData._id}
                clientId={projectData.client?._id}
                projectTitle={projectData.title}
                className="ml-2"
                dict={dict}
                lang={lang}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Contenu principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* En-tête du projet mobile friendly */}
              <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-6 mb-6">
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                      <span className="bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold">
                        {projectData.category}
                      </span>
                      {projectData.subcategory && (
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm">
                          {projectData.subcategory}
                        </span>
                      )}
                      <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${
                        projectData.status === 'open' 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {projectData.status === 'open' 
                          ? (dict?.projects?.open || '🔓 Ouvert aux candidatures')
                          : (dict?.projects?.closed || '🔒 Projet fermé')}
                      </span>
                    </div>
                    
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
                      {projectData.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-slate-600 dark:text-slate-400 mb-6">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span className={`text-xs sm:text-sm font-medium ${getUrgencyColor(projectData.urgency)} px-2 py-1 rounded-full`}>
                          {getUrgencyText(projectData.urgency)}
                        </span>
                      </div>
                      <span className="hidden sm:inline">•</span>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <span className="text-xs sm:text-sm capitalize">
                          {projectData.complexity === 'easy' && (dict?.projects?.easy || 'Facile')}
                          {projectData.complexity === 'medium' && (dict?.projects?.medium || 'Moyen')}
                          {projectData.complexity === 'hard' && (dict?.projects?.hard || 'Difficile')}
                          {projectData.complexity === 'expert' && (dict?.projects?.expert || 'Expert')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full lg:w-auto text-left lg:text-right">
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 break-words">
                      {formatCurrency(projectData.budget.min, projectData.budget.currency)} - {formatCurrency(projectData.budget.max, projectData.budget.currency)}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {projectData.budget.type === 'fixed' 
                        ? (dict?.projects?.fixedBudget || 'Budget forfaitaire')
                        : (dict?.projects?.hourlyRate || 'Taux horaire')}
                    </div>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed mb-8">
                  {projectData.description}
                </p>

                {/* Statistiques rapides mobile friendly */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-2">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-sky-400" />
                      <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">{projectData.applicationCount}</div>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {dict?.projects?.applications || 'Candidatures'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-2">
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-sky-400" />
                      <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">{projectData.views}</div>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {dict?.projects?.views || 'Vues'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-2">
                      <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-sky-400" />
                      <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">{projectData.saveCount}</div>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {dict?.projects?.saves || 'Sauvegardes'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-2">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-sky-400" />
                      <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">{daysLeft}</div>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {dict?.projects?.daysLeft || 'Jours restants'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compétences requises */}
              <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
                  {dict?.projects?.requiredSkills || 'Compétences requises'}
                </h2>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {projectData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30 text-sky-800 dark:text-sky-300 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold border border-sky-200 dark:border-sky-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Étapes du projet */}
              {projectData.milestones && projectData.milestones.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
                    {dict?.projects?.milestones || 'Étapes du projet'}
                  </h2>
                  <div className="space-y-4 sm:space-y-6">
                    {projectData.milestones.map((milestone, index) => (
                      <div key={index} className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 p-4 sm:p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white text-base sm:text-lg font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <h3 className="font-semibold text-slate-900 dark:text-white text-base sm:text-lg">{milestone.title}</h3>
                            <div className="flex flex-wrap gap-2">
                              <span className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium">
                                {formatCurrency(milestone.amount, projectData.budget.currency)}
                              </span>
                              <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium ${
                                milestone.status === 'completed' 
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                              }`}>
                                {milestone.status === 'completed' 
                                  ? (dict?.projects?.completed || '✅ Terminé')
                                  : (dict?.projects?.pending || '⏳ En attente')}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2 sm:mb-3">{milestone.description}</p>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-500">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{dict?.projects?.deadline || 'Échéance'}: {formatDate(milestone.dueDate)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pièces jointes */}
  {projectData.attachments && projectData.attachments.length > 0 && (
  <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
      {dict?.projects?.attachments || 'Documents du projet'}
    </h2>
    <div className="grid gap-3">
      {projectData.attachments.map((attachment, index) => {
        const isPdf = attachment.type === 'application/pdf' || 
                      attachment.name?.toLowerCase().endsWith('.pdf')
        const isImage = attachment.type?.startsWith('image/')
        
        return (
          <div key={index} className="group">
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              download={isPdf} // This forces download for PDFs
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                isPdf ? 'bg-red-100 dark:bg-red-900/30' : 
                isImage ? 'bg-green-100 dark:bg-green-900/30' : 
                'bg-sky-100 dark:bg-sky-900/30'
              }`}>
                {isPdf ? (
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                ) : isImage ? (
                  <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600 dark:text-sky-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                  {attachment.name}
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-500">
                  <span>
                    {isPdf ? 'PDF Document' : 
                     isImage ? 'Image' : 
                     attachment.type?.split('/')[1]?.toUpperCase() || 'File'}
                  </span>
                  {attachment.size && (
                    <>
                      <span>•</span>
                      <span>{(attachment.size / 1024).toFixed(1)} KB</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {isPdf && (
                  <span className="text-xs text-slate-400 group-hover:text-sky-600 transition-colors hidden sm:inline">
                    {dict?.projects?.download || 'Télécharger'}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-sky-600 transition-colors" />
              </div>
            </a>
            
            {/* Optional: PDF preview for first PDF */}
            {isPdf && index === 0 && (
              <div className="mt-3 pl-14 sm:pl-16">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
                  <span>{dict?.projects?.preview || 'Aperçu rapide'}</span>
                  <a
                    href={attachment.url}
                    download
                    className="text-sky-600 hover:underline text-xs flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    {dict?.projects?.downloadFile || 'Télécharger le fichier'}
                  </a>
                </div>
                <iframe
                  src={`${attachment.url}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-[200px] sm:h-[300px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                  title={`Preview of ${attachment.name}`}
                  loading="lazy"
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  </div>
)}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Carte d'action mobile friendly */}
              <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-5 sm:p-6 sticky top-24">
                {projectData.status === 'open' ? (
                  <>
                    {!IsProjectOwner && session?.user?.role !== 'client' ? (
                      <button
                        onClick={handleApply}
                        className="w-full bg-gradient-to-r from-sky-600 to-blue-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold hover:from-sky-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg mb-4 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
                      >
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                        {dict?.projects?.apply || 'Postuler maintenant'}
                      </button>
                    ) : (
                      <></>
                    )}
                    
                    {/* Boutons pour les propositions */}
                    <Link
                      href={`/${lang}/projects/${projectData._id}/proposals`}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg mb-3 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
                    >
                      <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                      {dict?.projects?.viewProposals || 'Voir les propositions'} ({projectData.applicationCount})
                    </Link>
                    
                    {IsProjectOwner && (
                      <Link
                        href={`/${lang}/projects/${projectData._id}/applications`}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg mb-3 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
                      >
                        <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                        {dict?.projects?.viewTeamProposals || 'Voir les propositions d\'équipes'}
                      </Link>
                    )}
                    
                    <div className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
                      {projectData.applicationCount} {dict?.projects?.applicationsCount || 'freelancer(s) ont déjà postulé'}
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      disabled
                      className="w-full bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold cursor-not-allowed mb-4 text-sm sm:text-base"
                    >
                      {dict?.projects?.closed || 'Projet fermé aux candidatures'}
                    </button>
                    
                    {projectData.applicationCount > 0 && (
                      <div className="space-y-3">
                        <Link
                          href={`/${lang}/projects/${projectData._id}/proposals`}
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
                        >
                          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                          {dict?.projects?.viewProposals || 'Voir les propositions'} ({projectData.applicationCount})
                        </Link>
                        <Link
                          href={`/${lang}/projects/${projectData._id}/applications`}
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
                        >
                          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                          {dict?.projects?.viewTeamProposals || 'Voir les propositions d\'équipes'}
                        </Link>
                      </div>
                    )}
                  </>
                )}

                <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm border-t border-slate-200 dark:border-slate-700 pt-4 sm:pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 dark:text-slate-400" />
                    <div>
                      <span className="text-slate-600 dark:text-slate-400 block sm:inline">
                        {dict?.projects?.postedOn || 'Posté le'}:
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white sm:ml-2 block sm:inline">
                        {formatDate(projectData.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 dark:text-slate-400" />
                    <div>
                      <span className="text-slate-600 dark:text-slate-400 block sm:inline">
                        {dict?.projects?.deadline || 'Date limite'}:
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white sm:ml-2 block sm:inline">
                        {formatDate(projectData.deadline)}
                      </span>
                    </div>
                  </div>

                  {projectData.location && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 dark:text-slate-400" />
                      <div>
                        <span className="text-slate-600 dark:text-slate-400 block sm:inline">
                          {dict?.projects?.location || 'Localisation'}:
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white sm:ml-2 block sm:inline">
                          {projectData.location}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <Euro className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 dark:text-slate-400" />
                    <div>
                      <span className="text-slate-600 dark:text-slate-400 block sm:inline">
                        {dict?.projects?.budgetType || 'Type de budget'}:
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white sm:ml-2 block sm:inline capitalize">
                        {projectData.budget.type === 'fixed' 
                          ? (dict?.projects?.fixed || 'Forfait fixe')
                          : (dict?.projects?.hourly || 'Taux horaire')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 dark:text-slate-400" />
                    <div>
                      <span className="text-slate-600 dark:text-slate-400 block sm:inline">
                        {dict?.projects?.complexity || 'Complexité'}:
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white sm:ml-2 block sm:inline capitalize">
                        {projectData.complexity === 'easy' && (dict?.projects?.easy || 'Facile')}
                        {projectData.complexity === 'medium' && (dict?.projects?.medium || 'Moyen')}
                        {projectData.complexity === 'hard' && (dict?.projects?.hard || 'Difficile')}
                        {projectData.complexity === 'expert' && (dict?.projects?.expert || 'Expert')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 dark:text-slate-400" />
                    <div>
                      <span className="text-slate-600 dark:text-slate-400 block sm:inline">
                        {dict?.projects?.urgency || 'Urgence'}:
                      </span>
                      <span className={`font-semibold sm:ml-2 block sm:inline mt-1 sm:mt-0 ${getUrgencyColor(projectData.urgency)} px-2 sm:px-3 py-1 rounded-full text-xs inline-block`}>
                        {getUrgencyText(projectData.urgency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations du client */}
              {projectData.client && (
                <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" />
                    {dict?.projects?.aboutClient || 'À propos du client'}
                  </h3>
                  
                  {IsProjectOwner && (
                    <p className="text-sm font-bold text-slate-600 dark:text-white mb-4">
                      {dict?.projects?.yourProject || 'C\'est votre projet'}
                    </p>
                  )}
                  
                  <Link href={`/${lang}/profile/${projectData.client._id}`}>
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer group">
                      <img
                        src={projectData.client.avatar || '/default-avatar.png'}
                        alt={projectData.client.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl border-2 border-slate-200 dark:border-slate-600 group-hover:border-sky-300 dark:group-hover:border-sky-600 transition-colors"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                          {projectData.client.name}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">
                          {projectData.client.title || dict?.projects?.client || 'Client'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-sky-600 transition-colors flex-shrink-0" />
                    </div>
                  </Link>
                  
                  {!IsProjectOwner && (
                    <div className="space-y-3 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-current" />
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {(projectData.client.rating || 0).toFixed(1)}/5
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 ml-1 sm:ml-2">
                            {dict?.projects?.avgRating || 'Note moyenne'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {projectData.client.completedProjects || 0}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 ml-1 sm:ml-2">
                            {dict?.projects?.completedProjects || 'Projets réalisés'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-sky-500" />
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {new Date(projectData.client.createdAt).getFullYear()}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 ml-1 sm:ml-2">
                            {dict?.projects?.memberSince || 'Membre depuis'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}