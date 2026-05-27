// components/home/quick-actions.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Rocket, Plus, Search, TrendingUp, Users, Sparkles } from "lucide-react"
import Link from "next/link"
import type { Locale } from "@/lib/i18n/config"

interface QuickActionsProps {
  user: any
  dict?: any
  lang?: Locale
}

export function QuickActions({ user, dict, lang = "fr" }: QuickActionsProps) {
  const isFreelance = user?.role === "freelance"
  const isClient = user?.role === "client"
  const isLoggedIn = !!user

  const t = {
    title: dict?.quickActions?.title || (isLoggedIn ? "Actions Rapides" : "Commencez"),
    start: dict?.quickActions?.start || "Commencer"
  }

  const actions = isLoggedIn ? (
    isFreelance ? [
      { title: "Publier", desc: "Créez votre gig", icon: Plus, link: `/${lang}/gigs/create`, color: "from-blue-500 to-purple-600" },
      { title: "Projets", desc: "Trouvez des missions", icon: TrendingUp, link: `/${lang}/projects?filter=recommended`, color: "from-green-500 to-emerald-600" },
      { title: "Optimiser", desc: "Améliorez votre profil", icon: Sparkles, link: `/${lang}/dashboard/settings`, color: "from-orange-500 to-red-600" }
    ] : [
      { title: "Projet", desc: "Publiez une offre", icon: Plus, link: `/${lang}/projects/create`, color: "from-blue-500 to-purple-600" },
      { title: "Recherche", desc: "Trouvez des talents", icon: Search, link: `/${lang}/freelancers`, color: "from-green-500 to-emerald-600" },
      { title: "Stats", desc: "Suivez vos projets", icon: TrendingUp, link: `/${lang}/dashboard/analytics`, color: "from-orange-500 to-red-600" }
    ]
  ) : [
    { title: "Freelance", desc: "Trouvez des projets", icon: Rocket, link: `/${lang}/auth/signup?role=freelance`, color: "from-blue-500 to-purple-600" },
    { title: "Recruter", desc: "Trouvez des experts", icon: Users, link: `/${lang}/auth/signup?role=client`, color: "from-green-500 to-emerald-600" },
    { title: "Explorer", desc: "Découvrir", icon: Search, link: `/${lang}/discover`, color: "from-orange-500 to-red-600" }
  ]

  return (
    <section className="bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t.title}</h2>
        </div>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <Card key={index} className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-semibold group-hover:text-blue-600 transition-colors">
                        {action.title}
                      </CardTitle>
                      <CardDescription className="text-xs truncate">
                        {action.desc}
                      </CardDescription>
                    </div>
                    <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs flex-shrink-0">
                      <Link href={action.link}>{t.start}</Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}