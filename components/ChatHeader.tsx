// components/ChatHeader.tsx - AVEC NAVIGATION VERS LE PROFIL
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { RefreshCw, Video, Phone, MoreVertical, Wifi, WifiOff, Settings, X, ArrowLeft, User } from "lucide-react"
import { Conversation } from "@/types/chat"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface ChatHeaderProps {
  conversation: Conversation
  otherParticipant: any
  onRefresh: () => void
  isConnected: boolean
  onOpenSettings: () => void
  onStartVideoCall?: () => void
  onStartVoiceCall?: () => void
  onEndCall?: () => void
  callStatus?: "idle" | "connecting" | "connected"
  callRemoteCount?: number
  onBack?: () => void
  showBackButton?: boolean
}

export const ChatHeader = ({
  conversation,
  otherParticipant,
  onRefresh,
  isConnected,
  onOpenSettings,
  onStartVideoCall,
  onStartVoiceCall,
  onEndCall,
  callStatus = "idle",
  callRemoteCount = 0,
  onBack,
  showBackButton = false
}: ChatHeaderProps) => {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  // 🔥 Navigation vers le profil de l'utilisateur
  const handleProfileClick = () => {
    if (otherParticipant?._id && otherParticipant?.role !== "ai_assistant") {
      router.push(`/profile/${otherParticipant._id}`)
    } else if (otherParticipant?.role === "ai_assistant") {
      // Optionnel: ouvrir une modal d'info sur l'AI ou rediriger vers une page dédiée
      // Pour l'instant, on ne fait rien ou on peut afficher un toast
      console.log("L'assistant AI n'a pas de profil utilisateur")
    }
  }

  // Rechargement auto quand la connexion revient
  useEffect(() => {
    if (isConnected && !isRefreshing) {
      const timer = setTimeout(() => handleRefresh(), 1500)
      return () => clearTimeout(timer)
    }
  }, [isConnected])

  // Fermer le menu au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const getLastRefreshText = () => {
    if (!lastRefresh) return null
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000)
    if (diffInSeconds < 60) return "À l'instant"
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`
    return lastRefresh.toLocaleDateString()
  }

  const isCallActive = callStatus !== "idle"

  return (
    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Left section - Back button + Avatar + Info */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Mobile back button */}
            {showBackButton && onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="md:hidden h-8 w-8 sm:h-9 sm:w-9 rounded-full flex-shrink-0"
                aria-label="Retour"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}

            {/* Avatar - cliquable pour les utilisateurs normaux */}
            <div 
              className={cn(
                "relative flex-shrink-0",
                otherParticipant?.role !== "ai_assistant" && "cursor-pointer hover:opacity-80 transition-opacity"
              )}
              onClick={handleProfileClick}
            >
              <Avatar className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 border-2 border-white dark:border-gray-800 shadow-sm">
                <AvatarImage src={otherParticipant?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm sm:text-base font-semibold">
                  {otherParticipant?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              
              {/* Status indicators */}
              <div className="absolute -bottom-0.5 -right-0.5 flex gap-0.5">
                <div 
                  className={cn(
                    "h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-2 border-white dark:border-gray-800",
                    isConnected ? "bg-green-500" : "bg-red-500"
                  )}
                  title={isConnected ? "Connecté" : "Déconnecté"}
                />
                {otherParticipant?.isOnline && otherParticipant?.role !== "ai_assistant" && (
                  <div 
                    className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-2 border-white dark:border-gray-800 bg-blue-500"
                    title="En ligne"
                  />
                )}
              </div>
            </div>

            {/* User Info - nom cliquable */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={handleProfileClick}
                  className={cn(
                    "text-left transition-colors",
                    otherParticipant?.role !== "ai_assistant" 
                      ? "hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" 
                      : "cursor-default"
                  )}
                  disabled={otherParticipant?.role === "ai_assistant"}
                >
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {otherParticipant?.name || "Utilisateur"}
                  </h2>
                </button>
                
                {otherParticipant?.role === "ai_assistant" && (
                  <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                    AI
                  </span>
                )}
                
                {/* Icône de profil pour indiquer la clicabilité (optionnel) */}
                {otherParticipant?.role !== "ai_assistant" && otherParticipant?._id && (
                  <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400 dark:text-gray-500 hidden sm:block" />
                )}
              </div>
              
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <div className="flex items-center gap-1">
                  {isConnected ? (
                    <Wifi className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-500" />
                  )}
                  <span className={cn(
                    "text-[10px] sm:text-xs",
                    isConnected ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {isConnected ? "Connecté" : "Hors ligne"}
                  </span>
                </div>

                {otherParticipant?.isOnline && otherParticipant?.role !== "ai_assistant" && (
                  <>
                    <span className="text-gray-400 text-xs">•</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                        En ligne
                      </span>
                    </div>
                  </>
                )}

                {getLastRefreshText() && (
                  <>
                    <span className="text-gray-400 text-xs hidden sm:inline">•</span>
                    <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
                      {getLastRefreshText()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right section - Actions (inchangé) */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Call status badge */}
            {isCallActive && (
              <div className={cn(
                "hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium",
                callStatus === "connected" 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              )}>
                <div className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  callStatus === "connected" ? "bg-green-500 animate-pulse" : "bg-yellow-500"
                )} />
                <span>{callStatus === "connected" ? "En appel" : "Connexion"}</span>
                {callRemoteCount > 0 && <span>({callRemoteCount})</span>}
              </div>
            )}

            {/* Refresh button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing || !isConnected}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full disabled:opacity-40"
              title="Actualiser"
            >
              <RefreshCw className={cn("h-4 w-4 sm:h-4.5 sm:w-4.5", isRefreshing && "animate-spin")} />
            </Button>

            {/* Video call button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onStartVideoCall}
              disabled={!isConnected}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full disabled:opacity-40"
              title="Appel vidéo"
            >
              <Video className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </Button>

            {/* Voice call button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onStartVoiceCall}
              disabled={!isConnected}
              className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9 rounded-full disabled:opacity-40"
              title="Appel vocal"
            >
              <Phone className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </Button>

            {/* End call button */}
            {isCallActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEndCall}
                className="h-7 sm:h-8 px-2 sm:px-3 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-[11px] sm:text-xs font-medium"
              >
                <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                <span className="hidden sm:inline">Raccrocher</span>
              </Button>
            )}

            {/* Menu button */}
            <div ref={menuRef} className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(!showMenu)}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full"
                title="Options"
              >
                <MoreVertical className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </Button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 sm:w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50">
                  <button
                    onClick={() => {
                      onOpenSettings()
                      setShowMenu(false)
                    }}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 sm:gap-3 transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Paramètres
                  </button>
                  
                  {/* Voir le profil dans le menu */}
                  {otherParticipant?.role !== "ai_assistant" && otherParticipant?._id && (
                    <>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      <button
                        onClick={() => {
                          router.push(`/profile/${otherParticipant._id}`)
                          setShowMenu(false)
                        }}
                        className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 sm:gap-3 transition-colors"
                      >
                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Voir le profil
                      </button>
                    </>
                  )}
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  
                  <button
                    onClick={() => setShowMenu(false)}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 sm:gap-3 transition-colors"
                  >
                    <span className="text-base">🚫</span>
                    Bloquer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Refresh progress bar */}
        {isRefreshing && (
          <div className="mt-2 w-full">
            <div className="h-0.5 bg-blue-500 rounded-full animate-pulse w-1/3" />
          </div>
        )}
      </div>
    </div>
  )
}