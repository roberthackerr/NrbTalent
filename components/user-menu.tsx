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
  Search,
  Globe
} from "lucide-react"
import { useEffect, useState } from "react"
import { Conversation } from "@/types/chat"
import { NotificationBell } from "./NotificationBell"
import { getDictionarySafe } from "@/lib/i18n/dictionaries"
import type { Locale } from "@/lib/i18n/config"
import { useParams } from "next/navigation"

export function UserMenu() {
  const { data: session } = useSession()
  const params = useParams()
  const lang = (params?.lang as Locale) || 'fr'
  
  const [dict, setDict] = useState<any>(null)
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [messagesOpen, setMessagesOpen] = useState(false)

  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

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

  const t = dict?.userMenu || {
    signIn: 'Se connecter',
    signUp: 'Commencer',
    dashboard: 'Tableau',
    profile: 'Profil',
    messages: 'Messages',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    version: 'v',
    user: 'Utilisateur',
    noMessages: 'Aucun message',
    newMessage: 'Nouveau message'
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Button variant="ghost" asChild className="hidden sm:flex">
          <Link href={`/${lang}/auth/signin`}>{t.signIn}</Link>
        </Button>
        <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Link href={`/${lang}/auth/signup`}>{t.signUp}</Link>
        </Button>
      </div>
    )
  }

  const user = session.user as any
  const dashboardUrl = user.role === "freelance" ? `/${lang}/dashboard/freelance` : `/${lang}/dashboard/client`
  
  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p._id !== user.id)
  }

  const formatLastMessage = (lastMessage: any) => {
    if (!lastMessage) return t.noMessages || 'Aucun message'
    
    if (typeof lastMessage === 'string') {
      return lastMessage.length > 25 ? lastMessage.substring(0, 25) + '...' : lastMessage
    }
    
    if (lastMessage.content && typeof lastMessage.content === 'string') {
      return lastMessage.content.length > 25 
        ? lastMessage.content.substring(0, 25) + '...' 
        : lastMessage.content
    }
    
    return t.newMessage || 'Nouveau message'
  }

  const getMessageTime = (conversation: Conversation) => {
    if (conversation.lastMessage?.createdAt) {
      return new Date(conversation.lastMessage.createdAt).toLocaleTimeString(lang === 'mg' ? 'fr' : lang, {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    return new Date(conversation.updatedAt).toLocaleTimeString(lang === 'mg' ? 'fr' : lang, {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 px-1.5 sm:px-2 rounded-lg gap-1 sm:gap-2 hover:bg-accent/50 border border-border/20 hover:border-border/50">
            <Avatar className="h-8 w-8 border-2 border-background/50">
              <AvatarImage src={user.image || ""} alt={user.name || ""} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 via-violet-500 to-purple-600 text-white text-xs font-bold">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/70 hidden md:block" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-[calc(100vw-2rem)] sm:w-72 rounded-xl border-0 shadow-2xl" align="end" forceMount>
          {/* En-tête utilisateur */}
          <DropdownMenuLabel className="p-3 sm:p-4 bg-gradient-to-r from-background/50 to-background/30 border-b border-border/50">
            <div className="flex items-center gap-2 sm:gap-3">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-border/30 flex-shrink-0">
                <AvatarImage src={user.image || ""} alt={user.name || ""} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 via-violet-500 to-purple-600 text-white font-bold text-xs sm:text-sm">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate font-medium">{user.email}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground/70 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground capitalize font-semibold truncate">
                    {user.role === 'freelance' 
                      ? (lang === 'fr' ? 'Freelance' : lang === 'mg' ? 'Freelance' : 'Freelance')
                      : (lang === 'fr' ? 'Client' : lang === 'mg' ? 'Mpanjifa' : 'Client')
                    }
                  </span>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Navigation principale */}
          <div className="p-1 sm:p-1.5 space-y-0.5">
            <DropdownMenuItem asChild className="rounded-lg hover:bg-accent/60 transition-colors cursor-pointer">
              <Link href={dashboardUrl} className="flex items-center gap-2 sm:gap-3 py-2 sm:py-2.5 px-2">
                <LayoutDashboard className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-semibold">{t.dashboard}</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild className="rounded-lg hover:bg-accent/60 transition-colors cursor-pointer">
              <Link href={`/${lang}/profile`} className="flex items-center gap-2 sm:gap-3 py-2 sm:py-2.5 px-2">
                <User className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-violet-600 flex-shrink-0" />
                <span className="text-sm font-semibold">{t.profile}</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild className="rounded-lg hover:bg-accent/60 transition-colors cursor-pointer">
              <Link href={`/${lang}/messages`} className="flex items-center gap-2 sm:gap-3 py-2 sm:py-2.5 px-2">
                <MessageCircle className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-purple-600 flex-shrink-0" />
                <span className="text-sm font-semibold">{t.messages}</span>
                {recentConversations.length > 0 && (
                  <span className="ml-auto h-4 w-4 sm:h-5 sm:w-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {recentConversations.length}
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator />

          {/* Paramètres et Déconnexion */}
          <div className="p-1 sm:p-1.5 space-y-0.5 border-t border-border/50">
            <DropdownMenuItem asChild className="rounded-lg hover:bg-accent/60 transition-colors cursor-pointer">
              <Link href={`/${lang}/dashboard/settings`} className="flex items-center gap-2 sm:gap-3 py-2 sm:py-2.5 px-2">
                <Settings className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-amber-600 flex-shrink-0" />
                <span className="text-sm font-semibold">{t.settings}</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => signOut({ callbackUrl: `/${lang}` })} 
              className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-100/20 focus:text-red-600 flex items-center gap-2 sm:gap-3 py-2 sm:py-2.5 px-2 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4 sm:h-4.5 sm:w-4.5 flex-shrink-0" />
              <span className="text-sm font-semibold">{t.logout}</span>
            </DropdownMenuItem>
          </div>

          {/* Footer avec version */}
          <div className="p-2 sm:p-3 border-t border-border/50 bg-muted/30 text-center rounded-b-xl">
            <p className="text-xs text-muted-foreground font-semibold">
              NRB Talents <span className="text-blue-600 font-bold">{t.version}1.0</span>
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}