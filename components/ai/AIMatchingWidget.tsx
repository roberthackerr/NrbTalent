// components/ai/AIMatchingWidget.tsx
"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { 
  Sparkles, 
  Users, 
  Building, 
  Target, 
  Star, 
  Briefcase, 
  Clock, 
  DollarSign,
  TrendingUp,
  Award,
  CheckCircle2,
  ArrowRight,
  Zap,
  Eye,
  MessageSquare,
  Heart,
  Share2
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AIMatchingWidgetProps {
  type: 'client' | 'freelancer'
  projectId?: string
  freelancerId?: string
  quickAction?: boolean
  maxResults?: number
  dict?: any
  lang?: string
}

interface MatchScore {
  overall: number
  skills: number
  experience: number
  budget: number
  availability: number
  compatibility: number
  matchGrade?: 'excellent' | 'good' | 'potential' | 'low'
}

interface Match {
  id: string
  matchScore: number
  score?: number
  matchGrade?: 'excellent' | 'good' | 'potential' | 'low'
  details?: MatchScore
  reason?: string
  project?: {
    _id: string
    title: string
    description: string
    budget: { min: number; max: number; currency: string }
    deadline: string
    skills: string[]
    category: string
    client?: { name: string; avatar?: string; rating?: number }
  }
  freelancer?: {
    _id: string
    name: string
    avatar?: string
    title?: string
    hourlyRate?: number
    skills: string[]
    rating?: number
    completedProjects?: number
    availability?: string
  }
}

