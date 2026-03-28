// components/auth/AuthDropdown.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { User, LogIn, LogOut, ChevronDown, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export const AuthDropdown = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (status === "loading") {
    return (
      <Button variant="ghost" size="icon" disabled className="h-8 w-8">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 gap-1 px-2 text-sm"
      >
        {session ? (
          <>
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs">
              {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <ChevronDown className="h-3 w-3" />
          </>
        ) : (
          <>
            <LogIn className="h-3.5 w-3.5" />
            <span>Connexion</span>
            <ChevronDown className="h-3 w-3" />
          </>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          {session ? (
            <>
              <button
                onClick={() => {
                  router.push(`/profile/${session.user?.id}`)
                  setIsOpen(false)
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <User className="h-3.5 w-3.5" />
                Mon profil
              </button>
              <button
                onClick={() => signOut()}
                className="w-full px-3 py-1.5 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <LogOut className="h-3.5 w-3.5" />
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => signIn("credentials", { callbackUrl: "/messages" })}
                className="w-full px-3 py-1.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <LogIn className="h-3.5 w-3.5" />
                Email / Mot de passe
              </button>
              <button
                onClick={() => signIn("google", { callbackUrl: "/messages" })}
                className="w-full px-3 py-1.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span className="text-base">G</span>
                Google
              </button>
              <button
                onClick={() => signIn("github", { callbackUrl: "/messages" })}
                className="w-full px-3 py-1.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span className="text-base">🐙</span>
                GitHub
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}