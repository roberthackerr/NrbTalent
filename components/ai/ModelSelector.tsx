'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Info, Zap } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from '../ui/button'

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

interface ModelSelectorProps {
  models: AIModel[]
  selectedModel: string
  onModelChange: (modelId: string) => void
}

export function ModelSelector({ models, selectedModel, onModelChange }: ModelSelectorProps) {
  const selectedModelData = models.find(m => m.id === selectedModel) || models[0]
  
  const getCostColor = (cost: number) => {
    if (cost < 0.5) return 'text-green-600'
    if (cost < 2) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Si pas de modèles, retourner null ou un message
  if (!models.length) {
    return (
      <div className="text-sm text-gray-500">
        Aucun modèle AI disponible
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {selectedModelData && ( // CORRECTION ICI : pas d'espace après &&
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Modèle AI:</span>
            <Select value={selectedModel} onValueChange={onModelChange}>
              <SelectTrigger className="w-[250px]">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-purple-500" />
                    <span>{selectedModelData.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedModelData.provider}
                    </Badge>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-gray-500">{model.provider}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs ${getCostColor(model.costPerMillion.input)}`}>
                          ${model.costPerMillion.input}/M input
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <div className="space-y-2">
                    <p className="font-medium">{selectedModelData.name}</p>
                    <p className="text-sm">Parfait pour: {selectedModelData.bestFor.join(', ')}</p>
                    <div className="text-xs text-gray-500">
                      <p>Capacités: {selectedModelData.capabilities.join(', ')}</p>
                      <p>Max tokens: {selectedModelData.maxTokens.toLocaleString()}</p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {selectedModelData.bestFor.map((useCase) => (
              <Badge key={useCase} variant="secondary" className="text-xs">
                {useCase}
              </Badge>
            ))}
          </div>
        </>
      )}
    </div>
  )
}