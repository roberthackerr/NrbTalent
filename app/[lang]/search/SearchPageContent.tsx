'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { 
  Search, 
  User, 
  Briefcase,
  X,
  SlidersHorizontal,
  Grid3X3,
  List,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { UserCard, UserCardSkeleton } from '@/components/user/UserCard'
import { ProjectCard, ProjectCardSkeleton } from '@/components/project/ProjectCard'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface User {
  _id: string
  name: string
  email: string
  role: 'freelance' | 'client'
  title: string
  bio: string
  avatar: string
  skills: any[]
  location: string
  hourlyRate: number
  statistics: {
    rating: number
    completedProjects: number
    responseRate: number
    successRate?: number
  }
  verified: boolean
  createdAt: string
}

interface Project {
  _id: string
  title: string
  description: string
  category: string
  subcategory?: string
  skills: string[]
  budget: {
    min: number
    max: number
    type: 'fixed' | 'hourly'
    currency: string
  }
  deadline: string
  status: string
  visibility: string
  applicationCount: number
  views: number
  createdAt: string
  client?: {
    _id: string
    name: string
    avatar?: string
    rating?: number
    completedProjects?: number
  }
  location?: {
    remote: boolean
    country?: string
    city?: string
  }
  urgency?: string
  featured?: boolean
  complexity?: string
  hasApplied?: boolean
}

interface SearchPageContentProps {
  params: { lang: Locale }
  searchParams: { 
    q?: string
    type?: 'all' | 'users' | 'projects'
    page?: string
    sort?: string
    location?: string
    skills?: string
    minRating?: string
    budgetMin?: string
    budgetMax?: string
    budgetType?: string
    category?: string
  }
}

type SearchTab = 'all' | 'users' | 'projects'

