// components/ai/ModelDetailsPanel.tsx
'use client'

import { X, Zap, DollarSign, Server, CheckCircle, BarChart3, Globe, Shield, Rocket, Cpu, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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

interface ModelDetailsPanelProps {
  model?: AIModel
  isOpen: boolean
  onClose: () => void
  onSelectModel: (modelId: string) => void
  allModels: AIModel[]
}

export function ModelDetailsPanel({
  model,
  isOpen,
  onClose,
  onSelectModel,
  allModels
}: ModelDetailsPanelProps) {
  if (!model || !isOpen) return null

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'deepseek': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'openai': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'anthropic': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
      case 'google': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      case 'meta': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'deepseek': return <Rocket className="h-5 w-5" />
      case 'openai': return <Globe className="h-5 w-5" />
      case 'anthropic': return <Shield className="h-5 w-5" />
      case 'google': return <BarChart3 className="h-5 w-5" />
      case 'meta': return <Cpu className="h-5 w-5" />
      default: return <Zap className="h-5 w-5" />
    }
  }

  const calculateCost = (tokens: number) => {
    const cost = (tokens * model.costPerMillion.input) / 1000000
    return cost.toFixed(4)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getProviderColor(model.provider)}`}>
              {getProviderIcon(model.provider)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{model.name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{model.provider}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                <DollarSign className="h-4 w-4" />
                Coût input
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                ${model.costPerMillion.input}/M
              </div>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                <DollarSign className="h-4 w-4" />
                Coût output
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                ${model.costPerMillion.output}/M
              </div>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                <Server className="h-4 w-4" />
                Max tokens
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {model.maxTokens.toLocaleString()}
              </div>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                <Clock className="h-4 w-4" />
                Estimation coût
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                ~${calculateCost(5000)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">pour 5000 tokens</div>
            </div>
          </div>

          {/* Best for */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Idéal pour</h3>
            <div className="flex flex-wrap gap-2">
              {model.bestFor.map((useCase) => (
                <Badge 
                  key={useCase} 
                  variant="secondary"
                  className="text-sm py-1.5 px-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  <CheckCircle className="h-3 w-3 mr-1.5 text-green-500 dark:text-green-400" />
                  {useCase}
                </Badge>
              ))}
            </div>
          </div>

          {/* Capabilities */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Capacités</h3>
            <div className="grid grid-cols-2 gap-3">
              {model.capabilities.map((capability, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{capability}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison avec autres modèles */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Comparaison avec d'autres modèles</h3>
            <div className="space-y-2">
              {allModels
                .filter(m => m.id !== model.id)
                .slice(0, 3)
                .map((otherModel) => (
                  <div
                    key={otherModel.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    onClick={() => {
                      onSelectModel(otherModel.id)
                      onClose()
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${getProviderColor(otherModel.provider)}`}>
                          {getProviderIcon(otherModel.provider)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{otherModel.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ${otherModel.costPerMillion.input}/M • {otherModel.maxTokens.toLocaleString()} tokens
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-purple-600 dark:text-purple-400">
                        Sélectionner
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Recommandation */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Notre recommandation</h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              {model.id === 'deepseek/deepseek-chat' 
                ? 'Excellent choix pour un rapport qualité/prix. Parfait pour la plupart des projets freelance.'
                : model.id === 'openai/gpt-4o-mini'
                ? 'Très équilibré, offre une bonne précision à un prix raisonnable.'
                : model.id === 'anthropic/claude-3.5-sonnet'
                ? 'Top pour les analyses complexes. Plus cher mais très performant.'
                : 'Bon choix selon vos besoins spécifiques.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4 flex justify-between">
          <Button variant="outline" onClick={onClose} className="border-gray-300 dark:border-gray-700">
            Fermer
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                window.open(`/ai/models/compare?model1=${model.id}`, '_blank')
              }}
              className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400"
            >
              Comparer détaillée
            </Button>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              onClick={() => {
                onSelectModel(model.id)
                onClose()
              }}
            >
              <Zap className="h-4 w-4 mr-2" />
              Utiliser ce modèle
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}