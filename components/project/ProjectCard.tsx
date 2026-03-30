// components/project/ProjectCard.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  Eye, 
  Clock, 
  DollarSign, 
  MapPin, 
  Users, 
  Bookmark, 
  Share2, 
  Calendar,
  Star,
  CheckCircle,
  Zap,
  Building,
  Briefcase,
  Target,
  Award,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Project {
  _id: string
  title: string
  description: string
  category: string
  subcategory?: string
  skills: string[]
  budget: {
    min: number
    max: number
    type: 'fixed' | 'hourly'
    currency: string
  }
  deadline: string
  status: 'draft' | 'open' | 'in-progress' | 'completed' | 'cancelled'
  visibility: 'public' | 'private'
  applicationCount: number
  views: number
  createdAt: string
  client?: {
    _id: string
    name: string
    avatar?: string
    rating?: number
    completedProjects?: number
  }
  location?: {
    remote: boolean
    country?: string
    city?: string
  }
  urgency?: 'low' | 'medium' | 'high' | 'urgent' | 'very-urgent'
  featured?: boolean
  complexity?: 'beginner' | 'intermediate' | 'expert'
  hasApplied?: boolean
}

interface ProjectCardProps {
  project: Project
  /** Langue pour les labels */
  lang?: 'fr' | 'en' | 'mg'
  /** Variant d'affichage */
  variant?: 'compact' | 'default' | 'minimal'
  /** Afficher les actions (save, share) */
  showActions?: boolean
  /** Afficher le badge de correspondance des compétences */
  showMatchBadge?: boolean
  /** Compétences de l'utilisateur pour le calcul de correspondance */
  userSkills?: string[]
  /** Callback lors de la sauvegarde */
  onSave?: (project: Project) => void
  /** Callback lors du partage */
  onShare?: (project: Project) => void
  /** Callback lors de la candidature */
  onApply?: (project: Project) => void
  /** Callback lors du clic sur les détails */
  onDetail?: (project: Project) => void
  /** Classe additionnelle */
  className?: string
  /** Lien personnalisé vers les détails */
  detailLink?: string
}

const translations = {
  fr: {
    apply: 'Postuler',
    viewDetails: 'Voir les détails',
    save: 'Sauvegarder',
    share: 'Partager',
    saved: 'Sauvegardé',
    budgetNotSpecified: 'Budget non spécifié',
    expired: 'Expiré',
    today: "Aujourd'hui",
    day: 'jour',
    days: 'jours',
    weeks: 'semaines',
    months: 'mois',
    urgent: 'Urgent',
    featured: 'À la une',
    premium: 'Premium',
    openForApplications: 'Ouvert aux candidatures',
    inProgress: 'En cours',
    applications: 'candidatures',
    views: 'vues',
    remote: 'Télétravail',
    privateInvitation: 'Invitation uniquement',
    postedOn: 'Posté le',
    matchPercentage: '% de correspondance',
    requiredSkills: 'Compétences requises',
    by: 'par',
    rating: 'Note',
    projects: 'projets',
    deadline: 'Délai',
    budget: 'Budget'
  },
  en: {
    apply: 'Apply',
    viewDetails: 'View details',
    save: 'Save',
    share: 'Share',
    saved: 'Saved',
    budgetNotSpecified: 'Budget not specified',
    expired: 'Expired',
    today: 'Today',
    day: 'day',
    days: 'days',
    weeks: 'weeks',
    months: 'months',
    urgent: 'Urgent',
    featured: 'Featured',
    premium: 'Premium',
    openForApplications: 'Open for applications',
    inProgress: 'In progress',
    applications: 'applications',
    views: 'views',
    remote: 'Remote',
    privateInvitation: 'Invitation only',
    postedOn: 'Posted on',
    matchPercentage: '% match',
    requiredSkills: 'Required skills',
    by: 'by',
    rating: 'Rating',
    projects: 'projects',
    deadline: 'Deadline',
    budget: 'Budget'
  },
  mg: {
    apply: 'Mangataka',
    viewDetails: 'Jereo antsipiriany',
    save: 'Tehirizina',
    share: 'Zarao',
    saved: 'Voatahiry',
    budgetNotSpecified: 'Tsy voafaritra ny tetibola',
    expired: 'Lany daty',
    today: 'Anio',
    day: 'andro',
    days: 'andro',
    weeks: 'herinandro',
    months: 'volana',
    urgent: 'Maika',
    featured: 'Nasongadina',
    premium: 'Premium',
    openForApplications: 'Misokatra ny fangatahana',
    inProgress: 'Mitohy',
    applications: 'fangatahana',
    views: 'fijerena',
    remote: 'Lavitra',
    privateInvitation: 'Fanasana manokana',
    postedOn: 'Nampidirina tamin\'ny',
    matchPercentage: '% mifanentana',
    requiredSkills: 'Fahaizana ilaina',
    by: 'nataon\'i',
    rating: 'Naoty',
    projects: 'tetikasa',
    deadline: 'Fe-potoana',
    budget: 'Tetibola'
  }
}

