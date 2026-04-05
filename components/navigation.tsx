// components/navigation/Navigation.tsx - Version avec SearchCommand intégrée
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Menu, X, Sparkles, Rocket, Users, Zap, Settings, MessageCircle,
  User, LayoutDashboard, LogOut, Building, ChevronDown, ChevronRight,
  Home, Globe, Award, Code2, Calendar, DollarSign, Shield,
  TrendingUp, FileText, HelpCircle, CheckCircle2,
  Briefcase, BookOpen, Layers, CreditCard, UserCheck, BarChart3,
  Bell, Hash, GitBranch, Package, Cpu, ScrollText, Gavel,
  Mail, Info, ArrowRight, Search,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { UserMenu } from "@/components/user-menu"
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
import Image from "next/image"
import { MessagesDropdown } from "@/components/messages-dropdown"
import { NotificationBell } from "./NotificationBell"
import { useToast } from "@/components/ui/use-toast"

// ✅ Import SearchCommand
import { SearchCommand, useSearchCommand } from "@/components/search/SearchCommand"

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

const pill = "text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0"

// ─── SearchTrigger Button ─────────────────────────────────────────────────────
// Design puissant : différent sur desktop (barre étendue) et mobile (icône)
function SearchTriggerDesktop({ onClick, isMac }: { onClick: () => void; isMac: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-2.5 h-9",
        // On xl+ : barre étendue avec placeholder et raccourci clavier
        "xl:w-64 xl:px-3 xl:rounded-xl xl:border xl:border-border/60",
        "xl:bg-accent/20 xl:hover:bg-accent/40 xl:hover:border-border",
        // On lg–xl : icône seule dans un bouton
        "lg:w-9 lg:px-0 lg:rounded-xl lg:border lg:border-border/60",
        "lg:bg-accent/20 lg:hover:bg-accent/40 lg:justify-center",
        "transition-all duration-200"
      )}
    >
      {/* Icône — toujours visible */}
      <Search className={cn(
        "h-4 w-4 shrink-0 transition-colors",
        "text-muted-foreground group-hover:text-foreground",
        // Centré sur lg, décalé à gauche sur xl
        "lg:mx-auto xl:mx-0"
      )} />

      {/* Placeholder texte — xl seulement */}
      <span className="hidden xl:flex flex-1 items-center text-sm text-muted-foreground group-hover:text-foreground/70 whitespace-nowrap transition-colors">
        Rechercher...
      </span>

      {/* Raccourci clavier — xl seulement */}
      <kbd className={cn(
        "hidden xl:inline-flex items-center gap-0.5 shrink-0",
        "px-1.5 py-0.5 text-[10px] font-mono font-medium",
        "bg-background/80 border border-border/60 rounded-md",
        "text-muted-foreground group-hover:border-border transition-colors"
      )}>
        {isMac ? "⌘" : "⌃"}<span>K</span>
      </kbd>
    </button>
  )
}

