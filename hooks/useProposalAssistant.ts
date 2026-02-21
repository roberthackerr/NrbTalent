//hooks/useProposalAssistant.ts
import { useState, useCallback } from 'react'
import { proposalAssistant, ProposalAssistantOptions, ProposalSuggestion } from '@/services/proposalAssistantService'

export function useProposalAssistant() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<ProposalSuggestion | null>(null)

  const generateSuggestion = useCallback(async (options: ProposalAssistantOptions) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🚀 Génération proposal avec options:', options)
      const result = await proposalAssistant.generateProposalSuggestion(options)
      console.log('✅ Suggestion générée:', result)
      setSuggestion(result)
      return result
    } catch (error: any) {
      console.error('❌ Erreur génération:', error)
      setError(error.message || 'Erreur lors de la génération de la suggestion')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const improveCoverLetter = useCallback(async (coverLetter: string, projectData: any, freelancerData: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const improved = await proposalAssistant.improveCoverLetter(coverLetter, projectData, freelancerData)
      return improved
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'amélioration')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const analyzeProject = useCallback(async (projectData: any, freelancerData: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const analysis = await proposalAssistant.analyzeProject(projectData, freelancerData)
      return analysis
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'analyse')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const suggestBudget = useCallback(async (projectData: any, freelancerData: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const suggestion = await proposalAssistant.suggestBudget(projectData, freelancerData)
      return suggestion
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la suggestion de budget')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const clearSuggestion = useCallback(() => {
    setSuggestion(null)
    setError(null)
  }, [])

  return {
    loading,
    error,
    suggestion,
    generateSuggestion,
    improveCoverLetter,
    analyzeProject,
    suggestBudget,
    clearSuggestion
  }
}