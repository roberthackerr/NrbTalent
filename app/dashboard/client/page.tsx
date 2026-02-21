import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Plus, Users, TrendingUp } from "lucide-react"
import Link from "next/link"
import { AIMatchingWidget } from "@/components/ai/AIMatchingWidget"

export default function ClientDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Tableau de Bord Client</h1>
            <p className="text-gray-600">Gérez vos projets et trouvez des talents</p>
          </div>
          <Link href="/projects/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Projet
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
                <Link href="/projects" className="block py-2 px-3 rounded-lg hover:bg-gray-100">
                  Mes Projets
                </Link>
                <Link href="/contracts" className="block py-2 px-3 rounded-lg hover:bg-gray-100">
                  Contrats
                </Link>
                <Link href="/ai-matching/clients" className="block py-2 px-3 rounded-lg bg-blue-50 text-blue-700 font-medium">
                  🎯 AI Matching
                </Link>
              </CardContent>
            </Card>

            {/* Stats Rapides */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Projets actifs</span>
                    <span className="font-semibold">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Freelancers</span>
                    <span className="font-semibold">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* 🎯 WIDGET AI MATCHING INTÉGRÉ */}
            <AIMatchingWidget 
              type="client"
              quickAction={true}
              maxResults={3}
            />

            {/* Projets Récents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Mes Projets Récents
                </CardTitle>
                <CardDescription>
                  Derniers projets créés et leur statut
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((project) => (
                    <div key={project} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Projet Site E-commerce {project}</div>
                        <div className="text-sm text-gray-600">2 freelancers • Budget: $5,000</div>
                      </div>
                      <Link href={`/projects/proj_${project}/matching`}>
                        <Button variant="outline" size="sm">
                          <Users className="mr-2 h-3 w-3" />
                          Trouver Freelancers
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">85%</div>
                    <div className="text-sm text-blue-700">Taux de Matching</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">12</div>
                    <div className="text-sm text-green-700">Freelancers Trouvés</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-sm text-purple-700">Performance AI</div>
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
