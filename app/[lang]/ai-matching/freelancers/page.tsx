// app/ai-matching/freelancers/page.tsx - Version corrigée
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Search, Briefcase, Target, Sparkles, MapPin, Star, Calendar } from "lucide-react"
import { AIProjectRecommendations } from "@/components/ai/AIProjectRecommendations"

export default function FreelancerAIMatchingPage() {
  const { data: session, status } = useSession()
  const [userSkills, setUserSkills] = useState<string[]>([])

  useEffect(() => {
    if (session?.user) {
      const skills = session.user.skills?.map((skill: any) => skill.name) || []
      setUserSkills(skills)
    }
  }, [session])

  if (status === "loading") {
    return <div className="container mx-auto px-4 py-8 text-center">Chargement...</div>
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Connectez-vous pour accéder aux recommandations</h1>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-4">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">Espace Freelancers</span>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Bonjour {session.user.name} 👋</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Découvrez les projets qui correspondent parfaitement à vos compétences et aspirations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Profil */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Votre Profil
                </CardTitle>
                <CardDescription>
                  Recommandations personnalisées
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Compétences</div>
                  <div className="flex flex-wrap gap-1">
                    {userSkills.slice(0, 5).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {userSkills.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{userSkills.length - 5}
                      </Badge>
                    )}
                  </div>
                </div>

                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Search className="mr-2 h-4 w-4" />
                  Actualiser les recommandations
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-green-600">
                    {userSkills.length}
                  </div>
                  <div className="text-sm text-green-700">Compétences analysées</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - RECOMMANDATIONS DE PROJETS */}
          <div className="lg:col-span-2 space-y-6">
            {/* Utiliser le bon composant pour les freelancers */}
            <AIProjectRecommendations 
              freelancerId={session.user.id}
              maxRecommendations={8}
            />

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-900">Matching Intelligent</h4>
                      <p className="text-sm text-green-700">Basé sur vos compétences réelles</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-purple-900">Opportunités Qualité</h4>
                      <p className="text-sm text-purple-700">Projets adaptés à votre niveau</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}