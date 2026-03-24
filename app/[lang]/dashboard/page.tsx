// app/[lang]/dashboard/page.tsx
'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const lang = params.lang as string

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push(`/${lang}/auth/signin`)
      return
    }

    const userRole = (session.user as any)?.role

    if (userRole === 'freelance') {
      router.push(`/${lang}/dashboard/freelance`)
    } else if (userRole === 'client') {
      router.push(`/${lang}/dashboard/client`)
    }
    else if (userRole === 'admin') {
      router.push(`/${lang}/dashboard/admin`)
    }
    else {
      // Fallback si rôle inconnu
      router.push(`/${lang}/`)
    }
  }, [session, status, router, lang])

  // Afficher un loader pendant la redirection
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Redirection...</p>
      </div>
    </div>
  )
}