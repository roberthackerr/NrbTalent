// app/projects/page.tsx - Version Responsive et Multilingue
'use client'

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Search, Filter, Grid3X3, List, X, Check, ArrowUp, ArrowDown, Tag, Sparkles, TrendingUp, Clock, DollarSign, Users, Eye, ChevronDown, Layers, Zap } from 'lucide-react'
import { ProjectsGrid } from '@/components/home/projects-grid'
import { AdvancedPagination } from '@/components/ui/advanced-pagination'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { AIMatchingButton } from '@/components/ai-matching/AIMatchingButton'

interface Category {
  id: string
  name: string
  nameEn?: string
  nameFr?: string
  nameMg?: string
  icon?: string
  count?: number
}

interface Skill {
  skill: string
  count: number
  avgBudget: number
}

interface Project {
  _id: string
  title: string
  description: string
  category: string
  budget: {
    min: number
    max: number
    type: string
    currency: string
  }
  skills: string[]
  deadline: string
  applicationCount: number
  views: number
  createdAt: string
  client?: {
    name: string
    avatar?: string
    rating?: number
  }
}

// Dictionnaire des traductions
const translations = {
  fr: {
    title: 'Trouvez Votre Projet Idéal',
    subtitle: 'Découvrez {count} opportunités',
    searchPlaceholder: 'Rechercher des projets...',
    apply: 'Appliquer',
    clear: 'Effacer',
    categories: 'Catégories',
    skills: 'Compétences',
    budget: 'Budget',
    sortBy: 'Trier par',
    allCategories: 'Toutes les catégories',
    allBudgets: 'Tous les budgets',
    fixed: 'Forfait',
    hourly: 'Horaire',
    newest: 'Plus récent',
    deadline: 'Date limite',
    budgetLabel: 'Budget',
    applications: 'Candidatures',
    views: 'Vues',
    order: 'Ordre',
    ascending: 'Croissant',
    descending: 'Décroissant',
    activeFilters: 'Filtres actifs:',
    projects: 'projet(s)',
    noProjects: 'Aucun projet trouvé',
    modifyFilters: 'Essayez de modifier vos critères de recherche',
    noProjectsAvailable: 'Aucun projet disponible pour le moment',
    resetFilters: 'Réinitialiser les filtres',
    loading: 'Chargement...',
    loadingProjects: 'Chargement des projets...',
    searchSkill: 'Rechercher une compétence...',
    noSkillFound: 'Aucune compétence trouvée',
    popular: 'Populaires:',
    view: 'Voir',
    grid: 'Grille',
    list: 'Liste'
  },
  en: {
    title: 'Find Your Ideal Project',
    subtitle: 'Discover {count} opportunities',
    searchPlaceholder: 'Search projects...',
    apply: 'Apply',
    clear: 'Clear',
    categories: 'Categories',
    skills: 'Skills',
    budget: 'Budget',
    sortBy: 'Sort by',
    allCategories: 'All categories',
    allBudgets: 'All budgets',
    fixed: 'Fixed price',
    hourly: 'Hourly',
    newest: 'Newest',
    deadline: 'Deadline',
    budgetLabel: 'Budget',
    applications: 'Applications',
    views: 'Views',
    order: 'Order',
    ascending: 'Ascending',
    descending: 'Descending',
    activeFilters: 'Active filters:',
    projects: 'project(s)',
    noProjects: 'No projects found',
    modifyFilters: 'Try modifying your search criteria',
    noProjectsAvailable: 'No projects available at the moment',
    resetFilters: 'Reset filters',
    loading: 'Loading...',
    loadingProjects: 'Loading projects...',
    searchSkill: 'Search skills...',
    noSkillFound: 'No skills found',
    popular: 'Popular:',
    view: 'View',
    grid: 'Grid',
    list: 'List'
  },
  mg: {
    title: 'Hitadia Ny Tetikasa Mety Amindrao',
    subtitle: 'Hitadia {count} tetikasa',
    searchPlaceholder: 'Hikaroka tetikasa...',
    apply: 'Ampiharo',
    clear: 'Fafao',
    categories: 'Sokajy',
    skills: 'Fahaizana',
    budget: 'Tetibola',
    sortBy: 'Karohina araka',
    allCategories: 'Sokajy rehetra',
    allBudgets: 'Tetibola rehetra',
    fixed: 'Vidiny raikitra',
    hourly: 'Isan\'ora',
    newest: 'Vao indrindra',
    deadline: 'Fe-potoana',
    budgetLabel: 'Tetibola',
    applications: 'Fangatahana',
    views: 'Fijerena',
    order: 'Filaminana',
    ascending: 'Miakatra',
    descending: 'Midina',
    activeFilters: 'Sivana miasa:',
    projects: 'tetikasa',
    noProjects: 'Tsy misy tetikasa hita',
    modifyFilters: 'Andramo hanova ny fikarohanao',
    noProjectsAvailable: 'Tsy misy tetikasa amin\'izao fotoana izao',
    resetFilters: 'Avereno ny sivana',
    loading: 'Amplasiana...',
    loadingProjects: 'Amplasiana tetikasa...',
    searchSkill: 'Hikaroka fahaizana...',
    noSkillFound: 'Tsy misy fahaizana hita',
    popular: 'Malaza:',
    view: 'Jereo',
    grid: 'Takelaka',
    list: 'Lisitra'
  }
}

