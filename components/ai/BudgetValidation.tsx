// components/ai/BudgetValidation.tsx
'use client'

import { AlertTriangle, Calculator, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface BudgetValidationProps {
  calculatedTotal: number
  recommended: number
  currency: string
  breakdown: any[]
}

export function BudgetValidation({ 
  calculatedTotal, 
  recommended, 
  currency,
  breakdown 
}: BudgetValidationProps) {
  const difference = Math.abs(calculatedTotal - recommended)
  const percentageDiff = (difference / Math.max(calculatedTotal, recommended)) * 100
  
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-amber-800">Incohérence détectée dans le budget</h4>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
              <Calculator className="h-3 w-3 mr-1" />
              {percentageDiff.toFixed(1)}% d'écart
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Total calculé:</div>
              <div className="font-semibold">
                {currency} {calculatedTotal.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Σ(heures × taux) = {breakdown.map(item => `${item.hours}h × ${item.rate}${currency}`).join(' + ')}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Budget recommandé:</div>
              <div className="font-semibold">
                {currency} {recommended.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Valeur générée par l'IA
              </div>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-amber-700">
            <CheckCircle className="h-3 w-3 inline mr-1" />
            Nous utilisons le total calculé ({currency} {calculatedTotal.toLocaleString()}) pour les estimations.
          </div>
        </div>
      </div>
    </div>
  )
}