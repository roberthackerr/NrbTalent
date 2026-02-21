
// Et voici le code complet mis à jour pour votre navigation :
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Sparkles, Rocket, Users, Zap, Settings, MessageCircle, User, LayoutDashboard, LogOut, Building } from "lucide-react"
import { useState, useEffect } from "react"
import { UserMenu } from "@/components/user-menu"
import { SearchCommand } from "@/components/search-command"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { signOut, useSession } from "next-auth/react"

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
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
      href: "/talents",
      label: "Trouver des Talents",
      icon: <Users className="h-4 w-4" />,
      description: "Experts vérifiés"
    },
    {
      href: "/gigs",
      label: "Services",
      icon: <Zap className="h-4 w-4" />,
      description: "Prestations clé en main"
    },
    {
      href: "/projects",
      label: "Projets",
      icon: <Rocket className="h-4 w-4" />,
      description: "Opportunités freelance"
    },
    {
      href: "/ai-matching",
      label: "AI Matching",
      icon: <Sparkles className="h-4 w-4" />,
      description: "Match parfait IA"
    },
    {
      href: "/enterprise",
      label: "Entreprise",
      icon: <Building className="h-4 w-4" />,
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
        ? "border-border/60 shadow-sm" 
        : "border-border/40"
    )}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo avec animation */}
          <Link 
            href="/" 
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <Image 
                src="/logo.png" 
                alt="NRBTalents" 
                width={16} 
                height={16} 
                className="h-8 w-8 transition-transform group-hover:scale-110" 
              />
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-0 group-hover:opacity-20 blur transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                NRBTalents
              </span>
              <span className="text-xs text-muted-foreground -mt-1 hidden sm:block">
                La révolution freelance
              </span>
            </div>
          </Link>

          {/* Desktop Navigation avec indicateur actif */}
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
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

                {/* Tooltip au hover */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.description}
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-foreground rotate-45" />
                </div>
              </Link>
            ))}
          </div>

          {/* Actions Desktop */}
          <div className="hidden items-center gap-3 md:flex">
            <SearchCommand />
            <ThemeToggle />
            
            {/* Séparateur */}
            <div className="h-6 w-px bg-border" />
            
            <UserMenu />
          </div>

          {/* Mobile Menu Button avec animation */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 transition-transform rotate-90" />
            ) : (
              <Menu className="h-5 w-5 transition-transform" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu amélioré */}
      {mobileMenuOpen && (
        <div className="border-t border-border/40 bg-background/95 backdrop-blur-xl md:hidden animate-in slide-in-from-top duration-300">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {/* Navigation principale mobile */}
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all",
                  isActive(item.href)
                    ? "bg-accent text-foreground border-l-4 border-blue-500"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {item.icon}
                <div className="flex flex-col">
                  <span>{item.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </div>
              </Link>
            ))}
            
            {/* Actions mobiles */}
            <div className="flex flex-col gap-4 pt-4 border-t border-border/40">
              {/* Barre de recherche et thème */}
              <div className="flex items-center gap-3 px-1">
                <div className="flex-1">
                  <SearchCommand variant="mobile" />
                </div>
                <ThemeToggle />
              </div>

              {/* Section utilisateur connecté */}
              {session?.user ? (
                <div className="space-y-3">
                  {/* Info utilisateur mobile */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 border">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                        {session.user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {session.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {session.user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions rapides utilisateur */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" asChild className="h-11">
                      <Link href="/dashboard" className="flex flex-col items-center gap-1">
                        <LayoutDashboard className="h-4 w-4" />
                        <span className="text-xs">Tableau de bord</span>
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="h-11">
                      <Link href="/profile" className="flex flex-col items-center gap-1">
                        <User className="h-4 w-4" />
                        <span className="text-xs">Mon profil</span>
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="h-11">
                      <Link href="/messages" className="flex flex-col items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-xs">Messages</span>
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="h-11">
                      <Link href="dashboard/settings" className="flex flex-col items-center gap-1">
                        <Settings className="h-4 w-4" />
                        <span className="text-xs">Paramètres</span>
                      </Link>
                    </Button>
                  </div>

                  {/* Déconnexion */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Se déconnecter
                  </Button>
                </div>
              ) : (
                /* Section non connecté */
                <div className="flex flex-col gap-2">
                  <Button variant="outline" asChild className="w-full bg-transparent">
                    <Link href="/auth/signin" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Se connecter
                    </Link>
                  </Button>
                  <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Link href="/auth/signup" className="flex items-center gap-2">
                      <Rocket className="h-4 w-4" />
                      Commencer gratuitement
                    </Link>
                  </Button>
                </div>
              )}

              {/* Footer mobile */}
              <div className="pt-3 border-t border-border/40">
                <p className="text-xs text-muted-foreground text-center">
                  NRB Talents  • Votre succès commence ici
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}