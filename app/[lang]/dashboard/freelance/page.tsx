// app/[lang]/dashboard/freelance/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { AIMatchingWidget } from "@/components/ai/AIMatchingWidget"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { FreelanceDashboardContent } from '@/components/dashboard/FreelanceDashboardContent'

export default function FreelanceDashboardPage() {
  const params = useParams()
  const lang = params.lang as Locale
  
  const [dict, setDict] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
    setLoading(false)
  }, [lang])

  if (loading || !dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">{dict?.common?.loading || 'Chargement...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">
      <DashboardSidebar role="freelance" />
      <FreelanceDashboardContent dict={dict} lang={lang} />
    </div>
  )
}