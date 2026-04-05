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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  Eye,
  TrendingUp,
  Award,
  Target,
  Layers,
  Hash,
  CalendarDays,
  Briefcase,
  Star,
  Loader2,
  Palette,
  Code,
  Smartphone,
  Cloud,
  Lock
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

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
    maxCost: 5,
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
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        if (data.error) {
          console.warn('Using fallback models:', data.error)
          toast.warning('Mode dégradé: ' + data.warning, { duration: 5000 })
        }
        
        setAiModels(data.availableModels || [])
        const defaultModel = data.defaultModel || 'deepseek/deepseek-chat'
        setSelectedModel(defaultModel)
        
        if (!data.apiConnected) {
          toast.error('Connexion API limitée', {
            description: 'Les modèles premium peuvent ne pas être disponibles',
            duration: 8000
          })
        }
      } else {
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

  const filteredModels = aiModels.filter(model => {
    if (model.costPerMillion.input > modelFilters.maxCost) return false
    if (model.maxTokens < modelFilters.minTokens) return false
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 blur-2xl opacity-20 animate-pulse rounded-full"></div>
            <Loader2 className="h-16 w-16 text-purple-600 dark:text-purple-400 animate-spin relative z-10" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Chargement de l'AI Architect...</h3>
          <p className="text-slate-600 dark:text-slate-400">Préparation de l'analyse intelligente</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center border-purple-200 dark:border-gray-700 shadow-xl">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Accès restreint</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Seul le client propriétaire de ce projet peut accéder à l'AI Architect.
          </p>
          <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-purple-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link 
                href={`/projects/${projectId}`}
                className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour au projet
              </Link>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/25">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                    AI Project Architect
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Analyse complète pour: <span className="font-medium text-purple-600 dark:text-purple-400">{project?.title}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Model Selector Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                  >
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
                <SheetContent className="w-[400px] sm:w-[540px] flex flex-col bg-white dark:bg-gray-900 border-purple-200 dark:border-gray-800">
                  <SheetHeader>
                    <SheetTitle className="text-purple-700 dark:text-purple-300">Choisir un modèle AI</SheetTitle>
                    <SheetDescription>
                      Sélectionnez le modèle qui correspond à vos besoins et budget
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="flex-1 overflow-hidden flex flex-col py-4">
                    <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl flex-shrink-0">
                      <div className="flex items-center gap-2 mb-3">
                        <Filter className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Filtres</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                            Coût max (par M tokens)
                          </label>
                          <select 
                            className="w-full text-sm border border-purple-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800"
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
                          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                            Longueur minimale
                          </label>
                          <select 
                            className="w-full text-sm border border-purple-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800"
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

                    <div className="flex-1 overflow-y-auto">
                      <div className="space-y-3 pr-2">
                        {filteredModels.map((model) => (
                          <div
                            key={model.id}
                            className={`border rounded-xl p-4 cursor-pointer transition-all hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 ${
                              selectedModel === model.id 
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 ring-2 ring-purple-500' 
                                : 'border-purple-200 dark:border-gray-700'
                            }`}
                            onClick={() => handleModelChange(model.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  {getModelIcon(model.provider)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-medium text-slate-900 dark:text-white">{model.name}</h3>
                                    <Badge variant="outline" className="text-xs border-purple-200 dark:border-purple-800">
                                      {model.provider}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    {model.bestFor.slice(0, 2).join(' • ')}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
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
                                  <div className="w-5 h-5 rounded-full border border-purple-300" />
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-1 mt-3">
                              {model.capabilities.slice(0, 3).map((capability) => (
                                <Badge 
                                  key={capability} 
                                  variant="secondary" 
                                  className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
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
                          <div className="text-center py-8 text-slate-500">
                            <Filter className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                            <p>Aucun modèle ne correspond à vos filtres</p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="mt-2 text-purple-600"
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
                  
                  <div className="flex justify-between pt-4 border-t border-purple-200 dark:border-gray-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowModelDetails(true)}
                      className="text-purple-600"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Comparer les modèles
                    </Button>
                    <SheetTrigger asChild>
                      <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        {selectedModel ? 'Confirmer la sélection' : 'Fermer'}
                      </Button>
                    </SheetTrigger>
                  </div>
                </SheetContent>
              </Sheet>
              
              {selectedModel && (
                <Badge variant="outline" className="gap-1 border-purple-200 dark:border-purple-800">
                  <Zap className="h-3 w-3 text-purple-500" />
                  {getModelName(selectedModel)}
                </Badge>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setRegenerateDialog(true)}
                      disabled={!selectedModel}
                      className="border-purple-200 dark:border-purple-800 hover:bg-purple-50"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Générer
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Régénérer l'analyse avec le modèle sélectionné</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button variant="outline" size="sm" onClick={shareBlueprint} className="border-purple-200 dark:border-purple-800 hover:bg-purple-50">
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </Button>
              
              <Button variant="outline" size="sm" onClick={exportBlueprint} className="border-purple-200 dark:border-purple-800 hover:bg-purple-50">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Model Info Banner */}
        <AnimatePresence>
          {selectedModel && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 rounded-xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                    {getModelIcon(aiModels.find(m => m.id === selectedModel)?.provider || '')}
                  </div>
                  <div>
                    <h3 className="font-medium text-purple-900 dark:text-purple-300">
                      Modèle sélectionné: {getModelName(selectedModel)}
                    </h3>
                    <p className="text-sm text-purple-700 dark:text-purple-400">
                      Prêt à générer une analyse personnalisée pour ce projet
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowModelDetails(true)}
                  className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Détails
                </Button>
              </div>
              
              <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-slate-600 dark:text-slate-400">Coût estimé:</span>
                    <span className="font-medium text-purple-700 dark:text-purple-300">
                      ${getModelCost(selectedModel)}/M tokens
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Server className="h-4 w-4 text-blue-600" />
                    <span className="text-slate-600 dark:text-slate-400">Capacité:</span>
                    <span className="font-medium">
                      {(aiModels.find(m => m.id === selectedModel)?.maxTokens || 0).toLocaleString()} tokens
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { icon: Clock, label: 'Statut', value: project?.status || 'Non défini', color: 'from-blue-500 to-blue-600' },
            { icon: DollarSign, label: 'Budget', value: project?.budget ? `${project.budget.min} - ${project.budget.max} ${project.budget.currency}` : 'Non défini', color: 'from-green-500 to-green-600' },
            { icon: CalendarDays, label: 'Deadline', value: project?.deadline ? new Date(project.deadline).toLocaleDateString() : 'Non définie', color: 'from-orange-500 to-orange-600' },
            { icon: Code, label: 'Compétences', value: `${project?.skills?.length || 0} requises`, color: 'from-purple-500 to-purple-600' },
            { icon: TrendingUp, label: 'Complexité', value: project?.metadata?.complexityScore ? `${project.metadata.complexityScore}/10` : 'Non évaluée', color: 'from-red-500 to-red-600' },
            { icon: Brain, label: 'AI Généré', value: project?.metadata?.aiEnhanced ? 'Oui' : 'Non', color: 'from-pink-500 to-pink-600' }
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 border-purple-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 bg-gradient-to-br ${stat.color} rounded-lg`}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">
                    {stat.value}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <Separator className="my-6 bg-purple-200 dark:bg-gray-700" />

        {/* AI Architect Content */}
        {!selectedModel ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center py-16"
          >
            <Card className="max-w-md w-full p-8 text-center border-purple-200 dark:border-gray-700 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sélectionnez un modèle AI</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Choisissez un modèle AI dans le menu ci-dessus pour générer l'analyse de votre projet.
              </p>
              <Button 
                onClick={() => document.querySelector('button[data-state="closed"]')?.click()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Voir les modèles disponibles
              </Button>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <AIProjectArchitect 
              projectId={projectId}
              canGenerate={true}
              selectedModel={selectedModel}
              onRegenerate={() => setRegenerateDialog(true)}
            />
          </motion.div>
        )}

        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 flex gap-3 z-40">
          <Button 
            variant="default"
            className="shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={() => router.push(`/projects/${projectId}/proposals`)}
          >
            <Users className="h-4 w-4 mr-2" />
            Voir les propositions
          </Button>
          
          <Button 
            variant="secondary"
            className="shadow-lg border-purple-200 dark:border-purple-800"
            onClick={() => router.push(`/projects/${projectId}/apply`)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Postuler au projet
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-200 dark:border-gray-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500 dark:text-slate-400">
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

      {/* Regenerate Dialog */}
      <AlertDialog open={regenerateDialog} onOpenChange={setRegenerateDialog}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-purple-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-purple-700 dark:text-purple-300">Générer le blueprint AI?</AlertDialogTitle>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Cette action va créer une nouvelle analyse AI pour ce projet avec le modèle sélectionné.
              
              <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 rounded-xl">
                <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 mb-2">
                  {getModelIcon(aiModels.find(m => m.id === selectedModel)?.provider || '')}
                  <span className="font-medium">{getModelName(selectedModel)}</span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Coût input:</span>
                    <span className="font-medium">${getModelCost(selectedModel)}/M tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Capacité max:</span>
                    <span className="font-medium">{(aiModels.find(m => m.id === selectedModel)?.maxTokens || 0).toLocaleString()} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Fournisseur:</span>
                    <span className="font-medium">{aiModels.find(m => m.id === selectedModel)?.provider}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Une nouvelle génération remplacera l'analyse existante</span>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={regenerating} className="border-purple-200 dark:border-gray-700">Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRegenerate}
              disabled={regenerating || !selectedModel}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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

// Composant Calendar manquant
const CalendarDays = ({ className }: { className?: string }) => (
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
    <path d="M8 14h.01" />
    <path d="M12 14h.01" />
    <path d="M16 14h.01" />
    <path d="M8 18h.01" />
    <path d="M12 18h.01" />
    <path d="M16 18h.01" />
  </svg>
)