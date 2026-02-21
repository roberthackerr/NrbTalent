// components/ai/AIMatchingTest.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  TestTube,
  Calendar,
  DollarSign,
  Clock,
  MapPin,
  Briefcase,
  Award,
  Eye,
  Heart
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
  estimatedTimeline: number;
  confidence: number;
  freelancer?: any;
}

interface ProjectData {
  _id: string;
  title: string;
  description: string;
  skills: string[];
  budget: {
    min: number;
    max: number;
    type: string;
    currency: string;
  };
  complexity: string;
  category?: string;
  deadline?: string;
  createdAt?: string;
  views?: number;
  saveCount?: number;
}

export function AIMatchingTest() {
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<TestMatch[]>([])
  const [testProjectId, setTestProjectId] = useState("68e64af214d66bff3c2af605")
  const [customSkills, setCustomSkills] = useState("React, Node.js, TypeScript, MongoDB")
  const [testResults, setTestResults] = useState<any>(null)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)

  // Test avec un projet existant
  const testWithRealProject = async () => {
    if (!testProjectId.trim()) {
      toast.error("Veuillez entrer un ID de projet valide")
      return
    }

    setLoading(true)
    setMatches([])
    setProjectData(null)
    
    try {
      console.log(`🔍 Test avec le projet: ${testProjectId}`)
      const response = await fetch(`/api/ai/matching?projectId=${testProjectId}&limit=5`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      console.log('📊 Données reçues:', data)
      
      setMatches(data.matches || [])
      setProjectData(data.project)
      setTestResults({
        totalFreelancers: data.statistics?.totalFreelancers,
        matchedFreelancers: data.matches?.length || 0,
        engine: data.matchingEngine,
        timestamp: new Date().toLocaleTimeString()
      })
      
      toast.success(`🎯 ${data.matches?.length || 0} correspondances trouvées`)
    } catch (error) {
      console.error('❌ Test error:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors du test AI Matching")
    } finally {
      setLoading(false)
    }
  }

  // Test avec des compétences personnalisées
  const testWithCustomSkills = async () => {
    setLoading(true)
    setMatches([])
    setProjectData(null)
    
    try {
      const response = await fetch(`/api/ai/matching?projectId=test-custom&testMode=true&limit=5`)
      
      if (!response.ok) {
        throw new Error("Erreur lors du test personnalisé")
      }

      const data = await response.json()
      setMatches(data.matches || [])
      
      // Créer un projet simulé pour l'affichage
      setProjectData({
        _id: "test-custom",
        title: "Projet Test Personnalisé",
        description: "Test avec compétences: " + customSkills,
        skills: customSkills.split(',').map(skill => skill.trim()),
        budget: { min: 1000, max: 5000, type: "fixed", currency: "USD" },
        complexity: "moderate",
        category: "Développement Web"
      })
      
      toast.success(`🧪 Test personnalisé: ${data.matches?.length || 0} matches`)
    } catch (error) {
      console.error('❌ Custom test error:', error)
      toast.error("Erreur lors du test personnalisé")
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const getComplexityColor = (complexity: string) => {
    const colors = {
      'simple': 'bg-green-100 text-green-800',
      'moderate': 'bg-yellow-100 text-yellow-800',
      'complex': 'bg-orange-100 text-orange-800',
      'very-complex': 'bg-red-100 text-red-800'
    }
    return colors[complexity as keyof typeof colors] || 'bg-gray-100 text-gray-800'
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
              <p className="text-xs text-gray-500">
                ID par défaut: 68e64af214d66bff3c2af605 (votre projet e-commerce)
              </p>
            </div>
            <Button 
              onClick={testWithRealProject}
              disabled={loading || !testProjectId.trim()}
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
              {loading ? "Test en cours..." : "Test Personnalisé"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Informations du Projet */}
      {projectData && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Briefcase className="h-5 w-5" />
              Projet Analysé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Informations principales */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-purple-900">{projectData.title}</h3>
                  <p className="text-sm text-purple-700 mt-1 line-clamp-2">
                    {projectData.description}
                  </p>
                </div>

                {/* Compétences requises */}
                <div>
                  <h4 className="font-medium text-purple-800 mb-2">Compétences Requises</h4>
                  <div className="flex flex-wrap gap-2">
                    {projectData.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="bg-white text-purple-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Métriques du projet */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <DollarSign className="h-4 w-4 text-green-600 mx-auto mb-1" />
                    <div className="font-semibold text-green-600">
                      {formatCurrency(projectData.budget.min)} - {formatCurrency(projectData.budget.max)}
                    </div>
                    <div className="text-gray-600 text-xs">Budget</div>
                  </div>

                  <div className="bg-white rounded-lg p-3 text-center">
                    <Target className="h-4 w-4 text-orange-600 mx-auto mb-1" />
                    <div className="font-semibold text-orange-600 capitalize">
                      {projectData.complexity}
                    </div>
                    <div className="text-gray-600 text-xs">Complexité</div>
                  </div>
                </div>

                {projectData.views !== undefined && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <Eye className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                      <div className="font-semibold text-blue-600">{projectData.views}</div>
                      <div className="text-gray-600 text-xs">Vues</div>
                    </div>

                    <div className="bg-white rounded-lg p-3 text-center">
                      <Heart className="h-4 w-4 text-red-600 mx-auto mb-1" />
                      <div className="font-semibold text-red-600">{projectData.saveCount || 0}</div>
                      <div className="text-gray-600 text-xs">Sauvegardes</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultats du Test */}
      {testResults && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">📊 Résultats du Matching</CardTitle>
            <CardDescription className="text-green-700">
              Analyse des performances de l'algorithme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{testResults.matchedFreelancers || 0}</div>
                <div className="text-green-700">Matches trouvés</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{testResults.totalFreelancers || "N/A"}</div>
                <div className="text-blue-700">Freelancers analysés</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">{testResults.performance || "N/A"}</div>
                <div className="text-purple-700">Performance</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">
                  {testResults.matchedFreelancers && testResults.totalFreelancers 
                    ? `${((testResults.matchedFreelancers / testResults.totalFreelancers) * 100).toFixed(1)}%`
                    : "N/A"
                  }
                </div>
                <div className="text-orange-700">Taux de match</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultats des Matches */}
      {matches.length > 0 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top {matches.length} Correspondances Trouvées
              </CardTitle>
              <CardDescription>
                Classées par score de matching décroissant
              </CardDescription>
            </CardHeader>
          </Card>

          {matches.map((match, index) => (
            <Card key={match.freelancerId} className="relative border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              {/* Badge Meilleur Match */}
              {index === 0 && (
                <div className="absolute -top-3 -right-3">
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 shadow-lg">
                    🏆 MEILLEUR MATCH
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar et informations du freelancer */}
                    <Avatar className="h-16 w-16 border-2 border-blue-200">
                      <AvatarImage 
                        src={match.freelancer?.avatar} 
                        alt={match.freelancer?.name}
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                        {getInitials(match.freelancer?.name || "F")}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {match.freelancer?.name || `Freelancer ${index + 1}`}
                        {match.freelancer?.verified && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            ✅ Vérifié
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        {match.freelancer?.title && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {match.freelancer.title}
                          </span>
                        )}
                        {match.freelancer?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {match.freelancer.location}
                          </span>
                        )}
                        {match.freelancer?.hourlyRate && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {match.freelancer.hourlyRate}/h
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant={getScoreVariant(match.matchScore)} className="text-lg px-3 py-1">
                      {match.matchScore.toFixed(0)}%
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">Score de matching</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Score Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600">Global</span>
                      <span className={getScoreColor(match.matchScore)}>
                        {match.matchScore.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={match.matchScore} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600">Réussite</span>
                      <span className={getScoreColor(match.projectSuccessScore)}>
                        {match.projectSuccessScore.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={match.projectSuccessScore} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600">Culture</span>
                      <span className={getScoreColor(match.culturalFit)}>
                        {match.culturalFit.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={match.culturalFit} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600">Apprentissage</span>
                      <span className={getScoreColor(match.learningPotential)}>
                        {match.learningPotential.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={match.learningPotential} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600">Confiance</span>
                      <span className={getScoreColor(match.confidence)}>
                        {match.confidence.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={match.confidence} className="h-2" />
                  </div>
                </div>

                {/* Statistiques du freelancer */}
                {match.freelancer?.statistics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-blue-50 p-4 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {match.freelancer.statistics.completedProjects}
                      </div>
                      <div className="text-xs text-blue-700">Projets terminés</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {match.freelancer.statistics.successRate}%
                      </div>
                      <div className="text-xs text-green-700">Taux de réussite</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {match.freelancer.statistics.responseRate}%
                      </div>
                      <div className="text-xs text-purple-700">Taux de réponse</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        ⭐ {match.freelancer.rating || 'N/A'}
                      </div>
                      <div className="text-xs text-orange-700">Note moyenne</div>
                    </div>
                  </div>
                )}

                {/* Skill Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-green-600 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Points Forts ({match.skillGapAnalysis.strong.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {match.skillGapAnalysis.strong.map((skill, i) => (
                        <Badge key={i} className="bg-green-100 text-green-800 border-green-200">
                          ✅ {skill}
                        </Badge>
                      ))}
                      {match.skillGapAnalysis.strong.length === 0 && (
                        <span className="text-sm text-gray-500">Aucun point fort identifié</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-yellow-600 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Opportunités ({match.skillGapAnalysis.learningOpportunities.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {match.skillGapAnalysis.learningOpportunities.map((skill, i) => (
                        <Badge key={i} variant="outline" className="bg-yellow-50 text-yellow-700">
                          💡 {skill}
                        </Badge>
                      ))}
                      {match.skillGapAnalysis.learningOpportunities.length === 0 && (
                        <span className="text-sm text-gray-500">Aucune opportunité d'apprentissage</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-red-600 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Compétences Manquantes ({match.skillGapAnalysis.missing.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {match.skillGapAnalysis.missing.map((skill, i) => (
                        <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          ❌ {skill}
                        </Badge>
                      ))}
                      {match.skillGapAnalysis.missing.length === 0 && (
                        <span className="text-sm text-gray-500">Aucune compétence manquante</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recommendations et Risques */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recommendations */}
                  {match.recommendedActions.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-blue-800">
                        <Target className="h-4 w-4" />
                        Recommandations IA
                      </h4>
                      <ul className="text-sm space-y-2">
                        {match.recommendedActions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-blue-700">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Risk Factors */}
                  {match.riskFactors.length > 0 && (
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-orange-800">
                        <AlertTriangle className="h-4 w-4" />
                        Facteurs de Risque ({match.riskFactors.length})
                      </h4>
                      <ul className="text-sm space-y-2">
                        {match.riskFactors.map((risk, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-orange-700">{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Timeline estimée */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-gray-800">
                    <Clock className="h-4 w-4" />
                    Délai de livraison estimé
                  </h4>
                  <p className="text-sm text-gray-700">
                    ⏱️ {match.estimatedTimeline} jours (basé sur le profil et la charge de travail)
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* État vide */}
      {!loading && matches.length === 0 && testResults && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucune correspondance trouvée</p>
              <p className="text-sm mt-2 max-w-md mx-auto">
                L'algorithme n'a pas trouvé de freelancers correspondant aux critères du projet.
                Essayez avec d'autres compétences ou vérifiez la disponibilité des freelancers.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* État initial */}
      {!loading && matches.length === 0 && !testResults && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-12">
              <TestTube className="h-20 w-20 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Prêt à tester l'AI Matching</p>
              <p className="text-sm mt-2 max-w-md mx-auto">
                Utilisez les contrôles ci-dessus pour lancer votre premier test de matching.
                Analysez les résultats détaillés et l'efficacité de l'algorithme.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}