// components/navigation/Navigation.tsx
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Menu, X, Sparkles, Rocket, Users, Zap, Settings, MessageCircle,
  User, LayoutDashboard, LogOut, Building, ChevronDown, ChevronRight,
  Home, Globe, Award, Code2, Calendar, DollarSign, Shield, Star,
  TrendingUp, FileText, HelpCircle, ExternalLink, CheckCircle2,
  Briefcase, BookOpen, Layers, CreditCard, UserCheck, BarChart3,
  Bell, Hash, GitBranch, Package, Cpu, ScrollText, Gavel,
  Mail, Info, ArrowRight, ShoppingBag, GraduationCap, Headphones
} from "lucide-react"
import { useState, useEffect } from "react"
import { UserMenu } from "@/components/user-menu"
import { SearchCommand } from "@/components/search-command"
import { ThemeToggle } from "@/components/theme-toggle"
import { usePathname, useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { signOut, useSession } from "next-auth/react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

// ─── Types ────────────────────────────────────────────────────────────────────
interface MegaItem {
  href: string
  label: string
  description: string
  icon: React.ReactNode
  badge?: string
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [dict, setDict] = useState<any>(null)
  const [lang, setLang] = useState<Locale>("fr")
  const pathname = usePathname()
  const params = useParams()
  const { data: session } = useSession()

  // Load dictionary
  useEffect(() => {
    const l = (params.lang as Locale) || "fr"
    setLang(l)
    getDictionarySafe(l).then(setDict)
  }, [params.lang])

  // Scroll effect
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
    setOpenDropdown(null)
  }, [pathname])

  const t = (key: string, fallback = key): string => {
    if (!dict) return fallback
    let v: any = dict
    for (const k of key.split(".")) {
      if (v && typeof v === "object") v = v[k]
      else return fallback
    }
    return v || fallback
  }

  const isActive = (href: string) => {
    if (href === "#") return false
    if (href === `/${lang}`) return pathname === `/${lang}` || pathname === `/${lang}/`
    return pathname.startsWith(href)
  }

  const switchLang = (code: string) => {
    const rest = pathname.split("/").slice(2).join("/")
    window.location.href = `/${code}/${rest}`
  }

  // Mega menu definitions
  const marketplaceItems: MegaItem[] = [
    { href: `/${lang}/talents`, label: "Talents", description: "Parcourir tous les freelances", icon: <Users className="h-4 w-4" /> },
    { href: `/${lang}/freelancers`, label: "Freelancers", description: "Profils vérifiés", icon: <UserCheck className="h-4 w-4" /> },
    { href: `/${lang}/ai-matching`, label: "AI Matching", description: "Trouver le profil parfait", icon: <Sparkles className="h-4 w-4" />, badge: "AI" },
    { href: `/${lang}/gigs`, label: "Gigs", description: "Services proposés", icon: <Zap className="h-4 w-4" /> },
    { href: `/${lang}/projects`, label: "Projets", description: "Missions & appels d'offres", icon: <Briefcase className="h-4 w-4" /> },
  ]

  const workspaceItems: MegaItem[] = [
    { href: `/${lang}/dashboard`, label: "Tableau de bord", description: "Vue d'ensemble", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: `/${lang}/dashboard/messages`, label: "Messages", description: "Conversations", icon: <MessageCircle className="h-4 w-4" /> },
    { href: `/${lang}/calendar`, label: "Calendrier", description: "Planifier", icon: <Calendar className="h-4 w-4" /> },
    { href: `/${lang}/contracts`, label: "Contrats", description: "Accords juridiques", icon: <ScrollText className="h-4 w-4" /> },
  ]

  const communityItems: MegaItem[] = [
    { href: `/${lang}/dashboard/academy`, label: "Académie", description: "Formations", icon: <GraduationCap className="h-4 w-4" />, badge: "New" },
    { href: `/${lang}/blog`, label: "Blog", description: "Articles", icon: <TrendingUp className="h-4 w-4" /> },
    { href: `/${lang}/groups`, label: "Groupes", description: "Communautés pros", icon: <Hash className="h-4 w-4" /> },
    { href: `/${lang}/ide`, label: "IDE Cloud", description: "Codez dans le cloud", icon: <Code2 className="h-4 w-4" />, badge: "Beta" },
  ]

  const enterpriseItems: MegaItem[] = [
    { href: `/${lang}/enterprise`, label: "Solutions Entreprise", description: "Pour grandes organisations", icon: <Building className="h-4 w-4" /> },
    { href: `/${lang}/pricing`, label: "Tarifs", description: "Plans & abonnements", icon: <DollarSign className="h-4 w-4" /> },
    { href: `/${lang}/docs`, label: "Documentation", description: "API & guides", icon: <FileText className="h-4 w-4" /> },
    { href: `/${lang}/contact`, label: "Contact", description: "Parlez à notre équipe", icon: <Headphones className="h-4 w-4" /> },
  ]

  const dropdowns = [
    { id: "marketplace", label: "Marketplace", items: marketplaceItems, icon: <Building className="h-4 w-4" /> },
    { id: "workspace", label: "Espace de travail", items: workspaceItems, icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "community", label: "Communauté", items: communityItems, icon: <Users className="h-4 w-4" /> },
    { id: "enterprise", label: "Entreprise", items: enterpriseItems, icon: <Building className="h-4 w-4" /> },
  ]

  const languages = [
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "mg", label: "Malagasy", flag: "🇲🇬" },
  ]

  const pill = "text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"

  if (!dict) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 border-b">
        <div className="mx-auto max-w-7xl px-4 h-full flex items-center justify-between">
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur-xl transition-all duration-300",
      scrolled ? "border-border/60 shadow-sm" : "border-border/40"
    )}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Logo */}
          <Link href={`/${lang}`} className="flex items-center gap-3 group flex-shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xs">NRB</span>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                NRBTalents
              </span>
              <span className="text-xs text-muted-foreground -mt-1">
                La révolution freelance
              </span>
            </div>
          </Link>

          {/* Desktop Navigation avec dropdowns */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {/* Home */}
            <Link
              href={`/${lang}`}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 whitespace-nowrap",
                isActive(`/${lang}`)
                  ? "text-foreground bg-accent/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
              )}
            >
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span>Accueil</span>
              </div>
            </Link>

            {/* Dropdown menus */}
            {dropdowns.map((dropdown) => (
              <div key={dropdown.id} className="relative group">
                <button
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 flex-shrink-0 whitespace-nowrap",
                    openDropdown === dropdown.id
                      ? "text-foreground bg-accent/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                  )}
                  onClick={() => setOpenDropdown(openDropdown === dropdown.id ? null : dropdown.id)}
                >
                  {dropdown.icon}
                  <span>{dropdown.label}</span>
                  <ChevronDown className={cn("h-3 w-3 transition-transform", openDropdown === dropdown.id && "rotate-180")} />
                </button>

                {/* Dropdown panel */}
                {openDropdown === dropdown.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                    <div className="absolute top-full left-0 mt-2 w-72 z-50">
                      <div className="rounded-xl border bg-popover shadow-xl overflow-hidden">
                        <div className="p-2">
                          {dropdown.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setOpenDropdown(null)}
                              className={cn(
                                "flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all",
                                isActive(item.href)
                                  ? "bg-accent/50"
                                  : "hover:bg-accent/30"
                              )}
                            >
                              <div className="mt-0.5 p-1.5 rounded-lg bg-accent/40">
                                {item.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{item.label}</span>
                                  {item.badge && (
                                    <span className={pill + " bg-blue-500/20 text-blue-600"}>{item.badge}</span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Actions Desktop */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            <SearchCommand />
            <ThemeToggle />

            {/* Language selector */}
            <div className="relative group">
              <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50">
                <Globe className="h-4 w-4" />
                <span className="uppercase text-xs font-medium">{lang}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border bg-popover shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => switchLang(l.code)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent",
                      lang === l.code && "bg-accent/50"
                    )}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-6 w-px bg-border" />
            <UserMenu dict={dict} lang={lang} />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <SearchCommand variant="mobile" />
            <ThemeToggle />
            <button
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-border/40 bg-background/95 backdrop-blur-xl lg:hidden animate-in slide-in-from-top duration-300 max-h-[calc(100vh-64px)] overflow-y-auto">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {/* Home */}
            <Link
              href={`/${lang}`}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all",
                isActive(`/${lang}`)
                  ? "bg-accent text-foreground border-l-4 border-blue-500"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Home className="h-5 w-5" />
              <span>Accueil</span>
            </Link>

            {/* Mobile dropdown sections */}
            {dropdowns.map((dropdown) => (
              <details key={dropdown.id} className="group">
                <summary className="flex items-center justify-between rounded-lg px-3 py-3 text-base font-medium cursor-pointer hover:bg-accent/50">
                  <div className="flex items-center gap-3">
                    {dropdown.icon}
                    <span>{dropdown.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                </summary>
                <div className="pl-10 pt-1 pb-2 space-y-1">
                  {dropdown.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                        isActive(item.href)
                          ? "bg-accent/50 text-foreground"
                          : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                      )}
                    >
                      <div className="p-1 rounded-md bg-accent/40">{item.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span>{item.label}</span>
                          {item.badge && <span className={pill + " bg-blue-500/20 text-blue-600"}>{item.badge}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </details>
            ))}

            {/* Mobile language selector */}
            <div className="px-3 py-3 border-t border-border/40 mt-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Langue</p>
              <div className="flex gap-2">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => switchLang(l.code)}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg text-sm text-center transition-all",
                      lang === l.code
                        ? "bg-blue-500 text-white"
                        : "bg-accent/30 hover:bg-accent/50"
                    )}
                  >
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* User section mobile */}
            <div className="px-3 pt-3 border-t border-border/40">
              {session?.user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {session.user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" asChild className="h-11">
                      <Link href={`/${lang}/dashboard`} onClick={() => setMobileOpen(false)}>
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="h-11">
                      <Link href={`/${lang}/profile`} onClick={() => setMobileOpen(false)}>
                        <User className="h-4 w-4 mr-2" />
                        Profil
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="h-11">
                      <Link href={`/${lang}/messages`} onClick={() => setMobileOpen(false)}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Messages
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="h-11">
                      <Link href={`/${lang}/dashboard/settings`} onClick={() => setMobileOpen(false)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Paramètres
                      </Link>
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => signOut({ callbackUrl: `/${lang}` })}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/${lang}/auth/signin`} onClick={() => setMobileOpen(false)}>
                      <User className="h-4 w-4 mr-2" />
                      Se connecter
                    </Link>
                  </Button>
                  <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                    <Link href={`/${lang}/auth/signup`} onClick={() => setMobileOpen(false)}>
                      <Rocket className="h-4 w-4 mr-2" />
                      S'inscrire gratuitement
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Footer mobile */}
            <div className="px-3 pt-4 pb-6 text-center">
              <p className="text-xs text-muted-foreground">© 2026 NRBTalents</p>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}