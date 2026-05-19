// app/[lang]/dashboard/freelance/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { AIMatchingWidget } from "@/components/ai/AIMatchingWidget"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { FreelanceDashboardContent } from '@/components/dashboard/FreelanceDashboardContent'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

  // Fermer la sidebar lors du redimensionnement sur desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isSidebarOpen) {
        setIsSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isSidebarOpen])

  // Empêcher le scroll du body quand la sidebar est ouverte sur mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isSidebarOpen])

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
    <div className="relative flex min-h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950">
      {/* Overlay pour mobile quand sidebar est ouverte */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar avec gestion mobile */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-50 h-full transition-transform duration-300 ease-in-out transform",
          "md:transform-none md:relative md:block",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0"
        )}
      >
        <DashboardSidebar 
          role="freelance" 
          isMobileOpen={isSidebarOpen}
          onMobileClose={() => setIsSidebarOpen(false)}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {/* Mobile menu button - repositionné pour ne pas dépasser */}
        <div className="md:hidden sticky top-4 left-4 z-30">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-purple-200 dark:border-purple-800 shadow-lg hover:bg-purple-50 dark:hover:bg-purple-950/30"
          >
            <Menu className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </Button>
        </div>

        {/* Contenu du dashboard */}
        <div className="w-full">
          <FreelanceDashboardContent dict={dict} lang={lang} />
        </div>
      </main>
    </div>
  )
}