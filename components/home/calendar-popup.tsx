// components/home/calendar-popup.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  CheckCircle, 
  X, 
  Sparkles,
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Locale } from "@/lib/i18n/config"

interface CalendarPopupProps {
  isOpen: boolean
  onClose: () => void
  dict?: any
  lang?: Locale
}

export function CalendarPopup({ isOpen, onClose, dict, lang = "fr" }: CalendarPopupProps) {
  const router = useRouter()
  const params = useParams()
  const currentLang = (params.lang as Locale) || lang
  const [step, setStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  // Translations
  const t = {
    title: dict?.calendarPopup?.title || "Votre Calendrier Intelligent",
    subtitle: dict?.calendarPopup?.subtitle || "Découvrez votre nouvel outil de gestion du temps",
    new: dict?.calendarPopup?.new || "Nouveau",
    later: dict?.calendarPopup?.later || "Plus tard",
    discover: dict?.calendarPopup?.discover || "Découvrir",
    next: dict?.calendarPopup?.next || "Suivant",
    free: dict?.calendarPopup?.free || "Gratuit",
    sync: dict?.calendarPopup?.sync || "Synchro",
    reminders: dict?.calendarPopup?.reminders || "Rappels",
    mobile: dict?.calendarPopup?.mobile || "Mobile",
    features: [
      {
        title: dict?.calendarPopup?.feature1?.title || "Gestion du temps",
        description: dict?.calendarPopup?.feature1?.description || "Planifiez vos rendez-vous et deadlines efficacement"
      },
      {
        title: dict?.calendarPopup?.feature2?.title || "Réunions clients",
        description: dict?.calendarPopup?.feature2?.description || "Organisez vos appels et réunions en un clic"
      },
      {
        title: dict?.calendarPopup?.feature3?.title || "Intégrations",
        description: dict?.calendarPopup?.feature3?.description || "Lien avec Google Meet, Zoom et autres outils"
      },
      {
        title: dict?.calendarPopup?.feature4?.title || "Suivi des projets",
        description: dict?.calendarPopup?.feature4?.description || "Suivez l'avancement de vos missions"
      }
    ]
  }

  const features = [
    {
      icon: Clock,
      title: t.features[0].title,
      description: t.features[0].description,
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Users,
      title: t.features[1].title,
      description: t.features[1].description,
      color: "from-green-500 to-green-600"
    },
    {
      icon: Video,
      title: t.features[2].title,
      description: t.features[2].description,
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: CheckCircle,
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
    router.push(`/${currentLang}/calendar`)
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className={cn(
          "relative bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-blue-950/30 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 w-full max-w-[90%] sm:max-w-md mx-auto transform transition-all duration-300",
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
      >
        {/* Close button - top right */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 z-10"
          aria-label="Close"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Header */}
        <div className="relative pt-8 sm:pt-12 px-4 sm:px-6 pb-4 text-center border-b border-white/20">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className={cn(
                "w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br rounded-2xl flex items-center justify-center shadow-lg",
                features[step].color
              )}>
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-green-500 hover:bg-green-600 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs border-0">
                  <Sparkles className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                  {t.new}
                </Badge>
              </div>
            </div>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 sm:mb-2 px-2">
            {t.title}
          </h2>
          
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm md:text-base px-2">
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
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full disabled:opacity-50"
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
                      ? "bg-blue-500 w-4 sm:w-6" 
                      : index < step
                      ? "bg-blue-300 dark:bg-blue-600 w-1.5 sm:w-2"
                      : "bg-slate-300 dark:bg-slate-600 w-1.5 sm:w-2"
                  )}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full"
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>

          {/* Current feature */}
          <Card className="border-0 bg-white/50 dark:bg-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300 mb-4 sm:mb-6">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4",
                features[step].color
              )}>
                <CurrentIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base mb-1 sm:mb-2">
                {features[step].title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed px-2">
                {features[step].description}
              </p>
            </CardContent>
          </Card>

          {/* Quick highlights */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-700 dark:text-slate-300 p-1.5 sm:p-2 rounded-lg bg-white/30 dark:bg-slate-800/30">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium truncate">{t.free}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-700 dark:text-slate-300 p-1.5 sm:p-2 rounded-lg bg-white/30 dark:bg-slate-800/30">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium truncate">{t.sync}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-700 dark:text-slate-300 p-1.5 sm:p-2 rounded-lg bg-white/30 dark:bg-slate-800/30">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium truncate">{t.reminders}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-700 dark:text-slate-300 p-1.5 sm:p-2 rounded-lg bg-white/30 dark:bg-slate-800/30">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium truncate">{t.mobile}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm py-2 sm:py-2.5 h-auto"
            >
              {t.later}
            </Button>
            <Button
              onClick={handleNext}
              className={cn(
                "flex-1 bg-gradient-to-r shadow-lg transition-all duration-200 text-xs sm:text-sm py-2 sm:py-2.5 h-auto",
                step === features.length - 1 
                  ? "from-green-500 to-green-600 shadow-green-500/25 hover:from-green-600 hover:to-green-700"
                  : "from-blue-500 to-purple-600 shadow-blue-500/25 hover:from-blue-600 hover:to-purple-700"
              )}
            >
              {step === features.length - 1 ? (
                <>
                  {t.discover}
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
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

        {/* Step indicator */}
        <div className="px-4 sm:px-6 pb-3 sm:pb-4">
          <div className="text-center text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
            {step + 1} / {features.length}
          </div>
        </div>
      </div>
    </div>
  )
}