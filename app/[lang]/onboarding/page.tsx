// app/[lang]/onboarding/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, ArrowRight, ArrowLeft, Sparkles, Trophy, Target, Users, Camera, Zap, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react'
import { AvatarStep } from '@/components/onboarding/AvatarStep'
import { SkillsTab } from '@/components/settings/skills-tab'
import { PortfolioTab } from '@/components/settings/portfolio-tab'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import { toast } from 'sonner'
import type { Locale } from '@/lib/i18n/config'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

type OnboardingStep = 'welcome' | 'avatar' | 'skills' | 'portfolio'

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
    
    // Check mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Load dictionary
    getDictionarySafe(lang).then(setDict)
    
    // Check if user already completed onboarding
    if (session?.user?.onboardingCompleted) {
      router.push(`/${lang}`)
    }

    return () => window.removeEventListener('resize', checkMobile)
  }, [session, router, lang])

  const steps: { 
    id: OnboardingStep; 
    title: string; 
    description: string; 
    color: string;
    icon: any;
  }[] = dict ? [
    {
      id: 'avatar',
      title: dict.onboardingPage.avatar.title,
      description: dict.onboardingPage.avatar.description,
      color: 'from-blue-500 to-cyan-500',
      icon: Camera
    },
    {
      id: 'skills',
      title: dict.onboardingPage.skills.title,
      description: dict.onboardingPage.skills.description,
      color: 'from-purple-500 to-pink-500',
      icon: Zap
    },
    {
      id: 'portfolio',
      title: dict.onboardingPage.portfolio.title,
      description: dict.onboardingPage.portfolio.description,
      color: 'from-orange-500 to-red-500',
      icon: Briefcase
    }
  ] : []

  const progress = !dict || currentStep === 'welcome' 
    ? 0 
    : ((steps.findIndex(step => step.id === currentStep) + 1) / (steps.length + 1)) * 100

  const handleStartOnboarding = () => {
    setCurrentStep('avatar')
  }

  const handleNext = async () => {
    if (currentStep === 'portfolio') {
      await handleCompleteOnboarding()
    } else {
      const currentIndex = steps.findIndex(step => step.id === currentStep)
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1].id)
        // Scroll to top on mobile
        if (isMobile) {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }
    }
  }

  const handlePrevious = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id)
      // Scroll to top on mobile
      if (isMobile) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } else if (currentIndex === 0) {
      setCurrentStep('welcome')
    }
  }

  const handleStepComplete = (step: OnboardingStep) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps(prev => [...prev, step])
      toast.success(dict?.onboardingPage.success || 'Step completed!')
    }
  }

  const handleCompleteOnboarding = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: "onboardingCompleted",
          data: { onboardingCompleted: true }
        })
      })

      if (response.ok) {
        await update()
        toast.success(dict?.onboardingPage.success || 'Profile setup complete!')
        
        setTimeout(() => {
          router.push(`/${lang}`)
        }, 1500)
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
          <div className="text-center py-8 sm:py-12">
            {/* Animated Logo */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute inset-2 sm:inset-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4 px-4">
              {dict.onboardingPage.welcomeTitle}
            </h2>
            
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              {dict.onboardingPage.welcomeDescription}
            </p>
            
            {/* Benefits Grid - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 px-4">
              {[
                {
                  icon: <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />,
                  title: dict.onboardingPage.benefits?.expertise || 'Showcase Expertise',
                  description: dict.onboardingPage.benefits?.expertiseDesc || 'Highlight your skills and experience'
                },
                {
                  icon: <Target className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />,
                  title: dict.onboardingPage.benefits?.clients || 'Attract Clients',
                  description: dict.onboardingPage.benefits?.clientsDesc || 'Get discovered by the right clients'
                },
                {
                  icon: <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />,
                  title: dict.onboardingPage.benefits?.trust || 'Build Trust',
                  description: dict.onboardingPage.benefits?.trustDesc || 'Professional profile increases credibility'
                }
              ].map((item, index) => (
                <div key={index} className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-3 sm:mb-4">{item.icon}</div>
                  <h3 className="font-bold text-gray-800 dark:text-white mb-1 sm:mb-2 text-sm sm:text-base">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
            
            <Button
              onClick={handleStartOnboarding}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg"
              size={isMobile ? "default" : "lg"}
            >
              {dict.onboardingPage.startOnboarding}
            </Button>
          </div>
        )

      case 'avatar':
        return (
          <div className="space-y-4 sm:space-y-6">
            <AvatarStep 
              onComplete={() => handleStepComplete('avatar')}
              onSkip={handleNext}
              dict={dict.onboardingPage.avatar}
              lang={lang}
            />
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                💡 {dict.onboardingPage.tips?.avatar || 'Add a professional photo to build trust with potential clients'}
              </p>
            </div>
          </div>
        )

      case 'skills':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-1 sm:mb-2">
                {dict.onboardingPage.skills.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {dict.onboardingPage.skills.description}
              </p>
            </div>
            
            <SkillsTab 
              user={session?.user}
              dict={dict.onboardingPage.skills}
              lang={lang}
              onUpdate={() => handleStepComplete('skills')}
            />
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                💡 {dict.onboardingPage.tips?.skills || 'Add skills that match your expertise to get better project matches'}
              </p>
            </div>
          </div>
        )

      case 'portfolio':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-1 sm:mb-2">
                {dict.onboardingPage.portfolio.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {dict.onboardingPage.portfolio.description}
              </p>
            </div>
            
            <PortfolioTab 
              user={session?.user}
              dict={dict}
              lang={lang}
              onUpdate={() => handleStepComplete('portfolio')}
            />
            
            <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                💡 {dict.onboardingPage.tips?.portfolio || 'Showcase your best work to impress potential clients'}
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Mobile step indicator
  const MobileStepIndicator = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep)
    
    return (
      <div className="flex items-center justify-between mb-6 px-2">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0 && currentStep !== 'skills' && currentStep !== 'portfolio'}
          className={`p-2 rounded-full ${currentIndex === 0 && currentStep !== 'skills' && currentStep !== 'portfolio' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <div className="flex gap-2">
          {steps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
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
          onClick={handleNext}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    )
  }

  if (!isMounted || !dict) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {dict?.onboardingPage?.loading || 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4 sm:py-6 md:py-8">
      <div className="container max-w-5xl mx-auto px-3 sm:px-4">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4 sm:mb-6">
          <LanguageSwitcher lang={lang} />
        </div>

        {/* Mobile Step Indicator */}
        {currentStep !== 'welcome' && isMobile && (
          <MobileStepIndicator />
        )}

        {/* Desktop Header */}
        {currentStep !== 'welcome' && !isMobile && (
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {dict.onboardingPage.pageTitle}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {dict.onboardingPage.pageSubtitle}
            </p>
          </div>
        )}

        {/* Progress Bar */}
        {currentStep !== 'welcome' && (
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-2 text-xs sm:text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {dict.onboardingPage.progress}
              </span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {dict.onboardingPage.step} {steps.findIndex(step => step.id === currentStep) + 1} {dict.onboardingPage.of} {steps.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>{Math.round(progress)}% {dict.onboardingPage.completed}</span>
              <span>
                {completedSteps.length} {dict.onboardingPage.of} {steps.length} {dict.onboardingPage.completed}
              </span>
            </div>
          </div>
        )}

        {/* Step Cards - Desktop */}
        {currentStep !== 'welcome' && !isMobile && steps.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {steps.map((step) => {
              const isCompleted = completedSteps.includes(step.id)
              const isCurrent = currentStep === step.id
              const StepIcon = step.icon

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                    isCurrent
                      ? `border-blue-500 bg-gradient-to-r ${step.color} bg-opacity-10 shadow-lg`
                      : isCompleted
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                      isCurrent
                        ? `bg-gradient-to-r ${step.color} text-white`
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                      ) : (
                        <StepIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className={`font-semibold text-sm sm:text-base ${
                        isCurrent
                          ? 'text-blue-900 dark:text-blue-100'
                          : isCompleted
                          ? 'text-green-900 dark:text-green-100'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {step.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Main Content Card */}
        <Card className="border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <CardHeader className={`pb-4 sm:pb-6 ${
            currentStep === 'welcome' 
              ? 'bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10' 
              : ''
          }`}>
            {currentStep !== 'welcome' && !isMobile && (
              <>
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl">
                  <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-r ${
                    steps.find(s => s.id === currentStep)?.color
                  } text-white`}>
                    {currentStep === 'avatar' && <Camera className="h-4 w-4 sm:h-5 sm:w-5" />}
                    {currentStep === 'skills' && <Zap className="h-4 w-4 sm:h-5 sm:w-5" />}
                    {currentStep === 'portfolio' && <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </div>
                  {steps.find(s => s.id === currentStep)?.title}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {steps.find(step => step.id === currentStep)?.description}
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons - Desktop */}
        {currentStep !== 'welcome' && !isMobile && (
          <div className="flex justify-between mt-6 sm:mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 'avatar'}
              className="flex items-center gap-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
              size={isMobile ? "sm" : "default"}
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              {dict.onboardingPage.previous}
            </Button>

            <Button
              onClick={handleNext}
              disabled={loading}
              className={`flex items-center gap-2 ${
                currentStep === 'portfolio'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90'
              } text-white shadow-lg text-sm`}
              size={isMobile ? "sm" : "default"}
            >
              {loading ? (
                <>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {dict.onboardingPage.saving}
                </>
              ) : currentStep === 'portfolio' ? (
                <>
                  {dict.onboardingPage.finish}
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                </>
              ) : (
                <>
                  {dict.onboardingPage.next}
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Mobile Navigation Buttons */}
        {currentStep !== 'welcome' && isMobile && (
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 'avatar'}
              className="flex-1 gap-2 border-gray-300 dark:border-gray-600"
            >
              <ArrowLeft className="h-4 w-4" />
              {dict.onboardingPage.previous}
            </Button>

            <Button
              onClick={handleNext}
              disabled={loading}
              className={`flex-1 gap-2 ${
                currentStep === 'portfolio'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600'
              } text-white`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {dict.onboardingPage.saving}
                </>
              ) : currentStep === 'portfolio' ? (
                <>
                  {dict.onboardingPage.finish}
                  <CheckCircle className="h-4 w-4" />
                </>
              ) : (
                <>
                  {dict.onboardingPage.next}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Skip Button - Mobile */}
        {currentStep !== 'welcome' && currentStep !== 'portfolio' && isMobile && (
          <div className="text-center mt-4">
            <button
              onClick={handleNext}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            >
              {dict.onboardingPage.skip}
            </button>
          </div>
        )}

        {/* Skip Button - Desktop */}
        {currentStep !== 'welcome' && currentStep !== 'portfolio' && !isMobile && (
          <div className="text-center mt-4">
            <button
              onClick={handleNext}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            >
              {dict.onboardingPage.skip}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}