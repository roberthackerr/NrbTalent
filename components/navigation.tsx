// components/navigation/Navigation.tsx
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Menu, X, Sparkles, Rocket, Users, Zap, Settings, MessageCircle,
  User, LayoutDashboard, LogOut, Building, ChevronDown, ChevronRight,
  Home, Globe, Award, Code2, Calendar, DollarSign, Shield, Star,
  TrendingUp, Video, FileText, HelpCircle, ExternalLink, CheckCircle2,
  Briefcase, BookOpen, Layers, CreditCard, UserCheck, BarChart3,
  Bell, Hash, GitBranch, Package, Cpu, ScrollText, Gavel, Cookie,
  Mail, Info, ArrowRight, Zap as ZapIcon,
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
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion"
import { MeetButtonCompact } from "./meet/MeetButton"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

// ─── Types ────────────────────────────────────────────────────────────────────
interface MegaItem {
  href: string
  label: string
  description: string
  icon: React.ReactNode
  badge?: string
  highlight?: boolean
}

interface MegaGroup {
  title: string
  items: MegaItem[]
}

interface MegaMenu {
  label: string
  groups: MegaGroup[]
  cta?: { label: string; href: string; icon: React.ReactNode }
}

// ─── Styles helpers ───────────────────────────────────────────────────────────
const pill =
  "text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
const navBtn = (active: boolean) =>
  cn(
    "relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 select-none cursor-pointer group",
    active
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground"
  )

