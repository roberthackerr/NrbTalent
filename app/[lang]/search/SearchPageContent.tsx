// app/[lang]/search/SearchPageContent.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { 
  Search, 
  User, 
  Briefcase,
  Loader2,
  Filter,
  X,
  SlidersHorizontal,
  Grid3X3,
  List,
  DollarSign,
  MapPin,
  Clock,
  Star
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

interface SearchResponse {
  success: boolean
  users?: User[]
  projects?: Project[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: any
  facets?: {
    skills?: Array<{ name: string; count: number }>
    categories?: Array<{ name: string; count: number }>
  }
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
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [facets, setFacets] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])
  
  const t = dict?.search || {}
  
  const fetchResults = useCallback(async () => {
    setLoading(true)
    
    try {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (activeTab !== 'all') params.set('type', activeTab)
      if (location) params.set('location', location)
      if (skillsFilter.length) params.set('skills', skillsFilter.join(','))
      if (minRating > 0) params.set('minRating', minRating.toString())
      if (sort === 'rating') params.set('sortBy', 'rating')
      if (sort === 'date') params.set('sortBy', 'createdAt')
      
      // Filtres projets
      if (budgetMin > 0) params.set('budgetMin', budgetMin.toString())
      if (budgetMax < 1000000) params.set('budgetMax', budgetMax.toString())
      if (budgetType !== 'all') params.set('budgetType', budgetType)
      if (category) params.set('category', category)
      
      params.set('page', page.toString())
      params.set('limit', '12')
      
      const response = await fetch(`/api/search?${params}`)
      const data: SearchResponse = await response.json()
      
      if (data.success) {
        setUsers(data.users || [])
        setProjects(data.projects || [])
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.pages)
        setFacets(data.facets)
      }
      
      // Mettre à jour l'URL
      const urlParams = new URLSearchParams()
      if (query) urlParams.set('q', query)
      if (activeTab !== 'all') urlParams.set('type', activeTab)
      if (location) urlParams.set('location', location)
      if (skillsFilter.length) urlParams.set('skills', skillsFilter.join(','))
      if (minRating > 0) urlParams.set('minRating', minRating.toString())
      if (sort !== 'relevance') urlParams.set('sort', sort)
      if (page > 1) urlParams.set('page', page.toString())
      if (budgetMin > 0) urlParams.set('budgetMin', budgetMin.toString())
      if (budgetMax < 1000000) urlParams.set('budgetMax', budgetMax.toString())
      if (budgetType !== 'all') urlParams.set('budgetType', budgetType)
      if (category) urlParams.set('category', category)
      
      router.replace(`${pathname}?${urlParams.toString()}`, { scroll: false })
      
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }, [query, activeTab, page, sort, location, skillsFilter, minRating, budgetMin, budgetMax, budgetType, category, router, pathname])
  
  useEffect(() => {
    fetchResults()
  }, [fetchResults])
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchResults()
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
  
  // Rendu des résultats selon l'onglet actif
  const renderResults = () => {
    if (activeTab === 'users') {
      if (users.length === 0) {
        return (
          <div className="text-center py-16">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Aucun freelance trouvé</h3>
            <p className="text-sm text-gray-500">Essayez avec d'autres mots-clés</p>
          </div>
        )
      }
      
      return (
        <div className={cn(
          viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"
        )}>
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
                onContact={(user) => {
                  console.log('Contact', user.name)
                }}
              />
            </motion.div>
          ))}
        </div>
      )
    }
    
    if (activeTab === 'projects') {
      if (projects.length === 0) {
        return (
          <div className="text-center py-16">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Aucun projet trouvé</h3>
            <p className="text-sm text-gray-500">Essayez avec d'autres mots-clés</p>
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
    
    // Onglet "Tout" - affiche les deux types
    const hasUsers = users.length > 0
    const hasProjects = projects.length > 0
    
    if (!hasUsers && !hasProjects) {
      return (
        <div className="text-center py-16">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Aucun résultat trouvé</h3>
          <p className="text-sm text-gray-500">Essayez avec d'autres mots-clés</p>
        </div>
      )
    }
    
    return (
      <div className="space-y-8">
        {hasUsers && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Freelances ({users.length})
              </h2>
              <button 
                onClick={() => setActiveTab('users')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Voir tout →
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
                Projets ({projects.length})
              </h2>
              <button 
                onClick={() => setActiveTab('projects')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Voir tout →
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
                  placeholder={t.placeholder || "Rechercher des freelances ou projets..."}
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
                <div className="w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Filtres</h3>
                    {hasFilters && (
                      <button onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-700">
                        Effacer tout
                      </button>
                    )}
                  </div>
                  
                  {/* Localisation */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Localisation
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Ville, pays..."
                        className="pl-9 text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Compétences */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Compétences
                    </label>
                    <Input
                      type="text"
                      value={skillsFilter.join(', ')}
                      onChange={(e) => setSkillsFilter(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      placeholder="React, Node.js, UI/UX..."
                      className="text-sm"
                    />
                    {facets?.skills && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {facets.skills.slice(0, 5).map((skill: any) => (
                          <button
                            key={skill.name}
                            onClick={() => setSkillsFilter([skill.name])}
                            className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 hover:bg-gray-200"
                          >
                            {skill.name} ({skill.count})
                          </button>
                        ))}
                      </div>
                    )}
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
                  
                  {/* Filtres projets (visible si onglet projets ou tout) */}
                  {(activeTab === 'projects' || activeTab === 'all') && (
                    <>
                      {/* Budget */}
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Budget
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={budgetMin}
                            onChange={(e) => setBudgetMin(parseInt(e.target.value) || 0)}
                            placeholder="Min"
                            className="text-sm"
                          />
                          <Input
                            type="number"
                            value={budgetMax === 1000000 ? '' : budgetMax}
                            onChange={(e) => setBudgetMax(parseInt(e.target.value) || 1000000)}
                            placeholder="Max"
                            className="text-sm"
                          />
                        </div>
                      </div>
                      
                      {/* Type de budget */}
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Type de budget
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
                                  : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Catégorie */}
                      {facets?.categories && facets.categories.length > 0 && (
                        <div className="mb-4">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                            Catégorie
                          </label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                          >
                            <option value="">Toutes les catégories</option>
                            {facets.categories.map((cat: any) => (
                              <option key={cat.name} value={cat.name}>
                                {cat.name} ({cat.count})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}
                  
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
            
            {/* Résultats count */}
            {!loading && total > 0 && (
              <div className="mb-4 text-sm text-gray-500">
                <span className="font-medium text-gray-900 dark:text-white">{total}</span> résultats
              </div>
            )}
            
            {/* Liste des résultats */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    activeTab === 'users' ? (
                      <UserCardSkeleton key={i} variant={viewMode === 'grid' ? 'minimal' : 'default'} />
                    ) : (
                      <ProjectCardSkeleton key={i} variant="default" />
                    )
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {renderResults()}
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