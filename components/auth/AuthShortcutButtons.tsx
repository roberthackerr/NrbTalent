// components/auth/AuthShortcutButtons.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { 
  LogIn, 
  UserPlus, 
  LogOut, 
  User,
  ChevronDown,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export const AuthShortcutButtons = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fermer le menu au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  // Connexion rapide (demo)
  const handleQuickLogin = async () => {
    setIsLoading(true)
    await signIn("credentials", {
      email: "demo@example.com",
      password: "demo123",
      callbackUrl: "/messages",
    })
    setIsLoading(false)
  }

  // Déconnexion
  const handleLogout = async () => {
    setShowUserMenu(false)
    await signOut({ callbackUrl: "/" })
  }

  // Navigation profil
  const goToProfile = () => {
    setShowUserMenu(false)
    router.push(`/profile/${session?.user?.id}`)
  }

  if (status === "loading") {
    return (
      <Button variant="ghost" size="icon" disabled className="h-8 w-8 sm:h-9 sm:w-9">
        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
      </Button>
    )
  }

  // Utilisateur connecté
  if (session) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-1.5 sm:gap-2 h-8 sm:h-9 px-1.5 sm:px-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">
            {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500" />
        </button>

        {/* Menu utilisateur */}
        {showUserMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                {session.user?.name}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                {session.user?.email}
              </p>
            </div>
            
            <button
              onClick={goToProfile}
              className="w-full px-3 py-1.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <User className="h-3.5 w-3.5" />
              Mon profil
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full px-3 py-1.5 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              Déconnexion
            </button>
          </div>
        )}
      </div>
    )
  }

  // Utilisateur non connecté - Boutons raccourcis
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signIn("credentials", { 
          email: "demo@example.com", 
          password: "demo123",
          callbackUrl: "/messages"
        })}
        disabled={isLoading}
        className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
        ) : (
          <>
            <LogIn className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
            Demo
          </>
        )}
      </Button>
      
      <Button
        size="sm"
        onClick={() => signIn(undefined, { callbackUrl: "/messages" })}
        className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
      >
        <UserPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
        <span className="hidden xs:inline">Connexion</span>
        <span className="xs:hidden">Login</span>
      </Button>
    </div>
  )
}