// components/ai/AIMatchingTest.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Search, 
  Users, 
  Star, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb,
  Target,
  Zap,
  RefreshCw,
  TestTube
} from "lucide-react"
import { toast } from "sonner"

interface TestMatch {
  freelancerId: string;
  projectId: string;
  matchScore: number;
  skillGapAnalysis: {
    missing: string[];
    strong: string[];
    learningOpportunities: string[];
  };
  projectSuccessScore: number;
  culturalFit: number;
  learningPotential: number;
  riskFactors: string[];
  recommendedActions: string[];
  confidence: number;
  freelancer?: any; // Added freelancer data for display
}

export function AIMatchingTest() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<TestMatch[]>([])
  const [testProjectId, setTestProjectId] = useState("")
  const [customSkills, setCustomSkills] = useState("React, Node.js, TypeScript, MongoDB")
  const [testResults, setTestResults] = useState<any>(null)

  // Test avec un projet existant de votre base de données
  const testWithRealProject = async () => {
    if (!testProjectId) {
      toast.error("Veuillez entrer un ID de projet")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/ai/matching?projectId=${testProjectId}&limit=5`)
      
      if (!response.ok) {
        throw new Error("Erreur lors du test")
      }

      const data = await response.json()
      setMatches(data.matches || [])
      setTestResults({
        totalFreelancers: data.totalFreelancers,
        matchedFreelancers: data.matches?.length || 0,
        engine: data.matchingEngine,
        timestamp: new Date().toLocaleTimeString()
      })
      
      toast.success(`🎯 ${data.matches?.length || 0} correspondances trouvées`)
    } catch (error) {
      console.error('Test error:', error)
      toast.error("Erreur lors du test AI Matching")
    } finally {
      setLoading(false)
    }
  }

  // Test avec des compétences personnalisées
  const testWithCustomSkills = async () => {
    setLoading(true)
    try {
      // Simuler un projet avec les compétences personnalisées
      const mockProject = {
        _id: "test-custom-project",
        title: "Projet Test - Développement Full Stack",
        description: "Projet de test pour l'AI Matching",
        skills: customSkills.split(',').map(skill => skill.trim()),
        budget: { min: 1000, max: 5000 },
        complexity: "moderate"
      }

      // Appeler l'API de matching
      const response = await fetch('/api/ai/matching?projectId=test-custom&limit=5')
      
      if (response.ok) {
        const data = await response.json()
        setMatches(data.matches || [])
        toast.success(`🧪 Test personnalisé: ${data.matches?.length || 0} matches`)
      }
    } catch (error) {
      console.error('Custom test error:', error)
      toast.error("Erreur lors du test personnalisé")
    } finally {
      setLoading(false)
    }
  }

  // Test de performance
  const runPerformanceTest = async () => {
    setLoading(true)
    const startTime = performance.now()
    
    try {
      const responses = await Promise.all([
        fetch('/api/ai/matching?projectId=68e64af214d66bff3c2af605&limit=3'),
        fetch('/api/ai/matching?projectId=68e64af214d66bff3c2af605&limit=5'),
        fetch('/api/ai/matching?projectId=68e64af214d66bff3c2af605&limit=10')
      ])

      const endTime = performance.now()
      const duration = (endTime - startTime).toFixed(2)

      setTestResults((prev: any) => ({
        ...prev,
        performance: `${duration}ms`,
        testsCompleted: responses.filter(r => r.ok).length
      }))

      toast.success(`⚡ Test de performance: ${duration}ms`)
    } catch (error) {
      console.error('Performance test error:', error)
      toast.error("Erreur lors du test de performance")
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreVariant = (score: number) => {
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    return 'destructive'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <TestTube className="h-6 w-6" />
            Laboratoire AI Matching
          </CardTitle>
          <CardDescription className="text-blue-700">
            Testez et validez l'algorithme de matching avec vos données réelles
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test avec projet réel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Test avec Projet Réel
            </CardTitle>
            <CardDescription>
              Utilisez un ID de projet existant de votre base de données
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">ID du Projet</Label>
              <Input
                id="projectId"
                placeholder="Ex: 68e64af214d66bff3c2af605"
                value={testProjectId}
                onChange={(e) => setTestProjectId(e.target.value)}
              />
            </div>
            <Button 
              onClick={testWithRealProject}
              disabled={loading || !testProjectId}
              className="w-full"
            >
              <Zap className="mr-2 h-4 w-4" />
              {loading ? "Test en cours..." : "Lancer le Test"}
            </Button>
          </CardContent>
        </Card>

        {/* Test personnalisé */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Test Personnalisé
            </CardTitle>
            <CardDescription>
              Testez avec des compétences spécifiques
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customSkills">Compétences (séparées par des virgules)</Label>
              <Input
                id="customSkills"
                placeholder="React, Node.js, MongoDB, TypeScript"
                value={customSkills}
                onChange={(e) => setCustomSkills(e.target.value)}
              />
            </div>
            <Button 
              onClick={testWithCustomSkills}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <TestTube className="mr-2 h-4 w-4" />
              Test Personnalisé
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Actions supplémentaires */}
      <Card>
        <CardHeader>
          <CardTitle>Actions de Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={runPerformanceTest}
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Test de Performance
            </Button>
            <Button 
              onClick={() => {
                setMatches([])
                setTestResults(null)
                toast.info("Tests réinitialisés")
              }}
              variant="outline"
            >
              🔄 Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Résultats du Test */}
      {testResults && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">📊 Résultats du Test</CardTitle>
            <CardDescription className="text-green-700">
              Analyse des performances de l'AI Matching
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">{testResults.matchedFreelancers || 0}</div>
                <div className="text-green-700">Matches trouvés</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{testResults.totalFreelancers || "N/A"}</div>
                <div className="text-blue-700">Freelancers analysés</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{testResults.performance || "N/A"}</div>
                <div className="text-purple-700">Temps d'exécution</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{testResults.timestamp || "N/A"}</div>
                <div className="text-orange-700">Dernier test</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultats des Matches */}
      {matches.length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Résultats du Matching ({matches.length} correspondances)
              </CardTitle>
              <CardDescription>
                Analyse détaillée des freelancers correspondants
              </CardDescription>
            </CardHeader>
          </Card>

          {matches.map((match, index) => (
            <Card key={match.freelancerId} className="relative border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      Match #{index + 1}
                      {index === 0 && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          🏆 Meilleur Match
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Freelancer ID: {match.freelancerId}
                    </CardDescription>
                  </div>
                  <Badge variant={getScoreVariant(match.matchScore)}>
                    {match.matchScore.toFixed(0)}%
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Score Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Score Global</span>
                      <span className={getScoreColor(match.matchScore)}>
                        {match.matchScore.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={match.matchScore} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Réussite</span>
                      <span className={getScoreColor(match.projectSuccessScore)}>
                        {match.projectSuccessScore.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={match.projectSuccessScore} />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Fit Culturel</span>
                      <span className={getScoreColor(match.culturalFit)}>
                        {match.culturalFit.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={match.culturalFit} />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Confiance</span>
                      <span className={getScoreColor(match.confidence)}>
                        {match.confidence.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={match.confidence} />
                  </div>
                </div>

                {/* Skill Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Points Forts ({match.skillGapAnalysis.strong.length})
                    </h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {match.skillGapAnalysis.strong.slice(0, 5).map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-green-50">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-yellow-600 flex items-center gap-1">
                      <Lightbulb className="h-4 w-4" />
                      Opportunités ({match.skillGapAnalysis.learningOpportunities.length})
                    </h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {match.skillGapAnalysis.learningOpportunities.slice(0, 3).map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-yellow-50">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Risques ({match.riskFactors.length})
                    </h4>
                    <div className="space-y-1 mt-1">
                      {match.riskFactors.slice(0, 2).map((risk, i) => (
                        <p key={i} className="text-xs text-red-600">{risk}</p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {match.recommendedActions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      Recommandations IA
                    </h4>
                    <ul className="text-sm space-y-1">
                      {match.recommendedActions.slice(0, 3).map((action, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Debug Info */}
                <details className="text-xs bg-gray-50 p-3 rounded">
                  <summary className="cursor-pointer font-medium">Informations de débogage</summary>
                  <pre className="mt-2 whitespace-pre-wrap">
                    {JSON.stringify({
                      freelancerId: match.freelancerId,
                      scores: {
                        global: match.matchScore,
                        success: match.projectSuccessScore,
                        cultural: match.culturalFit,
                        learning: match.learningPotential,
                        confidence: match.confidence
                      },
                      skillAnalysis: match.skillGapAnalysis,
                      risks: match.riskFactors.length
                    }, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* État vide */}
      {!loading && matches.length === 0 && testResults && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune correspondance trouvée</p>
              <p className="text-sm mt-2">
                Essayez avec d'autres compétences ou vérifiez vos données
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}