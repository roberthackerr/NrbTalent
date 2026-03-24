// components/dashboard/sidebar.tsx - Version corrigée pour mobile

"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  User,
  Settings,
  LogOut,
  FileText,
  Plus,
  Users,
  TrendingUp,
  GraduationCap,
  Building,
  Calendar,
  Wallet,
  Shield,
  Zap,
  Search,
  FolderOpen,
  Clock,
  BarChart3,
  Rocket,
  Crown,
  Workflow,
  Video,
  Lightbulb,
  Star,
  Award,
  Code,
  BookOpen,
  HelpCircle,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Folder,
  Package,
  Eye,
  ShoppingBag,
  Sparkles,
  Gem,
  PlayCircle,
  UserCheck,
  Target,
  Handshake,
  CheckCircle,
  Menu,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect } from "react"
import Image from "next/image"

interface SidebarProps {
  role: "freelance" | "client"
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

interface UserStats {
  activeProjects?: number
  pendingApplications?: number
  completedProjects?: number
  totalEarnings?: number
  unreadMessages?: number
  activeGigs?: number
  totalOrders?: number
  totalViews?: number
  openProjects?: number
  totalApplications?: number
}

interface MenuItem {
  href: string
  label: string
  icon: any
  description?: string
  badge?: string
  count?: number
  variant?: "primary" | "premium"
  exact?: boolean
  children?: MenuItem[]
}

export function DashboardSidebar({ role, isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const params = useParams()
  const lang = params.lang as string
  const [userStats, setUserStats] = useState<UserStats>({})
  const [userData, setUserData] = useState<any>(null)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768 && isMobileOpen) {
        onMobileClose?.()
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [isMobileOpen, onMobileClose])

  useEffect(() => {
    fetchUserData()
    const currentMenu = findCurrentMenu(pathname)
    if (currentMenu) {
      expandParentMenus(currentMenu)
    }
  }, [pathname])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/users/profile')
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
        setUserStats(data.stats || {})
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const toggleMenu = (menuLabel: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev)
      if (newSet.has(menuLabel)) {
        newSet.delete(menuLabel)
      } else {
        newSet.add(menuLabel)
      }
      return newSet
    })
  }

  const expandParentMenus = (menu: MenuItem) => {}

  const findCurrentMenu = (currentPath: string): MenuItem | null => {
    const searchMenus = (menus: MenuItem[]): MenuItem | null => {
      for (const menu of menus) {
        if (menu.href === currentPath || (menu.href !== '/' && currentPath.startsWith(menu.href + '/'))) {
          return menu
        }
        if (menu.children) {
          const found = searchMenus(menu.children)
          if (found) return found
        }
      }
      return null
    }
    return searchMenus(getMenuStructure())
  }

  const getMenuStructure = (): MenuItem[] => {
    const commonMenus: MenuItem[] = [
      {
        href: `/${lang}/dashboard`,
        label: "Tableau de Bord",
        icon: LayoutDashboard,
        description: "Vue d'ensemble",
        exact: true
      },
      {
        href: `/${lang}/messages`,
        label: "Messagerie",
        icon: MessageSquare,
        description: "Communications",
        count: userStats.unreadMessages,
        children: [
          {
            href: `/${lang}/messages`,
            label: "Conversations",
            icon: MessageSquare,
            description: "Mes messages"
          },
          {
            href: `/${lang}/messages/new`,
            label: "Nouveau Message",
            icon: Plus,
            description: "Démarrer une conversation"
          }
        ]
      },
      {
        href: `/${lang}/dashboard/settings`,
        label: "Paramètres",
        icon: Settings,
        description: "Configuration du compte",
        children: [
          {
            href: `/${lang}/profile`,
            label: "Mon Profil",
            icon: User,
            description: "Profil public"
          },
          {
            href: `/${lang}/dashboard/settings`,
            label: "Paramètres",
            icon: Settings,
            description: "Configuration compte"
          }
        ]
      }
    ]

    const freelanceMenus: MenuItem[] = [
      {
        href: `/${lang}/gigs`,
        label: "Mes Services",
        icon: Package,
        description: "Gérez vos services",
        badge: "Star",
        children: [
          {
            href: `/${lang}/dashboard/freelance/gigs`,
            label: "Tous mes services",
            icon: Package,
            description: "Liste complète",
            count: userStats.activeGigs
          },
          {
            href: `/${lang}/gigs/create`,
            label: "Créer un service",
            icon: Plus,
            description: "Nouveau service",
            variant: "primary"
          },
          {
            href: `/${lang}/gigs`,
            label: "Explorer les services",
            icon: Search,
            description: "Découvrir"
          }
        ]
      },
      {
        href: `/${lang}/projects`,
        label: "Projets",
        icon: Briefcase,
        description: "Opportunités",
        children: [
          {
            href: `/${lang}/projects`,
            label: "Découvrir Projets",
            icon: Search,
            description: "Parcourir"
          },
          {
            href: `/${lang}/dashboard/freelance/applications`,
            label: "Mes candidatures",
            icon: FileText,
            description: "Suivi des postulations",
            count: userStats.pendingApplications
          },
          {
            href: `/${lang}/dashboard/freelance/projects`,
            label: "Projets en cours",
            icon: FolderOpen,
            description: "Projets actifs",
            count: userStats.activeProjects
          }
        ]
      },
      {
        href: `/${lang}/ai-matching/freelancers`,
        label: "Matching IA",
        icon: Sparkles,
        description: "Projets recommandés",
        badge: "AI",
        children: [
          {
            href: `/${lang}/ai-matching/freelancers`,
            label: "Projets recommandés",
            icon: Target,
            description: "Basé sur vos compétences"
          },
          {
            href: `/${lang}/ai-matching`,
            label: "Tableau de bord IA",
            icon: BarChart3,
            description: "Analyse des matchs"
          }
        ]
      },
      {
        href: `/${lang}/orders`,
        label: "Commandes",
        icon: ShoppingBag,
        description: "Suivi des ventes",
        count: userStats.totalOrders,
        children: [
          {
            href: `/${lang}/orders`,
            label: "Commandes reçues",
            icon: ShoppingBag,
            description: "À traiter"
          },
          {
            href: `/${lang}/dashboard/freelance/earnings`,
            label: "Gains",
            icon: DollarSign,
            description: "Mes revenus",
            count: userStats.totalEarnings
          }
        ]
      },
      {
        href: `/${lang}/dashboard/academy`,
        label: "Academy",
        icon: GraduationCap,
        description: "Formation",
        children: [
          {
            href: `/${lang}/dashboard/academy`,
            label: "Cours",
            icon: GraduationCap,
            description: "Formations disponibles"
          },
          {
            href: `/${lang}/dashboard/skill-tests`,
            label: "Tests Compétences",
            icon: Award,
            description: "Certifications"
          }
        ]
      },
      {
        href: `/${lang}/dashboard/analytics`,
        label: "Analytics",
        icon: BarChart3,
        description: "Performances",
        badge: "Beta",
        children: [
          {
            href: `/${lang}/dashboard/analytics`,
            label: "Statistiques",
            icon: TrendingUp,
            description: "Vues et commandes",
            count: userStats.totalViews
          },
          {
            href: `/${lang}/dashboard/tracking`,
            label: "Suivi Temps",
            icon: Clock,
            description: "Tracking du travail"
          }
        ]
      }
    ]

    const clientMenus: MenuItem[] = [
      {
        href: `/${lang}/projects`,
        label: "Mes Projets",
        icon: Briefcase,
        description: "Gestion des projets",
        children: [
          {
            href: `/${lang}/projects/create`,
            label: "Publier un projet",
            icon: Plus,
            description: "Nouveau projet",
            variant: "primary"
          },
          {
            href: `/${lang}/dashboard/client/projects`,
            label: "Projets ouverts",
            icon: FolderOpen,
            description: "En cours",
            count: userStats.openProjects
          },
          {
            href: `/${lang}/dashboard/client/proposals`,
            label: "Candidatures",
            icon: Users,
            description: "Propositions reçues",
            count: userStats.totalApplications
          },
          {
            href: `/${lang}/dashboard/client/completed`,
            label: "Projets terminés",
            icon: CheckCircle,
            description: "Historique",
            count: userStats.completedProjects
          }
        ]
      },
      {
        href: `/${lang}/freelancers`,
        label: "Talents",
        icon: Users,
        description: "Trouver des freelances",
        children: [
          {
            href: `/${lang}/freelancers`,
            label: "Explorer Talents",
            icon: Search,
            description: "Parcourir les profils"
          },
          {
            href: `/${lang}/talents`,
            label: "Top Talents",
            icon: Star,
            description: "Meilleurs freelancers"
          },
          {
            href: `/${lang}/ai-matching/clients`,
            label: "Matching IA",
            icon: Sparkles,
            description: "Talents recommandés",
            badge: "AI"
          }
        ]
      },
      {
        href: `/${lang}/gigs`,
        label: "Services",
        icon: Package,
        description: "Services prédéfinis",
        children: [
          {
            href: `/${lang}/gigs`,
            label: "Découvrir Services",
            icon: Search,
            description: "Parcourir les gigs"
          },
          {
            href: `/${lang}/gigs/categories`,
            label: "Catégories",
            icon: Folder,
            description: "Services par catégorie"
          }
        ]
      },
      {
        href: `/${lang}/orders`,
        label: "Commandes",
        icon: ShoppingBag,
        description: "Suivi des achats",
        count: userStats.totalOrders,
        children: [
          {
            href: `/${lang}/orders`,
            label: "Commandes en cours",
            icon: ShoppingBag,
            description: "Suivi"
          },
          {
            href: `/${lang}/dashboard/client/payments`,
            label: "Facturation",
            icon: Wallet,
            description: "Historique"
          }
        ]
      },
      {
        href: `/${lang}/dashboard/workspace`,
        label: "Workspace",
        icon: Workflow,
        description: "Espace collaboratif",
        badge: "Beta",
        children: [
          {
            href: `/${lang}/ide`,
            label: "IDE en Ligne",
            icon: Code,
            description: "Éditeur de code"
          },
          {
            href: `/${lang}/meet`,
            label: "Vidéo Conférence",
            icon: Video,
            description: "Réunions"
          }
        ]
      },
      {
        href: `/${lang}/dashboard/referrals`,
        label: "Parrainage",
        icon: Handshake,
        description: "Programme de recommandation"
      }
    ]

    return [...commonMenus, ...(role === "freelance" ? freelanceMenus : clientMenus)]
  }

  const getUserInitials = () => {
    if (!userData?.name) return "U"
    return userData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
  }

  const isLinkActive = (link: MenuItem) => {
    if (link.exact) {
      return pathname === link.href
    }
    return pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href + "/"))
  }

  const renderMenuItem = (menu: MenuItem, level = 0) => {
    const Icon = menu.icon
    const hasChildren = menu.children && menu.children.length > 0
    const isExpanded = expandedMenus.has(menu.label)
    const isActive = isLinkActive(menu)
    const isChildActive = hasChildren && menu.children!.some(child => isLinkActive(child))

    if (isCollapsed && level === 0 && !isMobile) {
      return (
        <div key={menu.href} className="relative group">
          <Link
            href={menu.href}
            className={cn(
              "flex items-center justify-center rounded-xl px-2 py-2.5 transition-all duration-200",
              isActive
                ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/25"
                : isChildActive
                  ? "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  : "text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700"
            )}
            title={menu.label}
          >
            <Icon className="h-5 w-5" />
          </Link>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {menu.label}
          </div>
        </div>
      )
    }

    return (
      <div key={menu.href} className="select-none">
        <div className={cn(
          "flex items-center gap-2 rounded-xl transition-all duration-200",
          level === 0 ? "mb-1" : "mb-0.5"
        )}>
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-purple-100 dark:hover:bg-purple-800/50"
              onClick={() => toggleMenu(menu.label)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-purple-500" />
              ) : (
                <ChevronRight className="h-3 w-3 text-purple-500" />
              )}
            </Button>
          )}
          
          {!hasChildren && level > 0 && (
            <div className="w-7 h-7 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-fuchsia-400" />
            </div>
          )}

          <Link
            href={menu.href}
            className={cn(
              "group flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/25"
                : isChildActive
                  ? "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                  : "text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 border border-transparent hover:border-purple-200 dark:hover:border-purple-800",
              menu.variant === "primary" && "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25",
              menu.variant === "premium" && "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
              level > 0 && "ml-2"
            )}
            onClick={(e) => {
              if (hasChildren) {
                e.preventDefault()
                toggleMenu(menu.label)
              } else {
                onMobileClose?.()
              }
            }}
          >
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200",
              isActive 
                ? "bg-white/20" 
                : menu.variant === "primary" 
                  ? "bg-white/20" 
                  : isChildActive
                    ? "bg-purple-100 dark:bg-purple-800/50 text-purple-600 dark:text-purple-400"
                    : "bg-slate-100 dark:bg-slate-800 group-hover:bg-purple-100 dark:group-hover:bg-purple-800/50 group-hover:text-purple-600 dark:group-hover:text-purple-400"
            )}>
              <Icon className={cn(
                "h-4 w-4",
                isActive || menu.variant === "primary" || menu.variant === "premium" ? "text-white" : isChildActive ? "text-purple-600 dark:text-purple-400" : "text-slate-500 dark:text-slate-400"
              )} />
            </div>
            
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="truncate">{menu.label}</span>
                  {menu.badge && (
                    <Badge className={cn(
                      "text-[10px] px-1.5 py-0.5",
                      isActive 
                        ? "bg-white/20 text-white" 
                        : "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white"
                    )}>
                      {menu.badge}
                    </Badge>
                  )}
                </div>
                {menu.description && (
                  <p className={cn(
                    "text-[11px] truncate mt-0.5",
                    isActive ? "text-purple-100" : "text-slate-500 dark:text-slate-400"
                  )}>
                    {menu.description}
                  </p>
                )}
              </div>
            )}

            {!isCollapsed && menu.count !== undefined && menu.count > 0 && (
              <Badge className={cn(
                "ml-auto text-xs min-w-5 h-5 flex items-center justify-center rounded-full",
                isActive 
                  ? "bg-white text-purple-600" 
                  : "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white"
              )}>
                {menu.count > 99 ? "99+" : menu.count}
              </Badge>
            )}
          </Link>
        </div>

        {hasChildren && isExpanded && !isCollapsed && (
          <div className={cn(
            "ml-4 space-y-1 border-l-2 border-purple-200 dark:border-purple-800",
            level === 0 ? "mt-1" : "mt-0.5"
          )}>
            {menu.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const freelanceStats = [
    { label: "Services actifs", value: userStats.activeGigs || 0, icon: Package, color: "from-purple-500 to-fuchsia-500" },
    { label: "Commandes", value: userStats.totalOrders || 0, icon: ShoppingBag, color: "from-emerald-500 to-teal-500" },
    { label: "Vues totales", value: userStats.totalViews || 0, icon: Eye, color: "from-blue-500 to-cyan-500" },
    { label: "Gains", value: `${userStats.totalEarnings || 0}€`, icon: DollarSign, color: "from-amber-500 to-orange-500" }
  ]

  const clientStats = [
    { label: "Projets ouverts", value: userStats.openProjects || 0, icon: Briefcase, color: "from-purple-500 to-fuchsia-500" },
    { label: "Candidatures", value: userStats.totalApplications || 0, icon: Users, color: "from-emerald-500 to-teal-500" },
    { label: "Projets terminés", value: userStats.completedProjects || 0, icon: CheckCircle, color: "from-blue-500 to-cyan-500" },
    { label: "Dépensé", value: `${userStats.totalEarnings || 0}€`, icon: Wallet, color: "from-amber-500 to-orange-500" }
  ]

  const currentStats = role === "freelance" ? freelanceStats : clientStats

  // Contenu de la sidebar
  const sidebarContent = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header avec logo */}


      {/* Carte utilisateur */}
      {!isCollapsed && (
        <div className="p-4 border-b border-purple-100 dark:border-purple-900/50 flex-shrink-0">
          <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/50 dark:to-fuchsia-950/50 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white shadow-md ring-2 ring-purple-200 dark:ring-purple-800">
                <AvatarImage src={userData?.avatar} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">
                  {userData?.name || "Utilisateur"}
                </h3>
                <p className="text-xs text-purple-600 dark:text-purple-400 capitalize">
                  {role === "freelance" ? "🎨 Freelance" : "🏢 Client"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Navigation principale */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {getMenuStructure().map(menu => renderMenuItem(menu))}
      </div>

      {/* Footer */}
      <div className="border-t border-purple-100 dark:border-purple-900/50 p-4 bg-gradient-to-b from-transparent to-purple-50/30 dark:to-purple-950/20 flex-shrink-0">
        <div className="flex items-center justify-between">
          <NotificationsDropdown />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => signOut({ callbackUrl: `/${lang}` })}
            className="text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!isCollapsed && "Déconnexion"}
          </Button>
        </div>
        
        {/* Bouton de collapse (visible uniquement sur desktop) */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full mt-3 text-purple-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30"
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
            {!isCollapsed && "Réduire le menu"}
          </Button>
        )}
      </div>
    </div>
  )

  // Rendu pour mobile (avec overlay)
  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={onMobileClose}
          />
        )}
        
        {/* Sidebar mobile */}
        <div className={cn(
          "fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-in-out md:hidden",
          "bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm",
          "border-r border-purple-100 dark:border-purple-900/50",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          "w-80"
        )}>
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header avec bouton de fermeture */}
            <div className="flex items-center justify-between p-4 border-b border-purple-100 dark:border-purple-900/50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">NRB</span>
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-purple-700 to-fuchsia-700 bg-clip-text text-transparent">
                  NRBTalents
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onMobileClose}
                className="h-8 w-8 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto">
              {sidebarContent}
            </div>
          </div>
        </div>
      </>
    )
  }

  // Rendu pour desktop
  return (
    <div className={cn(
      "hidden md:flex h-screen flex-col border-r transition-all duration-300",
      "bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm",
      "border-purple-100 dark:border-purple-900/50",
      isCollapsed ? "w-20" : "w-80"
    )}>
      {sidebarContent}
    </div>
  )
}