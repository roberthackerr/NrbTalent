// components/ai/AIMatchingWidget.tsx
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Users, Building, Target } from "lucide-react"

interface AIMatchingWidgetProps {
  type: 'client' | 'freelancer'
  projectId?: string
  freelancerId?: string
  quickAction?: boolean
  maxResults?: number
}

export function AIMatchingWidget({ 
  type, 
  projectId, 
  freelancerId, 
  quickAction = false, 
  maxResults = 5 
}: AIMatchingWidgetProps) {
  const [matches, setMatches] = useState<any[]>([])
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
      setMatches(data.matches || data.recommendations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <MatchingSkeleton />
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6 text-center">
          <div className="text-red-600">Erreur: {error}</div>
          <Button onClick={fetchMatches} variant="outline" className="mt-2">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={quickAction ? "border-blue-200" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          {type === 'client' ? 'Freelancers Recommandés' : 'Projets Recommandés'}
          {quickAction && (
            <Badge variant="secondary" className="ml-2">
              AI
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {type === 'client' 
            ? 'Top freelancers correspondant à vos besoins' 
            : 'Projets adaptés à votre profil'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {matches.slice(0, maxResults).map((match, index) => (
            <MatchCard 
              key={index} 
              match={match} 
              type={type} 
            />
          ))}
          {matches.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucune recommandation trouvée. Ajustez vos critères.
            </div>
          )}
        </div>
        
        {!quickAction && matches.length > 0 && (
          <Button className="w-full mt-4" variant="outline">
            Voir toutes les recommandations
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function MatchCard({ match, type }: { match: any; type: string }) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          {type === 'client' ? (
            <Users className="h-5 w-5 text-blue-600" />
          ) : (
            <Building className="h-5 w-5 text-green-600" />
          )}
        </div>
        <div>
          <div className="font-medium">
            {type === 'client' ? match.freelancer?.name : match.project?.title}
          </div>
          <div className="text-sm text-gray-600">
            {type === 'client' 
              ? match.freelancer?.skills?.join(', ')
              : match.project?.skills?.slice(0, 2).join(', ')
            }
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-semibold text-blue-600">
          {Math.round(match.matchScore || match.score)}%
        </div>
        <div className="text-xs text-gray-500">Match</div>
      </div>
    </div>
  )
}

function MatchingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="w-12 h-8" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}