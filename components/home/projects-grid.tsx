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
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

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
  lang?: 'fr' | 'en' | 'mg'
}

// Traductions
const translations = {
  fr: {
    projectsAvailable: "Projets disponibles",
    opportunities: "opportunité(s) correspondant à vos compétences",
    refresh: "Actualiser",
    noProjectsFound: "Aucun projet trouvé",
    noProjectsAvailable: "Aucun projet disponible pour le moment",
    tryExpandSearch: "Essayez d'élargir vos critères de recherche ou découvrez d'autres opportunités",
    beFirstNotified: "Soyez le premier à être notifié quand de nouveaux projets seront publiés",
    viewAllProjects: "Voir tous les projets",
    publishFirstProject: "Publier votre premier projet",
    exploreCategories: "Explorer les catégories",
    previous: "Précédent",
    next: "Suivant",
    savedToFavorites: "Projet sauvegardé dans vos favoris!",
    saveError: "Erreur lors de la sauvegarde",
    shareSuccess: "Projet partagé avec succès!",
    linkCopied: "Lien copié dans le presse-papier!",
    budgetNotSpecified: "Budget non spécifié",
    expired: "Expiré",
    today: "Aujourd'hui",
    day: "jour",
    days: "jours",
    weeks: "semaines",
    months: "mois",
    urgent: "Urgent",
    featured: "Featured",
    premium: "Premium",
    requiredSkills: "Compétences requises:",
    matchPercentage: "% de correspondance",
    otherSkills: "autres",
    postedOn: "Posté le",
    openForApplications: "Ouvert aux candidatures",
    inProgress: "En cours",
    apply: "Postuler",
    viewDetails: "Voir les détails",
    applications: "candidatures",
    views: "vues",
    remote: "Télétravail",
    privateInvitation: "Invitation uniquement"
  },
  en: {
    projectsAvailable: "Available Projects",
    opportunities: "opportunities matching your skills",
    refresh: "Refresh",
    noProjectsFound: "No projects found",
    noProjectsAvailable: "No projects available at the moment",
    tryExpandSearch: "Try expanding your search criteria or discover other opportunities",
    beFirstNotified: "Be the first to be notified when new projects are published",
    viewAllProjects: "View all projects",
    publishFirstProject: "Publish your first project",
    exploreCategories: "Explore categories",
    previous: "Previous",
    next: "Next",
    savedToFavorites: "Project saved to favorites!",
    saveError: "Error saving project",
    shareSuccess: "Project shared successfully!",
    linkCopied: "Link copied to clipboard!",
    budgetNotSpecified: "Budget not specified",
    expired: "Expired",
    today: "Today",
    day: "day",
    days: "days",
    weeks: "weeks",
    months: "months",
    urgent: "Urgent",
    featured: "Featured",
    premium: "Premium",
    requiredSkills: "Required skills:",
    matchPercentage: "% match",
    otherSkills: "more",
    postedOn: "Posted on",
    openForApplications: "Open for applications",
    inProgress: "In progress",
    apply: "Apply",
    viewDetails: "View details",
    applications: "applications",
    views: "views",
    remote: "Remote",
    privateInvitation: "Invitation only"
  },
  mg: {
    projectsAvailable: "Tetikasa azo",
    opportunities: "tetikasa mifanaraka amin'ny fahaizanao",
    refresh: "Havaozina",
    noProjectsFound: "Tsy misy tetikasa hita",
    noProjectsAvailable: "Tsy misy tetikasa amin'izao fotoana izao",
    tryExpandSearch: "Andramo hanova ny fikarohanao na hitadia tetikasa hafa",
    beFirstNotified: "Ampandrenesina rehefa misy tetikasa vaovao",
    viewAllProjects: "Hijery tetikasa rehetra",
    publishFirstProject: "Hametraka tetikasa voalohany",
    exploreCategories: "Hijery sokajy",
    previous: "Teo aloha",
    next: "Manaraka",
    savedToFavorites: "Voatahiry ny tetikasa!",
    saveError: "Tsy voatahiry ny tetikasa",
    shareSuccess: "Nizara ny tetikasa!",
    linkCopied: "Nadika ny rohy!",
    budgetNotSpecified: "Tsy voafaritra ny tetibola",
    expired: "Lany daty",
    today: "Anio",
    day: "andro",
    days: "andro",
    weeks: "herinandro",
    months: "volana",
    urgent: "Maika",
    featured: "Nasongadina",
    premium: "Premium",
    requiredSkills: "Fahaizana ilaina:",
    matchPercentage: "% mifanentana",
    otherSkills: "hafa",
    postedOn: "Nampidirina tamin'ny",
    openForApplications: "Misokatra ny fangatahana",
    inProgress: "Mitohy",
    apply: "Mangataka",
    viewDetails: "Jereo antsipiriany",
    applications: "fangatahana",
    views: "fijerena",
    remote: "Lavitra",
    privateInvitation: "Fanasana manokana"
  }
}

