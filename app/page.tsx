// app/page.tsx - Version avec publications des groupes
"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/home/hero-section"
import { ProjectsGrid } from "@/components/home/projects-grid"
import { GigsShowcase } from "@/components/home/gigs-showcase"
import { TalentMatching } from "@/components/ai/TalentMatching"
import { StatsOverview } from "@/components/home/stats-overview"
import { CategoryFilters } from "@/components/home/category-filters"
import { QuickActions } from "@/components/home/quick-actions"
import { TrendingSkills } from "@/components/home/trending-skills"
import { Testimonials } from "@/components/home/testimonials"
import { Footer } from "@/components/footer"
import { CalendarPopup } from "@/components/home/calendar-popup"
import { IDEPopup } from "@/components/home/ide-popup"
import { GroupPostsFeed } from "@/components/home/group-posts-feed"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  Search, Filter, Sparkles, TrendingUp, Users, Briefcase, 
  Code2, MessageSquare, ThumbsUp, Share2, ChevronRight, 
  Eye, Clock, Calendar, Globe, Users as UsersIcon, 
  ArrowRight, Heart, Bookmark, MoreVertical, TrendingUp as TrendingUpIcon
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface GroupPost {
  _id: string
  content: string
  title?: string
  type: 'post' | 'event' | 'job'
  author: {
    _id: string
    name: string
    avatar?: string
    title?: string
    company?: string
  }
  group: {
    _id: string
    name: string
    slug: string
    avatar?: string
  }
  reactionCounts?: {
    like: number
    love: number
    insightful: number
    helpful: number
    celebrate: number
  }
  commentCount: number
  viewCount: number
  shareCount: number
  createdAt: string
  images?: string[]
  tags?: string[]
}

