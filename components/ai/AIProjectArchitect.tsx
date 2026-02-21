// components/ai/AIProjectArchitect.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  Sparkles, 
  Cpu, 
  Calendar, 
  DollarSign, 
  Users,
  Code,
  Database,
  Globe,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Brain,
  BarChart3,
  Rocket,
  Server,
  ExternalLink,
  TrendingUp,
  Clock,
  Target,
  Layers,
  Briefcase,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { BudgetValidation } from './BudgetValidation'
import { ModelIndicator } from './ModelIndicator'

interface AIBlueprintProps {
  projectId: string
  initialData?: any
  canGenerate: boolean
  selectedModel?: string  // Nouvelle prop
  onRegenerate?: () => void  // Nouvelle prop
}

export function AIProjectArchitect({ 
  projectId, 
  initialData, 
  canGenerate, 
  selectedModel,
  onRegenerate 
}: AIBlueprintProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [blueprint, setBlueprint] = useState<any>(initialData?.blueprint)
  const [freelancers, setFreelancers] = useState<any[]>(initialData?.suggestedFreelancers || [])
  const [metadata, setMetadata] = useState<any>(initialData?.metadata)
  const [access, setAccess] = useState<{hasAccess: boolean, canGenerate: boolean} | null>(null)
  
  useEffect(() => {
    checkAccess()
  }, [projectId])
  
  const checkAccess = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/check-access`)
      const data = await response.json()
      setAccess(data)
    } catch (error) {
      console.error('Access check failed:', error)
      setAccess({ hasAccess: false, canGenerate: false })
    }
  }

  const generateBlueprint = async () => {
    if (!canGenerate || !selectedModel) {
      toast.error('Veuillez sélectionner un modèle AI')
      return
    }
    
    setGenerating(true)
    try {
      const response = await fetch('/api/ai/architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId,
          options: {
            modelId: selectedModel,
            forceRegenerate: true
          }
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setBlueprint(data.blueprint)
        setFreelancers(data.suggestedFreelancers)
        setMetadata(data.metadata)
        toast.success('Blueprint AI généré avec succès!', {
          description: `Modèle: ${data.metadata?.modelUsed || selectedModel} • Confiance: ${data.metadata?.confidenceScore || 0}%`
        })
        if (onRegenerate) onRegenerate()
      } else {
        if (data.waitMinutes) {
          toast.error(`Veuillez patienter ${data.waitMinutes} minutes avant de régénérer`)
        } else {
          toast.error(data.error || 'Erreur lors de la génération')
        }
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setGenerating(false)
    }
  }

  const loadExistingBlueprint = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ai/architect?projectId=${projectId}&includeFreelancers=true`)
      const data = await response.json()
      
      if (response.ok) {
        setBlueprint(data.blueprint)
        setFreelancers(data.suggestedFreelancers || [])
        setMetadata(data.metadata)
      }
    } catch (error) {
      console.error('Error loading blueprint:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!blueprint && canGenerate) {
      loadExistingBlueprint()
    }
  }, [projectId, canGenerate])

  if (access === null || loading) {
    return (
      <div className="text-center p-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-purple-600" />
        <p>Chargement de l'AI Architect...</p>
      </div>
    )
  }
  
  if (!access.hasAccess) {
    return (
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Accès non autorisé</h3>
        <p className="text-gray-600 mb-4">Vous n'avez pas accès à l'AI Architect de ce projet.</p>
        <Button onClick={() => router.push(`/projects/${projectId}`)}>
          Retour au projet
        </Button>
      </div>
    )
  }

  const renderModelIndicator = () => {
    if (!selectedModel && canGenerate) {
      return (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          <span>Sélectionnez un modèle AI pour générer</span>
        </div>
      )
    }
    return null
  }

  if (!blueprint && canGenerate) {
    return (
      <Card className="p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 mb-4">
          <Brain className="h-6 w-6 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Générer un plan AI</h3>
        <p className="text-gray-600 mb-4">
          Laissez notre IA analyser votre projet et créer un plan détaillé avec stack technique, timeline et budget.
        </p>
        
        {renderModelIndicator()}
        
        <div className="flex flex-col gap-3 max-w-md mx-auto">
          <Button 
            onClick={generateBlueprint} 
            disabled={generating || !selectedModel}
            className="gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Générer avec {selectedModel ? selectedModel.split('/')[1] : 'AI'}
              </>
            )}
          </Button>
          
          {metadata?.isFallback && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Généré avec un modèle de secours
            </div>
          )}
        </div>
        
        {selectedModel && (
          <div className="mt-4 text-xs text-gray-500">
            <div className="flex items-center justify-center gap-4">
              <span>Modèle: {selectedModel}</span>
              <span>•</span>
              <span>Coût estimé: ~${metadata?.generationCost?.toFixed(4) || '0.00'}</span>
            </div>
          </div>
        )}
      </Card>
    )
  }

  if (!blueprint) {
    return null
  }

  // Calcul de la cohérence du budget
  const calculateBudgetConsistency = () => {
    if (!blueprint?.budget?.breakdown) return { isConsistent: true, calculatedTotal: 0 }
    
    const calculatedTotal = blueprint.budget.breakdown.reduce(
      (sum: number, item: any) => sum + (item.total || 0), 
      0
    )
    const recommended = blueprint.budget.recommended || 0
    const difference = Math.abs(calculatedTotal - recommended) / Math.max(calculatedTotal, recommended)
    
    return {
      isConsistent: difference < 0.1, // Moins de 10% d'écart
      calculatedTotal,
      difference
    }
  }

  const budgetConsistency = calculateBudgetConsistency()

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg mt-1">
            <Cpu className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Project Architect</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
              <span>Généré le {metadata?.generatedAt ? new Date(metadata.generatedAt).toLocaleDateString() : '--'}</span>
              <span>•</span>
              <ModelIndicator modelId={metadata?.modelUsed} />
              {metadata?.confidenceScore && (
                <Badge variant={
                  metadata.confidenceScore > 80 ? "default" :
                  metadata.confidenceScore > 60 ? "secondary" : "destructive"
                }>
                  <Target className="h-3 w-3 mr-1" />
                  Confiance: {metadata.confidenceScore}%
                </Badge>
              )}
              {metadata?.isFallback && (
                <Badge variant="outline" className="text-amber-600 border-amber-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Modèle de secours
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {canGenerate && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadExistingBlueprint}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={generateBlueprint}
              disabled={generating || !selectedModel}
              className="gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Regénérer
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Validation du budget */}
      {!budgetConsistency.isConsistent && (
        <BudgetValidation 
          calculatedTotal={budgetConsistency.calculatedTotal}
          recommended={blueprint.budget.recommended}
          currency={blueprint.budget.currency}
          breakdown={blueprint.budget.breakdown}
        />
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="overview">
            <Layers className="h-4 w-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="tech">
            <Code className="h-4 w-4 mr-2" />
            Stack Technique
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Calendar className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="team">
            <Briefcase className="h-4 w-4 mr-2" />
            Équipe & Budget
          </TabsTrigger>
          <TabsTrigger value="risks">
            <Shield className="h-4 w-4 mr-2" />
            Risques
          </TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded">
                    <Globe className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Domaine</h3>
                </div>
                <p className="text-lg">{blueprint.analysis.domain}</p>
                <div className="flex flex-wrap gap-2">
                  {blueprint.analysis.targetUsers?.map((user: string, i: number) => (
                    <Badge key={i} variant="secondary">{user}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 rounded">
                    <Zap className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="font-semibold">Complexité</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    blueprint.analysis.complexity === 'low' ? 'default' :
                    blueprint.analysis.complexity === 'medium' ? 'secondary' : 'destructive'
                  }>
                    {blueprint.analysis.complexity?.toUpperCase()}
                  </Badge>
                  <Progress 
                    value={
                      blueprint.analysis.complexity === 'low' ? 30 :
                      blueprint.analysis.complexity === 'medium' ? 60 : 90
                    } 
                    className="w-24" 
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Score: {blueprint.metadata?.complexityScore || 5}/10
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-100 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Budget recommandé</h3>
                </div>
                <p className="text-2xl font-bold">
                  {blueprint.budget.currency} {blueprint.budget.recommended?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-600">
                  Fourchette: {blueprint.budget.min?.toLocaleString() || '0'} - {blueprint.budget.max?.toLocaleString() || '0'}
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            <div>
              <h3 className="font-semibold mb-2">Fonctionnalités principales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {blueprint.analysis.keyFeatures?.map((feature: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {blueprint.analysis.uniqueAspects?.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <h3 className="font-semibold mb-2">Aspects uniques</h3>
                  <div className="flex flex-wrap gap-2">
                    {blueprint.analysis.uniqueAspects.map((aspect: string, i: number) => (
                      <Badge key={i} variant="outline" className="bg-blue-50">
                        {aspect}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </Card>
        </TabsContent>

        {/* Stack Technique améliorée */}
        <TabsContent value="tech">
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Frontend */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded">
                    <Code className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Frontend</h3>
                </div>
                <div className="p-3 bg-blue-50 rounded border border-blue-100">
                  <div className="text-lg font-medium mb-1">
                    {blueprint.techStack.frontend?.primary || 'Non spécifié'}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {blueprint.techStack.frontend?.reasoning || 'Aucune justification fournie'}
                  </p>
                  {blueprint.techStack.frontend?.alternatives?.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Alternatives: </span>
                      {blueprint.techStack.frontend.alternatives.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Backend */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-100 rounded">
                    <Server className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Backend</h3>
                </div>
                <div className="p-3 bg-green-50 rounded border border-green-100">
                  <div className="text-lg font-medium mb-1">
                    {blueprint.techStack.backend?.primary || 'Non spécifié'}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {blueprint.techStack.backend?.reasoning || 'Aucune justification fournie'}
                  </p>
                </div>
              </div>

              {/* Database */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-100 rounded">
                    <Database className="h-4 w-4 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Base de données</h3>
                </div>
                <div className="p-3 bg-purple-50 rounded border border-purple-100">
                  <div className="text-lg font-medium mb-1">
                    {blueprint.techStack.database?.primary || 'Non spécifié'}
                  </div>
                  <p className="text-sm text-gray-600">
                    {blueprint.techStack.database?.reasoning || 'Aucune justification fournie'}
                  </p>
                </div>
              </div>

              {/* DevOps */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 rounded">
                    <Rocket className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="font-semibold">DevOps</h3>
                </div>
                <div className="space-y-2">
                  {blueprint.techStack.devops?.map((tool: string, i: number) => (
                    <div key={i} className="p-2 bg-amber-50 rounded border border-amber-100">
                      {tool}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Architecture */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Architecture</h3>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                {blueprint.architecture?.diagram || 'Aucun diagramme fourni'}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Timeline améliorée */}
        <TabsContent value="timeline">
          <Card className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Timeline totale: {blueprint.timeline.totalWeeks} semaines</h3>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {blueprint.timeline.totalWeeks * 5} jours ouvrés
                </Badge>
              </div>
              <Progress value={100} className="h-2" />
            </div>

            <div className="space-y-4">
              {blueprint.timeline.phases?.map((phase: any, i: number) => (
                <div key={i} className="p-4 border rounded-lg hover:border-purple-300 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${
                        phase.priority === 'high' ? 'bg-red-100 text-red-600' :
                        phase.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {phase.priority === 'high' ? '🔥' : phase.priority === 'medium' ? '⚡' : '📅'}
                      </div>
                      <h4 className="font-semibold">{phase.name}</h4>
                    </div>
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      {phase.duration} semaine{phase.duration > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium mb-1">Tâches principales</h5>
                      <ul className="space-y-1">
                        {phase.tasks?.slice(0, 4).map((task: string, j: number) => (
                          <li key={j} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium mb-1">Livrables</h5>
                      <ul className="space-y-1">
                        {phase.deliverables?.map((deliverable: string, j: number) => (
                          <li key={j} className="text-sm flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                            {deliverable}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Milestones */}
            {blueprint.timeline.milestones?.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Jalons importants</h3>
                <div className="space-y-2">
                  {blueprint.timeline.milestones.map((milestone: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        milestone.importance === 'high' ? 'bg-red-100 text-red-800' :
                        milestone.importance === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        Semaine {milestone.week}
                      </div>
                      <span>{milestone.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Équipe & Budget amélioré */}
        <TabsContent value="team">
          <Card className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Équipe recommandée */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Équipe recommandée</h3>
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {blueprint.team.teamSize || blueprint.team.recommendedRoles?.length || 0} membres
                  </Badge>
                </div>
                <div className="space-y-4">
                  {blueprint.team.recommendedRoles?.map((role: any, i: number) => (
                    <div key={i} className="p-3 border rounded-lg hover:border-purple-300 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{role.role}</span>
                          <Badge variant={
                            role.experience === 'senior' ? 'default' :
                            role.experience === 'mid' ? 'secondary' : 'outline'
                          }>
                            {role.experience}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium">
                          {role.hours}h • {role.hours / 40} semaines
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Compétences: {role.skillsRequired?.join(', ') || 'Non spécifiées'}
                      </div>
                      <div className="text-sm">
                        {role.responsibilities.slice(0, 2).map((resp: string, j: number) => (
                          <div key={j} className="flex items-start gap-1">
                            <span className="text-gray-400">•</span>
                            <span>{resp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Détails budget amélioré */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Détails du budget</h3>
                  <Badge variant="outline">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {blueprint.budget.currency}
                  </Badge>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold mb-1">
                        {blueprint.budget.currency} {blueprint.budget.recommended?.toLocaleString() || '0'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Budget recommandé
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-white rounded">
                        <div className="text-sm text-gray-600">Minimum</div>
                        <div className="font-medium">
                          {blueprint.budget.currency} {blueprint.budget.min?.toLocaleString() || '0'}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-white rounded">
                        <div className="text-sm text-gray-600">Maximum</div>
                        <div className="font-medium">
                          {blueprint.budget.currency} {blueprint.budget.max?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown détaillé */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Répartition par rôle</h4>
                      <Badge variant="outline">
                        Total: {blueprint.budget.currency} {budgetConsistency.calculatedTotal.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {blueprint.budget.breakdown?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{item.role}</div>
                            <div className="text-sm text-gray-600">
                              {item.hours}h × {item.rate}{blueprint.budget.currency}/h
                              {item.justification && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {item.justification}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="font-semibold text-right">
                            {blueprint.budget.currency} {item.total?.toLocaleString() || '0'}
                            <div className="text-xs text-gray-500 font-normal">
                              {Math.round((item.total / budgetConsistency.calculatedTotal) * 100)}% du total
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coûts supplémentaires */}
                  {(blueprint.budget.hostingCosts || blueprint.budget.thirdPartyCosts) && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2">Coûts récurrents</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {blueprint.budget.hostingCosts && (
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="text-sm text-gray-600">Hébergement</div>
                            <div className="font-medium">
                              {blueprint.budget.currency} {blueprint.budget.hostingCosts.monthly}/mois
                            </div>
                          </div>
                        )}
                        {blueprint.budget.thirdPartyCosts && (
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="text-sm text-gray-600">Services tiers</div>
                            <div className="font-medium">
                              {blueprint.budget.currency} {blueprint.budget.thirdPartyCosts.monthly}/mois
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Risques améliorés */}
        <TabsContent value="risks">
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {blueprint.risks?.map((risk: any, i: number) => (
                <div key={i} className="p-4 border rounded-lg hover:border-red-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded ${
                      risk.impact === 'high' ? 'bg-red-100' :
                      risk.impact === 'medium' ? 'bg-amber-100' : 'bg-blue-100'
                    }`}>
                      <AlertTriangle className={`h-5 w-5 ${
                        risk.impact === 'high' ? 'text-red-600' :
                        risk.impact === 'medium' ? 'text-amber-600' : 'text-blue-600'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{risk.risk}</h4>
                        <div className="flex flex-col gap-1">
                          <Badge variant={
                            risk.probability === 'high' ? 'destructive' :
                            risk.probability === 'medium' ? 'secondary' : 'outline'
                          } className="text-xs">
                            Probabilité: {risk.probability}
                          </Badge>
                          <Badge variant={
                            risk.impact === 'high' ? 'destructive' :
                            risk.impact === 'medium' ? 'secondary' : 'outline'
                          } className="text-xs">
                            Impact: {risk.impact}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-2">{risk.mitigation}</p>
                      {risk.owner && (
                        <div className="text-xs text-gray-500">
                          Responsable: {risk.owner}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Métriques de succès */}
            {blueprint.successMetrics?.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-3">Métriques de succès</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {blueprint.successMetrics.map((metric: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{metric}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Freelances suggérés améliorés */}
      {freelancers && freelancers.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Freelances correspondants</h3>
              <p className="text-sm text-gray-600">
                Basé sur les compétences requises et la stack technique
              </p>
            </div>
            <Badge variant="outline">
              <TrendingUp className="h-3 w-3 mr-1" />
              {freelancers.length} trouvé(s) • Score moyen: {Math.round(freelancers.reduce((acc, f) => acc + (f.matchScore || 0), 0) / freelancers.length)}%
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {freelancers.slice(0, 6).map((freelancer: any) => (
              <div key={freelancer._id} className="p-4 border rounded-lg hover:border-purple-300 hover:shadow-sm transition-all group">
                <div className="flex items-start gap-3 mb-3">
                  {freelancer.avatar ? (
                    <img 
                      src={freelancer.avatar} 
                      alt={freelancer.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium group-hover:text-purple-600 transition-colors">
                          {freelancer.name}
                        </h4>
                        <p className="text-sm text-gray-600">{freelancer.title}</p>
                      </div>
                      <Badge variant={
                        freelancer.matchScore > 80 ? "default" :
                        freelancer.matchScore > 60 ? "secondary" : "outline"
                      }>
                        {freelancer.matchScore}%
                      </Badge>
                    </div>
                    {freelancer.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <div 
                              key={i} 
                              className={`h-3 w-3 ${
                                i < Math.floor(freelancer.rating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                              }`}
                            >
                              ★
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {freelancer.rating.toFixed(1)} ({freelancer.matchReasons?.join(', ')})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {freelancer.skills?.slice(0, 4).map((skill: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {freelancer.skills?.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{freelancer.skills.length - 4}
                    </Badge>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    {freelancer.hourlyRate ? (
                      <div>
                        <span className="font-medium">{freelancer.hourlyRate}€/h</span>
                        <div className="text-xs text-gray-500">
                          {freelancer.availability?.status === 'available' ? '✅ Disponible' : '⏳ Occupé'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Tarif non défini</span>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => router.push(`/freelancers/${freelancer._id}`)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Profil
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {freelancers.length > 6 && (
            <div className="text-center mt-4">
              <Button 
                variant="ghost"
                onClick={() => router.push(`/projects/${projectId}/matching-freelancers`)}
              >
                Voir tous les freelances ({freelancers.length})
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}