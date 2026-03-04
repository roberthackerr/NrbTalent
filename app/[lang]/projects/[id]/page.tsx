// app/projects/[id]/page.tsx
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
  Award
} from 'lucide-react'
import Link from 'next/link'
import { AIArchitectBadge } from '@/components/projects/AIArchitectBadge'
import { useIsProjectOwner } from '@/hooks/project-ownership'
import { useSession } from 'next-auth/react'

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
  const {data:session}=useSession()
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = params.id as string
  
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const IsProjectOwner= useIsProjectOwner(projectData?.client?._id);
  // Gérer les query params pour les messages
  useEffect(() => {
    const messageParam = searchParams.get('message')
    const errorParam = searchParams.get('error')

    if (messageParam === 'application_success') {
      setMessage({
        type: 'success',
        text: '🎉 Félicitations ! Votre candidature a été envoyée avec succès. Le client sera notifié et vous contactera bientôt.'
      })
      setShowMessage(true)
      
      // Nettoyer l'URL après affichage du message
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }

    if (errorParam === 'project_not_found') {
      setMessage({
        type: 'error',
        text: '❌ Le projet que vous cherchez n\'existe pas ou a été supprimé.'
      })
      setShowMessage(true)
      
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams])

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
        // Vérifier si le projet est sauvegardé
        checkIfSaved(data._id)
      } catch (error) {
        console.error('Erreur lors du chargement du projet:', error)
        setMessage({
          type: 'error',
          text: '❌ Impossible de charger les détails du projet. Veuillez réessayer.'
        })
        setShowMessage(true)
      } finally {
        setLoading(false)
      }
    }

    loadProjectData()
  }, [id])

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
        
        // Message de confirmation
        setMessage({
          type: 'success',
          text: isSaved ? '📌 Projet retiré de vos sauvegardes' : '⭐ Projet sauvegardé avec succès !'
        })
        setShowMessage(true)
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      setMessage({
        type: 'error',
        text: '❌ Erreur lors de la sauvegarde. Veuillez réessayer.'
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
          text: '📤 Projet partagé avec succès !'
        })
        setShowMessage(true)
      } catch (error) {
        // L'utilisateur a annulé le partage, pas d'erreur à afficher
      }
    } else {
      // Fallback: copier dans le clipboard
      navigator.clipboard.writeText(window.location.href)
      setMessage({
        type: 'success',
        text: '📋 Lien copié dans le presse-papier !'
      })
      setShowMessage(true)
    }
  }

  // Postuler au projet
  const handleApply = () => {
    router.push(`/projects/${id}/apply`)
  }

  // Fermer le message
  const closeMessage = () => {
    setShowMessage(false)
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('fr-FR')
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
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
      case 'high': return '🔴 Urgent'
      case 'medium': return '🟡 Normal'
      case 'low': return '🟢 Flexible'
      default: return 'Non spécifié'
    }
  }

  // Afficher le chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-8">
              {/* Header Skeleton */}
              <div className="flex items-center gap-4 mb-8">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-64"></div>
              </div>
              
              {/* Content Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                  <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                  <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                </div>
                <div className="space-y-6">
                  <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                  <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-rose-600 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Projet non trouvé</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Le projet que vous cherchez n'existe pas ou n'est plus disponible.</p>
          <button
            onClick={() => router.push('/projects')}
            className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700 transition-colors font-medium"
          >
            Voir tous les projets
          </button>
        </div>
      </div>
    )
  }

  const daysLeft = getDaysLeft(projectData.deadline)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
      {/* Bannière de message */}
      {showMessage && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 ${
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

      {/* Header avec navigation */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour aux projets
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleShareProject}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">Partager</span>
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
                <span className="text-sm">{isSaved ? 'Sauvegardé' : 'Sauvegarder'}</span>
              </button>
                <AIArchitectBadge
    projectId={projectData._id}
    clientId={projectData.client?._id}
    projectTitle={projectData.title}
    className="ml-2"
  />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contenu principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* En-tête du projet */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 px-4 py-2 rounded-full text-sm font-semibold">
                        {projectData.category}
                      </span>
                      {projectData.subcategory && (
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-full text-sm">
                          {projectData.subcategory}
                        </span>
                      )}
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        projectData.status === 'open' 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {projectData.status === 'open' ? '🔓 Ouvert aux candidatures' : '🔒 Projet fermé'}
                      </span>
                    </div>
                    
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
                      {projectData.title}
                    </h1>

                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 mb-6">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span className={`font-medium ${getUrgencyColor(projectData.urgency).split(' ')[0]}`}>
                          {getUrgencyText(projectData.urgency)}
                        </span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <span className="capitalize">{projectData.complexity}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right ml-6">
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                      {formatCurrency(projectData.budget.min, projectData.budget.currency)} - {formatCurrency(projectData.budget.max, projectData.budget.currency)}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {projectData.budget.type === 'fixed' ? 'Budget forfaitaire' : 'Taux horaire'}
                    </div>
                  </div>
                </div>

                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg mb-8">
                  {projectData.description}
                </p>

                {/* Statistiques rapides */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">{projectData.applicationCount}</div>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Candidatures</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Eye className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">{projectData.views}</div>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Vues</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Bookmark className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">{projectData.saveCount}</div>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Sauvegardes</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">{daysLeft}</div>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Jours restants</div>
                  </div>
                </div>
              </div>

              {/* Compétences requises */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                  <Award className="w-6 h-6 text-sky-600" />
                  Compétences requises
                </h2>
                <div className="flex flex-wrap gap-3">
                  {projectData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30 text-sky-800 dark:text-sky-300 px-4 py-3 rounded-xl text-sm font-semibold border border-sky-200 dark:border-sky-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Étapes du projet */}
              {projectData.milestones && projectData.milestones.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                    <Target className="w-6 h-6 text-sky-600" />
                    Étapes du projet
                  </h2>
                  <div className="space-y-6">
                    {projectData.milestones.map((milestone, index) => (
                      <div key={index} className="flex items-start gap-6 p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-lg font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{milestone.title}</h3>
                            <div className="flex flex-wrap gap-2">
                              <span className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg text-sm font-medium">
                                {formatCurrency(milestone.amount, projectData.budget.currency)}
                              </span>
                              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                milestone.status === 'completed' 
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                              }`}>
                                {milestone.status === 'completed' ? '✅ Terminé' : '⏳ En attente'}
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 mb-3">{milestone.description}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
                            <Calendar className="w-4 h-4" />
                            <span>Échéance: {formatDate(milestone.dueDate)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pièces jointes */}
              {projectData.attachments && projectData.attachments.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                    <FileText className="w-6 h-6 text-sky-600" />
                    Documents du projet
                  </h2>
                  <div className="grid gap-3">
                    {projectData.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                      >
                        <div className="flex-shrink-0 w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                            {attachment.name}
                          </p>
                          <p className="text-slate-500 dark:text-slate-500 text-sm">{attachment.type}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <ArrowLeft className="w-5 h-5 text-slate-400 transform rotate-180 group-hover:text-sky-600 transition-colors" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Carte d'action */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 sticky top-8">
                {projectData.status === 'open'? (
                  <>
                  {  !IsProjectOwner && session?.user?.role!=='client' ? (
                    <>
                                     <button
                      onClick={handleApply}
                      className="w-full bg-gradient-to-r from-sky-600 to-blue-600 text-white py-4 px-6 rounded-xl font-bold hover:from-sky-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg mb-4 flex items-center justify-center gap-3"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Postuler maintenant
                    </button>
                    </>
                  ):
                  (<></>)
                  }
   
                    
                    {/* 🔥 BOUTON POUR VOIR LES PROPOSITIONS */}
                    <Link
                      href={`/projects/${projectData._id}/proposals`}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg mb-4 flex items-center justify-center gap-3"
                    >
                      <Users className="w-5 h-5" />
                      Voir les propositions ({projectData.applicationCount})
                    </Link>
                    
                    <div className="text-center text-sm text-slate-600 dark:text-slate-400 mb-6">
                      {projectData.applicationCount} freelancer(s) ont déjà postulé
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      disabled
                      className="w-full bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 py-4 px-6 rounded-xl font-bold cursor-not-allowed mb-4"
                    >
                      Projet fermé aux candidatures
                    </button>
                    
                    {/* 🔥 BOUTON POUR VOIR LES PROPOSITIONS (même si projet fermé) */}
                    {projectData.applicationCount > 0 && (
                      <Link
                        href={`/projects/${projectData._id}/proposals`}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg mb-4 flex items-center justify-center gap-3"
                      >
                        <Users className="w-5 h-5" />
                        Voir les propositions ({projectData.applicationCount})
                      </Link>
                    )}
                  </>
                )}

                <div className="space-y-4 text-sm border-t border-slate-200 dark:border-slate-700 pt-6">
                  <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Posté le:</span>
                      <span className="font-semibold text-slate-900 dark:text-white ml-2 block">{formatDate(projectData.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Clock className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Date limite:</span>
                      <span className="font-semibold text-slate-900 dark:text-white ml-2 block">{formatDate(projectData.deadline)}</span>
                    </div>
                  </div>

                  {projectData.location && (
                    <div className="flex items-center gap-4">
                      <MapPin className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Localisation:</span>
                        <span className="font-semibold text-slate-900 dark:text-white ml-2 block">{projectData.location}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <Euro className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Type de budget:</span>
                      <span className="font-semibold text-slate-900 dark:text-white ml-2 block capitalize">
                        {projectData.budget.type === 'fixed' ? 'Forfait fixe' : 'Taux horaire'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Building2 className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Complexité:</span>
                      <span className="font-semibold text-slate-900 dark:text-white ml-2 block capitalize">
                        {projectData.complexity}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Zap className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Urgence:</span>
                      <span className={`font-semibold ml-2 block capitalize ${getUrgencyColor(projectData.urgency)} px-3 py-1 rounded-full text-xs`}>
                        {getUrgencyText(projectData.urgency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations du client */}
              { projectData.client &&(
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-sky-600" />
                    À propos du client 
                  </h3>
                  {IsProjectOwner && (<> <p className='font-bold text-slate-600 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors'>C'est votre projet</p> </>)}  
                  <Link href={`/profile/${projectData.client._id}`}>
                    <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer group">
                      <img
                        src={projectData.client.avatar || '/default-avatar.png'}
                        alt={projectData.client.name}
                        className="w-16 h-16 rounded-xl border-2 border-slate-200 dark:border-slate-600 group-hover:border-sky-300 dark:group-hover:border-sky-600 transition-colors"
                      />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {projectData.client.name}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">{projectData.client.title || 'Client'}</p>
                      </div>
                    </div>
                  </Link>
                 {!IsProjectOwner && (<>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <Star className="w-5 h-5 text-amber-400 fill-current" />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">{(projectData.client.rating || 0).toFixed(1)}/5</span>
                        <span className="text-slate-600 dark:text-slate-400 ml-2">Note moyenne</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">{projectData.client.completedProjects || 0}</span>
                        <span className="text-slate-600 dark:text-slate-400 ml-2">Projets réalisés</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <Calendar className="w-5 h-5 text-sky-500" />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">{projectData.client.createdAt}</span>
                        <span className="text-slate-600 dark:text-slate-400 ml-2">Membre depuis</span>
                      </div>
                    </div>
                  </div>
                 </>)}
                 
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}