export default function HomePage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("feed") // Changé pour "feed" par défaut
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [projects, setProjects] = useState<any[]>([])
  const [gigs, setGigs] = useState<any[]>([])
  const [groupPosts, setGroupPosts] = useState<GroupPost[]>([])
  const [loading, setLoading] = useState(true)
  const [gigsLoading, setGigsLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([])
  const [showCalendarPopup, setShowCalendarPopup] = useState(false)
  const [showIDEPopup, setShowIDEPopup] = useState(false)
  
  // États de pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 12,
    totalItems: 0,
    totalPages: 1
  })

  // Afficher les popups
  useEffect(() => {
    if (session?.user) {
      const hasSeenCalendarPopup = localStorage.getItem('hasSeenCalendarPopup')
      const hasSeenIDEPopup = localStorage.getItem('hasSeenIDEPopup')
      
      if (!hasSeenCalendarPopup) {
        setTimeout(() => {
          setShowCalendarPopup(true)
          localStorage.setItem('hasSeenCalendarPopup', 'true')
        }, 5000)
      }

      if (!hasSeenIDEPopup) {
        setTimeout(() => {
          setShowIDEPopup(true)
          localStorage.setItem('hasSeenIDEPopup', 'true')
        }, 10000)
      }
    }
  }, [session])

  // Charger les publications des groupes
  const fetchGroupPosts = useCallback(async () => {
    if (!session?.user) {
      setPostsLoading(false)
      return
    }

    setPostsLoading(true)
    try {
      const response = await fetch('/api/group-posts/feed?limit=10')
      if (response.ok) {
        const data = await response.json()
        console.log("📝 Group posts loaded:", data.posts?.length || 0)
        setGroupPosts(data.posts || [])
      } else {
        console.error('❌ Error fetching group posts:', response.status)
        setGroupPosts([])
      }
    } catch (error) {
      console.error('❌ Error loading group posts:', error)
      setGroupPosts([])
    } finally {
      setPostsLoading(false)
    }
  }, [session])

  // Charger les gigs
  const fetchGigs = useCallback(async () => {
    setGigsLoading(true)
    try {
      const gigsRes = await fetch('/api/gigs?limit=8')
      if (gigsRes.ok) {
        const gigsData = await gigsRes.json()
        
        if (gigsData.success === true && gigsData.data) {
          if (Array.isArray(gigsData.data.gigs)) {
            setGigs(gigsData.data.gigs)
          } else if (Array.isArray(gigsData.data)) {
            setGigs(gigsData.data)
          } else {
            setGigs([])
          }
        } else if (Array.isArray(gigsData)) {
          setGigs(gigsData)
        } else if (gigsData.gigs && Array.isArray(gigsData.gigs)) {
          setGigs(gigsData.gigs)
        } else {
          setGigs([])
        }
      } else {
        setGigs([])
      }
    } catch (error) {
      console.error('❌ Error loading gigs:', error)
      setGigs([])
    } finally {
      setGigsLoading(false)
    }
  }, [])

  // Charger les projets avec pagination
  const fetchProjects = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        limit: pagination.itemsPerPage.toString(),
        page: page.toString(),
        status: 'open',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }

      if (selectedCategory && selectedCategory !== "all") {
        params.category = selectedCategory
      }

      if (searchQuery) {
        params.search = searchQuery
      }

      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          searchParams.append(key, value)
        }
      })

      const projectsUrl = `/api/projects?${searchParams.toString()}`

      const [projectsRes, aiRes] = await Promise.all([
        fetch(projectsUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache'
        }),
        session ? fetch('/api/ai/matching') : Promise.resolve(null)
      ])

      // Gestion des projets
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        
        if (projectsData.success === true && projectsData.data) {
          if (Array.isArray(projectsData.data.projects)) {
            setProjects(projectsData.data.projects)
            
            if (projectsData.data.pagination) {
              setPagination(prev => ({
                ...prev,
                currentPage: projectsData.data.pagination.page || page,
                totalItems: projectsData.data.pagination.total || 0,
                totalPages: projectsData.data.pagination.totalPages || 1
              }))
            }
          } else {
            setProjects([])
          }
        } else {
          setProjects([])
        }
      } else {
        setProjects([])
      }

      // Gestion des recommandations IA
      if (aiRes?.ok) {
        const aiData = await aiRes.json()
        setAiRecommendations(aiData.recommendations || [])
      }

    } catch (error) {
      console.error('❌ Error loading projects:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, searchQuery, pagination.itemsPerPage, session])

  // Charger toutes les données initiales
  useEffect(() => {
    fetchProjects(1)
    fetchGigs()
    fetchGroupPosts()
  }, [fetchProjects, fetchGigs, fetchGroupPosts])

  // Recharger les projets quand les filtres changent
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProjects(1)
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [selectedCategory, searchQuery, fetchProjects])

  // Handlers
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }))
    fetchProjects(page)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPagination(prev => ({ ...prev, currentPage: 1 }))
    setActiveTab("projects")
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setPagination(prev => ({ ...prev, currentPage: 1 }))
    setActiveTab("projects")
  }

  const handleRefresh = () => {
    fetchProjects(pagination.currentPage)
    fetchGigs()
    fetchGroupPosts()
    toast.success("Données actualisées")
  }

  const handleCalendarClick = () => {
    setShowCalendarPopup(true)
  }

  const handleIDEClick = () => {
    setShowIDEPopup(true)
  }

  // Composant pour afficher un post individuel
  const PostCard = ({ post }: { post: GroupPost }) => {
    const totalLikes = post.reactionCounts ? 
      Object.values(post.reactionCounts).reduce((a, b) => a + b, 0) : 0

    return (
      <Card className="hover:shadow-md transition-shadow duration-200 border-gray-100">
        <CardContent className="p-5">
          <div className="flex gap-4">
            {/* Avatar de l'auteur */}
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                {post.author.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              {/* En-tête du post */}
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">
                      {post.author.name}
                    </span>
                    {post.author.title && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-600">
                          {post.author.title}
                        </span>
                      </>
                    )}
                    {post.author.company && (
                      <span className="text-sm text-gray-500">
                        @ {post.author.company}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">
                      dans 
                      <Link 
                        href={`/groups/${post.group.slug}`}
                        className="ml-1 font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {post.group.name}
                      </Link>
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Type du post */}
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    post.type === 'event' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    post.type === 'job' ? 'bg-green-50 text-green-700 border-green-200' :
                    'bg-purple-50 text-purple-700 border-purple-200'
                  }`}
                >
                  {post.type === 'event' ? 'Événement' :
                   post.type === 'job' ? 'Offre' : 'Publication'}
                </Badge>
              </div>

              {/* Contenu du post */}
              <div className="mb-4">
                {post.title && (
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {post.title}
                  </h4>
                )}
                <p className="text-gray-700 whitespace-pre-wrap">
                  {post.content}
                </p>
                
                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {post.tags.slice(0, 3).map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-sm">
                      {totalLikes > 0 ? totalLikes : 'Aimer'}
                    </span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex items-center gap-2 text-gray-600 hover:text-green-600"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm">
                      {post.commentCount > 0 ? post.commentCount : 'Commenter'}
                    </span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex items-center gap-2 text-gray-600 hover:text-purple-600"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="text-sm">
                      {post.shareCount > 0 ? post.shareCount : 'Partager'}
                    </span>
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Composant pour la section Feeds
  const FeedSection = () => {
    if (!session?.user) {
      return (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-6">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold mb-3">Connectez-vous pour voir vos publications</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Rejoignez vos groupes et découvrez les dernières publications de vos communautés.
          </p>
          <Button size="lg" className="gap-3">
            <Users className="h-5 w-5" />
            Se connecter
          </Button>
        </div>
      )
    }

    if (postsLoading) {
      return (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (groupPosts.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
            <MessageSquare className="h-8 w-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold mb-3">Aucune publication pour l'instant</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Rejoignez des groupes ou créez vos propres publications pour commencer.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link href="/groups">
                <Globe className="h-4 w-4 mr-2" />
                Explorer les groupes
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/groups/my-groups">
                <UsersIcon className="h-4 w-4 mr-2" />
                Mes groupes
              </Link>
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900">
                    {groupPosts.length}
                  </div>
                  <div className="text-sm text-blue-700">
                    Publications récentes
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-900">
                    {new Set(groupPosts.map(p => p.group._id)).size}
                  </div>
                  <div className="text-sm text-purple-700">
                    Groupes actifs
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUpIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900">
                    {groupPosts.reduce((sum, post) => sum + post.commentCount, 0)}
                  </div>
                  <div className="text-sm text-green-700">
                    Commentaires totaux
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {groupPosts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-center pt-6">
          <Button variant="outline" asChild className="gap-3">
            <Link href="/groups/my-groups">
              Voir toutes les publications
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-blue-950/20 dark:to-purple-950/10">
      <Navigation />
      
      <main>
        <HeroSection 
          user={session?.user}
          onSearch={handleSearch}
          onCalendarClick={handleCalendarClick}
          onIDEClick={handleIDEClick}
        />

        <StatsOverview />

        <QuickActions 
          user={session?.user} 
          onIDEClick={handleIDEClick}
        />

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-7xl mx-auto">
            {/* Header avec recherche et filtres */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                    Découvrez les opportunités
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">
                    {loading ? "Chargement..." : `${pagination.totalItems} projets disponibles`}
                    {!gigsLoading && ` - ${gigs.length} services disponibles`}
                    {!postsLoading && session?.user && ` - ${groupPosts.length} publications récentes`}
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                  <div className="relative flex-1 lg:flex-initial lg:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Rechercher projets, compétences..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          fetchProjects(1)
                        }
                      }}
                      className="pl-10 pr-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handleRefresh}
                    disabled={loading || gigsLoading || postsLoading}
                  >
                    <Filter className="h-4 w-4" />
                    {loading || gigsLoading || postsLoading ? "Chargement..." : "Actualiser"}
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={handleIDEClick}
                  >
                    <Code2 className="h-4 w-4" />
                    IDE
                  </Button>
                </div>
              </div>

              <CategoryFilters 
                selectedCategory={selectedCategory}
                onCategoryChange={(category) => {
                  handleCategoryChange(category)
                }}
              />
            </div>

            {/* Contenu principal avec onglets - 5 onglets maintenant */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList className="grid w-full grid-cols-5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <TabsTrigger 
                  value="feed" 
                  className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
                >
                  <MessageSquare className="h-4 w-4" />
                  Feed
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {postsLoading ? "..." : session?.user ? groupPosts.length : "0"}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="projects" 
                  className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
                >
                  <Briefcase className="h-4 w-4" />
                  Projets
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {loading ? "..." : pagination.totalItems}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="gigs" 
                  className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
                >
                  <Sparkles className="h-4 w-4" />
                  Services
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {gigsLoading ? "..." : gigs.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="matching" 
                  className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
                >
                  <TrendingUp className="h-4 w-4" />
                  Matching IA
                  {aiRecommendations.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs bg-green-500 text-white">
                      {aiRecommendations.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="talents" 
                  className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
                >
                  <Users className="h-4 w-4" />
                  Talents
                </TabsTrigger>
              </TabsList>

              {/* Feed - Publications des groupes */}
              <TabsContent value="feed" className="space-y-8">
                <FeedSection />
              </TabsContent>

              {/* Projets */}
              <TabsContent value="projects" className="space-y-8">
                <ProjectsGrid 
                  projects={projects}
                  loading={loading}
                  searchQuery={searchQuery}
                  pagination={{
                    page: pagination.currentPage,
                    limit: pagination.itemsPerPage,
                    totalCount: pagination.totalItems,
                    totalPages: pagination.totalPages,
                    hasNext: pagination.currentPage < pagination.totalPages,
                    hasPrev: pagination.currentPage > 1
                  }}
                  onPageChange={handlePageChange}
                  onRefresh={handleRefresh}
                />
              </TabsContent> 

              {/* Services/Gigs */}
              <TabsContent value="gigs" className="space-y-8">
                <GigsShowcase 
                  gigs={gigs}
                  loading={gigsLoading}
                  searchQuery={searchQuery}
                />
              </TabsContent>

              {/* Matching IA */}
              <TabsContent value="matching" className="space-y-8">
                <TalentMatching 
                  recommendations={aiRecommendations}
                  loading={loading}
                  user={session?.user}
                />
              </TabsContent>

              {/* Talents */}
              <TabsContent value="talents" className="space-y-8">
                <TrendingSkills />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <Testimonials />

      </main>

      <Footer />

      <CalendarPopup 
        isOpen={showCalendarPopup}
        onClose={() => setShowCalendarPopup(false)}
      />

      <IDEPopup 
        isOpen={showIDEPopup}
        onClose={() => setShowIDEPopup(false)}
      />
    </div>
  )
}