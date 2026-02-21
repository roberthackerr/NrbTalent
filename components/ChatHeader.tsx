import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { RefreshCw, Video, Phone, MoreVertical, Wifi, WifiOff, Settings, Radio } from "lucide-react"
import { Conversation } from "@/types/chat"
import { useState, useEffect } from "react"

interface ChatHeaderProps {
  conversation: Conversation
  otherParticipant: any
  onRefresh: () => void
  isConnected: boolean
  onOpenSettings: () => void // 🔥 NOUVEAU : Callback pour ouvrir les paramètres
  onStartVideoCall?: () => void
  onStartVoiceCall?: () => void
  onEndCall?: () => void
  callStatus?: "idle" | "connecting" | "connected"
  callRemoteCount?: number
}

export const ChatHeader=({ 
  conversation, 
  otherParticipant, 
  onRefresh, 
  isConnected,
  onOpenSettings, // 🔥 NOUVEAU
  onStartVideoCall,
  onStartVoiceCall,
  onEndCall,
  callStatus = "idle",
  callRemoteCount = 0
}: ChatHeaderProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [showMenu, setShowMenu] = useState(false) // 🔥 NOUVEAU : État du menu

  const handleRefresh = async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      await onRefresh()
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // 🔥 Rechargement automatique quand la connexion revient
  useEffect(() => {
    if (isConnected && !isRefreshing) {
      console.log('🔄 Connexion rétablie - rechargement automatique')
      const timer = setTimeout(() => {
        handleRefresh()
      }, 1500)
      
      return () => clearTimeout(timer)
    }
  }, [isConnected])

  // 🔥 Formatage du temps depuis le dernier rafraîchissement
  const getLastRefreshText = () => {
    if (!lastRefresh) return "Jamais actualisé"
    
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000)
    
    if (diffInSeconds < 60) return `Actualisé à l'instant`
    if (diffInSeconds < 3600) return `Actualisé il y a ${Math.floor(diffInSeconds / 60)} min`
    if (diffInSeconds < 86400) return `Actualisé il y a ${Math.floor(diffInSeconds / 3600)} h`
    
    return `Actualisé le ${lastRefresh.toLocaleDateString()}`
  }

  // 🔥 Gestion du menu déroulant
  const handleMenuToggle = () => {
    setShowMenu(prev => !prev)
  }

  const handleSettingsClick = () => {
    onOpenSettings() // 🔥 Ouvrir les paramètres
    setShowMenu(false) // Fermer le menu
  }

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMenu(false)
    }

    if (showMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMenu])

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* User Avatar with Online Status */}
          <div className="relative">
            <Avatar className="h-14 w-14 border-2 border-white dark:border-gray-800 shadow-lg">
              <AvatarImage src={otherParticipant?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                {otherParticipant?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            
            {/* 🔥 Double indicateur de statut : connexion WebSocket + statut utilisateur */}
            <div className="absolute -bottom-1 -right-1 flex gap-1">
              {/* Statut de connexion WebSocket */}
              <div 
                className={`h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 shadow-sm ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
                title={isConnected ? "Connecté au serveur" : "Déconnecté du serveur"}
              />
              
              {/* Statut en ligne/hors ligne de l'utilisateur */}
              {otherParticipant?.isOnline && (
                <div 
                  className="h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 bg-blue-500 shadow-sm"
                  title="Utilisateur en ligne"
                />
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {otherParticipant?.name || "Utilisateur"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {/* 🔥 Indicateur de connexion WebSocket amélioré */}
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs ${
                  isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {isConnected ? 'Connecté' : 'Hors ligne'}
                </span>
              </div>

              <span className="text-gray-400">•</span>

              {/* Statut utilisateur */}
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  otherParticipant?.isOnline ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
                }`} />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {otherParticipant?.isOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>

              {otherParticipant?.title && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {otherParticipant.title}
                  </span>
                </>
              )}
            </div>
            
            {/* 🔥 Information de dernier rafraîchissement */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getLastRefreshText()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {callStatus !== "idle" && (
            <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
              callStatus === "connected" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"
            }`}>
              <Radio className={`h-3.5 w-3.5 ${callStatus === "connected" ? "text-green-600" : "text-yellow-600"}`} />
              <span>{callStatus === "connected" ? "En appel" : "Connexion…"}</span>
              {callRemoteCount > 0 && <span className="text-slate-500">• {callRemoteCount} distant(s)</span>}
            </div>
          )}
          {/* 🔥 Bouton de rafraîchissement amélioré */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isRefreshing || !isConnected}
            title={isConnected ? "Actualiser les messages" : "Connexion requise"}
            className={`h-10 w-10 rounded-full transition-all duration-200 ${
              isRefreshing 
                ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          {/* 🔥 Boutons d'appel avec meilleur feedback */}
          <Button 
            variant="ghost" 
            size="icon"
            type="button"
            onMouseDown={(e) => {
              e.stopPropagation()
              console.log("header video mousedown")
              onStartVideoCall?.()
            }}
            onClick={(e) => {
              e.stopPropagation()
              console.log("header video click")
              onStartVideoCall?.()
            }}
            title={
              isConnected ? "Appel vidéo" : "Ouvrir l'appel (connexion recommandée)"
            }
            className="h-10 w-10 rounded-full text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-30"
          >
            <Video className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            type="button"
            onMouseDown={(e) => {
              e.stopPropagation()
              console.log("header voice mousedown")
              onStartVoiceCall?.()
            }}
            onClick={(e) => {
              e.stopPropagation()
              console.log("header voice click")
              onStartVoiceCall?.()
            }}
            title={isConnected ? "Appel vocal" : "Ouvrir l'appel (connexion recommandée)"}
            className="h-10 w-10 rounded-full text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-30"
          >
            <Phone className="h-5 w-5" />
          </Button>
          
          {callStatus === "connected" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEndCall?.()}
              className="rounded-full bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2 text-xs font-semibold"
            >
              Raccrocher
            </Button>
          )}
          
          {/* 🔥 Menu options avec dropdown */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleMenuToggle()
              }}
              className="h-10 w-10 rounded-full text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Plus d'options"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>

            {/* 🔥 Menu déroulant */}
            {showMenu && (
              <div className="absolute right-0 top-12 z-50 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1">
                <button
                  onClick={handleSettingsClick}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Paramètres des messages
                </button>
                
                {/* 🔥 Autres options du menu */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                
                <button
                  onClick={() => {
                    // Ajouter d'autres fonctionnalités ici
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                >
                  <span className="w-4 h-4 flex items-center justify-center">👤</span>
                  Voir le profil
                </button>
                
                <button
                  onClick={() => {
                    // Ajouter d'autres fonctionnalités ici
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                >
                  <span className="w-4 h-4 flex items-center justify-center">🔕</span>
                  Désactiver les notifications
                </button>
                
                <button
                  onClick={() => {
                    // Ajouter d'autres fonctionnalités ici
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                >
                  <span className="w-4 h-4 flex items-center justify-center">🚫</span>
                  Bloquer l'utilisateur
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🔥 Barre de progression pendant le rafraîchissement */}
      {isRefreshing && (
        <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div className="bg-blue-500 h-1 rounded-full animate-pulse"></div>
        </div>
      )}
      
      {/* 🔥 Notification de reconnexion */}
      {isConnected && lastRefresh && (
        <div className="mt-2 flex items-center justify-center">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-1">
            <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              Connexion rétablie - Messages synchronisés
            </p>
          </div>
        </div>
      )}
    </div>
  )
}