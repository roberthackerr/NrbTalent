'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AIProjectArchitect } from '@/components/ai/AIProjectArchitect'
import { ModelSelector } from '@/components/ai/ModelSelector'
import { ModelDetailsPanel } from '@/components/ai/ModelDetailsPanel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { 
  ArrowLeft, 
  Sparkles, 
  Brain, 
  FileText, 
  Users,
  Zap,
  Share2,
  Download,
  Copy,
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Cpu,
  ChevronRight,
  BarChart3,
  Server,
  Globe,
  Shield,
  Rocket,
  Filter,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface AIModel {
  id: string
  name: string
  provider: string
  costPerMillion: {
    input: number
    output: number
  }
  maxTokens: number
  capabilities: string[]
  bestFor: string[]
}

export default function AIArchitectPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  
  const projectId = params.id as string
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [aiModels, setAiModels] = useState<AIModel[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [regenerateDialog, setRegenerateDialog] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [blueprintStats, setBlueprintStats] = useState<any>(null)
  const [showModelDetails, setShowModelDetails] = useState(false)
  const [modelFilters, setModelFilters] = useState({
    maxCost: 5, // $ par million tokens
    minTokens: 10000,
    providers: [] as string[]
  })

  useEffect(() => {
    if (status === 'loading') return
    
    fetchProject()
    fetchAvailableModels()
  }, [projectId, status])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      const data = await response.json()
      
      if (response.ok) {
        setProject(data)
        
        // Vérifier si l'utilisateur est le client
        const isClient = session?.user?.id === data.clientId?.toString()
        const isAdmin = session?.user?.role === 'admin'
        const isCollaborator = data.collaborators?.some((c: any) => 
          c.userId?.toString() === session?.user?.id
        )
        
        setHasAccess(isClient || isAdmin || isCollaborator)
      } else {
        toast.error('Projet non trouvé')
        router.push(`/projects/${projectId}`)
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableModels = async () => {
    try {
      const response = await fetch('/api/ai/architect', {
        method: 'OPTIONS',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        if (data.error) {
          // Si API retourne une erreur mais des modèles fallback
          console.warn('Using fallback models:', data.error)
          toast.warning('Mode dégradé: ' + data.warning, {
            duration: 5000
          })
        }
        
        setAiModels(data.availableModels || [])
        
        // Sélectionner le modèle par défaut
        const defaultModel = data.defaultModel || 'deepseek/deepseek-chat'
        setSelectedModel(defaultModel)
        
        // Afficher un warning si API non connectée
        if (!data.apiConnected) {
          toast.error('Connexion API limitée', {
            description: 'Les modèles premium peuvent ne pas être disponibles',
            duration: 8000
          })
        }
      } else {
        // Si l'API échoue complètement, utiliser des modèles statiques
        console.error('API failed, using static models')
        setAiModels(getStaticModels())
        setSelectedModel('deepseek/deepseek-chat')
        toast.error('Impossible de charger les modèles AI', {
          description: 'Utilisation des modèles par défaut',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error fetching AI models:', error)
      setAiModels(getStaticModels())
      setSelectedModel('deepseek/deepseek-chat')
      toast.error('Erreur réseau', {
        description: 'Vérifiez votre connexion internet',
        duration: 3000
      })
    }
  }

  // Fonction de fallback pour les modèles statiques
  const getStaticModels = (): AIModel[] => {
    return [
      {
        id: "deepseek/deepseek-chat",
        name: "DeepSeek Chat",
        provider: "DeepSeek",
        costPerMillion: { input: 0.14, output: 0.28 },
        maxTokens: 32768,
        capabilities: ["code", "analysis", "planning"],
        bestFor: ["MVP", "Budget projects", "Technical planning"]
      },
      {
        id: "openai/gpt-4o-mini",
        name: "GPT-4o Mini",
        provider: "OpenAI",
        costPerMillion: { input: 0.15, output: 0.60 },
        maxTokens: 16384,
        capabilities: ["balanced", "efficient", "creative"],
        bestFor: ["General purpose", "Cost-effective", "Quick iterations"]
      }
    ]
  }

  // Gérer le cas où aiModels est vide
  useEffect(() => {
    if (aiModels.length === 0) {
      setAiModels(getStaticModels())
      setSelectedModel('deepseek/deepseek-chat')
    }
  }, [aiModels])

  const handleRegenerate = async () => {
    if (!selectedModel) {
      toast.error('Veuillez sélectionner un modèle AI')
      return
    }

    setRegenerating(true)
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
        toast.success('Blueprint régénéré avec succès!', {
          description: `Modèle: ${getModelName(selectedModel)} • Coût: $${data.metadata?.generationCost?.toFixed(4) || '0.0000'}`
        })
        setBlueprintStats(data.metadata)
        setRegenerateDialog(false)
        
        // Recharger la page après 2 secondes
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        toast.error('Erreur lors de la régénération', {
          description: data.error || 'Veuillez réessayer'
        })
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setRegenerating(false)
    }
  }

  const exportBlueprint = () => {
    // Implémenter l'export PDF ici
    toast.success('Blueprint exporté en PDF')
  }

  const shareBlueprint = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Lien copié dans le presse-papier')
  }

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId)
    const model = aiModels.find(m => m.id === modelId)
    if (model) {
      toast.info('Modèle AI sélectionné', {
        description: `${model.name} (${model.provider}) - $${model.costPerMillion.input}/M tokens`,
        duration: 3000
      })
    }
  }

  const getModelName = (modelId: string) => {
    const model = aiModels.find(m => m.id === modelId)
    return model?.name || modelId
  }

  const getModelCost = (modelId: string) => {
    const model = aiModels.find(m => m.id === modelId)
    return model?.costPerMillion.input || 0
  }

  // Filtrer les modèles selon les préférences
  const filteredModels = aiModels.filter(model => {
    // Filtrer par coût maximum
    if (model.costPerMillion.input > modelFilters.maxCost) return false
    
    // Filtrer par nombre minimum de tokens
    if (model.maxTokens < modelFilters.minTokens) return false
    
    // Filtrer par provider si spécifié
    if (modelFilters.providers.length > 0 && 
        !modelFilters.providers.includes(model.provider)) return false
    
    return true
  })

  const getModelIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'deepseek':
        return <Rocket className="h-4 w-4 text-blue-500" />
      case 'openai':
        return <Globe className="h-4 w-4 text-green-500" />
      case 'anthropic':
        return <Shield className="h-4 w-4 text-purple-500" />
      case 'google':
        return <BarChart3 className="h-4 w-4 text-red-500" />
      case 'meta':
        return <Server className="h-4 w-4 text-orange-500" />
      default:
        return <Zap className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de l'AI Architect...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Accès restreint</h2>
          <p className="text-gray-600 mb-6">
            Seul le client propriétaire de ce projet peut accéder à l'AI Architect.
          </p>
          <Button asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au projet
            </Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/projects/${projectId}`}
                className="inline-flex items-center gap-2 text-sm hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour au projet
              </Link>
              
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">AI Project Architect</h1>
                  <p className="text-sm text-gray-600">
                    Analyse complète pour: <span className="font-medium">{project?.title}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Sélecteur de modèle amélioré */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    {selectedModel ? (
                      <>
                        {getModelIcon(aiModels.find(m => m.id === selectedModel)?.provider || '')}
                        <span className="truncate max-w-[120px]">
                          {getModelName(selectedModel)}
                        </span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Choisir un modèle
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
                  <SheetHeader>
                    <SheetTitle>Choisir un modèle AI</SheetTitle>
                    <SheetDescription>
                      Sélectionnez le modèle qui correspond à vos besoins et budget
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="flex-1 overflow-hidden flex flex-col py-4">
                    {/* Filtres rapides */}
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg flex-shrink-0">
                      <div className="flex items-center gap-2 mb-3">
                        <Filter className="h-4 w-4" />
                        <span className="text-sm font-medium">Filtres</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">
                            Coût max (par M tokens)
                          </label>
                          <select 
                            className="w-full text-sm border rounded-md px-3 py-1.5"
                            value={modelFilters.maxCost}
                            onChange={(e) => setModelFilters(prev => ({
                              ...prev,
                              maxCost: Number(e.target.value)
                            }))}
                          >
                            <option value={1}>$1 (Économique)</option>
                            <option value={2}>$2 (Standard)</option>
                            <option value={5}>$5 (Premium)</option>
                            <option value={10}>$10 (Illimité)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">
                            Longueur minimale
                          </label>
                          <select 
                            className="w-full text-sm border rounded-md px-3 py-1.5"
                            value={modelFilters.minTokens}
                            onChange={(e) => setModelFilters(prev => ({
                              ...prev,
                              minTokens: Number(e.target.value)
                            }))}
                          >
                            <option value={8000}>8k tokens</option>
                            <option value={32000}>32k tokens</option>
                            <option value={100000}>100k tokens</option>
                            <option value={200000}>200k tokens</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Liste des modèles avec scrollbar */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="space-y-3 pr-2">
                        {filteredModels.map((model) => (
                          <div
                            key={model.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-purple-300 hover:bg-purple-50 ${
                              selectedModel === model.id 
                                ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' 
                                : 'border-gray-200'
                            }`}
                            onClick={() => handleModelChange(model.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  {getModelIcon(model.provider)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium">{model.name}</h3>
                                    <Badge variant="outline" className="text-xs">
                                      {model.provider}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {model.bestFor.slice(0, 2).join(' • ')}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span>
                                      <DollarSign className="h-3 w-3 inline mr-1" />
                                      ${model.costPerMillion.input}/M input
                                    </span>
                                    <span>
                                      <Server className="h-3 w-3 inline mr-1" />
                                      {model.maxTokens.toLocaleString()} tokens
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center">
                                {selectedModel === model.id ? (
                                  <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                                    <CheckCircle className="h-3 w-3 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border border-gray-300" />
                                )}
                              </div>
                            </div>
                            
                            {/* Tags de capacités */}
                            <div className="flex flex-wrap gap-1 mt-3">
                              {model.capabilities.slice(0, 3).map((capability) => (
                                <Badge 
                                  key={capability} 
                                  variant="secondary" 
                                  className="text-xs"
                                >
                                  {capability}
                                </Badge>
                              ))}
                              {model.capabilities.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{model.capabilities.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {filteredModels.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Filter className="h-8 w-8 mx-auto mb-2" />
                            <p>Aucun modèle ne correspond à vos filtres</p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => setModelFilters({
                                maxCost: 5,
                                minTokens: 10000,
                                providers: []
                              })}
                            >
                              Réinitialiser les filtres
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowModelDetails(true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Comparer les modèles
                    </Button>
                    <SheetTrigger asChild>
                      <Button>
                        {selectedModel ? 'Confirmer la sélection' : 'Fermer'}
                      </Button>
                    </SheetTrigger>
                  </div>
                </SheetContent>
              </Sheet>
              
              {/* Badge du modèle sélectionné */}
              {selectedModel && (
                <Badge variant="outline" className="gap-1">
                  <Zap className="h-3 w-3" />
                  {getModelName(selectedModel)}
                </Badge>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setRegenerateDialog(true)}
                disabled={!selectedModel}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Générer
              </Button>
              
              <Button variant="outline" size="sm" onClick={shareBlueprint}>
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </Button>
              
              <Button variant="outline" size="sm" onClick={exportBlueprint}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Bandeau d'information du modèle */}
        {selectedModel && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getModelIcon(aiModels.find(m => m.id === selectedModel)?.provider || '')}
                <div>
                  <h3 className="font-medium">
                    Modèle sélectionné: {getModelName(selectedModel)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Prêt à générer une analyse personnalisée pour ce projet
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowModelDetails(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Détails
              </Button>
            </div>
            
            {/* Estimation de coût */}
            <div className="mt-3 pt-3 border-t border-blue-100">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-gray-600">Coût estimé:</span>
                  <span className="font-medium">
                    ${getModelCost(selectedModel)}/M tokens
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Server className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">Capacité:</span>
                  <span className="font-medium">
                    {(aiModels.find(m => m.id === selectedModel)?.maxTokens || 0).toLocaleString()} tokens
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              Statut
            </div>
            <div className="text-lg font-semibold capitalize">{project?.status}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="h-4 w-4" />
              Budget
            </div>
            <div className="text-lg font-semibold">
              {project?.budget?.min} - {project?.budget?.max} {project?.budget?.currency}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              Deadline
            </div>
            <div className="text-lg font-semibold">
              {project?.deadline ? new Date(project.deadline).toLocaleDateString() : 'Non définie'}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Cpu className="h-4 w-4" />
              Compétences
            </div>
            <div className="text-lg font-semibold">{project?.skills?.length || 0}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4" />
              Complexité
            </div>
            <div className="text-lg font-semibold">
              {project?.metadata?.complexityScore 
                ? `${project.metadata.complexityScore}/10` 
                : 'Non évaluée'}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Brain className="h-4 w-4" />
              AI Généré
            </div>
            <div className="text-lg font-semibold">
              {project?.metadata?.aiEnhanced ? 'Oui' : 'Non'}
            </div>
          </Card>
        </div>

        <Separator className="my-6" />

        {/* Message si pas de modèle sélectionné */}
        {!selectedModel ? (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Sélectionnez un modèle AI</h3>
            <p className="text-gray-600 mb-6">
              Choisissez un modèle AI dans le menu en haut pour générer l'analyse de votre projet.
            </p>
            <Button onClick={() => document.querySelector('button[data-state="closed"]')?.click()}>
              <Zap className="h-4 w-4 mr-2" />
              Voir les modèles disponibles
            </Button>
          </Card>
        ) : (
          /* AI Architect Component */
          <div className="mb-8">
            <AIProjectArchitect 
              projectId={projectId}
              canGenerate={true}
              selectedModel={selectedModel}
              onRegenerate={() => setRegenerateDialog(true)}
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="fixed bottom-6 right-6 flex gap-3">
          <Button 
            variant="default"
            className="shadow-lg"
            onClick={() => router.push(`/projects/${projectId}/proposals`)}
          >
            <Users className="h-4 w-4 mr-2" />
            Voir les propositions
          </Button>
          
          <Button 
            variant="secondary"
            onClick={() => router.push(`/projects/${projectId}/apply`)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Postuler au projet
          </Button>
        </div>
      </main>

      {/* Footer note */}
      <footer className="border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
          <p>
            ⚡ AI Architect • 
            <span className="mx-2">•</span>
            Modèle sélectionné: {selectedModel ? getModelName(selectedModel) : 'Aucun'}
            <span className="mx-2">•</span>
            Dernière mise à jour: {new Date().toLocaleDateString()}
          </p>
          <p className="mt-2">
            Cette analyse est générée automatiquement et doit être vérifiée par un expert technique.
          </p>
        </div>
      </footer>

      {/* Regenerate Dialog - CORRIGÉ pour l'hydratation */}
      <AlertDialog open={regenerateDialog} onOpenChange={setRegenerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Générer le blueprint AI?</AlertDialogTitle>
            <div className="text-sm text-gray-600 mt-2">
              Cette action va créer une nouvelle analyse AI pour ce projet avec le modèle sélectionné.
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  {getModelIcon(aiModels.find(m => m.id === selectedModel)?.provider || '')}
                  <span className="font-medium">{getModelName(selectedModel)}</span>
                </div>
                <div className="text-sm text-blue-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Coût input:</span>
                    <span>${getModelCost(selectedModel)}/M tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capacité max:</span>
                    <span>{(aiModels.find(m => m.id === selectedModel)?.maxTokens || 0).toLocaleString()} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fournisseur:</span>
                    <span>{aiModels.find(m => m.id === selectedModel)?.provider}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Une nouvelle génération remplacera l'analyse existante</span>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={regenerating}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRegenerate}
              disabled={regenerating || !selectedModel}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {regenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer avec {getModelName(selectedModel)}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Model Details Panel */}
      {showModelDetails && selectedModel && (
        <ModelDetailsPanel
          model={aiModels.find(m => m.id === selectedModel)}
          isOpen={showModelDetails}
          onClose={() => setShowModelDetails(false)}
          onSelectModel={(modelId) => {
            handleModelChange(modelId)
            setShowModelDetails(false)
          }}
          allModels={aiModels}
        />
      )}
    </div>
  )
}

// Composant Calendar
const Calendar = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
)