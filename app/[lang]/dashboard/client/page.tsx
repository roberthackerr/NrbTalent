// app/dashboard/client/page.tsx - VERSION CORRIGÉE
"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building, Plus, Users, TrendingUp, Eye, EyeOff, Clock, CheckCircle2, DollarSign } from "lucide-react"
import Link from "next/link"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { AIMatchingWidget } from "@/components/ai/AIMatchingWidget"

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
  category: string
}

interface ClientStats {
  totalProjects: number
  activeProjects: number
  totalApplications: number
  matchingRate: number
  pendingApplications?: number
}

export default function ClientDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<ClientStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalApplications: 0,
    matchingRate: 85,
    pendingApplications: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClientData()
  }, [])

  const fetchClientData = async () => {
    try {
      const [projectsRes, statsRes] = await Promise.all([
        fetch('/api/projects/client?limit=5'),
        fetch('/api/stats/client')
      ])

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(Array.isArray(projectsData.projects) ? projectsData.projects : [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats({
          totalProjects: statsData.totalProjects || 0,
          activeProjects: statsData.activeProjects || 0,
          totalApplications: statsData.totalApplications || 0,
          matchingRate: statsData.matchingRate || 85,
          pendingApplications: statsData.pendingApplications || 0
        })
      }
    } catch (error) {
      console.error('Error fetching client data:', error)
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
        fetchClientData() // Recharger les données
      }
    } catch (error) {
      console.error('Error updating project visibility:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { label: 'Brouillon', variant: 'secondary' as const },
      'open': { label: 'Public', variant: 'default' as const },
      'in-progress': { label: 'En cours', variant: 'default' as const },
      'completed': { label: 'Terminé', variant: 'secondary' as const },
      'cancelled': { label: 'Annulé', variant: 'outline' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' }
    return <Badge variant={config.variant}>{config.label}</Badge>
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

  return (
    <div className="flex min-h-screen bg-gray-50/30">
      {/* Sidebar */}
      <DashboardSidebar role="client" />
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Client</h1>
                <p className="text-gray-600 mt-2">Gérez vos projets et trouvez des talents</p>
              </div>
              <Link href="/projects/create">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau Projet
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar Cards */}
              <div className="lg:col-span-1 space-y-6">
                {/* Navigation Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Navigation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Link href="/dashboard/client/projects" className="block py-2 px-3 rounded-lg bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition-colors">
                      Mes Projets
                    </Link>
                    <Link href="/contracts" className="block py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors">
                      Contrats
                    </Link>
                    <Link href="/ai-matching/clients" className="block py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors">
                      🎯 AI Matching
                    </Link>
                  </CardContent>
                </Card>

                {/* Stats Rapides */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Statistiques</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Projets actifs</span>
                      <span className="font-semibold">{stats.activeProjects}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total projets</span>
                      <span className="font-semibold">{stats.totalProjects}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Candidatures</span>
                      <span className="font-semibold">{stats.totalApplications}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">En attente</span>
                      <span className="font-semibold">{stats.pendingApplications}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-6">
                {/* 🎯 WIDGET AI MATCHING INTÉGRÉ */}
                <AIMatchingWidget 
                  type="client"
                  quickAction={true}
                  maxResults={3}
                />

                {/* Projets Récents */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Mes Projets Récents
                    </CardTitle>
                    <CardDescription>
                      Derniers projets créés et leur statut
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="animate-pulse flex justify-between items-center p-3 border rounded-lg">
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-32"></div>
                              <div className="h-3 bg-gray-200 rounded w-48"></div>
                            </div>
                            <div className="h-8 bg-gray-200 rounded w-24"></div>
                          </div>
                        ))}
                      </div>
                    ) : projects.length === 0 ? (
                      <div className="text-center py-8">
                        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Aucun projet créé pour le moment</p>
                        <Link href="/projects/create">
                          <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Créer votre premier projet
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {projects.map((project) => (
                          <div key={project._id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">{project.title}</h3>
                                {getStatusBadge(project.status)}
                                {getVisibilityBadge(project.visibility)}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {project.budget.min.toLocaleString()} - {project.budget.max.toLocaleString()} {project.budget.currency}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {project.applicationCount} candidature(s)
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
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
                                    <EyeOff className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Eye className="h-3 w-3 mr-1" />
                                  )}
                                  {project.visibility === 'public' ? 'Privé' : 'Public'}
                                </Button>
                              )}
                              <Link href={`/dashboard/client/projects/${project._id}/proposals`}>
                                <Button variant="outline" size="sm">
                                  <Users className="mr-2 h-3 w-3" />
                                  Voir candidatures
                                </Button>
                              </Link>
                              <Link href={`/projects/${project._id}`}>
                                <Button size="sm">
                                  Gérer
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{stats.matchingRate}%</div>
                          <div className="text-sm text-blue-700">Taux de Matching</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Users className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{stats.totalApplications}</div>
                          <div className="text-sm text-green-700">Candidatures Total</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <CheckCircle2 className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">{stats.activeProjects}</div>
                          <div className="text-sm text-purple-700">Projets Actifs</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}