// components/MessageInput.tsx - VERSION COMPLÈTE REFAITE
"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send, Paperclip, Smile, RefreshCw, Bot } from "lucide-react"
import { toast } from "sonner"

interface ConversationParticipant {
  _id: string
  name: string
  email: string
  avatar?: string
  isOnline?: boolean
  role: "ai_assistant" | "freelancer" | "freelance"
}

interface ConversationContext {
  conversationId: string
  participants: ConversationParticipant[]
  isAIConversation: boolean
  userId: any
  userName: string | null | undefined
  userEmail: string | null | undefined
}

interface MessageInputProps {
  onSendMessage: (content: string, conversationId: string) => Promise<any>
  onSendAIMessage?: (content: string, conversationId: string) => Promise<any>
  selectedConversation: string | null
  disabled?: boolean
  onTypingStart?: () => void
  onTypingStop?: () => void
  isConnected?: boolean
  sendTypingIndicator?: (conversationId: string, isTyping: boolean) => void
  conversationContext?: ConversationContext | null
}

export const MessageInput = ({ 
  onSendMessage, 
  onSendAIMessage,
  selectedConversation, 
  disabled = false,
  onTypingStart,
  onTypingStop,
  isConnected = true,
  sendTypingIndicator,
  conversationContext = null
}: MessageInputProps) => {
  const [messageInput, setMessageInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasTypingStartedRef = useRef(false)
  const lastTypingSentRef = useRef<number>(0)

  // 🔥 DÉTECTION AI - Méthode 1: Vérifier le contexte
  const isAIFromContext = conversationContext?.isAIConversation === true
  
  // 🔥 DÉTECTION AI - Méthode 2: Vérifier les participants
  const isAIFromParticipants = conversationContext?.participants?.some(
    p => p.role === 'ai_assistant'
  ) || false
  
  // 🔥 DÉTECTION AI - Combinaison des deux méthodes
  const isAIConversation = isAIFromContext || isAIFromParticipants
  
  // 🔥 VÉRIFIER si on peut utiliser l'API AI
  const canUseAIAPI = isAIConversation && typeof onSendAIMessage === 'function'

  // 🔥 DEBUG LOGS - À chaque changement de contexte
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 MessageInput - ANALYSE COMPLÈTE:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📦 Context reçu:', conversationContext)
    console.log('🎯 Conversation ID:', selectedConversation)
    console.log('👥 Participants:', conversationContext?.participants?.map(p => ({
      name: p.name,
      role: p.role,
      id: p._id
    })))
    console.log('🤖 isAIFromContext:', isAIFromContext)
    console.log('🤖 isAIFromParticipants:', isAIFromParticipants)
    console.log('✅ isAIConversation (final):', isAIConversation)
    console.log('🔧 onSendAIMessage existe:', !!onSendAIMessage)
    console.log('🚀 canUseAIAPI:', canUseAIAPI)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  }, [conversationContext, selectedConversation, isAIConversation, canUseAIAPI, onSendAIMessage, isAIFromContext, isAIFromParticipants])

  // Typing handlers - seulement pour conversations normales
  const handleTypingStart = useCallback(() => {
    if (!selectedConversation || hasTypingStartedRef.current || !isConnected || isAIConversation) return
    
    const now = Date.now()
    if (now - lastTypingSentRef.current < 2000) return
    
    hasTypingStartedRef.current = true
    lastTypingSentRef.current = now
    
    if (sendTypingIndicator) {
      sendTypingIndicator(selectedConversation, true)
    }
    
    onTypingStart?.()
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }, [selectedConversation, onTypingStart, isConnected, sendTypingIndicator, isAIConversation])

  const handleTypingStop = useCallback(() => {
    if (!hasTypingStartedRef.current || isAIConversation) return
    
    hasTypingStartedRef.current = false
    
    if (sendTypingIndicator && selectedConversation) {
      sendTypingIndicator(selectedConversation, false)
    }
    
    onTypingStop?.()
  }, [selectedConversation, onTypingStop, sendTypingIndicator, isAIConversation])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMessageInput(value)
    
    // Typing indicators seulement pour conversations normales
    if (!isAIConversation && value.trim().length > 0 && isConnected) {
      handleTypingStart()
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingStop()
      }, 1500)
    } else if (!value.trim()) {
      handleTypingStop()
    }
  }, [handleTypingStart, handleTypingStop, isConnected, isAIConversation])

  // 🔥 FONCTION D'ENVOI PRINCIPALE
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedMessage = messageInput.trim()
    
    // Validations
    if (!trimmedMessage) {
      console.log('⚠️ Message vide')
      return
    }
    
    if (!selectedConversation) {
      console.log('⚠️ Pas de conversation sélectionnée')
      toast.error('Aucune conversation sélectionnée')
      return
    }
    
    if (isSending) {
      console.log('⚠️ Envoi déjà en cours')
      return
    }

    if (disabled) {
      console.log('⚠️ Input désactivé')
      return
    }

    // Arrêter typing pour conversations normales
    if (!isAIConversation) {
      handleTypingStop()
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📤 ENVOI DE MESSAGE:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💬 Message:', trimmedMessage.substring(0, 100))
    console.log('🎯 Conversation:', selectedConversation)
    console.log('🤖 Est conversation AI:', isAIConversation)
    console.log('🔧 Peut utiliser API AI:', canUseAIAPI)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    setIsSending(true)
    
    try {
      // 🔥 LOGIQUE DE ROUTAGE
      if (canUseAIAPI) {
        console.log('🤖 ➡️  ENVOI VIA API AI')
        await onSendAIMessage!(trimmedMessage, selectedConversation)
        console.log('✅ Message AI envoyé avec succès')
      } else if (isAIConversation && !onSendAIMessage) {
        console.error('❌ Conversation AI mais pas de handler onSendAIMessage!')
        toast.error('Handler AI manquant - contactez le support')
        setIsSending(false)
        return
      } else {
        console.log('💬 ➡️  ENVOI VIA WEBSOCKET')
        await onSendMessage(trimmedMessage, selectedConversation)
        console.log('✅ Message WebSocket envoyé avec succès')
      }
      
      // Succès - vider l'input
      setMessageInput("")
      
      // Refocus
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      
    } catch (error: any) {
      console.error('❌ ERREUR ENVOI:', error)
      
      // Messages d'erreur appropriés
      if (error.message?.includes("network") || error.message?.includes("fetch")) {
        toast.error("Erreur réseau - Vérifiez votre connexion")
      } else if (error.message?.includes("timeout")) {
        toast.error("Temps d'attente dépassé")
      } else if (canUseAIAPI) {
        if (error.message?.includes("quota")) {
          toast.error("Service AI temporairement indisponible")
        } else if (error.message?.includes("401")) {
          toast.error("Erreur d'authentification AI")
        } else {
          toast.error("Erreur AI - Réessayez")
        }
      } else {
        toast.error("Erreur d'envoi - Réessayez")
      }
      
      // Restaurer le message
      setMessageInput(trimmedMessage)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
    
    if (e.key === 'Escape' && messageInput) {
      e.preventDefault()
      setMessageInput("")
      handleTypingStop()
    }
  }

  const handlePaste = () => {
    if (!isAIConversation) {
      handleTypingStart()
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (!isAIConversation) {
        handleTypingStop()
      }
    }
  }, [handleTypingStop, isAIConversation])

  // Auto-focus
  useEffect(() => {
    if (selectedConversation && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    }
  }, [selectedConversation])

  // Connection status
  useEffect(() => {
    if (!isConnected && !isAIConversation) {
      handleTypingStop()
    }
  }, [isConnected, handleTypingStop, isAIConversation])

  const getPlaceholderText = () => {
    if (!selectedConversation) return "Sélectionnez une conversation..."
    if (disabled) return "Envoi désactivé..."
    if (!isConnected && !isAIConversation) return "Connexion perdue..."
    
    if (isAIConversation) {
      return "💭 Posez une question à l'assistant AI..."
    }
    
    return "Tapez votre message..."
  }

  // Désactivation: AI peut envoyer sans WebSocket
  const isSendDisabled = isSending || 
                        !messageInput.trim() || 
                        disabled || 
                        !selectedConversation || 
                        (!isAIConversation && !isConnected)

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 p-6">
      <form onSubmit={handleSendMessage} className="flex items-center gap-3">
        {/* Boutons */}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled || isAIConversation}
            className="h-11 w-11 rounded-full text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-30"
            onClick={() => isAIConversation ? toast.info("Pièces jointes non disponibles avec l'AI") : toast.info("Fonctionnalité à venir")}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled || isAIConversation}
            className="h-11 w-11 rounded-full text-gray-500 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors disabled:opacity-30"
            onClick={() => isAIConversation ? toast.info("Émojis non disponibles avec l'AI") : toast.info("Fonctionnalité à venir")}
          >
            <Smile className="h-5 w-5" />
          </Button>
        </div>

        {/* Input */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            placeholder={getPlaceholderText()}
            value={messageInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={isSending || disabled}
            className={`w-full h-11 rounded-2xl bg-white dark:bg-gray-800 border px-4 text-sm focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors ${
              isAIConversation 
                ? 'border-green-300 dark:border-green-700 focus:border-green-500 focus:ring-green-500/20' 
                : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
            } pr-20`}
            maxLength={5000}
          />
          
          {/* Badge AI */}
          {isAIConversation && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-700">
              <Bot className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              <span className="text-xs text-green-700 dark:text-green-300 font-bold">AI</span>
            </div>
          )}
          
          {/* Compteur */}
          {messageInput.length > 1000 && !isAIConversation && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className={`text-xs font-medium ${
                messageInput.length > 4000 ? 'text-red-500' : 
                messageInput.length > 3000 ? 'text-orange-500' : 'text-gray-400'
              }`}>
                {messageInput.length}/5000
              </span>
            </div>
          )}
        </div>

        {/* Bouton envoi */}
        <Button 
          type="submit" 
          size="icon"
          disabled={isSendDisabled}
          className={`h-11 w-11 rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:hover:shadow-lg ${
            isAIConversation 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500' 
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500'
          }`}
          title={
            !selectedConversation ? "Sélectionnez une conversation" : 
            isAIConversation ? "Envoyer à l'assistant AI" : 
            "Envoyer le message"
          }
        >
          {isSending ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : isAIConversation ? (
            <Bot className="h-5 w-5" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>

      {/* Aide */}
      <div className="text-xs text-center mt-3">
        {isAIConversation ? (
          <p className="text-green-600 dark:text-green-400 font-semibold flex items-center justify-center gap-2">
            <Bot className="h-3.5 w-3.5" />
            Conversation avec l'assistant AI • 
            <kbd className="px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900/40 rounded border border-green-300 dark:border-green-700">Entrée</kbd> 
            pour envoyer
          </p>
        ) : !isConnected ? (
          <p className="text-red-500 dark:text-red-400 font-semibold">⚠️ Déconnecté - Reconnexion en cours...</p>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Entrée</kbd> pour envoyer • 
            <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 ml-1">Échap</kbd> pour effacer
          </p>
        )}
      </div>
    </div>
  )
}