// Composant Dropdown responsive
function FilterDropdown({
  label,
  icon: Icon,
  children,
  isOpen,
  onToggle,
  badgeCount,
  className
}: {
  label: string
  icon?: React.ElementType
  children: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  badgeCount?: number
  className?: string
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg border transition-all hover:bg-slate-50 dark:hover:bg-slate-800",
          "text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600",
          "text-xs sm:text-sm",
          isOpen && "bg-slate-100 dark:bg-slate-800 border-sky-500 dark:border-sky-500",
          className
        )}
      >
        {Icon && <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        <span className="font-medium hidden xs:inline">{label}</span>
        <span className="font-medium xs:hidden">{label.slice(0, 3)}</span>
        {badgeCount !== undefined && badgeCount > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] sm:text-xs bg-sky-500 text-white rounded-full">
            {badgeCount}
          </span>
        )}
        <ChevronDown className={cn(
          "w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 transition-transform",
          isOpen && "transform rotate-180"
        )} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50 p-3 sm:p-4 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  )
}

function ProjectsPageContent({ lang = 'fr' }: { lang?: 'fr' | 'en' | 'mg' }) {
  const t = translations[lang]
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  // États
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  
  // Filtres
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [budgetType, setBudgetType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // UI
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [skillSearch, setSkillSearch] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  
  // Dropdowns
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  
  // Pagination
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(12)
  const [totalProjects, setTotalProjects] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  // Données
  const [categories, setCategories] = useState<Category[]>([
    { id: 'all', name: t.allCategories, icon: '📁', count: 0 }
  ])
  const [popularSkills, setPopularSkills] = useState<Skill[]>([])
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([])

  // Détecter mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Toggle dropdown
  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown)
  }

  // Charger les compétences
  useEffect(() => {
    const loadSkills = async () => {
      try {
        const response = await fetch('/api/projects/categories')
        if (response.ok) {
          const data = await response.json()
          
          if (data.popularSkills && Array.isArray(data.popularSkills)) {
            const formattedSkills = data.popularSkills.map((skill: any) => ({
              skill: skill.skill || skill._id || skill.name,
              count: skill.count || 0,
              avgBudget: skill.avgBudget || 0
            }))
            
            const sortedSkills = formattedSkills.sort((a: Skill, b: Skill) => b.count - a.count)
            setPopularSkills(sortedSkills)
            setFilteredSkills(sortedSkills)
          }
        }
      } catch (error) {
        console.error('Erreur chargement compétences:', error)
        // Fallback
        setPopularSkills([
          { skill: 'React', count: 2450, avgBudget: 8500 },
          { skill: 'Node.js', count: 1980, avgBudget: 8900 },
          { skill: 'TypeScript', count: 2150, avgBudget: 8800 },
          { skill: 'Python', count: 2230, avgBudget: 9100 },
          { skill: 'Next.js', count: 1870, avgBudget: 9200 },
        ])
        setFilteredSkills([
          { skill: 'React', count: 2450, avgBudget: 8500 },
          { skill: 'Node.js', count: 1980, avgBudget: 8900 },
          { skill: 'TypeScript', count: 2150, avgBudget: 8800 },
          { skill: 'Python', count: 2230, avgBudget: 9100 },
          { skill: 'Next.js', count: 1870, avgBudget: 9200 },
        ])
      }
    }
    
    loadSkills()
  }, [])

  // Charger les catégories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/projects/types?type=categories')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            const formattedCategories = data.data.map((cat: any) => ({
              id: cat.id || cat.name?.toLowerCase().replace(/\s+/g, '-'),
              name: cat.name,
              icon: cat.icon || '📁',
              count: 0
            }))
            
            setCategories([
              { id: 'all', name: t.allCategories, icon: '📁', count: totalProjects },
              ...formattedCategories.slice(0, 10)
            ])
          }
        }
      } catch (error) {
        console.error('Erreur chargement catégories:', error)
        setCategories([
          { id: 'all', name: t.allCategories, icon: '📁', count: totalProjects },
          { id: 'web-development', name: 'Web Development', icon: '💻', count: 0 },
          { id: 'mobile-development', name: 'Mobile Development', icon: '📱', count: 0 },
          { id: 'design', name: 'Design', icon: '🎨', count: 0 },
          { id: 'marketing', name: 'Marketing', icon: '📢', count: 0 },
        ])
      }
    }
    
    loadCategories()
  }, [totalProjects, t.allCategories])

  // Filtrer les compétences
  useEffect(() => {
    if (skillSearch.trim() === '') {
      setFilteredSkills(popularSkills)
    } else {
      const filtered = popularSkills.filter(skill =>
        skill.skill.toLowerCase().includes(skillSearch.toLowerCase())
      )
      setFilteredSkills(filtered)
    }
  }, [skillSearch, popularSkills])

  // Initialiser depuis l'URL
  useEffect(() => {
    const query = searchParams.get('search') || ''
    const category = searchParams.get('category') || 'all'
    const skillsParam = searchParams.get('skills')
    const skills = skillsParam ? skillsParam.split(',').filter(s => s) : []
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const sort = searchParams.get('sortBy') || 'createdAt'
    const order = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    
    setSearchQuery(query)
    setSelectedCategory(category)
    setSelectedSkills(skills)
    setPage(pageParam ? Math.max(1, parseInt(pageParam)) : 1)
    setLimit(limitParam ? parseInt(limitParam) : 12)
    setSortBy(sort)
    setSortOrder(order)
    
    loadProjects(1, sort, order)
  }, [searchParams])

  // Charger les projets
  const loadProjects = useCallback(async (
    pageNum: number = page, 
    customSort?: string, 
    customOrder?: 'asc' | 'desc'
  ) => {
    try {
      setLoading(true)
      
      const queryParams = new URLSearchParams()
      
      if (searchQuery.trim()) {
        queryParams.append('search', searchQuery.trim())
      }
      
      if (selectedCategory !== 'all') {
        queryParams.append('category', selectedCategory)
      }
      
      if (selectedSkills.length > 0) {
        queryParams.append('skills', selectedSkills.join(','))
      }
      
      if (budgetType !== 'all') {
        queryParams.append('type', budgetType)
      }
      
      queryParams.append('page', pageNum.toString())
      queryParams.append('limit', limit.toString())
      
      const activeSortBy = customSort || sortBy
      const activeSortOrder = customOrder || sortOrder
      queryParams.append('sortBy', activeSortBy)
      queryParams.append('sortOrder', activeSortOrder)

      const response = await fetch(`/api/projects?${queryParams}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Échec du chargement')
      }
      
      setProjects(data.data.projects || [])
      setTotalProjects(data.data.pagination.total || 0)
      setTotalPages(data.data.pagination.totalPages || 1)
      
      setCategories(prev => prev.map(cat => 
        cat.id === 'all' ? { ...cat, count: data.data.pagination.total } : cat
      ))
      
    } catch (error) {
      console.error('❌ Erreur:', error)
      toast.error(t.loading)
      setProjects([])
      setTotalProjects(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [searchQuery, selectedCategory, selectedSkills, budgetType, page, limit, sortBy, sortOrder, t])

  // Handlers
  const handleCategoryChange = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId)
    setPage(1)
    setOpenDropdown(null)
    
    const params = new URLSearchParams(searchParams.toString())
    if (categoryId === 'all') {
      params.delete('category')
    } else {
      params.set('category', categoryId)
    }
    params.set('page', '1')
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    loadProjects(1, sortBy, sortOrder)
  }, [searchParams, pathname, router, sortBy, sortOrder, loadProjects])

  const handleSkillToggle = useCallback((skill: string) => {
    setSelectedSkills(prev => {
      const newSkills = prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
      
      if (JSON.stringify(newSkills) !== JSON.stringify(prev)) {
        setPage(1)
      }
      
      return newSkills
    })
  }, [])

  const handleBudgetTypeChange = useCallback((type: string) => {
    setBudgetType(type)
    setPage(1)
    setOpenDropdown(null)
    
    const params = new URLSearchParams(searchParams.toString())
    if (type === 'all') {
      params.delete('type')
    } else {
      params.set('type', type)
    }
    params.set('page', '1')
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    loadProjects(1, sortBy, sortOrder)
  }, [searchParams, pathname, router, sortBy, sortOrder, loadProjects])

  const applyFilters = useCallback(() => {
    setPage(1)
    setOpenDropdown(null)
    
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('search', searchQuery.trim())
    if (selectedCategory !== 'all') params.set('category', selectedCategory)
    if (selectedSkills.length > 0) params.set('skills', selectedSkills.join(','))
    if (budgetType !== 'all') params.set('type', budgetType)
    params.set('page', '1')
    if (limit !== 12) params.set('limit', limit.toString())
    params.set('sortBy', sortBy)
    params.set('sortOrder', sortOrder)
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    loadProjects(1, sortBy, sortOrder)
    toast.success(t.apply)
  }, [searchQuery, selectedCategory, selectedSkills, budgetType, limit, sortBy, sortOrder, pathname, router, loadProjects, t])

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedSkills([])
    setBudgetType('all')
    setPage(1)
    setLimit(12)
    setSkillSearch('')
    setOpenDropdown(null)
    
    router.replace(pathname, { scroll: false })
    loadProjects(1, 'createdAt', 'desc')
    toast.success(t.clear)
  }, [pathname, router, loadProjects, t])

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage)
      
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (selectedCategory !== 'all') params.set('category', selectedCategory)
      if (selectedSkills.length > 0) params.set('skills', selectedSkills.join(','))
      if (budgetType !== 'all') params.set('type', budgetType)
      params.set('page', newPage.toString())
      if (limit !== 12) params.set('limit', limit.toString())
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)
      
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      loadProjects(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [searchQuery, selectedCategory, selectedSkills, budgetType, limit, sortBy, sortOrder, totalPages, page, pathname, router, loadProjects])

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
    
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('search', searchQuery.trim())
    if (selectedCategory !== 'all') params.set('category', selectedCategory)
    if (selectedSkills.length > 0) params.set('skills', selectedSkills.join(','))
    if (budgetType !== 'all') params.set('type', budgetType)
    params.set('page', '1')
    params.set('limit', newLimit.toString())
    params.set('sortBy', sortBy)
    params.set('sortOrder', sortOrder)
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    loadProjects(1)
  }, [searchQuery, selectedCategory, selectedSkills, budgetType, sortBy, sortOrder, pathname, router, loadProjects])

  const hasActiveFilters = useMemo(() => {
    return selectedCategory !== 'all' || 
      selectedSkills.length > 0 || 
      searchQuery.trim() !== '' || 
      budgetType !== 'all'
  }, [selectedCategory, selectedSkills, searchQuery, budgetType])

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">{t.loadingProjects}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-4">
              {t.title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {t.subtitle.replace('{count}', totalProjects.toLocaleString())}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Barre de filtres */}
        <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Barre supérieure */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
            {/* Barre de recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-800 dark:text-white placeholder-slate-400"
                />
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center gap-2">
              <Button
                onClick={applyFilters}
                className="bg-sky-600 hover:bg-sky-700 text-white px-3 sm:px-4 py-2 text-sm sm:text-base"
                disabled={loading}
              >
                {loading ? t.loading : t.apply}
              </Button>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-slate-300 dark:border-slate-600 px-3 sm:px-4 py-2 text-sm sm:text-base"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">{t.clear}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Filtres en dropdown */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <FilterDropdown
              label={t.categories}
              icon={Layers}
              isOpen={openDropdown === 'categories'}
              onToggle={() => toggleDropdown('categories')}
              badgeCount={selectedCategory !== 'all' ? 1 : 0}
            >
              <div className="space-y-1 sm:space-y-2 max-h-80 overflow-y-auto">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={cn(
                      "w-full text-left px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg flex items-center justify-between transition-colors text-sm",
                      selectedCategory === category.id
                        ? "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-base sm:text-lg">{category.icon}</span>
                      <span className="font-medium text-xs sm:text-sm">{category.name}</span>
                    </div>
                    {selectedCategory === category.id && (
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 dark:text-sky-400" />
                    )}
                  </button>
                ))}
              </div>
            </FilterDropdown>

            <FilterDropdown
              label={t.skills}
              icon={Tag}
              isOpen={openDropdown === 'skills'}
              onToggle={() => toggleDropdown('skills')}
              badgeCount={selectedSkills.length}
            >
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                  <input
                    type="text"
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    placeholder={t.searchSkill}
                    className="w-full pl-9 sm:pl-10 pr-3 py-1.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs sm:text-sm bg-white dark:bg-slate-700"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                  {filteredSkills.length === 0 ? (
                    <div className="text-center py-3 sm:py-4 text-slate-500 text-xs sm:text-sm">
                      {t.noSkillFound}
                    </div>
                  ) : (
                    filteredSkills.slice(0, isMobile ? 15 : 20).map(skillItem => (
                      <button
                        key={skillItem.skill}
                        onClick={() => handleSkillToggle(skillItem.skill)}
                        className={cn(
                          "w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center justify-between transition-colors text-xs sm:text-sm",
                          selectedSkills.includes(skillItem.skill)
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                            : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full",
                            selectedSkills.includes(skillItem.skill)
                              ? "bg-emerald-500"
                              : "bg-slate-300"
                          )} />
                          <span>{skillItem.skill}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {skillItem.count > 0 && (
                            <span className="text-[10px] sm:text-xs text-slate-500">
                              {skillItem.count}
                            </span>
                          )}
                          {selectedSkills.includes(skillItem.skill) && (
                            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {skillSearch.trim() === '' && popularSkills.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] sm:text-xs text-slate-500 mb-1.5 sm:mb-2">{t.popular}</p>
                    <div className="flex flex-wrap gap-1">
                      {popularSkills.slice(0, isMobile ? 3 : 5).map(skillItem => (
                        <button
                          key={skillItem.skill}
                          onClick={() => handleSkillToggle(skillItem.skill)}
                          className={cn(
                            "px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded border transition-colors",
                            selectedSkills.includes(skillItem.skill)
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-slate-300 hover:border-emerald-500 text-slate-600"
                          )}
                        >
                          {skillItem.skill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </FilterDropdown>

            <FilterDropdown
              label={t.budget}
              icon={DollarSign}
              isOpen={openDropdown === 'budget'}
              onToggle={() => toggleDropdown('budget')}
              badgeCount={budgetType !== 'all' ? 1 : 0}
            >
              <div className="space-y-1 sm:space-y-2">
                {[
                  { id: 'all', label: t.allBudgets },
                  { id: 'fixed', label: t.fixed },
                  { id: 'hourly', label: t.hourly }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => handleBudgetTypeChange(type.id)}
                    className={cn(
                      "w-full text-left px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg flex items-center justify-between transition-colors text-sm",
                      budgetType === type.id
                        ? "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <span className="font-medium">{type.label}</span>
                    {budgetType === type.id && (
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 dark:text-sky-400" />
                    )}
                  </button>
                ))}
              </div>
            </FilterDropdown>

            <FilterDropdown
              label={t.sortBy}
              icon={ArrowUp}
              isOpen={openDropdown === 'sort'}
              onToggle={() => toggleDropdown('sort')}
            >
              <div className="space-y-1 sm:space-y-2">
                {[
                  { value: 'createdAt', label: t.newest },
                  { value: 'deadline', label: t.deadline },
                  { value: 'budget', label: t.budgetLabel },
                  { value: 'applicationCount', label: t.applications },
                  { value: 'views', label: t.views }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value)
                      setPage(1)
                      setOpenDropdown(null)
                      
                      const params = new URLSearchParams(searchParams.toString())
                      params.set('sortBy', option.value)
                      params.set('page', '1')
                      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
                      loadProjects(1, option.value, sortOrder)
                    }}
                    className={cn(
                      "w-full text-left px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg flex items-center justify-between transition-colors text-sm",
                      sortBy === option.value
                        ? "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <span className="font-medium">{option.label}</span>
                    {sortBy === option.value && (
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 dark:text-sky-400" />
                    )}
                  </button>
                ))}
                
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => {
                      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
                      setSortOrder(newOrder)
                      setPage(1)
                      
                      const params = new URLSearchParams(searchParams.toString())
                      params.set('sortOrder', newOrder)
                      params.set('page', '1')
                      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
                      loadProjects(1, sortBy, newOrder)
                    }}
                    className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg flex items-center justify-between"
                  >
                    <span>{t.order}: {sortOrder === 'asc' ? t.ascending : t.descending}</span>
                    {sortOrder === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </button>
                </div>
              </div>
            </FilterDropdown>
          </div>

          {/* Filtres actifs */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{t.activeFilters}</span>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {selectedCategory !== 'all' && (
                  <Badge variant="secondary" className="gap-1 text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 sm:py-1">
                    {categories.find(c => c.id === selectedCategory)?.name}
                    <button onClick={() => handleCategoryChange('all')}>
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  </Badge>
                )}
                {selectedSkills.map(skill => (
                  <Badge key={skill} variant="secondary" className="gap-1 text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 sm:py-1">
                    {skill}
                    <button onClick={() => handleSkillToggle(skill)}>
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  </Badge>
                ))}
                {budgetType !== 'all' && (
                  <Badge variant="secondary" className="gap-1 text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 sm:py-1">
                    {budgetType === 'fixed' ? t.fixed : t.hourly}
                    <button onClick={() => handleBudgetTypeChange('all')}>
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  </Badge>
                )}
                {searchQuery.trim() && (
                  <Badge variant="secondary" className="gap-1 text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 sm:py-1">
                    "{searchQuery.slice(0, 20)}{searchQuery.length > 20 ? '...' : ''}"
                    <button onClick={() => setSearchQuery('')}>
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vue et compteur */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 sm:p-2 rounded-lg",
                viewMode === 'grid'
                  ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              )}
              title={t.grid}
            >
              <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 sm:p-2 rounded-lg",
                viewMode === 'list'
                  ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              )}
              title={t.list}
            >
              <List className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 ml-1 sm:ml-2">
              {totalProjects.toLocaleString()} {t.projects}
            </span>
          </div>
        </div>

        {/* Projets */}
        <ProjectsGrid
          projects={projects}
          loading={loading}
          searchQuery={searchQuery}
          viewMode={viewMode}
          onRefresh={() => loadProjects()}
          lang={lang}
        />

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 sm:mt-8">
            <AdvancedPagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalProjects}
              itemsPerPage={limit}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleLimitChange}
              loading={loading}
              showItemsPerPage={!isMobile}
              showInfo={!isMobile}
              variant={isMobile ? "compact" : "full"}
              maxVisiblePages={isMobile ? 3 : 7}
            />
          </div>
        )}

        {/* Aucun résultat */}
        {!loading && projects.length === 0 && (
          <div className="text-center py-12 sm:py-16">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Search className="h-8 w-8 sm:h-12 sm:w-12 text-slate-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
              {t.noProjects}
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
              {hasActiveFilters ? t.modifyFilters : t.noProjectsAvailable}
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} size={isMobile ? "sm" : "default"}>
                {t.resetFilters}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProjectsPage({ params }: { params?: { lang?: string } }) {
  const lang = (params?.lang as 'fr' | 'en' | 'mg') || 'fr'
  
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            {translations[lang]?.loading || 'Loading...'}
          </p>
        </div>
      </div>
    }>
      <ProjectsPageContent lang={lang} />
    </Suspense>
  )
}