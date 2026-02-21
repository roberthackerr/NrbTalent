// components/ai/ModelIndicator.tsx
'use client'

import { Badge } from '@/components/ui/badge'
import { 
  Zap, 
  Globe, 
  Shield, 
  Rocket, 
  Server,
  BarChart3 
} from 'lucide-react'

interface ModelIndicatorProps {
  modelId?: string
}

export function ModelIndicator({ modelId }: ModelIndicatorProps) {
  if (!modelId) return null

  const getModelInfo = (id: string) => {
    if (id.includes('deepseek')) {
      return {
        name: 'DeepSeek',
        icon: <Rocket className="h-3 w-3" />,
        color: 'text-blue-700 bg-blue-100 border-blue-200'
      }
    }
    if (id.includes('gpt') || id.includes('openai')) {
      return {
        name: 'OpenAI',
        icon: <Globe className="h-3 w-3" />,
        color: 'text-green-700 bg-green-100 border-green-200'
      }
    }
    if (id.includes('claude') || id.includes('anthropic')) {
      return {
        name: 'Anthropic',
        icon: <Shield className="h-3 w-3" />,
        color: 'text-purple-700 bg-purple-100 border-purple-200'
      }
    }
    if (id.includes('gemini') || id.includes('google')) {
      return {
        name: 'Google',
        icon: <BarChart3 className="h-3 w-3" />,
        color: 'text-red-700 bg-red-100 border-red-200'
      }
    }
    if (id.includes('llama') || id.includes('meta')) {
      return {
        name: 'Meta',
        icon: <Server className="h-3 w-3" />,
        color: 'text-orange-700 bg-orange-100 border-orange-200'
      }
    }
    return {
      name: id.split('/')[1] || 'AI',
      icon: <Zap className="h-3 w-3" />,
      color: 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const modelInfo = getModelInfo(modelId)

  return (
    <Badge variant="outline" className={`gap-1 ${modelInfo.color}`}>
      {modelInfo.icon}
      {modelInfo.name}
    </Badge>
  )
}