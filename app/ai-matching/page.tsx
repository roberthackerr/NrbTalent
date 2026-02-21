import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, User, Sparkles, Zap, Target, Users } from "lucide-react"
import Link from "next/link"

export default function AIMatchingLandingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full mb-6">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">AI Matching Beta</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Trouvez Votre Match Parfait
        </h1>
        
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Notre intelligence artificielle analyse compétences, expériences et compatibilité 
          pour créer des connexions qui ont du sens.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/ai-matching/clients">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Building className="mr-2 h-4 w-4" />
              Je suis un Client
            </Button>
          </Link>
          <Link href="/ai-matching/freelancers">
            <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
              <User className="mr-2 h-4 w-4" />
              Je suis un Freelancer
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
        <Card className="text-center border-blue-200">
          <CardHeader>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Matching Intelligent</CardTitle>
            <CardDescription>
              Algorithmes avancés basés sur les compétences, l'expérience et la compatibilité
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="text-center border-green-200">
          <CardHeader>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Recommandations Personnalisées</CardTitle>
            <CardDescription>
              Suggestions adaptées à votre profil et vos préférences
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="text-center border-purple-200">
          <CardHeader>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle>Analyses Détaillées</CardTitle>
            <CardDescription>
              Scores détaillés, points forts et opportunités d'amélioration
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 max-w-4xl mx-auto">
        <CardContent className="pt-6 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Prêt à révolutionner votre recherche ?
          </h3>
          <p className="text-gray-600 mb-6">
            Rejoignez des centaines de clients et freelancers qui utilisent déjà notre AI Matching
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/ai-matching/clients">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Commencer en tant que Client
              </Button>
            </Link>
            <Link href="/ai-matching/freelancers">
              <Button variant="outline">
                Commencer en tant que Freelancer
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
