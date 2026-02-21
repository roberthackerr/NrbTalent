"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle,CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Sparkles, Target, Zap, Clock, DollarSign, Users, ArrowRight, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface TalentMatchingProps {
  recommendations: any[]
  loading: boolean
  user: any
}

export function TalentMatching({ recommendations, loading, user }: TalentMatchingProps) {
  if (loading) {
    return <MatchingSkeleton />
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Connectez-vous pour voir vos recommandations
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Notre IA analysera votre profil pour vous trouver les projets parfaits
        </p>
        <Button>
          <Sparkles className="h-4 w-4 mr-2" />
          Se connecter
        </Button>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Aucune recommandation pour le moment
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Complétez votre profil pour recevoir des recommandations personnalisées
        </p>
        <Button>
          <Target className="h-4 w-4 mr-2" />
          Compléter mon profil
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Recommandations IA
            </h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Projets spécialement sélectionnés pour vous
          </p>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
          <Zap className="h-3 w-3 mr-1" />
          Powered by AI
        </Badge>
      </div>

      {/* Grid des recommandations */}
      <div className="grid gap-6 lg:grid-cols-2">
        {recommendations.map((project, index) => (
          <MatchingCard 
            key={project._id} 
            project={project} 
            priority={index < 2}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
        <Button variant="outline" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Améliorer mes recommandations
        </Button>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Sparkles className="h-4 w-4 mr-2" />
          Voir plus de recommandations
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function MatchingCard({ project, priority = false }: { project: any; priority?: boolean }) {
  const getMatchColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400"
    if (score >= 60) return "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
    if (score >= 40) return "text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400"
    return "text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400"
  }

  return (
    <Card className={cn(
      "border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 group",
      priority && "border-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {project.title}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {project.description}
            </CardDescription>
          </div>
          <Badge className={cn("text-xs font-semibold", getMatchColor(project.matchScore))}>
            {project.matchScore}% match
          </Badge>
        </div>

        {/* Raison du matching */}
        <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
          <Sparkles className="h-3 w-3" />
          <span>{project.reason}</span>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Compétences correspondantes */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-3 w-3 text-green-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Compétences correspondantes ({project.matchingSkills.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {project.matchingSkills.map((skill: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Détails du projet */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <DollarSign className="h-4 w-4" />
            <span>{project.budget?.amount?.toLocaleString()} {project.budget?.currency}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Clock className="h-4 w-4" />
            <span>{project.duration}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Users className="h-4 w-4" />
            <span>{project.applicationsCount} candidatures</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Star className="h-4 w-4 text-yellow-500" />
            <span>{project.clientRating}/5</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
        <Button variant="outline" size="sm">
          Voir les détails
        </Button>
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
          Postuler maintenant
        </Button>
      </CardFooter>
    </Card>
  )
}

function MatchingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="mb-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-14" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex gap-2 w-full">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}