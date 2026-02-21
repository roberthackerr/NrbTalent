'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Wand2, RefreshCw, Check, AlertCircle, Brain, DollarSign, Clock, Target, FileText, Zap } from 'lucide-react'
import { useProposalAssistant } from '@/hooks/useProposalAssistant'
import type { ProposalAssistantOptions } from '@/services/proposalAssistantService'

interface ProposalAssistantWidgetProps {
  projectData: any
  freelancerData: any
  onApplySuggestion: (suggestion: any) => void
  className?: string
}

export function ProposalAssistantWidget({
  projectData,
  freelancerData,
  onApplySuggestion,
  className = ''
}: ProposalAssistantWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'generate' | 'improve' | 'analyze' | 'budget'>('generate')
  const [currentCoverLetter, setCurrentCoverLetter] = useState('')
  
  const {
    loading,
    error,
    suggestion,
    generateSuggestion,
    improveCoverLetter,
    analyzeProject,
    suggestBudget,
    clearSuggestion
  } = useProposalAssistant()

  const [analysis, setAnalysis] = useState<any>(null)
  const [budgetSuggestion, setBudgetSuggestion] = useState<any>(null)
  const [improvementResult, setImprovementResult] = useState<string>('')

  const handleGenerateSuggestion = async () => {
    const options: ProposalAssistantOptions = {
      projectTitle: projectData.title,
      projectDescription: projectData.description,
      projectBudget: projectData.budget,
      projectSkills: projectData.skills || [],
      clientName: projectData.client?.name,
      freelancerData: {
        name: freelancerData.name,
        title: freelancerData.title,
        skills: freelancerData.skills || [],
        experience: freelancerData.experience || [],
        hourlyRate: freelancerData.hourlyRate,
        bio: freelancerData.bio
      },
      templateType: 'professional'
    }

    await generateSuggestion(options)
  }

  const handleImproveCoverLetter = async () => {
    if (!currentCoverLetter.trim()) {
      alert('Veuillez d\'abord écrire une lettre de motivation')
      return
    }

    const improved = await improveCoverLetter(currentCoverLetter, projectData, freelancerData)
    setImprovementResult(improved)
  }

  const handleAnalyzeProject = async () => {
    const analysisResult = await analyzeProject(projectData, freelancerData)
    setAnalysis(analysisResult)
  }

  const handleGetBudgetSuggestion = async () => {
    const suggestion = await suggestBudget(projectData, freelancerData)
    setBudgetSuggestion(suggestion)
  }

  const applySuggestion = (field: string, value: any) => {
    onApplySuggestion({ [field]: value })
    
    // Notification visuelle
    const event = new CustomEvent('proposal-assistant:applied', {
      detail: { field, value }
    })
    window.dispatchEvent(event)
  }

  const applyAllSuggestions = () => {
    if (suggestion) {
      onApplySuggestion({
        coverLetter: suggestion.coverLetter,
        proposedBudget: suggestion.budgetSuggestion,
        estimatedDuration: suggestion.estimatedDuration
      })
    }
  }

  useEffect(() => {
    // Écouter les changements de lettre de motivation depuis le formulaire principal
    const handleCoverLetterChange = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail?.coverLetter) {
        setCurrentCoverLetter(customEvent.detail.coverLetter)
      }
    }

    window.addEventListener('form:cover-letter-change', handleCoverLetterChange as EventListener)
    return () => {
      window.removeEventListener('form:cover-letter-change', handleCoverLetterChange as EventListener)
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Bouton principal flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-sky-600 to-purple-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 group"
      >
        <div className="relative">
          <Sparkles className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            AI
          </span>
        </div>
        <span className="sr-only">Assistant Proposal</span>
      </button>

      {/* Panneau assistant */}
      {isOpen && (
        <div className="fixed inset-0 z-40">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Panneau */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col animate-slide-in-right">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-sky-900/20 dark:to-purple-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-sky-500 to-purple-500 rounded-lg">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Assistant Proposal AI
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Génère et améliore ta candidature
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              {[
                { id: 'generate', label: 'Générer', icon: <Sparkles className="w-4 h-4" /> },
                { id: 'improve', label: 'Améliorer', icon: <Wand2 className="w-4 h-4" /> },
                { id: 'analyze', label: 'Analyser', icon: <Target className="w-4 h-4" /> },
                { id: 'budget', label: 'Budget', icon: <DollarSign className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedTab(tab.id as any)
                    clearSuggestion()
                    setAnalysis(null)
                    setBudgetSuggestion(null)
                    setImprovementResult('')
                  }}
                  className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    selectedTab === tab.id
                      ? 'text-sky-600 dark:text-sky-400 border-b-2 border-sky-600 dark:border-sky-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* État de chargement */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-400">
                    {selectedTab === 'generate' && 'Génération de la proposal...'}
                    {selectedTab === 'improve' && 'Amélioration en cours...'}
                    {selectedTab === 'analyze' && 'Analyse du projet...'}
                    {selectedTab === 'budget' && 'Calcul du budget...'}
                  </p>
                </div>
              )}

              {/* Erreur */}
              {error && !loading && (
                <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    <p className="text-rose-800 dark:text-rose-300 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Tab: Générer */}
              {selectedTab === 'generate' && !loading && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                      Générer une proposal complète
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      L'IA analysera le projet et ton profil pour générer une candidature optimisée.
                    </p>
                    
                    <button
                      onClick={handleGenerateSuggestion}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-sky-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      Générer avec l'IA
                    </button>
                  </div>

                  {suggestion && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Score de confiance */}
                      <div className="bg-gradient-to-r from-sky-50 to-emerald-50 dark:from-sky-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-sky-200 dark:border-sky-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-900 dark:text-white">
                            Score de confiance
                          </span>
                          <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                            {suggestion.confidenceScore}/100
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-emerald-400 to-sky-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${suggestion.confidenceScore}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Aperçu lettre */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Lettre de motivation
                          </h5>
                          <button
                            onClick={() => applySuggestion('coverLetter', suggestion.coverLetter)}
                            className="text-sm bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 px-3 py-1 rounded hover:bg-sky-200 dark:hover:bg-sky-800 transition-colors"
                          >
                            Appliquer
                          </button>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                          <p className="text-slate-700 dark:text-slate-300 text-sm line-clamp-4">
                            {suggestion.coverLetter.substring(0, 300)}...
                          </p>
                        </div>
                      </div>

                      {/* Budget suggéré */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Budget suggéré
                          </h5>
                          <button
                            onClick={() => applySuggestion('proposedBudget', suggestion.budgetSuggestion)}
                            className="text-sm bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                          >
                            Appliquer
                          </button>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">
                              {suggestion.budgetSuggestion} {projectData.budget.currency}
                            </span>
                            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                              {suggestion.budgetJustification}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Durée */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Durée estimée
                          </h5>
                          <button
                            onClick={() => applySuggestion('estimatedDuration', suggestion.estimatedDuration)}
                            className="text-sm bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-3 py-1 rounded hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
                          >
                            Appliquer
                          </button>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-lg font-medium text-slate-900 dark:text-white">
                            {suggestion.estimatedDuration}
                          </span>
                        </div>
                      </div>

                      {/* Bouton tout appliquer */}
                      <button
                        onClick={applyAllSuggestions}
                        className="w-full bg-gradient-to-r from-emerald-600 to-sky-600 text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        Appliquer toutes les suggestions
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Améliorer */}
              {selectedTab === 'improve' && !loading && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                      Améliorer ma lettre
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      L'IA rendra ta lettre de motivation plus professionnelle et percutante.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Ta lettre actuelle
                        </label>
                        <textarea
                          value={currentCoverLetter}
                          onChange={(e) => setCurrentCoverLetter(e.target.value)}
                          rows={6}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                          placeholder="Colle ta lettre de motivation ici..."
                        />
                      </div>

                      <button
                        onClick={handleImproveCoverLetter}
                        disabled={!currentCoverLetter.trim() || loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Wand2 className="w-5 h-5" />
                        Améliorer avec l'IA
                      </button>
                    </div>
                  </div>

                  {improvementResult && (
                    <div className="animate-fade-in">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-slate-900 dark:text-white">
                          Version améliorée
                        </h5>
                        <button
                          onClick={() => {
                            onApplySuggestion({ coverLetter: improvementResult })
                            setCurrentCoverLetter(improvementResult)
                          }}
                          className="text-sm bg-sky-600 text-white px-3 py-1 rounded hover:bg-sky-700 transition-colors"
                        >
                          Remplacer
                        </button>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 max-h-64 overflow-y-auto">
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">
                          {improvementResult}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Analyser */}
              {selectedTab === 'analyze' && !loading && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                      Analyse du projet
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      L'IA analysera la difficulté du projet et ton adéquation.
                    </p>

                    <button
                      onClick={handleAnalyzeProject}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <Target className="w-5 h-5" />
                      Analyser le projet
                    </button>
                  </div>

                  {analysis && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Score d'adéquation */}
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-900 dark:text-white">
                            Adéquation avec tes compétences
                          </span>
                          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {analysis.skillsMatch}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${analysis.skillsMatch}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Difficulté */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                            Difficulté
                          </div>
                          <div className={`text-lg font-semibold ${
                            analysis.difficulty === 'beginner' ? 'text-emerald-600 dark:text-emerald-400' :
                            analysis.difficulty === 'intermediate' ? 'text-amber-600 dark:text-amber-400' :
                            'text-rose-600 dark:text-rose-400'
                          }`}>
                            {analysis.difficulty === 'beginner' ? 'Débutant' :
                             analysis.difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                            Heures estimées
                          </div>
                          <div className="text-lg font-semibold text-slate-900 dark:text-white">
                            {analysis.estimatedHours}h
                          </div>
                        </div>
                      </div>

                      {/* Questions pour le client */}
                      {analysis.keyQuestions && analysis.keyQuestions.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-slate-900 dark:text-white mb-2">
                            Questions à poser au client
                          </h5>
                          <ul className="space-y-2">
                            {analysis.keyQuestions.map((question: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <Zap className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                  {question}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Avantages compétitifs */}
                      {analysis.competitiveAdvantages && analysis.competitiveAdvantages.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-slate-900 dark:text-white mb-2">
                            Tes avantages
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {analysis.competitiveAdvantages.map((advantage: string, index: number) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 rounded-full text-sm font-medium"
                              >
                                {advantage}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Budget */}
              {selectedTab === 'budget' && !loading && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                      Conseils budget
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      L'IA te suggère un budget optimal basé sur la complexité du projet.
                    </p>

                    <button
                      onClick={handleGetBudgetSuggestion}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <DollarSign className="w-5 h-5" />
                      Calculer le budget optimal
                    </button>
                  </div>

                  {budgetSuggestion && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Fourchette suggérée */}
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                            {budgetSuggestion.suggested} {projectData.budget.currency}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Budget suggéré
                          </div>
                        </div>

                        <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-2">
                          <div className="absolute h-2 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 rounded-full w-full"></div>
                          <div 
                            className="absolute w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 shadow-lg -top-1 -ml-2 bg-emerald-500"
                            style={{ left: `${((budgetSuggestion.suggested - projectData.budget.min) / (projectData.budget.max - projectData.budget.min)) * 100}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                          <span>{projectData.budget.min}</span>
                          <span className="font-medium">Recommandé</span>
                          <span>{projectData.budget.max}</span>
                        </div>
                      </div>

                      {/* Justification */}
                      <div>
                        <h5 className="font-semibold text-slate-900 dark:text-white mb-2">
                          Justification
                        </h5>
                        <p className="text-slate-700 dark:text-slate-300 text-sm">
                          {budgetSuggestion.justification}
                        </p>
                      </div>

                      {/* Fourchette safe */}
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <h5 className="font-semibold text-slate-900 dark:text-white mb-3">
                          Fourchette recommandée
                        </h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                              {budgetSuggestion.min} {projectData.budget.currency}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              Minimum
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                              {budgetSuggestion.max} {projectData.budget.currency}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              Maximum
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bouton appliquer */}
                      <button
                        onClick={() => applySuggestion('proposedBudget', budgetSuggestion.suggested)}
                        className="w-full bg-gradient-to-r from-emerald-600 to-sky-600 text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
                      >
                        Appliquer ce budget
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                L'Assistant AI t'aide à optimiser ta candidature, mais vérifie toujours les suggestions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Styles d'animation */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #0891b2;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #0891b2;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  )
}