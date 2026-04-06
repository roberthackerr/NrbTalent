'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { AIMatchingWidget } from "@/components/ai/AIMatchingWidget"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { ClientDashboardContent } from '@/components/dashboard/ClientDashboardContent'
import { Menu } from 'lucide-react'

export default function ClientDashboardPage() {
  const params = useParams()
  const lang = params.lang as Locale

  const [dict, setDict] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
    setLoading(false)
  }, [lang])

  if (loading || !dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4 mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">
            {dict?.common?.loading || 'Chargement...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">

      {/* Fixed sidebar — takes no space in the flow */}
      <DashboardSidebar
        role="client"
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/*
        Main content area.
        On md+ we offset left by the sidebar width so content isn't hidden behind it.
        On mobile there's no offset — the sidebar is an overlay drawer.

        If you use the collapsible feature, swap md:pl-72 / md:pl-16 dynamically,
        or drive it from shared state / CSS custom property.
      */}
      <div className="md:pl-72 transition-all duration-300 ease-in-out">

        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 md:hidden px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-slate-800 dark:text-white text-sm">Dashboard</span>
        </header>

        {/* Page content */}
        <main className="min-h-screen">
          <ClientDashboardContent dict={dict} lang={lang} />
        </main>
      </div>
    </div>
  )
}