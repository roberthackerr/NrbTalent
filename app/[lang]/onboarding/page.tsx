// app/[lang]/onboarding/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, ArrowRight, ArrowLeft, Sparkles, Trophy, Target,
  Users, Camera, Zap, Briefcase, ChevronLeft, ChevronRight
} from 'lucide-react'
import { AvatarStep } from '@/components/onboarding/AvatarStep'
import { SkillsTab } from '@/components/settings/skills-tab'
import { PortfolioTab } from '@/components/settings/portfolio-tab'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import { toast } from 'sonner'
import type { Locale } from '@/lib/i18n/config'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'

type OnboardingStep = 'welcome' | 'avatar' | 'skills' | 'portfolio'

interface StepConfig {
  id: OnboardingStep
  title: string
  description: string
  color: string
  icon: any
}

// Mobile Step Indicator
interface MobileStepIndicatorProps {
  steps: StepConfig[]
  currentStep: OnboardingStep
  completedSteps: OnboardingStep[]
  onPrevious: () => void
  onNext: () => void
  onGoToStep: (step: OnboardingStep) => void
}

function MobileStepIndicator({
  steps,
  currentStep,
  completedSteps,
  onPrevious,
  onNext,
  onGoToStep,
}: MobileStepIndicatorProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep)
  const isFirst = currentIndex === 0

  return (
    <div className="flex items-center justify-between mb-4 px-2">
      <button
        onClick={onPrevious}
        disabled={isFirst}
        className={`p-2 rounded-full transition-colors ${
          isFirst
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="flex gap-2">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => onGoToStep(step.id)}
            className={`h-2 rounded-full transition-all ${
              currentStep === step.id
                ? 'w-6 bg-gradient-to-r ' + step.color
                : completedSteps.includes(step.id)
                ? 'w-2 bg-green-500'
                : 'w-2 bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>

      <button
        onClick={onNext}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}

// Step content wrapper with animation
function AnimatedStep({ children, isVisible }: { children: React.ReactNode; isVisible: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function OnboardingPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const params = useParams()
  const lang = params.lang as Locale

  const [dict, setDict] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [loading, setLoading] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)

    getDictionarySafe(lang).then(setDict)

    if (session?.user?.onboardingCompleted) {
      router.push(`/${lang}`)
    }

    return () => window.removeEventListener('resize', checkMobile)
  }, [session, router, lang])

  const steps: StepConfig[] = dict
    ? [
        {
          id: 'avatar',
          title: dict.onboardingPage.avatar.title,
          description: dict.onboardingPage.avatar.description,
          color: 'from-blue-500 to-cyan-500',
          icon: Camera,
        },
        {
          id: 'skills',
          title: dict.onboardingPage.skills.title,
          description: dict.onboardingPage.skills.description,
          color: 'from-purple-500 to-pink-500',
          icon: Zap,
        },
        {
          id: 'portfolio',
          title: dict.onboardingPage.portfolio.title,
          description: dict.onboardingPage.portfolio.description,
          color: 'from-orange-500 to-red-500',
          icon: Briefcase,
        },
      ]
    : []

  const progress = !dict || currentStep === 'welcome'
    ? 0
    : ((steps.findIndex((step) => step.id === currentStep) + 1) / (steps.length + 1)) * 100

  const handleStartOnboarding = () => setCurrentStep('avatar')

  const handleNext = async () => {
    if (currentStep === 'portfolio') {
      await handleCompleteOnboarding()
    } else {
      const currentIndex = steps.findIndex((step) => step.id === currentStep)
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1].id)
        if (isMobile) window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  const handlePrevious = () => {
    const currentIndex = steps.findIndex((step) => step.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id)
      if (isMobile) window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (currentIndex === 0) {
      setCurrentStep('welcome')
    }
  }

  const handleStepComplete = (step: OnboardingStep) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps((prev) => [...prev, step])
      toast.success(dict?.onboardingPage.stepCompleted || 'Step completed!')
    }
  }

  const handleCompleteOnboarding = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'onboardingCompleted',
          data: { onboardingCompleted: true },
        }),
      })

      if (response.ok) {
        await update()
        toast.success(dict?.onboardingPage.complete || 'Profile setup complete!')
        setTimeout(() => router.push(`/${lang}`), 1500)
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast.error(dict?.onboardingPage.error || 'Failed to complete onboarding')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    if (!dict || !isMounted) return null

    switch (currentStep) {
      case 'welcome':
        return (
          <AnimatedStep isVisible={currentStep === 'welcome'}>
            <div className="text-center py-8">
              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-20 animate-pulse" />
                <div className="absolute inset-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                {dict.onboardingPage.welcomeTitle}
              </h2>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {dict.onboardingPage.welcomeDescription}
              </p>

              {/* Benefits - Compact grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                {[
                  {
                    icon: <Trophy className="w-5 h-5 text-yellow-500" />,
                    title: dict.onboardingPage.benefits?.expertise || 'Showcase Expertise',
                  },
                  {
                    icon: <Target className="w-5 h-5 text-blue-500" />,
                    title: dict.onboardingPage.benefits?.clients || 'Attract Clients',
                  },
                  {
                    icon: <Users className="w-5 h-5 text-purple-500" />,
                    title: dict.onboardingPage.benefits?.trust || 'Build Trust',
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="mb-2">{item.icon}</div>
                    <p className="text-xs font-medium text-gray-800 dark:text-white">
                      {item.title}
                    </p>
                  </div>
                ))}
              </div>

              {/* Start Button */}
              <Button
                onClick={handleStartOnboarding}
                className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 rounded-lg shadow-lg"
                size="default"
              >
                {dict.onboardingPage.startOnboarding}
              </Button>
            </div>
          </AnimatedStep>
        )

      case 'avatar':
        return (
          <AnimatedStep isVisible={currentStep === 'avatar'}>
            <div className="space-y-4">
              <AvatarStep
                onComplete={() => handleStepComplete('avatar')}
                onSkip={handleNext}
                dict={dict.onboardingPage.avatar}
                lang={lang}
              />
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  💡 {dict.onboardingPage.tips?.avatar || 'A professional photo helps build trust with clients'}
                </p>
              </div>
            </div>
          </AnimatedStep>
        )

      case 'skills':
        return (
          <AnimatedStep isVisible={currentStep === 'skills'}>
            <div className="space-y-4">
              <SkillsTab
                user={session?.user}
                dict={dict.onboardingPage.skills}
                lang={lang}
                onUpdate={() => handleStepComplete('skills')}
              />
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  💡 {dict.onboardingPage.tips?.skills || 'Add skills that match your expertise for better matches'}
                </p>
              </div>
            </div>
          </AnimatedStep>
        )

      case 'portfolio':
        return (
          <AnimatedStep isVisible={currentStep === 'portfolio'}>
            <div className="space-y-4">
              <PortfolioTab
                user={session?.user}
                dict={dict}
                lang={lang}
                onUpdate={() => handleStepComplete('portfolio')}
              />
              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  💡 {dict.onboardingPage.tips?.portfolio || 'Showcase your best work to impress clients'}
                </p>
              </div>
            </div>
          </AnimatedStep>
        )

      default:
        return null
    }
  }

  if (!isMounted || !dict) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const currentStepConfig = steps.find((s) => s.id === currentStep)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4">
      <div className="container max-w-4xl mx-auto px-4">
        
        {/* Header with Language Switcher */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher lang={lang} />
        </div>

        {/* Mobile Step Indicator */}
        {currentStep !== 'welcome' && isMobile && steps.length > 0 && (
          <MobileStepIndicator
            steps={steps}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onGoToStep={setCurrentStep}
          />
        )}

        {/* Compact Desktop Header */}
        {currentStep !== 'welcome' && !isMobile && (
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {dict.onboardingPage.pageTitle}
            </h1>
          </div>
        )}

        {/* Compact Progress Bar */}
        {currentStep !== 'welcome' && (
          <div className="mb-6">
            <Progress value={progress} className="h-1.5" />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Step {steps.findIndex((step) => step.id === currentStep) + 1}/{steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        )}

        {/* Desktop Step Indicators - Compact */}
        {currentStep !== 'welcome' && !isMobile && steps.length > 0 && (
          <div className="flex gap-2 mb-6">
            {steps.map((step) => {
              const isCompleted = completedSteps.includes(step.id)
              const isCurrent = currentStep === step.id
              const StepIcon = step.icon

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex-1 p-2 rounded-lg transition-all ${
                    isCurrent
                      ? `bg-gradient-to-r ${step.color} shadow-md`
                      : isCompleted
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className={`flex-shrink-0 ${
                      isCurrent ? 'text-white' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    <span className={`text-xs font-medium ${
                      isCurrent ? 'text-white' : isCompleted ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Main Content Card - Compact */}
        <Card className="border-gray-200 dark:border-gray-800 shadow-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons - Desktop */}
        {currentStep !== 'welcome' && !isMobile && (
          <div className="flex justify-between gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 'avatar'}
              size="sm"
              className="flex-1"
            >
              <ArrowLeft className="h-3 w-3 mr-2" />
              {dict.onboardingPage.previous}
            </Button>

            <Button
              onClick={handleNext}
              disabled={loading}
              size="sm"
              className={`flex-1 ${
                currentStep === 'portfolio'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {dict.onboardingPage.saving}
                </>
              ) : currentStep === 'portfolio' ? (
                <>
                  {dict.onboardingPage.finish}
                  <CheckCircle className="h-3 w-3 ml-2" />
                </>
              ) : (
                <>
                  {dict.onboardingPage.next}
                  <ArrowRight className="h-3 w-3 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Navigation - Mobile */}
        {currentStep !== 'welcome' && isMobile && (
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 'avatar'}
              className="flex-1"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {dict.onboardingPage.previous}
            </Button>

            <Button
              onClick={handleNext}
              disabled={loading}
              className={`flex-1 ${
                currentStep === 'portfolio'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600'
              }`}
              size="sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {dict.onboardingPage.saving}
                </>
              ) : currentStep === 'portfolio' ? (
                <>
                  {dict.onboardingPage.finish}
                  <CheckCircle className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  {dict.onboardingPage.next}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Skip Button - Compact */}
        {currentStep !== 'welcome' && currentStep !== 'portfolio' && (
          <div className="text-center mt-3">
            <button
              onClick={handleNext}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            >
              {dict.onboardingPage.skip || 'Skip for now →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}