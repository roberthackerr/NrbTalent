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
  Mail, Info, ArrowRight, Zap as ZapIcon, Heart, ShoppingBag,
  GraduationCap, Headphones, Lock, Truck, Wallet, Wrench
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"

// ─── Types ────────────────────────────────────────────────────────────────────
interface MegaItem {
  href: string
  label: string
  description: string
  icon: React.ReactNode
  badge?: string
  highlight?: boolean
  external?: boolean
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
const pill = "text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"

const navBtn = (active: boolean) =>
  cn(
    "relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 select-none cursor-pointer group",
    active
      ? "text-foreground bg-accent/30"
      : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
  )

// ─── Component ────────────────────────────────────────────────────────────────
export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [dict, setDict] = useState<any>(null)
  const [lang, setLang] = useState<Locale>("fr")
  const pathname = usePathname()
  const params = useParams()
  const { data: session } = useSession()
  const navRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

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

  useEffect(() => {
    setMobileOpen(false)
    setOpenMenu(null)
  }, [pathname])

  // Smart hover delay for mega menus
  const handleMouseEnter = (key: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpenMenu(key)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenMenu(null)
    }, 150)
  }

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

  // ── Mega menu definitions with complete translations ──────────────────────
  const megas: Record<string, MegaMenu> = {
    marketplace: {
      label: t("navigation.marketplace", "Marketplace"),
      cta: {
        label: t("navigation.postProject", "Poster un projet"),
        href: `/${lang}/projects/create`,
        icon: <Rocket className="h-3.5 w-3.5" />
      },
      groups: [
        {
          title: t("navigation.findTalents", "Trouver des talents"),
          items: [
            {
              href: `/${lang}/talents`,
              label: t("navigation.talents", "Talents"),
              description: t("navigation.talentsDesc", "Parcourir tous les freelances"),
              icon: <Users className="h-4 w-4" />
            },
            {
              href: `/${lang}/freelancers`,
              label: t("navigation.freelancers", "Freelancers"),
              description: t("navigation.freelancersDesc", "Profils vérifiés & disponibles"),
              icon: <UserCheck className="h-4 w-4" />
            },
            {
              href: `/${lang}/ai-matching`,
              label: t("navigation.aiMatching", "AI Matching"),
              description: t("navigation.aiMatchingDesc", "Trouver le profil parfait par IA"),
              icon: <Sparkles className="h-4 w-4" />,
              badge: "AI",
              highlight: true
            },
            {
              href: `/${lang}/ai-matching/clients`,
              label: t("navigation.matchingClients", "Matching Clients"),
              description: t("navigation.matchingClientsDesc", "Recommandations pour clients"),
              icon: <Sparkles className="h-4 w-4" />
            },
          ],
        },
        {
          title: t("navigation.findWork", "Trouver du travail"),
          items: [
            {
              href: `/${lang}/gigs`,
              label: t("navigation.gigs", "Gigs"),
              description: t("navigation.gigsDesc", "Services proposés par des pros"),
              icon: <ZapIcon className="h-4 w-4" />
            },
            {
              href: `/${lang}/gigs/create`,
              label: t("navigation.createGig", "Créer un Gig"),
              description: t("navigation.createGigDesc", "Proposez vos services"),
              icon: <Package className="h-4 w-4" />
            },
            {
              href: `/${lang}/projects`,
              label: t("navigation.projects", "Projets"),
              description: t("navigation.projectsDesc", "Missions & appels d'offres"),
              icon: <Briefcase className="h-4 w-4" />
            },
            {
              href: `/${lang}/ai-matching/freelancers`,
              label: t("navigation.matchingFreelancers", "Matching Freelances"),
              description: t("navigation.matchingFreelancersDesc", "Projets correspondant à vos skills"),
              icon: <Cpu className="h-4 w-4" />
            },
          ],
        },
      ],
    },

    workspace: {
      label: t("navigation.workspace", "Espace de travail"),
      cta: {
        label: t("navigation.myDashboard", "Mon Dashboard"),
        href: `/${lang}/dashboard`,
        icon: <LayoutDashboard className="h-3.5 w-3.5" />
      },
      groups: [
        {
          title: t("navigation.management", "Gestion"),
          items: [
            {
              href: `/${lang}/dashboard/messages`,
              label: t("navigation.messages", "Messages"),
              description: t("navigation.messagesDesc", "Conversations & notifications"),
              icon: <MessageCircle className="h-4 w-4" />
            },
            {
              href: `/${lang}/calendar`,
              label: t("navigation.calendar", "Calendrier"),
              description: t("navigation.calendarDesc", "Planifier vos rendez-vous"),
              icon: <Calendar className="h-4 w-4" />
            },
            {
              href: `/${lang}/contracts`,
              label: t("navigation.contracts", "Contrats"),
              description: t("navigation.contractsDesc", "Gérez vos accords juridiques"),
              icon: <ScrollText className="h-4 w-4" />
            },
            {
              href: `/${lang}/orders`,
              label: t("navigation.orders", "Commandes"),
              description: t("navigation.ordersDesc", "Suivi des commandes actives"),
              icon: <ShoppingBag className="h-4 w-4" />
            },
          ],
        },
        {
          title: t("navigation.financeTeams", "Finance & Équipes"),
          items: [
            {
              href: `/${lang}/dashboard/payment-methods`,
              label: t("navigation.payments", "Paiements"),
              description: t("navigation.paymentsDesc", "Méthodes de paiement & historique"),
              icon: <CreditCard className="h-4 w-4" />
            },
            {
              href: `/${lang}/dashboard/referrals`,
              label: t("navigation.referrals", "Parrainage"),
              description: t("navigation.referralsDesc", "Invitez & gagnez des récompenses"),
              icon: <GitBranch className="h-4 w-4" />
            },
            {
              href: `/${lang}/teams`,
              label: t("navigation.teams", "Équipes"),
              description: t("navigation.teamsDesc", "Gérez vos équipes de travail"),
              icon: <Users className="h-4 w-4" />
            },
            {
              href: `/${lang}/team/contracts`,
              label: t("navigation.teamContracts", "Contrats Équipe"),
              description: t("navigation.teamContractsDesc", "Contrats collectifs & missions"),
              icon: <Gavel className="h-4 w-4" />
            },
          ],
        },
      ],
    },

    community: {
      label: t("navigation.community", "Communauté"),
      cta: {
        label: t("navigation.viewAllGroups", "Voir tous les groupes"),
        href: `/${lang}/groups`,
        icon: <Hash className="h-3.5 w-3.5" />
      },
      groups: [
        {
          title: t("navigation.learnGrow", "Apprendre & Grandir"),
          items: [
            {
              href: `/${lang}/dashboard/academy`,
              label: t("navigation.academy", "Académie"),
              description: t("navigation.academyDesc", "Formations & certifications"),
              icon: <GraduationCap className="h-4 w-4" />,
              badge: t("navigation.new", "Nouveau")
            },
            {
              href: `/${lang}/blog`,
              label: t("navigation.blog", "Blog"),
              description: t("navigation.blogDesc", "Articles & tendances du secteur"),
              icon: <TrendingUp className="h-4 w-4" />
            },
            {
              href: `/${lang}/news`,
              label: t("navigation.news", "Actualités"),
              description: t("navigation.newsDesc", "Dernières nouvelles NRBTalents"),
              icon: <Bell className="h-4 w-4" />
            },
            {
              href: `/${lang}/how-it-works`,
              label: t("navigation.howItWorks", "Comment ça marche"),
              description: t("navigation.howItWorksDesc", "Guide complet de la plateforme"),
              icon: <BookOpen className="h-4 w-4" />
            },
          ],
        },
        {
          title: t("navigation.groupsNetwork", "Groupes & Réseau"),
          items: [
            {
              href: `/${lang}/groups`,
              label: t("navigation.groups", "Groupes"),
              description: t("navigation.groupsDesc", "Rejoignez des communautés pros"),
              icon: <Hash className="h-4 w-4" />
            },
            {
              href: `/${lang}/groups/create`,
              label: t("navigation.createGroup", "Créer un groupe"),
              description: t("navigation.createGroupDesc", "Lancez votre propre communauté"),
              icon: <Layers className="h-4 w-4" />
            },
            {
              href: `/${lang}/groups/my-groups`,
              label: t("navigation.myGroups", "Mes groupes"),
              description: t("navigation.myGroupsDesc", "Groupes que vous gérez"),
              icon: <Users className="h-4 w-4" />
            },
            {
              href: `/${lang}/ide`,
              label: t("navigation.cloudIDE", "IDE Cloud"),
              description: t("navigation.cloudIDEDesc", "Codez directement dans le cloud"),
              icon: <Code2 className="h-4 w-4" />,
              badge: "Beta"
            },
          ],
        },
      ],
    },

    enterprise: {
      label: t("navigation.enterprise", "Entreprise"),
      cta: {
        label: t("navigation.contactSales", "Contacter les ventes"),
        href: `/${lang}/contact-sales`,
        icon: <Mail className="h-3.5 w-3.5" />
      },
      groups: [
        {
          title: t("navigation.solutions", "Solutions"),
          items: [
            {
              href: `/${lang}/enterprise`,
              label: t("navigation.enterpriseSolutions", "Solutions Entreprise"),
              description: t("navigation.enterpriseSolutionsDesc", "Pour les grandes organisations"),
              icon: <Building className="h-4 w-4" />
            },
            {
              href: `/${lang}/teams/dashboard`,
              label: t("navigation.teamDashboard", "Dashboard Équipe"),
              description: t("navigation.teamDashboardDesc", "Vue d'ensemble de votre équipe"),
              icon: <BarChart3 className="h-4 w-4" />
            },
            {
              href: `/${lang}/pricing`,
              label: t("navigation.pricing", "Tarifs"),
              description: t("navigation.pricingDesc", "Plans & abonnements"),
              icon: <DollarSign className="h-4 w-4" />
            },
            {
              href: `/${lang}/admin/verification`,
              label: t("navigation.adminVerification", "Vérification Admin"),
              description: t("navigation.adminVerificationDesc", "Accès administration"),
              icon: <Shield className="h-4 w-4" />
            },
          ],
        },
        {
          title: t("navigation.supportDocs", "Support & Docs"),
          items: [
            {
              href: `/${lang}/docs`,
              label: t("navigation.documentation", "Documentation"),
              description: t("navigation.documentationDesc", "API & guides développeurs"),
              icon: <FileText className="h-4 w-4" />
            },
            {
              href: `/${lang}/faq`,
              label: t("navigation.faq", "FAQ"),
              description: t("navigation.faqDesc", "Questions fréquentes"),
              icon: <HelpCircle className="h-4 w-4" />
            },
            {
              href: `/${lang}/contact`,
              label: t("navigation.contact", "Contact"),
              description: t("navigation.contactDesc", "Parlez à notre équipe"),
              icon: <Headphones className="h-4 w-4" />
            },
            {
              href: `/${lang}/about`,
              label: t("navigation.about", "À propos"),
              description: t("navigation.aboutDesc", "Notre histoire & mission"),
              icon: <Info className="h-4 w-4" />
            },
          ],
        },
      ],
    },
  }

  // External platforms
  const externalPlatforms = [
    {
      name: "Upwork",
      href: "https://www.upwork.com",
      icon: <ExternalLink className="h-4 w-4" />,
      description: t("external.upworkDesc", "Trouvez des freelances sur Upwork")
    },
    {
      name: "Fiverr",
      href: "https://www.fiverr.com",
      icon: <ExternalLink className="h-4 w-4" />,
      description: t("external.fiverrDesc", "Services freelance sur Fiverr")
    },
    {
      name: "Toptal",
      href: "https://www.toptal.com",
      icon: <Star className="h-4 w-4" />,
      description: t("external.toptalDesc", "Talents d'exception")
    },
    {
      name: "Malt",
      href: "https://www.malt.fr",
      icon: <ExternalLink className="h-4 w-4" />,
      description: t("external.maltDesc", "Plateforme freelance européenne")
    },
  ]

  const languages = [
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "mg", label: "Malagasy", flag: "🇲🇬" },
  ]

  // ─── Loading skeleton ────────────────────────────────────────────────────
  if (!dict) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-xl border-b border-border/40">
        <div className="mx-auto max-w-7xl px-4 h-full flex items-center justify-between">
          <div className="h-8 w-32 bg-muted animate-pulse rounded-xl" />
          <div className="hidden lg:flex gap-2">
            {[80, 96, 80, 64, 80].map((w, i) => (
              <div key={i} className={`h-8 bg-muted animate-pulse rounded-lg`} style={{ width: w }} />
            ))}
          </div>
          <div className="h-8 w-24 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div ref={navRef}>
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/98 backdrop-blur-2xl border-b border-border/60 shadow-lg"
          : "bg-background/95 backdrop-blur-xl border-b border-border/30"
      )}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center gap-4">

            {/* ── Logo ──────────────────────────────────────────────── */}
            <Link
              href={`/${lang}`}
              className="flex items-center gap-2.5 group flex-shrink-0"
              onClick={() => setOpenMenu(null)}
            >
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
                  {t("navigation.tagline", "La révolution freelance")}
                </span>
              </div>
            </Link>

            {/* ── Desktop mega nav ──────────────────────────────────── */}
            <div className="hidden lg:flex items-center gap-0.5 flex-1">
              {/* Home */}
              <Link
                href={`/${lang}`}
                className={navBtn(isActive(`/${lang}`))}
                onClick={() => setOpenMenu(null)}
              >
                <Home className="h-3.5 w-3.5" />
                <span>{t("navigation.home", "Accueil")}</span>
                {isActive(`/${lang}`) && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
                )}
              </Link>

              {/* Mega menus */}
              {Object.entries(megas).map(([key, mega]) => {
                const anyActive = mega.groups.some(g =>
                  g.items.some(item => isActive(item.href))
                )
                return (
                  <div
                    key={key}
                    onMouseEnter={() => handleMouseEnter(key)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      className={navBtn(anyActive || openMenu === key)}
                      onClick={() => setOpenMenu(openMenu === key ? null : key)}
                    >
                      <span>{mega.label}</span>
                      <ChevronDown className={cn(
                        "h-3 w-3 transition-transform duration-200",
                        openMenu === key && "rotate-180"
                      )} />
                      {anyActive && (
                        <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* ── Desktop right actions ─────────────────────────────── */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              <SearchCommand />
              <ThemeToggle />

              {/* Meet Button */}
              <MeetButtonCompact />

              {/* External Platforms Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 h-8 px-2.5">
                    <Globe className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Externes</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t("external.platforms", "Plateformes partenaires")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {externalPlatforms.map((platform) => (
                    <DropdownMenuItem key={platform.name} asChild>
                      <a
                        href={platform.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 cursor-pointer py-2"
                      >
                        <div className="p-1.5 rounded-lg bg-accent/30">
                          {platform.icon}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{platform.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {platform.description}
                          </span>
                        </div>
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Language Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 h-8 px-2.5">
                    <Globe className="h-3.5 w-3.5" />
                    <span className="uppercase text-xs font-medium">{lang}</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {languages.map((l) => (
                    <DropdownMenuItem
                      key={l.code}
                      onClick={() => switchLang(l.code)}
                      className={cn(
                        "cursor-pointer gap-2",
                        lang === l.code && "bg-accent"
                      )}
                    >
                      <span className="text-base leading-none">{l.flag}</span>
                      <span className="flex-1 text-left text-sm">{l.label}</span>
                      {lang === l.code && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="h-5 w-px bg-border/60 mx-1" />

              {/* User Menu */}
              <UserMenu dict={dict} lang={lang} />
            </div>

            {/* ── Mobile actions ────────────────────────────────────── */}
            <div className="flex items-center gap-1.5 lg:hidden ml-auto">
              <SearchCommand variant="mobile" />
              <ThemeToggle />

              {/* Mobile Meet Button */}
              <MeetButtonCompact />

              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </SheetTrigger>

                <SheetContent side="right" className="w-full max-w-[380px] p-0 flex flex-col border-l border-border/60">
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
                          <button
                            key={l.code}
                            onClick={() => switchLang(l.code)}
                            className={cn(
                              "text-base px-1.5 py-0.5 rounded-lg transition-colors",
                              lang === l.code ? "bg-accent" : "hover:bg-accent/50"
                            )}
                          >
                            {l.flag}
                          </button>
                        ))}
                      </div>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto overscroll-contain">
                    <div className="px-3 py-3 space-y-1">
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
                        <div className="p-1.5 rounded-lg bg-accent/50">
                          <Home className="h-4 w-4" />
                        </div>
                        {t("navigation.home", "Accueil")}
                        <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                      </Link>

                      {/* Mobile mega accordions */}
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
                                    <Link
                                      href={mega.cta.href}
                                      onClick={() => setMobileOpen(false)}
                                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 text-sm font-semibold text-foreground hover:from-blue-500/20 hover:to-violet-500/20 transition-all"
                                    >
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

                      {/* External Platforms Section */}
                      <div className="pt-4 mt-2 border-t border-border/40">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-3 mb-2">
                          {t("external.platforms", "Plateformes partenaires")}
                        </p>
                        {externalPlatforms.map((platform) => (
                          <a
                            key={platform.name}
                            href={platform.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                          >
                            <div className="p-1.5 rounded-lg bg-accent/40">
                              {platform.icon}
                            </div>
                            <div className="flex flex-col flex-1">
                              <span className="font-medium">{platform.name}</span>
                              <span className="text-xs text-muted-foreground">{platform.description}</span>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 opacity-50" />
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* User Section Mobile */}
                    <div className="px-3 pb-4 pt-4 border-t border-border/40 space-y-3 mt-2">
                      {session?.user ? (
                        <>
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border border-border/40">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                              {session.user.name?.charAt(0).toUpperCase() ?? "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{session.user.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                              <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5 capitalize">
                                {(session.user as any).role === "freelance" ? "Freelance" : "Client"}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { href: `/${lang}/dashboard`, icon: <LayoutDashboard className="h-3.5 w-3.5" />, label: t("navigation.dashboard", "Dashboard") },
                              { href: `/${lang}/profile`, icon: <User className="h-3.5 w-3.5" />, label: t("navigation.profile", "Profil") },
                              { href: `/${lang}/dashboard/messages`, icon: <MessageCircle className="h-3.5 w-3.5" />, label: t("navigation.messages", "Messages") },
                              { href: `/${lang}/dashboard/settings`, icon: <Settings className="h-3.5 w-3.5" />, label: t("navigation.settings", "Paramètres") },
                            ].map(({ href, icon, label }) => (
                              <Button
                                key={href}
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-auto py-2.5 flex-col gap-1 text-[11px] border-border/60"
                              >
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
                            onClick={() => {
                              signOut({ callbackUrl: `/${lang}` })
                              setMobileOpen(false)
                            }}
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            {t("navigation.logout", "Déconnexion")}
                          </Button>
                        </>
                      ) : (
                        <div className="space-y-2 pt-1">
                          <Button
                            asChild
                            className="w-full h-10 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 border-0 shadow-lg shadow-violet-500/20"
                          >
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
                          { href: `/${lang}/terms`, label: t("legal.terms", "CGU") },
                          { href: `/${lang}/privacy`, label: t("legal.privacy", "Confidentialité") },
                          { href: `/${lang}/cookies`, label: t("legal.cookies", "Cookies") },
                          { href: `/${lang}/contact`, label: t("navigation.contact", "Contact") },
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

      {/* ── Mega menu panels (desktop) ────────────────────────────────────── */}
      {openMenu && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onClick={() => setOpenMenu(null)}
            onMouseEnter={() => setOpenMenu(null)}
          />
          <div
            className="fixed top-16 left-0 right-0 z-50 flex justify-center px-4"
            onMouseLeave={handleMouseLeave}
          >
            <div className="w-full max-w-6xl rounded-2xl border border-border/60 bg-popover/98 backdrop-blur-2xl shadow-2xl shadow-black/15 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                      <div className="w-56 flex-shrink-0 border-l border-border/40 bg-gradient-to-b from-accent/20 to-accent/5 p-5 flex flex-col justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-4">
                            {t("navigation.quickAction", "Action rapide")}
                          </p>
                          <Link
                            href={mega.cta.href}
                            onClick={() => setOpenMenu(null)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/35 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            {mega.cta.icon}
                            <span>{mega.cta.label}</span>
                            <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                          </Link>
                        </div>
                        <div className="mt-6 p-3 rounded-xl bg-gradient-to-br from-blue-500/5 to-violet-500/5 border border-blue-500/10">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-foreground block mb-1">NRBTalents</span>
                            {t("navigation.taglineDescription", "La plateforme freelance de référence pour la communauté tech africaine.")}
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