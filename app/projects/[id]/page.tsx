// app/projects/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Calendar, MapPin, Users, Euro, Star, Clock, Building2, Eye, Bookmark, Share2, CheckCircle, MessageCircle, X, CheckCircle2, AlertCircle, FileText } from 'lucide-react'
import Link from 'next/link'

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

  // Afficher le chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Chargement du projet...</p>
        </div>
      </div>
    )
  }

  // Si le projet n'est pas chargé
  if (!projectData) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
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
    <div className="min-h-screen bg-white dark:bg-slate-900">
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
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour aux projets
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleShareProject}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 rounded-lg"
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
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                <span className="text-sm">{isSaved ? 'Sauvegardé' : 'Sauvegarder'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2">
            {/* En-tête du projet */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {projectData.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span className="bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 px-3 py-1 rounded-full text-sm font-medium">
                      {projectData.category}
                    </span>
                    {projectData.subcategory && (
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm">
                        {projectData.subcategory}
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      projectData.status === 'open' 
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {projectData.status === 'open' ? '🔓 Ouvert' : '🔒 Fermé'}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    {formatCurrency(projectData.budget.min, projectData.budget.currency)} - {formatCurrency(projectData.budget.max, projectData.budget.currency)}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {projectData.budget.type === 'fixed' ? 'Budget fixe' : 'Budget horaire'}
                  </div>
                </div>
              </div>

              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                {projectData.description}
              </p>

              {/* Statistiques rapides */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{projectData.applicationCount}</div>
                    <div className="text-slate-600 dark:text-slate-400">Candidatures</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{projectData.views}</div>
                    <div className="text-slate-600 dark:text-slate-400">Vues</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Bookmark className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{projectData.saveCount}</div>
                    <div className="text-slate-600 dark:text-slate-400">Sauvegardes</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{daysLeft}</div>
                    <div className="text-slate-600 dark:text-slate-400">Jours restants</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Compétences requises */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Compétences requises</h2>
              <div className="flex flex-wrap gap-2">
                {projectData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 px-3 py-2 rounded-lg text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Étapes du projet */}
            {projectData.milestones && projectData.milestones.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Étapes du projet</h2>
                <div className="space-y-4">
                  {projectData.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{milestone.title}</h3>
                          <span className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs font-medium">
                            {formatCurrency(milestone.amount, projectData.budget.currency)}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            milestone.status === 'completed' 
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                          }`}>
                            {milestone.status === 'completed' ? 'Terminé' : 'En attente'}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">{milestone.description}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                          <Calendar className="w-3 h-3" />
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
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Pièces jointes</h2>
                <div className="space-y-2">
                  {projectData.attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">{attachment.name}</p>
                        <p className="text-slate-500 dark:text-slate-500 text-xs">{attachment.type}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Carte d'action */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6 sticky top-8">
              {projectData.status === 'open' ? (
                <>
                  <button
                    onClick={handleApply}
                    className="w-full bg-sky-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-sky-700 transition-colors mb-4 flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Postuler maintenant
                  </button>
                  
                  <div className="text-center text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {projectData.applicationCount} personne(s) ont déjà postulé
                  </div>
                </>
              ) : (
                <button
                  disabled
                  className="w-full bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 py-3 px-4 rounded-lg font-semibold cursor-not-allowed"
                >
                  Projet fermé
                </button>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <div className="flex-1">
                    <span className="text-slate-600 dark:text-slate-400">Posté le:</span>
                    <span className="font-medium text-slate-900 dark:text-white ml-2 block">{formatDate(projectData.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <div className="flex-1">
                    <span className="text-slate-600 dark:text-slate-400">Date limite:</span>
                    <span className="font-medium text-slate-900 dark:text-white ml-2 block">{formatDate(projectData.deadline)}</span>
                  </div>
                </div>

                {projectData.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <div className="flex-1">
                      <span className="text-slate-600 dark:text-slate-400">Localisation:</span>
                      <span className="font-medium text-slate-900 dark:text-white ml-2 block">{projectData.location}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Euro className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <div className="flex-1">
                    <span className="text-slate-600 dark:text-slate-400">Type de budget:</span>
                    <span className="font-medium text-slate-900 dark:text-white ml-2 block capitalize">
                      {projectData.budget.type === 'fixed' ? 'Fixe' : 'Horaire'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <div className="flex-1">
                    <span className="text-slate-600 dark:text-slate-400">Complexité:</span>
                    <span className="font-medium text-slate-900 dark:text-white ml-2 block capitalize">
                      {projectData.complexity}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations du client */}
            {projectData.client && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">À propos du client</h3>
                <Link
                href={`/profile/${projectData.client._id}`}>
                    <div className="flex items-center gap-3 mb-4">
                  <img
                    src={projectData.client.avatar || '/default-avatar.png'}
                    alt={projectData.client.name}
                    className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-600"
                  />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{projectData.client.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{projectData.client.title || 'Client'}</p>
                  </div>
                </div>
                </Link>
            

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                    <span className="font-medium text-slate-900 dark:text-white">{(projectData.client.rating || 0).toFixed(1)}</span>
                    <span className="text-slate-400 dark:text-slate-500">•</span>
                    <span className="text-slate-600 dark:text-slate-400">{projectData.client.completedProjects || 0} projets réalisés</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Membre depuis {new Date(projectData.client.createdAt).getFullYear()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}