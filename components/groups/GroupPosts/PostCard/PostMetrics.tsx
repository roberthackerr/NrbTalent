import { TrendingUp } from 'lucide-react'
import { PostMetrics as PostMetricsType } from '../utils/types'

interface PostMetricsProps {
  metrics?: PostMetricsType
}

export function PostMetrics({ metrics }: PostMetricsProps) {
  if (!metrics) return null

  return (
    <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-800">Statistiques avancées</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-700">{metrics.engagementRate}%</div>
          <div className="text-xs text-blue-600">Engagement</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-700">{metrics.reach.toLocaleString()}</div>
          <div className="text-xs text-purple-600">Portée</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-700">{metrics.impressions.toLocaleString()}</div>
          <div className="text-xs text-green-600">Impressions</div>
        </div>
      </div>
    </div>
  )
}