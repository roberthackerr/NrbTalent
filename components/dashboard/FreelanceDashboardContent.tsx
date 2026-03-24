// components/dashboard/FreelanceDashboardContent.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Plus, TrendingUp, Clock, DollarSign, Briefcase, Target, 
  Wallet, ArrowRight, Sparkles, Package, Users, Star, Award,
  Eye, ShoppingBag, CheckCircle2, Zap, Crown, Gem, Rocket
} from "lucide-react"
import { AIMatchingWidget } from "@/components/ai/AIMatchingWidget"

interface Gig {
  _id: string
  title: string
  description: string
  price: number
  deliveryTime: number
  status: string
  ordersCount: number
  rating: number
  views: number
  createdAt: string
}

interface FreelanceStats {
  totalGigs: number
  activeGigs: number
  totalOrders: number
  totalEarnings: number
  averageRating: number
  pendingOrders: number
  completedProjects: number
  totalViews: number
  profileViews: number
  responseRate: number
  completionRate: number
  matchingRate: number
}

interface FreelanceDashboardContentProps {
  dict: any
  lang: string
}

export function FreelanceDashboardContent({ dict, lang }: FreelanceDashboardContentProps) {
  const router = useRouter()
  const [gigs, setGigs] = useState<Gig[]>([])
  const [stats, setStats] = useState<FreelanceStats>({
    totalGigs: 0,
    activeGigs: 0,
    totalOrders: 0,
    totalEarnings: 0,
    averageRating: 0,
    pendingOrders: 0,
    completedProjects: 0,
    totalViews: 0,
    profileViews: 0,
    responseRate: 85,
    completionRate: 92,
    matchingRate: 78
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFreelanceData()
  }, [])

  const fetchFreelanceData = async () => {
    try {
      const [gigsRes, statsRes] = await Promise.all([
        fetch('/api/gigs/my?limit=5'),
        fetch('/api/stats/freelance')
      ])

      if (gigsRes.ok) {
        const gigsData = await gigsRes.json()
        setGigs(gigsData.gigs || [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(prev => ({ ...prev, ...statsData }))
      }
    } catch (error) {
      console.error('Error fetching freelance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const t = dict?.dashboard?.freelance || {}

  const statsCards = [
    {
      title: t.activeGigs || 'Services Actifs',
      value: stats.activeGigs,
      icon: Package,
      color: "from-purple-500 to-fuchsia-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      textColor: "text-purple-600 dark:text-purple-400"
    },
    {
      title: t.totalOrders || 'Commandes',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      textColor: "text-emerald-600 dark:text-emerald-400"
    },
    {
      title: t.totalViews || 'Vues totales',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: t.totalEarnings || 'Gains Totaux',
      value: `${stats.totalEarnings.toLocaleString()}€`,
      icon: Wallet,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      textColor: "text-amber-600 dark:text-amber-400"
    }
  ]

  const performanceStats = [
    { label: t.profileViews || 'Vues du profil', value: stats.profileViews, icon: Users, max: 1000, color: "purple" },
    { label: t.responseRate || 'Taux de réponse', value: stats.responseRate, icon: Clock, max: 100, color: "emerald" },
    { label: t.completionRate || 'Taux de réussite', value: stats.completionRate, icon: CheckCircle2, max: 100, color: "blue" },
    { label: t.averageRating || 'Note moyenne', value: stats.averageRating, icon: Star, max: 5, color: "amber" }
  ]

  const getProgressColor = (color: string) => {
    const colors = {
      purple: "bg-purple-600",
      emerald: "bg-emerald-600",
      blue: "bg-blue-600",
      amber: "bg-amber-600"
    }
    return colors[color as keyof typeof colors] || "bg-purple-600"
  }

  const getProgressValue = (stat: typeof performanceStats[0]) => {
    if (stat.label === t.averageRating || 'Note moyenne') {
      return (stat.value / stat.max) * 100
    }
    return Math.min(stat.value, stat.max)
  }

  const getDisplayValue = (stat: typeof performanceStats[0]) => {
    if (stat.label === t.averageRating || 'Note moyenne') {
      return stat.value.toFixed(1)
    }
    return stat.value
  }

  const getUnit = (stat: typeof performanceStats[0]) => {
    if (stat.label === t.averageRating || 'Note moyenne') return "/5"
    if (stat.label === t.responseRate || 'Taux de réponse') return "%"
    if (stat.label === t.completionRate || 'Taux de réussite') return "%"
    return ""
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-700 via-fuchsia-700 to-pink-700 dark:from-purple-300 dark:via-fuchsia-300 dark:to-pink-300 bg-clip-text text-transparent">
              {t.title || 'Tableau de Bord Freelance'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              {t.subtitle || 'Gérez vos services et trouvez des projets'}
            </p>
          </div>
          <Link href={`/${lang}/gigs/create`}>
            <Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 shadow-lg shadow-purple-500/25 w-full sm:w-auto">
              <Rocket className="mr-2 h-4 w-4" />
              {t.newGig || 'Créer un Service'}
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10 hover:shadow-xl transition-shadow">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
                      <p className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`h-8 w-8 md:h-10 md:w-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-md`}>
                      <Icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Performance Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          {/* Performance Stats */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                {t.performance || 'Mes performances'}
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                {t.performanceDesc || 'Indicateurs clés de votre activité'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {performanceStats.map((stat, index) => {
                const Icon = stat.icon
                const progressValue = getProgressValue(stat)
                const displayValue = getDisplayValue(stat)
                const unit = getUnit(stat)
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{stat.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {displayValue}{unit}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(progressValue, 100)} 
                      className="h-2 bg-slate-200 dark:bg-slate-700"
                      indicatorClassName={getProgressColor(stat.color)}
                    />
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* AI Matching Widget */}
          <AIMatchingWidget 
            type="freelance"
            quickAction={true}
            maxResults={3}
            dict={dict}
            lang={lang}
          />
        </div>

        {/* Recent Gigs */}
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
          <CardHeader className="pb-3 border-b border-purple-100 dark:border-purple-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Package className="h-5 w-5 text-purple-500" />
                  {t.recentGigs || 'Mes Services Récents'}
                </CardTitle>
                <CardDescription className="text-xs md:text-sm mt-1">
                  {t.recentGigsDesc || 'Derniers services créés et leur performance'}
                </CardDescription>
              </div>
              <Link href={`/${lang}/dashboard/freelance/gigs`}>
                <Button variant="outline" size="sm" className="group border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30">
                  {t.viewAll || 'Voir tous'}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="flex justify-between items-center p-4 border border-purple-100 dark:border-purple-800 rounded-lg">
                      <div className="space-y-2">
                        <div className="h-4 bg-purple-200 dark:bg-purple-800 rounded w-32"></div>
                        <div className="h-3 bg-purple-100 dark:bg-purple-800/50 rounded w-48"></div>
                      </div>
                      <div className="h-8 bg-purple-200 dark:bg-purple-800 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : gigs.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-800/30 dark:to-fuchsia-800/30 rounded-2xl flex items-center justify-center mb-4">
                  <Package className="h-10 w-10 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {t.noGigs || 'Aucun service créé'}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {t.noGigsDesc || 'Commencez par créer votre premier service'}
                </p>
                <Link href={`/${lang}/gigs/create`}>
                  <Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600">
                    <Plus className="mr-2 h-4 w-4" />
                    {t.createFirst || 'Créer votre premier service'}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-purple-100 dark:divide-purple-800">
                {gigs.map((gig) => (
                  <div key={gig._id} className="p-4 sm:p-6 hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{gig.title}</h3>
                          <Badge className={gig.status === 'active' 
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" 
                            : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                          }>
                            {gig.status === 'active' ? 'Actif' : gig.status}
                          </Badge>
                          {gig.rating > 0 && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              {gig.rating.toFixed(1)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {gig.price}€
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {gig.deliveryTime} jours
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <ShoppingBag className="h-3 w-3" />
                            {gig.ordersCount} commandes
                          </span>
                          {gig.views > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {gig.views} vues
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Link href={`/${lang}/gigs/${gig._id}`}>
                        <Button size="sm" className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700">
                          {t.manage || 'Gérer'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}