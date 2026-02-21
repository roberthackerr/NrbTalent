"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Rocket, Plus, Search, TrendingUp, Users, Sparkles } from "lucide-react"

interface QuickActionsProps {
  user: any
}

const freelanceActions = [
  {
    title: "Publier un service",
    description: "Créez votre gig et commencez à recevoir des demandes",
    icon: Plus,
    action: "/dashboard/gigs/create",
    color: "bg-gradient-to-r from-blue-500 to-purple-600"
  },
  {
    title: "Projets recommandés",
    description: "Découvrez les projets qui matchent avec vos compétences",
    icon: TrendingUp,
    action: "/projects?filter=recommended",
    color: "bg-gradient-to-r from-green-500 to-emerald-600"
  },
  {
    title: "Optimiser mon profil",
    description: "Améliorez votre visibilité avec notre IA",
    icon: Sparkles,
    action: "/dashboard/profile",
    color: "bg-gradient-to-r from-orange-500 to-red-600"
  }
]

const clientActions = [
  {
    title: "Publier un projet",
    description: "Trouvez le talent parfait pour votre projet",
    icon: Plus,
    action: "/projects/create",
    color: "bg-gradient-to-r from-blue-500 to-purple-600"
  },
  {
    title: "Rechercher des talents",
    description: "Parcourez notre base de freelances experts",
    icon: Search,
    action: "/talents",
    color: "bg-gradient-to-r from-green-500 to-emerald-600"
  },
  {
    title: "Analytics",
    description: "Suivez vos projets et performances",
    icon: TrendingUp,
    action: "/dashboard/analytics",
    color: "bg-gradient-to-r from-orange-500 to-red-600"
  }
]

const guestActions = [
  {
    title: "Commencer en tant que freelance",
    description: "Créez votre profil et trouvez vos premiers projets",
    icon: Rocket,
    action: "/auth/signup?role=freelance",
    color: "bg-gradient-to-r from-blue-500 to-purple-600"
  },
  {
    title: "Recruter des talents",
    description: "Trouvez les experts pour votre entreprise",
    icon: Users,
    action: "/auth/signup?role=client",
    color: "bg-gradient-to-r from-green-500 to-emerald-600"
  },
  {
    title: "Explorer la plateforme",
    description: "Découvrez comment ça marche",
    icon: Search,
    action: "/discover",
    color: "bg-gradient-to-r from-orange-500 to-red-600"
  }
]

export function QuickActions({ user }: QuickActionsProps) {
  const actions = user 
    ? (user.role === "freelance" ? freelanceActions : clientActions)
    : guestActions

  return (
    <section className="bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {user ? "Actions Rapides" : "Commencez dès maintenant"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              {user 
                ? "Tout ce dont vous avez besoin en un clic" 
                : "Rejoignez des milliers de professionnels"
              }
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {actions.map((action, index) => {
              const Icon = action.icon
              return (
                <Card key={index} className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 group">
                  <CardHeader className="pb-3">
                    <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
                      Commencer
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