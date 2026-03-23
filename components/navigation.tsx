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
  Bell, Hash, GitBranch, Package, Cpu, ScrollText, Gavel,
  Mail, Info, ArrowRight, ShoppingBag, GraduationCap, Headphones
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

// ─── Responsive breakpoints constants ─────────────────────────────────────
const BREAKPOINTS = {
  mobile: 640,    // sm
  tablet: 768,    // md  
  desktop: 1024,  // lg
  wide: 1280,     // xl
}

// ─── Types ─────────────────────────────────────────────────────────────────
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

// ─── Component ────────────────────────────────────────────────────────────
export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [dict, setDict] = useState<any>(null)
  const [lang, setLang] = useState<Locale>("fr")
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const pathname = usePathname()
  const params = useParams()
  const { data: session } = useSession()
  const navRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // ─── Window resize listener for responsive behavior ────────────────────
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
    setOpenMenu(null)
  }, [pathname])

  // ─── Mega menu hover handlers ──────────────────────────────────────────
  const handleMouseEnter = (key: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpenMenu(key)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpenMenu(null), 150)
  }

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

  // ─── Responsive visibility helpers ─────────────────────────────────────
  const isMobile = windowWidth < BREAKPOINTS.tablet
  const isTablet = windowWidth >= BREAKPOINTS.tablet && windowWidth < BREAKPOINTS.desktop
  const isDesktop = windowWidth >= BREAKPOINTS.desktop
  const showFullNav = isDesktop
  const showCompactNav = isTablet
  const showMobileMenu = isMobile

  // ─── Mega menu definitions ─────────────────────────────────────────────
  const megas: Record<string, MegaMenu> = {
    marketplace: {
      label: t("navigation.marketplace", "Marketplace"),
      cta: { label: t("navigation.postProject", "Poster un projet"), href: `/${lang}/projects/create`, icon: <Rocket className="h-3.5 w-3.5" /> },
      groups: [
        {
          title: t("navigation.findTalents", "Trouver des talents"),
          items: [
            { href: `/${lang}/talents`, label: t("navigation.talents", "Talents"), description: t("navigation.talentsDesc", "Parcourir tous les freelances"), icon: <Users className="h-4 w-4" /> },
            { href: `/${lang}/freelancers`, label: t("navigation.freelancers", "Freelancers"), description: t("navigation.freelancersDesc", "Profils vérifiés"), icon: <UserCheck className="h-4 w-4" /> },
            { href: `/${lang}/ai-matching`, label: t("navigation.aiMatching", "AI Matching"), description: t("navigation.aiMatchingDesc", "Trouver le profil parfait par IA"), icon: <Sparkles className="h-4 w-4" />, badge: "AI", highlight: true },
            { href: `/${lang}/ai-matching/clients`, label: t("navigation.matchingClients", "Matching Clients"), description: t("navigation.matchingClientsDesc", "Recommandations pour clients"), icon: <Sparkles className="h-4 w-4" /> },
          ],
        },
        {
          title: t("navigation.findWork", "Trouver du travail"),
          items: [
            { href: `/${lang}/gigs`, label: t("navigation.gigs", "Gigs"), description: t("navigation.gigsDesc", "Services proposés"), icon: <Zap className="h-4 w-4" /> },
            { href: `/${lang}/gigs/create`, label: t("navigation.createGig", "Créer un Gig"), description: t("navigation.createGigDesc", "Proposez vos services"), icon: <Package className="h-4 w-4" /> },
            { href: `/${lang}/projects`, label: t("navigation.projects", "Projets"), description: t("navigation.projectsDesc", "Missions & appels d'offres"), icon: <Briefcase className="h-4 w-4" /> },
            { href: `/${lang}/ai-matching/freelancers`, label: t("navigation.matchingFreelancers", "Matching Freelances"), description: t("navigation.matchingFreelancersDesc", "Projets correspondants"), icon: <Cpu className="h-4 w-4" /> },
          ],
        },
      ],
    },
    workspace: {
      label: t("navigation.workspace", "Espace de travail"),
      cta: { label: t("navigation.myDashboard", "Mon Dashboard"), href: `/${lang}/dashboard`, icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
      groups: [
        {
          title: t("navigation.management", "Gestion"),
          items: [
            { href: `/${lang}/dashboard/messages`, label: t("navigation.messages", "Messages"), description: t("navigation.messagesDesc", "Conversations"), icon: <MessageCircle className="h-4 w-4" /> },
            { href: `/${lang}/calendar`, label: t("navigation.calendar", "Calendrier"), description: t("navigation.calendarDesc", "Planifier"), icon: <Calendar className="h-4 w-4" /> },
            { href: `/${lang}/contracts`, label: t("navigation.contracts", "Contrats"), description: t("navigation.contractsDesc", "Accords juridiques"), icon: <ScrollText className="h-4 w-4" /> },
            { href: `/${lang}/orders`, label: t("navigation.orders", "Commandes"), description: t("navigation.ordersDesc", "Suivi des commandes"), icon: <ShoppingBag className="h-4 w-4" /> },
          ],
        },
        {
          title: t("navigation.financeTeams", "Finance & Équipes"),
          items: [
            { href: `/${lang}/dashboard/payment-methods`, label: t("navigation.payments", "Paiements"), description: t("navigation.paymentsDesc", "Méthodes de paiement"), icon: <CreditCard className="h-4 w-4" /> },
            { href: `/${lang}/dashboard/referrals`, label: t("navigation.referrals", "Parrainage"), description: t("navigation.referralsDesc", "Invitez & gagnez"), icon: <GitBranch className="h-4 w-4" /> },
            { href: `/${lang}/teams`, label: t("navigation.teams", "Équipes"), description: t("navigation.teamsDesc", "Gérez vos équipes"), icon: <Users className="h-4 w-4" /> },
            { href: `/${lang}/team/contracts`, label: t("navigation.teamContracts", "Contrats Équipe"), description: t("navigation.teamContractsDesc", "Contrats collectifs"), icon: <Gavel className="h-4 w-4" /> },
          ],
        },
      ],
    },
    community: {
      label: t("navigation.community", "Communauté"),
      cta: { label: t("navigation.viewAllGroups", "Voir tous les groupes"), href: `/${lang}/groups`, icon: <Hash className="h-3.5 w-3.5" /> },
      groups: [
        {
          title: t("navigation.learnGrow", "Apprendre & Grandir"),
          items: [
            { href: `/${lang}/dashboard/academy`, label: t("navigation.academy", "Académie"), description: t("navigation.academyDesc", "Formations"), icon: <GraduationCap className="h-4 w-4" />, badge: t("navigation.new", "Nouveau") },
            { href: `/${lang}/blog`, label: t("navigation.blog", "Blog"), description: t("navigation.blogDesc", "Articles"), icon: <TrendingUp className="h-4 w-4" /> },
            { href: `/${lang}/news`, label: t("navigation.news", "Actualités"), description: t("navigation.newsDesc", "Dernières nouvelles"), icon: <Bell className="h-4 w-4" /> },
            { href: `/${lang}/how-it-works`, label: t("navigation.howItWorks", "Comment ça marche"), description: t("navigation.howItWorksDesc", "Guide"), icon: <BookOpen className="h-4 w-4" /> },
          ],
        },
        {
          title: t("navigation.groupsNetwork", "Groupes & Réseau"),
          items: [
            { href: `/${lang}/groups`, label: t("navigation.groups", "Groupes"), description: t("navigation.groupsDesc", "Communautés pros"), icon: <Hash className="h-4 w-4" /> },
            { href: `/${lang}/groups/create`, label: t("navigation.createGroup", "Créer un groupe"), description: t("navigation.createGroupDesc", "Lancez votre communauté"), icon: <Layers className="h-4 w-4" /> },
            { href: `/${lang}/groups/my-groups`, label: t("navigation.myGroups", "Mes groupes"), description: t("navigation.myGroupsDesc", "Groupes gérés"), icon: <Users className="h-4 w-4" /> },
            { href: `/${lang}/ide`, label: t("navigation.cloudIDE", "IDE Cloud"), description: t("navigation.cloudIDEDesc", "Codez dans le cloud"), icon: <Code2 className="h-4 w-4" />, badge: "Beta" },
          ],
        },
      ],
    },
    enterprise: {
      label: t("navigation.enterprise", "Entreprise"),
      cta: { label: t("navigation.contactSales", "Contacter les ventes"), href: `/${lang}/contact-sales`, icon: <Mail className="h-3.5 w-3.5" /> },
      groups: [
        {
          title: t("navigation.solutions", "Solutions"),
          items: [
            { href: `/${lang}/enterprise`, label: t("navigation.enterpriseSolutions", "Solutions Entreprise"), description: t("navigation.enterpriseSolutionsDesc", "Pour grandes organisations"), icon: <Building className="h-4 w-4" /> },
            { href: `/${lang}/teams/dashboard`, label: t("navigation.teamDashboard", "Dashboard Équipe"), description: t("navigation.teamDashboardDesc", "Vue d'ensemble"), icon: <BarChart3 className="h-4 w-4" /> },
            { href: `/${lang}/pricing`, label: t("navigation.pricing", "Tarifs"), description: t("navigation.pricingDesc", "Plans & abonnements"), icon: <DollarSign className="h-4 w-4" /> },
            { href: `/${lang}/admin/verification`, label: t("navigation.adminVerification", "Vérification Admin"), description: t("navigation.adminVerificationDesc", "Accès admin"), icon: <Shield className="h-4 w-4" /> },
          ],
        },
        {
          title: t("navigation.supportDocs", "Support & Docs"),
          items: [
            { href: `/${lang}/docs`, label: t("navigation.documentation", "Documentation"), description: t("navigation.documentationDesc", "API & guides"), icon: <FileText className="h-4 w-4" /> },
            { href: `/${lang}/faq`, label: t("navigation.faq", "FAQ"), description: t("navigation.faqDesc", "Questions fréquentes"), icon: <HelpCircle className="h-4 w-4" /> },
            { href: `/${lang}/contact`, label: t("navigation.contact", "Contact"), description: t("navigation.contactDesc", "Parlez à notre équipe"), icon: <Headphones className="h-4 w-4" /> },
            { href: `/${lang}/about`, label: t("navigation.about", "À propos"), description: t("navigation.aboutDesc", "Notre histoire"), icon: <Info className="h-4 w-4" /> },
          ],
        },
      ],
    },
  }

  const languages = [
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "mg", label: "Malagasy", flag: "🇲🇬" },
  ]

  const externalPlatforms = [
    { name: "Upwork", href: "https://www.upwork.com", icon: <ExternalLink className="h-4 w-4" />, description: "Freelances internationaux" },
    { name: "Fiverr", href: "https://www.fiverr.com", icon: <ExternalLink className="h-4 w-4" />, description: "Services à la demande" },
    { name: "Toptal", href: "https://www.toptal.com", icon: <Star className="h-4 w-4" />, description: "Top 3% des talents" },
    { name: "Malt", href: "https://www.malt.fr", icon: <ExternalLink className="h-4 w-4" />, description: "Plateforme européenne" },
  ]

  const pill = "text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"

  const navBtn = (active: boolean) =>
    cn(
      "relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
      active
        ? "text-foreground bg-accent/30"
        : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
    )

  if (!dict) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 border-b">
        <div className="mx-auto max-w-7xl px-4 h-full flex items-center justify-between">
          <div className="h-7 w-24 bg-muted animate-pulse rounded" />
          <div className="h-7 w-32 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  return (
    <div ref={navRef}>
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/98 backdrop-blur-2xl border-b border-border/60 shadow-sm"
          : "bg-background/95 backdrop-blur-xl border-b border-border/30"
      )}>
        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
          <div className="flex h-14 md:h-16 items-center justify-between gap-2">

            {/* ─── LOGO ──────────────────────────────────────────────────── */}
            <Link href={`/${lang}`} className="flex items-center gap-2 flex-shrink-0">
              <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xs">NRB</span>
              </div>
              {(showFullNav || showCompactNav) && (
                <div className="hidden sm:flex flex-col">
                  <span className="text-sm md:text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    NRBTalents
                  </span>
                  {showFullNav && (
                    <span className="text-[9px] md:text-[10px] text-muted-foreground -mt-0.5">
                      {t("navigation.tagline", "Freelance Platform")}
                    </span>
                  )}
                </div>
              )}
            </Link>

            {/* ─── DESKTOP FULL NAVIGATION (≥1024px) ─────────────────────── */}
            {showFullNav && (
              <>
                <div className="flex items-center gap-0.5 flex-1 justify-center">
                  <Link href={`/${lang}`} className={navBtn(isActive(`/${lang}`))}>
                    <Home className="h-3.5 w-3.5" />
                    <span className="hidden xl:inline">Accueil</span>
                    <span className="xl:hidden">Accueil</span>
                  </Link>

                  {Object.entries(megas).map(([key, mega]) => {
                    const anyActive = mega.groups.some(g => g.items.some(i => isActive(i.href)))
                    return (
                      <div key={key} onMouseEnter={() => handleMouseEnter(key)} onMouseLeave={handleMouseLeave}>
                        <button className={navBtn(anyActive || openMenu === key)}>
                          <span className="hidden xl:inline">{mega.label}</span>
                          <span className="xl:hidden">{mega.label.slice(0, 8)}</span>
                          <ChevronDown className={cn("h-3 w-3 transition-transform", openMenu === key && "rotate-180")} />
                        </button>
                      </div>
                    )
                  })}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <SearchCommand />
                  <ThemeToggle />
                  <MeetButtonCompact />
                  <div className="h-5 w-px bg-border/60 mx-1" />
                  <UserMenu dict={dict} lang={lang} />
                </div>
              </>
            )}

            {/* ─── TABLET COMPACT NAVIGATION (768px - 1023px) ────────────── */}
            {showCompactNav && (
              <>
                <div className="flex items-center gap-1 flex-1 justify-end">
                  <SearchCommand />
                  <ThemeToggle />
                  <MeetButtonCompact />
                </div>
                <div className="flex items-center gap-1">
                  <UserMenu dict={dict} lang={lang} />
                </div>
              </>
            )}

            {/* ─── MOBILE NAVIGATION (<768px) ────────────────────────────── */}
            {showMobileMenu && (
              <div className="flex items-center gap-1 ml-auto">
                <SearchCommand variant="mobile" />
                <ThemeToggle />
                <MeetButtonCompact />
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[85vw] max-w-[320px] p-0">
                    <SheetHeader className="px-4 py-3 border-b">
                      <SheetTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-[10px]">NRB</span>
                          </div>
                          <span className="font-bold text-sm">NRBTalents</span>
                        </div>
                        <div className="flex gap-1">
                          {languages.map(l => (
                            <button key={l.code} onClick={() => switchLang(l.code)} className={cn("text-sm px-1.5 py-0.5 rounded", lang === l.code && "bg-accent")}>
                              {l.flag}
                            </button>
                          ))}
                        </div>
                      </SheetTitle>
                    </SheetHeader>

                    <div className="overflow-y-auto h-[calc(100vh-60px)] pb-20">
                      <div className="p-3 space-y-2">
                        <Link href={`/${lang}`} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50">
                          <Home className="h-4 w-4" /><span>Accueil</span>
                        </Link>

                        <Accordion type="single" collapsible className="space-y-1">
                          {Object.entries(megas).map(([key, mega]) => (
                            <AccordionItem key={key} value={key} className="border rounded-lg">
                              <AccordionTrigger className="px-3 py-2 text-sm font-medium">
                                {mega.label}
                              </AccordionTrigger>
                              <AccordionContent>
                                {mega.groups.map(group => (
                                  <div key={group.title} className="px-2 pt-2">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground/60 px-2 mb-1">{group.title}</p>
                                    {group.items.map(item => (
                                      <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm hover:bg-accent/50">
                                        <div className="p-1 rounded bg-accent/40">{item.icon}</div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-1">
                                            <span>{item.label}</span>
                                            {item.badge && <span className={cn(pill, "bg-accent")}>{item.badge}</span>}
                                          </div>
                                          <p className="text-xs text-muted-foreground">{item.description}</p>
                                        </div>
                                      </Link>
                                    ))}
                                  </div>
                                ))}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>

                        <div className="pt-2 border-t mt-2">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground/60 px-2 mb-2">Plateformes externes</p>
                          {externalPlatforms.map(p => (
                            <a key={p.name} href={p.href} target="_blank" rel="noopener" className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm hover:bg-accent/50">
                              {p.icon}<span>{p.name}</span>
                            </a>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 border-t mt-2">
                        {session?.user ? (
                          <>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/30 mb-3">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {session.user.name?.charAt(0).toUpperCase() || "U"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{session.user.name}</p>
                                <p className="text-xs text-muted-foreground truncate capitalize">{(session.user as any).role || "User"}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              <Button variant="outline" size="sm" asChild><Link href={`/${lang}/dashboard`} onClick={() => setMobileOpen(false)}><LayoutDashboard className="h-3 w-3 mr-1" />Dashboard</Link></Button>
                              <Button variant="outline" size="sm" asChild><Link href={`/${lang}/profile`} onClick={() => setMobileOpen(false)}><User className="h-3 w-3 mr-1" />Profil</Link></Button>
                              <Button variant="outline" size="sm" asChild><Link href={`/${lang}/messages`} onClick={() => setMobileOpen(false)}><MessageCircle className="h-3 w-3 mr-1" />Messages</Link></Button>
                              <Button variant="outline" size="sm" asChild><Link href={`/${lang}/dashboard/settings`} onClick={() => setMobileOpen(false)}><Settings className="h-3 w-3 mr-1" />Paramètres</Link></Button>
                            </div>
                            <Button variant="destructive" size="sm" className="w-full mt-2" onClick={() => signOut({ callbackUrl: `/${lang}` })}><LogOut className="h-3 w-3 mr-1" />Déconnexion</Button>
                          </>
                        ) : (
                          <>
                            <Button asChild className="w-full mb-2 bg-gradient-to-r from-blue-600 to-purple-600"><Link href={`/${lang}/auth/signup`} onClick={() => setMobileOpen(false)}>S'inscrire</Link></Button>
                            <Button variant="outline" asChild className="w-full"><Link href={`/${lang}/auth/signin`} onClick={() => setMobileOpen(false)}>Se connecter</Link></Button>
                          </>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}

            {/* ─── LANGUAGE SWITCHER (visible on all screens) ─────────────── */}
            <div className="hidden sm:flex items-center">
              <div className="relative group">
                <button className="flex items-center gap-0.5 px-1.5 py-1 rounded text-xs text-muted-foreground hover:text-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  <span className="uppercase font-medium">{lang}</span>
                  <ChevronDown className="h-2.5 w-2.5" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-32 rounded-lg border bg-popover shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {languages.map(l => (
                    <button key={l.code} onClick={() => switchLang(l.code)} className={cn("w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent", lang === l.code && "bg-accent/50")}>
                      <span>{l.flag}</span><span>{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── MEGA MENU PANELS (desktop only) ────────────────────────────── */}
      {showFullNav && openMenu && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpenMenu(null)} />
          <div className="fixed top-14 left-0 right-0 z-50 flex justify-center px-4" onMouseLeave={handleMouseLeave}>
            <div className="w-full max-w-5xl rounded-xl border bg-popover/98 backdrop-blur shadow-xl overflow-hidden">
              {(() => {
                const mega = megas[openMenu]
                if (!mega) return null
                return (
                  <div className="flex">
                    <div className="flex-1 grid grid-cols-2 divide-x">
                      {mega.groups.map(group => (
                        <div key={group.title} className="p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 px-1">{group.title}</p>
                          <div className="space-y-0.5">
                            {group.items.map(item => (
                              <Link key={item.href} href={item.href} onClick={() => setOpenMenu(null)} className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors">
                                <div className="p-1.5 rounded-lg bg-accent/30">{item.icon}</div>
                                <div>
                                  <div className="flex items-center gap-1"><span className="text-sm font-medium">{item.label}</span>{item.badge && <span className={pill + " bg-accent"}>{item.badge}</span>}</div>
                                  <p className="text-xs text-muted-foreground">{item.description}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {mega.cta && (
                      <div className="w-48 p-4 border-l bg-accent/5">
                        <Link href={mega.cta.href} onClick={() => setOpenMenu(null)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium">
                          {mega.cta.icon}<span>{mega.cta.label}</span><ArrowRight className="h-3 w-3 ml-auto" />
                        </Link>
                        <p className="text-[10px] text-muted-foreground mt-3 text-center">NRBTalents - La plateforme freelance nouvelle génération</p>
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