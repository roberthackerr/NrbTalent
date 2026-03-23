"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
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
import { 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  MessageCircle, 
  Plus,
  Bell,
  ChevronRight,
  User,
  Briefcase,
  Search
} from "lucide-react"
import { useEffect, useState } from "react"
import { Conversation } from "@/types/chat"
import { NotificationBell } from "./NotificationBell"

export function UserMenu() {
  const { data: session } = useSession()
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [messagesOpen, setMessagesOpen] = useState(false)

  // Simuler le chargement des conversations récentes
  useEffect(() => {
    const fetchRecentConversations = async () => {
      try {
        // TODO: Remplacer par votre appel API réel
        const response = await fetch('/api/conversations')
        if (response.ok) {
          const data = await response.json()
          setRecentConversations(data.conversations?.slice(0, 4) || [])
        }
      } catch (error) {
        console.error('Erreur chargement conversations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user) {
      fetchRecentConversations()
    }
  }, [session])

  if (!session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Button variant="ghost" asChild className="hidden sm:flex">
          <Link href="/auth/signin">Se connecter</Link>
        </Button>
        <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Link href="/auth/signup">Commencer</Link>
        </Button>
      </div>
    )
  }

  const user = session.user as any
  const dashboardUrl = user.role === "freelance" ? "/dashboard/freelance" : "/dashboard/client"
  
  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p._id !== user.id)
  }

  // Fonction corrigée pour formater le dernier message
  const formatLastMessage = (lastMessage: any) => {
    if (!lastMessage) return 'Aucun message'
    
    // Si lastMessage est une chaîne, la formater directement
    if (typeof lastMessage === 'string') {
      return lastMessage.length > 25 ? lastMessage.substring(0, 25) + '...' : lastMessage
    }
    
    // Si lastMessage est un objet avec une propriété content
    if (lastMessage.content && typeof lastMessage.content === 'string') {
      return lastMessage.content.length > 25 
        ? lastMessage.content.substring(0, 25) + '...' 
        : lastMessage.content
    }
    
    // Si lastMessage est un objet sans propriété content visible
    return 'Nouveau message'
  }

  // Fonction pour obtenir le timestamp
  const getMessageTime = (conversation: Conversation) => {
    if (conversation.lastMessage?.createdAt) {
      return new Date(conversation.lastMessage.createdAt).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    return new Date(conversation.updatedAt).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* 🔔 Notifications */}
      <NotificationBell />

      {/* 💬 Messages Dropdown séparé */}
      <DropdownMenu open={messagesOpen} onOpenChange={setMessagesOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg hover:bg-accent/50 transition-colors">
            <MessageCircle className="h-4.5 w-4.5" />
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-full flex items-center justify-center shadow-lg">
              2
            </span>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          className="w-96 max-h-[80vh] overflow-hidden rounded-xl border-0 shadow-2xl" 
          align="end" 
          forceMount
        >
          {/* En-tête Messages */}
          <DropdownMenuLabel className="p-4 border-b border-border/50 bg-gradient-to-r from-background/50 to-background/30">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-lg">Messages</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  {recentConversations.length} conversations actives
                </p>
              </div>
              <Button size="sm" asChild className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-md hover:shadow-lg transition-all h-8">
                <Link href="/messages" className="flex items-center gap-1.5">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs font-semibold">Nouveau</span>
                </Link>
              </Button>
            </div>
            
            {/* Barre de recherche */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-border/50 rounded-lg bg-accent/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </DropdownMenuLabel>

          {/* Liste des conversations */}
          <div className="p-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              // Squelette de chargement amélioré
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
                  <div className="h-12 w-12 bg-muted rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  <div className="h-3 bg-muted rounded w-8" />
                </div>
              ))
            ) : recentConversations.length > 0 ? (
              recentConversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation)
                const isUnread = conversation.unreadCount > 0
                
                return (
                  <DropdownMenuItem 
                    key={conversation._id} 
                    asChild 
                    className="p-3 cursor-pointer rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Link 
                      href={`/messages?conversation=${conversation._id}`}
                      onClick={() => setMessagesOpen(false)}
                      className="w-full"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-background">
                          <AvatarImage src={otherParticipant?.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white font-medium">
                            {otherParticipant?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm font-semibold truncate ${isUnread ? 'text-foreground' : 'text-foreground/80'}`}>
                              {otherParticipant?.name || 'Utilisateur'}
                            </p>
                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                              {getMessageTime(conversation)}
                            </span>
                          </div>
                          
                          <p className={`text-sm truncate ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                            {formatLastMessage(conversation.lastMessage)}
                          </p>
                        </div>
                        
                        {isUnread && (
                          <span className="h-6 w-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </Link>
                  </DropdownMenuItem>
                )
              })
            ) : (
              // État vide
              <div className="text-center py-8">
                <MessageCircle className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">Aucune conversation</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Commencez une nouvelle conversation pour échanger avec d'autres utilisateurs
                </p>
                <Button asChild>
                  <Link href="/messages" onClick={() => setMessagesOpen(false)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Démarrer une conversation
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t bg-muted/20">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/messages" onClick={() => setMessagesOpen(false)}>
                Voir toutes les conversations
              </Link>
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 👤 Menu utilisateur simplifié */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 px-2 rounded-lg gap-2 hover:bg-accent/50 transition-colors duration-200 border border-border/20 hover:border-border/50">
            <Avatar className="h-8 w-8 border-2 border-background/50">
              <AvatarImage src={user.image || ""} alt={user.name || ""} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 via-violet-500 to-purple-600 text-white text-xs font-bold">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            
            {/* Info utilisateur - visible sur desktop */}
            <div className="hidden sm:flex flex-col items-start">
              <p className="text-sm font-semibold leading-tight">{user.name}</p>
              <p className="text-xs text-muted-foreground leading-tight capitalize font-medium">
                {user.role || 'Utilisateur'}
              </p>
            </div>
            
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/70 hidden sm:block transition-transform group-hover:translate-x-0.5" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-72 rounded-xl border-0 shadow-2xl" align="end" forceMount>
          {/* En-tête utilisateur */}
          <DropdownMenuLabel className="p-4 bg-gradient-to-r from-background/50 to-background/30 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-border/30">
                <AvatarImage src={user.image || ""} alt={user.name || ""} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 via-violet-500 to-purple-600 text-white font-bold text-sm">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate font-medium">{user.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span className="text-xs text-muted-foreground capitalize font-semibold">
                    {user.role || 'Utilisateur'}
                  </span>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Navigation principale */}
          <div className="p-1.5 space-y-0.5">
            <DropdownMenuItem asChild className="rounded-lg hover:bg-accent/60 transition-colors cursor-pointer">
              <Link href={dashboardUrl} className="flex items-center gap-3 py-2.5">
                <LayoutDashboard className="h-4.5 w-4.5 text-blue-600" />
                <span className="font-semibold">Tableau de bord</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild className="rounded-lg hover:bg-accent/60 transition-colors cursor-pointer">
              <Link href="/profile" className="flex items-center gap-3 py-2.5">
                <User className="h-4.5 w-4.5 text-violet-600" />
                <span className="font-semibold">Mon profil</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild className="rounded-lg hover:bg-accent/60 transition-colors cursor-pointer">
              <Link href="/messages" className="flex items-center gap-3 py-2.5">
                <MessageCircle className="h-4.5 w-4.5 text-purple-600" />
                <span className="font-semibold">Messages</span>
                <span className="ml-auto h-5 w-5 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-md">
                  2
                </span>
              </Link>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator />

          {/* Paramètres et Déconnexion */}
          <div className="p-1.5 space-y-0.5 border-t border-border/50">
            <DropdownMenuItem asChild className="rounded-lg hover:bg-accent/60 transition-colors cursor-pointer mt-1.5">
              <Link href="/dashboard/settings" className="flex items-center gap-3 py-2.5">
                <Settings className="h-4.5 w-4.5 text-amber-600" />
                <span className="font-semibold">Paramètres</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => signOut({ callbackUrl: "/" })} 
              className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-100/20 focus:text-red-600 flex items-center gap-3 py-2.5 rounded-lg transition-colors"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span className="font-semibold">Se déconnecter</span>
            </DropdownMenuItem>
          </div>

          {/* Footer avec version */}
          <div className="p-3 border-t border-border/50 bg-muted/30 text-center rounded-b-xl">
            <p className="text-xs text-muted-foreground font-semibold">
              NRB Talents <span className="text-blue-600 font-bold">v1.0</span>
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
