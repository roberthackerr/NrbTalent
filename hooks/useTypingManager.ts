// hooks/useTypingManager.ts
import { useState, useCallback, useRef } from "react"

export const useTypingManager = () => {
  const [typingUsers, setTypingUsers] = useState<Map<string, { userId: string, userName: string, timeout: NodeJS.Timeout }>>(new Map())
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Démarrer l'indication de typing
  const startTyping = useCallback((conversationId: string, userId: string, userName: string) => {
    setTypingUsers(prev => {
      const newMap = new Map(prev)
      
      // Nettoyer l'ancien timeout si il existe
      const existingTimeout = typingTimeoutsRef.current.get(conversationId)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      // Ajouter l'utilisateur qui tape
      newMap.set(conversationId, { userId, userName, timeout: setTimeout(() => {
        stopTyping(conversationId)
      }, 3000) }) // 3 secondes sans activité

      return newMap
    })
  }, [])

  // Arrêter l'indication de typing
  const stopTyping = useCallback((conversationId: string) => {
    setTypingUsers(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(conversationId)
      
      if (existing) {
        clearTimeout(existing.timeout)
        newMap.delete(conversationId)
      }

      // Nettoyer le timeout
      const timeout = typingTimeoutsRef.current.get(conversationId)
      if (timeout) {
        clearTimeout(timeout)
        typingTimeoutsRef.current.delete(conversationId)
      }

      return newMap
    })
  }, [])

  // Obtenir le texte de typing pour une conversation
  const getTypingText = useCallback((conversationId: string): string | null => {
    const typing = typingUsers.get(conversationId)
    if (!typing) return null
    
    return `${typing.userName} est en train d'écrire...`
  }, [typingUsers])

  // Nettoyer tous les timeouts
  const cleanup = useCallback(() => {
    typingTimeoutsRef.current.forEach(timeout => {
      clearTimeout(timeout)
    })
    typingTimeoutsRef.current.clear()
    setTypingUsers(new Map())
  }, [])

  return {
    typingUsers,
    startTyping,
    stopTyping,
    getTypingText,
    cleanup
  }
}