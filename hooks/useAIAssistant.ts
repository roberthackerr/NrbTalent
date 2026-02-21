// hooks/useAIAssistant.ts - VERSION CORRIGÉE
import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface AIUser {
  _id: string
  name: string
  avatar: string
  role: string
  isAI: boolean
}

export const useAIAssistant = () => {
  const [aiUser, setAiUser] = useState<AIUser | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)

  const initialize = useCallback(async (force = false) => {
    if ((isInitialized && !force) || isInitializing) {
      return aiUser
    }

    setIsInitializing(true)
    console.log('🔄 Initialisation AI Assistant...')
    
    try {
      const response = await fetch('/api/ai/create-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.aiUser) {
          setAiUser(data.aiUser)
          setIsInitialized(true)
          console.log('✅ AI Assistant initialisé:', data.aiUser)
          return data.aiUser
        } else {
          throw new Error(data.error || 'Erreur création assistant AI')
        }
      } else {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
    } catch (error: any) {
      console.error('❌ Erreur initialisation AI Assistant:', error)
      toast.error(`Erreur assistant AI: ${error.message}`)
      return null
    } finally {
      setIsInitializing(false)
    }
  }, [isInitialized, isInitializing])

  const sendAIMessage = useCallback(async (message: string, context: any) => {
    try {
      console.log('🤖 Envoi message AI:', { 
        messageLength: message.length,
        context: context?.conversationId 
      })

      const response = await fetch('/api/ai/chat-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          context: context,
          conversationType: context?.isAIConversation ? 'general' : 'project_help',
          timestamp: new Date().toISOString()
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API AI error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur inconnue API AI')
      }

      console.log('✅ Réponse AI reçue')
      return data.response

    } catch (error: any) {
      console.error('❌ Erreur envoi message AI:', error)
      toast.error(`Erreur AI: ${error.message}`)
      throw error
    }
  }, [])

  return {
    aiUser,
    isInitialized,
    isInitializing,
    initialize,
    sendAIMessage
  }
}