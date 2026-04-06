"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Briefcase, MessageSquare, User, Settings, LogOut,
  FileText, Plus, Users, TrendingUp, GraduationCap, Building, Calendar,
  Wallet, Shield, Zap, Search, FolderOpen, Clock, BarChart3, Rocket,
  Crown, Workflow, Video, Lightbulb, Star, Award, Code, BookOpen,
  HelpCircle, DollarSign, ChevronDown, ChevronRight, Folder, Package,
  Eye, ShoppingBag, Sparkles, Gem, PlayCircle, UserCheck, Target,
  Handshake, CheckCircle, Menu, X
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

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile && isMobileOpen) onMobileClose?.()
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [isMobileOpen, onMobileClose])

  useEffect(() => {
    fetchUserData()
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
      const next = new Set(prev)
      next.has(menuLabel) ? next.delete(menuLabel) : next.add(menuLabel)
      return next
    })
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
          { href: `/${lang}/messages`,     label: "Conversations",   icon: MessageSquare, description: "Mes messages" },
          { href: `/${lang}/messages/new`, label: "Nouveau Message", icon: Plus,          description: "Démarrer une conversation" }
        ]
      },
      {
        href: `/${lang}/dashboard/settings`,
        label: "Paramètres",
        icon: Settings,
        description: "Configuration du compte",
        children: [
          { href: `/${lang}/profile`,            label: "Mon Profil",  icon: User,     description: "Profil public" },
          { href: `/${lang}/dashboard/settings`, label: "Paramètres", icon: Settings, description: "Configuration compte" }
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
          { href: `/${lang}/dashboard/freelance/gigs`, label: "Tous mes services",   icon: Package, description: "Liste complète",   count: userStats.activeGigs },
          { href: `/${lang}/gigs/create`,              label: "Créer un service",    icon: Plus,    description: "Nouveau service",   variant: "primary" },
          { href: `/${lang}/gigs`,                     label: "Explorer les services", icon: Search, description: "Découvrir" }
        ]
      },
      {
        href: `/${lang}/projects`,
        label: "Projets",
        icon: Briefcase,
        description: "Opportunités",
        children: [
          { href: `/${lang}/projects`,                            label: "Découvrir Projets", icon: Search,     description: "Parcourir" },
          { href: `/${lang}/dashboard/freelance/applications`,    label: "Mes candidatures",  icon: FileText,   description: "Suivi des postulations", count: userStats.pendingApplications },
          { href: `/${lang}/dashboard/freelance/projects`,        label: "Projets en cours",  icon: FolderOpen, description: "Projets actifs",         count: userStats.activeProjects }
        ]
      },
      {
        href: `/${lang}/ai-matching/freelancers`,
        label: "Matching IA",
        icon: Sparkles,
        description: "Projets recommandés",
        badge: "AI",
        children: [
          { href: `/${lang}/ai-matching/freelancers`, label: "Projets recommandés", icon: Target,   description: "Basé sur vos compétences" },
          { href: `/${lang}/ai-matching`,             label: "Tableau de bord IA",  icon: BarChart3, description: "Analyse des matchs" }
        ]
      },
      {
        href: `/${lang}/orders`,
        label: "Commandes",
        icon: ShoppingBag,
        description: "Suivi des ventes",
        count: userStats.totalOrders,
        children: [
          { href: `/${lang}/orders`,                         label: "Commandes reçues", icon: ShoppingBag,  description: "À traiter" },
          { href: `/${lang}/dashboard/freelance/earnings`,   label: "Gains",            icon: DollarSign,   description: "Mes revenus", count: userStats.totalEarnings }
        ]
      },
      {
        href: `/${lang}/dashboard/academy`,
        label: "Academy",
        icon: GraduationCap,
        description: "Formation",
        children: [
          { href: `/${lang}/dashboard/academy`,      label: "Cours",              icon: GraduationCap, description: "Formations disponibles" },
          { href: `/${lang}/dashboard/skill-tests`,  label: "Tests Compétences",  icon: Award,         description: "Certifications" }
        ]
      },
      {
        href: `/${lang}/dashboard/analytics`,
        label: "Analytics",
        icon: BarChart3,
        description: "Performances",
        badge: "Beta",
        children: [
          { href: `/${lang}/dashboard/analytics`, label: "Statistiques",  icon: TrendingUp, description: "Vues et commandes", count: userStats.totalViews },
          { href: `/${lang}/dashboard/tracking`,  label: "Suivi Temps",   icon: Clock,      description: "Tracking du travail" }
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
          { href: `/${lang}/projects/create`,               label: "Publier un projet",  icon: Plus,        description: "Nouveau projet",     variant: "primary" },
          { href: `/${lang}/dashboard/client/projects`,     label: "Projets ouverts",    icon: FolderOpen,  description: "En cours",           count: userStats.openProjects },
          { href: `/${lang}/dashboard/client/proposals`,    label: "Candidatures",       icon: Users,       description: "Propositions reçues", count: userStats.totalApplications },
          { href: `/${lang}/dashboard/client/completed`,    label: "Projets terminés",   icon: CheckCircle, description: "Historique",          count: userStats.completedProjects }
        ]
      },
      {
        href: `/${lang}/freelancers`,
        label: "Talents",
        icon: Users,
        description: "Trouver des freelances",
        children: [
          { href: `/${lang}/freelancers`,           label: "Explorer Talents", icon: Search,   description: "Parcourir les profils" },
          { href: `/${lang}/talents`,               label: "Top Talents",      icon: Star,     description: "Meilleurs freelancers" },
          { href: `/${lang}/ai-matching/clients`,   label: "Matching IA",      icon: Sparkles, description: "Talents recommandés", badge: "AI" }
        ]
      },
      {
        href: `/${lang}/gigs`,
        label: "Services",
        icon: Package,
        description: "Services prédéfinis",
        children: [
          { href: `/${lang}/gigs`,            label: "Découvrir Services", icon: Search, description: "Parcourir les gigs" },
          { href: `/${lang}/gigs/categories`, label: "Catégories",         icon: Folder, description: "Services par catégorie" }
        ]
      },
      {
        href: `/${lang}/orders`,
        label: "Commandes",
        icon: ShoppingBag,
        description: "Suivi des achats",
        count: userStats.totalOrders,
        children: [
          { href: `/${lang}/orders`,                        label: "Commandes en cours", icon: ShoppingBag, description: "Suivi" },
          { href: `/${lang}/dashboard/client/payments`,     label: "Facturation",        icon: Wallet,      description: "Historique" }
        ]
      },
      {
        href: `/${lang}/dashboard/workspace`,
        label: "Workspace",
        icon: Workflow,
        description: "Espace collaboratif",
        badge: "Beta",
        children: [
          { href: `/${lang}/ide`,  label: "IDE en Ligne",     icon: Code,  description: "Éditeur de code" },
          { href: `/${lang}/meet`, label: "Vidéo Conférence", icon: Video, description: "Réunions" }
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
    return userData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const isLinkActive = (link: MenuItem) => {
    if (link.exact) return pathname === link.href
    return pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href + "/"))
  }

  const renderMenuItem = (menu: MenuItem, level = 0) => {
    const Icon = menu.icon
    const hasChildren = !!menu.children?.length
    const isExpanded = expandedMenus.has(menu.label)
    const isActive = isLinkActive(menu)
    const isChildActive = hasChildren && menu.children!.some(child => isLinkActive(child))

    // Collapsed icon-only mode (desktop only)
    if (isCollapsed && level === 0) {
      return (
        <div key={menu.href} className="relative group">
          <Link
            href={menu.href}
            title={menu.label}
            className={cn(
              "flex items-center justify-center rounded-xl p-2.5 transition-all duration-200",
              isActive
                ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/25"
                : isChildActive
                  ? "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  : "text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700"
            )}
          >
            <Icon className="h-5 w-5" />
          </Link>
          {/* Tooltip */}
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity shadow-lg">
            {menu.label}
          </div>
        </div>
      )
    }

    return (
      <div key={`${menu.href}-${level}`} className="select-none">
        <div className={cn("flex items-center gap-1", level === 0 ? "mb-1" : "mb-0.5")}>
          {/* Expand toggle */}
          {hasChildren ? (
            <button
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800/50 transition-colors"
              onClick={() => toggleMenu(menu.label)}
            >
              {isExpanded
                ? <ChevronDown  className="h-3 w-3 text-purple-500" />
                : <ChevronRight className="h-3 w-3 text-purple-500" />
              }
            </button>
          ) : level > 0 ? (
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-300 dark:bg-purple-700" />
            </div>
          ) : null}

          <Link
            href={menu.href}
            className={cn(
              "group flex flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-500/20"
                : isChildActive
                  ? "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                  : "text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 border border-transparent hover:border-purple-200/60 dark:hover:border-purple-800/60",
              menu.variant === "primary" && "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-md shadow-emerald-500/20",
              level > 0 && "text-[13px]"
            )}
            onClick={(e) => {
              if (hasChildren) { e.preventDefault(); toggleMenu(menu.label) }
              else onMobileClose?.()
            }}
          >
            {/* Icon box */}
            <div className={cn(
              "flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-colors",
              isActive || menu.variant === "primary"
                ? "bg-white/20"
                : isChildActive
                  ? "bg-purple-100 dark:bg-purple-800/50 text-purple-600 dark:text-purple-400"
                  : "bg-slate-100 dark:bg-slate-800 group-hover:bg-purple-100 dark:group-hover:bg-purple-800/50"
            )}>
              <Icon className={cn(
                "h-3.5 w-3.5",
                isActive || menu.variant === "primary" ? "text-white" : isChildActive ? "text-purple-600 dark:text-purple-400" : "text-slate-500 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400"
              )} />
            </div>

            {/* Label + description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate leading-none">{menu.label}</span>
                {menu.badge && (
                  <Badge className={cn(
                    "text-[9px] px-1 py-0 h-4 leading-none",
                    isActive ? "bg-white/20 text-white border-0" : "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white border-0"
                  )}>
                    {menu.badge}
                  </Badge>
                )}
              </div>
              {menu.description && level === 0 && (
                <p className={cn(
                  "text-[10px] truncate mt-0.5 leading-none",
                  isActive ? "text-purple-100" : "text-slate-400 dark:text-slate-500"
                )}>
                  {menu.description}
                </p>
              )}
            </div>

            {/* Count badge */}
            {menu.count !== undefined && menu.count > 0 && (
              <Badge className={cn(
                "flex-shrink-0 text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1",
                isActive ? "bg-white text-purple-600 border-0" : "bg-purple-600 text-white border-0"
              )}>
                {menu.count > 99 ? "99+" : menu.count}
              </Badge>
            )}
          </Link>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-3 pl-3 border-l-2 border-purple-100 dark:border-purple-800/60 space-y-0.5 mb-1">
            {menu.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  // ── Shared sidebar body ───────────────────────────────────────────────────
  const SidebarBody = () => (
    <div className="flex flex-col h-full">
      {/* Logo header */}
      <div className={cn(
        "flex items-center gap-2 px-4 py-4 border-b border-purple-100 dark:border-purple-900/50 flex-shrink-0",
        isCollapsed && !isMobile && "justify-center px-2"
      )}>
        <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-md">
          <Image src={"/logo.png"} alt="logo"  className="w-40 h-40 "/>
        </div>
        {(!isCollapsed || isMobile) && (
          <span className="font-bold text-base bg-gradient-to-r from-purple-700 to-fuchsia-700 bg-clip-text text-transparent">
            NRBTalents
          </span>
        )}
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="ml-auto p-1.5 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800/50 transition-colors"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        )}
      </div>

      {/* User card */}
      {(!isCollapsed || isMobile) && (
        <div className="px-3 py-3 border-b border-purple-100 dark:border-purple-900/50 flex-shrink-0">
          <div className="flex items-center gap-2.5 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/40 dark:to-fuchsia-950/40 rounded-xl px-3 py-2.5 border border-purple-100 dark:border-purple-900/60">
            <Avatar className="h-9 w-9 flex-shrink-0 border-2 border-white dark:border-gray-800 shadow ring-1 ring-purple-200 dark:ring-purple-800">
              <AvatarImage src={userData?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white text-xs font-semibold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-none mb-0.5">
                {userData?.name || "Utilisateur"}
              </p>
              <p className="text-[11px] text-purple-600 dark:text-purple-400">
                {role === "freelance" ? "Freelance" : "Client"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed user avatar */}
      {isCollapsed && !isMobile && (
        <div className="flex justify-center py-3 border-b border-purple-100 dark:border-purple-900/50 flex-shrink-0">
          <Avatar className="h-9 w-9 border-2 border-white dark:border-gray-800 shadow ring-1 ring-purple-200 dark:ring-purple-800">
            <AvatarImage src={userData?.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white text-xs font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Nav items — scrollable */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5 scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-purple-800 scrollbar-track-transparent">
        {getMenuStructure().map(menu => renderMenuItem(menu))}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-purple-100 dark:border-purple-900/50 p-3 space-y-1">
        <div className={cn(
          "flex items-center",
          isCollapsed && !isMobile ? "flex-col gap-1" : "gap-2"
        )}>
          <NotificationsDropdown />
          <button
            onClick={() => signOut({ callbackUrl: `/${lang}` })}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors",
              isCollapsed && !isMobile && "justify-center px-2"
            )}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {(!isCollapsed || isMobile) && <span>Déconnexion</span>}
          </button>
        </div>

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <button
            onClick={() => setIsCollapsed(v => !v)}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs text-purple-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
          >
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-200", !isCollapsed && "rotate-180")} />
            {!isCollapsed && <span>Réduire le menu</span>}
          </button>
        )}
      </div>
    </div>
  )

  // ── Mobile overlay drawer ─────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden",
            isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
          onClick={onMobileClose}
        />
        {/* Drawer */}
        <aside
          className={cn(
            "fixed top-0 left-0 bottom-0 z-50 w-72 transition-transform duration-300 ease-in-out md:hidden",
            "bg-white dark:bg-slate-900",
            "border-r border-purple-100 dark:border-purple-900/50",
            "shadow-2xl shadow-purple-900/20",
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SidebarBody />
        </aside>
      </>
    )
  }

  // ── Desktop fixed sidebar ─────────────────────────────────────────────────
  return (
    <aside
      className={cn(
        // Fixed to viewport — this is the key change
        "fixed top-0 left-0 bottom-0 z-30 hidden md:flex flex-col",
        "bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm",
        "border-r border-purple-100 dark:border-purple-900/50",
        "transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-72"
      )}
    >
      <SidebarBody />
    </aside>
  )
}