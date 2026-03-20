// components/freelancers/TopRatedPage.tsx
'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, MapPin, DollarSign, CheckCircle2, Eye, MessageCircle, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface TopRatedPageProps {
  dict: any
  lang: string
}

export function TopRatedPage({ dict, lang }: TopRatedPageProps) {
  const router = useRouter()
  const [freelancers, setFreelancers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopRatedFreelancers()
  }, [])

  const fetchTopRatedFreelancers = async () => {
    try {
      const response = await fetch('/api/users/freelancers?minRating=4.5&sortBy=rating&limit=12')
      const data = await response.json()
      if (response.ok) {
        setFreelancers(data.freelancers || [])
      }
    } catch (error) {
      console.error('Error fetching top rated freelancers:', error)
    } finally {
      setLoading(false)
    }
  }

  const t = dict?.talents || {}

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                  </div>
                </div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-16"></div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {freelancers.map((freelancer) => (
          <Card 
            key={freelancer._id}
            className="group border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-[1.02] cursor-pointer"
            onClick={() => router.push(`/${lang}/profile/${freelancer._id}`)}
          >
            <CardContent className="p-6">
              <div className="absolute top-4 right-4">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Top Rated
                </Badge>
              </div>
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14 border-2 border-white dark:border-slate-900 shadow-lg">
                  <AvatarImage src={freelancer.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                    {freelancer.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg truncate">
                      {freelancer.name}
                    </h3>
                    {freelancer.isVerified && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {t.verified || "Vérifié"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate mb-2">
                    {freelancer.title || t.freelancer || "Freelancer"}
                  </p>
                  {freelancer.location && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500 mb-2">
                      <MapPin className="h-3 w-3" />
                      {freelancer.location}
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
{freelancer.skills && freelancer.skills.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-3 mb-3">
    {freelancer.skills.slice(0, 3).map((skill, i) => (
      <Badge key={skill.id || i} variant="secondary" className="text-[10px] px-1.5 py-0 bg-slate-100 dark:bg-slate-800">
        {skill.name}  {/* ✅ Afficher skill.name au lieu de l'objet entier */}
      </Badge>
    ))}
    {freelancer.skills.length > 3 && (
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
        +{freelancer.skills.length - 3}
      </Badge>
    )}
  </div>
)}

              {/* Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  {freelancer.hourlyRate && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-slate-900 dark:text-white">{freelancer.hourlyRate}/h</span>
                    </div>
                  )}
                  {freelancer.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">{freelancer.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/${lang}/profile/${freelancer._id}`)
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  {t.viewProfile || "Voir profil"}
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/${lang}/messages/new?user=${freelancer._id}`)
                  }}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  {t.contact || "Contacter"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {freelancers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-600 dark:text-slate-400">Aucun freelance top rated pour le moment.</p>
        </div>
      )}
    </div>
  )
}