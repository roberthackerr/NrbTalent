// components/MessageInput.tsx - VERSION RESPONSIVE OPTIMISÉE
"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send, Paperclip, Smile, RefreshCw, Bot, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
  const [showMobileActions, setShowMobileActions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const mobileActionsRef = useRef<HTMLDivElement>(null)
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasTypingStartedRef = useRef(false)
  const lastTypingSentRef = useRef<number>(0)

  // Détection AI
  const isAIFromContext = conversationContext?.isAIConversation === true
  const isAIFromParticipants = conversationContext?.participants?.some(
    p => p.role === 'ai_assistant'
  ) || false
  const isAIConversation = isAIFromContext || isAIFromParticipants
  const canUseAIAPI = isAIConversation && typeof onSendAIMessage === 'function'

  // Typing handlers
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedMessage = messageInput.trim()
    
    if (!trimmedMessage) return
    if (!selectedConversation) {
      toast.error('Aucune conversation sélectionnée')
      return
    }
    if (isSending) return
    if (disabled) return

    if (!isAIConversation) {
      handleTypingStop()
    }

    setIsSending(true)
    
    try {
      if (canUseAIAPI) {
        await onSendAIMessage!(trimmedMessage, selectedConversation)
      } else if (isAIConversation && !onSendAIMessage) {
        toast.error('Handler AI manquant')
        setIsSending(false)
        return
      } else {
        await onSendMessage(trimmedMessage, selectedConversation)
      }
      
      setMessageInput("")
      setShowMobileActions(false)
      
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      
    } catch (error: any) {
      console.error('❌ Erreur envoi:', error)
      
      if (error.message?.includes("network") || error.message?.includes("fetch")) {
        toast.error("Erreur réseau - Vérifiez votre connexion")
      } else if (canUseAIAPI) {
        toast.error("Erreur AI - Réessayez")
      } else {
        toast.error("Erreur d'envoi - Réessayez")
      }
      
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

  const clearInput = () => {
    setMessageInput("")
    handleTypingStop()
    inputRef.current?.focus()
  }

  // Fermer le menu mobile au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileActionsRef.current && !mobileActionsRef.current.contains(event.target as Node)) {
        setShowMobileActions(false)
      }
    }
    
    if (showMobileActions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMobileActions])

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

  const getPlaceholderText = () => {
    if (!selectedConversation) return "Sélectionnez une conversation..."
    if (disabled) return "Envoi désactivé..."
    if (!isConnected && !isAIConversation) return "Connexion perdue..."
    if (isAIConversation) return "Posez une question à l'assistant AI..."
    return "Tapez votre message..."
  }

  const isSendDisabled = isSending || 
                        !messageInput.trim() || 
                        disabled || 
                        !selectedConversation || 
                        (!isAIConversation && !isConnected)

  const messageLength = messageInput.length
  const showCharCounter = messageLength > 0 && !isAIConversation
  const isNearLimit = messageLength > 4000

  return (
    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 sticky bottom-0 z-10">
      <div className="px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4">
        <form onSubmit={handleSendMessage} className="flex items-end sm:items-center gap-1 sm:gap-2">
          
          {/* Actions buttons - Desktop toujours visible, Mobile dans un menu */}
          <div className="hidden sm:flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled || isAIConversation}
              className="h-9 w-9 md:h-10 md:w-10 rounded-full text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-30"
              onClick={() => toast.info("Pièces jointes à venir")}
            >
              <Paperclip className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled || isAIConversation}
              className="h-9 w-9 md:h-10 md:w-10 rounded-full text-gray-500 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors disabled:opacity-30"
              onClick={() => toast.info("Émojis à venir")}
            >
              <Smile className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>

          {/* Mobile actions button */}
          <div className="sm:hidden relative" ref={mobileActionsRef}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileActions(!showMobileActions)}
              className="h-9 w-9 rounded-full text-gray-500"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            {showMobileActions && (
              <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 z-20">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-sm"
                  onClick={() => {
                    toast.info("Pièces jointes à venir")
                    setShowMobileActions(false)
                  }}
                >
                  <Paperclip className="h-4 w-4" />
                  Pièce jointe
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-sm"
                  onClick={() => {
                    toast.info("Émojis à venir")
                    setShowMobileActions(false)
                  }}
                >
                  <Smile className="h-4 w-4" />
                  Émoji
                </Button>
              </div>
            )}
          </div>

          {/* Input container */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              placeholder={getPlaceholderText()}
              value={messageInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isSending || disabled}
              className={cn(
                "w-full rounded-2xl bg-white dark:bg-gray-800 border text-sm sm:text-base focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors",
                "px-3 py-2 sm:px-4 sm:py-2.5",
                isAIConversation 
                  ? 'border-green-300 dark:border-green-700 focus:border-green-500 focus:ring-green-500/20' 
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20',
                messageInput && !isAIConversation ? 'pr-14 sm:pr-20' : 'pr-10 sm:pr-12'
              )}
              maxLength={5000}
            />
            
            {/* Clear button (mobile) */}
            {messageInput && (
              <button
                type="button"
                onClick={clearInput}
                className="absolute right-12 sm:right-14 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors md:hidden"
              >
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            )}
            
            {/* AI Badge */}
            {isAIConversation && (
              <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-green-200 dark:border-green-700">
                <Bot className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 dark:text-green-400" />
                <span className="text-[10px] sm:text-xs text-green-700 dark:text-green-300 font-bold">AI</span>
              </div>
            )}
            
            {/* Character counter */}
            {showCharCounter && (
              <div className={cn(
                "absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-[10px] sm:text-xs font-medium",
                isNearLimit ? 'text-red-500' : 'text-gray-400'
              )}>
                {messageLength > 999 ? `${Math.floor(messageLength/1000)}k` : messageLength}
              </div>
            )}
          </div>

          {/* Send button */}
          <Button 
            type="submit" 
            size="icon"
            disabled={isSendDisabled}
            className={cn(
              "rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
              "h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11",
              isAIConversation 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500'
            )}
            title={!selectedConversation ? "Sélectionnez une conversation" : isAIConversation ? "Envoyer à l'assistant AI" : "Envoyer"}
          >
            {isSending ? (
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
            ) : isAIConversation ? (
              <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
        </form>

        {/* Help text - responsive */}
        <div className="text-[10px] sm:text-xs text-center mt-2 sm:mt-3">
          {isAIConversation ? (
            <p className="text-green-600 dark:text-green-400 flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
              <Bot className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Conversation avec l'assistant AI</span>
              <kbd className="px-1 py-0.5 text-[9px] sm:text-xs bg-green-100 dark:bg-green-900/40 rounded border border-green-300 dark:border-green-700">Entrée</kbd>
            </p>
          ) : !isConnected ? (
            <p className="text-red-500 dark:text-red-400 font-semibold">⚠️ Déconnecté - Reconnexion en cours...</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
              <span><kbd className="px-1 py-0.5 text-[9px] sm:text-xs bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Entrée</kbd> pour envoyer</span>
              <span className="hidden xs:inline">•</span>
              <span><kbd className="px-1 py-0.5 text-[9px] sm:text-xs bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Échap</kbd> pour effacer</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}