"use client"

import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Users, Sparkles, Target } from "lucide-react"
import { AIMatchingWidget } from "@/components/ai/AIMatchingWidget"

export default function ProjectMatchingPage() {
  const params = useParams()
  const projectId = params.id as string

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-4">
            <Building className="h-4 w-4" />
            <span className="text-sm font-medium">Matching Projet</span>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Trouvez des Freelancers pour Votre Projet</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Notre AI analyse les besoins spécifiques de votre projet pour recommander 
            les freelancers les plus adaptés.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Informations Projet */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Projet #{projectId}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Statut</div>
                  <div className="font-medium">En recrutement</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Budget</div>
                  <div className="font-medium">$5,000 - $8,000</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Compétences requises</div>
                  <div className="font-medium">React, Node.js, MongoDB</div>
                </div>
              </CardContent>
            </Card>

            {/* Actions Rapides */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="mr-2 h-4 w-4" />
                    Modifier critères
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Voir candidatures
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Matching Results */}
          <div className="lg:col-span-3">
            <AIMatchingWidget 
              type="client"
              projectId={projectId}
              quickAction={false}
              maxResults={8}
            />

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900">Matching Personnalisé</h4>
                      <p className="text-sm text-blue-700">Adapté aux spécificités de votre projet</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-900">Profils Qualifiés</h4>
                      <p className="text-sm text-green-700">Seulement les freelancers pertinents</p>
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