export function AIMatchingWidget({ 
  type, 
  projectId, 
  freelancerId, 
  quickAction = false, 
  maxResults = 5,
  dict,
  lang = 'fr'
}: AIMatchingWidgetProps) {
  const router = useRouter()
  const params = useParams()
  const currentLang = lang || (params.lang as string) || 'fr'
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMatches()
  }, [projectId, freelancerId])

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const searchParams = new URLSearchParams()
      
      if (projectId) searchParams.append('projectId', projectId)
      if (freelancerId) searchParams.append('freelancerId', freelancerId)
      searchParams.append('limit', maxResults.toString())

      const response = await fetch(`/api/ai/matching?${searchParams}`)
      
      if (!response.ok) throw new Error('Failed to fetch matches')
      
      const data = await response.json()
      
      // Extraire les matches selon le type
      if (type === 'client' && data.matches) {
        setMatches(data.matches)
      } else if (type === 'freelancer' && data.recommendations) {
        setMatches(data.recommendations.map((rec: any) => ({
          ...rec.match,
          project: rec.project,
          id: rec.project?._id,
          matchGrade: rec.match.matchGrade || rec.matchType
        })))
      } else {
        setMatches([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const t = dict?.aiMatching || {}

  if (loading) {
    return <MatchingSkeleton type={type} dict={dict} />
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
            {t.errorTitle || 'Erreur de chargement'}
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={fetchMatches} variant="outline" className="border-red-300 hover:bg-red-100">
            {t.retry || 'Réessayer'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const title = type === 'client' 
    ? (t.clientTitle || 'Freelancers Recommandés')
    : (t.freelancerTitle || 'Projets Recommandés')
  
  const description = type === 'client'
    ? (t.clientDesc || 'Les meilleurs talents correspondant à vos besoins')
    : (t.freelancerDesc || 'Projets adaptés à votre profil')

  return (
    <Card className={cn(
      "border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300",
      quickAction && "border-blue-200 dark:border-blue-800 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20"
    )}>
      <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              {title}
              {quickAction && (
                <Badge variant="secondary" className="ml-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                  <Zap className="h-3 w-3 mr-1" />
                  AI
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {description}
            </CardDescription>
          </div>
          {!quickAction && matches.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
              onClick={() => router.push(`/${currentLang}/ai-matching/${type}s`)}
            >
              {t.viewAll || 'Voir tout'}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {matches.slice(0, maxResults).map((match, index) => (
            <MatchCard 
              key={match.id || index} 
              match={match} 
              type={type}
              dict={dict}
              lang={currentLang}
            />
          ))}
          {matches.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Target className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                {t.noMatches || 'Aucune recommandation trouvée'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                {t.noMatchesDesc || 'Ajustez vos critères ou complétez votre profil pour obtenir des recommandations personnalisées.'}
              </p>
            </div>
          )}
        </div>
        
        {!quickAction && matches.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25"
              onClick={() => router.push(`/${currentLang}/ai-matching/${type}s`)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {t.exploreMore || 'Explorer toutes les recommandations'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MatchCard({ match, type, dict, lang }: { match: Match; type: string; dict?: any; lang?: string }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const t = dict?.aiMatching || {}
  
  const score = match.matchScore || match.score || 0
  const matchGrade = match.matchGrade || 
    (score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'potential' : 'low')
  
  const gradeConfig = {
    excellent: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', label: t.gradeExcellent || 'Excellent' },
    good: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', label: t.gradeGood || 'Bon' },
    potential: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: t.gradePotential || 'Potentiel' },
    low: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', label: t.gradeLow || 'Faible' }
  }
  
  const grade = gradeConfig[matchGrade as keyof typeof gradeConfig] || gradeConfig.potential

  if (type === 'client' && match.freelancer) {
    const freelancer = match.freelancer
    return (
      <div className="group relative p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-300">
        {/* Score Badge */}
        <div className="absolute top-4 right-4">
          <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold", grade.bg, grade.color)}>
            <TrendingUp className="h-3 w-3" />
            <span>{Math.round(score)}%</span>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 border-2 border-white dark:border-slate-900 shadow-lg">
            <AvatarImage src={freelancer.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
              {freelancer.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-semibold text-slate-900 dark:text-white text-lg">
                {freelancer.name}
              </h4>
              {freelancer.rating && freelancer.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {freelancer.rating.toFixed(1)}
                  </span>
                </div>
              )}
              {freelancer.completedProjects && freelancer.completedProjects > 0 && (
                <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {freelancer.completedProjects} {t.projectsCompleted || 'projets'}
                </Badge>
              )}
              <Badge className={cn("text-xs", grade.bg, grade.color)}>
                {grade.label}
              </Badge>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              {freelancer.title || t.freelancer || 'Freelancer'}
            </p>
            
            {freelancer.skills && freelancer.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {freelancer.skills.slice(0, 4).map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-800">
                    {skill}
                  </Badge>
                ))}
                {freelancer.skills.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{freelancer.skills.length - 4}
                  </Badge>
                )}
              </div>
            )}
            
            {match.details && (
              <div className="mt-3">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                >
                  {expanded ? (t.showLess || 'Voir moins') : (t.matchDetails || 'Détails du match')}
                  <ArrowRight className={cn("h-3 w-3 transition-transform", expanded && "rotate-90")} />
                </button>
                
                {expanded && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2">
                    <MatchScoreDetails details={match.details} dict={dict} />
                    {match.reason && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                        💡 {match.reason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/${lang}/profile/${freelancer._id}`)}
            className="text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            {t.viewProfile || 'Voir profil'}
          </Button>
          <Button
            size="sm"
            onClick={() => router.push(`/${lang}/messages/new?user=${freelancer._id}`)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            {t.contact || 'Contacter'}
          </Button>
        </div>
      </div>
    )
  }
  
  if (type === 'freelancer' && match.project) {
    const project = match.project
    const daysLeft = project.deadline ? Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
    
    return (
      <div className="group relative p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-300">
        {/* Score Badge */}
        <div className="absolute top-4 right-4">
          <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold", grade.bg, grade.color)}>
            <TrendingUp className="h-3 w-3" />
            <span>{Math.round(score)}%</span>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <Briefcase className="h-7 w-7 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-semibold text-slate-900 dark:text-white text-lg">
                {project.title}
              </h4>
              <Badge className={cn("text-xs", grade.bg, grade.color)}>
                {grade.label}
              </Badge>
              {project.client?.rating && project.client.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {project.client.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
              {project.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mb-2">
              {project.budget && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  {project.budget.min} - {project.budget.max} {project.budget.currency}
                </span>
              )}
              {daysLeft !== null && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {daysLeft > 0 ? `${daysLeft} ${t.daysLeft || 'jours restants'}` : (t.urgent || 'Urgent')}
                </span>
              )}
            </div>
            
            {project.skills && project.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {project.skills.slice(0, 4).map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-800">
                    {skill}
                  </Badge>
                ))}
                {project.skills.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{project.skills.length - 4}
                  </Badge>
                )}
              </div>
            )}
            
            {match.details && (
              <div className="mt-3">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                >
                  {expanded ? (t.showLess || 'Voir moins') : (t.matchDetails || 'Détails du match')}
                  <ArrowRight className={cn("h-3 w-3 transition-transform", expanded && "rotate-90")} />
                </button>
                
                {expanded && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2">
                    <MatchScoreDetails details={match.details} dict={dict} />
                    {match.reason && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                        💡 {match.reason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/${lang}/projects/${project._id}`)}
            className="text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            {t.viewProject || 'Voir projet'}
          </Button>
          <Button
            size="sm"
            onClick={() => router.push(`/${lang}/projects/${project._id}/apply`)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs"
          >
            <Target className="h-3 w-3 mr-1" />
            {t.apply || 'Postuler'}
          </Button>
        </div>
      </div>
    )
  }
  
  return null
}

function MatchScoreDetails({ details, dict }: { details: MatchScore; dict?: any }) {
  const t = dict?.aiMatching?.scoreDetails || {}
  
  const metrics = [
    { key: 'skills', label: t.skills || 'Compétences', icon: Award },
    { key: 'experience', label: t.experience || 'Expérience', icon: Briefcase },
    { key: 'budget', label: t.budget || 'Budget', icon: DollarSign },
    { key: 'availability', label: t.availability || 'Disponibilité', icon: Clock },
    { key: 'compatibility', label: t.compatibility || 'Compatibilité', icon: Users }
  ]
  
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
        {t.title || 'Score détaillé'}
      </p>
      {metrics.map(metric => {
        const score = details[metric.key as keyof MatchScore]
        if (score === undefined) return null
        const Icon = metric.icon
        
        return (
          <div key={metric.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Icon className="h-3 w-3 text-slate-500" />
                <span className="text-slate-600 dark:text-slate-400">{metric.label}</span>
              </div>
              <span className="font-medium text-slate-700 dark:text-slate-300">{Math.round(score)}%</span>
            </div>
            <Progress value={score} className="h-1.5 bg-slate-200 dark:bg-slate-700" />
          </div>
        )
      })}
    </div>
  )
}

function MatchingSkeleton({ type, dict }: { type: string; dict?: any }) {
  const t = dict?.aiMatching || {}
  
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-4 w-64 mt-1" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-4">
              <Skeleton className="w-14 h-14 rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-24 rounded-lg" />
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}