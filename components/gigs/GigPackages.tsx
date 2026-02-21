"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Star, Clock, Zap, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

const PACKAGES = [
  {
    id: 'basic',
    name: 'Basique',
    description: 'Parfait pour les projets simples',
    priceMultiplier: 1,
    features: [
      'Livraison standard',
      '1 révision incluse',
      'Support de base'
    ]
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Le plus populaire pour la plupart des projets',
    priceMultiplier: 1.5,
    features: [
      'Livraison prioritaire',
      '3 révisions incluses',
      'Support prioritaire',
      'Fichiers sources'
    ],
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Solution complète pour les projets complexes',
    priceMultiplier: 2,
    features: [
      'Livraison express',
      'Révisions illimitées',
      'Support 24/7',
      'Fichiers sources',
      'Droit de réutilisation'
    ]
  }
]

interface GigPackagesProps {
  gig: any
  selectedPackage: string
  onPackageSelect: (packageId: string) => void
  onOrder?: (packageId: string) => void
}

export function GigPackages({ gig, selectedPackage, onPackageSelect, onOrder }: GigPackagesProps) {
  const calculatePrice = (multiplier: number) => {
    return Math.round(gig.price * multiplier)
  }

  const handleOrder = (packageId: string) => {
    if (onOrder) {
      onOrder(packageId)
    } else {
      // Redirection par défaut
      window.location.href = `/orders/new?gigId=${gig._id}&package=${packageId}`
    }
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Choisissez une offre
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {PACKAGES.map((pkg) => {
          const price = calculatePrice(pkg.priceMultiplier)
          const isSelected = selectedPackage === pkg.id
          
          return (
            <Card 
              key={pkg.id}
              className={cn(
                "border-2 transition-all cursor-pointer hover:shadow-md",
                isSelected
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                  : "border-slate-200 dark:border-slate-700",
                pkg.popular && "relative"
              )}
              onClick={() => onPackageSelect(pkg.id)}
            >
              {pkg.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Populaire
                </Badge>
              )}
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      {pkg.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {pkg.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {price}€
                    </div>
                    <div className="text-sm text-slate-500">
                      {gig.deliveryTime} jour{gig.deliveryTime > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    "w-full",
                    isSelected
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-slate-900 hover:bg-slate-800"
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOrder(pkg.id)
                  }}
                >
                  {isSelected ? "Sélectionné" : "Choisir cette offre"}
                </Button>
              </CardContent>
            </Card>
          )
        })}

        {/* Garanties */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Paiement sécurisé et garantie satisfait ou remboursé</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}