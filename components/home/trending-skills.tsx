"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Zap, Users, DollarSign } from "lucide-react"

const trendingSkills = [
  {
    name: "React",
    demand: 95,
    avgRate: 85,
    projects: 1245,
    trend: "up",
    category: "Développement"
  },
  {
    name: "Next.js",
    demand: 88,
    avgRate: 90,
    projects: 876,
    trend: "up",
    category: "Développement"
  },
  {
    name: "IA & Machine Learning",
    demand: 92,
    avgRate: 120,
    projects: 654,
    trend: "up",
    category: "Data Science"
  },
  {
    name: "UI/UX Design",
    demand: 85,
    avgRate: 75,
    projects: 987,
    trend: "up",
    category: "Design"
  },
  {
    name: "DevOps",
    demand: 82,
    avgRate: 95,
    projects: 543,
    trend: "up",
    category: "Infrastructure"
  },
  {
    name: "Content Strategy",
    demand: 78,
    avgRate: 65,
    projects: 432,
    trend: "up",
    category: "Marketing"
  }
]

export function TrendingSkills() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-orange-500" />
            Compétences Tendances
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Les technologies les plus demandées cette semaine
          </p>
        </div>
        <Button variant="outline">
          Voir le classement complet
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {trendingSkills.map((skill, index) => (
          <Card key={skill.name} className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-lg">{skill.name}</CardTitle>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  #{index + 1}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-2">
                <span className="text-sm">{skill.category}</span>
                <span>•</span>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-sm">+12%</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>Demande</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${skill.demand}%` }}
                    />
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {skill.demand}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span>Taux horaire</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  ${skill.avgRate}/h
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>Projets</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {skill.projects.toLocaleString()}
                </span>
              </div>

              <Button className="w-full mt-4" variant="outline" size="sm">
                Explorer les opportunités
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}