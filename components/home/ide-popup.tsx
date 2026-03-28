// components/home/ide-popup.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
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
import type { Locale } from "@/lib/i18n/config"

interface IDEPopupProps {
  isOpen: boolean
  onClose: () => void
  dict?: any
  lang?: Locale
}

export function IDEPopup({ isOpen, onClose, dict, lang = "fr" }: IDEPopupProps) {
  const router = useRouter()
  const params = useParams()
  const currentLang = (params.lang as Locale) || lang
  const [step, setStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  // Translations
  const t = {
    title: dict?.idePopup?.title || "IDE en Ligne",
    subtitle: dict?.idePopup?.subtitle || "Votre environnement de développement dans le navigateur",
    new: dict?.idePopup?.new || "NOUVEAU",
    later: dict?.idePopup?.later || "Plus tard",
    tryNow: dict?.idePopup?.tryNow || "Essayer maintenant",
    next: dict?.idePopup?.next || "Suivant",
    free: dict?.idePopup?.free || "Gratuit",
    instant: dict?.idePopup?.instant || "Instantané",
    collaborative: dict?.idePopup?.collaborative || "Collaboratif",
    secure: dict?.idePopup?.secure || "Sécurisé",
    develop: dict?.idePopup?.develop || "Développez sans limites",
    features: [
      {
        title: dict?.idePopup?.feature1?.title || "Éditeur VS Code",
        description: dict?.idePopup?.feature1?.description || "Éditeur de code complet avec coloration syntaxique et autocomplétion"
      },
      {
        title: dict?.idePopup?.feature2?.title || "Terminal intégré",
        description: dict?.idePopup?.feature2?.description || "Exécutez vos commandes directement dans le navigateur"
      },
      {
        title: dict?.idePopup?.feature3?.title || "Environnement complet",
        description: dict?.idePopup?.feature3?.description || "Node.js, React, Python - Tous les langages supportés"
      },
      {
        title: dict?.idePopup?.feature4?.title || "Cloud natif",
        description: dict?.idePopup?.feature4?.description || "Sauvegarde automatique dans le cloud, accessible de partout"
      }
    ]
  }

  const features = [
    {
      icon: Code2,
      title: t.features[0].title,
      description: t.features[0].description,
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Terminal,
      title: t.features[1].title,
      description: t.features[1].description,
      color: "from-green-500 to-green-600"
    },
    {
      icon: Cpu,
      title: t.features[2].title,
      description: t.features[2].description,
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Cloud,
      title: t.features[3].title,
      description: t.features[3].description,
      color: "from-orange-500 to-orange-600"
    }
  ]

  // Animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setStep(0)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  const handleDiscover = () => {
    router.push(`/${currentLang}/ide`)
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen && !isVisible) return null

  const CurrentIcon = features[step].icon

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className={cn(
          "relative bg-gradient-to-br from-slate-900 to-blue-950/80 rounded-2xl sm:rounded-3xl shadow-2xl border border-blue-500/30 w-full max-w-[90%] sm:max-w-md mx-auto transform transition-all duration-300",
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-blue-300 hover:text-white transition-colors p-1.5 sm:p-2 rounded-full hover:bg-blue-500/20 z-10"
          aria-label="Close"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Header */}
        <div className="relative pt-8 sm:pt-12 px-4 sm:px-6 pb-4 text-center border-b border-blue-500/20">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className={cn(
                "w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br rounded-2xl flex items-center justify-center shadow-lg",
                features[step].color
              )}>
                <Code2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-purple-500 hover:bg-purple-600 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs border-0">
                  <Zap className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                  {t.new}
                </Badge>
              </div>
            </div>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1 sm:mb-2 px-2">
            {t.title}
          </h2>
          
          <p className="text-blue-200 text-xs sm:text-sm md:text-base px-2">
            {t.subtitle}
          </p>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Step navigation */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={step === 0}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full text-blue-300 hover:text-white hover:bg-blue-500/20 disabled:opacity-50"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>

            {/* Progress indicators */}
            <div className="flex gap-1 sm:gap-1.5">
              {features.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-1.5 sm:h-2 rounded-full transition-all duration-300",
                    index === step 
                      ? "bg-blue-400 w-4 sm:w-6" 
                      : index < step
                      ? "bg-blue-600 w-1.5 sm:w-2"
                      : "bg-blue-800 w-1.5 sm:w-2"
                  )}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full text-blue-300 hover:text-white hover:bg-blue-500/20"
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>

          {/* Current feature */}
          <Card className="border-0 bg-blue-900/40 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 mb-4 sm:mb-6 border border-blue-500/30">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4",
                features[step].color
              )}>
                <CurrentIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white text-sm sm:text-base mb-1 sm:mb-2">
                {features[step].title}
              </h3>
              <p className="text-blue-200 text-xs sm:text-sm leading-relaxed px-2">
                {features[step].description}
              </p>
            </CardContent>
          </Card>

          {/* Quick highlights */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-1.5 sm:gap-2 text-blue-200 p-1.5 sm:p-2 rounded-lg bg-blue-800/40 border border-blue-500/30">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium truncate">{t.free}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-blue-200 p-1.5 sm:p-2 rounded-lg bg-blue-800/40 border border-blue-500/30">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium truncate">{t.instant}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-blue-200 p-1.5 sm:p-2 rounded-lg bg-blue-800/40 border border-blue-500/30">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium truncate">{t.collaborative}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-blue-200 p-1.5 sm:p-2 rounded-lg bg-blue-800/40 border border-blue-500/30">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium truncate">{t.secure}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1 border-blue-500 text-blue-300 hover:bg-blue-500/20 hover:text-white text-xs sm:text-sm py-2 sm:py-2.5 h-auto"
            >
              {t.later}
            </Button>
            <Button
              onClick={handleNext}
              className={cn(
                "flex-1 bg-gradient-to-r shadow-lg transition-all duration-200 border-0 text-xs sm:text-sm py-2 sm:py-2.5 h-auto",
                step === features.length - 1 
                  ? "from-green-500 to-green-600 shadow-green-500/25 hover:from-green-600 hover:to-green-700"
                  : "from-blue-500 to-purple-600 shadow-blue-500/25 hover:from-blue-600 hover:to-purple-700"
              )}
            >
              {step === features.length - 1 ? (
                <>
                  <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  {t.tryNow}
                </>
              ) : (
                <>
                  {t.next}
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Footer note */}
        <div className="px-4 sm:px-6 pb-3 sm:pb-4">
          <div className="text-center text-[10px] sm:text-xs text-blue-400">
            {step + 1} / {features.length} • {t.develop}
          </div>
        </div>
      </div>
    </div>
  )
}