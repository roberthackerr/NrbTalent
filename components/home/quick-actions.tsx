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
  // Translations
  const t = {
    title: dict?.quickActionss?.title || (user ? "Actions Rapides" : "Commencez dès maintenant"),
    subtitle: dict?.quickActionss?.subtitle || (user 
      ? "Tout ce dont vous avez besoin en un clic" 
      : "Rejoignez des milliers de professionnels"),
    start: dict?.quickActionss?.start || "Commencer",
    freelanceTitle: dict?.quickActionss?.freelanceTitle || "Publier un service",
    freelanceDesc: dict?.quickActionss?.freelanceDesc || "Créez votre gig et commencez à recevoir des demandes",
    recommendedTitle: dict?.quickActionss?.recommendedTitle || "Projets recommandés",
    recommendedDesc: dict?.quickActionss?.recommendedDesc || "Découvrez les projets qui matchent avec vos compétences",
    optimizeTitle: dict?.quickActionss?.optimizeTitle || "Optimiser mon profil",
    optimizeDesc: dict?.quickActionss?.optimizeDesc || "Améliorez votre visibilité avec notre IA",
    clientTitle: dict?.quickActionss?.clientTitle || "Publier un projet",
    clientDesc: dict?.quickActionss?.clientDesc || "Trouvez le talent parfait pour votre projet",
    searchTitle: dict?.quickActionss?.searchTitle || "Rechercher des talents",
    searchDesc: dict?.quickActionss?.searchDesc || "Parcourez notre base de freelances experts",
    analyticsTitle: dict?.quickActionss?.analyticsTitle || "Analytics",
    analyticsDesc: dict?.quickActionss?.analyticsDesc || "Suivez vos projets et performances",
    freelanceSignupTitle: dict?.quickActionss?.freelanceSignupTitle || "Commencer en tant que freelance",
    freelanceSignupDesc: dict?.quickActionss?.freelanceSignupDesc || "Créez votre profil et trouvez vos premiers projets",
    clientSignupTitle: dict?.quickActionss?.clientSignupTitle || "Recruter des talents",
    clientSignupDesc: dict?.quickActionss?.clientSignupDesc || "Trouvez les experts pour votre entreprise",
    exploreTitle: dict?.quickActionss?.exploreTitle || "Explorer la plateforme",
    exploreDesc: dict?.quickActionss?.exploreDesc || "Découvrez comment ça marche"
  }

  const freelanceActions = [
    {
      title: t.freelanceTitle,
      description: t.freelanceDesc,
      icon: Plus,
      action: `/${lang}/gigs/create`,
      color: "from-blue-500 to-purple-600"
    },
    {
      title: t.recommendedTitle,
      description: t.recommendedDesc,
      icon: TrendingUp,
      action: `/${lang}/projects?filter=recommended`,
      color: "from-green-500 to-emerald-600"
    },
    {
      title: t.optimizeTitle,
      description: t.optimizeDesc,
      icon: Sparkles,
      action: `/${lang}/dashboard/settings`,
      color: "from-orange-500 to-red-600"
    }
  ]

  const clientActions = [
    {
      title: t.clientTitle,
      description: t.clientDesc,
      icon: Plus,
      action: `/${lang}/projects/create`,
      color: "from-blue-500 to-purple-600"
    },
    {
      title: t.searchTitle,
      description: t.searchDesc,
      icon: Search,
      action: `/${lang}/talents`,
      color: "from-green-500 to-emerald-600"
    },
    {
      title: t.analyticsTitle,
      description: t.analyticsDesc,
      icon: TrendingUp,
      action: `/${lang}/dashboard/analytics`,
      color: "from-orange-500 to-red-600"
    }
  ]

  const guestActions = [
    {
      title: t.freelanceSignupTitle,
      description: t.freelanceSignupDesc,
      icon: Rocket,
      action: `/${lang}/auth/signup?role=freelance`,
      color: "from-blue-500 to-purple-600"
    },
    {
      title: t.clientSignupTitle,
      description: t.clientSignupDesc,
      icon: Users,
      action: `/${lang}/auth/signup?role=client`,
      color: "from-green-500 to-emerald-600"
    },
    {
      title: t.exploreTitle,
      description: t.exploreDesc,
      icon: Search,
      action: `/${lang}/discover`,
      color: "from-orange-500 to-red-600"
    }
  ]

  const actions = user 
    ? (user.role === "freelance" ? freelanceActions : clientActions)
    : guestActions

  return (
    <section className="bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2 sm:mb-3">
              {t.title}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 px-4">
              {t.subtitle}
            </p>
          </div>

          <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 px-2 sm:px-0">
            {actions.map((action, index) => {
              const Icon = action.icon
              return (
                <Card 
                  key={index} 
                  className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group cursor-pointer"
                >
                  <CardHeader className="pb-2 sm:pb-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 sm:pt-2">
                    <Button 
                      asChild 
                      className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 text-sm sm:text-base"
                    >
                      <Link href={action.action}>
                        {t.start}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}