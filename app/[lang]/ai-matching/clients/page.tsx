// app/ai-matching/clients/page.tsx
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Building, 
  Search, 
  Filter, 
  Users, 
  Sparkles, 
  Zap, 
  Target, 
  Star, 
  Clock, 
  Rocket, 
  Eye,
  Download,
  FileText,
  X,
  DollarSign,
  Tag,
  Calendar,
  Award,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react"
import { AIMatchingWidget } from "@/components/ai/AIMatchingWidget"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Project {
  _id: string
  title: string
  status: 'draft' | 'open' | 'in-progress' | 'completed' | 'cancelled'
  category: string
  budget: {
    min: number
    max: number
    type: 'fixed' | 'hourly'
    currency: string
  }
  skills: string[]
  createdAt: string
  description?: string
  clientId: string
}

interface PaginationData {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface FiltersData {
  categories: string[]
  skills: string[]
  budgetStats: {
    min: number
    max: number
  }
}

interface FilterState {
  search: string
  status: string
  category: string
  budgetType: string
  skill: string
  sortBy: string
  sortOrder: string
  budgetMin: number
  budgetMax: number
}

export default function ClientAIMatchingPage() {
  const { data: session } = useSession()
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [userProjects, setUserProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // États de pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12,
    hasNextPage: false,
    hasPrevPage: false
  })
  
