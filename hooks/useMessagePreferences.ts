// hooks/useMessagePreferences.ts
import { useState, useEffect, useCallback } from "react"
import { MessagePreferences } from "@/types/chat"

const defaultPreferences: MessagePreferences = {
  // Notifications
  soundEnabled: true,
  desktopNotifications: true,
  vibration: true,
  
  // Comportement
  enterToSend: true,
  markAsReadOnOpen: true,
  showTypingIndicators: true,
  showReadReceipts: true,
  showOnlineStatus: true,
  
  // Apparence
  theme: 'auto',
  fontSize: 'medium',
  bubbleStyle: 'default',
  
  // Confidentialité
  lastSeen: 'everyone',
  profilePhoto: 'everyone',
  readReceipts: 'everyone',
  
  // Stockage
  autoDownloadMedia: true,
  saveToCameraRoll: false,
  backupMessages: true,
  
  // Performance
  lowDataMode: false,
  autoPlayGifs: true,
  previewLinks: true
}

export const useMessagePreferences = () => {
  const [preferences, setPreferences] = useState<MessagePreferences>(defaultPreferences)
  const [isLoading, setIsLoading] = useState(true)

  // Charger les préférences depuis le localStorage
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const saved = localStorage.getItem('message-preferences')
        if (saved) {
          const parsed = JSON.parse(saved)
          setPreferences({ ...defaultPreferences, ...parsed })
        }
      } catch (error) {
        console.error('❌ Erreur chargement préférences:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [])

  // Sauvegarder les préférences
  const savePreferences = useCallback((newPreferences: Partial<MessagePreferences>) => {
    try {
      const updated = { ...preferences, ...newPreferences }
      setPreferences(updated)
      localStorage.setItem('message-preferences', JSON.stringify(updated))
      console.log('💾 Préférences sauvegardées:', updated)
    } catch (error) {
      console.error('❌ Erreur sauvegarde préférences:', error)
    }
  }, [preferences])

  // Réinitialiser aux valeurs par défaut
  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences)
    localStorage.setItem('message-preferences', JSON.stringify(defaultPreferences))
  }, [])

  return {
    preferences,
    savePreferences,
    resetPreferences,
    isLoading
  }
}