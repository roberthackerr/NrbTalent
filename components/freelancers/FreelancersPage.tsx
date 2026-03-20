// components/freelancers/FreelancersPage.tsx
'use client'

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  MapPin, 
  Star, 
  DollarSign, 
  Filter,
  SlidersHorizontal,
  Grid3X3,
  List,
  CheckCircle2,
  Eye,
  MessageCircle,
  Users,
  Loader2
} from "lucide-react"
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

interface FreelancersPageProps {
  dict: any
  lang: string
}

export function FreelancersPage({ dict, lang }: FreelancersPageProps) {
  const router = useRouter()
  const [freelancers, setFreelancers] = useState<Freelancer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    availability: "all",
    minRate: "",
    maxRate: "",
    skills: [] as string[],
    minRating: 0
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchFreelancers()
  }, [filters, searchQuery])

  const fetchFreelancers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (filters.availability !== 'all') params.append('availability', filters.availability)
      if (filters.minRate) params.append('minRate', filters.minRate)
      if (filters.maxRate) params.append('maxRate', filters.maxRate)
      if (filters.minRating > 0) params.append('minRating', filters.minRating.toString())
      if (filters.skills.length > 0) params.append('skills', filters.skills.join(','))

      const response = await fetch(`/api/users/freelancers?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setFreelancers(data.freelancers || [])
      }
    } catch (error) {
      console.error('Error fetching freelancers:', error)
    } finally {
      setLoading(false)
    }
  }

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
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input
          type="text"
          placeholder={t.searchPlaceholder || "Rechercher par compétence, nom..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-base"
        />
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
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
              className={cn("h-9 w-9 p-0", viewMode === 'grid' && "bg-blue-600 text-white")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn("h-9 w-9 p-0", viewMode === 'list' && "bg-blue-600 text-white")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {!loading && `${freelancers.length} ${t.freelancersFound || 'freelancers trouvés'}`}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className={cn(
          "lg:w-80 flex-shrink-0 space-y-6 transition-all duration-300",
          showFilters ? "block" : "hidden lg:block"
        )}>
          <Card className="border-slate-200 dark:border-slate-800 shadow-lg sticky top-24">
            <CardContent className="p-6 space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                {t.filterTitle || "Filtres"}
              </h3>

              {/* Availability */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  {t.availability || "Disponibilité"}
                </h4>
                <div className="space-y-2">
                  {[
                    { value: "all", label: t.all || "Tous" },
                    { value: "available", label: t.available || "Disponible" },
                    { value: "busy", label: t.busy || "Occupé" },
                    { value: "unavailable", label: t.unavailable || "Indisponible" }
                  ].map(option => (
                    <label key={option.value} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
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
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  {t.rateRange || "Taux horaire"}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder={t.min || "Min"}
                    value={filters.minRate}
                    onChange={(e) => setFilters(prev => ({ ...prev, minRate: e.target.value }))}
                    className="border-slate-200 dark:border-slate-700"
                  />
                  <Input
                    type="number"
                    placeholder={t.max || "Max"}
                    value={filters.maxRate}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxRate: e.target.value }))}
                    className="border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              {/* Rating */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  {t.minRating || "Note minimum"}
                </h4>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                      className={cn(
                        "flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all",
                        filters.minRating === rating 
                          ? "bg-blue-600 text-white" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                      )}
                    >
                      <Star className="h-3 w-3 fill-current" />
                      {rating}+
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={() => setFilters({ availability: "all", minRate: "", maxRate: "", skills: [], minRating: 0 })}
                className="w-full"
              >
                {t.resetFilters || "Réinitialiser"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Freelancers Grid/List */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : freelancers.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800">
              <CardContent className="pt-16 pb-16 text-center">
                <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {t.noFreelancers || "Aucun freelance trouvé"}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  {t.noFreelancersDesc || "Aucun freelance ne correspond à vos critères. Essayez d'ajuster vos filtres."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className={cn(
              "grid gap-6",
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
          )}
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
    <Card 
      className="group border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-[1.02] cursor-pointer"
      onClick={() => router.push(`/${lang}/profile/${freelancer._id}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 border-2 border-white dark:border-slate-900 shadow-lg">
            <AvatarImage src={freelancer.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
              {freelancer.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-slate-900 dark:text-white text-lg truncate">
                {freelancer.name}
              </h3>
              {freelancer.isVerified && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {t.verified || "Vérifié"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 truncate mb-2">
              {freelancer.title || t.freelancer || "Freelancer"}
            </p>
            {freelancer.location && (
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500 mb-2">
                <MapPin className="h-3 w-3" />
                {freelancer.location}
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        {freelancer.skills && freelancer.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4 mb-4">
            {freelancer.skills.slice(0, 4).map((skill, i) => (
              <Badge key={i} variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-800">
                {skill}
              </Badge>
            ))}
            {freelancer.skills.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{freelancer.skills.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {freelancer.hourlyRate && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-slate-900 dark:text-white">{freelancer.hourlyRate}/h</span>
              </div>
            )}
            {freelancer.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="font-medium text-slate-700 dark:text-slate-300">{freelancer.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <Badge className={availability.color}>
            {availability.label}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 text-xs"
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
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs"
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
    <Card 
      className="group border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300 cursor-pointer"
      onClick={() => router.push(`/${lang}/profile/${freelancer._id}`)}
    >
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex items-start gap-4 flex-1">
            <Avatar className="h-16 w-16 border-2 border-white dark:border-slate-900 shadow-lg">
              <AvatarImage src={freelancer.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-semibold">
                {freelancer.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-slate-900 dark:text-white text-xl">
                  {freelancer.name}
                </h3>
                {freelancer.isVerified && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {t.verified || "Vérifié"}
                  </Badge>
                )}
                <Badge className={availability.color}>
                  {availability.label}
                </Badge>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                {freelancer.title || t.freelancer || "Freelancer"}
              </p>
              {freelancer.location && (
                <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-500 mb-3">
                  <MapPin className="h-4 w-4" />
                  {freelancer.location}
                </div>
              )}
              
              {/* Skills */}
              {freelancer.skills && freelancer.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {freelancer.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="bg-slate-100 dark:bg-slate-800">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats and Actions */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-4">
              {freelancer.hourlyRate && (
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">{freelancer.hourlyRate}€</div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">{t.hourlyRate || "Taux horaire"}</div>
                </div>
              )}
              {freelancer.rating && (
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span className="text-xl font-bold text-slate-900 dark:text-white">{freelancer.rating.toFixed(1)}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">{t.rating || "Note"}</div>
                </div>
              )}
              {freelancer.completedProjects && (
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{freelancer.completedProjects}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">{t.projects || "Projets"}</div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/${lang}/profile/${freelancer._id}`)
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                {t.viewProfile || "Voir profil"}
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/${lang}/messages/new?user=${freelancer._id}`)
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
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