function SearchTriggerMobile({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center h-9 w-9 rounded-xl border border-border/60 bg-accent/20 hover:bg-accent/40 hover:border-border transition-all duration-200 shrink-0"
      aria-label="Rechercher"
    >
      <Search className="h-4 w-4 text-muted-foreground" />
    </button>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Navigation() {
  const [scrolled, setScrolled]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openMenu, setOpenMenu]     = useState<string | null>(null)
  const [dict, setDict]             = useState<any>(null)
  const [lang, setLang]             = useState<Locale>("fr")
  const [savingLang, setSavingLang] = useState<string | null>(null)
  const [isMac, setIsMac]           = useState(false)

  const pathname  = usePathname()
  const params    = useParams()
  const { data: session, update: updateSession } = useSession()
  const navRef    = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // ✅ SearchCommand state
  const search = useSearchCommand()

  useEffect(() => {
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform))
  }, [])

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

  // ✅ Keyboard shortcut Ctrl+K / Cmd+K → ouvrir SearchCommand
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        search.toggle()
      }
    }
    document.addEventListener("keydown", fn)
    return () => document.removeEventListener("keydown", fn)
  }, [search])

  const t = (key: string, fallback: string = key): string => {
    if (!dict) return fallback
    let v: any = dict
    for (const k of key.split(".")) {
      if (v && typeof v === "object") v = v[k]
      else return fallback
    }
    if (typeof v === "object" && v !== null) return fallback
    return v || fallback
  }

  const isActive = (href: string) => {
    if (href === "#") return false
    if (href === `/${lang}`) return pathname === `/${lang}` || pathname === `/${lang}/`
    return pathname.startsWith(href)
  }

  const saveLanguageToProfile = async (newLang: Locale): Promise<boolean> => {
    if (!session?.user) return true
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'preferences', data: { language: newLang, ...(session?.user?.preferences || {}) } })
      })
      if (!response.ok) throw new Error('Failed to save language preference')
      await updateSession({ ...session, user: { ...session.user, language: newLang, preferences: { ...session.user.preferences, language: newLang } } })
      toast({ title: newLang === 'fr' ? 'Langue enregistrée' : newLang === 'en' ? 'Language saved' : 'Voatahiry ny fiteny', duration: 2000 })
      return true
    } catch (error) {
      console.error('Error saving language:', error)
      toast({ title: lang === 'fr' ? "Erreur lors de l'enregistrement" : 'Error saving language', variant: 'destructive', duration: 3000 })
      return false
    }
  }

  const switchLang = async (code: string) => {
    setSavingLang(code)
    if (session?.user) await saveLanguageToProfile(code as Locale)
    const rest = pathname.split("/").slice(2).join("/")
    window.location.href = `/${code}/${rest}`
  }

  const getLegalText = (key: string, fallback: string): string => {
    if (!dict?.legal?.[key]) return fallback
    const value = dict.legal[key]
    if (typeof value === "string") return value
    if (typeof value === "object" && value !== null && value.title) return value.title
    return fallback
  }

  // ── Mega menu definitions ──────────────────────────────────────────────────
  const megas: Record<string, MegaMenu> = {
    marketplace: {
      label: t("navigations.marketplace", "Marketplace"),
      cta: { label: t("navigations.postProject", "Poster un projet"), href: `/${lang}/projects/create`, icon: <Rocket className="h-3.5 w-3.5 shrink-0" /> },
      groups: [
        {
          title: t("navigations.findTalents", "Trouver des talents"),
          items: [
            { href: `/${lang}/talents`,            label: t("navigations.talents", "Talents"),          description: t("navigations.talentsDesc", "Parcourir tous les freelances"),       icon: <Users className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/freelancers`,         label: t("navigations.freelancers", "Freelancers"),  description: t("navigations.freelancersDesc", "Profils vérifiés & disponibles"),   icon: <UserCheck className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/ai-matching`,         label: t("navigations.aiMatching", "AI Matching"),   description: t("navigations.aiMatchingDesc", "Trouver le profil parfait par IA"), icon: <Sparkles className="h-4 w-4 shrink-0" />, badge: "AI", highlight: true },
            { href: `/${lang}/ai-matching/clients`, label: t("navigations.matchingClients", "Matching Clients"), description: t("navigations.matchingClientsDesc", "Recommandations pour clients"), icon: <Sparkles className="h-4 w-4 shrink-0" /> },
          ],
        },
        {
          title: t("navigations.findWork", "Trouver du travail"),
          items: [
            { href: `/${lang}/gigs`,                    label: t("navigations.gigs", "Gigs"),                   description: t("navigations.gigsDesc", "Services proposés par des pros"),        icon: <Zap className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/gigs/create`,             label: t("navigations.createGig", "Créer un Gig"),      description: t("navigations.createGigDesc", "Proposez vos services"),             icon: <Package className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/projects`,                label: t("navigations.projects", "Projets"),            description: t("navigations.projectsDesc", "Missions & appels d'offres"),        icon: <Briefcase className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/ai-matching/freelancers`, label: t("navigations.matchingFreelancers", "Matching Freelances"), description: t("navigations.matchingFreelancersDesc", "Projets correspondant à vos skills"), icon: <Cpu className="h-4 w-4 shrink-0" /> },
          ],
        },
      ],
    },
    workspace: {
      label: t("navigations.workspace", "Espace de travail"),
      cta: { label: t("navigations.myDashboard", "Mon Dashboard"), href: `/${lang}/dashboard`, icon: <LayoutDashboard className="h-3.5 w-3.5 shrink-0" /> },
      groups: [
        {
          title: t("navigations.management", "Gestion"),
          items: [
            { href: `/${lang}/messages`,  label: t("navigations.messages", "Messages"),   description: t("navigations.messagesDesc", "Conversations & notifications"),    icon: <MessageCircle className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/calendar`,  label: t("navigations.calendar", "Calendrier"), description: t("navigations.calendarDesc", "Planifier vos rendez-vous"),        icon: <Calendar className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/contracts`, label: t("navigations.contracts", "Contrats"),  description: t("navigations.contractsDesc", "Gérez vos accords juridiques"),    icon: <ScrollText className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/orders`,    label: t("navigations.orders", "Commandes"),    description: t("navigations.ordersDesc", "Suivi des commandes actives"),        icon: <Package className="h-4 w-4 shrink-0" /> },
          ],
        },
        {
          title: t("navigations.financeTeams", "Finance & Équipes"),
          items: [
            { href: `/${lang}/dashboard/payment-methods`, label: t("navigations.payments", "Paiements"),         description: t("navigations.paymentsDesc", "Méthodes de paiement & historique"), icon: <CreditCard className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/dashboard/referrals`,       label: t("navigations.referrals", "Parrainage"),        description: t("navigations.referralsDesc", "Invitez & gagnez des récompenses"),  icon: <GitBranch className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/teams`,                     label: t("navigations.teams", "Équipes"),               description: t("navigations.teamsDesc", "Gérez vos équipes de travail"),         icon: <Users className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/team/contracts`,            label: t("navigations.teamContracts", "Contrats Équipe"), description: t("navigations.teamContractsDesc", "Contrats collectifs & missions"), icon: <Gavel className="h-4 w-4 shrink-0" /> },
          ],
        },
      ],
    },
    community: {
      label: t("navigations.community", "Communauté"),
      cta: { label: t("navigations.viewAllGroups", "Voir tous les groupes"), href: `/${lang}/groups`, icon: <Hash className="h-3.5 w-3.5 shrink-0" /> },
      groups: [
        {
          title: t("navigations.learnGrow", "Apprendre & Grandir"),
          items: [
            { href: `/${lang}/dashboard/academy`, label: t("navigations.academy", "Académie"),         description: t("navigations.academyDesc", "Formations & certifications"),      icon: <Award className="h-4 w-4 shrink-0" />, badge: "Nouveau" },
            { href: `/${lang}/blog`,              label: t("navigations.blog", "Blog"),                description: t("navigations.blogDesc", "Articles & tendances du secteur"),    icon: <TrendingUp className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/news`,              label: t("navigations.news", "Actualités"),          description: t("navigations.newsDesc", "Dernières nouvelles NRBTalents"),     icon: <Bell className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/how-it-works`,      label: t("navigations.howItWorks", "Comment ça marche"), description: t("navigations.howItWorksDesc", "Guide complet de la plateforme"), icon: <BookOpen className="h-4 w-4 shrink-0" /> },
          ],
        },
        {
          title: t("navigations.groupsNetwork", "Groupes & Réseau"),
          items: [
            { href: `/${lang}/groups`,           label: t("navigations.groups", "Groupes"),           description: t("navigations.groupsDesc", "Rejoignez des communautés pros"),   icon: <Hash className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/groups/create`,    label: t("navigations.createGroup", "Créer un groupe"), description: t("navigations.createGroupDesc", "Lancez votre propre communauté"), icon: <Layers className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/groups/my-groups`, label: t("navigations.myGroups", "Mes groupes"),     description: t("navigations.myGroupsDesc", "Groupes que vous gérez"),          icon: <Users className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/ide`,              label: t("navigations.cloudIDE", "IDE Cloud"),       description: t("navigations.cloudIDEDesc", "Codez dans le cloud"),             icon: <Code2 className="h-4 w-4 shrink-0" />, badge: "Beta" },
          ],
        },
      ],
    },
    enterprise: {
      label: t("navigations.enterprise", "Entreprise"),
      cta: { label: t("navigations.contactSales", "Contacter les ventes"), href: `/${lang}/contact-sales`, icon: <Mail className="h-3.5 w-3.5 shrink-0" /> },
      groups: [
        {
          title: t("navigations.solutions", "Solutions"),
          items: [
            { href: `/${lang}/enterprise`,         label: t("navigations.enterpriseSolutions", "Solutions Entreprise"), description: t("navigations.enterpriseSolutionsDesc", "Pour les grandes organisations"), icon: <Building className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/teams/dashboard`,    label: t("navigations.teamDashboard", "Dashboard Équipe"),           description: t("navigations.teamDashboardDesc", "Vue d'ensemble de votre équipe"),      icon: <BarChart3 className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/pricing`,            label: t("navigations.pricing", "Tarifs"),                           description: t("navigations.pricingDesc", "Plans & abonnements"),                     icon: <DollarSign className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/admin/verification`, label: t("navigations.adminVerification", "Vérification Admin"),     description: t("navigations.adminVerificationDesc", "Accès administration"),            icon: <Shield className="h-4 w-4 shrink-0" /> },
          ],
        },
        {
          title: t("navigations.supportDocs", "Support & Docs"),
          items: [
            { href: `/${lang}/docs`,    label: t("navigations.documentation", "Documentation"), description: t("navigations.documentationDesc", "API & guides développeurs"), icon: <FileText className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/faq`,     label: t("navigations.faq", "FAQ"),                    description: t("navigations.faqDesc", "Questions fréquentes"),               icon: <HelpCircle className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/contact`, label: t("navigations.contact", "Contact"),            description: t("navigations.contactDesc", "Parlez à notre équipe"),           icon: <Mail className="h-4 w-4 shrink-0" /> },
            { href: `/${lang}/about`,   label: t("navigations.about", "À propos"),             description: t("navigations.aboutDesc", "Notre histoire & mission"),          icon: <Info className="h-4 w-4 shrink-0" /> },
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

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (!dict) return (
    <div className="fixed top-0 left-0 right-0 z-50 h-14 sm:h-16 bg-background/95 backdrop-blur-xl border-b border-border/40">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 h-full flex items-center justify-between">
        <div className="h-8 w-8 bg-muted animate-pulse rounded-lg shrink-0" />
        <div className="hidden lg:flex gap-2">
          <div className="h-9 w-64 bg-muted animate-pulse rounded-xl" />
        </div>
        <div className="h-8 w-8 bg-muted animate-pulse rounded-lg shrink-0 lg:hidden" />
      </div>
    </div>
  )

  return (
    <>
      {/* ✅ SearchCommand Modal — rendu en dehors de la nav pour z-index correct */}
      <SearchCommand
        isOpen={search.isOpen}
        onClose={search.close}
        lang={lang}
      />

      <div ref={navRef}>
        <nav className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-background/95 backdrop-blur-xl border-b border-border/40 shadow-lg"
            : "bg-background/90 backdrop-blur-md border-b border-border/30"
        )}>
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
            <div className="flex h-14 sm:h-16 items-center justify-between gap-2">

              {/* ── Logo ───────────────────────────────────────────────────── */}
              <Link
                href={`/${lang}`}
                className="flex items-center gap-2 group shrink-0 min-w-fit"
                onClick={() => setOpenMenu(null)}
              >
                <div className="h-8 w-8 flex items-center justify-center shrink-0">
                  <Image
                    src="/logo.png"
                    alt="NRBTalents"
                    width={32}
                    height={32}
                    className="h-8 w-8 transition-transform group-hover:scale-110"
                  />
                </div>
                <div className="hidden lg:flex flex-col">
                  <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent whitespace-nowrap">
                    NRBTalents
                  </span>
                  <span className="text-xs text-muted-foreground">Freelance</span>
                </div>
              </Link>

              {/* ── Desktop mega nav (lg+) ──────────────────────────────────── */}
              <div className="hidden lg:flex items-center gap-0.5 flex-1 min-w-0 overflow-hidden">
                <Link
                  href={`/${lang}`}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0",
                    isActive(`/${lang}`)
                      ? "text-foreground bg-accent/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                  )}
                  onClick={() => setOpenMenu(null)}
                >
                  <Home className="h-4 w-4 shrink-0" />
                  <span className="hidden xl:inline">{t("navigations.home", "Accueil")}</span>
                </Link>

                {Object.entries(megas).map(([key, mega]) => {
                  const isOpen = openMenu === key
                  const anyActive = mega.groups.some(g => g.items.some(item => isActive(item.href)))
                  return (
                    <button
                      key={key}
                      className={cn(
                        "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0",
                        anyActive || isOpen
                          ? "text-foreground bg-accent/50"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                      )}
                      onClick={() => setOpenMenu(isOpen ? null : key)}
                      onMouseEnter={() => setOpenMenu(key)}
                    >
                      <span>{mega.label}</span>
                      <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", isOpen && "rotate-180")} />
                    </button>
                  )
                })}
              </div>

              {/* ── Desktop right actions (lg+) ─────────────────────────────── */}
              <div className="hidden lg:flex items-center gap-2 shrink-0 min-w-fit">

                {/* ✅ Search trigger desktop — barre étendue sur xl, icône sur lg */}
                <SearchTriggerDesktop onClick={search.open} isMac={isMac} />

                <ThemeToggle />
                <NotificationBell />
                <MessagesDropdown />
 
                {/* Language switcher */}
                <div className="relative group">
                  <button className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/40 whitespace-nowrap">
                    <Globe className="h-4 w-4 shrink-0" />
                    <span className="uppercase text-xs">{lang}</span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                  </button>
                  <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl border border-border/60 bg-popover shadow-xl shadow-black/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 overflow-hidden z-50">
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => switchLang(l.code)}
                        disabled={savingLang === l.code}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent/50 transition-colors",
                          lang === l.code && "bg-accent/30",
                          savingLang === l.code && "opacity-50 cursor-wait"
                        )}
                      >
                        <span className="text-base leading-none">{l.flag}</span>
                        <span className="flex-1 text-left font-medium">{l.label}</span>
                        {lang === l.code && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />}
                        {savingLang === l.code && (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-5 w-px bg-border/60 shrink-0" />

                {!session?.user ? (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild className="h-8 px-3 text-sm whitespace-nowrap">
                      <Link href={`/${lang}/auth/signin`}>{t("navigations.signin", "Connexion")}</Link>
                    </Button>
                    <Button size="sm" asChild className="h-8 px-3 text-sm bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 border-0 whitespace-nowrap">
                      <Link href={`/${lang}/auth/signup`}>
                        <Rocket className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                        {t("navigations.signup", "S'inscrire")}
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <UserMenu dict={dict} lang={lang} />
                )}
              </div>

              {/* ── Mobile/tablette actions (< lg) ─────────────────────────── */}
              <div className="flex items-center gap-1 lg:hidden ml-auto shrink-0">

                {/* ✅ Search trigger mobile — icône seule */}
                <SearchTriggerMobile onClick={search.open} />

                <div className="flex items-center gap-1">
                  <NotificationBell />
                  <MessagesDropdown />
                </div>

                <ThemeToggle />

                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg hover:bg-accent/50 shrink-0"
                      aria-label="Ouvrir le menu"
                    >
                      {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                  </SheetTrigger>

                  <SheetContent
                    side="right"
                    className="w-full max-w-[340px] p-0 flex flex-col border-l border-border/60 overflow-x-hidden"
                  >
                    <SheetHeader className="px-5 py-4 border-b border-border/40 shrink-0">
                      <SheetTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                            <span className="text-white font-black text-[11px]">NRB</span>
                          </div>
                          <span className="font-bold text-sm">NRBTalents</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {languages.map((l) => (
                            <button
                              key={l.code}
                              onClick={() => switchLang(l.code)}
                              disabled={savingLang === l.code}
                              className={cn(
                                "text-base px-1.5 py-0.5 rounded-lg transition-colors relative",
                                lang === l.code ? "bg-accent" : "hover:bg-accent/50",
                                savingLang === l.code && "opacity-50 cursor-wait"
                              )}
                            >
                              {l.flag}
                              {savingLang === l.code && (
                                <div className="absolute -top-1 -right-1 h-2 w-2 animate-spin rounded-full border border-primary border-t-transparent" />
                              )}
                            </button>
                          ))}
                        </div>
                      </SheetTitle>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
                      <div className="px-3 py-3 space-y-1">

                        {/* ✅ Search bar dans le menu mobile — tap pour ouvrir */}
                        <button
                          onClick={() => { setMobileOpen(false); setTimeout(search.open, 150) }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/40 bg-accent/10 hover:bg-accent/30 text-muted-foreground transition-all text-sm"
                        >
                          <Search className="h-4 w-4 shrink-0" />
                          <span className="flex-1 text-left">{dict?.search.title || 'Rechercher...'}</span>
                          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-background/80 border border-border/60 rounded">
                            {isMac ? "⌘K" : "Ctrl+K"}
                          </kbd>
                        </button>

                        {/* Home */}
                        <Link
                          href={`/${lang}`}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                            isActive(`/${lang}`)
                              ? "bg-gradient-to-r from-blue-500/10 to-violet-500/10 text-foreground border border-blue-500/20"
                              : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                          )}
                        >
                          <div className="p-1.5 rounded-lg bg-accent/50 shrink-0">
                            <Home className="h-4 w-4" />
                          </div>
                          <span className="flex-1 min-w-0 truncate">{t("navigations.home", "Accueil")}</span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        </Link>

                        {/* Accordions */}
                        <Accordion type="single" collapsible className="space-y-1">
                          {Object.entries(megas).map(([key, mega]) => {
                            const anyActive = mega.groups.some(g => g.items.some(i => isActive(i.href)))
                            return (
                              <AccordionItem
                                key={key}
                                value={key}
                                className={cn(
                                  "border rounded-xl overflow-hidden",
                                  anyActive ? "border-blue-500/30" : "border-border/40"
                                )}
                              >
                                <AccordionTrigger className={cn(
                                  "px-3 py-2.5 text-sm font-semibold hover:no-underline transition-colors [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0",
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
                                        <Link
                                          key={item.href}
                                          href={item.href}
                                          onClick={() => setMobileOpen(false)}
                                          className={cn(
                                            "flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-all",
                                            isActive(item.href)
                                              ? "bg-blue-500/10 text-foreground"
                                              : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                                          )}
                                        >
                                          <div className={cn(
                                            "p-1 rounded-md shrink-0",
                                            isActive(item.href)
                                              ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                                              : "bg-accent/40"
                                          )}>
                                            {item.icon}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 min-w-0">
                                              <span className="font-medium truncate">{item.label}</span>
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
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                              {item.description}
                                            </p>
                                          </div>
                                        </Link>
                                      ))}
                                    </div>
                                  ))}
                                  {mega.cta && (
                                    <div className="px-2 pt-3">
                                      <Link
                                        href={mega.cta.href}
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 text-sm font-semibold text-foreground hover:from-blue-500/20 hover:to-violet-500/20 transition-all min-w-0"
                                      >
                                        {mega.cta.icon}
                                        <span className="flex-1 min-w-0 truncate">{mega.cta.label}</span>
                                        <ArrowRight className="h-3.5 w-3.5 shrink-0 ml-auto" />
                                      </Link>
                                    </div>
                                  )}
                                </AccordionContent>
                              </AccordionItem>
                            )
                          })}
                        </Accordion>

                        <div className="pt-1">
                          <MeetButtonCompact />
                        </div>
                      </div>

                      {/* User section mobile */}
                      <div className="px-3 pb-4 pt-2 border-t border-border/40 space-y-3 mt-2">
                        {session?.user ? (
                          <>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border border-border/40">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                                {session.user.name?.charAt(0).toUpperCase() ?? "U"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{session.user.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              {[
                                { href: `/${lang}/dashboard`,          icon: <LayoutDashboard className="h-3.5 w-3.5" />, label: t("navigations.dashboard", "Dashboard") },
                                { href: `/${lang}/profile`,            icon: <User className="h-3.5 w-3.5" />,            label: t("navigations.profile", "Profil") },
                                { href: `/${lang}/messages`,           icon: <MessageCircle className="h-3.5 w-3.5" />,   label: t("navigations.messages", "Messages") },
                                { href: `/${lang}/dashboard/settings`, icon: <Settings className="h-3.5 w-3.5" />,        label: t("navigations.settings", "Paramètres") },
                              ].map(({ href, icon, label }) => (
                                <Button key={href} variant="outline" size="sm" asChild
                                  className="h-auto py-2.5 flex-col gap-1 text-[11px] border-border/60">
                                  <Link href={href} onClick={() => setMobileOpen(false)}>
                                    {icon}
                                    <span>{label}</span>
                                  </Link>
                                </Button>
                              ))}
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full gap-2 h-9"
                              onClick={() => { signOut({ callbackUrl: `/${lang}` }); setMobileOpen(false) }}
                            >
                              <LogOut className="h-3.5 w-3.5 shrink-0" />
                              {t("navigations.logout", "Déconnexion")}
                            </Button>
                          </>
                        ) : (
                          <div className="space-y-2 pt-1">
                            <Button asChild className="w-full h-10 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 border-0 shadow-lg shadow-violet-500/20">
                              <Link href={`/${lang}/auth/signup`} onClick={() => setMobileOpen(false)}>
                                <Rocket className="h-4 w-4 mr-2 shrink-0" />
                                {t("navigations.signup", "S'inscrire gratuitement")}
                              </Link>
                            </Button>
                            <Button variant="outline" asChild className="w-full h-9 border-border/60">
                              <Link href={`/${lang}/auth/signin`} onClick={() => setMobileOpen(false)}>
                                <User className="h-3.5 w-3.5 mr-2 shrink-0" />
                                {t("navigations.signin", "Se connecter")}
                              </Link>
                            </Button>
                          </div>
                        )}

                        {/* Legal links */}
                        <div className="grid grid-cols-2 gap-1 pt-2 border-t border-border/30">
                          {[
                            { href: `/${lang}/terms`,   label: getLegalText("terms", "CGU") },
                            { href: `/${lang}/privacy`, label: getLegalText("privacy", "Confidentialité") },
                            { href: `/${lang}/cookies`, label: getLegalText("cookies", "Cookies") },
                            { href: `/${lang}/contact`, label: t("navigations.contact", "Contact") },
                          ].map(({ href, label }) => (
                            <Link
                              key={href}
                              href={href}
                              onClick={() => setMobileOpen(false)}
                              className="text-center text-[11px] text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-accent/30 transition-colors"
                            >
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

        {/* ── Mega menu panels (desktop uniquement) ──────────────────────── */}
        {openMenu && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] hidden lg:block"
              onMouseEnter={() => setOpenMenu(null)}
            />
            <div
              className="fixed top-14 sm:top-16 left-0 right-0 z-50 justify-center px-4 sm:px-6 hidden lg:flex"
              onMouseLeave={() => setOpenMenu(null)}
            >
              <div className="absolute -top-3 left-0 right-0 h-4 pointer-events-auto" />
              <div className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl rounded-2xl border border-border/60 bg-popover/98 backdrop-blur-2xl shadow-2xl shadow-black/15 overflow-hidden">
                {(() => {
                  const mega = megas[openMenu]
                  if (!mega) return null
                  return (
                    <div className="flex">
                      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border/40 min-w-0">
                        {mega.groups.map((group) => (
                          <div key={group.title} className="p-5 min-w-0">
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
                                    "group/item flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 min-w-0",
                                    isActive(item.href)
                                      ? "bg-gradient-to-r from-blue-500/10 to-violet-500/10"
                                      : "hover:bg-accent/50",
                                    item.highlight && "ring-1 ring-violet-500/20 hover:ring-violet-500/40"
                                  )}
                                >
                                  <div className={cn(
                                    "mt-0.5 p-2 rounded-lg shrink-0 transition-colors",
                                    isActive(item.href)
                                      ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                      : item.highlight
                                        ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover/item:bg-violet-500/20"
                                        : "bg-accent/60 text-muted-foreground group-hover/item:bg-accent group-hover/item:text-foreground"
                                  )}>
                                    {item.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5 min-w-0">
                                      <span className={cn(
                                        "text-sm font-semibold transition-colors truncate",
                                        isActive(item.href)
                                          ? "text-foreground"
                                          : "text-foreground/80 group-hover/item:text-foreground"
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
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                      {item.description}
                                    </p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {mega.cta && (
                        <div className="w-48 xl:w-52 shrink-0 border-l border-border/40 bg-gradient-to-b from-accent/20 to-accent/5 p-5 flex flex-col justify-between">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-4">
                              {t("navigations.quickAction", "Action rapide")}
                            </p>
                            <Link
                              href={mega.cta.href}
                              onClick={() => setOpenMenu(null)}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/35 hover:scale-[1.02] active:scale-[0.98] min-w-0"
                            >
                              {mega.cta.icon}
                              <span className="flex-1 min-w-0 truncate">{mega.cta.label}</span>
                              <ArrowRight className="h-3.5 w-3.5 shrink-0 ml-auto" />
                            </Link>
                          </div>
                          <div className="mt-6 p-3 rounded-xl bg-gradient-to-br from-blue-500/5 to-violet-500/5 border border-blue-500/10">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              <span className="font-semibold text-foreground block mb-1">NRBTalents</span>
                              {t("navigations.taglineDescription", "La plateforme freelance de référence pour la communauté tech africaine.")}
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
    </>
  )
}