// ─── Component ────────────────────────────────────────────────────────────────
export function Navigation() {
  const [scrolled, setScrolled]             = useState(false)
  const [mobileOpen, setMobileOpen]         = useState(false)
  const [openMenu, setOpenMenu]             = useState<string | null>(null)
  const [dict, setDict]                     = useState<any>(null)
  const [lang, setLang]                     = useState<Locale>("fr")
  const pathname  = usePathname()
  const params    = useParams()
  const { data: session } = useSession()
  const navRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const l = (params.lang as Locale) || "fr"
    setLang(l)
    getDictionarySafe(l).then(setDict)
  }, [params.lang])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  useEffect(() => { setMobileOpen(false); setOpenMenu(null) }, [pathname])

  // Close mega menu on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [])

  const t = (key: string, fallback = key): string => {
    if (!dict) return fallback
    let v: any = dict
    for (const k of key.split(".")) {
      if (v && typeof v === "object") v = v[k]; else return fallback
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

  // ── Mega menu definitions ──────────────────────────────────────────────────
  const megas: Record<string, MegaMenu> = {
    marketplace: {
      label: "Marketplace",
      cta: { label: "Poster un projet", href: `/${lang}/projects/create`, icon: <Rocket className="h-3.5 w-3.5" /> },
      groups: [
        {
          title: "Trouver des talents",
          items: [
            { href: `/${lang}/talents`,           label: "Talents",         description: "Parcourir tous les freelances", icon: <Users className="h-4 w-4" /> },
            { href: `/${lang}/freelancers`,        label: "Freelancers",     description: "Profils vérifiés & disponibles", icon: <UserCheck className="h-4 w-4" /> },
            { href: `/${lang}/ai-matching`,        label: "AI Matching",     description: "Trouver le profil parfait par IA", icon: <Sparkles className="h-4 w-4" />, badge: "IA", highlight: true },
            { href: `/${lang}/ai-matching/clients`,label: "Matching Clients",description: "Recommandations pour clients", icon: <Sparkles className="h-4 w-4" /> },
          ],
        },
        {
          title: "Trouver du travail",
          items: [
            { href: `/${lang}/gigs`,               label: "Gigs",            description: "Services proposés par des pros", icon: <Zap className="h-4 w-4" /> },
            { href: `/${lang}/gigs/create`,        label: "Créer un Gig",    description: "Proposez vos services", icon: <Package className="h-4 w-4" /> },
            { href: `/${lang}/projects`,           label: "Projets",         description: "Missions & appels d'offres", icon: <Briefcase className="h-4 w-4" /> },
            { href: `/${lang}/ai-matching/freelancers`, label: "Matching Freelances", description: "Projets correspondant à vos skills", icon: <Cpu className="h-4 w-4" /> },
          ],
        },
      ],
    },

    workspace: {
      label: "Espace de travail",
      cta: { label: "Mon Dashboard", href: `/${lang}/dashboard`, icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
      groups: [
        {
          title: "Gestion",
          items: [
            { href: `/${lang}/dashboard/messages`,    label: "Messages",        description: "Conversations & notifications", icon: <MessageCircle className="h-4 w-4" /> },
            { href: `/${lang}/calendar`,              label: "Calendrier",      description: "Planifier vos rendez-vous", icon: <Calendar className="h-4 w-4" /> },
            { href: `/${lang}/contracts`,             label: "Contrats",        description: "Gérez vos accords juridiques", icon: <ScrollText className="h-4 w-4" /> },
            { href: `/${lang}/orders`,                label: "Commandes",       description: "Suivi des commandes actives", icon: <Package className="h-4 w-4" /> },
          ],
        },
        {
          title: "Finance & Équipes",
          items: [
            { href: `/${lang}/dashboard/payment-methods`, label: "Paiements",      description: "Méthodes de paiement & historique", icon: <CreditCard className="h-4 w-4" /> },
            { href: `/${lang}/dashboard/referrals`,       label: "Parrainage",      description: "Invitez & gagnez des récompenses", icon: <GitBranch className="h-4 w-4" /> },
            { href: `/${lang}/teams`,                     label: "Équipes",         description: "Gérez vos équipes de travail", icon: <Users className="h-4 w-4" /> },
            { href: `/${lang}/team/contracts`,            label: "Contrats Équipe", description: "Contrats collectifs & missions", icon: <Gavel className="h-4 w-4" /> },
          ],
        },
      ],
    },

    community: {
      label: "Communauté",
      cta: { label: "Voir tous les groupes", href: `/${lang}/groups`, icon: <Hash className="h-3.5 w-3.5" /> },
      groups: [
        {
          title: "Apprendre & Grandir",
          items: [
            { href: `/${lang}/dashboard/academy`,  label: "Académie",        description: "Formations & certifications", icon: <Award className="h-4 w-4" />, badge: "Nouveau" },
            { href: `/${lang}/blog`,               label: "Blog",            description: "Articles & tendances du secteur", icon: <TrendingUp className="h-4 w-4" /> },
            { href: `/${lang}/news`,               label: "Actualités",      description: "Dernières nouvelles NRBTalents", icon: <Bell className="h-4 w-4" /> },
            { href: `/${lang}/how-it-works`,       label: "Comment ça marche", description: "Guide complet de la plateforme", icon: <BookOpen className="h-4 w-4" /> },
          ],
        },
        {
          title: "Groupes & Réseau",
          items: [
            { href: `/${lang}/groups`,             label: "Groupes",         description: "Rejoignez des communautés pros", icon: <Hash className="h-4 w-4" /> },
            { href: `/${lang}/groups/create`,      label: "Créer un groupe", description: "Lancez votre propre communauté", icon: <Layers className="h-4 w-4" /> },
            { href: `/${lang}/groups/my-groups`,   label: "Mes groupes",     description: "Groupes que vous gérez", icon: <Users className="h-4 w-4" /> },
            { href: `/${lang}/ide`,                label: "IDE Cloud",       description: "Codez directement dans le cloud", icon: <Code2 className="h-4 w-4" />, badge: "Beta" },
          ],
        },
      ],
    },

    enterprise: {
      label: "Entreprise",
      cta: { label: "Contacter les ventes", href: `/${lang}/contact-sales`, icon: <Mail className="h-3.5 w-3.5" /> },
      groups: [
        {
          title: "Solutions",
          items: [
            { href: `/${lang}/enterprise`,         label: "Solutions Entreprise", description: "Pour les grandes organisations", icon: <Building className="h-4 w-4" /> },
            { href: `/${lang}/teams/dashboard`,    label: "Dashboard Équipe",     description: "Vue d'ensemble de votre équipe", icon: <BarChart3 className="h-4 w-4" /> },
            { href: `/${lang}/pricing`,            label: "Tarifs",               description: "Plans & abonnements", icon: <DollarSign className="h-4 w-4" /> },
            { href: `/${lang}/admin/verification`, label: "Vérification Admin",   description: "Accès administration", icon: <Shield className="h-4 w-4" /> },
          ],
        },
        {
          title: "Support & Docs",
          items: [
            { href: `/${lang}/docs`,               label: "Documentation",   description: "API & guides développeurs", icon: <FileText className="h-4 w-4" /> },
            { href: `/${lang}/faq`,                label: "FAQ",             description: "Questions fréquentes", icon: <HelpCircle className="h-4 w-4" /> },
            { href: `/${lang}/contact`,            label: "Contact",         description: "Parlez à notre équipe", icon: <Mail className="h-4 w-4" /> },
            { href: `/${lang}/about`,              label: "À propos",        description: "Notre histoire & mission", icon: <Info className="h-4 w-4" /> },
          ],
        },
      ],
    },
  }

  const languages = [
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "en", label: "English",  flag: "🇬🇧" },
    { code: "mg", label: "Malagasy", flag: "🇲🇬" },
  ]

  // ─── Loading skeleton ────────────────────────────────────────────────────
  if (!dict) return (
    <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-xl border-b border-border/40">
      <div className="mx-auto max-w-7xl px-4 h-full flex items-center justify-between">
        <div className="h-8 w-32 bg-muted animate-pulse rounded-xl" />
        <div className="flex gap-2">
          {[80, 96, 80, 64, 80].map((w, i) => (
            <div key={i} className={`h-7 w-${w === 80 ? '20' : w === 96 ? '24' : w === 64 ? '16' : '20'} bg-muted animate-pulse rounded-lg`}
              style={{ width: w }} />
          ))}
        </div>
        <div className="h-8 w-24 bg-muted animate-pulse rounded-xl" />
      </div>
    </div>
  )

  return (
    <div ref={navRef}>
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/98 backdrop-blur-2xl border-b border-border/60 shadow-[0_1px_20px_rgba(0,0,0,0.08)]"
          : "bg-background/95 backdrop-blur-xl border-b border-border/30"
      )}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center gap-4">

            {/* ── Logo ──────────────────────────────────────────────── */}
            <Link href={`/${lang}`}
              className="flex items-center gap-2.5 group flex-shrink-0"
              onClick={() => setOpenMenu(null)}>
              <div className="relative">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-shadow">
                  <span className="text-white font-black text-xs tracking-tight">NRB</span>
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400 to-purple-600 opacity-0 group-hover:opacity-20 blur-sm transition-opacity" />
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-base font-black bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                  NRBTalents
                </span>
                <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  {t("navigation.tagline", "Freelance Platform")}
                </span>
              </div>
            </Link>

            {/* ── Desktop mega nav ──────────────────────────────────── */}
            <div className="hidden lg:flex items-center gap-0.5 flex-1">
              {/* Home */}
              <Link href={`/${lang}`}
                className={navBtn(isActive(`/${lang}`))}
                onClick={() => setOpenMenu(null)}>
                <Home className="h-3.5 w-3.5" />
                <span>Accueil</span>
                {isActive(`/${lang}`) && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
                )}
              </Link>

              {/* Mega menus */}
              {Object.entries(megas).map(([key, mega]) => {
                const isOpen = openMenu === key
                const anyActive = mega.groups.some(g =>
                  g.items.some(item => isActive(item.href))
                )
                return (
                  <button
                    key={key}
                    className={navBtn(anyActive || isOpen)}
                    onClick={() => setOpenMenu(isOpen ? null : key)}
                    onMouseEnter={() => setOpenMenu(key)}
                  >
                    <span>{mega.label}</span>
                    <ChevronDown className={cn(
                      "h-3 w-3 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )} />
                    {(anyActive) && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
                    )}
                  </button>
                )
              })}

              {/* Meet */}
              <MeetButtonCompact />
            </div>

            {/* ── Desktop right actions ─────────────────────────────── */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              <SearchCommand />
              <ThemeToggle />

              {/* Lang */}
              <div className="relative group">
                <button className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all">
                  <Globe className="h-3.5 w-3.5" />
                  <span className="uppercase">{lang}</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
                <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl border border-border/60 bg-popover shadow-xl shadow-black/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 overflow-hidden z-50">
                  {languages.map((l) => (
                    <button key={l.code} onClick={() => switchLang(l.code)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent/50 transition-colors",
                        lang === l.code && "bg-accent/30"
                      )}>
                      <span className="text-base leading-none">{l.flag}</span>
                      <span className="flex-1 text-left font-medium">{l.label}</span>
                      {lang === l.code && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-5 w-px bg-border/60 mx-1" />

              {!session?.user ? (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild className="h-8 px-3 text-sm">
                    <Link href={`/${lang}/auth/signin`}>Connexion</Link>
                  </Button>
                  <Button size="sm" asChild
                    className="h-8 px-4 text-sm bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-md shadow-violet-500/20 border-0">
                    <Link href={`/${lang}/auth/signup`}>
                      <Rocket className="h-3.5 w-3.5 mr-1.5" />
                      S'inscrire
                    </Link>
                  </Button>
                </div>
              ) : (
                <UserMenu dict={dict} lang={lang} />
              )}
            </div>

            {/* ── Mobile actions ────────────────────────────────────── */}
            <div className="flex items-center gap-1.5 lg:hidden ml-auto">
              <SearchCommand variant="mobile" />
              <ThemeToggle />
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full max-w-[340px] p-0 flex flex-col border-l border-border/60">
                  <SheetHeader className="px-5 py-4 border-b border-border/40 flex-shrink-0">
                    <SheetTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-black text-[11px]">NRB</span>
                        </div>
                        <span className="font-bold text-sm">NRBTalents</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {languages.map((l) => (
                          <button key={l.code} onClick={() => switchLang(l.code)}
                            className={cn(
                              "text-base px-1.5 py-0.5 rounded-lg transition-colors",
                              lang === l.code ? "bg-accent" : "hover:bg-accent/50"
                            )}>
                            {l.flag}
                          </button>
                        ))}
                      </div>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto overscroll-contain">
                    <div className="px-3 py-3 space-y-1">

                      {/* Home */}
                      <Link href={`/${lang}`} onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                          isActive(`/${lang}`)
                            ? "bg-gradient-to-r from-blue-500/10 to-violet-500/10 text-foreground border border-blue-500/20"
                            : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                        )}>
                        <div className="p-1.5 rounded-lg bg-accent/50"><Home className="h-4 w-4" /></div>
                        Accueil
                        <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                      </Link>

                      {/* Mobile mega accordions */}
                      <Accordion type="single" collapsible className="space-y-1">
                        {Object.entries(megas).map(([key, mega]) => {
                          const anyActive = mega.groups.some(g => g.items.some(i => isActive(i.href)))
                          return (
                            <AccordionItem key={key} value={key}
                              className={cn(
                                "border rounded-xl overflow-hidden",
                                anyActive ? "border-blue-500/30" : "border-border/40"
                              )}>
                              <AccordionTrigger className={cn(
                                "px-3 py-2.5 text-sm font-semibold hover:no-underline transition-colors [&>svg]:h-4 [&>svg]:w-4",
                                anyActive
                                  ? "bg-gradient-to-r from-blue-500/5 to-violet-500/5 text-foreground"
                                  : "hover:bg-accent/30 text-muted-foreground"
                              )}>
                                {mega.label}
                              </AccordionTrigger>
                              <AccordionContent className="pb-2">
                                {mega.groups.map((group) => (
                                  <div key={group.title} className="px-2 pt-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-2 mb-1.5">
                                      {group.title}
                                    </p>
                                    {group.items.map((item) => (
                                      <Link key={item.href} href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={cn(
                                          "flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-all",
                                          isActive(item.href)
                                            ? "bg-blue-500/10 text-foreground"
                                            : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                                        )}>
                                        <div className={cn(
                                          "p-1 rounded-md flex-shrink-0",
                                          isActive(item.href) ? "bg-blue-500/20 text-blue-600 dark:text-blue-400" : "bg-accent/40"
                                        )}>
                                          {item.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">{item.label}</span>
                                            {item.badge && (
                                              <span className={cn(pill,
                                                item.highlight
                                                  ? "bg-gradient-to-r from-blue-500 to-violet-500 text-white"
                                                  : "bg-accent text-muted-foreground"
                                              )}>
                                                {item.badge}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
                                        </div>
                                      </Link>
                                    ))}
                                  </div>
                                ))}
                                {mega.cta && (
                                  <div className="px-2 pt-3">
                                    <Link href={mega.cta.href} onClick={() => setMobileOpen(false)}
                                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 text-sm font-semibold text-foreground hover:from-blue-500/20 hover:to-violet-500/20 transition-all">
                                      {mega.cta.icon}
                                      {mega.cta.label}
                                      <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                                    </Link>
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          )
                        })}
                      </Accordion>

                      {/* Meet button */}
                      <div className="pt-1">
                        <MeetButtonCompact />
                      </div>
                    </div>

                    {/* User section */}
                    <div className="px-3 pb-4 pt-2 border-t border-border/40 space-y-3 mt-2">
                      {session?.user ? (
                        <>
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border border-border/40">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                              {session.user.name?.charAt(0).toUpperCase() ?? "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{session.user.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { href: `/${lang}/dashboard`,          icon: <LayoutDashboard className="h-3.5 w-3.5" />, label: "Dashboard" },
                              { href: `/${lang}/profile`,            icon: <User className="h-3.5 w-3.5" />,            label: "Profil" },
                              { href: `/${lang}/dashboard/messages`, icon: <MessageCircle className="h-3.5 w-3.5" />,   label: "Messages" },
                              { href: `/${lang}/dashboard/settings`, icon: <Settings className="h-3.5 w-3.5" />,        label: "Paramètres" },
                            ].map(({ href, icon, label }) => (
                              <Button key={href} variant="outline" size="sm" asChild
                                className="h-auto py-2.5 flex-col gap-1 text-[11px] border-border/60">
                                <Link href={href} onClick={() => setMobileOpen(false)}>
                                  {icon}<span>{label}</span>
                                </Link>
                              </Button>
                            ))}
                          </div>
                          <Button variant="destructive" size="sm" className="w-full gap-2 h-9"
                            onClick={() => { signOut({ callbackUrl: `/${lang}` }); setMobileOpen(false) }}>
                            <LogOut className="h-3.5 w-3.5" />
                            {t("navigation.logout", "Déconnexion")}
                          </Button>
                        </>
                      ) : (
                        <div className="space-y-2 pt-1">
                          <Button asChild className="w-full h-10 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 border-0 shadow-lg shadow-violet-500/20">
                            <Link href={`/${lang}/auth/signup`} onClick={() => setMobileOpen(false)}>
                              <Rocket className="h-4 w-4 mr-2" />
                              {t("navigation.signup", "S'inscrire gratuitement")}
                            </Link>
                          </Button>
                          <Button variant="outline" asChild className="w-full h-9 border-border/60">
                            <Link href={`/${lang}/auth/signin`} onClick={() => setMobileOpen(false)}>
                              <User className="h-3.5 w-3.5 mr-2" />
                              {t("navigation.signin", "Se connecter")}
                            </Link>
                          </Button>
                        </div>
                      )}

                      {/* Legal footer */}
                      <div className="grid grid-cols-2 gap-1 pt-2 border-t border-border/30">
                        {[
                          { href: `/${lang}/terms`,   label: "CGU" },
                          { href: `/${lang}/privacy`, label: "Confidentialité" },
                          { href: `/${lang}/cookies`, label: "Cookies" },
                          { href: `/${lang}/contact`, label: "Contact" },
                        ].map(({ href, label }) => (
                          <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                            className="text-center text-[11px] text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-accent/30 transition-colors">
                            {label}
                          </Link>
                        ))}
                      </div>
                      <p className="text-center text-[11px] text-muted-foreground">
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

      {/* ── Mega menu panels ────────────────────────────────────────────────── */}
      {openMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onMouseEnter={() => setOpenMenu(null)}
          />

          {/* Panel */}
          <div
            className="fixed top-16 left-0 right-0 z-50 flex justify-center px-4"
            onMouseLeave={() => setOpenMenu(null)}
          >
            <div className="w-full max-w-5xl rounded-2xl border border-border/60 bg-popover/98 backdrop-blur-2xl shadow-2xl shadow-black/15 overflow-hidden">
              {(() => {
                const mega = megas[openMenu]
                if (!mega) return null
                return (
                  <div className="flex">
                    {/* Groups */}
                    <div className="flex-1 grid grid-cols-2 gap-0 divide-x divide-border/40">
                      {mega.groups.map((group) => (
                        <div key={group.title} className="p-5">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3 px-1">
                            {group.title}
                          </p>
                          <div className="space-y-0.5">
                            {group.items.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpenMenu(null)}
                                className={cn(
                                  "group/item flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all duration-150",
                                  isActive(item.href)
                                    ? "bg-gradient-to-r from-blue-500/10 to-violet-500/10"
                                    : "hover:bg-accent/50",
                                  item.highlight && "ring-1 ring-violet-500/20 hover:ring-violet-500/40"
                                )}
                              >
                                <div className={cn(
                                  "mt-0.5 p-2 rounded-lg flex-shrink-0 transition-colors",
                                  isActive(item.href)
                                    ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                    : item.highlight
                                      ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover/item:bg-violet-500/20"
                                      : "bg-accent/60 text-muted-foreground group-hover/item:bg-accent group-hover/item:text-foreground"
                                )}>
                                  {item.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className={cn(
                                      "text-sm font-semibold transition-colors",
                                      isActive(item.href) ? "text-foreground" : "text-foreground/80 group-hover/item:text-foreground"
                                    )}>
                                      {item.label}
                                    </span>
                                    {item.badge && (
                                      <span className={cn(pill,
                                        item.highlight
                                          ? "bg-gradient-to-r from-blue-500 to-violet-500 text-white"
                                          : "bg-muted text-muted-foreground"
                                      )}>
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {item.description}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* CTA sidebar */}
                    {mega.cta && (
                      <div className="w-52 flex-shrink-0 border-l border-border/40 bg-gradient-to-b from-accent/20 to-accent/5 p-5 flex flex-col justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-4">
                            Action rapide
                          </p>
                          <Link href={mega.cta.href} onClick={() => setOpenMenu(null)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/35 hover:scale-[1.02] active:scale-[0.98]">
                            {mega.cta.icon}
                            <span>{mega.cta.label}</span>
                            <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                          </Link>
                        </div>
                        <div className="mt-6 p-3 rounded-xl bg-gradient-to-br from-blue-500/5 to-violet-500/5 border border-blue-500/10">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-foreground block mb-1">NRBTalents</span>
                            La plateforme freelance de référence pour la communauté tech africaine.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  )
}