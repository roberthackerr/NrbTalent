// /app/(dashboard)/groups/page.tsx - VERSION CORRIGÉE
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { 
  Search, 
  Filter, 
  Users, 
  Plus, 
  TrendingUp, 
  Calendar, 
  Briefcase, 
  Zap, 
  MapPin, 
  Star, 
  Rocket,
  Users2,
  Target,
  Crown,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Grid,
  List,
  Eye,
  Clock,
  Flame,
  Loader2,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GroupCard } from '@/components/groups/GroupCard'
import { GroupFilters } from '@/components/groups/GroupFilters'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Group } from '@/lib/models/group'

interface ApiPagination {
  page: number
  limit: number
  total: number
  pages: number
}

interface ApiResponse {
  groups: Group[]
  pagination: ApiPagination
}

interface GroupWithImages extends Group {
  banner?: string
  isMember?: boolean
  isFeatured?: boolean
  engagementRate?: number
  color?: string
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupWithImages[]>([])
  const [featuredGroups, setFeaturedGroups] = useState<GroupWithImages[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingFeatured, setLoadingFeatured] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    type: '',
    skills: [] as string[],
    location: '',
    sortBy: 'relevance' as 'relevance' | 'members' | 'activity' | 'newest'
  })
  
  const [pagination, setPagination] = useState<ApiPagination>({
    page: 1,
    total: 0,
    pages: 1,
    limit: 12
  })

  const [activeTab, setActiveTab] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const mainContentRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const [stats, setStats] = useState({
    totalGroups: 0,
    activeToday: 0,
    newThisWeek: 0,
    engagementRate: 0
  })

  // Fonction pour formater les données du groupe
  const formatGroupData = (group: Group): GroupWithImages => {
    // Log pour debug
    console.log('Raw group data:', group)
    
    return {
      ...group,
      banner: group.banner || `https://placehold.co/600x200/3b82f6/fff?text=${encodeURIComponent(group.name)}&font=montserrat`,
      isMember: false, // À remplir avec votre logique d'authentification
      isFeatured: group.isFeatured || false,
      engagementRate: calculateEngagementRate(group),
      color: group.color || '#3b82f6'
    }
  }

  const calculateEngagementRate = (group: Group): number => {
    if (!group.stats || group.stats.totalMembers === 0) return 0
    const activeMembers = group.stats.activeMembers || 0
    const totalMembers = group.stats.totalMembers || 1
    return Math.round((activeMembers / totalMembers) * 100)
  }

  // Memoize fetchGroups
  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (searchQuery) params.append('q', searchQuery)
      if (filters.type) params.append('type', filters.type)
      if (filters.skills.length > 0) params.append('skills', filters.skills.join(','))
      if (filters.location) params.append('location', filters.location)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
      
      console.log('Fetching groups with params:', params.toString())
      
      const response = await fetch(`/api/groups?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: ApiResponse = await response.json()
      console.log('API response:', data)
      
      // Formater les données
      const formattedGroups = data.groups.map(formatGroupData)
      setGroups(formattedGroups)
      setPagination(data.pagination)
      
      // Mettre à jour les stats
      setStats(prev => ({
        ...prev,
        totalGroups: data.pagination.total,
        newThisWeek: Math.floor(data.pagination.total * 0.1),
        engagementRate: Math.round(75 + Math.random() * 20)
      }))
      
    } catch (error) {
      console.error('Error fetching groups:', error)
      toast.error('Erreur lors du chargement des groupes')
      setGroups([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filters, pagination.page, pagination.limit])

  // Charger les groupes en vedette
  const fetchFeaturedGroups = useCallback(async () => {
    setLoadingFeatured(true)
    try {
      const params = new URLSearchParams({
        sortBy: 'members',
        limit: '3'
      })
      
      const response = await fetch(`/api/groups?${params.toString()}`)
      
      if (response.ok) {
        const data: ApiResponse = await response.json()
        const featured = data.groups.slice(0, 3).map(formatGroupData)
        setFeaturedGroups(featured)
      }
    } catch (error) {
      console.error('Error fetching featured groups:', error)
    } finally {
      setLoadingFeatured(false)
    }
  }, [])

  // Charger les statistiques
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/groups?limit=1')
      if (response.ok) {
        const data: ApiResponse = await response.json()
        const totalGroups = data.pagination.total
        setStats(prev => ({
          ...prev,
          totalGroups,
          activeToday: Math.floor(totalGroups * 0.4),
          newThisWeek: Math.floor(totalGroups * 0.1),
          engagementRate: 75 + Math.random() * 20
        }))
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchGroups(),
        fetchFeaturedGroups(),
        fetchStats()
      ])
    }
    loadData()
  }, [])

  // Re-fetch quand les filtres changent
  useEffect(() => {
    if (!loading) {
      fetchGroups()
    }
  }, [filters, pagination.page, fetchGroups])

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.scrollY
        const maxScroll = 200
        const opacity = Math.max(0, 1 - scrolled / maxScroll)
        heroRef.current.style.opacity = opacity.toString()
        
        if (scrolled > 100) {
          heroRef.current.classList.add('h-32', 'py-4')
          heroRef.current.classList.remove('py-12')
        } else {
          heroRef.current.classList.remove('h-32', 'py-4')
          heroRef.current.classList.add('py-12')
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    mainContentRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const scrollToContent = () => {
    mainContentRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    
    let sortBy: 'relevance' | 'members' | 'activity' | 'newest' = 'relevance'
    switch (value) {
      case 'trending':
        sortBy = 'activity'
        break
      case 'new':
        sortBy = 'newest'
        break
    }
    
    setFilters(prev => ({ ...prev, sortBy }))
  }

  // Fonction pour générer une couleur basée sur le type
  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'skill': 'from-blue-500 to-cyan-500',
      'location': 'from-green-500 to-emerald-500',
      'professional': 'from-purple-500 to-pink-500',
      'company': 'from-red-500 to-orange-500',
      'learning': 'from-cyan-500 to-blue-500',
      'interest': 'from-violet-500 to-purple-500'
    }
    return colors[type] || 'from-slate-500 to-slate-700'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div 
        ref={heroRef}
        className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white shadow-lg transition-all duration-300"
      >
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Users className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Nouveau
                </Badge>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Communautés Professionnelles
              </h1>
              
              <p className="text-sm opacity-90 max-w-2xl">
                Rejoignez {stats.totalGroups}+ groupes actifs, connectez-vous avec des experts et développez votre réseau.
              </p>
            </div>
            
            <form onSubmit={handleSearch} className="w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher groupes, compétences..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-24 py-5 bg-white/10 border-white/30 text-white placeholder:text-white/60 backdrop-blur-sm"
                />
                <Button 
                  type="submit" 
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-white text-blue-600 hover:bg-white/90"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Rechercher
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div 
        onClick={scrollToContent}
        className="sticky top-24 z-30 flex justify-center -mt-4 cursor-pointer group"
      >
        <div className="animate-bounce bg-white rounded-full p-2 shadow-lg border border-slate-200 group-hover:shadow-xl transition-shadow">
          <ChevronRight className="h-5 w-5 text-blue-600 rotate-90" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6" ref={mainContentRef}>
        {/* Quick Stats Bar */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { 
                label: 'Groupes actifs', 
                value: stats.totalGroups || '...', 
                icon: Users, 
                color: 'text-blue-600', 
                change: stats.totalGroups > 0 ? '+12%' : '...' 
              },
              { 
                label: 'Membres total', 
                value: stats.totalGroups > 0 ? `${Math.round(stats.totalGroups * 42.5)}` : '...', 
                icon: Users2, 
                color: 'text-green-600', 
                change: '+8%' 
              },
              { 
                label: 'Engagement', 
                value: stats.engagementRate > 0 ? `${Math.round(stats.engagementRate)}%` : '...', 
                icon: TrendingUp, 
                color: 'text-purple-600', 
                change: '+5%' 
              },
              { 
                label: 'Nouveaux cette semaine', 
                value: stats.newThisWeek || '...', 
                icon: Rocket, 
                color: 'text-orange-600', 
                change: '+15%' 
              }
            ].map((stat, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${stat.color.split('-')[1]}-100`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-sm text-slate-600">{stat.label}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-green-600">{stat.change}</div>
                      <TrendingUp className="h-3 w-3 text-green-500 mt-1 ml-auto" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className={cn(
            "lg:w-64",
            isFiltersOpen ? "block" : "hidden lg:block"
          )}>
            <ScrollArea className="h-[calc(100vh-200px)] pr-4">
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Button className="w-full justify-start" size="sm" asChild>
                        <Link href="/groups/create">
                          <Plus className="h-4 w-4 mr-2" />
                          Créer un groupe
                        </Link>
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant={viewMode === 'grid' ? 'default' : 'outline'} 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setViewMode('grid')}
                        >
                          <Grid className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant={viewMode === 'list' ? 'default' : 'outline'} 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setViewMode('list')}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <GroupFilters filters={filters} onChange={handleFilterChange} />

                {/* Debug Info (à supprimer en production) */}
                <Card className="border-dashed">
                  <CardContent className="p-4">
                    <div className="text-xs text-slate-500 space-y-2">
                      <div className="font-medium mb-2">Debug Info:</div>
                      <div>Total groupes: {stats.totalGroups}</div>
                      <div>Groupes chargés: {groups.length}</div>
                      <div>Page: {pagination.page}/{pagination.pages}</div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full mt-2 text-xs"
                        onClick={() => {
                          console.log('Current groups:', groups)
                          console.log('Featured groups:', featuredGroups)
                        }}
                      >
                        Log Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {activeTab === 'trending' ? 'Groupes tendance' : 
                     activeTab === 'new' ? 'Nouveaux groupes' : 
                     'Groupes recommandés'}
                  </h2>
                  <p className="text-slate-600 text-sm mt-1">
                    {activeTab === 'trending' ? 'Découvrez les groupes les plus actifs' :
                     activeTab === 'new' ? 'Les dernières communautés créées' :
                     'Communautés qui correspondent à vos intérêts'}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="lg:hidden"
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtres
                  </Button>
                  
                  <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
                    <TabsList>
                      <TabsTrigger value="all" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Tous
                      </TabsTrigger>
                      <TabsTrigger value="trending" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Trending
                      </TabsTrigger>
                      <TabsTrigger value="new" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Nouveaux
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {/* Featured Groups */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    Groupes en vedette
                  </h3>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/groups/featured">
                      Voir tout
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
                
                {loadingFeatured ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : featuredGroups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {featuredGroups.map((group) => (
                      <Link 
                        key={group._id?.toString()} 
                        href={`/groups/${group.slug}`}
                        className="group block"
                      >
                        <Card className="h-full border-0 shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1 overflow-hidden">
                          <div className={`h-24 bg-gradient-to-r ${getTypeColor(group.type)} relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            <div className="absolute bottom-3 left-4 text-2xl font-bold text-white">
                              {group.name.charAt(0)}
                            </div>
                            {group.isFeatured && (
                              <Badge className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white border-0">
                                <Star className="h-3 w-3 mr-1" />
                                Top
                              </Badge>
                            )}
                          </div>
                          
                          <CardContent className="p-4">
                            <h3 className="font-bold text-base mb-2 line-clamp-1">{group.name}</h3>
                            <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                              {group.description}
                            </p>
                            
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-slate-400" />
                                <span className="font-medium">{group.stats?.totalMembers || 0}</span>
                              </div>
                              <div className="text-green-600 font-medium text-sm">
                                +{calculateEngagementRate(group)}%
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-1 mt-3">
                              {group.tags?.slice(0, 3).map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-8 text-center">
                      <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600">
                        Aucun groupe en vedette pour le moment
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Separator className="my-6" />
            </div>

            {/* Groups Grid/List */}
            {loading ? (
              <div className={cn(
                "gap-4",
                viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'
              )}>
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className={viewMode === 'grid' ? 'p-4' : 'p-6'}>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 bg-slate-200 rounded-lg"></div>
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                          </div>
                        </div>
                        <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : groups.length > 0 ? (
              <>
                <div className={cn(
                  "gap-4",
                  viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'
                )}>
                  {groups.map((group) => (
                    <GroupCard 
                      key={group._id?.toString()} 
                      group={{
                        _id: group._id?.toString() || '',
                        name: group.name,
                        slug: group.slug,
                        description: group.description,
                        type: group.type,
                        avatar: group.avatar,
                        banner: group.banner,
                        stats: {
                          totalMembers: group.stats?.totalMembers || 0,
                          activeMembers: group.stats?.activeMembers || 0,
                          totalPosts: group.stats?.totalPosts || 0,
                          totalEvents: group.stats?.totalEvents || 0,
                        },
                        tags: group.tags || [],
                        skills: group.skills || [],
                        location: group.location,
                        company: group.company,
                        visibility: group.visibility,
                        isMember: group.isMember,
                        isFeatured: group.isFeatured,
                        isVerified: group.isVerified,
                        engagementRate: group.engagementRate
                      }}
                      compact={viewMode === 'list'}
                      showJoinButton={true}
                    />
                  ))}
                </div>
                
                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t">
                    <div className="text-sm text-slate-600">
                      Affichage {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} groupes
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page === 1}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      >
                        Précédent
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                          const pageNum = i + 1
                          return (
                            <Button
                              key={pageNum}
                              variant={pagination.page === pageNum ? "default" : "outline"}
                              size="sm"
                              className="w-10"
                              onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                        {pagination.pages > 5 && (
                          <>
                            <span className="px-2">...</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPagination(prev => ({ ...prev, page: pagination.pages }))}
                            >
                              {pagination.pages}
                            </Button>
                          </>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page === pagination.pages}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun groupe trouvé</h3>
                  <p className="text-slate-600 mb-6 max-w-md mx-auto">
                    {searchQuery 
                      ? `Aucun résultat pour "${searchQuery}"`
                      : "Aucun groupe ne correspond à vos critères de recherche."}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => {
                      setFilters({ type: '', skills: [], location: '', sortBy: 'relevance' })
                      setSearchQuery('')
                    }}>
                      Réinitialiser les filtres
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/groups/create">
                        Créer un groupe
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bottom CTA */}
            <div className="mt-12">
              <Card className="border-0 bg-gradient-to-r from-slate-900 to-slate-800 text-white overflow-hidden">
                <CardContent className="p-8 relative">
                  <div className="absolute right-8 top-8 opacity-20">
                    <Users className="h-32 w-32" />
                  </div>
                  
                  <div className="relative max-w-2xl">
                    <Target className="h-12 w-12 text-blue-400 mb-6" />
                    <h2 className="text-2xl font-bold mb-4">
                      Prêt à lancer votre communauté ?
                    </h2>
                    <p className="text-slate-300 mb-6">
                      Créez un groupe gratuitement, connectez-vous avec des professionnels et développez votre réseau.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button size="lg" asChild className="bg-white text-slate-900 hover:bg-white/90">
                        <Link href="/groups/create">
                          <Plus className="h-5 w-5 mr-2" />
                          Créer un groupe gratuitement
                        </Link>
                      </Button>
                      <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                        <Users className="h-5 w-5 mr-2" />
                        Explorer les communautés
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Panel (à supprimer en production) */}
      {process.env.NODE_ENV === 'development' && groups.length > 0 && (
        <div className="fixed bottom-4 left-4 z-50 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm max-h-48 overflow-auto">
          <div className="font-mono">
            <div className="mb-2 font-semibold">Group Data Debug:</div>
            <div>Total: {groups.length}</div>
            <div>First group avatar: {groups[0]?.avatar?.substring(0, 50)}...</div>
            <div>First group banner: {groups[0]?.banner?.substring(0, 50)}...</div>
            <Button 
              size="sm" 
              variant="secondary" 
              className="mt-2 text-xs"
              onClick={() => console.log('Groups data:', groups)}
            >
              Log to Console
            </Button>
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        <ArrowRight className="h-5 w-5 rotate-270" />
      </button>
    </div>
  )
}