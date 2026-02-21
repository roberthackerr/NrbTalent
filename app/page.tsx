// app/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/home/hero-section"
import { ProjectsGrid } from "@/components/home/projects-grid"
import { GigsShowcase } from "@/components/home/gigs-showcase"
import { TalentMatching } from "@/components/ai/TalentMatching" // ✅ Fixed import path
import { StatsOverview } from "@/components/home/stats-overview"
import { CategoryFilters } from "@/components/home/category-filters"
import { QuickActions } from "@/components/home/quick-actions"
import { TrendingSkills } from "@/components/home/trending-skills"
import { Testimonials } from "@/components/home/testimonials"
import { Footer } from "@/components/footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Sparkles, TrendingUp, Users, Briefcase } from "lucide-react"
import { toast } from "sonner"

export default function HomePage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("projects")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [projects, setProjects] = useState<any[]>([])
  const [gigs, setGigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([])

  useEffect(() => {
    fetchHomeData()
  }, [])

  const fetchHomeData = async () => {
    setLoading(true)
    try {
      // ✅ Construction des paramètres avec suppression des valeurs null/undefined
      const params: Record<string, string> = {
        limit: '12',
        page: '1',
        status: 'open',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }

      // ✅ Ajouter seulement les paramètres qui ont des valeurs
      if (selectedCategory && selectedCategory !== "all") {
        params.category = selectedCategory
      }

      if (searchQuery) {
        params.search = searchQuery
      }

      // ✅ Créer URLSearchParams seulement avec les paramètres définis
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          searchParams.append(key, value)
        }
      })

      const projectsUrl = `/api/projects?${searchParams.toString()}`
      console.log("🔗 URL de requête projets:", projectsUrl)

      const [projectsRes, gigsRes, aiRes] = await Promise.all([
        fetch(projectsUrl),
        fetch('/api/gigs?limit=8'),
        session ? fetch('/api/ai/matching') : Promise.resolve(null)
      ])

      // ✅ Handle projects response
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        console.log("📦 Données projets reçues:", projectsData)
        setProjects(projectsData.projects || [])
      } else {
        const errorData = await projectsRes.json()
        console.error('❌ Erreur récupération projets:', projectsRes.status, errorData)
        setProjects([])
        if (projectsRes.status !== 400) {
          toast.error("Erreur lors du chargement des projets")
        }
      }

      // ✅ FIX: Handle gigs response properly
      if (gigsRes.ok) {
        const gigsData = await gigsRes.json()
        console.log("🎯 Données gigs reçues:", gigsData)
        
        // The gigs are in gigsData.gigs array
        const gigsArray = gigsData.gigs || []
        console.log(`🎯 ${gigsArray.length} gigs chargés:`, gigsArray.map((g: any) => ({ id: g._id, title: g.title })))
        setGigs(gigsArray)
      } else {
        console.error('❌ Erreur récupération gigs:', gigsRes.status)
        const errorData = await gigsRes.json().catch(() => ({}))
        console.error('Détails erreur gigs:', errorData)
        setGigs([])
        toast.error("Erreur lors du chargement des services")
      }

      // ✅ Handle AI recommendations
      if (aiRes?.ok) {
        const aiData = await aiRes.json()
        setAiRecommendations(aiData.recommendations || [])
      } else if (aiRes) {
        console.error('❌ Erreur récupération recommandations IA:', aiRes.status)
      }

    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error)
      toast.error("Erreur lors du chargement des données")
      setProjects([])
      setGigs([])
      setAiRecommendations([])
    } finally {
      setLoading(false)
    }
  }

  // ✅ Recharger les données quand la catégorie ou la recherche change
  useEffect(() => {
    if (!loading) {
      const timeoutId = setTimeout(() => {
        fetchHomeData()
      }, 500) // ✅ Délai pour éviter les requêtes trop fréquentes
      
      return () => clearTimeout(timeoutId)
    }
  }, [selectedCategory, searchQuery])

  // ✅ Safe filtering for projects
  const filteredProjects = Array.isArray(projects) ? projects.filter(project => {
    if (!project) return false
    
    const matchesSearch = project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.skills?.some((skill: string) => 
                           skill.toLowerCase().includes(searchQuery.toLowerCase())
                         )
    const matchesCategory = selectedCategory === "all" || project.category === selectedCategory
    return matchesSearch && matchesCategory
  }) : []

  // ✅ FIX: Safe filtering for gigs
  const filteredGigs = Array.isArray(gigs) ? gigs.filter(gig => {
    if (!gig) return false
    
    return gig.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           gig.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           gig.tags?.some((tag: string) => 
             tag.toLowerCase().includes(searchQuery.toLowerCase())
           ) ||
           gig.category?.toLowerCase().includes(searchQuery.toLowerCase())
  }) : []

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setActiveTab("projects")
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setActiveTab("projects")
  }

  const handleRefresh = () => {
    fetchHomeData()
    toast.success("Données actualisées")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-blue-950/20 dark:to-purple-950/10">
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <HeroSection 
          user={session?.user}
          onSearch={handleSearch}
        />

        {/* Stats Overview */}
        <StatsOverview />

        {/* Quick Actions */}
        <QuickActions user={session?.user} />

        {/* Main Content */}
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
                    {projects.length > 0 
                      ? `${projects.length} projets disponibles - ${gigs.length} services disponibles` 
                      : "Chargement des données..."}
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                  <div className="relative flex-1 lg:flex-initial lg:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Rechercher projets, compétences..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    <Filter className="h-4 w-4" />
                    {loading ? "Chargement..." : "Actualiser"}
                  </Button>
                </div>
              </div>

              {/* Catégories */}
              <CategoryFilters 
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
              />
            </div>

            {/* Contenu principal avec onglets */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <TabsTrigger 
                  value="projects" 
                  className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
                >
                  <Briefcase className="h-4 w-4" />
                  Projets
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {filteredProjects.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="gigs" 
                  className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
                >
                  <Sparkles className="h-4 w-4" />
                  Services
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {filteredGigs.length}
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

              {/* Projets */}
              <TabsContent value="projects" className="space-y-8">
                <ProjectsGrid 
                  projects={filteredProjects}
                  loading={loading}
                  searchQuery={searchQuery}
                />
              </TabsContent> 

              {/* Services/Gigs */}
              <TabsContent value="gigs" className="space-y-8">
                <GigsShowcase 
                  gigs={filteredGigs}
                  loading={loading}
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

        {/* Témoignages */}
        <Testimonials />

      </main>

      <Footer />
    </div>
  )
}