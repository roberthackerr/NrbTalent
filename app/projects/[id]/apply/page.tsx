// app/projects/[id]/apply/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Upload, FileText, Clock, DollarSign, AlertCircle, CheckCircle2, Info, Building2, Calendar, MapPin, Users, Star, X, Euro } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'

interface ApplicationData {
  coverLetter: string
  proposedBudget: number
  estimatedDuration: string
  attachments: Array<{
    name: string
    url: string
    type: string
  }>
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

export default function ApplyPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<ApplicationData>({
    coverLetter: '',
    proposedBudget: 0,
    estimatedDuration: '',
    attachments: []
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [loadingProject, setLoadingProject] = useState(true)

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
        
        // Initialiser le budget avec la valeur minimale
        if (data?.budget?.min) {
          setFormData(prev => ({
            ...prev,
            proposedBudget: data.budget.min
          }))
        }
      } catch (error) {
        console.error('Erreur lors du chargement du projet:', error)
        router.push(`/projects/${id}/?error=project_not_found`)
      } finally {
        setLoadingProject(false)
      }
    }

    loadProjectData()
  }, [id, router])

  // Calculer le budget moyen
  const averageBudget = projectData?.budget ? 
    (projectData.budget.min + projectData.budget.max) / 2 : 0

  const handleInputChange = (field: keyof ApplicationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileUpload = async (file: File) => {
    if (formData.attachments.length >= 5) {
      setErrors(prev => ({ ...prev, attachments: 'Maximum 5 fichiers autorisés' }))
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, attachments: 'Fichier trop volumineux (max 10MB)' }))
      return
    }

    setUploading(true)
    try {
      // Simulation d'upload - à remplacer par votre logique d'upload réelle
      const fakeUpload = await new Promise<{ url: string }>((resolve) => {
        setTimeout(() => resolve({ url: URL.createObjectURL(file) }), 1000)
      })

      const newAttachment = {
        name: file.name,
        url: fakeUpload.url,
        type: file.type
      }

      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, newAttachment]
      }))
    } catch (error) {
      setErrors(prev => ({ ...prev, attachments: 'Erreur lors du téléchargement' }))
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

  const validateStep = (step: number): boolean => {
    if (!projectData?.budget) return false

    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.coverLetter.trim()) {
        newErrors.coverLetter = 'La lettre de motivation est requise'
      } else if (formData.coverLetter.length < 50) {
        newErrors.coverLetter = 'La lettre de motivation doit faire au moins 50 caractères'
      }
    }

    if (step === 2) {
      if (!formData.proposedBudget || formData.proposedBudget < 1) {
        newErrors.proposedBudget = 'Le budget proposé est invalide'
      } else if (formData.proposedBudget < projectData.budget.min) {
        newErrors.proposedBudget = `Le budget minimum est de ${projectData.budget.min} ${projectData.budget.currency}`
      } else if (formData.proposedBudget > projectData.budget.max) {
        newErrors.proposedBudget = `Le budget maximum est de ${projectData.budget.max} ${projectData.budget.currency}`
      }
      
      if (!formData.estimatedDuration.trim()) {
        newErrors.estimatedDuration = 'La durée estimée est requise'
      }
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

  const handleSubmit = async () => {
    if (!validateStep(3) || !projectData) return

    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la candidature')
      }

      // Redirection vers la page du projet avec message de succès
      router.push(`/projects/${id}?message=application_success`)
      
    } catch (error) {
      setErrors(prev => ({ ...prev, submit: (error as Error).message }))
    } finally {
      setLoading(false)
    }
  }

  const getBudgetIndicator = (budget: number) => {
    if (!projectData?.budget) return { position: 0, color: 'bg-gray-400', label: 'Chargement...' }

    const range = projectData.budget.max - projectData.budget.min
    const position = ((budget - projectData.budget.min) / range) * 100
    
    let color = 'bg-emerald-500'
    let label = 'Budget raisonnable'
    
    if (budget < projectData.budget.min) {
      color = 'bg-gray-400'
      label = 'En dessous du budget minimum'
    } else if (budget > projectData.budget.max) {
      color = 'bg-rose-500'
      label = 'Au-dessus du budget maximum'
    } else if (budget < averageBudget * 0.8) {
      color = 'bg-sky-500'
      label = 'Budget compétitif'
    } else if (budget > averageBudget * 1.2) {
      color = 'bg-amber-500'
      label = 'Budget élevé'
    }

    return { position: Math.min(Math.max(position, 0), 100), color, label }
  }

  const budgetIndicator = getBudgetIndicator(formData.proposedBudget)
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('fr-FR')

  // Afficher le chargement
  if (loadingProject) {
    return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-blue-950/20 dark:to-purple-950/10">
            <Navigation />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Chargement du projet...</p>
        </div>
      </div>
    )
  }

  // Si le projet n'est pas chargé
  if (!projectData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-rose-600 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Projet non trouvé</h1>
          <p className="text-slate-600 mb-4">Le projet que vous cherchez n'existe pas ou n'est plus disponible.</p>
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

 return (
  <div className="min-h-screen bg-white dark:bg-slate-900 py-8">
    <div className="container mx-auto px-4 max-w-6xl">
      {/* Header avec navigation */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour au projet
        </button>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Postuler à "{projectData.title}"</h1>
          <p className="text-slate-600 dark:text-slate-400">Remplissez votre candidature pour ce projet</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire de candidature */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            {/* Progress Steps */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center justify-between max-w-md mx-auto">
                {[1, 2, 3].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        step >= stepNumber
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {stepNumber}
                    </div>
                    {stepNumber < 3 && (
                      <div
                        className={`w-12 h-1 mx-2 ${
                          step > stepNumber ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
                <span>Lettre de motivation</span>
                <span>Budget & Délai</span>
                <span>Pièces jointes</span>
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
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Lettre de motivation *
                    </label>
                    <textarea
                      value={formData.coverLetter}
                      onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                      rows={10}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:placeholder-slate-400 ${
                        errors.coverLetter ? 'border-rose-500 dark:border-rose-400' : 'border-slate-300 dark:border-slate-600'
                      }`}
                      placeholder={`Expliquez pourquoi vous êtes le freelance idéal pour "${projectData.title}". Mentionnez votre expérience, vos compétences spécifiques et comment vous pouvez aider le client à réussir son projet...`}
                    />
                    {errors.coverLetter && (
                      <p className="text-rose-600 dark:text-rose-400 text-sm mt-1 font-medium">{errors.coverLetter}</p>
                    )}
                    <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mt-2">
                      <span>Minimum 50 caractères</span>
                      <span>{formData.coverLetter.length}/2000</span>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span className="text-sm font-medium text-sky-900 dark:text-sky-100">
                        Fourchette de budget du client
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-sky-800 dark:text-sky-200">
                      <span>Minimum: {projectData.budget.min} {projectData.budget.currency}</span>
                      <span>Maximum: {projectData.budget.max} {projectData.budget.currency}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Budget proposé ({projectData.budget.currency}) *
                    </label>
                    
                    <div className="mb-4">
                      <input
                        type="range"
                        min={projectData.budget.min}
                        max={projectData.budget.max}
                        step="50"
                        value={formData.proposedBudget}
                        onChange={(e) => handleInputChange('proposedBudget', Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                      
                      <div className="relative h-2 bg-slate-200 dark:bg-slate-600 rounded-lg mt-2">
                        <div 
                          className="absolute h-2 rounded-lg bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400"
                          style={{ width: '100%' }}
                        ></div>
                        <div 
                          className={`absolute w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 shadow-lg -top-0.5 -ml-1.5 ${budgetIndicator.color}`}
                          style={{ left: `${budgetIndicator.position}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>{projectData.budget.min}</span>
                        <span className="font-medium">{budgetIndicator.label}</span>
                        <span>{projectData.budget.max}</span>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        value={formData.proposedBudget}
                        onChange={(e) => handleInputChange('proposedBudget', Number(e.target.value))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-800 dark:text-white dark:border-slate-600 ${
                          errors.proposedBudget ? 'border-rose-500 dark:border-rose-400' : 'border-slate-300 dark:border-slate-600'
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
                    
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => handleInputChange('proposedBudget', projectData.budget.min)}
                        className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-3 py-1 rounded transition-colors font-medium"
                      >
                        Minimum ({projectData.budget.min})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('proposedBudget', Math.round(averageBudget / 50) * 50)}
                        className="text-xs bg-sky-100 dark:bg-sky-900/30 hover:bg-sky-200 dark:hover:bg-sky-800 text-sky-700 dark:text-sky-300 px-3 py-1 rounded transition-colors font-medium"
                      >
                        Moyen ({Math.round(averageBudget / 50) * 50})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('proposedBudget', projectData.budget.max)}
                        className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-3 py-1 rounded transition-colors font-medium"
                      >
                        Maximum ({projectData.budget.max})
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Durée estimée *
                    </label>
                    <input
                      type="text"
                      value={formData.estimatedDuration}
                      onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:placeholder-slate-400 ${
                        errors.estimatedDuration ? 'border-rose-500 dark:border-rose-400' : 'border-slate-300 dark:border-slate-600'
                      }`}
                      placeholder="Ex: 2 semaines, 1 mois, 3-4 jours..."
                    />
                    {errors.estimatedDuration && (
                      <p className="text-rose-600 dark:text-rose-400 text-sm mt-1 font-medium">{errors.estimatedDuration}</p>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Pièces jointes (optionnel)
                    </label>
                    
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-sky-400 dark:hover:border-sky-500 transition-colors">
                      <input
                        type="file"
                        id="file-upload"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          files.forEach(handleFileUpload)
                        }}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                          Cliquez pour télécharger des fichiers
                        </p>
                        <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
                          PDF, DOC, JPG, PNG (max 10MB par fichier)
                        </p>
                      </label>
                    </div>

                    {uploading && (
                      <div className="mt-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">Téléchargement en cours...</p>
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
                                <p className="font-medium text-sm text-slate-900 dark:text-white">{attachment.name}</p>
                                <p className="text-slate-500 dark:text-slate-400 text-xs">{attachment.type}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeAttachment(index)}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {errors.attachments && (
                      <p className="text-rose-600 dark:text-rose-400 text-sm mt-2 font-medium">{errors.attachments}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-slate-700 mt-6">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Étape {step} sur 3
                </div>
                <div className="flex gap-3">
                  {step > 1 && (
                    <button
                      onClick={handleBack}
                      disabled={loading}
                      className="px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                    >
                      Retour
                    </button>
                  )}
                  {step < 3 ? (
                    <button
                      onClick={handleNext}
                      disabled={loading}
                      className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium"
                    >
                      Suivant
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Envoyer la candidature
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar avec informations du projet */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sticky top-8">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Détails du projet
            </h3>

            {/* Informations du client */}
            {projectData.client && (
              <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                <h4 className="font-medium text-slate-900 dark:text-white mb-3">Client</h4>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={projectData.client.avatar || '/default-avatar.png'}
                    alt={projectData.client.name}
                    className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-600"
                  />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{projectData.client.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{projectData.client.title || 'Client'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-amber-400 fill-current" />
                  <span className="font-medium text-slate-900 dark:text-white">{(projectData.client.rating || 0).toFixed(1)}</span>
                  <span className="text-slate-400 dark:text-slate-500">•</span>
                  <span className="text-slate-600 dark:text-slate-400">{projectData.client.completedProjects || 0} projets</span>
                </div>
              </div>
            )}

            {/* Statistiques du projet */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Euro className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <div className="flex-1">
                  <span className="text-slate-600 dark:text-slate-400">Budget:</span>
                  <span className="font-medium text-slate-900 dark:text-white ml-2">
                    {projectData.budget.min} - {projectData.budget.max} {projectData.budget.currency}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <div className="flex-1">
                  <span className="text-slate-600 dark:text-slate-400">Date limite:</span>
                  <span className="font-medium text-slate-900 dark:text-white ml-2">{formatDate(projectData.deadline)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <div className="flex-1">
                  <span className="text-slate-600 dark:text-slate-400">Candidatures:</span>
                  <span className="font-medium text-slate-900 dark:text-white ml-2">{projectData.applicationCount}</span>
                </div>
              </div>

              {projectData.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <div className="flex-1">
                    <span className="text-slate-600 dark:text-slate-400">Localisation:</span>
                    <span className="font-medium text-slate-900 dark:text-white ml-2">{projectData.location}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Compétences requises */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h4 className="font-medium text-slate-900 dark:text-white mb-3">Compétences recherchées</h4>
              <div className="flex flex-wrap gap-2">
                {projectData.skills?.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 px-2 py-1 rounded text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)
}