// components/home/stats-overview.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, Briefcase, DollarSign, Zap, Award, TrendingDown } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"

interface StatsOverviewProps {
  dict?: any
  lang?: Locale
}

export function StatsOverview({ dict, lang = "fr" }: StatsOverviewProps) {
  // Translations
  const t = {
    projectsPublished: dict?.statss?.projectsPublished || "Projets publiés",
    activeFreelancers: dict?.statss?.activeFreelancers || "Freelances actifs",
    revenueGenerated: dict?.statss?.revenueGenerated || "Revenus générés",
    successRate: dict?.statss?.successRate || "Taux de réussite"
  }

  const stats = [
    {
      label: t.projectsPublished,
      value: "50+",
      change: "+15%",
      trend: "up",
      icon: Briefcase,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
    },
    {
      label: t.activeFreelancers,
      value: "100+",
      change: "+22%",
      trend: "up",
      icon: Users,
      color: "text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400"
    },
    {
      label: t.revenueGenerated,
      value: "___",
      change: "+18%",
      trend: "up",
      icon: DollarSign,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400"
    },
    {
      label: t.successRate,
      value: "98.2%",
      change: "+2.3%",
      trend: "up",
      icon: Award,
      color: "text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400"
    }
  ]

  return (
    <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              const isTrendUp = stat.trend === 'up'
              const TrendIcon = isTrendUp ? TrendingUp : TrendingDown
              
              return (
                <Card 
                  key={index} 
                  className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] group"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 truncate">
                          {stat.label}
                        </p>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {stat.value}
                          </p>
                          <div className="flex items-center gap-0.5">
                            <TrendIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${
                              isTrendUp 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`} />
                            <span className={`text-xs sm:text-sm font-medium ${
                              isTrendUp 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {stat.change}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={`p-2 sm:p-3 rounded-full ${stat.color} group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-3`}>
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                      </div>
                    </div>
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