// components/ConversationsSidebar.tsx - VERSION ULTRA-ROBUSTE - ANOMALIES RÉSOLUES
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, Trash2, Users, Bot, Sparkles, MessageSquare } from "lucide-react"
import { Conversation } from "@/types/chat"

interface ConversationsSidebarProps {
  conversations: Conversation[]
  selectedConversation: string | null
  onSelectConversation: (id: string) => void
  isLoading: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onNewConversation: () => void
  onNewAIConversation: () => void
  onDeleteConversation: (conversation: Conversation, e: React.MouseEvent) => void
  isConnected: boolean
  session: any
}

export const ConversationsSidebar = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  isLoading,
  searchQuery,
  onSearchChange,
  onNewConversation,
  onNewAIConversation,
  onDeleteConversation,
  isConnected,
  session
}: ConversationsSidebarProps) => {
  const [isHovered, setIsHovered] = useState<string | null>(null)

  // 🔥 FIX: Formater le dernier message ULTRA-ROBUSTE (évite le undefined)
  const formatLastMessage = (
    message: string | undefined | null, 
    isAIConversation: boolean, 
    senderId?: string
  ): string => {
    const currentUserId = (session?.user as any)?.id
    
    // 🔥 FIX: Gestion exhaustive des cas vides/invalides
    if (!message || 
        typeof message !== 'string' || 
        message.trim() === '' || 
        message === 'undefined' || 
        message === 'null') {
      return isAIConversation ? "🤖 Assistant prêt" : "💬 Commencer"
    }
    
    try {
      // Nettoyer le message de manière sécurisée
      let cleanMessage = String(message) // Force conversion en string
        .replace(/<[^>]*>/g, '') // Retirer HTML
        .replace(/\n+/g, ' ') // Sauts de ligne → espaces
        .replace(/\s+/g, ' ') // Espaces multiples → simple
        .trim()
      
      // 🔥 Double vérification après nettoyage
      if (!cleanMessage || cleanMessage.length === 0) {
        return isAIConversation ? "🤖 Assistant prêt" : "💬 Commencer"
      }
      
      // Préfixe "Vous: " si c'est l'utilisateur courant qui a envoyé
      const prefix = (senderId && senderId === currentUserId) ? 'Vous: ' : ''
      
      // Tronquer intelligemment
      const maxLength = 45
      if (cleanMessage.length > maxLength) {
        cleanMessage = cleanMessage.substring(0, maxLength).trim() + '...'
      }
      
      return prefix + cleanMessage
    } catch (error) {
      console.warn('⚠️ Erreur formatage message:', error)
      return isAIConversation ? "🤖 Assistant prêt" : "💬 Commencer"
    }
  }

  // 🔥 FIX: Formater la date ULTRA-ROBUSTE
  const formatTime = (dateString: string | undefined | null): string => {
    if (!dateString) return "—"
    
    try {
      const date = new Date(dateString)
      
      // 🔥 Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return "—"
      }
      
      const now = new Date()
      const diffInMs = now.getTime() - date.getTime()
      
      // 🔥 Vérifier que la différence est positive (pas de date future absurde)
      if (diffInMs < 0) return "À l'instant"
      
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
      
      // Moins d'1 minute
      if (diffInMinutes < 1) return "À l'instant"
      
      // Moins d'1 heure
      if (diffInMinutes < 60) return `${diffInMinutes}min`
      
      // Aujourd'hui (moins de 24h)
      if (diffInHours < 24) {
        return date.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }
      
      // Cette semaine (moins de 7 jours)
      if (diffInDays < 7) {
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
        return days[date.getDay()]
      }
      
      // Plus ancien
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      })
    } catch (error) {
      console.warn('⚠️ Erreur formatage date:', error)
      return "—"
    }
  }

  // 🔥 FIX: Tri et filtrage ULTRA-SÉCURISÉ (évite les crashes)
  const sortedAndFilteredConversations = useMemo(() => {
    try {
      // 🔥 Validation des données d'entrée
      if (!Array.isArray(conversations)) {
        console.warn('⚠️ Conversations n\'est pas un tableau')
        return []
      }
      
      // 🔥 Filtrer les conversations invalides AVANT traitement
      let filtered = conversations.filter(conv => 
        conv && 
        typeof conv === 'object' && 
        conv._id &&
        Array.isArray(conv.participants)
      )
      
      // Filtre de recherche
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        filtered = filtered.filter(conv => {
          try {
            const otherUser = conv.participants?.find(p => p?._id !== (session?.user as any)?.id)
            const isAI = otherUser?.role === 'ai_assistant'
            const name = isAI ? 'assistant ai' : (otherUser?.name || '').toLowerCase()
            const lastMsg = (conv.lastMessage || '').toLowerCase()
            return name.includes(query) || lastMsg.includes(query)
          } catch (error) {
            console.warn('⚠️ Erreur filtrage conversation:', error)
            return false
          }
        })
      }
      
      // 🔥 Tri SÉCURISÉ par date décroissante
      return filtered.sort((a, b) => {
        try {
          const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime()
          const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime()
          
          // 🔥 Vérifier validité des dates
          if (isNaN(dateA) || isNaN(dateB)) {
            return 0 // Garder l'ordre actuel si dates invalides
          }
          
          return dateB - dateA
        } catch (error) {
          console.warn('⚠️ Erreur tri conversations:', error)
          return 0
        }
      })
    } catch (error) {
      console.error('❌ Erreur critique dans sortedAndFilteredConversations:', error)
      return []
    }
  }, [conversations, searchQuery, session])

  return (
    <div className="w-80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Messages
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onNewConversation}
            disabled={!isConnected}
            className="h-9 w-9 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-40"
            title="Nouvelle conversation"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Bouton AI Compact */}
        <Button
          onClick={onNewAIConversation}
          disabled={!isConnected}
          className="w-full h-9 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-medium shadow-sm disabled:opacity-40 transition-all"
        >
          <Bot className="h-3.5 w-3.5 mr-1.5" />
          Assistant AI
          <Sparkles className="h-3 w-3 ml-1.5 opacity-80" />
        </Button>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input 
            placeholder="Rechercher..." 
            className="pl-9 pr-3 h-9 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-colors"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={!isConnected}
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            // Skeleton Loaders Compact
            <div className="space-y-1">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg">
                  <div className="h-11 w-11 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedAndFilteredConversations.length === 0 ? (
            // Empty State
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                {searchQuery ? "Aucun résultat" : "Aucune conversation"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery ? "Essayez d'autres mots-clés" : "Commencez une nouvelle discussion"}
              </p>
              {!searchQuery && (
                <div className="space-y-2">
                  <Button
                    onClick={onNewConversation}
                    disabled={!isConnected}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Nouvelle conversation
                  </Button>
                  <Button
                    onClick={onNewAIConversation}
                    disabled={!isConnected}
                    size="sm"
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  >
                    <Bot className="h-3.5 w-3.5 mr-1.5" />
                    Assistant AI
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Conversations List - Design Pro avec validation
            <div className="space-y-0.5">
              {sortedAndFilteredConversations.map((conv) => {
                try {
                  // 🔥 FIX: Validation exhaustive des données de conversation
                  if (!conv || !conv._id || !Array.isArray(conv.participants)) {
                    console.warn('⚠️ Conversation invalide, skip:', conv)
                    return null
                  }
                  
                  const otherUser = conv.participants.find(p => p?._id !== (session?.user as any)?.id)
                  const isAIConversation = conv.isAIConversation || otherUser?.role === 'ai_assistant'
                  const isSelected = selectedConversation === conv._id
                  const hasUnread = (conv.unreadCount || 0) > 0
                  
                  return (
                    <div
                      key={conv._id}
                      className={`relative group p-2.5 rounded-lg transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? isAIConversation
                            ? "bg-green-50 dark:bg-green-900/20 shadow-sm"
                            : "bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                      onClick={() => onSelectConversation(conv._id)}
                      onMouseEnter={() => setIsHovered(conv._id)}
                      onMouseLeave={() => setIsHovered(null)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          {isAIConversation ? (
                            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
                              <Bot className="h-5 w-5 text-white" />
                            </div>
                          ) : (
                            <Avatar className="h-11 w-11 border-2 border-white dark:border-gray-900 shadow-sm">
                              <AvatarImage src={otherUser?.avatar} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                                {otherUser?.name?.charAt(0)?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          {/* Indicateur en ligne */}
                          {!isAIConversation && otherUser?.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 bg-green-500" />
                          )}
                          
                          {/* Indicateur AI actif */}
                          {isAIConversation && (
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 bg-green-500" />
                          )}
                        </div>

                        {/* Info conversation */}
                        <div className="flex-1 min-w-0">
                          {/* Première ligne: Nom + Heure */}
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <h3 className={`text-sm font-semibold truncate ${
                                isAIConversation 
                                  ? "text-green-700 dark:text-green-300" 
                                  : hasUnread
                                  ? "text-gray-900 dark:text-white"
                                  : "text-gray-700 dark:text-gray-300"
                              }`}>
                                {isAIConversation ? "Assistant AI" : otherUser?.name || "Utilisateur"}
                              </h3>
                              {isAIConversation && (
                                <Badge variant="outline" className="h-4 px-1 text-[9px] font-bold border-green-500 text-green-700 dark:border-green-700 dark:text-green-300">
                                  AI
                                </Badge>
                              )}
                            </div>
                            <span className={`text-[11px] font-medium flex-shrink-0 ml-2 ${
                              hasUnread
                                ? isAIConversation
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-blue-600 dark:text-blue-400"
                                : "text-gray-400 dark:text-gray-500"
                            }`}>
                              {formatTime(conv.updatedAt || conv.createdAt)}
                            </span>
                          </div>
                          
                          {/* Deuxième ligne: Message + Badge unread */}
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs truncate flex-1 ${
                              hasUnread
                                ? "text-gray-900 dark:text-white font-medium"
                                : "text-gray-500 dark:text-gray-400"
                            }`}>
                              {formatLastMessage(conv.lastMessage, isAIConversation, conv.lastMessageSenderId)}
                            </p>
                            
                            {/* Badge non lus */}
                            {hasUnread && (
                              <Badge 
                                className={`h-5 min-w-5 rounded-full px-1.5 text-[10px] font-bold shadow-sm ${
                                  isAIConversation
                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                    : "bg-blue-500 hover:bg-blue-600 text-white"
                                }`}
                              >
                                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bouton suppression au hover */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`absolute right-1.5 top-1/2 transform -translate-y-1/2 h-7 w-7 rounded-full transition-all duration-150 ${
                          isHovered === conv._id && !isSelected
                            ? "opacity-100 scale-100" 
                            : "opacity-0 scale-90 pointer-events-none"
                        } text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteConversation(conv, e)
                        }}
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )
                } catch (error) {
                  console.error('❌ Erreur rendu conversation:', error)
                  return null
                }
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Status - Compact */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1.5">
        <div className={`flex items-center gap-1.5 text-[11px] ${
          isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`} />
          <span className="font-medium">
            {isConnected ? 'Connecté' : 'Déconnecté'}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{conversations.length} conversation{conversations.length > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <Bot className="h-3 w-3" />
            <span>AI disponible</span>
          </div>
        </div>
      </div>
    </div>
  )
}