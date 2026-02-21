"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, Briefcase, DollarSign, Zap, Award } from "lucide-react"

const stats = [
  {
    label: "Projets publiés",
    value: "12,458",
    change: "+15%",
    trend: "up",
    icon: Briefcase,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
  },
  {
    label: "Freelances actifs",
    value: "8,742",
    change: "+22%",
    trend: "up",
    icon: Users,
    color: "text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400"
  },
  {
    label: "Revenus générés",
    value: "$4.2M",
    change: "+18%",
    trend: "up",
    icon: DollarSign,
    color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400"
  },
  {
    label: "Taux de réussite",
    value: "98.2%",
    change: "+2.3%",
    trend: "up",
    icon: Award,
    color: "text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400"
  }
]

export function StatsOverview() {
  return (
    <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                        {stat.label}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {stat.value}
                        </p>
                        <span className={`text-sm font-medium ${
                          stat.trend === 'up' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-full ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}