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
  Search, Heart
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

  // ─── Navigation items for desktop ──────────────────────────────────────
  const desktopNavItems = [
    { href: `/${lang}`, label: "Accueil", icon: <Home className="h-4 w-4" /> },
    { href: `/${lang}/talents`, label: "Talents", icon: <Users className="h-4 w-4" /> },
    { href: `/${lang}/gigs`, label: "Services", icon: <Zap className="h-4 w-4" /> },
    { href: `/${lang}/projects`, label: "Projets", icon: <Rocket className="h-4 w-4" /> },
    { href: `/${lang}/ai-matching`, label: "AI Matching", icon: <Sparkles className="h-4 w-4" /> },
  ]

  // ─── Mobile navigation items (full list for hamburger) ─────────────────
  const mobileNavSections = [
    {
      title: "Navigation principale",
      items: [
        { href: `/${lang}`, label: "Accueil", icon: <Home className="h-5 w-5" /> },
        { href: `/${lang}/talents`, label: "Talents", icon: <Users className="h-5 w-5" /> },
        { href: `/${lang}/gigs`, label: "Services", icon: <Zap className="h-5 w-5" /> },
        { href: `/${lang}/projects`, label: "Projets", icon: <Rocket className="h-5 w-5" /> },
        { href: `/${lang}/ai-matching`, label: "AI Matching", icon: <Sparkles className="h-5 w-5" /> },
      ],
    },
    {
      title: "Marketplace",
      items: [
        { href: `/${lang}/talents`, label: "Talents", icon: <Users className="h-4 w-4" />, desc: "Parcourir tous les freelances" },
        { href: `/${lang}/freelancers`, label: "Freelancers", icon: <UserCheck className="h-4 w-4" />, desc: "Profils vérifiés" },
        { href: `/${lang}/ai-matching`, label: "AI Matching", icon: <Sparkles className="h-4 w-4" />, desc: "Trouver le profil parfait", badge: "AI" },
        { href: `/${lang}/gigs`, label: "Gigs", icon: <Zap className="h-4 w-4" />, desc: "Services proposés" },
        { href: `/${lang}/projects`, label: "Projets", icon: <Briefcase className="h-4 w-4" />, desc: "Missions & appels d'offres" },
      ],
    },
    {
      title: "Espace de travail",
      items: [
        { href: `/${lang}/dashboard`, label: "Tableau de bord", icon: <LayoutDashboard className="h-4 w-4" />, desc: "Vue d'ensemble" },
        { href: `/${lang}/dashboard/messages`, label: "Messages", icon: <MessageCircle className="h-4 w-4" />, desc: "Conversations" },
        { href: `/${lang}/calendar`, label: "Calendrier", icon: <Calendar className="h-4 w-4" />, desc: "Planifier" },
        { href: `/${lang}/contracts`, label: "Contrats", icon: <ScrollText className="h-4 w-4" />, desc: "Accords juridiques" },
        { href: `/${lang}/dashboard/payment-methods`, label: "Paiements", icon: <CreditCard className="h-4 w-4" />, desc: "Méthodes de paiement" },
      ],
    },
    {
      title: "Communauté",
      items: [
        { href: `/${lang}/dashboard/academy`, label: "Académie", icon: <GraduationCap className="h-4 w-4" />, desc: "Formations", badge: "New" },
        { href: `/${lang}/blog`, label: "Blog", icon: <TrendingUp className="h-4 w-4" />, desc: "Articles" },
        { href: `/${lang}/groups`, label: "Groupes", icon: <Hash className="h-4 w-4" />, desc: "Communautés pros" },
        { href: `/${lang}/ide`, label: "IDE Cloud", icon: <Code2 className="h-4 w-4" />, desc: "Codez dans le cloud", badge: "Beta" },
      ],
    },
    {
      title: "Entreprise",
      items: [
        { href: `/${lang}/enterprise`, label: "Solutions Entreprise", icon: <Building className="h-4 w-4" />, desc: "Pour grandes organisations" },
        { href: `/${lang}/pricing`, label: "Tarifs", icon: <DollarSign className="h-4 w-4" />, desc: "Plans & abonnements" },
        { href: `/${lang}/docs`, label: "Documentation", icon: <FileText className="h-4 w-4" />, desc: "API & guides" },
        { href: `/${lang}/faq`, label: "FAQ", icon: <HelpCircle className="h-4 w-4" />, desc: "Questions fréquentes" },
        { href: `/${lang}/contact`, label: "Contact", icon: <Headphones className="h-4 w-4" />, desc: "Parlez à notre équipe" },
      ],
    },
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

            {/* ─── DESKTOP NAVIGATION (visible sur tablette et desktop) ───── */}
            <div className="hidden sm:flex items-center gap-1 flex-1 justify-center">
              {desktopNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    isActive(item.href)
                      ? "text-foreground bg-accent/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* ─── RIGHT ACTIONS ─────────────────────────────────────────── */}
            <div className="flex items-center gap-1">

              {/* Search - visible sur desktop et mobile */}
              <div className="hidden sm:block">
                <SearchCommand />
              </div>
              <div className="sm:hidden">
                <SearchCommand variant="mobile" />
              </div>

              {/* Theme toggle */}
              <ThemeToggle />

              {/* Language selector */}
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

              {/* User menu */}
              <UserMenu dict={dict} lang={lang} />

              {/* Mobile menu button - visible uniquement sur mobile */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg sm:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>

                <SheetContent side="right" className="w-[85vw] max-w-[360px] p-0 flex flex-col">
                  {/* Header */}
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
                  <div className="flex-1 overflow-y-auto pb-20">
                    
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

                    {/* ALL MOBILE NAVIGATION SECTIONS */}
                    {mobileNavSections.map((section, idx) => (
                      <div key={idx} className="px-3 pt-4 first:pt-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 px-2 mb-2">
                          {section.title}
                        </p>
                        <div className="space-y-1">
                          {section.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
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
                              <div className="flex-1">
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">{item.label}</span>
                                  {(item as any).badge && (
                                    <span className={pill + " bg-blue-500/20 text-blue-600"}>{ (item as any).badge }</span>
                                  )}
                                </div>
                                {(item as any).desc && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{(item as any).desc}</p>
                                )}
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* External platforms */}
                    <div className="px-3 pt-6">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 px-2 mb-2">
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
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                          >
                            <div className="p-1.5 rounded-lg bg-accent/40">
                              {link.icon}
                            </div>
                            <span>{link.name}</span>
                            <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-50" />
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Auth section */}
                    <div className="p-4 border-t mt-4">
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
                    <div className="px-4 pb-6">
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