// components/navigation/Navigation.tsx
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Menu, X, Sparkles, Rocket, Users, Zap, Settings, 
  MessageCircle, User, LayoutDashboard, LogOut, Building,
  ChevronDown, ChevronRight, Home, Globe, Briefcase, 
  Award, Code2, Calendar, DollarSign, Shield, Star,
  TrendingUp, Video, FileText, HelpCircle, ExternalLink
} from "lucide-react"
import { useState, useEffect } from "react"
import { UserMenu } from "@/components/user-menu"
import { SearchCommand } from "@/components/search-command"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import { usePathname, useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { signOut, useSession } from "next-auth/react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
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

interface NavItem {
  href: string
  labelKey: string
  icon: React.ReactNode
  descriptionKey: string
  external?: boolean
  externalUrl?: string
  children?: NavItem[]
  badge?: string
}

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dict, setDict] = useState<any>(null)
  const [lang, setLang] = useState<Locale>('fr')
  const pathname = usePathname()
  const params = useParams()
  const { data: session } = useSession()

  // Load dictionary based on language
  useEffect(() => {
    const currentLang = (params.lang as Locale) || 'fr'
    setLang(currentLang)
    getDictionarySafe(currentLang).then(setDict)
  }, [params.lang])

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Helper to get localized text
  const t = (key: string) => {
    if (!dict) return key
    const keys = key.split('.')
    let value = dict
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        return key
      }
    }
    return value || key
  }

  // Navigation items with translations
  const navItems: NavItem[] = [
    {
      href: `/${lang}`,
      labelKey: 'navigation.home',
      icon: <Home className="h-5 w-5" />,
      descriptionKey: 'navigation.homeDesc',
    },
    {
      href: `/${lang}/talents`,
      labelKey: 'navigation.talents',
      icon: <Users className="h-5 w-5" />,
      descriptionKey: 'navigation.talentsDesc',
    },
    {
      href: `/${lang}/gigs`,
      labelKey: 'navigation.gigs',
      icon: <Zap className="h-5 w-5" />,
      descriptionKey: 'navigation.gigsDesc',
    },
    {
      href: `/${lang}/projects`,
      labelKey: 'navigation.projects',
      icon: <Rocket className="h-5 w-5" />,
      descriptionKey: 'navigation.projectsDesc',
    },
    {
      href: `/${lang}/ai-matching`,
      labelKey: 'navigation.aiMatching',
      icon: <Sparkles className="h-5 w-5" />,
      descriptionKey: 'navigation.aiMatchingDesc',
      badge: "AI",
    },
    {
      href: '#',
      labelKey: 'navigation.resources',
      icon: <FileText className="h-5 w-5" />,
      descriptionKey: 'navigation.resourcesDesc',
      children: [
        {
          href: `/${lang}/blog`,
          labelKey: 'navigation.blog',
          icon: <TrendingUp className="h-4 w-4" />,
          descriptionKey: 'navigation.blogDesc',
        },
        {
          href: `/${lang}/academy`,
          labelKey: 'navigation.academy',
          icon: <Award className="h-4 w-4" />,
          descriptionKey: 'navigation.academyDesc',
        },
        {
          href: `/${lang}/faq`,
          labelKey: 'navigation.faq',
          icon: <HelpCircle className="h-4 w-4" />,
          descriptionKey: 'navigation.faqDesc',
        },
        {
          href: `/${lang}/docs`,
          labelKey: 'navigation.docs',
          icon: <FileText className="h-4 w-4" />,
          descriptionKey: 'navigation.docsDesc',
        },
      ],
    },
    {
      href: '#',
      labelKey: 'navigation.enterprise',
      icon: <Building className="h-5 w-5" />,
      descriptionKey: 'navigation.enterpriseDesc',
      children: [
        {
          href: `/${lang}/enterprise`,
          labelKey: 'navigation.solutions',
          icon: <Building className="h-4 w-4" />,
          descriptionKey: 'navigation.solutionsDesc',
        },
        {
          href: `/${lang}/teams`,
          labelKey: 'navigation.teams',
          icon: <Users className="h-4 w-4" />,
          descriptionKey: 'navigation.teamsDesc',
        },
        {
          href: `/${lang}/contact-sales`,
          labelKey: 'navigation.contactSales',
          icon: <MessageCircle className="h-4 w-4" />,
          descriptionKey: 'navigation.contactSalesDesc',
        },
      ],
    },
  ]

  // External links (like Upwork)
  const externalLinks = [
    {
      labelKey: 'external.upwork',
      href: 'https://www.upwork.com',
      icon: <ExternalLink className="h-4 w-4" />,
      description: 'Trouvez des freelances sur Upwork',
    },
    {
      labelKey: 'external.fiverr',
      href: 'https://www.fiverr.com',
      icon: <ExternalLink className="h-4 w-4" />,
      description: 'Services freelance sur Fiverr',
    },
    {
      labelKey: 'external.toptal',
      href: 'https://www.toptal.com',
      icon: <Star className="h-4 w-4" />,
      description: 'Talents d\'exception',
    },
  ]

  const isActive = (href: string) => {
    if (href === '#') return false
    if (href === `/${lang}`) return pathname === `/${lang}` || pathname === `/${lang}/`
    return pathname.startsWith(href)
  }

  // Language switcher
  const languages = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'mg', label: 'Malagasy', flag: '🇲🇬' },
  ]

  const switchLanguage = (newLang: string) => {
    const currentPath = pathname.split('/').slice(2).join('/')
    window.location.href = `/${newLang}/${currentPath}`
  }

  if (!dict) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-xl border-b">
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
      scrolled 
        ? "border-border/60 shadow-sm py-1" 
        : "border-border/40 py-0"
    )}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2">
          {/* Logo */}
          <Link 
            href={`/${lang}`} 
            className="flex items-center gap-2 sm:gap-3 group flex-shrink-0"
          >
            <div className="relative">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                NRB
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg opacity-0 group-hover:opacity-20 blur transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                NRBTalents
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground -mt-1 hidden sm:block">
                {t('navigation.tagline')}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation with Dropdowns */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              if (item.children && item.children.length > 0) {
                return (
                  <DropdownMenu key={item.labelKey}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          "group relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                          isActive(item.href)
                            ? "text-foreground bg-accent/50"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                        )}
                      >
                        {item.icon}
                        <span>{t(item.labelKey)}</span>
                        <ChevronDown className="h-3 w-3 opacity-60" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-64">
                      {item.children.map((child) => (
                        <DropdownMenuItem key={child.labelKey} asChild>
                          <Link
                            href={child.href}
                            className="flex items-center gap-3 cursor-pointer py-2"
                          >
                            <div className="p-1.5 rounded-lg bg-accent/30">
                              {child.icon}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">{t(child.labelKey)}</span>
                              <span className="text-xs text-muted-foreground">
                                {t(child.descriptionKey)}
                              </span>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                    isActive(item.href)
                      ? "text-foreground bg-accent/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                  )}
                >
                  {item.icon}
                  <span>{t(item.labelKey)}</span>
                  {item.badge && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold">
                      {item.badge}
                    </span>
                  )}
                  
                  {/* Tooltip */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {t(item.descriptionKey)}
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-foreground rotate-45" />
                  </div>
                </Link>
              )
            })}
          </div>

          {/* External Links Dropdown */}
          <div className="hidden lg:flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">{t('external.platforms')}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>{t('external.freelancePlatforms')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {externalLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 cursor-pointer py-2"
                    >
                      <div className="p-1.5 rounded-lg bg-accent/30">
                        {link.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{t(link.labelKey)}</span>
                        <span className="text-xs text-muted-foreground">
                          {link.description}
                        </span>
                      </div>
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Actions Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <MeetButtonCompact />
            <SearchCommand />
            <ThemeToggle />
            <div className="h-6 w-px bg-border" />
            
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Globe className="h-4 w-4" />
                  <span className="uppercase text-sm">{lang}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((l) => (
                  <DropdownMenuItem
                    key={l.code}
                    onClick={() => switchLanguage(l.code)}
                    className={cn(
                      "cursor-pointer gap-2",
                      lang === l.code && "bg-accent"
                    )}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                    {lang === l.code && <CheckCircle2 className="h-4 w-4 ml-auto text-green-500" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <UserMenu dict={dict} lang={lang} />
          </div>

          {/* Actions Mobile/Tablette */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <SearchCommand variant="mobile" />
            
            {/* Language Switcher Mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((l) => (
                  <DropdownMenuItem
                    key={l.code}
                    onClick={() => switchLanguage(l.code)}
                    className={cn(
                      "cursor-pointer gap-2",
                      lang === l.code && "bg-accent"
                    )}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Mobile Menu with Sheet */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-9 w-9 rounded-lg hover:bg-accent"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              
              <SheetContent side="right" className="w-full sm:w-[400px] p-0 overflow-y-auto">
                <SheetHeader className="p-6 border-b sticky top-0 bg-background z-10">
                  <SheetTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      NRB
                    </div>
                    <span className="text-lg font-bold">{t('navigation.menu')}</span>
                  </SheetTitle>
                </SheetHeader>

                <div className="p-4 space-y-6">
                  {/* Navigation principale mobile */}
                  <Accordion type="single" collapsible className="w-full">
                    {navItems.map((item) => {
                      if (item.children && item.children.length > 0) {
                        return (
                          <AccordionItem key={item.labelKey} value={item.labelKey}>
                            <AccordionTrigger className="text-base font-semibold py-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-accent/30">
                                  {item.icon}
                                </div>
                                <span>{t(item.labelKey)}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pl-4">
                                {item.children.map((child) => (
                                  <Link
                                    key={child.labelKey}
                                    href={child.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-base transition-all hover:bg-accent/50"
                                  >
                                    <div className="p-1.5 rounded-lg bg-accent/30">
                                      {child.icon}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                      <span className="font-medium">{t(child.labelKey)}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {t(child.descriptionKey)}
                                      </span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  </Link>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )
                      }
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-4 py-3 text-base transition-all mb-1",
                            isActive(item.href)
                              ? "bg-accent text-foreground border-l-4 border-blue-500"
                              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-lg",
                            isActive(item.href) ? "bg-blue-100 dark:bg-blue-900/30" : "bg-accent/50"
                          )}>
                            {item.icon}
                          </div>
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{t(item.labelKey)}</span>
                              {item.badge && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {t(item.descriptionKey)}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      )
                    })}
                  </Accordion>

                  {/* External Platforms Section */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground px-2">
                      {t('external.freelancePlatforms')}
                    </h3>
                    <div className="space-y-2">
                      {externalLinks.map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-base transition-all hover:bg-accent/50"
                        >
                          <div className="p-2 rounded-lg bg-accent/30">
                            {link.icon}
                          </div>
                          <div className="flex flex-col flex-1">
                            <span className="font-medium">{t(link.labelKey)}</span>
                            <span className="text-xs text-muted-foreground">
                              {link.description}
                            </span>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Meet Button Mobile */}
                  <div className="pt-2">
                    <MeetButtonCompact />
                  </div>

                  {/* Section utilisateur */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-semibold text-muted-foreground px-2">
                      {session?.user ? t('navigation.mySpace') : t('navigation.account')}
                    </h3>

                    {session?.user ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/30 border">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-lg flex-shrink-0">
                            {session.user.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{session.user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 capitalize">
                              {(session.user as any).role || t('navigation.user')}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" asChild className="h-auto py-3">
                            <Link href={`/${lang}/dashboard`} className="flex flex-col items-center gap-1">
                              <LayoutDashboard className="h-4 w-4" />
                              <span className="text-xs">{t('navigation.dashboard')}</span>
                            </Link>
                          </Button>
                          <Button variant="outline" asChild className="h-auto py-3">
                            <Link href={`/${lang}/profile`} className="flex flex-col items-center gap-1">
                              <User className="h-4 w-4" />
                              <span className="text-xs">{t('navigation.profile')}</span>
                            </Link>
                          </Button>
                          <Button variant="outline" asChild className="h-auto py-3">
                            <Link href={`/${lang}/messages`} className="flex flex-col items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              <span className="text-xs">{t('navigation.messages')}</span>
                            </Link>
                          </Button>
                          <Button variant="outline" asChild className="h-auto py-3">
                            <Link href={`/${lang}/dashboard/settings`} className="flex flex-col items-center gap-1">
                              <Settings className="h-4 w-4" />
                              <span className="text-xs">{t('navigation.settings')}</span>
                            </Link>
                          </Button>
                        </div>

                        <Button 
                          variant="destructive" 
                          onClick={() => {
                            signOut({ callbackUrl: `/${lang}` })
                            setMobileMenuOpen(false)
                          }}
                          className="w-full gap-2"
                        >
                          <LogOut className="h-4 w-4" />
                          {t('navigation.logout')}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                          <Link href={`/${lang}/auth/signup`} onClick={() => setMobileMenuOpen(false)}>
                            <Rocket className="h-4 w-4 mr-2" />
                            {t('navigation.signup')}
                          </Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full">
                          <Link href={`/${lang}/auth/signin`} onClick={() => setMobileMenuOpen(false)}>
                            <User className="h-4 w-4 mr-2" />
                            {t('navigation.signin')}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-2 text-xs text-center">
                      <Link href={`/${lang}/legal/terms`} className="text-muted-foreground hover:text-foreground p-2">
                        {t('legal.terms')}
                      </Link>
                      <Link href={`/${lang}/legal/privacy`} className="text-muted-foreground hover:text-foreground p-2">
                        {t('legal.privacy')}
                      </Link>
                      <Link href={`/${lang}/legal/cookies`} className="text-muted-foreground hover:text-foreground p-2">
                        {t('legal.cookies')}
                      </Link>
                      <Link href={`/${lang}/contact`} className="text-muted-foreground hover:text-foreground p-2">
                        {t('navigation.contact')}
                      </Link>
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-4">
                      © 2026 NRBTalents. {t('footer.rights')}
                    </p>
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