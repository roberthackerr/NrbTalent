// components/navigation/Navigation.tsx
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Menu, Sparkles, Rocket, Users, Zap,
  MessageCircle, User, LayoutDashboard, LogOut, Building,
  ChevronDown, ChevronRight, Home, Globe,
  Award, FileText, HelpCircle, ExternalLink,
  CheckCircle2, TrendingUp, Star, MoreHorizontal,
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
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion"
import { MeetButtonCompact } from "./meet/MeetButton"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavItem {
  href: string
  labelKey: string
  shortKey?: string
  icon: React.ReactNode
  descriptionKey: string
  badge?: string
  children?: NavItem[]
}

export function Navigation() {
  const [scrolled, setScrolled]             = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dict, setDict]                     = useState<any>(null)
  const [lang, setLang]                     = useState<Locale>('fr')
  const pathname  = usePathname()
  const params    = useParams()
  const { data: session } = useSession()

  useEffect(() => {
    const l = (params.lang as Locale) || 'fr'
    setLang(l)
    getDictionarySafe(l).then(setDict)
  }, [params.lang])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setMobileMenuOpen(false) }, [pathname])

  const t = (key: string): string => {
    if (!dict) return key
    let v: any = dict
    for (const k of key.split('.')) {
      if (v && typeof v === 'object') v = v[k]; else return key
    }
    return v || key
  }

  // Primary nav — shown inline on desktop
  const primaryNav: NavItem[] = [
    { href: `/${lang}/talents`,     labelKey: 'navigation.talents',    icon: <Users className="h-3.5 w-3.5" />,    descriptionKey: 'navigation.talentsDesc' },
    { href: `/${lang}/gigs`,        labelKey: 'navigation.gigs',       icon: <Zap className="h-3.5 w-3.5" />,      descriptionKey: 'navigation.gigsDesc' },
    { href: `/${lang}/projects`,    labelKey: 'navigation.projects',   icon: <Rocket className="h-3.5 w-3.5" />,   descriptionKey: 'navigation.projectsDesc' },
    { href: `/${lang}/ai-matching`, labelKey: 'navigation.aiMatching', icon: <Sparkles className="h-3.5 w-3.5" />, descriptionKey: 'navigation.aiMatchingDesc', badge: "AI" },
  ]

  // Secondary nav — hidden in "More" dropdown on desktop
  const secondaryNav: NavItem[] = [
    {
      href: '#', labelKey: 'navigation.resources', icon: <FileText className="h-4 w-4" />, descriptionKey: 'navigation.resourcesDesc',
      children: [
        { href: `/${lang}/blog`,    labelKey: 'navigation.blog',    icon: <TrendingUp className="h-4 w-4" />, descriptionKey: 'navigation.blogDesc' },
        { href: `/${lang}/academy`, labelKey: 'navigation.academy', icon: <Award className="h-4 w-4" />,      descriptionKey: 'navigation.academyDesc' },
        { href: `/${lang}/faq`,     labelKey: 'navigation.faq',     icon: <HelpCircle className="h-4 w-4" />, descriptionKey: 'navigation.faqDesc' },
        { href: `/${lang}/docs`,    labelKey: 'navigation.docs',    icon: <FileText className="h-4 w-4" />,   descriptionKey: 'navigation.docsDesc' },
      ],
    },
    {
      href: '#', labelKey: 'navigation.enterprise', icon: <Building className="h-4 w-4" />, descriptionKey: 'navigation.enterpriseDesc',
      children: [
        { href: `/${lang}/enterprise`,    labelKey: 'navigation.solutions',   icon: <Building className="h-4 w-4" />,      descriptionKey: 'navigation.solutionsDesc' },
        { href: `/${lang}/teams`,         labelKey: 'navigation.teams',        icon: <Users className="h-4 w-4" />,         descriptionKey: 'navigation.teamsDesc' },
        { href: `/${lang}/contact-sales`, labelKey: 'navigation.contactSales', icon: <MessageCircle className="h-4 w-4" />, descriptionKey: 'navigation.contactSalesDesc' },
      ],
    },
  ]

  // All nav items together for mobile sheet
  const allNav: NavItem[] = [
    { href: `/${lang}`, labelKey: 'navigation.home', icon: <Home className="h-4 w-4" />, descriptionKey: 'navigation.homeDesc' },
    ...primaryNav,
    ...secondaryNav,
  ]

  const externalLinks = [
    { labelKey: 'external.upwork', href: 'https://www.upwork.com', icon: <ExternalLink className="h-4 w-4" />, description: 'Freelances sur Upwork' },
    { labelKey: 'external.fiverr', href: 'https://www.fiverr.com', icon: <ExternalLink className="h-4 w-4" />, description: 'Services sur Fiverr' },
    { labelKey: 'external.toptal', href: 'https://www.toptal.com', icon: <Star className="h-4 w-4" />,         description: "Talents d'exception" },
  ]

  const languages = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English',  flag: '🇬🇧' },
    { code: 'mg', label: 'Malagasy', flag: '🇲🇬' },
  ]

  const isActive = (href: string) => {
    if (href === '#') return false
    if (href === `/${lang}`) return pathname === `/${lang}` || pathname === `/${lang}/`
    return pathname.startsWith(href)
  }

  const switchLanguage = (code: string) => {
    const rest = pathname.split('/').slice(2).join('/')
    window.location.href = `/${code}/${rest}`
  }

  if (!dict) return (
    <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur-xl border-b">
      <div className="mx-auto max-w-7xl px-4 h-full flex items-center justify-between">
        <div className="h-7 w-20 bg-muted animate-pulse rounded" />
        <div className="h-7 w-28 bg-muted animate-pulse rounded" />
      </div>
    </div>
  )

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur-xl transition-all duration-300",
      scrolled ? "border-border/60 shadow-sm" : "border-border/40"
    )}>
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="flex h-14 items-center gap-2">

          {/* ── Logo ─────────────────────────────────────────── */}
          <Link href={`/${lang}`} className="flex items-center gap-2 group flex-shrink-0 mr-2">
            <div className="relative flex-shrink-0">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-[11px] shadow-md">
                NRB
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg opacity-0 group-hover:opacity-20 blur transition-opacity" />
            </div>
            <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:inline whitespace-nowrap">
              NRBTalents
            </span>
          </Link>

          {/* ── Desktop primary nav ───────────────────────── */}
          <div className="hidden lg:flex items-center gap-0.5 flex-shrink-0">
            {primaryNav.map((item) => (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                  isActive(item.href)
                    ? "text-foreground bg-accent/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                )}>
                {item.icon}
                <span>{t(item.labelKey)}</span>
                {item.badge && (
                  <span className="text-[9px] px-1 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold leading-none">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}

            {/* "More" dropdown for secondary nav */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-all">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">Plus</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {secondaryNav.map((group) =>
                  group.children?.map((child) => (
                    <DropdownMenuItem key={child.href} asChild>
                      <Link href={child.href} className="flex items-center gap-2.5 cursor-pointer py-2">
                        <div className="p-1 rounded-md bg-accent/30 flex-shrink-0">{child.icon}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-none">{t(child.labelKey)}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{t(child.descriptionKey)}</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                {externalLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <a href={link.href} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 cursor-pointer py-2">
                      <div className="p-1 rounded-md bg-accent/30 flex-shrink-0">{link.icon}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-none">{t(link.labelKey)}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{link.description}</p>
                      </div>
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* ── Desktop right actions ─────────────────────── */}
          <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
            <MeetButtonCompact />
            <SearchCommand />
            <ThemeToggle />

            {/* Language */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 h-8 px-2 text-xs">
                  <Globe className="h-3.5 w-3.5" />
                  <span className="uppercase font-semibold">{lang}</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {languages.map((l) => (
                  <DropdownMenuItem key={l.code} onClick={() => switchLanguage(l.code)}
                    className={cn("cursor-pointer gap-2", lang === l.code && "bg-accent")}>
                    <span>{l.flag}</span>
                    <span className="flex-1">{l.label}</span>
                    {lang === l.code && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-5 w-px bg-border" />
            <UserMenu dict={dict} lang={lang} />
          </div>

          {/* ── Mobile/Tablet right actions ───────────────── */}
          <div className="flex items-center gap-1 lg:hidden flex-shrink-0">
            <SearchCommand variant="mobile" />
            <ThemeToggle />

            {/* Language — icon only */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {languages.map((l) => (
                  <DropdownMenuItem key={l.code} onClick={() => switchLanguage(l.code)}
                    className={cn("cursor-pointer gap-2", lang === l.code && "bg-accent")}>
                    <span>{l.flag}</span>
                    <span className="flex-1">{l.label}</span>
                    {lang === l.code && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Hamburger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-full max-w-[320px] p-0 flex flex-col">
                <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
                  <SheetTitle className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-[11px]">
                      NRB
                    </div>
                    <span className="font-bold text-sm">NRBTalents</span>
                  </SheetTitle>
                </SheetHeader>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                  <div className="px-3 py-3 space-y-4">

                    {/* Nav items */}
                    <Accordion type="single" collapsible className="space-y-1">
                      {allNav.map((item) => {
                        if (item.children?.length) {
                          return (
                            <AccordionItem key={item.labelKey} value={item.labelKey}
                              className="border rounded-xl overflow-hidden">
                              <AccordionTrigger className="px-3 py-2.5 text-sm font-semibold hover:no-underline hover:bg-accent/30 transition-colors [&>svg]:h-3.5 [&>svg]:w-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-1.5 rounded-lg bg-accent/40 flex-shrink-0">{item.icon}</div>
                                  <span>{t(item.labelKey)}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-1.5">
                                <div className="px-2 space-y-0.5">
                                  {item.children.map((child) => (
                                    <Link key={child.href} href={child.href}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent/50">
                                      <div className="p-1 rounded-md bg-accent/30 flex-shrink-0">{child.icon}</div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm leading-none">{t(child.labelKey)}</p>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">{t(child.descriptionKey)}</p>
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )
                        }
                        return (
                          <Link key={item.href} href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all border",
                              isActive(item.href)
                                ? "bg-accent/60 border-blue-500/30 text-foreground"
                                : "text-muted-foreground border-transparent hover:bg-accent/40 hover:text-foreground"
                            )}>
                            <div className={cn(
                              "p-1.5 rounded-lg flex-shrink-0",
                              isActive(item.href) ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" : "bg-accent/40"
                            )}>
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{t(item.labelKey)}</span>
                                {item.badge && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{t(item.descriptionKey)}</p>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          </Link>
                        )
                      })}
                    </Accordion>

                    {/* Meet */}
                    <MeetButtonCompact />

                    {/* External */}
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
                        {t('external.freelancePlatforms')}
                      </p>
                      {externalLinks.map((link) => (
                        <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm border border-transparent transition-all hover:bg-accent/40 text-muted-foreground hover:text-foreground">
                          <div className="p-1.5 rounded-lg bg-accent/40 flex-shrink-0">{link.icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{t(link.labelKey)}</p>
                            <p className="text-xs text-muted-foreground truncate">{link.description}</p>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                        </a>
                      ))}
                    </div>

                    {/* User */}
                    <div className="space-y-2 pt-1 border-t">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 pt-3">
                        {session?.user ? t('navigation.mySpace') : t('navigation.account')}
                      </p>

                      {session?.user ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                              {session.user.name?.charAt(0).toUpperCase() ?? "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{session.user.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { href: `/${lang}/dashboard`, icon: <LayoutDashboard className="h-3.5 w-3.5" />, label: t('navigation.dashboard') },
                              { href: `/${lang}/profile`,   icon: <User className="h-3.5 w-3.5" />,            label: t('navigation.profile') },
                              { href: `/${lang}/messages`,  icon: <MessageCircle className="h-3.5 w-3.5" />,   label: t('navigation.messages') },
                              { href: `/${lang}/dashboard/settings`, icon: <Globe className="h-3.5 w-3.5" />,  label: t('navigation.settings') },
                            ].map(({ href, icon, label }) => (
                              <Button key={href} variant="outline" size="sm" asChild className="h-auto py-2.5 flex-col gap-1">
                                <Link href={href} onClick={() => setMobileMenuOpen(false)}>
                                  {icon}
                                  <span className="text-[11px]">{label}</span>
                                </Link>
                              </Button>
                            ))}
                          </div>
                          <Button variant="destructive" size="sm" className="w-full gap-2"
                            onClick={() => { signOut({ callbackUrl: `/${lang}` }); setMobileMenuOpen(false) }}>
                            <LogOut className="h-3.5 w-3.5" />
                            {t('navigation.logout')}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Button asChild className="w-full h-9 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm">
                            <Link href={`/${lang}/auth/signup`} onClick={() => setMobileMenuOpen(false)}>
                              <Rocket className="h-3.5 w-3.5 mr-2" />
                              {t('navigation.signup')}
                            </Link>
                          </Button>
                          <Button variant="outline" asChild className="w-full h-9 text-sm">
                            <Link href={`/${lang}/auth/signin`} onClick={() => setMobileMenuOpen(false)}>
                              <User className="h-3.5 w-3.5 mr-2" />
                              {t('navigation.signin')}
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="pt-2 border-t pb-6">
                      <div className="grid grid-cols-2 gap-1 text-xs text-center">
                        {[
                          { href: `/${lang}/legal/terms`,   label: t('legal.terms') },
                          { href: `/${lang}/legal/privacy`, label: t('legal.privacy') },
                          { href: `/${lang}/legal/cookies`, label: t('legal.cookies') },
                          { href: `/${lang}/contact`,       label: t('navigation.contact') },
                        ].map(({ href, label }) => (
                          <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                            className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-accent/30 transition-colors truncate">
                            {label}
                          </Link>
                        ))}
                      </div>
                      <p className="text-center text-[11px] text-muted-foreground mt-2">
                        © 2026 NRBTalents. {t('footer.rights')}
                      </p>
                    </div>

                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>
    </nav>
  )
}