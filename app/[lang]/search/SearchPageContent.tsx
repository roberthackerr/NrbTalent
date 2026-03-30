// app/[lang]/search/SearchPageContent.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { 
  Search, 
  Briefcase, 
  User, 
  Star,
  MapPin,
  Clock,
  Loader2,
  Filter,
  X,
  Verified,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  SlidersHorizontal,
  Grid3X3,
  List,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface User {
  _id: string
  name: string
  email: string
  role: string
  title: string
  bio: string
  avatar: string
  skills: string[]
  location: string
  hourlyRate: number
  statistics: {
    rating: number
    completedProjects: number
    responseRate: number
  }
  verified: boolean
  createdAt: string
}

interface SearchResponse {
  success: boolean
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: any
}

interface SearchPageContentProps {
  params: { lang: Locale }
  searchParams: { q?: string; type?: string; page?: string; sort?: string; location?: string; skills?: string; minRating?: string }
}

export function SearchPageContent({ params, searchParams }: SearchPageContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { lang } = params
  
  const [dict, setDict] = useState<any>(null)
  const [query, setQuery] = useState(searchParams.q || '')
  const [type, setType] = useState(searchParams.type || 'all')
  const [page, setPage] = useState(parseInt(searchParams.page || '1'))
  const [sort, setSort] = useState(searchParams.sort || 'relevance')
  const [location, setLocation] = useState(searchParams.location || '')
  const [skillsFilter, setSkillsFilter] = useState<string[]>(
    searchParams.skills ? searchParams.skills.split(',') : []
  )
  const [minRating, setMinRating] = useState(parseFloat(searchParams.minRating || '0'))
  
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])
  
  const t = dict?.search || {}
  
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    
    try {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (type === 'freelancers') params.set('role', 'freelance')
      if (location) params.set('location', location)
      if (skillsFilter.length) params.set('skills', skillsFilter.join(','))
      if (minRating > 0) params.set('minRating', minRating.toString())
      if (sort === 'rating') params.set('sortBy', 'rating')
      if (sort === 'date') params.set('sortBy', 'createdAt')
      params.set('page', page.toString())
      params.set('limit', '12')
      
      const response = await fetch(`/api/users/search?${params}`)
      const data: SearchResponse = await response.json()
      
      if (data.success) {
        setUsers(data.users)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.pages)
      }
      
      // Mettre à jour l'URL
      const urlParams = new URLSearchParams()
      if (query) urlParams.set('q', query)
      if (type !== 'all') urlParams.set('type', type)
      if (location) urlParams.set('location', location)
      if (skillsFilter.length) urlParams.set('skills', skillsFilter.join(','))
      if (minRating > 0) urlParams.set('minRating', minRating.toString())
      if (sort !== 'relevance') urlParams.set('sort', sort)
      if (page > 1) urlParams.set('page', page.toString())
      
      router.replace(`${pathname}?${urlParams.toString()}`, { scroll: false })
      
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }, [query, type, page, sort, location, skillsFilter, minRating, router, pathname])
  
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }
  
  const clearFilters = () => {
    setQuery('')
    setType('all')
    setLocation('')
    setSkillsFilter([])
    setMinRating(0)
    setSort('relevance')
    setPage(1)
  }
  
  const hasFilters = query || type !== 'all' || location || skillsFilter.length > 0 || minRating > 0 || sort !== 'relevance'
  
  const tabs = [
    { id: 'all', label: t.all || 'Tout', icon: Search, count: total },
    { id: 'freelancers', label: t.freelancers || 'Freelances', icon: User, count: total },
  ]
  
  const sortOptions = [
    { value: 'relevance', label: 'Pertinence' },
    { value: 'rating', label: 'Meilleure note' },
    { value: 'date', label: 'Plus récent' },
  ]
  
  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 py-3">
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.placeholder || "Rechercher des freelances..."}
                  className="w-full pl-9 pr-12 py-2 text-sm rounded-full bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </form>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={cn("rounded-full", showFilters && "bg-gray-100 dark:bg-gray-800")}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
            
            <div className="hidden sm:flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={cn("rounded-full", viewMode === 'list' && "bg-gray-100 dark:bg-gray-800")}
              >
                <List className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={cn("rounded-full", viewMode === 'grid' && "bg-gray-100 dark:bg-gray-800")}
              >
                <Grid3X3 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filtres */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex-shrink-0 overflow-hidden"
              >
                <div className="w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky top-20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Filtres</h3>
                    {hasFilters && (
                      <button onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-700">
                        Effacer
                      </button>
                    )}
                  </div>
                  
                  {/* Type */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Type
                    </label>
                    <div className="space-y-1">
                      {tabs.map(tab => {
                        const Icon = tab.icon
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setType(tab.id === 'all' ? 'all' : 'freelancers')}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                              type === (tab.id === 'all' ? 'all' : 'freelancers')
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{tab.label}</span>
                            {tab.count > 0 && (
                              <span className="ml-auto text-xs text-gray-400">{tab.count}</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  
                  {/* Localisation */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Localisation
                    </label>
                    <Input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Ville, pays..."
                      className="text-sm"
                    />
                  </div>
                  
                  {/* Note minimum */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Note minimum
                    </label>
                    <select
                      value={minRating}
                      onChange={(e) => setMinRating(parseFloat(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                    >
                      <option value={0}>Toutes les notes</option>
                      <option value={4.5}>4.5+</option>
                      <option value={4}>4.0+</option>
                      <option value={3.5}>3.5+</option>
                    </select>
                  </div>
                  
                  {/* Tri */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Trier par
                    </label>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                    >
                      {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Résultats */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700 mb-6">
              {tabs.map(tab => {
                const Icon = tab.icon
                const isActive = type === (tab.id === 'all' ? 'all' : 'freelancers')
                return (
                  <button
                    key={tab.id}
                    onClick={() => setType(tab.id === 'all' ? 'all' : 'freelancers')}
                    className={cn(
                      "flex items-center gap-2 pb-3 text-sm font-medium transition-colors relative",
                      isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {isActive && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                  </button>
                )
              })}
            </div>
            
            {/* Résultats count */}
            {!loading && users.length > 0 && (
              <div className="mb-4 text-sm text-gray-500">
                <span className="font-medium text-gray-900 dark:text-white">{total}</span> résultats
              </div>
            )}
            
            {/* Liste des freelances */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <UserCardSkeleton key={i} viewMode={viewMode} />
                  ))}
                </motion.div>
              ) : users.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Aucun résultat trouvé</h3>
                  <p className="text-sm text-gray-500">Essayez avec d'autres mots-clés</p>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "space-y-4",
                    viewMode === 'grid' && "grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0"
                  )}
                >
                  {users.map((user, index) => (
                    <motion.div key={user._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                      {viewMode === 'grid' ? (
                        <UserGridCard user={user} lang={lang} liked={liked[user._id]} saved={saved[user._id]} onLike={() => setLiked(prev => ({ ...prev, [user._id]: !prev[user._id] }))} onSave={() => setSaved(prev => ({ ...prev, [user._id]: !prev[user._id] }))} />
                      ) : (
                        <UserFeedCard user={user} lang={lang} liked={liked[user._id]} saved={saved[user._id]} onLike={() => setLiked(prev => ({ ...prev, [user._id]: !prev[user._id] }))} onSave={() => setSaved(prev => ({ ...prev, [user._id]: !prev[user._id] }))} />
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  Précédent
                </Button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {page} sur {totalPages}
                </span>
                <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Suivant
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant Feed Card
function UserFeedCard({ user, lang, liked, saved, onLike, onSave }: any) {
  return (
    <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
      <div className="p-4 pb-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {user.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/${lang}/profile/${user._id}`} className="font-semibold text-gray-900 dark:text-white hover:text-blue-600">
                {user.name}
              </Link>
              {user.verified && <Verified className="h-4 w-4 text-blue-500" />}
              <Badge className="bg-green-100 text-green-700 text-xs">
                {user.role === 'freelance' ? 'Freelance' : 'Client'}
              </Badge>
            </div>
            <div className="text-sm text-gray-500">{user.title}</div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              {user.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.hourlyRate > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{user.hourlyRate}€/h</span>
                </div>
              )}
              {user.statistics?.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span>{user.statistics.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{user.bio}</p>
        
        {user.skills && user.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {user.skills.slice(0, 3).map((skill: string) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {user.skills.length > 3 && (
              <Badge variant="outline" className="text-xs">+{user.skills.length - 3}</Badge>
            )}
          </div>
        )}
        
        {user.statistics?.completedProjects > 0 && (
          <div className="mt-3 text-xs text-gray-500">
            <span className="font-medium">{user.statistics.completedProjects}</span> projets complétés
          </div>
        )}
      </div>
      
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onLike} className={cn("flex items-center gap-1.5 text-sm transition-colors", liked ? "text-red-500" : "text-gray-500 hover:text-red-500")}>
            <Heart className={cn("h-5 w-5", liked && "fill-current")} />
            <span>{liked ? 1 : 0}</span>
          </button>
          <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-500">
            <MessageCircle className="h-5 w-5" />
            <span>0</span>
          </button>
          <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-500">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
        <button onClick={onSave} className={cn("text-gray-400 hover:text-blue-500", saved && "text-blue-500")}>
          <Bookmark className={cn("h-5 w-5", saved && "fill-current")} />
        </button>
      </div>
    </article>
  )
}

// Composant Grid Card
function UserGridCard({ user, lang }: any) {
  return (
    <Link href={`/${lang}/profile/${user._id}`}>
      <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-200 dark:border-gray-700 group">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {user.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1">
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600">{user.name}</h3>
                {user.verified && <Verified className="h-3.5 w-3.5 text-blue-500" />}
              </div>
              <p className="text-xs text-gray-500">{user.title}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{user.bio}</p>
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
            {user.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{user.location}</span>
              </div>
            )}
            {user.hourlyRate > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{user.hourlyRate}€/h</span>
              </div>
            )}
          </div>
          {user.statistics?.rating > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">{user.statistics.rating.toFixed(1)}</span>
              <span className="text-xs text-gray-500">({user.statistics.completedProjects} projets)</span>
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}

function UserCardSkeleton({ viewMode }: { viewMode: string }) {
  if (viewMode === 'grid') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-1" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      </div>
    )
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    </div>
  )
}