export function ProjectsGrid({ 
  projects, 
  loading, 
  searchQuery, 
  onRefresh,
  pagination,
  onPageChange,
  lang = 'fr'
}: ProjectsGridProps) {
  const t = translations[lang]
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user
  const [isMobile, setIsMobile] = useState(false)

  // Détecter mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
        toast.success(t.savedToFavorites)
      } else {
        throw new Error('Failed to save project')
      }
    } catch (error) {
      toast.error(t.saveError)
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
      text: `Découvrez ce projet : ${project.title}`,
      url: `${window.location.origin}/projects/${project._id}`
    }
    
    if (navigator.share) {
      try {
        await navigator.share(shareData)
        toast.success(t.shareSuccess)
      } catch (err) {
        console.log('Erreur de partage:', err)
      }
    } else {
      navigator.clipboard.writeText(shareData.url)
      toast.success(t.linkCopied)
    }
  }

  const formatBudget = (budget: any) => {
    if (!budget) return t.budgetNotSpecified
    
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
    
    if (diffDays < 0) return t.expired
    if (diffDays === 0) return t.today
    if (diffDays === 1) return `1 ${t.day}`
    if (diffDays < 7) return `${diffDays} ${t.days}`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} ${t.weeks}`
    return `${Math.ceil(diffDays / 30)} ${t.months}`
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
    return <ProjectsGridSkeleton lang={lang} />
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 md:py-16">
        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-blue-500" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 sm:mb-3">
          {searchQuery ? t.noProjectsFound : t.noProjectsAvailable}
        </h3>
        <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 mb-6 sm:mb-8 max-w-md mx-auto px-4">
          {searchQuery ? t.tryExpandSearch : t.beFirstNotified}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
          {searchQuery ? (
            <Button onClick={onRefresh} size={isMobile ? "default" : "lg"}>
              {t.viewAllProjects}
            </Button>
          ) : (
            <Button size={isMobile ? "default" : "lg"} onClick={() => router.push('/projects/create')}>
              <Briefcase className="h-4 w-4 mr-2" />
              {t.publishFirstProject}
            </Button>
          )}
          <Button variant="outline" size={isMobile ? "default" : "lg"} onClick={() => router.push('/categories')}>
            {t.exploreCategories}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            {t.projectsAvailable}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1 sm:mt-2">
            {pagination?.totalCount || projects.length} {t.opportunities}
          </p>
        </div>
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"}
          className="flex items-center gap-2"
          onClick={() => onRefresh && onRefresh()}
        >
          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="text-sm">{t.refresh}</span>
        </Button>
      </div>

      {/* Liste des projets */}
      <div className="space-y-3 sm:space-y-4">
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
            getSkillMatchCount={getSkillMatchCount}
            userSkills={user?.skills || []}
            lang={lang}
            translations={t}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center pt-6 sm:pt-8">
          <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
            <Button 
              variant="outline" 
              size={isMobile ? "sm" : "default"}
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="text-sm"
            >
              ← {!isMobile && t.previous}
            </Button>
            
            {Array.from({ length: Math.min(isMobile ? 3 : 5, pagination.totalPages) }, (_, i) => {
              let pageNum
              if (isMobile) {
                // Pagination compacte mobile
                const pages = []
                for (let j = Math.max(1, pagination.page - 1); j <= Math.min(pagination.totalPages, pagination.page + 1); j++) {
                  pages.push(j)
                }
                pageNum = pages[i]
                if (!pageNum) return null
              } else {
                pageNum = i + 1
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={pagination.page === pageNum ? "default" : "outline"}
                  size={isMobile ? "sm" : "default"}
                  onClick={() => onPageChange && onPageChange(pageNum)}
                  className={cn(
                    pagination.page === pageNum ? "bg-blue-600 text-white" : "",
                    "min-w-[2.5rem]"
                  )}
                >
                  {pageNum}
                </Button>
              )
            })}
            
            {!isMobile && pagination.totalPages > 5 && (
              <span className="px-2 py-2 text-slate-500">...</span>
            )}
            
            <Button 
              variant="outline" 
              size={isMobile ? "sm" : "default"}
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="text-sm"
            >
              {!isMobile && t.next} →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Composant ProjectCard responsive
function ProjectCard({ 
  project, 
  onSave, 
  onApply, 
  onDetail, 
  onShare,
  formatBudget, 
  getTimeRemaining, 
  getSkillMatchCount,
  userSkills = [],
  lang,
  translations: t,
  isMobile = false
}: any) {
  const { data: session } = useSession()
  const router = useRouter()
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false)
  
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
      isFeatured && "border-l-2 sm:border-l-4 border-l-blue-500",
      isUrgent && "border-l-2 sm:border-l-4 border-l-orange-500",
      isPremium && "border-t-2 border-t-yellow-400"
    )}>
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Colonne principale */}
          <div className="flex-1">
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3 sm:mb-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 
                    className="text-base sm:text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 cursor-pointer flex-1"
                    onClick={() => onDetail(project._id)}
                  >
                    {project.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {isFeatured && (
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] sm:text-xs">
                        <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" />
                        {t.featured}
                      </Badge>
                    )}
                    {isUrgent && (
                      <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-[10px] sm:text-xs">
                        <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" />
                        {t.urgent}
                      </Badge>
                    )}
                    {isPremium && (
                      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-[10px] sm:text-xs">
                        <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" />
                        {t.premium}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 sm:mb-4">
                  {project.description}
                </p>
              </div>

              {/* Actions rapides - Desktop */}
              {!isMobile && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onSave(project._id)}
                    className="h-8 w-8 opacity-60 hover:opacity-100"
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onShare(project)}
                    className="h-8 w-8 opacity-60 hover:opacity-100"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Métadonnées - Layout responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                  <span className="font-semibold text-xs sm:text-sm">{formatBudget(project.budget)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">{getTimeRemaining(project.deadline)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                {project.client && (
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="truncate max-w-[100px] sm:max-w-[150px]">{project.client.name}</span>
                    {project.client.rating && (
                      <div className="flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-500 fill-current" />
                        <span className="text-xs">{project.client.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                )}
                {project.location && (
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">
                      {project.location.city || project.location.country || t.remote}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{project.applicationCount || 0} {t.applications}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{project.views || 0} {t.views}</span>
                </div>
              </div>
            </div>

            {/* Compétences */}
            <div className="mb-3 sm:mb-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t.requiredSkills}
                </h4>
                {skillMatches > 0 && (
                  <Badge className={cn(getMatchBadgeColor(matchPercentage), "text-[10px] sm:text-xs")}>
                    <Target className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" />
                    {matchPercentage}{t.matchPercentage}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {project.skills?.slice(0, isMobile ? 6 : 8).map((skill: string, index: number) => {
                  const isMatched = userSkills.some((userSkill: string) => 
                    userSkill.toLowerCase().includes(skill.toLowerCase()) ||
                    skill.toLowerCase().includes(userSkill.toLowerCase())
                  )
                  return (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className={cn(
                        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px] sm:text-xs",
                        isMatched && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                      )}
                    >
                      {skill}
                      {isMatched && <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-0.5" />}
                    </Badge>
                  )
                })}
                {project.skills && project.skills.length > (isMobile ? 6 : 8) && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    +{project.skills.length - (isMobile ? 6 : 8)} {t.otherSkills}
                  </Badge>
                )}
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-[10px] sm:text-xs text-slate-500 dark:text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>{t.postedOn} {new Date(project.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
              {project.complexity && (
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="capitalize">{project.complexity}</span>
                </div>
              )}
              {project.visibility === "private" && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500" />
                  <span className="text-blue-600 dark:text-blue-400">{t.privateInvitation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Colonne d'action - Desktop */}
          {!isMobile ? (
            <div className="flex flex-col justify-between w-40 sm:w-48">
              <div className="text-right mb-3">
                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500">
                  {project.status === "open" ? "🔴 " + t.openForApplications : "🟡 " + t.inProgress}
                </div>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => onApply(project._id)}
                  size="default"
                  disabled={session?.user?.role !== "freelance" && session?.user?.role !== "freelancer"}
                  className={cn(
                    "font-semibold w-full text-sm",
                    (session?.user?.role === "freelance" || session?.user?.role === "freelancer")
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "bg-gray-400 opacity-60 cursor-not-allowed"
                  )}
                >
                  {t.apply}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full border-slate-300 dark:border-slate-600 text-sm"
                  size="default"
                  onClick={() => onDetail(project._id)}
                >
                  {t.viewDetails}
                </Button>
              </div>
            </div>
          ) : (
            // Actions mobiles - Bottom sheet
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => onApply(project._id)}
                  size="sm"
                  disabled={session?.user?.role !== "freelance" && session?.user?.role !== "freelancer"}
                  className={cn(
                    "flex-1 text-sm",
                    (session?.user?.role === "freelance" || session?.user?.role === "freelancer")
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "bg-gray-400 opacity-60 cursor-not-allowed"
                  )}
                >
                  {t.apply}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 text-sm"
                  onClick={() => onDetail(project._id)}
                >
                  {t.viewDetails}
                </Button>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onSave(project._id)}
                    className="h-8 w-8"
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onShare(project)}
                    className="h-8 w-8"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="text-center mt-2">
                <div className="text-[10px] text-slate-500 dark:text-slate-500">
                  {project.status === "open" ? "🔴 " + t.openForApplications : "🟡 " + t.inProgress}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton responsive
function ProjectsGridSkeleton({ lang = 'fr' }: { lang?: string }) {
  const t = translations[lang as keyof typeof translations] || translations.fr
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* En-tête skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <Skeleton className="h-7 sm:h-10 w-48 sm:w-64 mb-1 sm:mb-2" />
          <Skeleton className="h-4 sm:h-5 w-32 sm:w-48" />
        </div>
        <Skeleton className="h-8 sm:h-9 w-20 sm:w-24" />
      </div>

      {/* Liste des projets skeleton */}
      <div className="space-y-3 sm:space-y-4">
        {[...Array(isMobile ? 3 : 5)].map((_, i) => (
          <Card key={i} className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                <div className="flex-1">
                  {/* En-tête */}
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3 sm:mb-4">
                    <div className="flex-1">
                      <Skeleton className="h-5 sm:h-6 md:h-7 w-3/4 mb-2" />
                      <Skeleton className="h-3 sm:h-4 w-full mb-1" />
                      <Skeleton className="h-3 sm:h-4 w-2/3" />
                    </div>
                  </div>

                  {/* Métadonnées */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="flex gap-3">
                      <Skeleton className="h-3 sm:h-4 w-16" />
                      <Skeleton className="h-3 sm:h-4 w-12" />
                    </div>
                    <Skeleton className="h-3 sm:h-4 w-32" />
                    <Skeleton className="h-3 sm:h-4 w-24" />
                  </div>

                  {/* Compétences */}
                  <div className="mb-3 sm:mb-4">
                    <Skeleton className="h-3 sm:h-4 w-24 mb-2" />
                    <div className="flex gap-1.5 sm:gap-2">
                      <Skeleton className="h-5 sm:h-6 w-14" />
                      <Skeleton className="h-5 sm:h-6 w-16" />
                      <Skeleton className="h-5 sm:h-6 w-12" />
                    </div>
                  </div>

                  {/* Informations supplémentaires */}
                  <div className="flex gap-3 sm:gap-6">
                    <Skeleton className="h-3 sm:h-4 w-20" />
                    <Skeleton className="h-3 sm:h-4 w-16" />
                  </div>
                </div>

                {/* Colonne action skeleton */}
                <div className={cn(
                  isMobile ? "mt-3 pt-3 border-t border-slate-200" : "w-40 sm:w-48",
                  "flex flex-col justify-between"
                )}>
                  <div className={cn(
                    "space-y-2",
                    isMobile ? "flex flex-row gap-2" : ""
                  )}>
                    <Skeleton className={cn(
                      "h-8 sm:h-9",
                      isMobile ? "flex-1" : "w-full"
                    )} />
                    <Skeleton className={cn(
                      "h-8 sm:h-9",
                      isMobile ? "flex-1" : "w-full mt-2"
                    )} />
                    {isMobile && (
                      <div className="flex gap-1">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    )}
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