export function SearchPageContent({ params, searchParams }: SearchPageContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { lang } = params

  const [dict, setDict] = useState<any>(null)
  const [query, setQuery] = useState(searchParams.q || '')
  const [activeTab, setActiveTab] = useState<SearchTab>(searchParams.type as SearchTab || 'all')
  const [page, setPage] = useState(parseInt(searchParams.page || '1'))
  const [sort, setSort] = useState(searchParams.sort || 'relevance')

  // Filtres communs
  const [location, setLocation] = useState(searchParams.location || '')
  const [skillsFilter, setSkillsFilter] = useState<string[]>(
    searchParams.skills ? searchParams.skills.split(',') : []
  )
  const [minRating, setMinRating] = useState(parseFloat(searchParams.minRating || '0'))

  // Filtres projets
  const [budgetMin, setBudgetMin] = useState(parseInt(searchParams.budgetMin || '0'))
  const [budgetMax, setBudgetMax] = useState(parseInt(searchParams.budgetMax || '1000000'))
  const [budgetType, setBudgetType] = useState(searchParams.budgetType || 'all')
  const [category, setCategory] = useState(searchParams.category || '')

  // États des résultats
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalProjects, setTotalProjects] = useState(0)
  const [totalPagesUsers, setTotalPagesUsers] = useState(1)
  const [totalPagesProjects, setTotalPagesProjects] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [error, setError] = useState<string | null>(null)

  const isFirstRender = useRef(true)

  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  const t = dict?.search || {}

  // Rechercher des utilisateurs
  const fetchUsers = useCallback(async () => {
    if (activeTab === 'projects') return

    setLoadingUsers(true)
    setError(null)

    try {
      const p = new URLSearchParams()
      if (query) p.set('q', query)
      if (location) p.set('location', location)
      if (skillsFilter.length) p.set('skills', skillsFilter.join(','))
      if (minRating > 0) p.set('minRating', minRating.toString())

      if (sort === 'rating') {
        p.set('sortBy', 'rating')
        p.set('sortOrder', 'desc')
      } else if (sort === 'date') {
        p.set('sortBy', 'createdAt')
        p.set('sortOrder', 'desc')
      } else {
        p.set('sortBy', 'relevance')
      }

      p.set('page', page.toString())
      p.set('limit', activeTab === 'all' ? '5' : '12')

      const response = await fetch(`/api/users/search?${p}`)
      const data = await response.json()

      if (data.success) {
        setUsers(data.users || [])
        setTotalUsers(data.pagination?.total || 0)
        setTotalPagesUsers(data.pagination?.pages || 1)
      } else {
        setError(data.error || 'Erreur lors de la recherche des utilisateurs')
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Erreur de connexion lors de la recherche des utilisateurs')
    } finally {
      setLoadingUsers(false)
    }
  }, [query, location, skillsFilter, minRating, sort, page, activeTab])

  // Rechercher des projets
  const fetchProjects = useCallback(async () => {
    if (activeTab === 'users') return

    setLoadingProjects(true)
    setError(null)

    try {
      const p = new URLSearchParams()
      if (query) p.set('q', query)
      if (location) p.set('location', location)
      if (skillsFilter.length) p.set('skills', skillsFilter.join(','))
      if (budgetMin > 0) p.set('budgetMin', budgetMin.toString())
      if (budgetMax < 1000000) p.set('budgetMax', budgetMax.toString())
      if (budgetType !== 'all') p.set('budgetType', budgetType)
      if (category) p.set('category', category)

      if (sort === 'date') {
        p.set('sortBy', 'createdAt')
        p.set('sortOrder', 'desc')
      } else if (sort === 'rating') {
        p.set('sortBy', 'applications')
        p.set('sortOrder', 'desc')
      } else {
        p.set('sortBy', 'relevance')
      }

      p.set('page', page.toString())
      p.set('limit', activeTab === 'all' ? '5' : '12')

      const response = await fetch(`/api/projects/search?${p}`)
      const data = await response.json()

      if (data.success) {
        setProjects(data.data?.projects || [])
        setTotalProjects(data.data?.pagination?.total || 0)
        setTotalPagesProjects(data.data?.pagination?.totalPages || 1)
      } else {
        setError(data.error || 'Erreur lors de la recherche des projets')
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError('Erreur de connexion lors de la recherche des projets')
    } finally {
      setLoadingProjects(false)
    }
  }, [query, location, skillsFilter, budgetMin, budgetMax, budgetType, category, sort, page, activeTab])

  // Unified effect: on first render trigger fetches directly (preserving URL),
  // on subsequent changes sync URL (which re-creates callbacks and re-triggers fetches)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      // Trigger fetches with initial state from URL params
      if (activeTab === 'users' || activeTab === 'all') fetchUsers()
      if (activeTab === 'projects' || activeTab === 'all') fetchProjects()
      return
    }

    // Sync URL
    const p = new URLSearchParams()
    if (query) p.set('q', query)
    if (activeTab !== 'all') p.set('type', activeTab)
    if (page > 1) p.set('page', page.toString())
    if (sort !== 'relevance') p.set('sort', sort)
    if (location) p.set('location', location)
    if (skillsFilter.length) p.set('skills', skillsFilter.join(','))
    if (minRating > 0) p.set('minRating', minRating.toString())
    if (budgetMin > 0) p.set('budgetMin', budgetMin.toString())
    if (budgetMax < 1000000) p.set('budgetMax', budgetMax.toString())
    if (budgetType !== 'all') p.set('budgetType', budgetType)
    if (category) p.set('category', category)

    router.replace(`${pathname}?${p.toString()}`, { scroll: false })

    // Trigger fetches after state changes
    if (activeTab === 'users' || activeTab === 'all') fetchUsers()
    if (activeTab === 'projects' || activeTab === 'all') fetchProjects()
  }, [query, activeTab, page, sort, location, skillsFilter, minRating,
      budgetMin, budgetMax, budgetType, category, pathname, router,
      fetchUsers, fetchProjects])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
    fetchProjects()
  }

  const clearFilters = () => {
    setQuery('')
    setLocation('')
    setSkillsFilter([])
    setMinRating(0)
    setSort('relevance')
    setBudgetMin(0)
    setBudgetMax(1000000)
    setBudgetType('all')
    setCategory('')
    setPage(1)
  }

  const hasFilters = query || location || skillsFilter.length > 0 || minRating > 0 ||
    sort !== 'relevance' || budgetMin > 0 || budgetMax < 1000000 ||
    budgetType !== 'all' || category

  const tabs = [
    { id: 'all', label: t.all || 'Tout', icon: Search },
    { id: 'users', label: t.freelancers || 'Freelances', icon: User },
    { id: 'projects', label: t.projects || 'Projets', icon: Briefcase },
  ]

  const sortOptions = [
    { value: 'relevance', label: 'Pertinence' },
    { value: 'rating', label: 'Meilleure note' },
    { value: 'date', label: 'Plus récent' },
  ]

  const budgetTypeOptions = [
    { value: 'all', label: 'Tous' },
    { value: 'fixed', label: 'Forfait' },
    { value: 'hourly', label: 'Horaire' },
  ]

  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  const loading = (activeTab === 'users' && loadingUsers) ||
    (activeTab === 'projects' && loadingProjects) ||
    (activeTab === 'all' && (loadingUsers || loadingProjects))

  const renderResults = () => {
    if (error) {
      return (
        <div className="text-center py-16">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                if (activeTab === 'users') fetchUsers()
                if (activeTab === 'projects') fetchProjects()
                if (activeTab === 'all') { fetchUsers(); fetchProjects() }
              }}
            >
              Réessayer
            </Button>
          </div>
        </div>
      )
    }

    if (activeTab === 'users') {
      if (loadingUsers) {
        return (
          <div className={cn(viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4")}>
            {[...Array(6)].map((_, i) => (
              <UserCardSkeleton key={i} variant={viewMode === 'grid' ? 'minimal' : 'default'} />
            ))}
          </div>
        )
      }

      if (users.length === 0) {
        return (
          <div className="text-center py-16">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              {t.noUsersFound || 'Aucun freelance trouvé'}
            </h3>
            <p className="text-sm text-gray-500">
              {t.tryDifferentKeywords || "Essayez avec d'autres mots-clés"}
            </p>
          </div>
        )
      }

      return (
        <div className={cn(viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4")}>
          {users.map((user, index) => (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <UserCard
                user={user}
                lang={lang}
                variant={viewMode === 'grid' ? 'minimal' : 'default'}
                showContactButton
                onContact={(u) => console.log('Contact', u.name)}
              />
            </motion.div>
          ))}
        </div>
      )
    }

    if (activeTab === 'projects') {
      if (loadingProjects) {
        return (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <ProjectCardSkeleton key={i} variant="default" />
            ))}
          </div>
        )
      }

      if (projects.length === 0) {
        return (
          <div className="text-center py-16">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              {t.noProjectsFound || 'Aucun projet trouvé'}
            </h3>
            <p className="text-sm text-gray-500">
              {t.tryDifferentKeywords || "Essayez avec d'autres mots-clés"}
            </p>
          </div>
        )
      }

      return (
        <div className="space-y-4">
          {projects.map((project, index) => (
            <motion.div
              key={project._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProjectCard
                project={project}
                lang={lang}
                variant="default"
                showActions
                showMatchBadge={false}
                onApply={(p) => console.log('Apply', p.title)}
                onDetail={(p) => router.push(`/projects/${p._id}`)}
              />
            </motion.div>
          ))}
        </div>
      )
    }

    // Tab "Tout"
    const hasUsers = users.length > 0
    const hasProjects = projects.length > 0
    const isLoading = loadingUsers || loadingProjects

    if (isLoading) {
      return (
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-32 rounded" />
            </div>
            {[...Array(2)].map((_, i) => (
              <UserCardSkeleton key={`user-${i}`} variant="minimal" />
            ))}
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-32 rounded" />
            </div>
            {[...Array(2)].map((_, i) => (
              <ProjectCardSkeleton key={`project-${i}`} variant="minimal" />
            ))}
          </div>
        </div>
      )
    }

    if (!hasUsers && !hasProjects) {
      return (
        <div className="text-center py-16">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            {t.noResultsFound || 'Aucun résultat trouvé'}
          </h3>
          <p className="text-sm text-gray-500">
            {t.tryDifferentKeywords || "Essayez avec d'autres mots-clés"}
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-8">
        {hasUsers && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t.freelancers || 'Freelances'} ({totalUsers})
              </h2>
              <button
                onClick={() => setActiveTab('users')}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {t.viewAll || 'Voir tout'} →
              </button>
            </div>
            <div className="space-y-4">
              {users.slice(0, 3).map((user) => (
                <UserCard
                  key={user._id}
                  user={user}
                  lang={lang}
                  variant="minimal"
                  showContactButton={false}
                />
              ))}
            </div>
          </div>
        )}

        {hasProjects && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t.projects || 'Projets'} ({totalProjects})
              </h2>
              <button
                onClick={() => setActiveTab('projects')}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {t.viewAll || 'Voir tout'} →
              </button>
            </div>
            <div className="space-y-4">
              {projects.slice(0, 3).map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  lang={lang}
                  variant="minimal"
                  showActions={false}
                  onDetail={(p) => router.push(`/projects/${p._id}`)}
                />
              ))}
            </div>
          </div>
        )}
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
                  placeholder={t.searchPlaceholder || "Rechercher des freelances ou projets..."}
                  className="w-full pl-9 pr-12 py-2 text-sm rounded-full bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
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
                <div className="w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {t.filters || 'Filtres'}
                    </h3>
                    {hasFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {t.clearAll || 'Effacer tout'}
                      </button>
                    )}
                  </div>

                  {/* Localisation */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      {t.location || 'Localisation'}
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder={t.locationPlaceholder || "Ville, pays..."}
                        className="pl-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Compétences */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      {t.skills || 'Compétences'}
                    </label>
                    <Input
                      type="text"
                      value={skillsFilter.join(', ')}
                      onChange={(e) => setSkillsFilter(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      placeholder={t.skillsPlaceholder || "React, Node.js, UI/UX..."}
                      className="text-sm"
                    />
                  </div>

                  {/* Note minimum */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      {t.minRating || 'Note minimum'}
                    </label>
                    <select
                      value={minRating}
                      onChange={(e) => setMinRating(parseFloat(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                    >
                      <option value={0}>{t.allRatings || 'Toutes les notes'}</option>
                      <option value={4.5}>4.5+</option>
                      <option value={4}>4.0+</option>
                      <option value={3.5}>3.5+</option>
                    </select>
                  </div>

                  {/* Filtres projets */}
                  {(activeTab === 'projects' || activeTab === 'all') && (
                    <>
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          {t.budget || 'Budget'}
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={budgetMin || ''}
                            onChange={(e) => setBudgetMin(parseInt(e.target.value) || 0)}
                            placeholder={t.min || 'Min'}
                            className="text-sm"
                          />
                          <Input
                            type="number"
                            value={budgetMax === 1000000 ? '' : budgetMax}
                            onChange={(e) => setBudgetMax(parseInt(e.target.value) || 1000000)}
                            placeholder={t.max || 'Max'}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          {t.budgetType || 'Type de budget'}
                        </label>
                        <div className="flex gap-2">
                          {budgetTypeOptions.map(option => (
                            <button
                              key={option.value}
                              onClick={() => setBudgetType(option.value)}
                              className={cn(
                                "flex-1 px-3 py-1.5 text-sm rounded-lg border transition-colors",
                                budgetType === option.value
                                  ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-300"
                                  : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          {t.category || 'Catégorie'}
                        </label>
                        <Input
                          type="text"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder={t.categoryPlaceholder || "Développement Web, Design..."}
                          className="text-sm"
                        />
                      </div>
                    </>
                  )}

                  {/* Tri */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      {t.sortBy || 'Trier par'}
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
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SearchTab)} className="mb-6">
              <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </Tabs>

            {!loading && !error && (
              <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-white">
                  {activeTab === 'users'
                    ? totalUsers
                    : activeTab === 'projects'
                      ? totalProjects
                      : totalUsers + totalProjects}
                </span> {t.results || 'résultats'}
              </div>
            )}

            <AnimatePresence mode="wait">
              {renderResults()}
            </AnimatePresence>

            {/* Pagination */}
            {activeTab !== 'all' && !error && (
              activeTab === 'users' ? (
                totalPagesUsers > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                      {t.previous || 'Précédent'}
                    </Button>
                    <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {t.page || 'Page'} {page} {t.of || 'sur'} {totalPagesUsers}
                    </span>
                    <Button variant="outline" onClick={() => setPage(p => Math.min(totalPagesUsers, p + 1))} disabled={page === totalPagesUsers}>
                      {t.next || 'Suivant'}
                    </Button>
                  </div>
                )
              ) : (
                totalPagesProjects > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                      {t.previous || 'Précédent'}
                    </Button>
                    <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {t.page || 'Page'} {page} {t.of || 'sur'} {totalPagesProjects}
                    </span>
                    <Button variant="outline" onClick={() => setPage(p => Math.min(totalPagesProjects, p + 1))} disabled={page === totalPagesProjects}>
                      {t.next || 'Suivant'}
                    </Button>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}