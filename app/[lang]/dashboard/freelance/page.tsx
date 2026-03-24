// app/[lang]/dashboard/freelance/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { AIMatchingWidget } from "@/components/ai/AIMatchingWidget"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { FreelanceDashboardContent } from '@/components/dashboard/FreelanceDashboardContent'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function FreelanceDashboardPage() {
  const params = useParams()
  const lang = params.lang as Locale
  
  const [dict, setDict] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
    setLoading(false)
  }, [lang])

  if (loading || !dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">{dict?.common?.loading || 'Chargement...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950">
      {/* Sidebar avec gestion mobile */}
      <DashboardSidebar 
        role="freelance" 
        isMobileOpen={isSidebarOpen}
        onMobileClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile menu button */}
        <div className="md:hidden fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="bg-white/80 backdrop-blur-sm border-purple-200 shadow-lg hover:bg-purple-50"
          >
            <Menu className="h-5 w-5 text-purple-600" />
          </Button>
        </div>

        {/* Contenu du dashboard */}
        <FreelanceDashboardContent dict={dict} lang={lang} />
      </div>
    </div>
  )
}