"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  ChevronLeft, 
  ChevronRight,
  Eye // 🔥 NOUVEAU IMPORT
} from "lucide-react"
import { AIMatchingWidget } from "@/components/ai/AIMatchingWidget"

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
}

export default function ClientAIMatchingPage() {
  const { data: session } = useSession()
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [userProjects, setUserProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState("open")

  // Charger les projets depuis l'API
  useEffect(() => {
    const fetchUserProjects = async () => {
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
          limit: '12',
          status: statusFilter,
          sortBy: 'createdAt',
          sortOrder: 'desc',
          ...(searchTerm && { search: searchTerm })
        })

        console.log(`🔄 Chargement projets page ${currentPage}...`)
        
        const response = await fetch(`/api/users/${session.user.id}/projects?${queryParams}`)
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (data.success) {
          console.log(`✅ ${data.projects.length} projets chargés`)
          setUserProjects(data.projects)
          setTotalPages(data.pagination.totalPages)

          // Sélection automatique du premier projet
          if (data.projects.length > 0 && !selectedProjectId) {
            const firstProjectId = data.projects[0]._id
            setSelectedProjectId(firstProjectId)
            console.log(`🎯 Projet sélectionné: ${firstProjectId}`)
          } else if (data.projects.length === 0) {
            setSelectedProjectId("")
            console.log("ℹ️ Aucun projet disponible")
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
    }

    fetchUserProjects()
  }, [session, selectedProjectId, currentPage, statusFilter, searchTerm])

  const selectedProject = userProjects.find(project => project._id === selectedProjectId)

  // Fonction de rechargement
  const refetchProjects = () => {
    setCurrentPage(1)
  }

  // Gestion de la pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  // 🔥 NOUVEAU : Vérification du rôle freelancer (DOIT ÊTRE AVANT LE RETURN PRINCIPAL)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full mb-6 shadow-lg">
              <Rocket className="h-5 w-5" />
              <span className="text-sm font-semibold">AI Matching Enterprise</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              Trouvez Votre Super Freelancer
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Notre intelligence artificielle analyse en temps réel les compétences, l'expérience 
              et la compatibilité pour vous connecter avec les freelancers parfaits.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-3 py-1">
                🚀 Matching Intelligent
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-700 px-3 py-1">
                ⚡ Temps Réel
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 px-3 py-1">
                🎯 95% de Précision
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            
            {/* Sidebar - Filtres & Projets */}
            <div className="xl:col-span-1 space-y-6">
              {/* Filtres */}
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Filter className="h-5 w-5 text-blue-600" />
                    Filtres & Recherche
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Barre de recherche */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Rechercher</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nom du projet..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && refetchProjects()}
                      />
                      <Button size="icon" onClick={refetchProjects} disabled={loading}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Filtre par statut */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Statut</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="open">🔓 Ouverts</SelectItem>
                        <SelectItem value="draft">📝 Brouillons</SelectItem>
                        <SelectItem value="in-progress">🔄 En cours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={refetchProjects}
                    disabled={loading}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    {loading ? "Chargement..." : "Actualiser"}
                  </Button>
                </CardContent>
              </Card>

              {/* Liste des Projets */}
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building className="h-5 w-5 text-blue-600" />
                    Mes Projets
                    <Badge variant="secondary" className="ml-2">
                      {userProjects.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {totalPages > 1 && `Page ${currentPage} sur ${totalPages}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {loading ? (
                    // Squelette de chargement
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse flex space-x-4">
                          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="text-center py-4 text-red-600">
                      <div>❌ Erreur</div>
                      <div className="text-sm">{error}</div>
                      <Button variant="outline" size="sm" onClick={refetchProjects} className="mt-2">
                        Réessayer
                      </Button>
                    </div>
                  ) : userProjects.length > 0 ? (
                    <>
                      {/* Liste des projets */}
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {userProjects.map((project) => (
                          <div
                            key={project._id}
                            className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                              selectedProjectId === project._id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                            onClick={() => setSelectedProjectId(project._id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                selectedProjectId === project._id 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                <Building className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {project.title}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {project.status}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    ${project.budget.min}
                                  </span>
                                </div>
                                {/* 🔥 NOUVEAU : Compétences dans la liste */}
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

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-between items-center pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1 || loading}
                            onClick={() => handlePageChange(currentPage - 1)}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          
                          <span className="text-sm text-gray-600">
                            {currentPage}/{totalPages}
                          </span>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages || loading}
                            onClick={() => handlePageChange(currentPage + 1)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Building className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <div className="text-gray-500 text-sm">
                        Aucun projet trouvé
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stats Rapides */}
              <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-xl border-0">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Target className="h-5 w-5" />
                      <span className="font-semibold">Performance AI</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold">92%</div>
                        <div className="text-xs text-purple-200">Précision</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">24h</div>
                        <div className="text-xs text-purple-200">Moyenne</div>
                      </div>
                    </div>
                    <div className="text-xs text-purple-200">
                      Basé sur 500+ matches
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="xl:col-span-3">
              {selectedProject ? (
                <div className="space-y-8">
                  {/* En-tête du projet sélectionné - AVEC COMPÉTENCES ET BOUTON */}
                  <Card className="shadow-lg border-0 bg-gradient-to-r from-white to-blue-50">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                              <Target className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold text-gray-900">
                                {selectedProject.title}
                              </h2>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={selectedProject.status === 'open' ? 'default' : 'secondary'}>
                                  {selectedProject.status === 'open' ? '🔓 Public' : '📝 Brouillon'}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {selectedProject.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {/* 🔥 NOUVEAU : Affichage des compétences du projet */}
                          {selectedProject.skills && selectedProject.skills.length > 0 && (
                            <div className="mt-4">
                              <div className="text-sm font-medium text-gray-700 mb-2">Compétences requises :</div>
                              <div className="flex flex-wrap gap-2">
                                {selectedProject.skills.map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-3">
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Budget projet</div>
                            <div className="text-xl font-bold text-blue-600">
                              ${selectedProject.budget.min} - ${selectedProject.budget.max}
                            </div>
                            <div className="text-xs text-gray-500 capitalize mt-1">
                              {selectedProject.budget.type === 'hourly' ? 'Taux horaire' : 'Forfait'}
                            </div>
                          </div>
                          
                          {/* 🔥 NOUVEAU : Bouton pour voir les détails du projet */}
                          <Button asChild className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                            <a href={`/projects/${selectedProject._id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir les détails
                            </a>
                          </Button>
                          
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <Clock className="h-6 w-6 text-green-600" />
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
                    maxResults={8}
                  />

                  {/* Features Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md">
                            <Sparkles className="h-7 w-7 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-blue-900">AI Avancée</h4>
                            <p className="text-sm text-blue-700">Algorithmes de matching optimisés</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md">
                            <Users className="h-7 w-7 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-green-900">Profils Vérifiés</h4>
                            <p className="text-sm text-green-700">Tous les freelancers sont validés</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md">
                            <Star className="h-7 w-7 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-purple-900">95% de Satisfaction</h4>
                            <p className="text-sm text-purple-700">Clients satisfaits par nos matches</p>
                          </div>
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
                        : "Choisissez un projet dans la liste pour lancer le matching AI"
                      }
                    </p>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Créer un Nouveau Projet
                    </Button>
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