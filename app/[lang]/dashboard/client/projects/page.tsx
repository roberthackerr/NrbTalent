// app/dashboard/client/projects/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Building, 
  Plus, 
  Users, 
  Eye, 
  EyeOff, 
  Clock, 
  DollarSign, 
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal
} from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Project {
  _id: string
  title: string
  description: string
  status: 'draft' | 'open' | 'in-progress' | 'completed' | 'cancelled'
  visibility: 'public' | 'private'
  budget: {
    min: number
    max: number
    type: 'fixed' | 'hourly'
    currency: string
  }
  applicationCount: number
  createdAt: string
  updatedAt: string
  category: string
  skills: string[]
}

export default function ClientProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/projects/client?limit=50')
      
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProjectVisibility = async (projectId: string, visibility: 'public' | 'private') => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility })
      })

      if (response.ok) {
        fetchProjects() // Recharger les données
      }
    } catch (error) {
      console.error('Error updating project visibility:', error)
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Projet supprimé avec succès')
        fetchProjects()
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  // Filtrage et tri
  const filteredAndSortedProjects = projects
    .filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'applications':
          return b.applicationCount - a.applicationCount
        case 'budget':
          return b.budget.max - a.budget.max
        default:
          return 0
      }
    })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { label: 'Brouillon', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
      'open': { label: 'Public', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      'in-progress': { label: 'En cours', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      'completed': { label: 'Terminé', variant: 'secondary' as const, color: 'bg-purple-100 text-purple-800' },
      'cancelled': { label: 'Annulé', variant: 'outline' as const, color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary', color: '' }
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getVisibilityBadge = (visibility: string) => {
    return visibility === 'public' ? (
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
        <Eye className="h-3 w-3 mr-1" />
        Public
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-slate-100 text-slate-800">
        <EyeOff className="h-3 w-3 mr-1" />
        Privé
      </Badge>
    )
  }

  const statusCounts = {
    all: projects.length,
    draft: projects.filter(p => p.status === 'draft').length,
    open: projects.filter(p => p.status === 'open').length,
    'in-progress': projects.filter(p => p.status === 'in-progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    cancelled: projects.filter(p => p.status === 'cancelled').length,
  }

  return (
    <div className="flex h-screen bg-gray-50/30">
      <DashboardSidebar role="client" />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes Projets</h1>
              <p className="text-gray-600 mt-2">
                Gérez tous vos projets publiés et brouillons
              </p>
            </div>
            <Link href="/projects/create">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Projet
              </Button>
            </Link>
          </div>

          {/* Filtres et Recherche */}
          <Card className="mb-6 bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Recherche */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher un projet..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filtre par statut */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'all', label: 'Tous', count: statusCounts.all },
                    { value: 'open', label: 'Publics', count: statusCounts.open },
                    { value: 'in-progress', label: 'En cours', count: statusCounts['in-progress'] },
                    { value: 'draft', label: 'Brouillons', count: statusCounts.draft },
                    { value: 'completed', label: 'Terminés', count: statusCounts.completed },
                  ].map((filter) => (
                    <Button
                      key={filter.value}
                      variant={statusFilter === filter.value ? "default" : "outline"}
                      onClick={() => setStatusFilter(filter.value)}
                      className="relative"
                    >
                      {filter.label}
                      {filter.count > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-gray-500 text-white text-xs">
                          {filter.count}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>

                {/* Tri */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Trier
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setSortBy('newest')}>
                      Plus récents
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                      Plus anciens
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('applications')}>
                      Plus de candidatures
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('budget')}>
                      Budget élevé
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {/* Liste des projets */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Card key={i} className="p-6 bg-white border-0 shadow-sm animate-pulse">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="flex gap-4">
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-24 ml-4"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredAndSortedProjects.length === 0 ? (
            <Card className="p-12 text-center bg-white border-0 shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'Aucun projet trouvé' : 'Aucun projet créé'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucun projet ne correspond à vos critères de recherche.' 
                  : 'Commencez par créer votre premier projet pour trouver des freelancers.'}
              </p>
              <Link href="/projects/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un projet
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedProjects.map((project) => (
                <Card key={project._id} className="p-6 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
                        <div className="flex gap-2">
                          {getStatusBadge(project.status)}
                          {getVisibilityBadge(project.visibility)}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>

                      <div className="flex items-center gap-6 text-sm text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {project.budget.min.toLocaleString()} - {project.budget.max.toLocaleString()} {project.budget.currency}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {project.applicationCount} candidature(s)
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Créé le {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                        {project.skills && project.skills.length > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex flex-wrap gap-1">
                              {project.skills.slice(0, 3).map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {project.skills.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{project.skills.length - 3}
                                </Badge>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {/* Actions principales */}
                      {project.status === 'open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateProjectVisibility(
                            project._id, 
                            project.visibility === 'public' ? 'private' : 'public'
                          )}
                        >
                          {project.visibility === 'public' ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      
                      {project.applicationCount > 0 && project.status === 'open' && (
                        <Link href={`/dashboard/client/projects/${project._id}/proposals`}>
                          <Button variant="outline" size="sm">
                            <Users className="h-4 w-4 mr-1" />
                            Voir ({project.applicationCount})
                          </Button>
                        </Link>
                      )}

                      <Link href={`/projects/${project._id}`}>
                        <Button size="sm">
                          Gérer
                        </Button>
                      </Link>

                      {/* Menu déroulant pour actions supplémentaires */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/projects/${project._id}/edit`}>
                              Modifier
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/projects/${project._id}`}>
                              Voir détails
                            </Link>
                          </DropdownMenuItem>
                          {project.status === 'draft' && (
                            <DropdownMenuItem 
                              onClick={() => updateProjectVisibility(project._id, 'public')}
                            >
                              Publier
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => deleteProject(project._id)}
                            className="text-red-600"
                          >
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Statistiques en bas */}
          {!loading && projects.length > 0 && (
            <Card className="mt-8 bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>
                    {filteredAndSortedProjects.length} projet(s) sur {projects.length} total
                  </span>
                  <div className="flex gap-6">
                    <span className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {projects.filter(p => p.status === 'open').length} publics
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {projects.reduce((sum, p) => sum + p.applicationCount, 0)} candidatures total
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}