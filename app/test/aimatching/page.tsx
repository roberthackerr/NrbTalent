// app/test/ai-matching/page.tsx
"use client"

import { AIMatchingTest } from "@/components/ai/AIMatchingTest"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { TestTube, Zap, BarChart3, Users, Briefcase, GitBranch } from "lucide-react"

export default function AIMatchingTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 mb-6 border border-blue-200">
            <TestTube className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-blue-700">Laboratoire AI Matching Avancé</span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Testez Vos Algorithmes de Matching
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Validez les performances de vos AI Matching pour clients ET freelancers avec des données réelles
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center border-blue-200">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Matching Client</h3>
              <p className="text-gray-600 text-sm">
                Trouvez les meilleurs freelancers pour vos projets avec l'algorithme client
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-green-200">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Matching Freelancer</h3>
              <p className="text-gray-600 text-sm">
                Découvrez les projets parfaits pour vos compétences avec l'algorithme freelancer
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-purple-200">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GitBranch className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Comparaison Intelligente</h3>
              <p className="text-gray-600 text-sm">
                Comparez les résultats des deux algorithmes et analysez leurs performances
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Test Component */}
        <AIMatchingTest />

        {/* Instructions */}
        <Card className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Guide d'utilisation du Laboratoire AI Matching
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="bg-white p-3 rounded-lg border border-blue-100">
                <strong className="text-blue-700">1. Matching Client</strong>
                <p className="text-blue-600 mt-1">Testez avec un projet réel ou créez un projet personnalisé</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-green-100">
                <strong className="text-green-700">2. Matching Freelancer</strong>
                <p className="text-green-600 mt-1">Testez avec un freelancer réel ou des compétences spécifiques</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-purple-100">
                <strong className="text-purple-700">3. Analyse Comparée</strong>
                <p className="text-purple-600 mt-1">Comparez les résultats des deux algorithmes côte à côte</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-orange-100">
                <strong className="text-orange-700">4. Métriques Détaillées</strong>
                <p className="text-orange-600 mt-1">Examinez les scores, risques et recommandations détaillés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}