  // États de filtres
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    category: 'all',
    budgetType: 'all',
    skill: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    budgetMin: 0,
    budgetMax: 100000
  })
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  
  // Données des filtres disponibles
  const [filtersData, setFiltersData] = useState<FiltersData>({
    categories: [],
    skills: [],
    budgetStats: { min: 0, max: 100000 }
  })

  const searchTimeoutRef = useRef<NodeJS.Timeout>(null)

  // Fonction de chargement des projets
  const fetchUserProjects = useCallback(async () => {
    if (!session?.user?.id) {
      setError("Utilisateur non connecté")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.category && filters.category !== 'all' && { category: filters.category }),
        ...(filters.budgetType && filters.budgetType !== 'all' && { budgetType: filters.budgetType }),
        ...(filters.skill && filters.skill !== 'all' && { skill: filters.skill }),
        budgetMin: filters.budgetMin.toString(),
        budgetMax: filters.budgetMax.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      })

      console.log(`🔄 Chargement page ${currentPage} avec ${itemsPerPage} projets...`)
      
      const response = await fetch(`/api/projects/client?${queryParams}`)
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (response.ok) {
        console.log(`✅ ${data.projects?.length || 0} projets chargés`)
        console.log(`📊 Pagination: ${data.pagination?.totalItems || 0} projets totaux, ${data.pagination?.totalPages || 1} pages`)
        
        setUserProjects(data.projects || [])
        
        // Mettre à jour les données de filtres
        if (data.filters) {
          setFiltersData({
            categories: data.filters.categories || [],
            skills: data.filters.skills || [],
            budgetStats: {
              min: data.filters.budgetStats?.min?.[0]?.budget?.min || 0,
              max: data.filters.budgetStats?.max?.[0]?.budget?.min || 100000
            }
          })
          
          // Ajuster les filtres de budget si nécessaire
          if (filters.budgetMin === 0 && filters.budgetMax === 100000) {
            setFilters(prev => ({
              ...prev,
              budgetMin: data.filters.budgetStats?.min?.[0]?.budget?.min || 0,
              budgetMax: data.filters.budgetStats?.max?.[0]?.budget?.min || 100000
            }))
          }
        }
        
        // Mettre à jour la pagination
        if (data.pagination) {
          setPagination({
            currentPage: data.pagination.currentPage || currentPage,
            totalPages: data.pagination.totalPages || 1,
            totalItems: data.pagination.totalItems || 0,
            itemsPerPage: data.pagination.itemsPerPage || itemsPerPage,
            hasNextPage: data.pagination.hasNextPage || false,
            hasPrevPage: data.pagination.hasPrevPage || false
          })
        } else {
          // Fallback si l'API ne renvoie pas de pagination
          setPagination(prev => ({
            ...prev,
            totalItems: data.projects?.length || 0,
            totalPages: Math.ceil((data.projects?.length || 0) / itemsPerPage)
          }))
        }

        // Sélection automatique du premier projet
        if (data.projects?.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data.projects[0]._id)
        } else if (data.projects?.length === 0) {
          setSelectedProjectId("")
        }
      } else {
        throw new Error(data.error || "Erreur inconnue")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur de chargement"
      setError(errorMessage)
      console.error("❌ Erreur chargement projets:", err)
    } finally {
      setLoading(false)
    }
  }, [session, currentPage, itemsPerPage, filters, selectedProjectId])

  // Charger au montage et quand les dépendances changent
  useEffect(() => {
    fetchUserProjects()
  }, [fetchUserProjects])

  // Mettre à jour les filtres actifs
  useEffect(() => {
    const newActiveFilters: string[] = []
    
    if (filters.search) newActiveFilters.push(`Recherche: "${filters.search}"`)
    if (filters.status !== 'all') newActiveFilters.push(`Statut: ${filters.status}`)
    if (filters.category !== 'all') newActiveFilters.push(`Catégorie: ${filters.category}`)
    if (filters.budgetType !== 'all') newActiveFilters.push(`Type: ${filters.budgetType}`)
    if (filters.skill !== 'all') newActiveFilters.push(`Compétence: ${filters.skill}`)
    if (filters.budgetMin > 0 || filters.budgetMax < 100000) {
      newActiveFilters.push(`Budget: $${filters.budgetMin} - $${filters.budgetMax}`)
    }
    
    setActiveFilters(newActiveFilters)
  }, [filters])

  // Gestion des changements de filtres avec debounce pour la recherche
  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Si c'est la recherche, on attend 500ms avant de recharger
    if (key === 'search') {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      searchTimeoutRef.current = setTimeout(() => {
        setCurrentPage(1)
        fetchUserProjects()
      }, 500)
    } else {
      setCurrentPage(1)
      // Pour les autres filtres, on recharge immédiatement
      setTimeout(() => fetchUserProjects(), 100)
    }
  }

  const removeFilter = (filterToRemove: string) => {
    const filterKey = filterToRemove.split(':')[0].trim().toLowerCase()
    let newFilters = { ...filters }
    
    switch(filterKey) {
      case 'recherche':
        newFilters.search = ''
        break
      case 'statut':
        newFilters.status = 'all'
        break
      case 'catégorie':
        newFilters.category = 'all'
        break
      case 'type':
        newFilters.budgetType = 'all'
        break
      case 'compétence':
        newFilters.skill = 'all'
        break
      case 'budget':
        newFilters.budgetMin = 0
        newFilters.budgetMax = 100000
        break
    }
    
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const resetFilters = () => {
    const defaultFilters: FilterState = {
      search: '',
      status: 'all',
      category: 'all',
      budgetType: 'all',
      skill: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      budgetMin: 0,
      budgetMax: 100000
    }
    
    setFilters(defaultFilters)
    setCurrentPage(1)
    setShowAdvancedFilters(false)
  }

  // Gestion de la pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit)
    setCurrentPage(1)
  }

  // Export des données
  const handleExportProjects = () => {
    if (userProjects.length === 0) return
    
    const exportData = userProjects.map(project => ({
      Titre: project.title,
      Statut: project.status,
      Catégorie: project.category,
      'Budget Min': `$${project.budget.min}`,
      'Budget Max': `$${project.budget.max}`,
      'Type Budget': project.budget.type === 'hourly' ? 'Horaire' : 'Forfait',
      Compétences: project.skills.join(', '),
      'Date Création': new Date(project.createdAt).toLocaleDateString('fr-FR')
    }))

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `projets-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const selectedProject = userProjects.find(project => project._id === selectedProjectId)

  // 🔥 Vérification du rôle freelancer
  if (session?.user?.role === "freelance" || session?.user?.role === "freelancer") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-orange-200">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-10 w-10 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-3">Espace Réservé aux Clients</div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              En tant que freelancer, vous ne pouvez pas accéder à cette page. 
              Utilisez l'espace freelancers pour découvrir des projets qui correspondent à vos compétences.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <a href="/ai-matching/freelancers">
                  <Sparkles className="mr-2 h-4 w-4" />
                  🚀 Découvrir des Projets
                </a>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <a href="/dashboard/freelancer">
                  <Target className="mr-2 h-4 w-4" />
                  📊 Mon Tableau de Bord
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">Accès Requis</div>
            <p className="text-gray-600 mb-4">Veuillez vous connecter pour accéder à l'AI Matching</p>
            <Button>Se connecter</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Composant de pagination personnalisé
  const CustomPagination = () => {
    const getPageNumbers = () => {
      const pages: (number | string)[] = []
      const maxVisible = 5
      
      if (pagination.totalPages <= maxVisible) {
        for (let i = 1; i <= pagination.totalPages; i++) pages.push(i)
      } else {
        const leftSibling = Math.max(currentPage - 1, 2)
        const rightSibling = Math.min(currentPage + 1, pagination.totalPages - 1)
        const showLeftDots = leftSibling > 2
        const showRightDots = rightSibling < pagination.totalPages - 1
        
        pages.push(1)
        if (showLeftDots) pages.push("...")
        for (let i = leftSibling; i <= rightSibling; i++) {
          if (i !== 1 && i !== pagination.totalPages) pages.push(i)
        }
        if (showRightDots) pages.push("...")
        if (pagination.totalPages !== 1) pages.push(pagination.totalPages)
      }
      
      return pages
    }

    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, pagination.totalItems)
    const pageNumbers = getPageNumbers()

    if (pagination.totalPages <= 1) return null

    return (
      <div className="space-y-4">
        {/* Informations */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="text-gray-600">
            Affichage de <span className="font-semibold text-gray-900">{startItem.toLocaleString()}</span>
            {' '}-{' '}<span className="font-semibold text-gray-900">{endItem.toLocaleString()}</span>
            {' '}sur{' '}<span className="font-semibold text-gray-900">{pagination.totalItems.toLocaleString()}</span>
            {' '}projets
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Par page:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => handleItemsPerPageChange(parseInt(value))}
              disabled={loading}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[6, 12, 24, 48, 96].map(option => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Contrôles de pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          {/* Boutons de navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1 || loading}
              className="hidden sm:flex gap-1"
              title="Première page"
            >
              <ChevronLeft className="h-4 w-4" />
              <ChevronLeft className="h-4 w-4 -ml-2" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="gap-1"
              title="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Précédent</span>
            </Button>
          </div>

          {/* Numéros de page */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((pageNum, index) => {
              if (pageNum === "...") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-3 py-2 text-gray-400"
                  >
                    ...
                  </span>
                )
              }

              const page = pageNum as number
              const isActive = page === currentPage

              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  disabled={loading}
                  className={`
                    min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-all duration-200
                    hover:scale-105 active:scale-95
                    ${isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "border border-gray-300 hover:border-blue-600 hover:bg-blue-50 text-gray-700"
                    }
                    ${loading && "opacity-50 cursor-not-allowed"}
                  `}
                >
                  {page}
                </button>
              )
            })}
          </div>

          {/* Boutons de navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages || loading}
              className="gap-1"
              title="Page suivante"
            >
              <span className="hidden sm:inline">Suivant</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={currentPage === pagination.totalPages || loading}
              className="hidden sm:flex gap-1"
              title="Dernière page"
            >
              <ChevronRight className="h-4 w-4" />
              <ChevronRight className="h-4 w-4 -ml-2" />
            </Button>
          </div>
        </div>

        {/* Saut de page rapide */}
        {pagination.totalPages > 10 && (
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              Aller à la page:
            </span>
            <input
              type="number"
              min={1}
              max={pagination.totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value)
                if (page >= 1 && page <= pagination.totalPages) {
                  handlePageChange(page)
                }
              }}
              disabled={loading}
              className="w-20 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Hero avec stats */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full mb-6 shadow-lg">
              <Rocket className="h-5 w-5" />
              <span className="text-sm font-semibold">AI Matching Enterprise</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              Trouvez Votre Super Freelancer
            </h1>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-md p-4 min-w-[200px]">
                <div className="text-2xl font-bold text-blue-600">{pagination.totalItems}</div>
                <div className="text-sm text-gray-600">Projets totaux</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 min-w-[200px]">
                <div className="text-2xl font-bold text-green-600">
                  {userProjects.filter(p => p.status === 'open').length}
                </div>
                <div className="text-sm text-gray-600">Projets ouverts</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 min-w-[200px]">
                <div className="text-2xl font-bold text-purple-600">
                  {filtersData.categories.length}
                </div>
                <div className="text-sm text-gray-600">Catégories</div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="mb-8 space-y-4">
            {/* Barre de recherche et tri */}
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Rechercher un projet par titre, description, compétences..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => handleFilterChange('sortBy', value)}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Plus récent
                        </div>
                      </SelectItem>
                      <SelectItem value="title">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Nom A-Z
                        </div>
                      </SelectItem>
                      <SelectItem value="budget.min">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Budget croissant
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant={showAdvancedFilters ? "default" : "outline"}
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    disabled={loading}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {showAdvancedFilters ? 'Masquer' : 'Filtres'} 
                    {activeFilters.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeFilters.length}
                      </Badge>
                    )}
                  </Button>
                </div>

                {/* Filtres actifs */}
                {activeFilters.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500 mb-2">Filtres actifs:</div>
                    <div className="flex flex-wrap gap-2">
                      {activeFilters.map((filter, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover:bg-gray-200 flex items-center gap-1"
                          onClick={() => removeFilter(filter)}
                        >
                          {filter}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        Tout effacer
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Filtres avancés */}
            {showAdvancedFilters && (
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    {/* Statut */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Statut
                      </Label>
                      <Select
                        value={filters.status}
                        onValueChange={(value) => handleFilterChange('status', value)}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tous les statuts" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="draft">📝 Brouillon</SelectItem>
                          <SelectItem value="open">🔓 Ouvert</SelectItem>
                          <SelectItem value="in-progress">🔄 En cours</SelectItem>
                          <SelectItem value="completed">✅ Terminé</SelectItem>
                          <SelectItem value="cancelled">❌ Annulé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Catégorie */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Catégorie
                      </Label>
                      <Select
                        value={filters.category}
                        onValueChange={(value) => handleFilterChange('category', value)}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes catégories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes catégories</SelectItem>
                          {filtersData.categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Type de budget */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Type de budget
                      </Label>
                      <Select
                        value={filters.budgetType}
                        onValueChange={(value) => handleFilterChange('budgetType', value)}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tous types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous types</SelectItem>
                          <SelectItem value="fixed">Forfait fixe</SelectItem>
                          <SelectItem value="hourly">Taux horaire</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Compétence */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Compétence
                      </Label>
                      <Select
                        value={filters.skill}
                        onValueChange={(value) => handleFilterChange('skill', value)}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes compétences" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes compétences</SelectItem>
                          {filtersData.skills.slice(0, 15).map((skill) => (
                            <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Budget Min */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Budget Min
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={100000}
                        value={filters.budgetMin}
                        onChange={(e) => handleFilterChange('budgetMin', parseInt(e.target.value) || 0)}
                        disabled={loading}
                        placeholder="0"
                      />
                    </div>

                    {/* Budget Max */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Budget Max
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={100000}
                        value={filters.budgetMax}
                        onChange={(e) => handleFilterChange('budgetMax', parseInt(e.target.value) || 100000)}
                        disabled={loading}
                        placeholder="100000"
                      />
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={resetFilters}
                      disabled={loading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Réinitialiser tout
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAdvancedFilters(false)
                        fetchUserProjects()
                      }}
                      className="bg-gradient-to-r from-blue-600 to-purple-600"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Chargement...
                        </>
                      ) : (
                        <>
                          <Filter className="h-4 w-4 mr-2" />
                          Appliquer
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            
            {/* Sidebar - Liste des projets */}
            <div className="xl:col-span-1">
              <Card className="shadow-lg border-0 sticky top-6">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building className="h-5 w-5 text-blue-600" />
                      Mes Projets
                      <Badge variant="secondary" className="ml-2">
                        {pagination.totalItems}
                      </Badge>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportProjects}
                      disabled={loading || userProjects.length === 0}
                      title="Exporter"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    {pagination.totalPages > 1 && `Page ${currentPage} sur ${pagination.totalPages}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {loading ? (
                    // Squelette de chargement
                    <div className="space-y-3">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="animate-pulse p-3 border rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="rounded-full bg-gray-200 h-8 w-8"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-full"></div>
                              <div className="flex gap-2">
                                <div className="h-6 bg-gray-200 rounded w-16"></div>
                                <div className="h-6 bg-gray-200 rounded w-12"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="text-center py-4 text-red-600">
                      <div>❌ Erreur</div>
                      <div className="text-sm">{error}</div>
                      <Button variant="outline" size="sm" onClick={fetchUserProjects} className="mt-2">
                        Réessayer
                      </Button>
                    </div>
                  ) : userProjects.length > 0 ? (
                    <>
                      {/* Liste des projets */}
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {userProjects.map((project) => (
                          <div
                            key={project._id}
                            className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md group ${
                              selectedProjectId === project._id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                            onClick={() => setSelectedProjectId(project._id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                selectedProjectId === project._id 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                              }`}>
                                <Building className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {project.title}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs capitalize ${
                                      project.status === 'open' ? 'bg-green-50 text-green-700 border-green-200' :
                                      project.status === 'in-progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      'bg-gray-50 text-gray-700 border-gray-200'
                                    }`}
                                  >
                                    {project.status === 'open' ? '🔓' : 
                                     project.status === 'in-progress' ? '🔄' : '📝'}
                                    {project.status}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    ${project.budget.min.toLocaleString()}
                                  </span>
                                </div>
                                {/* Compétences dans la liste */}
                                {project.skills && project.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {project.skills.slice(0, 2).map((skill, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {project.skills.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{project.skills.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination compacte */}
                      {pagination.totalPages > 1 && (
                        <div className="pt-4 border-t">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1 || loading}
                                onClick={() => handlePageChange(currentPage - 1)}
                              >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Précédent
                              </Button>
                              
                              <span className="text-sm text-gray-600">
                                {currentPage}/{pagination.totalPages}
                              </span>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === pagination.totalPages || loading}
                                onClick={() => handlePageChange(currentPage + 1)}
                              >
                                Suivant
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                            
                            {/* Sélecteur d'éléments par page */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">
                                {((currentPage - 1) * itemsPerPage + 1)}-
                                {Math.min(currentPage * itemsPerPage, pagination.totalItems)} sur {pagination.totalItems}
                              </span>
                              
                              <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(value) => handleItemsPerPageChange(parseInt(value))}
                                disabled={loading}
                              >
                                <SelectTrigger className="w-20 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[6, 12, 24, 48, 96].map(option => (
                                    <SelectItem key={option} value={option.toString()}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <div className="text-gray-500 text-sm mb-4">
                        Aucun projet ne correspond à vos critères
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={resetFilters}
                      >
                        Réinitialiser les filtres
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="xl:col-span-3">
              {selectedProject ? (
                <div className="space-y-8">
                  {/* En-tête du projet sélectionné */}
                  <Card className="shadow-lg border-0 bg-gradient-to-r from-white to-blue-50">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                              <Target className="h-7 w-7 text-white" />
                            </div>
                            <div className="flex-1">
                              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                {selectedProject.title}
                              </h2>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={selectedProject.status === 'open' ? 'default' : 'secondary'}>
                                  {selectedProject.status === 'open' ? '🔓 Public' : 
                                   selectedProject.status === 'in-progress' ? '🔄 En cours' : '📝 Brouillon'}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {selectedProject.category}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {selectedProject.budget.type === 'hourly' ? '💵 Horaire' : '💰 Forfait'}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  Créé le {new Date(selectedProject.createdAt).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Compétences et description */}
                          <div className="space-y-4 mt-4">
                            {selectedProject.skills && selectedProject.skills.length > 0 && (
                              <div>
                                <div className="text-sm font-medium text-gray-700 mb-2">
                                  Compétences requises ({selectedProject.skills.length})
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {selectedProject.skills.map((skill, index) => (
                                    <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {selectedProject.description && (
                              <div>
                                <div className="text-sm font-medium text-gray-700 mb-2">Description</div>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {selectedProject.description.length > 200 
                                    ? `${selectedProject.description.substring(0, 200)}...` 
                                    : selectedProject.description}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-4 min-w-[200px]">
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4">
                            <div className="text-sm text-gray-600 mb-1">Budget projet</div>
                            <div className="text-2xl font-bold text-blue-600">
                              ${selectedProject.budget.min.toLocaleString()}
                              {selectedProject.budget.max > selectedProject.budget.min && 
                               ` - $${selectedProject.budget.max.toLocaleString()}`}
                            </div>
                            <div className="text-xs text-gray-500 capitalize mt-1">
                              {selectedProject.budget.type === 'hourly' ? 'Taux horaire' : 'Forfait fixe'}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Button asChild className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                              <a href={`/projects/${selectedProject._id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir les détails
                              </a>
                            </Button>
                            
                            <Button asChild variant="outline">
                              <a href={`/projects/${selectedProject._id}/edit`}>
                                <FileText className="mr-2 h-4 w-4" />
                                Modifier le projet
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Widget AI Matching */}
                  <AIMatchingWidget 
                    type="client"
                    projectId={selectedProject._id}
                    quickAction={false}
                    maxResults={12}
                  />

                  {/* Pagination complète en bas */}
                  {pagination.totalPages > 1 && (
                    <Card className="shadow-lg border-0">
                      <CardContent className="pt-6">
                        <CustomPagination />
                      </CardContent>
                    </Card>
                  )}

                  {/* Stats et actions rapides */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-blue-900">Projets similaires</h4>
                            <p className="text-sm text-blue-700 mt-1">
                              {userProjects.filter(p => 
                                p.category === selectedProject.category && 
                                p._id !== selectedProject._id
                              ).length} projets
                            </p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => {
                            handleFilterChange('category', selectedProject.category)
                            setShowAdvancedFilters(true)
                          }}>
                            Voir tous
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-green-900">Statistiques</h4>
                            <p className="text-sm text-green-700 mt-1">
                              {userProjects.filter(p => p.status === 'open').length} ouverts
                            </p>
                          </div>
                          <Sparkles className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-purple-900">Export</h4>
                            <p className="text-sm text-purple-700 mt-1">
                              Télécharger les données
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={handleExportProjects}
                            disabled={loading || userProjects.length === 0}
                          >
                            <Download className="h-5 w-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <Card className="shadow-lg border-0">
                  <CardContent className="pt-12 pb-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Building className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {userProjects.length === 0 ? "Aucun Projet Disponible" : "Sélectionnez un Projet"}
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                      {userProjects.length === 0 
                        ? "Commencez par créer votre premier projet pour utiliser l'AI Matching" 
                        : "Sélectionnez un projet dans la liste de gauche pour lancer le matching AI"
                      }
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        onClick={() => window.location.href = '/projects/new'}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Créer un Nouveau Projet
                      </Button>
                      <Button variant="outline" onClick={() => resetFilters()}>
                        <FileText className="mr-2 h-4 w-4" />
                        Voir tous les projets
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}