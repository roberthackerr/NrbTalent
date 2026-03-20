// components/dashboard/FreelanceDashboardContent.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, TrendingUp, Clock, DollarSign, Briefcase, Target, 
  Wallet, ArrowRight, Sparkles, Package, Users, Star, Award
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
    matchingRate: 85
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFreelanceData()
  }, [])

  const fetchFreelanceData = async () => {
    try {
      const [gigsRes, statsRes] = await Promise.all([
        fetch('/api/gigs?limit=5'),
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

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              {t.title || 'Tableau de Bord Freelance'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              {t.subtitle || 'Gérez vos services et trouvez des projets'}
            </p>
          </div>
          <Link href={`/${lang}/gigs/create`}>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              {t.newGig || 'Créer un Service'}
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t.activeGigs || 'Services Actifs'}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.activeGigs}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t.totalOrders || 'Commandes'}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalOrders}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t.totalEarnings || 'Gains Totaux'}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {stats.totalEarnings?.toLocaleString()}€
                  </p>
                </div>
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <Wallet className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t.averageRating || 'Note Moyenne'}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                    {stats.averageRating.toFixed(1)} ★
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                  <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Matching Widget */}
        <AIMatchingWidget 
          type="freelance"
          quickAction={true}
          maxResults={3}
          dict={dict}
          lang={lang}
        />

        {/* Recent Gigs */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-lg mt-6">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Package className="h-5 w-5 text-blue-500" />
                  {t.recentGigs || 'Mes Services Récents'}
                </CardTitle>
                <CardDescription className="mt-1">
                  {t.recentGigsDesc || 'Derniers services créés et leur performance'}
                </CardDescription>
              </div>
              <Link href={`/${lang}/dashboard/freelance/gigs`}>
                <Button variant="outline" size="sm" className="group">
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
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-32"></div>
                        <div className="h-3 bg-slate-200 rounded w-48"></div>
                      </div>
                      <div className="h-8 bg-slate-200 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : gigs.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Package className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {t.noGigs || 'Aucun service créé'}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {t.noGigsDesc || 'Commencez par créer votre premier service'}
                </p>
                <Link href={`/${lang}/gigs/create`}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t.createFirst || 'Créer votre premier service'}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {gigs.map((gig) => (
                  <div key={gig._id} className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{gig.title}</h3>
                          <Badge variant={gig.status === 'active' ? 'default' : 'secondary'}>
                            {gig.status === 'active' ? 'Actif' : gig.status}
                          </Badge>
                          {gig.rating > 0 && (
                            <Badge variant="outline" className="bg-yellow-50">
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
                            <Users className="h-3 w-3" />
                            {gig.ordersCount} commandes
                          </span>
                        </div>
                      </div>
                      <Link href={`/${lang}/gigs/${gig._id}`}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
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