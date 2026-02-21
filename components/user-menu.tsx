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

  const formatLastMessage = (content: string) => {
    return content.length > 25 ? content.substring(0, 25) + '...' : content
  }

  return (
    <div className="flex items-center gap-2">
      {/* 🔔 Notifications */}
        <NotificationBell />

      {/* 💬 Messages Dropdown séparé */}
      <DropdownMenu open={messagesOpen} onOpenChange={setMessagesOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <MessageCircle className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
              2
            </span>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          className="w-96 max-h-[80vh] overflow-hidden" 
          align="end" 
          forceMount
        >
          {/* En-tête Messages */}
          <DropdownMenuLabel className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Messages</h3>
                <p className="text-sm text-muted-foreground">
                  {recentConversations.length} conversations
                </p>
              </div>
              <Button size="sm" asChild>
                <Link href="/messages" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nouveau
                </Link>
              </Button>
            </div>
            
            {/* Barre de recherche */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher une conversation..."
                className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            {conversation.lastMessage && (
                              <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                {new Date(conversation.updatedAt).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            )}
                          </div>
                          
                          <p className={`text-sm truncate ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                            {conversation.lastMessage 
                              ? formatLastMessage(conversation.lastMessage)
                              : 'Aucun message'
                            }
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
          <Button variant="ghost" className="relative h-10 px-2 rounded-full gap-2 hover:bg-accent/50">
            <Avatar className="h-8 w-8 border-2 border-background">
              <AvatarImage src={user.image || ""} alt={user.name || ""} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            
            {/* Info utilisateur - visible sur desktop */}
            <div className="hidden sm:flex flex-col items-start">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs text-muted-foreground leading-none capitalize">
                {user.role || 'Utilisateur'}
              </p>
            </div>
            
            <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-64" align="end" forceMount>
          {/* En-tête utilisateur */}
          <DropdownMenuLabel className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.image || ""} alt={user.name || ""} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Briefcase className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground capitalize">
                    {user.role || 'Utilisateur'}
                  </span>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Navigation principale */}
          <div className="p-1">
            <DropdownMenuItem asChild>
              <Link href={dashboardUrl} className="cursor-pointer flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span>Tableau de bord</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Mon profil</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Link href="/messages" className="cursor-pointer flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span>Messages</span>
                <span className="ml-auto h-5 w-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  2
                </span>
              </Link>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator />

          {/* Paramètres et Déconnexion */}
          <div className="p-1">
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Paramètres</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => signOut({ callbackUrl: "/" })} 
              className="cursor-pointer text-red-600 focus:text-red-600 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Se déconnecter</span>
            </DropdownMenuItem>
          </div>

          {/* Footer avec version */}
          <div className="p-3 border-t">
            <p className="text-xs text-muted-foreground text-center">
              NRB Talents v1.0
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}