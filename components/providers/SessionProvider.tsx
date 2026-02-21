// components/providers/SessionProvider.tsx
"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"

/**
 * Composant qui crée/met à jour automatiquement la session
 * À CHAQUE chargement de page si l'utilisateur est authentifié
 */
function SessionInitializer() {
  const { data: session, status } = useSession()
  const isInitializing = useRef(false)
  const lastInitTime = useRef<number>(0)

  useEffect(() => {
    // Si pas authentifié, ne rien faire
    if (status !== "authenticated" || !session?.user?.id) {
      return
    }

    // Éviter les appels multiples (debounce de 2 secondes)
    const now = Date.now()
    if (isInitializing.current || (now - lastInitTime.current) < 2000) {
      return
    }

    isInitializing.current = true
    lastInitTime.current = now

    console.log("🔄 Initialisation/MAJ session pour:", session.user.email)

    fetch('/api/users/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log(`✅ Session ${data.action}:`, data.sessionId)
        } else {
          console.error("❌ Erreur init session:", data)
        }
      })
      .catch(err => {
        console.error("❌ Erreur réseau init session:", err)
      })
      .finally(() => {
        isInitializing.current = false
      })
  }, [session, status])

  return null
}

/**
 * Composant qui surveille la session et déconnecte si terminée à distance
 */
function SessionMonitor() {
  const { data: session, status } = useSession()
  const checkIntervalRef = useRef<NodeJS.Timeout>(null)
  const isLoggingOut = useRef(false)
  const hasShownToast = useRef(false)

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      return
    }

    console.log("🔵 Session Monitor actif pour:", session.user.email)

    const checkSession = async () => {
      if (isLoggingOut.current) return

      try {
        const response = await fetch('/api/users/sessions/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-store'
        })

        const data = await response.json()

        // Session inactive ou erreur 401
        if (response.status === 401 || !data.active) {
          if (isLoggingOut.current) return
          
          isLoggingOut.current = true
          
          if (!hasShownToast.current) {
            hasShownToast.current = true
            console.log("❌ Session terminée à distance")
            
            // Import dynamique de toast pour éviter les erreurs SSR
            import('sonner').then(({ toast }) => {
              toast.error("Votre session a été terminée", {
                description: "Vous avez été déconnecté depuis un autre appareil",
                duration: 3000
              })
            })
          }

          // Attendre un peu puis déconnecter
          setTimeout(async () => {
            const { signOut } = await import('next-auth/react')
            await signOut({
              callbackUrl: "/auth/signin?reason=session_terminated",
              redirect: true
            })
          }, 1500)

          return
        }

        // Session active
        if (response.ok && data.active) {
          console.log("✅ Session active:", data.sessionId?.substring(0, 12))
        }
      } catch (error) {
        console.error("⚠️ Erreur check session:", error)
      }
    }

    // Vérification immédiate
    checkSession()

    // Vérifier toutes les 5 secondes
    checkIntervalRef.current = setInterval(checkSession, 5000)

    // Vérifier au focus de la fenêtre
    const handleFocus = () => {
      console.log("👁️ Focus fenêtre, check session")
      checkSession()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      window.removeEventListener('focus', handleFocus)
    }
  }, [session, status])

  return null
}

/**
 * Provider principal qui combine NextAuth + nos hooks
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider
      // Désactiver le refetch automatique de NextAuth
      refetchInterval={0}
      // Activer le refetch au focus (optionnel)
      refetchOnWindowFocus={true}
    >
      {/* Initialiser/MAJ la session à chaque chargement
      
         <SessionInitializer />
          <SessionMonitor />
      */}
  
      
      {/* Surveiller la session toutes les 5s */}
     
      
      {children}
    </NextAuthSessionProvider>
  )
}

// ============================================================================
// app/layout.tsx - UTILISATION
// ============================================================================

/*
import { SessionProvider } from "@/components/providers/SessionProvider"
import { Toaster } from "sonner"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
*/