"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Eye, 
  Clock, 
  DollarSign, 
  MapPin, 
  Users, 
  Sparkles, 
  Bookmark, 
  Share2, 
  Calendar,
  Star,
  CheckCircle,
  Zap,
  Building,
  Globe,
  Briefcase,
  Target,
  TrendingUp,
  Award
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react" // Ajouté pour gérer les données

interface ProjectsGridProps {
  projects: any[]
  loading: boolean
  searchQuery: string
  onRefresh?: () => void
  pagination?: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  onPageChange?: (page: number) => void
}

export function ProjectsGrid({ 
  projects, 
  loading, 
  searchQuery, 
  onRefresh,
  pagination,
  onPageChange 
}: ProjectsGridProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user

  const handleSaveProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId })
      })

      if (response.ok) {
        toast.success("Projet sauvegardé dans vos favoris!")
      } else {
        throw new Error('Failed to save project')
      }
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde")
    }
  }

  const handleApply = (projectId: string) => {
    router.push(`/projects/${projectId}/apply`)
  }
  
  const handleDetail = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  const handleShare = async (project: any) => {
    const shareData = {
      title: project.title,
      text: `Découvrez ce projet : ${project.title} - ${project.description?.substring(0, 100)}...`,
      url: `${window.location.origin}/projects/${project._id}`
    }
    
    if (navigator.share) {
      try {
        await navigator.share(shareData)
        toast.success("Projet partagé avec succès!")
      } catch (err) {
        console.log('Erreur de partage:', err)
      }
    } else {
      // Fallback: copier le lien
      navigator.clipboard.writeText(shareData.url)
      toast.success("Lien copié dans le presse-papier!")
    }
  }

  const formatBudget = (budget: any) => {
    if (!budget) return "Budget non spécifié"
    
    if (budget.type === "hourly") {
      return `${budget.min} - ${budget.max} ${budget.currency}/h`
    }
    return `${budget.min} - ${budget.max} ${budget.currency}`
  }

  const getTimeRemaining = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return "Expiré"
    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return "1 jour"
    if (diffDays < 7) return `${diffDays} jours`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} semaines`
    return `${Math.ceil(diffDays / 30)} mois`
  }

  const getBudgetRangePosition = (budget: any, proposed?: number) => {
    if (!budget || !proposed) return { position: 0, type: 'default' }
    
    const range = budget.max - budget.min
    if (range <= 0) return { position: 0, type: 'default' }
    
    const position = ((proposed - budget.min) / range) * 100
    let type = 'competitive'
    
    if (proposed < budget.min) type = 'below'
    else if (proposed > budget.max) type = 'above'
    else if (proposed < budget.min + (range * 0.3)) type = 'competitive'
    else if (proposed > budget.min + (range * 0.7)) type = 'premium'
    else type = 'average'
    
    return { position: Math.min(100, Math.max(0, position)), type }
  }

  const getSkillMatchCount = (projectSkills: string[], userSkills: string[] = []) => {
    if (!projectSkills || !userSkills) return 0
    return projectSkills.filter(skill => 
      userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    ).length
  }

  if (loading) {
    return <ProjectsGridSkeleton />
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="h-16 w-16 text-blue-500" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
          {searchQuery ? "Aucun projet trouvé" : "Aucun projet disponible pour le moment"}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-lg mb-8 max-w-md mx-auto">
          {searchQuery 
            ? "Essayez d'élargir vos critères de recherche ou découvrez d'autres opportunités"
            : "Soyez le premier à être notifié quand de nouveaux projets seront publiés"
          }
        </p>
        <div className="flex gap-4 justify-center">
          {searchQuery ? (
            <Button onClick={onRefresh} size="lg">
              Voir tous les projets
            </Button>
          ) : (
            <Button size="lg" onClick={() => router.push('/projects/create')}>
              <Briefcase className="h-4 w-4 mr-2" />
              Publier votre premier projet
            </Button>
          )}
          <Button variant="outline" size="lg" onClick={() => router.push('/categories')}>
            Explorer les catégories
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Projets disponibles
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg mt-2">
            {pagination?.totalCount || projects.length} opportunité{(pagination?.totalCount || projects.length) > 1 ? 's' : ''} correspondant à vos compétences
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => {
              if (onRefresh) onRefresh()
            }}
          >
            <Sparkles className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Liste des projets */}
      <div className="space-y-4">
        {projects.map((project) => (
          <ProjectCard 
            key={project._id || project.id} 
            project={project} 
            onSave={handleSaveProject}
            onApply={handleApply}
            onDetail={handleDetail}
            onShare={handleShare}
            formatBudget={formatBudget}
            getTimeRemaining={getTimeRemaining}
            getBudgetRangePosition={getBudgetRangePosition}
            getSkillMatchCount={getSkillMatchCount}
            userSkills={user?.skills || []}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center pt-8">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
            >
              ← Précédent
            </Button>
            
            {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
              const pageNum = index + 1
              return (
                <Button
                  key={pageNum}
                  variant={pagination.page === pageNum ? "default" : "outline"}
                  size="lg"
                  onClick={() => onPageChange && onPageChange(pageNum)}
                  className={pagination.page === pageNum ? "bg-blue-600 text-white" : ""}
                >
                  {pageNum}
                </Button>
              )
            })}
            
            {pagination.totalPages > 5 && (
              <span className="px-3 py-2 text-slate-500">...</span>
            )}
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              Suivant →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectCard({ 
  project, 
  onSave, 
  onApply, 
  onDetail, 
  onShare,
  formatBudget, 
  getTimeRemaining, 
  getBudgetRangePosition,
  getSkillMatchCount,
  userSkills = []
}: any) {
  const { data: session } = useSession()
  const router = useRouter()
  
  const isUrgent = project.urgency === "urgent" || project.urgency === "very-urgent"
  const isFeatured = project.featured
  const isPremium = project.client?.plan === "premium" || project.client?.plan === "enterprise"
  const skillMatches = getSkillMatchCount(project.skills || [], userSkills)
  const matchPercentage = project.skills?.length ? Math.round((skillMatches / project.skills.length) * 100) : 0

  const getMatchBadgeColor = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
    if (percentage >= 50) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    if (percentage >= 30) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
    return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300"
  }

  return (
    <Card className={cn(
      "border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 group",
      isFeatured && "border-l-4 border-l-blue-500",
      isUrgent && "border-l-4 border-l-orange-500",
      isPremium && "border-t-2 border-t-yellow-400"
    )}>
      <CardContent className="p-6">
        <div className="flex gap-6">
          {/* Colonne principale */}
          <div className="flex-1">
            {/* En-tête avec titre et badges */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 cursor-pointer"
                    onClick={() => onDetail(project._id)}
                  >
                    {project.title}
                  </h3>
                  
                  <div className="flex gap-2">
                    {isFeatured && (
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    {isUrgent && (
                      <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                        <Zap className="h-3 w-3 mr-1" />
                        Urgent
                      </Badge>
                    )}
                    {isPremium && (
                      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                        <Award className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                  {project.description}
                </p>
              </div>

              {/* Actions rapides */}
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSave(project._id)}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onShare(project)}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Métadonnées */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Budget et délai */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">{formatBudget(project.budget)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Clock className="h-4 w-4" />
                  <span>{getTimeRemaining(project.deadline)}</span>
                </div>
              </div>

              {/* Client et localisation */}
              <div className="flex items-center gap-4 text-sm">
                {project.client && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Building className="h-4 w-4" />
                    <span>{project.client.name}</span>
                    {project.client.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-slate-500">{project.client.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                )}
                {project.location && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <MapPin className="h-4 w-4" />
                    <span>{project.location.city || project.location.country || 'Télétravail'}</span>
                  </div>
                )}
              </div>

              {/* Statistiques */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Users className="h-4 w-4" />
                  <span>{project.applicationCount || 0} candidatures</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Eye className="h-4 w-4" />
                  <span>{project.views || 0} vues</span>
                </div>
              </div>
            </div>

            {/* Compétences requises */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Compétences requises:
                </h4>
                {skillMatches > 0 && (
                  <Badge className={getMatchBadgeColor(matchPercentage)}>
                    <Target className="h-3 w-3 mr-1" />
                    {matchPercentage}% de correspondance
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {project.skills?.slice(0, 8).map((skill: string, index: number) => {
                  const isMatched = userSkills.some((userSkill: string) => 
                    userSkill.toLowerCase().includes(skill.toLowerCase()) ||
                    skill.toLowerCase().includes(userSkill.toLowerCase())
                  )
                  return (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className={cn(
                        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                        isMatched && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                      )}
                    >
                      {skill}
                      {isMatched && <CheckCircle className="h-3 w-3 ml-1" />}
                    </Badge>
                  )
                })}
                {project.skills && project.skills.length > 8 && (
                  <Badge variant="outline" className="text-slate-500">
                    +{project.skills.length - 8} autres
                  </Badge>
                )}
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Posté le {new Date(project.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
              {project.complexity && (
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="capitalize">{project.complexity}</span>
                </div>
              )}
              {project.visibility === "private" && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-blue-600 dark:text-blue-400">Invitation uniquement</span>
                </div>
              )}
            </div>
          </div>

          {/* Colonne d'action */}
          <div className="flex flex-col justify-between w-48">
            <div className="text-right">
              <div className="text-xs text-slate-500 dark:text-slate-500 mb-2">
                {project.status === "open" ? "🔴 Ouvert aux candidatures" : "🟡 En cours"}
              </div>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => onApply(project._id)}
                size="lg"
                disabled={session?.user?.role !== "freelance" && session?.user?.role !== "freelancer"}
                className={`font-semibold w-full ${
                  session?.user?.role === "freelance" || session?.user?.role === "freelancer"
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "bg-gray-400 opacity-60 cursor-not-allowed"
                }`}
              >
                Postuler
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full border-slate-300 dark:border-slate-600"
                size="sm"
                onClick={() => onDetail(project._id)}
              >
                Voir les détails
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectsGridSkeleton() {
  return (
    <div className="space-y-6">
      {/* En-tête skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Liste des projets skeleton */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <div className="flex gap-6">
                <div className="flex-1">
                  {/* En-tête */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Skeleton className="h-7 w-3/4" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>

                  {/* Métadonnées */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>

                  {/* Compétences */}
                  <div className="mb-4">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-14" />
                    </div>
                  </div>

                  {/* Informations supplémentaires */}
                  <div className="flex gap-6">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>

                {/* Colonne action */}
                <div className="w-48">
                  <div className="text-right mb-4">
                    <Skeleton className="h-3 w-20 ml-auto" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}