export function ProjectCard({ 
  project,
  lang = 'fr',
  variant = 'default',
  showActions = true,
  showMatchBadge = true,
  userSkills = [],
  onSave,
  onShare,
  onApply,
  onDetail,
  className,
  detailLink
}: ProjectCardProps) {
  const t = translations[lang]
  const router = useRouter()
  const { data: session } = useSession()
  const [saved, setSaved] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Détecter mobile pour le layout
  useState(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const isUrgent = project.urgency === 'urgent' || project.urgency === 'very-urgent' || project.urgency === 'high'
  const isFeatured = project.featured
  const isPremium = project.client?.plan === 'premium' || project.client?.plan === 'enterprise'
  const isOpen = project.status === 'open'
  
  // Calcul du match des compétences
  const skillMatches = project.skills?.filter(skill => 
    userSkills.some(userSkill => 
      userSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(userSkill.toLowerCase())
    )
  ).length || 0
  const matchPercentage = project.skills?.length ? Math.round((skillMatches / project.skills.length) * 100) : 0

  const getMatchBadgeColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    if (percentage >= 50) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    if (percentage >= 30) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300'
  }

  const formatBudget = () => {
    if (!project.budget) return t.budgetNotSpecified
    if (project.budget.type === 'hourly') {
      return `${project.budget.min} - ${project.budget.max} ${project.budget.currency}/h`
    }
    return `${project.budget.min} - ${project.budget.max} ${project.budget.currency}`
  }

  const getTimeRemaining = () => {
    const now = new Date()
    const deadlineDate = new Date(project.deadline)
    const diffTime = deadlineDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return t.expired
    if (diffDays === 0) return t.today
    if (diffDays === 1) return `1 ${t.day}`
    if (diffDays < 7) return `${diffDays} ${t.days}`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} ${t.weeks}`
    return `${Math.ceil(diffDays / 30)} ${t.months}`
  }

  const handleSave = () => {
    setSaved(!saved)
    onSave?.(project)
  }

  const handleShare = () => {
    onShare?.(project)
  }

  const handleApply = () => {
    onApply?.(project)
  }

  const handleDetail = () => {
    if (onDetail) {
      onDetail(project)
    } else if (detailLink) {
      router.push(detailLink)
    } else {
      router.push(`/projects/${project._id}`)
    }
  }

  const detailHref = detailLink || `/projects/${project._id}`
  const isFreelance = session?.user?.role === 'freelance' || session?.user?.role === 'freelancer'
  const canApply = isOpen && isFreelance

  // Variant Compact
  if (variant === 'compact') {
    return (
      <Card className={cn(
        "border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group",
        isFeatured && "border-l-2 border-l-blue-500",
        className
      )}>
        <CardContent className="p-3">
          <Link href={detailHref}>
            <div className="flex items-start gap-3">
              {/* Avatar client */}
              <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-gray-800">
                <AvatarImage src={project.client?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                  {project.client?.name?.charAt(0).toUpperCase() || 'C'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600">
                    {project.title}
                  </h4>
                  {isUrgent && <Zap className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <DollarSign className="h-3 w-3" />
                  <span>{formatBudget()}</span>
                  <span>•</span>
                  <Clock className="h-3 w-3" />
                  <span>{getTimeRemaining()}</span>
                </div>
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Variant Minimal
  if (variant === 'minimal') {
    return (
      <Card className={cn(
        "border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group",
        isFeatured && "border-l-2 border-l-blue-500",
        className
      )}>
        <CardContent className="p-4">
          <Link href={detailHref}>
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-gray-800">
                <AvatarImage src={project.client?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {project.client?.name?.charAt(0).toUpperCase() || 'C'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600">
                    {project.title}
                  </h3>
                  {isUrgent && <Badge variant="outline" className="text-orange-500 border-orange-200 text-[10px]">Urgent</Badge>}
                  {isFeatured && <Badge variant="outline" className="text-blue-500 border-blue-200 text-[10px]">Featured</Badge>}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1 mt-1">
                  {project.description}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>{formatBudget()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{getTimeRemaining()}</span>
                  </div>
                  {project.location?.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{project.location.city}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Variant Default - Complet
  return (
    <Card className={cn(
      "border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 group",
      isFeatured && "border-l-2 sm:border-l-4 border-l-blue-500",
      isUrgent && "border-l-2 sm:border-l-4 border-l-orange-500",
      isPremium && "border-t-2 border-t-yellow-400",
      className
    )}>
      <CardContent className="p-3 sm:p-4 md:p-5">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Colonne principale */}
          <div className="flex-1">
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 
                    className="text-base sm:text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer"
                    onClick={handleDetail}
                  >
                    {project.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {isFeatured && (
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] sm:text-xs">
                        <Star className="h-2.5 w-2.5 mr-0.5" />
                        {t.featured}
                      </Badge>
                    )}
                    {isUrgent && (
                      <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-[10px] sm:text-xs">
                        <Zap className="h-2.5 w-2.5 mr-0.5" />
                        {t.urgent}
                      </Badge>
                    )}
                    {isPremium && (
                      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-[10px] sm:text-xs">
                        <Award className="h-2.5 w-2.5 mr-0.5" />
                        {t.premium}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {project.description}
                </p>
              </div>

              {/* Actions rapides */}
              {showActions && !isMobile && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSave}
                    className="h-8 w-8 opacity-60 hover:opacity-100"
                    title={saved ? t.saved : t.save}
                  >
                    <Bookmark className={cn("h-4 w-4", saved && "fill-current text-blue-500")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShare}
                    className="h-8 w-8 opacity-60 hover:opacity-100"
                    title={t.share}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Client info */}
            {project.client && (
              <div className="flex items-center gap-2 mb-3">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={project.client.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-[10px]">
                    {project.client.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-slate-500">
                  {t.by} <span className="font-medium text-slate-700 dark:text-slate-300">{project.client.name}</span>
                  {project.client.rating && (
                    <span className="ml-1 flex items-center gap-0.5 inline-flex">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span>{project.client.rating.toFixed(1)}</span>
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Métadonnées */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-3 text-xs sm:text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-green-600" />
                <span className="font-medium text-slate-700 dark:text-slate-300">{formatBudget()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{getTimeRemaining()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>{project.applicationCount || 0} {t.applications}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                <span>{project.views || 0} {t.views}</span>
              </div>
            </div>

            {/* Localisation */}
            {project.location && (
              <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                <span>
                  {project.location.remote ? t.remote : ''}
                  {project.location.city && !project.location.remote && project.location.city}
                  {project.location.country && `, ${project.location.country}`}
                </span>
                {project.visibility === 'private' && (
                  <>
                    <span className="mx-1">•</span>
                    <div className="flex items-center gap-1 text-blue-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>{t.privateInvitation}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Compétences */}
            {project.skills && project.skills.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t.requiredSkills}
                  </h4>
                  {showMatchBadge && matchPercentage > 0 && (
                    <Badge className={cn(getMatchBadgeColor(matchPercentage), "text-[10px]")}>
                      <Target className="h-2.5 w-2.5 mr-0.5" />
                      {matchPercentage}{t.matchPercentage}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {project.skills.slice(0, isMobile ? 4 : 6).map((skill, index) => {
                    const isMatched = userSkills.some(userSkill => 
                      userSkill.toLowerCase().includes(skill.toLowerCase()) ||
                      skill.toLowerCase().includes(userSkill.toLowerCase())
                    )
                    return (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className={cn(
                          "text-[10px] sm:text-xs",
                          isMatched && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        )}
                      >
                        {skill}
                        {isMatched && <CheckCircle className="h-2.5 w-2.5 ml-0.5" />}
                      </Badge>
                    )
                  })}
                  {project.skills.length > (isMobile ? 4 : 6) && (
                    <Badge variant="outline" className="text-[10px]">
                      +{project.skills.length - (isMobile ? 4 : 6)} {t.otherSkills}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Date de publication */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Calendar className="h-3 w-3" />
              <span>{t.postedOn} {new Date(project.createdAt).toLocaleDateString()}</span>
              {project.complexity && (
                <>
                  <span className="mx-1">•</span>
                  <span className="capitalize">{project.complexity}</span>
                </>
              )}
            </div>
          </div>

          {/* Colonne d'action */}
          <div className="flex flex-row md:flex-col justify-between md:justify-center gap-2 md:w-40 lg:w-48">
            <div className="text-left md:text-right">
              <div className="text-[10px] sm:text-xs text-slate-500">
                {isOpen ? "🔴 " + t.openForApplications : "🟡 " + t.inProgress}
              </div>
            </div>
            
            <div className="flex flex-row md:flex-col gap-2">
              <Button 
                onClick={handleApply}
                size="sm"
                disabled={!canApply}
                className={cn(
                  "font-semibold text-sm flex-1 md:w-full",
                  canApply
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" 
                    : "bg-gray-300 dark:bg-gray-700 opacity-60 cursor-not-allowed"
                )}
              >
                {t.apply}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 md:w-full text-sm"
                onClick={handleDetail}
              >
                <span className="hidden sm:inline">{t.viewDetails}</span>
                <ExternalLink className="sm:hidden h-4 w-4" />
              </Button>
            </div>

            {/* Actions mobiles */}
            {showActions && isMobile && (
              <div className="flex justify-center gap-2 mt-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSave}
                  className="h-8 w-8"
                  title={saved ? t.saved : t.save}
                >
                  <Bookmark className={cn("h-4 w-4", saved && "fill-current text-blue-500")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="h-8 w-8"
                  title={t.share}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton pour le chargement
export function ProjectCardSkeleton({ variant = 'default' }: { variant?: 'compact' | 'default' | 'minimal' }) {
  if (variant === 'compact') {
    return (
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-3 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'minimal') {
    return (
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 animate-pulse">
          <div className="flex gap-3">
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardContent className="p-4 animate-pulse">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-14" />
            </div>
          </div>
          <div className="md:w-32 lg:w-40">
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}