"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Menu, X, Sparkles, Rocket, Users, Zap, Settings, 
  MessageCircle, User, LayoutDashboard, LogOut, Building,
  ChevronDown, ChevronRight, Home
} from "lucide-react"
import { useState, useEffect } from "react"
import { UserMenu } from "@/components/user-menu"
import { SearchCommand } from "@/components/search-command"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import { usePathname } from "next/navigation"
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

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  // Effet pour le scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fermer le menu mobile quand la route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const navItems = [
    {
      href: "/",
      label: "Accueil",
      icon: <Home className="h-5 w-5" />,
      description: "Page d'accueil"
    },
    {
      href: "/talents",
      label: "Trouver des Talents",
      icon: <Users className="h-5 w-5" />,
      description: "Experts vérifiés"
    },
    {
      href: "/gigs",
      label: "Services",
      icon: <Zap className="h-5 w-5" />,
      description: "Prestations clé en main"
    },
    {
      href: "/projects",
      label: "Projets",
      icon: <Rocket className="h-5 w-5" />,
      description: "Opportunités freelance"
    },
    {
      href: "/ai-matching",
      label: "AI Matching",
      icon: <Sparkles className="h-5 w-5" />,
      description: "Match parfait IA"
    },
    {
      href: "/enterprise",
      label: "Entreprise",
      icon: <Building className="h-5 w-5" />,
      description: "Solutions sur mesure"
    }
  ]

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur-xl transition-all duration-300",
      scrolled 
        ? "border-border/60 shadow-sm py-1" 
        : "border-border/40 py-0"
    )}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 sm:gap-3 group flex-shrink-0"
          >
            <div className="relative">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                NRB
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg opacity-0 group-hover:opacity-20 blur transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                NRBTalents
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground -mt-1 hidden sm:block">
                La révolution freelance
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive(item.href)
                    ? "text-foreground bg-accent/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                )}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                
                {/* Indicateur actif */}
                {isActive(item.href) && (
                  <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-blue-500 rounded-full -translate-x-1/2 translate-y-1" />
                )}

                {/* Tooltip */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.description}
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-foreground rotate-45" />
                </div>
              </Link>
            ))}
          </div>
              <div className="flex items-center gap-4">
          <MeetButtonCompact dict={dict} lang={lang} />
          {/* Autres liens... */}
        </div>
          {/* Actions Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <SearchCommand />
            <ThemeToggle />
            <div className="h-6 w-px bg-border" />
            <UserMenu />
          </div>

          {/* Actions Mobile/Tablette */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <SearchCommand variant="mobile" />
            
            {/* Menu mobile avec Sheet */}
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
                    <span className="text-lg font-bold">Menu</span>
                  </SheetTitle>
                </SheetHeader>

                <div className="p-4 space-y-6">
                  {/* Navigation principale */}
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="navigation">
                      <AccordionTrigger className="text-base font-semibold py-3">
                        Navigation
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-1 pt-1">
                          {navItems.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-4 py-3 text-base transition-all",
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
                                <span className="font-medium">{item.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {item.description}
                                </span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* Section utilisateur */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground px-2">
                      {session?.user ? 'Mon espace' : 'Compte'}
                    </h3>

                    {session?.user ? (
                      <div className="space-y-3">
                        {/* Profil utilisateur */}
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/30 border">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-lg flex-shrink-0">
                            {session.user.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {session.user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {session.user.email}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              {(session.user as any).role === 'freelance' ? 'Freelance' : 'Client'}
                            </p>
                          </div>
                        </div>

                        {/* Actions rapides */}
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" asChild className="h-auto py-3">
                            <Link href="/dashboard" className="flex flex-col items-center gap-1">
                              <LayoutDashboard className="h-4 w-4" />
                              <span className="text-xs">Dashboard</span>
                            </Link>
                          </Button>
                          <Button variant="outline" asChild className="h-auto py-3">
                            <Link href="/profile" className="flex flex-col items-center gap-1">
                              <User className="h-4 w-4" />
                              <span className="text-xs">Profil</span>
                            </Link>
                          </Button>
                          <Button variant="outline" asChild className="h-auto py-3">
                            <Link href="/messages" className="flex flex-col items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              <span className="text-xs">Messages</span>
                            </Link>
                          </Button>
                          <Button variant="outline" asChild className="h-auto py-3">
                            <Link href="/dashboard/settings" className="flex flex-col items-center gap-1">
                              <Settings className="h-4 w-4" />
                              <span className="text-xs">Paramètres</span>
                            </Link>
                          </Button>
                        </div>

                        {/* Déconnexion */}
                        <Button 
                          variant="destructive" 
                          onClick={() => {
                            signOut({ callbackUrl: "/" })
                            setMobileMenuOpen(false)
                          }}
                          className="w-full gap-2"
                        >
                          <LogOut className="h-4 w-4" />
                          Se déconnecter
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                          <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                            <Rocket className="h-4 w-4 mr-2" />
                            Créer un compte
                          </Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full">
                          <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                            <Users className="h-4 w-4 mr-2" />
                            Se connecter
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Informations légales */}
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-2 text-xs text-center">
                      <Link href="/legal/terms" className="text-muted-foreground hover:text-foreground p-2">
                        CGU
                      </Link>
                      <Link href="/legal/privacy" className="text-muted-foreground hover:text-foreground p-2">
                        Confidentialité
                      </Link>
                      <Link href="/legal/cookies" className="text-muted-foreground hover:text-foreground p-2">
                        Cookies
                      </Link>
                      <Link href="/contact" className="text-muted-foreground hover:text-foreground p-2">
                        Contact
                      </Link>
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-4">
                      © 2026 NRBTalents. Tous droits réservés.
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