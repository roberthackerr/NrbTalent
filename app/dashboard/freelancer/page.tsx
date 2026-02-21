import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Briefcase, TrendingUp, Zap } from "lucide-react"
import Link from "next/link"
import { AIProjectRecommendations } from "@/components/ai/AIProjectRecommendations"

export default function FreelancerDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Tableau de Bord Freelancer</h1>
            <p className="text-gray-600">Gérez votre activité et trouvez de nouveaux projets</p>
          </div>
          <Link href="/ai-matching/freelancers">
            <Button className="bg-green-600 hover:bg-green-700">
              <Zap className="mr-2 h-4 w-4" />
              Trouver des Projets
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/profile" className="block py-2 px-3 rounded-lg hover:bg-gray-100">
                  Mon Profil
                </Link>
                <Link href="/applications" className="block py-2 px-3 rounded-lg hover:bg-gray-100">
                  Mes Candidatures
                </Link>
                <Link href="/ai-matching/freelancers" className="block py-2 px-3 rounded-lg bg-green-50 text-green-700 font-medium">
                  🎯 AI Matching
                </Link>
              </CardContent>
            </Card>

            {/* Stats Rapides */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Projets en cours</span>
                    <span className="font-semibold">2</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taux d'acceptation</span>
                    <span className="font-semibold">75%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* 🎯 RECOMMANDATIONS PROJETS AI */}
            <AIProjectRecommendations 
              freelancerId="user_current"
              maxRecommendations={3}
            />

            {/* Candidatures Récents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Mes Candidatures Récents
                </CardTitle>
                <CardDescription>
                  Dernières propositions envoyées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((application) => (
                    <div key={application} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Application {application}</div>
                        <div className="text-sm text-gray-600">Envoyé il y a 2j • En attente</div>
                      </div>
                      <div className="text-sm text-gray-600">Match: 85%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">92%</div>
                    <div className="text-sm text-green-700">Score AI Matching</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">15</div>
                    <div className="text-sm text-blue-700">Projets Recommandés</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-sm text-purple-700">Opportunités Croissance</div>
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
