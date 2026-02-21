// components/home/ide-popup.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Code2, 
  Play, 
  Terminal, 
  Zap, 
  X, 
  Sparkles,
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Cloud,
  Shield
} from "lucide-react"
import { cn } from "@/lib/utils"

interface IDEPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function IDEPopup({ isOpen, onClose }: IDEPopupProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const features = [
    {
      icon: Code2,
      title: "Éditeur VS Code",
      description: "Éditeur de code complet avec coloration syntaxique et autocomplétion",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Terminal,
      title: "Terminal intégré",
      description: "Exécutez vos commandes directement dans le navigateur",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Cpu,
      title: "Environnement complet",
      description: "Node.js, React, Python - Tous les langages supportés",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Cloud,
      title: "Cloud natif",
      description: "Sauvegarde automatique dans le cloud, accessible de partout",
      color: "from-orange-500 to-orange-600"
    }
  ]

  // Animation d'entrée/sortie
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setStep(0)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  const handleDiscover = () => {
    router.push("/ide")
    onClose()
  }

  const handleNext = () => {
    if (step < features.length - 1) {
      setStep(step + 1)
    } else {
      handleDiscover()
    }
  }

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  // Fermer en cliquant à l'extérieur
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen && !isVisible) return null

  const CurrentIcon = features[step].icon

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300"
      onClick={handleBackdropClick}
    >
      <div 
        className={cn(
          "relative bg-gradient-to-br from-slate-900 to-blue-950/50 rounded-3xl shadow-2xl border border-blue-500/20 w-full max-w-md mx-4 transform transition-all duration-300",
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
      >
        {/* En-tête */}
        <div className="relative p-6 text-center border-b border-blue-500/20">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className={cn(
                "w-16 h-16 bg-gradient-to-br rounded-2xl flex items-center justify-center shadow-lg",
                features[step].color
              )}>
                <Code2 className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-purple-500 hover:bg-purple-600 px-2 py-1 text-xs border-0">
                  <Zap className="h-3 w-3 mr-1" />
                  NOUVEAU
                </Badge>
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            IDE en Ligne
          </h2>
          
          <p className="text-blue-200 text-base">
            Votre environnement de développement dans le navigateur
          </p>
        </div>

        {/* Contenu principal */}
        <div className="p-6">
          {/* Navigation des étapes */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={step === 0}
              className="h-8 w-8 p-0 rounded-full text-blue-300 hover:text-white hover:bg-blue-500/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Indicateur de progression */}
            <div className="flex gap-1">
              {features.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === step 
                      ? "bg-blue-400 w-6" 
                      : index < step
                      ? "bg-blue-600"
                      : "bg-blue-800"
                  )}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="h-8 w-8 p-0 rounded-full text-blue-300 hover:text-white hover:bg-blue-500/20"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Feature en cours */}
          <Card className="border-0 bg-blue-900/30 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 mb-6 border border-blue-500/20">
            <CardContent className="p-6 text-center">
              <div className={cn(
                "w-12 h-12 bg-gradient-to-br rounded-xl flex items-center justify-center mx-auto mb-4",
                features[step].color
              )}>
                <CurrentIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">
                {features[step].title}
              </h3>
              <p className="text-blue-200 text-sm leading-relaxed">
                {features[step].description}
              </p>
            </CardContent>
          </Card>

          {/* Points forts rapides */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-2 text-blue-200 p-2 rounded-lg bg-blue-800/30 border border-blue-500/20">
              <Star className="h-4 w-4 text-yellow-400 fill-current flex-shrink-0" />
              <span className="text-sm font-medium">Gratuit</span>
            </div>
            <div className="flex items-center gap-2 text-blue-200 p-2 rounded-lg bg-blue-800/30 border border-blue-500/20">
              <Star className="h-4 w-4 text-yellow-400 fill-current flex-shrink-0" />
              <span className="text-sm font-medium">Instantané</span>
            </div>
            <div className="flex items-center gap-2 text-blue-200 p-2 rounded-lg bg-blue-800/30 border border-blue-500/20">
              <Star className="h-4 w-4 text-yellow-400 fill-current flex-shrink-0" />
              <span className="text-sm font-medium">Collaboratif</span>
            </div>
            <div className="flex items-center gap-2 text-blue-200 p-2 rounded-lg bg-blue-800/30 border border-blue-500/20">
              <Shield className="h-4 w-4 text-green-400 flex-shrink-0" />
              <span className="text-sm font-medium">Sécurisé</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1 border-blue-500 text-blue-300 hover:bg-blue-500/20 hover:text-white"
            >
              Plus tard
            </Button>
            <Button
              onClick={handleNext}
              className={cn(
                "flex-1 bg-gradient-to-r shadow-lg transition-all duration-200 border-0",
                step === features.length - 1 
                  ? "from-green-500 to-green-600 shadow-green-500/25 hover:from-green-600 hover:to-green-700"
                  : "from-blue-500 to-purple-600 shadow-blue-500/25 hover:from-blue-600 hover:to-purple-700"
              )}
            >
              {step === features.length - 1 ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Essayer maintenant
                </>
              ) : (
                <>
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Bouton de fermeture */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-blue-300 hover:text-white transition-colors p-1 rounded-full hover:bg-blue-500/20"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Indicateur de progression en bas */}
        <div className="px-6 pb-4">
          <div className="text-center text-xs text-blue-400">
            {step + 1} sur {features.length} • Développez sans limites
          </div>
        </div>
      </div>
    </div>
  )
}