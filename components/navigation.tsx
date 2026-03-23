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
  Mail, Info, ArrowRight, ShoppingBag, GraduationCap, Headphones,
  Search
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
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

// ─── Types ─────────────────────────────────────────────────────────────────
interface MegaItem {
  href: string
  label: string
  description: string
  icon: React.ReactNode
  badge?: string
}

interface MegaGroup {
  title: string
  items: MegaItem[]
}

// ─── Component ────────────────────────────────────────────────────────────
export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dict, setDict] = useState<any>(null)
  const [lang, setLang] = useState<Locale>("fr")
  const pathname = usePathname()
  const params = useParams()
  const { data: session } = useSession()

  // ─── Load dictionary ────────────────────────────────────────────────────
  useEffect(() => {
    const l = (params.lang as Locale) || "fr"
    setLang(l)
    getDictionarySafe(l).then(setDict)
  }, [params.lang])

  // ─── Scroll effect ──────────────────────────────────────────────────────
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  // ─── Close mobile menu on route change ─────────────────────────────────
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // ─── Translation helper ────────────────────────────────────────────────
  const t = (key: string, fallback = key): string => {
    if (!dict) return fallback
    let v: any = dict
    for (const k of key.split(".")) {
      if (v && typeof v === "object") v = v[k]
      else return fallback
    }
    return v || fallback
  }

  // ─── Active link detection ─────────────────────────────────────────────
  const isActive = (href: string) => {
    if (href === "#") return false
    if (href === `/${lang}`) return pathname === `/${lang}` || pathname === `/${lang}/`
    return pathname.startsWith(href)
  }

  // ─── Language switcher ─────────────────────────────────────────────────
  const switchLang = (code: string) => {
    const rest = pathname.split("/").slice(2).join("/")
    window.location.href = `/${code}/${rest}`
  }

  // ─── Navigation items for mobile ───────────────────────────────────────
  const mobileNavItems = [
    { href: `/${lang}`, label: "Accueil", icon: <Home className="h-5 w-5" /> },
    { href: `/${lang}/talents`, label: "Talents", icon: <Users className="h-5 w-5" /> },
    { href: `/${lang}/gigs`, label: "Services", icon: <Zap className="h-5 w-5" /> },
    { href: `/${lang}/projects`, label: "Projets", icon: <Rocket className="h-5 w-5" /> },
    { href: `/${lang}/ai-matching`, label: "AI Matching", icon: <Sparkles className="h-5 w-5" /> },
  ]

  // ─── Marketplace items for mobile accordion ────────────────────────────
  const marketplaceItems = [
    { href: `/${lang}/talents`, label: "Talents", desc: "Parcourir tous les freelances", icon: <Users className="h-4 w-4" /> },
    { href: `/${lang}/freelancers`, label: "Freelancers", desc: "Profils vérifiés", icon: <UserCheck className="h-4 w-4" /> },
    { href: `/${lang}/ai-matching`, label: "AI Matching", desc: "Trouver le profil parfait", icon: <Sparkles className="h-4 w-4" />, badge: "AI" },
    { href: `/${lang}/gigs`, label: "Gigs", desc: "Services proposés", icon: <Zap className="h-4 w-4" /> },
    { href: `/${lang}/projects`, label: "Projets", desc: "Missions & appels d'offres", icon: <Briefcase className="h-4 w-4" /> },
  ]

  // ─── Workspace items for mobile accordion ──────────────────────────────
  const workspaceItems = [
    { href: `/${lang}/dashboard`, label: "Tableau de bord", desc: "Vue d'ensemble", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: `/${lang}/dashboard/messages`, label: "Messages", desc: "Conversations", icon: <MessageCircle className="h-4 w-4" /> },
    { href: `/${lang}/calendar`, label: "Calendrier", desc: "Planifier", icon: <Calendar className="h-4 w-4" /> },
    { href: `/${lang}/contracts`, label: "Contrats", desc: "Accords juridiques", icon: <ScrollText className="h-4 w-4" /> },
    { href: `/${lang}/dashboard/payment-methods`, label: "Paiements", desc: "Méthodes de paiement", icon: <CreditCard className="h-4 w-4" /> },
  ]

  // ─── Community items for mobile accordion ──────────────────────────────
  const communityItems = [
    { href: `/${lang}/dashboard/academy`, label: "Académie", desc: "Formations", icon: <GraduationCap className="h-4 w-4" />, badge: "New" },
    { href: `/${lang}/blog`, label: "Blog", desc: "Articles", icon: <TrendingUp className="h-4 w-4" /> },
    { href: `/${lang}/groups`, label: "Groupes", desc: "Communautés pros", icon: <Hash className="h-4 w-4" /> },
    { href: `/${lang}/ide`, label: "IDE Cloud", desc: "Codez dans le cloud", icon: <Code2 className="h-4 w-4" />, badge: "Beta" },
  ]

  // ─── Enterprise items for mobile accordion ─────────────────────────────
  const enterpriseItems = [
    { href: `/${lang}/enterprise`, label: "Solutions Entreprise", desc: "Pour grandes organisations", icon: <Building className="h-4 w-4" /> },
    { href: `/${lang}/pricing`, label: "Tarifs", desc: "Plans & abonnements", icon: <DollarSign className="h-4 w-4" /> },
    { href: `/${lang}/docs`, label: "Documentation", desc: "API & guides", icon: <FileText className="h-4 w-4" /> },
    { href: `/${lang}/faq`, label: "FAQ", desc: "Questions fréquentes", icon: <HelpCircle className="h-4 w-4" /> },
    { href: `/${lang}/contact`, label: "Contact", desc: "Parlez à notre équipe", icon: <Headphones className="h-4 w-4" /> },
  ]

  const externalLinks = [
    { name: "Upwork", href: "https://www.upwork.com", icon: <ExternalLink className="h-4 w-4" /> },
    { name: "Fiverr", href: "https://www.fiverr.com", icon: <ExternalLink className="h-4 w-4" /> },
    { name: "Toptal", href: "https://www.toptal.com", icon: <Star className="h-4 w-4" /> },
  ]

  const languages = [
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "mg", label: "Malagasy", flag: "🇲🇬" },
  ]

  const pill = "text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"

  if (!dict) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 border-b">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="h-7 w-20 bg-muted animate-pulse rounded" />
          <div className="h-7 w-7 bg-muted animate-pulse rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <>
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/98 backdrop-blur-2xl border-b border-border/60 shadow-sm"
          : "bg-background/95 backdrop-blur-xl border-b border-border/30"
      )}>
        <div className="px-3 sm:px-4">
          <div className="flex h-14 items-center justify-between">

            {/* ─── LOGO ──────────────────────────────────────────────────── */}
            <Link href={`/${lang}`} className="flex items-center gap-2 flex-shrink-0">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xs">NRB</span>
              </div>
              <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:inline">
                NRBTalents
              </span>
            </Link>

            {/* ─── CENTER - Search on mobile, empty on desktop ────────────── */}
            <div className="flex-1 flex justify-center">
              {/* Mobile: search button only */}
              <div className="sm:hidden">
                <SearchCommand variant="mobile" />
              </div>
            </div>

            {/* ─── RIGHT ACTIONS ─────────────────────────────────────────── */}
            <div className="flex items-center gap-1">

              {/* Desktop search */}
              <div className="hidden sm:block">
                <SearchCommand />
              </div>

              {/* Theme toggle */}
              <ThemeToggle />

              {/* Language selector - visible on all screens */}
              <div className="relative group">
                <button className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                  <Globe className="h-4 w-4" />
                  <span className="uppercase text-xs font-medium hidden sm:inline">{lang}</span>
                  <ChevronDown className="h-3 w-3 hidden sm:block" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border bg-popover shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {languages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => switchLang(l.code)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors",
                        lang === l.code && "bg-accent/50"
                      )}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                      {lang === l.code && <CheckCircle2 className="h-3 w-3 ml-auto text-green-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* User menu - visible on all screens */}
              <UserMenu dict={dict} lang={lang} />

              {/* Mobile menu button */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg sm:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>

                <SheetContent side="right" className="w-[85vw] max-w-[360px] p-0 flex flex-col">
                  {/* Header with logo and close */}
                  <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
                    <SheetTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">NRB</span>
                        </div>
                        <span className="font-bold text-base">NRBTalents</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="h-8 w-8">
                        <X className="h-4 w-4" />
                      </Button>
                    </SheetTitle>
                  </SheetHeader>

                  {/* Scrollable content */}
                  <div className="flex-1 overflow-y-auto">
                    {/* User info if logged in */}
                    {session?.user && (
                      <div className="p-4 border-b">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/30">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {session.user.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{session.user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5 capitalize">
                              {(session.user as any).role === "freelance" ? "Freelance" : "Client"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Main navigation links */}
                    <div className="p-3 space-y-1">
                      {mobileNavItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                            isActive(item.href)
                              ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-foreground border-l-2 border-blue-500"
                              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                          )}
                        >
                          <div className={cn(
                            "p-1.5 rounded-lg",
                            isActive(item.href) ? "bg-blue-500/20 text-blue-600" : "bg-accent/40"
                          )}>
                            {item.icon}
                          </div>
                          <span>{item.label}</span>
                          <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-50" />
                        </Link>
                      ))}
                    </div>

                    {/* Marketplace section */}
                    <div className="px-3 pt-2">
                      <details className="group">
                        <summary className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-accent/30">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-accent/40">
                              <Building className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium">Marketplace</span>
                          </div>
                          <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                        </summary>
                        <div className="pl-9 pt-1 pb-2 space-y-1">
                          {marketplaceItems.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent/50"
                            >
                              <div className="p-1 rounded-md bg-accent/30">{item.icon}</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-1">
                                  <span>{item.label}</span>
                                  {item.badge && <span className={pill + " bg-blue-500/20 text-blue-600"}>{item.badge}</span>}
                                </div>
                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </details>
                    </div>

                    {/* Workspace section */}
                    <div className="px-3 pt-1">
                      <details className="group">
                        <summary className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-accent/30">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-accent/40">
                              <LayoutDashboard className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium">Espace de travail</span>
                          </div>
                          <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                        </summary>
                        <div className="pl-9 pt-1 pb-2 space-y-1">
                          {workspaceItems.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent/50"
                            >
                              <div className="p-1 rounded-md bg-accent/30">{item.icon}</div>
                              <div className="flex-1">
                                <span>{item.label}</span>
                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </details>
                    </div>

                    {/* Community section */}
                    <div className="px-3 pt-1">
                      <details className="group">
                        <summary className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-accent/30">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-accent/40">
                              <Users className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium">Communauté</span>
                          </div>
                          <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                        </summary>
                        <div className="pl-9 pt-1 pb-2 space-y-1">
                          {communityItems.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent/50"
                            >
                              <div className="p-1 rounded-md bg-accent/30">{item.icon}</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-1">
                                  <span>{item.label}</span>
                                  {item.badge && <span className={pill + " bg-purple-500/20 text-purple-600"}>{item.badge}</span>}
                                </div>
                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </details>
                    </div>

                    {/* Enterprise section */}
                    <div className="px-3 pt-1">
                      <details className="group">
                        <summary className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-accent/30">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-accent/40">
                              <Building className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium">Entreprise</span>
                          </div>
                          <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                        </summary>
                        <div className="pl-9 pt-1 pb-2 space-y-1">
                          {enterpriseItems.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent/50"
                            >
                              <div className="p-1 rounded-md bg-accent/30">{item.icon}</div>
                              <div className="flex-1">
                                <span>{item.label}</span>
                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </details>
                    </div>

                    {/* External platforms */}
                    <div className="px-3 pt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-3 mb-2">
                        Plateformes partenaires
                      </p>
                      <div className="space-y-1">
                        {externalLinks.map((link) => (
                          <a
                            key={link.name}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                          >
                            {link.icon}
                            <span>{link.name}</span>
                            <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Auth section */}
                    <div className="p-4 border-t mt-3">
                      {session?.user ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full gap-2"
                          onClick={() => {
                            signOut({ callbackUrl: `/${lang}` })
                            setMobileOpen(false)
                          }}
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          Déconnexion
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                            <Link href={`/${lang}/auth/signup`} onClick={() => setMobileOpen(false)}>
                              <Rocket className="h-4 w-4 mr-2" />
                              S'inscrire gratuitement
                            </Link>
                          </Button>
                          <Button variant="outline" asChild className="w-full">
                            <Link href={`/${lang}/auth/signin`} onClick={() => setMobileOpen(false)}>
                              <User className="h-3.5 w-3.5 mr-2" />
                              Se connecter
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Footer links */}
                    <div className="px-4 pb-4">
                      <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
                        <Link href={`/${lang}/terms`} onClick={() => setMobileOpen(false)} className="hover:text-foreground">CGU</Link>
                        <Link href={`/${lang}/privacy`} onClick={() => setMobileOpen(false)} className="hover:text-foreground">Confidentialité</Link>
                        <Link href={`/${lang}/cookies`} onClick={() => setMobileOpen(false)} className="hover:text-foreground">Cookies</Link>
                        <Link href={`/${lang}/contact`} onClick={() => setMobileOpen(false)} className="hover:text-foreground">Contact</Link>
                      </div>
                      <p className="text-center text-[10px] text-muted-foreground mt-3">
                        © 2026 NRBTalents
                      </p>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}