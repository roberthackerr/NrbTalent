// app/[lang]/freelancers/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  MapPin, 
  Star, 
  Briefcase, 
  DollarSign, 
  Zap,
  Filter,
  SlidersHorizontal,
  Grid3X3,
  List,
  CheckCircle2,
  Award,
  Clock,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Eye,
  Loader2
} from "lucide-react"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { cn } from "@/lib/utils"

interface Freelancer {
  _id: string
  name: string
  title?: string
  avatar?: string
  location?: string
  hourlyRate?: number
  rating?: number
  completedProjects?: number
  skills: string[]
  languages?: string[]
  availability: "available" | "busy" | "unavailable"
  isVerified: boolean
  responseTime?: number
  successRate?: number
  totalEarnings?: number
}

export default function FreelancersPage() {
  const params = useParams()
  const router = useRouter()
  const lang = params.lang as Locale
  
  const [dict, setDict] = useState<any>(null)
  const [freelancers, setFreelancers] = useState<Freelancer[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filters, setFilters] = useState({
    availability: "all",
    minRate: "",
    maxRate: "",
    skills: [] as string[],
    minRating: 0
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [total, setTotal] = useState(0)
  
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
      setFreelancers([])
      setHasMore(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Recharger quand les filtres ou la recherche changent
  useEffect(() => {
    if (dict) {
      setPage(1)
      setFreelancers([])
      setHasMore(true)
      fetchFreelancers(1, true)
    }
  }, [dict, filters, debouncedSearch])

  // Charger les freelancers
  const fetchFreelancers = async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (filters.availability !== 'all') params.append('availability', filters.availability)
      if (filters.minRate) params.append('minRate', filters.minRate)
      if (filters.maxRate) params.append('maxRate', filters.maxRate)
      if (filters.minRating > 0) params.append('minRating', filters.minRating.toString())
      if (filters.skills.length > 0) params.append('skills', filters.skills.join(','))
      params.append('page', pageNum.toString())
      params.append('limit', '12')

      const response = await fetch(`/api/users/freelancers?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        if (reset) {
          setFreelancers(data.freelancers || [])
        } else {
          setFreelancers(prev => [...prev, ...(data.freelancers || [])])
        }
        setTotal(data.pagination?.total || 0)
        setHasMore(data.freelancers?.length === 12 && freelancers.length + data.freelancers.length < data.pagination?.total)
      }
    } catch (error) {
      console.error('Error fetching freelancers:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Charger plus de freelancers
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchFreelancers(nextPage, false)
    }
  }, [loadingMore, hasMore, loading, page])

  // Observer pour l'intersection (scroll infini)
  useEffect(() => {
    if (loading) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loadingMore, loadMore, loading])

  const getAvailabilityBadge = (availability: string) => {
    const config = {
      available: { label: dict?.freelancers?.available || "Disponible", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
      busy: { label: dict?.freelancers?.busy || "Occupé", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
      unavailable: { label: dict?.freelancers?.unavailable || "Indisponible", color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300" }
    }
    return config[availability as keyof typeof config] || config.available
  }

  const t = dict?.freelancers || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {t.title || "Trouvez les Meilleurs Freelancers"}
            </h1>
            <p className="text-base md:text-lg text-blue-100 mb-6">
              {t.subtitle || "Connectez-vous avec des talents vérifiés pour vos projets"}
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder={t.searchPlaceholder || "Rechercher par compétence, nom..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-slate-900 bg-white border-0 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              {t.filters || "Filtres"}
            </Button>
            <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={cn("h-8 w-8 p-0", viewMode === 'grid' && "bg-blue-600 text-white")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={cn("h-8 w-8 p-0", viewMode === 'list' && "bg-blue-600 text-white")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {!loading && `${freelancers.length} / ${total} ${t.freelancersFound || 'freelancers trouvés'}`}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className={cn(
            "lg:w-72 flex-shrink-0 space-y-6 transition-all duration-300",
            showFilters ? "block" : "hidden lg:block"
          )}>
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg sticky top-28">
              <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
                <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-white">
                  <SlidersHorizontal className="h-4 w-4" />
                  {t.filterTitle || "Filtres"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                {/* Availability */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t.availability || "Disponibilité"}
                  </h3>
                  <div className="space-y-1.5">
                    {[
                      { value: "all", label: t.all || "Tous" },
                      { value: "available", label: t.available || "Disponible" },
                      { value: "busy", label: t.busy || "Occupé" },
                      { value: "unavailable", label: t.unavailable || "Indisponible" }
                    ].map(option => (
                      <label key={option.value} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                        <input
                          type="radio"
                          name="availability"
                          value={option.value}
                          checked={filters.availability === option.value}
                          onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.value }))}
                          className="text-blue-600"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rate Range */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t.rateRange || "Taux horaire"}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder={t.min || "Min"}
                      value={filters.minRate}
                      onChange={(e) => setFilters(prev => ({ ...prev, minRate: e.target.value }))}
                      className="border-slate-200 dark:border-slate-700 h-9 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder={t.max || "Max"}
                      value={filters.maxRate}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxRate: e.target.value }))}
                      className="border-slate-200 dark:border-slate-700 h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t.minRating || "Note minimum"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all",
                          filters.minRating === rating 
                            ? "bg-blue-600 text-white" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                        )}
                      >
                        <Star className="h-3 w-3 fill-current" />
                        {rating}+
                      </button>
                    ))}
                    {filters.minRating > 0 && (
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, minRating: 0 }))}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setFilters({ availability: "all", minRate: "", maxRate: "", skills: [], minRating: 0 })}
                  className="w-full text-sm"
                >
                  {t.resetFilters || "Réinitialiser"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Freelancers Grid */}
          <div className="flex-1">
            {loading && freelancers.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="border-slate-200 dark:border-slate-800">
                    <CardContent className="p-5">
                      <div className="animate-pulse space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                          </div>
                        </div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                        <div className="flex gap-2">
                          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-14"></div>
                          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-14"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : freelancers.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800">
                <CardContent className="pt-12 pb-12 text-center">
                  <Users className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    {t.noFreelancers || "Aucun freelance trouvé"}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    {t.noFreelancersDesc || "Aucun freelance ne correspond à vos critères. Essayez d'ajuster vos filtres."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className={cn(
                  "grid gap-4",
                  viewMode === 'grid' 
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                    : "grid-cols-1"
                )}>
                  {freelancers.map((freelancer) => (
                    viewMode === 'grid' ? (
                      <FreelancerCardGrid key={freelancer._id} freelancer={freelancer} dict={dict} lang={lang} />
                    ) : (
                      <FreelancerCardList key={freelancer._id} freelancer={freelancer} dict={dict} lang={lang} />
                    )
                  ))}
                </div>

                {/* Load More Trigger */}
                <div ref={loadMoreRef} className="flex justify-center py-6">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">{t.loadingMore || "Chargement..."}</span>
                    </div>
                  )}
                  {!hasMore && freelancers.length > 0 && (
                    <p className="text-sm text-slate-400">
                      {t.noMoreFreelancers || "Plus de freelancers à charger"}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Grid Card Component
function FreelancerCardGrid({ freelancer, dict, lang }: { freelancer: Freelancer; dict: any; lang: string }) {
  const router = useRouter()
  const availability = getAvailabilityBadge(freelancer.availability, dict)
  const t = dict?.freelancers || {}

  return (
    <Card className="group border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300 overflow-hidden hover:scale-[1.02] cursor-pointer"
      onClick={() => router.push(`/${lang}/profile/${freelancer._id}`)}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-900 shadow-md">
            <AvatarImage src={freelancer.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-base font-semibold">
              {freelancer.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <h3 className="font-semibold text-slate-900 dark:text-white text-base truncate">
                {freelancer.name}
              </h3>
              {freelancer.isVerified && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 text-[10px] px-1.5 py-0">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                  {t.verified || "Vérifié"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate mb-1">
              {freelancer.title || t.freelancer || "Freelancer"}
            </p>
            {freelancer.location && (
              <div className="flex items-center gap-0.5 text-[10px] text-slate-500 dark:text-slate-500">
                <MapPin className="h-2.5 w-2.5" />
                {freelancer.location}
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        {freelancer.skills && freelancer.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3 mb-3">
            {freelancer.skills.slice(0, 3).map((skill, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 bg-slate-100 dark:bg-slate-800">
                {skill}
              </Badge>
            ))}
            {freelancer.skills.length > 3 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                +{freelancer.skills.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {freelancer.hourlyRate && (
              <div className="flex items-center gap-0.5">
                <DollarSign className="h-3 w-3 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-sm text-slate-900 dark:text-white">{freelancer.hourlyRate}/h</span>
              </div>
            )}
            {freelancer.rating && (
              <div className="flex items-center gap-0.5">
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                <span className="font-medium text-xs text-slate-700 dark:text-slate-300">{freelancer.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <Badge className={cn("text-[10px] px-1.5 py-0", availability.color)}>
            {availability.label}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/${lang}/profile/${freelancer._id}`)
            }}
          >
            <Eye className="h-3 w-3 mr-1" />
            {t.viewProfile || "Voir profil"}
          </Button>
          <Button 
            size="sm" 
            className="flex-1 h-7 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/${lang}/messages/new?user=${freelancer._id}`)
            }}
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            {t.contact || "Contacter"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// List Card Component
function FreelancerCardList({ freelancer, dict, lang }: { freelancer: Freelancer; dict: any; lang: string }) {
  const router = useRouter()
  const availability = getAvailabilityBadge(freelancer.availability, dict)
  const t = dict?.freelancers || {}

  return (
    <Card className="group border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => router.push(`/${lang}/profile/${freelancer._id}`)}>
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-14 w-14 border-2 border-white dark:border-slate-900 shadow-md">
              <AvatarImage src={freelancer.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                {freelancer.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                  {freelancer.name}
                </h3>
                {freelancer.isVerified && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {t.verified || "Vérifié"}
                  </Badge>
                )}
                <Badge className={cn("text-xs", availability.color)}>
                  {availability.label}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                {freelancer.title || t.freelancer || "Freelancer"}
              </p>
              {freelancer.location && (
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500 mb-2">
                  <MapPin className="h-3 w-3" />
                  {freelancer.location}
                </div>
              )}
              
              {/* Skills */}
              {freelancer.skills && freelancer.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {freelancer.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-800">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats and Actions */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              {freelancer.hourlyRate && (
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">{freelancer.hourlyRate}€</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-500">{t.hourlyRate || "Taux horaire"}</div>
                </div>
              )}
              {freelancer.rating && (
                <div className="text-center">
                  <div className="flex items-center gap-0.5">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-base font-bold text-slate-900 dark:text-white">{freelancer.rating.toFixed(1)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-500">{t.rating || "Note"}</div>
                </div>
              )}
              {freelancer.completedProjects && (
                <div className="text-center">
                  <div className="text-base font-bold text-blue-600 dark:text-blue-400">{freelancer.completedProjects}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-500">{t.projects || "Projets"}</div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/${lang}/profile/${freelancer._id}`)
                }}
                className="h-8 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                {t.viewProfile || "Voir profil"}
              </Button>
              <Button 
                size="sm"
                className="h-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/${lang}/messages/new?user=${freelancer._id}`)
                }}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                {t.contact || "Contacter"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function getAvailabilityBadge(availability: string, dict: any) {
  const config = {
    available: { label: dict?.freelancers?.available || "Disponible", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
    busy: { label: dict?.freelancers?.busy || "Occupé", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
    unavailable: { label: dict?.freelancers?.unavailable || "Indisponible", color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300" }
  }
  return config[availability as keyof typeof config] || config.available
}