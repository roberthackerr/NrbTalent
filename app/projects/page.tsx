// app/projects/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Filter, Grid3X3, List } from 'lucide-react'
import { ProjectsGrid } from '@/components/home/projects-grid'

interface Project {
  _id: string
  title: string
  description: string
  budget: {
    min: number
    max: number
    type: string
    currency: string
  }
  category: string
  skills: string[]
  deadline: string
  location?: string
  applicationCount: number
  saveCount: number
  createdAt: string
  client?: {
    name: string
    avatar?: string
    rating?: number
  }
}

export default function ProjectsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 10000])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Get initial filter values from URL search params
  useEffect(() => {
    const query = searchParams.get('search') || ''
    const category = searchParams.get('category') || 'all'
    const skills = searchParams.get('skills')?.split(',') || []
    
    setSearchQuery(query)
    setSelectedCategory(category)
    setSelectedSkills(skills)
  }, [searchParams])

  // Fetch projects
  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true)
        const queryParams = new URLSearchParams()
        
        if (searchQuery) queryParams.append('search', searchQuery)
        if (selectedCategory !== 'all') queryParams.append('category', selectedCategory)
        if (selectedSkills.length > 0) queryParams.append('skills', selectedSkills.join(','))
        queryParams.append('budgetMin', budgetRange[0].toString())
        queryParams.append('budgetMax', budgetRange[1].toString())

        const response = await fetch(`/api/projects?${queryParams}`)
        if (!response.ok) throw new Error('Failed to fetch projects')
        
        const data = await response.json()
        setProjects(data.projects || [])
        setFilteredProjects(data.projects || [])
      } catch (error) {
        console.error('Error loading projects:', error)
        setProjects([])
        setFilteredProjects([])
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [searchQuery, selectedCategory, selectedSkills, budgetRange])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (searchQuery) params.set('search', searchQuery)
    if (selectedCategory !== 'all') params.set('category', selectedCategory)
    if (selectedSkills.length > 0) params.set('skills', selectedSkills.join(','))
    
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
  }, [searchQuery, selectedCategory, selectedSkills])

  // Available categories and skills (you might want to fetch these from your API)
  const categories = [
    'all',
    'Web Development',
    'Mobile Development',
    'Design',
    'Marketing',
    'Writing',
    'Admin Support',
    'IT & Networking'
  ]

  const popularSkills = [
    'React',
    'Node.js',
    'TypeScript',
    'UI/UX Design',
    'Python',
    'Next.js',
    'Tailwind CSS',
    'MongoDB'
  ]

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedSkills([])
    setBudgetRange([0, 10000])
  }

  const hasActiveFilters = selectedCategory !== 'all' || selectedSkills.length > 0 || searchQuery || budgetRange[0] > 0 || budgetRange[1] < 10000

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Trouvez Votre Projet Idéal
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Découvrez des opportunités passionnantes et lancez-vous sur de nouveaux défis
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtres
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-sky-600 hover:text-sky-700 font-medium"
                  >
                    Tout effacer
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Recherche
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un projet..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Catégorie
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'Toutes les catégories' : category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Skills Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Compétences
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {popularSkills.map(skill => (
                    <label key={skill} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(skill)}
                        onChange={() => handleSkillToggle(skill)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300">{skill}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Budget Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Budget: {budgetRange[0]}€ - {budgetRange[1]}€
                </label>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={budgetRange[0]}
                    onChange={(e) => setBudgetRange([Number(e.target.value), budgetRange[1]])}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={budgetRange[1]}
                    onChange={(e) => setBudgetRange([budgetRange[0], Number(e.target.value)])}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Results Count */}
              <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {loading ? (
                    'Chargement...'
                  ) : (
                    <>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {filteredProjects.length}
                      </span>{' '}
                      projet(s) trouvé(s)
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* View Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'grid'
                      ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'list'
                      ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Sort Options */}
              <select className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white text-sm">
                <option value="newest">Plus récent</option>
                <option value="budget-highest">Budget (Élevé)</option>
                <option value="budget-lowest">Budget (Faible)</option>
                <option value="deadline">Échéance proche</option>
              </select>
            </div>

            {/* Projects Grid */}
            <ProjectsGrid
              projects={filteredProjects}
              loading={loading}
              searchQuery={searchQuery}
              viewMode={viewMode}
            />

            {/* Empty State */}
            {!loading && filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <div className="text-slate-400 dark:text-slate-600 text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Aucun projet trouvé
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {hasActiveFilters
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Aucun projet disponible pour le moment'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700 transition-colors font-medium"
                  >
                    Voir tous les projets
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}