// app/[lang]/talents/page.tsx
'use client'

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FreelancersPage } from "@/components/freelancers/FreelancersPage"
import { TopRatedPage } from "@/components/freelancers/TopRatedPage"
import { RisingTalentsPage } from "@/components/freelancers/RisingTalentsPage"
import { Star, TrendingUp, Users } from "lucide-react"

export default function TalentsPage() {
  const params = useParams()
  const lang = params.lang as Locale
  const [dict, setDict] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  const t = dict?.talents || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t.title || "Talents d'Exception"}
            </h1>
            <p className="text-xl text-purple-100 mb-8">
              {t.subtitle || "Découvrez les meilleurs freelancers pour vos projets"}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 gap-2">
              <Users className="h-4 w-4" />
              {t.allTalents || "Tous"}
            </TabsTrigger>
            <TabsTrigger value="top-rated" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 gap-2">
              <Star className="h-4 w-4" />
              {t.topRated || "Top Rated"}
            </TabsTrigger>
            <TabsTrigger value="rising" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 gap-2">
              <TrendingUp className="h-4 w-4" />
              {t.rising || "Émergents"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <FreelancersPage dict={dict} lang={lang} />
          </TabsContent>

          <TabsContent value="top-rated">
            <TopRatedPage dict={dict} lang={lang} />
          </TabsContent>

          <TabsContent value="rising">
            <RisingTalentsPage dict={dict} lang={lang} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}