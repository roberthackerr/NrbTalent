"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
  Target,
  Calendar,
  Wallet,
  Shield,
  Zap,
  Search,
  FolderOpen,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  HeartHandshake,
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
  Mail,
  Phone,
  Globe,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderPlus,
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
}

interface UserStats {
  activeProjects?: number
  pendingApplications?: number
  completedProjects?: number
  totalEarnings?: number
  unreadMessages?: number
}

interface MenuItem {
  href: string
  label: string
  icon: any
  description?: string
  badge?: string
  count?: number
  variant?: "primary"
  exact?: boolean
  children?: MenuItem[]
}

export function DashboardSidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const [userStats, setUserStats] = useState<UserStats>({})
  const [userData, setUserData] = useState<any>(null)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchUserData()
    // Expand menus based on current path
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
        setUserData(data.user)
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

  const expandParentMenus = (menu: MenuItem) => {
    // This would recursively expand parent menus
    // For now, we'll handle it in the menu structure
  }

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
    return [
      {
        href: "/dashboard",
        label: "Tableau de Bord",
        icon: LayoutDashboard,
        description: "Vue d'ensemble",
        exact: true
      },
      {
        href: "/projects",
        label: "Projets",
        icon: Briefcase,
        description: "Gestion des projets",
        children: [
          {
            href: "/projects",
            label: "Découvrir Projets",
            icon: Search,
            description: "Parcourir les projets"
          },
          {
            href: "/projects/create",
            label: "Créer Projet",
            icon: Plus,
            description: "Publier un nouveau projet",
            variant: "primary"
          },
          {
            href: role === "freelance" ? "/dashboard/freelance/projects" : "/dashboard/client/projects",
            label: "Mes Projets",
            icon: FolderOpen,
            description: "Projets suivis et actifs",
            count: userStats.activeProjects
          },
          {
            href: "/projects/apply",
            label: "Postuler",
            icon: FileText,
            description: "Candidater aux projets"
          }
        ]
      },
      {
        href: "/ai-matching",
        label: "Matching IA",
        icon: Zap,
        description: "Intelligence artificielle",
        badge: "AI",
        children: [
          {
            href: "/ai-matching",
            label: "Vue d'ensemble",
            icon: Zap,
            description: "Tableau de bord IA"
          },
          {
            href: "/ai-matching/freelancers",
            label: "Pour Freelancers",
            icon: User,
            description: "Projets recommandés"
          },
          {
            href: "/ai-matching/clients",
            label: "Pour Clients",
            icon: Building,
            description: "Talents recommandés"
          },
          {
            href: "/test/aimatching",
            label: "Test Matching",
            icon: Lightbulb,
            description: "Tester l'algorithme",
            badge: "Test"
          }
        ]
      },
      {
        href: "/freelancers",
        label: "Talents",
        icon: Users,
        description: "Découvrir les freelancers",
        children: [
          {
            href: "/freelancers",
            label: "Explorer Talents",
            icon: Search,
            description: "Parcourir les profils"
          },
          {
            href: "/talents",
            label: "Top Talents",
            icon: Star,
            description: "Meilleurs freelancers"
          }
        ]
      },
      {
        href: "/gigs",
        label: "Services",
        icon: Star,
        description: "Services prédéfinis",
        children: [
          {
            href: "/gigs",
            label: "Découvrir Services",
            icon: Search,
            description: "Parcourir les gigs"
          },
          {
            href: "/gigs/create",
            label: "Créer Service",
            icon: Plus,
            description: "Publier un nouveau gig"
          },
          {
            href: "/services",
            label: "Catégories",
            icon: Folder,
            description: "Services par catégorie"
          }
        ]
      },
      {
        href: "/messages",
        label: "Messagerie",
        icon: MessageSquare,
        description: "Communications",
        count: userStats.unreadMessages,
        children: [
          {
            href: "/messages",
            label: "Conversations",
            icon: MessageSquare,
            description: "Mes messages"
          },
          {
            href: "/messages/new",
            label: "Nouveau Message",
            icon: Plus,
            description: "Démarrer une conversation"
          }
        ]
      },
      {
        href: "/dashboard/workspace",
        label: "Workspace",
        icon: Workflow,
        description: "Espace de travail",
        badge: "Beta",
        children: [
          {
            href: "/dashboard/workspace",
            label: "Mes Workspaces",
            icon: Workflow,
            description: "Espaces de travail"
          },
          {
            href: "/ide",
            label: "IDE en Ligne",
            icon: Code,
            description: "Éditeur de code",
            badge: "Nouveau"
          },
          {
            href: "/video",
            label: "Vidéo Conférence",
            icon: Video,
            description: "Appels et réunions"
          }
        ]
      },
      {
        href: "/dashboard/academy",
        label: "Academy",
        icon: GraduationCap,
        description: "Formation et développement",
        children: [
          {
            href: "/dashboard/academy",
            label: "Cours",
            icon: GraduationCap,
            description: "Formations disponibles"
          },
          {
            href: "/dashboard/skill-tests",
            label: "Tests Compétences",
            icon: Award,
            description: "Certifications"
          },
          {
            href: "/blog",
            label: "Blog",
            icon: BookOpen,
            description: "Articles et actualités"
          }
        ]
      },
      {
        href: "/dashboard/analytics",
        label: "Analytics",
        icon: BarChart3,
        description: "Statistiques et suivi",
        children: [
          {
            href: "/dashboard/analytics",
            label: "Tableau de Bord",
            icon: BarChart3,
            description: "Vue d'ensemble"
          },
          {
            href: "/dashboard/tracking",
            label: "Suivi Temps",
            icon: Clock,
            description: "Tracking du travail"
          },
          {
            href: role === "freelance" ? "/dashboard/freelance/applications" : "/dashboard/client/proposals",
            label: "Candidatures",
            icon: FileText,
            description: "Suivi des postulations",
            count: userStats.pendingApplications
          }
        ]
      },
      {
        href: "/orders",
        label: "Paiements",
        icon: DollarSign,
        description: "Commandes et facturation",
        children: [
          {
            href: "/orders",
            label: "Commandes",
            icon: DollarSign,
            description: "Historique des paiements"
          },
          {
            href: "/dashboard/referrals",
            label: "Parrainage",
            icon: Users,
            description: "Programme de référencement"
          },
          {
            href: "/pricing",
            label: "Tarifs",
            icon: Crown,
            description: "Plans et abonnements"
          }
        ]
      },
      {
        href: "/dashboard/settings",
        label: "Paramètres",
        icon: Settings,
        description: "Configuration du compte",
        children: [
          {
            href: "/profile",
            label: "Mon Profil",
            icon: User,
            description: "Profil public"
          },
          {
            href: "/dashboard/settings",
            label: "Paramètres",
            icon: Settings,
            description: "Configuration compte"
          },
          {
            href: "/onboarding",
            label: "Onboarding",
            icon: Rocket,
            description: "Compléter mon profil"
          }
        ]
      }
    ]
  }

  const getUserInitials = () => {
    if (!userData?.name) return "U"
    return userData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
  }

  const getPlanBadge = () => {
    const plan = userData?.plan || 'free'
    const plans = {
      free: { label: 'Gratuit', color: 'bg-gray-100 text-gray-800' },
      pro: { label: 'PRO', color: 'bg-blue-100 text-blue-800' },
      business: { label: 'Business', color: 'bg-purple-100 text-purple-800' },
      enterprise: { label: 'Enterprise', color: 'bg-green-100 text-green-800' }
    }
    return plans[plan as keyof typeof plans] || plans.free
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

    return (
      <div key={menu.href} className="select-none">
        <div className={cn(
          "flex items-center gap-2 rounded-lg transition-all duration-200",
          level === 0 ? "mb-1" : "mb-0.5"
        )}>
          {/* Toggle button for parent items */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-transparent"
              onClick={() => toggleMenu(menu.label)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-gray-500" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-500" />
              )}
            </Button>
          )}
          
          {/* Spacer for child items */}
          {!hasChildren && level > 0 && (
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
            </div>
          )}

          {/* Menu item link */}
          <Link
            href={menu.href}
            className={cn(
              "group flex flex-1 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25"
                : isChildActive
                  ? "bg-blue-50 text-blue-600 border border-blue-100"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-100",
              menu.variant === "primary" && "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700",
              level > 0 && "ml-2"
            )}
            onClick={(e) => {
              if (hasChildren) {
                e.preventDefault()
                toggleMenu(menu.label)
              }
            }}
          >
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
              isActive 
                ? "bg-white/20" 
                : menu.variant === "primary" 
                  ? "bg-white/20" 
                  : isChildActive
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 group-hover:bg-blue-100 group-hover:text-blue-600"
            )}>
              <Icon className={cn(
                "h-4 w-4",
                isActive || menu.variant === "primary" ? "text-white" : isChildActive ? "text-blue-600" : "text-gray-600"
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate">{menu.label}</span>
                {menu.badge && (
                  <Badge variant="secondary" className={cn(
                    "text-xs",
                    isActive ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                  )}>
                    {menu.badge}
                  </Badge>
                )}
              </div>
              {menu.description && (
                <p className={cn(
                  "text-xs truncate mt-0.5",
                  isActive ? "text-blue-100" : "text-gray-500"
                )}>
                  {menu.description}
                </p>
              )}
            </div>

            {menu.count !== undefined && menu.count > 0 && (
              <Badge variant="default" className={cn(
                "ml-auto text-xs min-w-6 h-6 flex items-center justify-center",
                isActive ? "bg-white text-blue-600" : "bg-blue-600 text-white"
              )}>
                {menu.count > 99 ? "99+" : menu.count}
              </Badge>
            )}
          </Link>
        </div>

        {/* Child items */}
        {hasChildren && isExpanded && (
          <div className={cn(
            "ml-4 space-y-1 border-l border-gray-200",
            level === 0 ? "mt-1" : "mt-0.5"
          )}>
            {menu.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col w-80 border-r border-gray-200 bg-white/95 backdrop-blur-sm flex-shrink-0">
      {/* Header avec logo et infos utilisateur */}
      <div className="border-b border-gray-200 p-6 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 ">
            <Image src={"/logo.png"} width={40} height={40} alt="logo.png"/>
          </div>
          <div>
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              NRB<span className="text-blue-600">Talents</span>
            </Link>
            <p className="text-xs text-gray-500 mt-1">Plateforme Freelance</p>
          </div>
        </div>

        {/* Carte utilisateur */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
              <AvatarImage src={userData?.avatar} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{userData?.name || "Utilisateur"}</h3>
              <p className="text-sm text-gray-600 capitalize">{role === "freelance" ? "Freelancer" : "Client"}</p>
            </div>
          </div>
          
   
        </div>
      </div>

      {/* Navigation principale avec structure arborescente */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {getMenuStructure().map(menu => renderMenuItem(menu))}
      </div>

      {/* Footer avec notifications et déconnexion */}
      <div className="border-t border-gray-200 p-4 bg-gray-50/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <NotificationsDropdown />
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-gray-600 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
        
        {/* Stats rapides */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {role === "freelance" ? (
              <>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{userStats.activeProjects || 0}</div>
                  <div className="text-gray-500">Projets actifs</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{userStats.pendingApplications || 0}</div>
                  <div className="text-gray-500">En attente</div>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{userStats.activeProjects || 0}</div>
                  <div className="text-gray-500">Projets ouverts</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{userStats.pendingApplications || 0}</div>
                  <div className="text-gray-500">Candidatures</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}