// components/messages-dropdown.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Plus, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

interface Conversation {
  _id: string
  participants: Array<{
    _id: string
    name: string
    avatar?: string
  }>
  lastMessage?: {
    content: string
    createdAt: string
  }
  unreadCount: number
  updatedAt: string
}

interface MessagesDropdownProps {
  dict?: any
  lang?: string
}

export function MessagesDropdown({ dict, lang = "fr" }: MessagesDropdownProps) {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Charger le dictionnaire si non fourni
  const [localDict, setLocalDict] = useState<any>(dict)
  const params = useParams()
  const currentLang = (params.lang as Locale) || lang

  useEffect(() => {
    if (!dict) {
      getDictionarySafe(currentLang).then(setLocalDict)
    }
  }, [dict, currentLang])

  const t = (key: string, fallback: string = key) => {
    const dictionary = dict || localDict
    if (!dictionary) return fallback
    let value = dictionary
    for (const k of key.split(".")) {
      if (value && typeof value === "object") value = value[k]
      else return fallback
    }
    return value || fallback
  }

  useEffect(() => {
    const fetchConversations = async () => {
      if (!session?.user) return
      
      setIsLoading(true)
      try {
        const response = await fetch('/api/conversations/recent?limit=5')
        if (response.ok) {
          const data = await response.json()
          setConversations(data.conversations || [])
        } else {
          // Mock data for demo
          setConversations([
            {
              _id: "1",
              participants: [{ _id: "user1", name: "Marie Dupont", avatar: "" }],
              lastMessage: { content: "Bonjour, le projet est prêt ?", createdAt: new Date().toISOString() },
              unreadCount: 2,
              updatedAt: new Date().toISOString()
            },
            {
              _id: "2",
              participants: [{ _id: "user2", name: "Jean Martin", avatar: "" }],
              lastMessage: { content: "Merci pour votre travail !", createdAt: new Date(Date.now() - 3600000).toISOString() },
              unreadCount: 0,
              updatedAt: new Date(Date.now() - 3600000).toISOString()
            },
            {
              _id: "3",
              participants: [{ _id: "user3", name: "Sophie Bernard", avatar: "" }],
              lastMessage: { content: "Quand pouvez-vous commencer ?", createdAt: new Date(Date.now() - 86400000).toISOString() },
              unreadCount: 1,
              updatedAt: new Date(Date.now() - 86400000).toISOString()
            }
          ])
        }
      } catch (error) {
        console.error('Error loading conversations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [session])

  if (!session?.user) return null

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)

  const getOtherParticipant = (conversation: Conversation) => {
    const userId = (session.user as any).id
    return conversation.participants.find(p => p._id !== userId) || conversation.participants[0]
  }

  const formatLastMessage = (lastMessage?: { content: string }) => {
    if (!lastMessage?.content) return t("messages.noMessages", "Aucun message")
    return lastMessage.content.length > 35 
      ? lastMessage.content.substring(0, 35) + '...' 
      : lastMessage.content
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return t("messages.justNow", "à l'instant")
    if (diffMins < 60) return `${diffMins} ${t("messages.min", "min")}`
    if (diffHours < 24) return `${diffHours} ${t("messages.h", "h")}`
    if (diffDays < 7) return `${diffDays} ${t("messages.d", "j")}`
    return date.toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short'
    })
  }

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true
    const other = getOtherParticipant(conv)
    return other?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-8 w-8 rounded-lg hover:bg-accent/50 transition-colors"
          aria-label={t("messages.messages", "Messages")}
        >
          <MessageCircle className="h-4 w-4" />
          {totalUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className="w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-h-[80vh] overflow-hidden rounded-xl border-0 shadow-2xl" 
        align="end" 
        forceMount
      >
        {/* Header */}
        <DropdownMenuLabel className="p-3 sm:p-4 border-b border-border/50 bg-gradient-to-r from-background/50 to-background/30 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-blue-500" />
                {t("messages.messages", "Messages")}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                {conversations.length} {t("messages.conversations", "conversations")}
                {totalUnread > 0 && ` • ${totalUnread} ${t("messages.unread", "non lus")}`}
              </p>
            </div>
            <Button 
              size="sm" 
              asChild 
              className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 h-8 px-2 sm:px-3 shadow-md"
            >
              <Link href={`/${currentLang}/messages`} className="flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs font-semibold">{t("messages.new", "Nouveau")}</span>
              </Link>
            </Button>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <input
              type="text"
              placeholder={t("messages.search", "Rechercher...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-border/50 rounded-lg bg-accent/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </DropdownMenuLabel>

        {/* Conversations list */}
        <div className="p-1.5 sm:p-2 max-h-[50vh] overflow-y-auto">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-2 sm:p-3 rounded-lg animate-pulse">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-muted rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-2 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation)
              const isUnread = conversation.unreadCount > 0
              
              return (
                <DropdownMenuItem 
                  key={conversation._id} 
                  asChild 
                  className={cn(
                    "p-1.5 sm:p-2 cursor-pointer rounded-lg transition-colors",
                    isUnread && "bg-blue-50/50 dark:bg-blue-950/30"
                  )}
                >
                  <Link 
                    href={`/${currentLang}/messages?conversation=${conversation._id}`}
                    onClick={() => setOpen(false)}
                    className="w-full"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 w-full">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 border-2 border-background shadow-sm">
                        <AvatarImage src={otherParticipant?.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium text-sm">
                          {otherParticipant?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className={cn(
                            "text-xs sm:text-sm font-semibold truncate",
                            isUnread ? "text-foreground" : "text-foreground/80"
                          )}>
                            {otherParticipant?.name || t("messages.user", "Utilisateur")}
                          </p>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatTime(conversation.updatedAt)}
                          </span>
                        </div>
                        
                        <p className={cn(
                          "text-xs sm:text-sm truncate",
                          isUnread ? "text-foreground font-medium" : "text-muted-foreground"
                        )}>
                          {formatLastMessage(conversation.lastMessage)}
                        </p>
                      </div>
                      
                      {isUnread && (
                        <span className="h-5 w-5 sm:h-6 sm:w-6 bg-blue-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center flex-shrink-0 font-bold shadow-sm">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </Link>
                </DropdownMenuItem>
              )
            })
          ) : (
            // Empty state
            <div className="text-center py-6 sm:py-8 px-3">
              <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm sm:text-base font-medium text-muted-foreground mb-1">
                {searchQuery ? t("messages.noResults", "Aucun résultat") : t("messages.noConversations", "Aucune conversation")}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {searchQuery 
                  ? t("messages.tryDifferent", "Essayez une autre recherche") 
                  : t("messages.startNew", "Commencez une nouvelle conversation")}
              </p>
              {!searchQuery && (
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link href={`/${currentLang}/messages/new`} onClick={() => setOpen(false)}>
                    <Plus className="h-3.5 w-3.5" />
                    {t("messages.newConversation", "Nouvelle conversation")}
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {conversations.length > 0 && (
          <div className="p-2 sm:p-3 border-t bg-muted/20 rounded-b-xl">
            <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm gap-1.5" asChild>
              <Link href={`/${currentLang}/messages`} onClick={() => setOpen(false)}>
                {t("messages.viewAll", "Voir tous les messages")}
                <MessageCircle className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}