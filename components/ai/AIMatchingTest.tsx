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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Heart,
  GitBranch,
  User,
  Building,
  BarChart3,
  Sparkles
} from "lucide-react"
import { toast } from "sonner"

// Types pour les deux algorithmes
interface ClientMatch {
  freelancerId: string;
  projectId: string;
  matchScore: number;
  matchGrade: 'excellent' | 'good' | 'potential' | 'low';
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

interface FreelancerMatch {
  projectId: string;
  project: any;
  matchScore: number;
  matchGrade: 'excellent' | 'good' | 'potential' | 'low';
  freelancerPerspective: {
    earningsPotential: number;
    learningValue: number;  
    careerBoost: number;
    applicationPriority: number;
    urgency: 'high' | 'medium' | 'low';
  };
  whyPerfectForYou: string[];
  potentialConcerns: string[];
  recommendedBid?: {
    min: number;
    max: number;
    strategy: string;
  };
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

interface FreelancerData {
  _id: string;
  name: string;
  email: string;
  skills: string[];
  hourlyRate: number;
  experience: any[];
  statistics?: any;
  location?: string;
  title?: string;
  avatar?: string;
  verified?: boolean;
}

export function AIMatchingTest() {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("client")
  const [clientMatches, setClientMatches] = useState<ClientMatch[]>([])
  const [freelancerMatches, setFreelancerMatches] = useState<FreelancerMatch[]>([])
  
  // États pour Client Matching
  const [testProjectId, setTestProjectId] = useState("68e64af214d66bff3c2af605")
  const [customProjectSkills, setCustomProjectSkills] = useState("React, Node.js, TypeScript, MongoDB")
  
  // États pour Freelancer Matching
  const [testFreelancerId, setTestFreelancerId] = useState("68e8b425f53cb74135973fa8")
  const [customFreelancerSkills, setCustomFreelancerSkills] = useState("JavaScript, React, UI/UX Design, Figma")
  const [freelancerHourlyRate, setFreelancerHourlyRate] = useState("80")
  
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [freelancerData, setFreelancerData] = useState<FreelancerData | null>(null)
  const [testResults, setTestResults] = useState<any>(null)

  // 🔥 CLIENT MATCHING - Trouver des freelancers pour un projet
  const testClientMatching = async (useRealProject: boolean = true) => {
    setLoading(true)
    setClientMatches([])
    setProjectData(null)
    
    try {
      let url = '/api/ai/matching?'
      
      if (useRealProject) {
        if (!testProjectId.trim()) {
          toast.error("Veuillez entrer un ID de projet valide")
          return
        }
        url += `projectId=${testProjectId}&limit=5`
      } else {
        url += `projectId=test-custom&testMode=true&limit=5`
      }

      console.log(`🎯 Test Client Matching: ${url}`)
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      console.log('📊 Données Client Matching:', data)
      
      setClientMatches(data.matches || [])
      setProjectData(data.project)
      setTestResults({
        type: 'client',
        totalFreelancers: data.statistics?.totalFreelancers,
        matchedFreelancers: data.matches?.length || 0,
        engine: data.matchingEngine,
        timestamp: new Date().toLocaleTimeString(),
        statistics: data.statistics
      })
      
      toast.success(`🎯 ${data.matches?.length || 0} freelancers correspondants trouvés`)
    } catch (error) {
      console.error('❌ Client Matching error:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors du test Client Matching")
    } finally {
      setLoading(false)
    }
  }

  // 🔥 FREELANCER MATCHING - Trouver des projets pour un freelancer
  const testFreelancerMatching = async (useRealFreelancer: boolean = true) => {
    setLoading(true)
    setFreelancerMatches([])
    setFreelancerData(null)
    
    try {
      let url = '/api/ai/freelancer-recommendations?'
      
      if (useRealFreelancer) {
        if (!testFreelancerId.trim()) {
          toast.error("Veuillez entrer un ID de freelancer valide")
          return
        }
        url += `freelancerId=${testFreelancerId}&limit=5`
      } else {
        // Pour les tests personnalisés, on pourrait créer un endpoint dédié
        url += `freelancerId=test-custom&testMode=true&limit=5`
      }

      console.log(`🎯 Test Freelancer Matching: ${url}`)
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      console.log('📊 Données Freelancer Matching:', data)
      
      setFreelancerMatches(data.recommendations || [])
      setFreelancerData(data.freelancer)
      setTestResults({
        type: 'freelancer',
        totalProjects: data.insights?.totalProjectsAnalyzed,
        matchedProjects: data.recommendations?.length || 0,
        engine: data.matchingEngine,
        timestamp: new Date().toLocaleTimeString(),
        insights: data.insights
      })
      
      toast.success(`💼 ${data.recommendations?.length || 0} projets recommandés trouvés`)
    } catch (error) {
      console.error('❌ Freelancer Matching error:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors du test Freelancer Matching")
    } finally {
      setLoading(false)
    }
  }

  // 🔥 COMPARAISON DES DEUX ALGORITHMES
  const runComparisonTest = async () => {
    setLoading(true)
    setClientMatches([])
    setFreelancerMatches([])
    
    try {
      // Lancer les deux tests en parallèle
      const [clientResponse, freelancerResponse] = await Promise.all([
        fetch(`/api/ai/matching?projectId=${testProjectId}&limit=3`),
        fetch(`/api/ai/freelancer-recommendations?freelancerId=${testFreelancerId}&limit=3`)
      ])

      if (!clientResponse.ok || !freelancerResponse.ok) {
        throw new Error("Erreur lors de la comparaison")
      }

      const clientData = await clientResponse.json()
      const freelancerData = await freelancerResponse.json()

      setClientMatches(clientData.matches || [])
      setFreelancerMatches(freelancerData.recommendations || [])
      setProjectData(clientData.project)
      setFreelancerData(freelancerData.freelancer)
      
      setTestResults({
        type: 'comparison',
        client: {
          matches: clientData.matches?.length || 0,
          total: clientData.statistics?.totalFreelancers,
          engine: clientData.matchingEngine
        },
        freelancer: {
          matches: freelancerData.recommendations?.length || 0,
          total: freelancerData.insights?.totalProjectsAnalyzed,
          engine: freelancerData.matchingEngine
        },
        timestamp: new Date().toLocaleTimeString()
      })
      
      toast.success(`📊 Comparaison terminée: ${clientData.matches?.length || 0} freelancers vs ${freelancerData.recommendations?.length || 0} projets`)
    } catch (error) {
      console.error('❌ Comparison test error:', error)
      toast.error("Erreur lors de la comparaison des algorithmes")
    } finally {
      setLoading(false)
    }
  }

  // Helper functions
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

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      'high': 'bg-red-100 text-red-800 border-red-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-green-100 text-green-800 border-green-200'
    }
    return colors[urgency as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <GitBranch className="h-6 w-6" />
            Laboratoire AI Matching Dual
          </CardTitle>
          <CardDescription className="text-blue-700">
            Testez et comparez les algorithmes de matching Client et Freelancer
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="client" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Matching Client
          </TabsTrigger>
          <TabsTrigger value="freelancer" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Matching Freelancer
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Comparaison
          </TabsTrigger>
        </TabsList>

        {/* CLIENT MATCHING TAB */}
        <TabsContent value="client" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test avec projet réel */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Building className="h-5 w-5" />
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
                    ID par défaut: votre projet e-commerce existant
                  </p>
                </div>
                <Button 
                  onClick={() => testClientMatching(true)}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  {loading ? "Test en cours..." : "Trouver des Freelancers"}
                </Button>
              </CardContent>
            </Card>

            {/* Test personnalisé */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Target className="h-5 w-5" />
                  Projet Personnalisé
                </CardTitle>
                <CardDescription>
                  Testez avec des compétences spécifiques
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customSkills">Compétences Requises</Label>
                  <Input
                    id="customSkills"
                    placeholder="React, Node.js, MongoDB, TypeScript"
                    value={customProjectSkills}
                    onChange={(e) => setCustomProjectSkills(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={() => testClientMatching(false)}
                  disabled={loading}
                  variant="outline"
                  className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <TestTube className="mr-2 h-4 w-4" />
                  {loading ? "Test en cours..." : "Test Personnalisé"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Afficher les résultats Client Matching */}
          <ClientMatchingResults 
            matches={clientMatches}
            projectData={projectData}
            testResults={testResults}
            loading={loading}
          />
        </TabsContent>

        {/* FREELANCER MATCHING TAB */}
        <TabsContent value="freelancer" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test avec freelancer réel */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <User className="h-5 w-5" />
                  Test avec Freelancer Réel
                </CardTitle>
                <CardDescription>
                  Utilisez un ID de freelancer existant de votre base de données
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="freelancerId">ID du Freelancer</Label>
                  <Input
                    id="freelancerId"
                    placeholder="Ex: 68e8b425f53cb74135973fa8"
                    value={testFreelancerId}
                    onChange={(e) => setTestFreelancerId(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    ID par défaut: un freelancer existant de votre base
                  </p>
                </div>
                <Button 
                  onClick={() => testFreelancerMatching(true)}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Briefcase className="mr-2 h-4 w-4" />
                  {loading ? "Test en cours..." : "Trouver des Projets"}
                </Button>
              </CardContent>
            </Card>

            {/* Test personnalisé freelancer */}
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <Sparkles className="h-5 w-5" />
                  Freelancer Personnalisé
                </CardTitle>
                <CardDescription>
                  Testez avec des compétences et un taux horaire spécifiques
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="freelancerSkills">Compétences du Freelancer</Label>
                  <Input
                    id="freelancerSkills"
                    placeholder="JavaScript, React, UI/UX Design, Figma"
                    value={customFreelancerSkills}
                    onChange={(e) => setCustomFreelancerSkills(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Taux Horaire ($/h)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    placeholder="80"
                    value={freelancerHourlyRate}
                    onChange={(e) => setFreelancerHourlyRate(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={() => testFreelancerMatching(false)}
                  disabled={loading}
                  variant="outline"
                  className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                >
                  <TestTube className="mr-2 h-4 w-4" />
                  {loading ? "Test en cours..." : "Test Personnalisé"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Afficher les résultats Freelancer Matching */}
          <FreelancerMatchingResults 
            matches={freelancerMatches}
            freelancerData={freelancerData}
            testResults={testResults}
            loading={loading}
          />
        </TabsContent>

        {/* COMPARISON TAB */}
        <TabsContent value="comparison" className="space-y-6">
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <BarChart3 className="h-5 w-5" />
                Comparaison des Algorithmes
              </CardTitle>
              <CardDescription className="text-purple-700">
                Comparez les performances des algorithmes Client et Freelancer côte à côte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="compareProjectId">ID du Projet</Label>
                  <Input
                    id="compareProjectId"
                    placeholder="ID du projet pour Client Matching"
                    value={testProjectId}
                    onChange={(e) => setTestProjectId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compareFreelancerId">ID du Freelancer</Label>
                  <Input
                    id="compareFreelancerId"
                    placeholder="ID du freelancer pour Freelancer Matching"
                    value={testFreelancerId}
                    onChange={(e) => setTestFreelancerId(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={runComparisonTest}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <GitBranch className="mr-2 h-4 w-4" />
                {loading ? "Comparaison en cours..." : "Lancer la Comparaison"}
              </Button>
            </CardContent>
          </Card>

          {/* Résultats de comparaison */}
          <ComparisonResults 
            clientMatches={clientMatches}
            freelancerMatches={freelancerMatches}
            projectData={projectData}
            freelancerData={freelancerData}
            testResults={testResults}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Composant pour afficher les résultats Client Matching
// Composant pour afficher les résultats Client Matching
function ClientMatchingResults({ matches, projectData, testResults, loading }: any) {
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

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-lg font-medium">Recherche des freelancers...</p>
            <p className="text-sm text-gray-600 mt-2">Analyse des compétences et calcul des scores de matching</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Résultats du Test */}
      {testResults && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Résultats du Matching Client
            </CardTitle>
            <CardDescription className="text-blue-700">
              Analyse des performances de l'algorithme de matching Client → Freelancers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{testResults.matchedFreelancers || 0}</div>
                <div className="text-blue-700">Freelancers matchés</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{testResults.totalFreelancers || "N/A"}</div>
                <div className="text-green-700">Freelancers analysés</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">{testResults.engine || "N/A"}</div>
                <div className="text-purple-700">Moteur</div>
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
                Top {matches.length} Freelancers Correspondants
              </CardTitle>
              <CardDescription>
                Classés par score de matching décroissant - Optimisés pour votre projet
              </CardDescription>
            </CardHeader>
          </Card>

          {matches.map((match: any, index: number) => (
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
                    <Badge variant="outline" className="mt-1 bg-blue-50">
                      {match.matchGrade || 'N/A'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Score Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  {[
                    { label: "Global", value: match.matchScore, color: getScoreColor(match.matchScore) },
                    { label: "Réussite", value: match.projectSuccessScore, color: getScoreColor(match.projectSuccessScore) },
                    { label: "Culture", value: match.culturalFit, color: getScoreColor(match.culturalFit) },
                    { label: "Apprentissage", value: match.learningPotential, color: getScoreColor(match.learningPotential) },
                    { label: "Confiance", value: match.confidence, color: getScoreColor(match.confidence) }
                  ].map((metric, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-gray-600">{metric.label}</span>
                        <span className={metric.color}>
                          {metric.value.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={metric.value} className="h-2" />
                    </div>
                  ))}
                </div>

                {/* Skill Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-green-600 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Points Forts ({match.skillGapAnalysis.strong.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {match.skillGapAnalysis.strong.map((skill: string, i: number) => (
                        <Badge key={i} className="bg-green-100 text-green-800 border-green-200">
                          ✅ {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-yellow-600 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Opportunités ({match.skillGapAnalysis.learningOpportunities.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {match.skillGapAnalysis.learningOpportunities.map((skill: string, i: number) => (
                        <Badge key={i} variant="outline" className="bg-yellow-50 text-yellow-700">
                          💡 {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-red-600 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Compétences Manquantes ({match.skillGapAnalysis.missing.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {match.skillGapAnalysis.missing.map((skill: string, i: number) => (
                        <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          ❌ {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recommendations et Risques */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {match.recommendedActions.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-blue-800">
                        <Target className="h-4 w-4" />
                        Recommandations IA
                      </h4>
                      <ul className="text-sm space-y-2">
                        {match.recommendedActions.map((action: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-blue-700">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {match.riskFactors.length > 0 && (
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-orange-800">
                        <AlertTriangle className="h-4 w-4" />
                        Facteurs de Risque
                      </h4>
                      <ul className="text-sm space-y-2">
                        {match.riskFactors.map((risk: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-orange-700">{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
              <p className="text-lg font-medium">Aucun freelancer correspondant trouvé</p>
              <p className="text-sm mt-2 max-w-md mx-auto">
                L'algorithme n'a pas trouvé de freelancers correspondant aux critères du projet.
                Essayez avec d'autres compétences ou vérifiez la disponibilité des freelancers.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Composant pour afficher les résultats Freelancer Matching  
function FreelancerMatchingResults({ matches, freelancerData, testResults, loading }: any) {
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  // Ajoutez ces fonctions dans le composant AIMatchingTest, avant le return

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


const getComplexityColor = (complexity: string) => {
  const colors = {
    'simple': 'bg-green-100 text-green-800',
    'moderate': 'bg-yellow-100 text-yellow-800',
    'complex': 'bg-orange-100 text-orange-800',
    'very-complex': 'bg-red-100 text-red-800'
  }
  return colors[complexity as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}


  const getUrgencyColor = (urgency: string) => {
    const colors = {
      'high': 'bg-red-100 text-red-800 border-red-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-green-100 text-green-800 border-green-200'
    }
    return colors[urgency as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
            <p className="text-lg font-medium">Recherche des projets...</p>
            <p className="text-sm text-gray-600 mt-2">Analyse des opportunités et calcul des priorités</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Informations du Freelancer */}
      {freelancerData && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <User className="h-5 w-5" />
              Profil Freelancer Analysé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-green-900">{freelancerData.name}</h3>
                  <p className="text-sm text-green-700 mt-1">{freelancerData.title}</p>
                </div>

                {/* Compétences */}
                <div>
                  <h4 className="font-medium text-green-800 mb-2">Compétences</h4>
                  <div className="flex flex-wrap gap-2">
                    {freelancerData.skills.map((skill: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-white text-green-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Métriques du freelancer */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <DollarSign className="h-4 w-4 text-green-600 mx-auto mb-1" />
                    <div className="font-semibold text-green-600">
                      {freelancerData.hourlyRate}/h
                    </div>
                    <div className="text-gray-600 text-xs">Taux horaire</div>
                  </div>

                  <div className="bg-white rounded-lg p-3 text-center">
                    <Briefcase className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                    <div className="font-semibold text-blue-600">
                      {freelancerData.experience?.length || 0}
                    </div>
                    <div className="text-gray-600 text-xs">Expériences</div>
                  </div>
                </div>

                {freelancerData.statistics && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <TrendingUp className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                      <div className="font-semibold text-purple-600">
                        {freelancerData.statistics.completedProjects}
                      </div>
                      <div className="text-gray-600 text-xs">Projets terminés</div>
                    </div>

                    <div className="bg-white rounded-lg p-3 text-center">
                      <Star className="h-4 w-4 text-orange-600 mx-auto mb-1" />
                      <div className="font-semibold text-orange-600">
                        {freelancerData.statistics.successRate}%
                      </div>
                      <div className="text-gray-600 text-xs">Taux de réussite</div>
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
            <CardTitle className="text-green-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Résultats du Matching Freelancer
            </CardTitle>
            <CardDescription className="text-green-700">
              Analyse des performances de l'algorithme de matching Freelancer → Projets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{testResults.matchedProjects || 0}</div>
                <div className="text-green-700">Projets recommandés</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{testResults.totalProjects || "N/A"}</div>
                <div className="text-blue-700">Projets analysés</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">{testResults.engine || "N/A"}</div>
                <div className="text-purple-700">Moteur</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">
                  {testResults.insights?.matchRate || "N/A"}
                </div>
                <div className="text-orange-700">Taux de recommandation</div>
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
                <Target className="h-5 w-5" />
                Top {matches.length} Projets Recommandés
              </CardTitle>
              <CardDescription>
                Classés par priorité de candidature - Optimisés pour votre profil
              </CardDescription>
            </CardHeader>
          </Card>

          {matches.map((match: any, index: number) => (
            <Card key={match.projectId} className="relative border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
              {/* Badge Meilleur Match */}
              {index === 0 && (
                <div className="absolute -top-3 -right-3">
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 shadow-lg">
                    💼 PRIORITÉ MAX
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {match.project.title}
                      <Badge variant="outline" className={getUrgencyColor(match.freelancerPerspective.urgency)}>
                        {match.freelancerPerspective.urgency === 'high' ? '🔴 Urgent' : 
                         match.freelancerPerspective.urgency === 'medium' ? '🟡 Moyen' : '🟢 Normal'}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {match.project.description}
                    </CardDescription>
                  </div>
                  
                  <div className="text-right ml-4">
                    <Badge variant={getScoreVariant(match.matchScore)} className="text-lg px-3 py-1">
                      {match.matchScore.toFixed(0)}%
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">Score de matching</p>
                    <Badge variant="outline" className="mt-1 bg-green-50">
                      {match.matchGrade}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Perspective Freelancer */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {[
                    { label: "Gains Potentiels", value: match.freelancerPerspective.earningsPotential, icon: DollarSign, color: "text-green-600" },
                    { label: "Valeur Apprentissage", value: match.freelancerPerspective.learningValue, icon: Lightbulb, color: "text-blue-600" },
                    { label: "Boost Carrière", value: match.freelancerPerspective.careerBoost, icon: TrendingUp, color: "text-purple-600" },
                    { label: "Priorité", value: match.freelancerPerspective.applicationPriority, icon: Target, color: "text-orange-600" }
                  ].map((metric, i) => (
                    <div key={i} className="text-center p-3 bg-gray-50 rounded-lg">
                      <metric.icon className={`h-6 w-6 mx-auto mb-2 ${metric.color}`} />
                      <div className={`text-lg font-bold ${metric.color}`}>
                        {metric.value.toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-600">{metric.label}</div>
                    </div>
                  ))}
                </div>

                {/* Pourquoi parfait pour vous */}
                {match.whyPerfectForYou.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-blue-800">
                      <Sparkles className="h-4 w-4" />
                      Pourquoi ce projet est parfait pour vous
                    </h4>
                    <ul className="text-sm space-y-2">
                      {match.whyPerfectForYou.map((reason: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-blue-700">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Offre recommandée */}
                {match.recommendedBid && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-green-800">
                      <DollarSign className="h-4 w-4" />
                      Offre Recommandée
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-green-600">
                          {formatCurrency(match.recommendedBid.min)}
                        </div>
                        <div className="text-xs text-green-700">Minimum</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">
                          {formatCurrency(match.recommendedBid.max)}
                        </div>
                        <div className="text-xs text-blue-700">Maximum</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-orange-600 capitalize">
                          {match.recommendedBid.strategy}
                        </div>
                        <div className="text-xs text-orange-700">Stratégie</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Préoccupations potentielles */}
                {match.potentialConcerns.length > 0 && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-orange-800">
                      <AlertTriangle className="h-4 w-4" />
                      Points d'attention
                    </h4>
                    <ul className="text-sm space-y-2">
                      {match.potentialConcerns.map((concern: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-orange-700">{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
              <p className="text-lg font-medium">Aucun projet recommandé trouvé</p>
              <p className="text-sm mt-2 max-w-md mx-auto">
                L'algorithme n'a pas trouvé de projets correspondant à votre profil.
                Essayez avec d'autres compétences ou ajustez vos critères.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Composant pour afficher la comparaison
function ComparisonResults({ clientMatches, freelancerMatches, projectData, freelancerData, testResults, loading }: any) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-lg font-medium">Comparaison en cours...</p>
            <p className="text-sm text-gray-600 mt-2">Analyse des deux algorithmes en parallèle</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Résultats de comparaison */}
      {testResults && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Comparaison des Algorithmes
            </CardTitle>
            <CardDescription className="text-purple-700">
              Analyse comparative des performances des algorithmes Client et Freelancer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Matching Stats */}
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Matching Client
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Freelancers matchés:</span>
                    <span className="font-semibold text-blue-600">{testResults.client.matches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total analysés:</span>
                    <span className="font-semibold text-blue-600">{testResults.client.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Moteur:</span>
                    <Badge variant="outline" className="bg-blue-50">{testResults.client.engine}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Taux de match:</span>
                    <span className="font-semibold text-green-600">
                      {testResults.client.matches && testResults.client.total 
                        ? `${((testResults.client.matches / testResults.client.total) * 100).toFixed(1)}%`
                        : "N/A"
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Freelancer Matching Stats */}
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Matching Freelancer
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Projets recommandés:</span>
                    <span className="font-semibold text-green-600">{testResults.freelancer.matches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total analysés:</span>
                    <span className="font-semibold text-green-600">{testResults.freelancer.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Moteur:</span>
                    <Badge variant="outline" className="bg-green-50">{testResults.freelancer.engine}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Taux de recommandation:</span>
                    <span className="font-semibold text-green-600">
                      {testResults.freelancer.matches && testResults.freelancer.total 
                        ? `${((testResults.freelancer.matches / testResults.freelancer.total) * 100).toFixed(1)}%`
                        : "N/A"
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights de comparaison */}
            <div className="mt-6 p-4 bg-white rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Insights de Performance
              </h4>
              <div className="text-sm text-purple-700 space-y-2">
                <p>• Les deux algorithmes utilisent des critères de matching différents mais complémentaires</p>
                <p>• Le matching client se concentre sur les compétences techniques et l'expérience</p>
                <p>• Le matching freelancer intègre la perspective carrière et les gains potentiels</p>
                <p>• Les scores sont calculés avec des pondérations adaptées à chaque use-case</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Affichage côte à côte des résultats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Résultats Client Matching */}
        <div>
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Résultats Client Matching
          </h3>
          {clientMatches.length > 0 ? (
            <div className="space-y-4">
              {clientMatches.slice(0, 3).map((match: any, index: number) => (
                <Card key={match.freelancerId} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{match.freelancer?.name || `Freelancer ${index + 1}`}</p>
                        <p className="text-sm text-gray-600">{match.freelancer?.title}</p>
                      </div>
                      <Badge variant={match.matchScore >= 80 ? "default" : "secondary"}>
                        {match.matchScore.toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600">
                      {match.skillGapAnalysis.strong.length} compétences fortes • 
                      {match.skillGapAnalysis.missing.length} manquantes
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-4">
                  <p className="text-sm">Aucun résultat client</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Résultats Freelancer Matching */}
        <div>
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Résultats Freelancer Matching
          </h3>
          {freelancerMatches.length > 0 ? (
            <div className="space-y-4">
              {freelancerMatches.slice(0, 3).map((match: any, index: number) => (
                <Card key={match.projectId} className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{match.project.title}</p>
                        <p className="text-sm text-gray-600 line-clamp-1">{match.project.description}</p>
                      </div>
                      <Badge variant={match.matchScore >= 80 ? "default" : "secondary"}>
                        {match.matchScore.toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600">
                      Priorité: {match.freelancerPerspective.applicationPriority.toFixed(0)}% • 
                      Urgence: {match.freelancerPerspective.urgency}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-4">
                  <p className="text-sm">Aucun résultat freelancer</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
