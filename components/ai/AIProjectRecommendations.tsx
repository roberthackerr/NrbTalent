// components/ai/AIProjectRecommendations.tsx
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Building, Calendar, DollarSign, Target } from "lucide-react"
import Link from 'next/link'

interface AIProjectRecommendationsProps {
  freelancerId?: string
  maxRecommendations?: number
  showFilters?: boolean
}

export function AIProjectRecommendations({ 
  freelancerId,
  maxRecommendations = 5,
  showFilters = false
}: AIProjectRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRecommendations()
  }, [freelancerId])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      const searchParams = new URLSearchParams()
      
      if (freelancerId) searchParams.append('freelancerId', freelancerId)
      searchParams.append('limit', maxRecommendations.toString())

      // Utiliser l'API dédiée aux freelancers
      const response = await fetch(`/api/ai/freelancer-recommendations?${searchParams}`)
      
      if (!response.ok) throw new Error('Failed to fetch recommendations')
      
      const data = await response.json()
      setRecommendations(data.recommendations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <ProjectRecommendationsSkeleton />
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6 text-center">
          <div className="text-red-600">Erreur: {error}</div>
          <Button onClick={fetchRecommendations} variant="outline" className="mt-2">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-green-600" />
          Projets Recommandés pour Vous
          <Badge variant="secondary" className="ml-2">
            AI
          </Badge>
        </CardTitle>
        <CardDescription>
          Projets adaptés à vos compétences et expérience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.slice(0, maxRecommendations).map((recommendation, index) => (
            <ProjectCard 
              key={index} 
              recommendation={recommendation} 
            />
          ))}
          {recommendations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun projet recommandé trouvé. Complétez votre profil pour obtenir des recommandations.
            </div>
          )}
        </div>
        
        {recommendations.length > 0 && (
          <Button className="w-full mt-4" variant="outline">
            Voir tous les projets recommandés
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function ProjectCard({ recommendation }: { recommendation: any }) {
  const project = recommendation.project || recommendation
  const match = recommendation.match || recommendation

  return (
    <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Building className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg">{project.title}</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {project.description}
          </p>

          {/* Compétences requises */}
          <div className="flex flex-wrap gap-1 mb-3">
            {project.skills?.slice(0, 4).map((skill: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {project.skills?.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{project.skills.length - 4}
              </Badge>
            )}
          </div>

          {/* Métadonnées du projet */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {project.budget && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span>
                  ${project.budget.min} - ${project.budget.max}
                </span>
              </div>
            )}
            
            {project.timeline && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{project.timeline} jours</span>
              </div>
            )}
            
            {project.complexity && (
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span className="capitalize">{project.complexity}</span>
              </div>
            )}
          </div>
        </div>

        {/* Score de matching */}
        <div className="text-right ml-4">
          <div className={`text-lg font-bold ${
            (match.matchScore || match.score) >= 80 ? 'text-green-600' :
            (match.matchScore || match.score) >= 60 ? 'text-blue-600' : 'text-orange-600'
          }`}>
            {Math.round(match.matchScore || match.score)}%
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {match.matchGrade || 'match'}
          </div>
          {match.freelancerPerspective?.urgency && (
            <Badge 
              variant={
                match.freelancerPerspective.urgency === 'high' ? 'default' :
                match.freelancerPerspective.urgency === 'medium' ? 'secondary' : 'outline'
              }
              className="text-xs mt-1"
            >
              {match.freelancerPerspective.urgency === 'high' ? 'Prioritaire' :
               match.freelancerPerspective.urgency === 'medium' ? 'Opportunité' : 'Potentiel'}
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t">

           <Link
           href={`/projects/${project._id}/apply`}>
              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
          Postuler
        </Button>
        </Link>
                        
        <Link
        
        href={`/projects/${project._id}`}>
        <Button size="sm" variant="outline">
          Voir détails
        </Button>
        </Link>
    
      </div>
    </div>
  )
}

function ProjectRecommendationsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-5 w-48" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-14" />
            </div>
            <div className="flex justify-between pt-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}