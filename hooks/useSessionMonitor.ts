// hooks/useSessionMonitor.ts - VERSION AMÉLIORÉE
"use client"
import { useEffect, useRef, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function useSessionMonitor() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const hasShownToast = useRef(false)
  const checkIntervalRef = useRef<NodeJS.Timeout>()
  const isLoggingOut = useRef(false)

  const forceLogout = useCallback(async (reason: string) => {
    if (isLoggingOut.current) return
    isLoggingOut.current = true

    // Arrêter le monitoring
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current)
    }

    // Afficher le message une seule fois
    if (!hasShownToast.current) {
      hasShownToast.current = true
      
      console.log("❌ DÉCONNEXION FORCÉE:", reason)
      
      toast.error("Votre session a été terminée", {
        description: "Vous avez été déconnecté d'un autre appareil",
        duration: 4000,
        important: true,
        closeButton: true
      })
    }

    // Attendre 1 seconde pour que l'utilisateur voie le message
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Déconnexion NextAuth
    await signOut({ 
      redirect: false,
      callbackUrl: "/auth/signin?reason=session_terminated"
    })

    // Redirection forcée
    router.push("/auth/signin?reason=session_terminated")
    
    // Recharger la page pour nettoyer tous les états
    setTimeout(() => {
      window.location.href = "/auth/signin?reason=session_terminated"
    }, 500)
  }, [router])

  const checkSession = useCallback(async () => {
    if (isLoggingOut.current) return

    try {
      const response = await fetch('/api/users/sessions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store'
      })

      const data = await response.json()

      // Session invalide ou inactive
      if (response.status === 401 || !data.active) {
        const reason = data.reason || 'session_terminated'
        console.log("❌ Session inactive détectée:", reason)
        await forceLogout(reason)
        return
      }

      // Session active
      if (response.ok && data.active) {
        console.log("✅ Session active:", data.sessionId?.substring(0, 12))
      }
    } catch (error) {
      console.error("⚠️ Erreur vérification session:", error)
      // Ne pas déconnecter en cas d'erreur réseau temporaire
    }
  }, [forceLogout])

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      return
    }

    console.log("🔵 Session Monitor: Démarrage pour", session.user.email)
    hasShownToast.current = false
    isLoggingOut.current = false

    // Vérification immédiate au montage
    checkSession()

    // Vérifier toutes les 5 secondes (plus rapide pour détecter les déconnexions)
    checkIntervalRef.current = setInterval(checkSession, 5000)

    // Vérifier aussi lors du focus de la fenêtre
    const handleFocus = () => {
      console.log("👁️ Fenêtre en focus, vérification session...")
      checkSession()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      window.removeEventListener('focus', handleFocus)
    }
  }, [session, status, checkSession])

  return null
}

// ============================================================================
// components/SessionMonitor.tsx
// ============================================================================

"use client"
import { useSessionMonitor } from "@/hooks/useSessionMonitor"

export function SessionMonitor() {
  useSessionMonitor()
  return null
}

// ============================================================================
// components/SessionInitializer.tsx - AMÉLIORÉ
// ============================================================================

"use client"
import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"

export function SessionInitializer() {
  const { data: session, status } = useSession()
  const initialized = useRef(false)

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id && !initialized.current) {
      initialized.current = true
      
      console.log("🚀 Initialisation de la session pour", session.user.email)
      
      // Créer/mettre à jour la session
      fetch('/api/users/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log(`✅ Session ${data.action}:`, data.sessionId)
          } else {
            console.error("❌ Erreur initialisation session:", data)
          }
        })
        .catch(err => {
          console.error("❌ Erreur réseau initialisation session:", err)
        })
    }
  }, [session, status])

  return null
}

// ============================================================================
// UTILISATION DANS LE LAYOUT
// ============================================================================

/*
// app/layout.tsx

import { SessionProvider } from "next-auth/react"
import { SessionMonitor } from "@/components/SessionMonitor"
import { SessionInitializer } from "@/components/SessionInitializer"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider
          refetchInterval={0} // Désactiver le refetch auto de NextAuth
          refetchOnWindowFocus={true} // Garder le refetch au focus
        >
          {/* Ces deux composants sont ESSENTIELS *\/}
          <SessionInitializer />
          <SessionMonitor />
          
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
*/