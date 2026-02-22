// app/onboarding/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, ArrowRight, ArrowLeft, Globe, Sparkles, Trophy, Target, Users } from 'lucide-react'
import { AvatarStep } from '@/components/onboarding/AvatarStep'
import { SkillsTab } from '@/components/settings/skills-tab'
import { PortfolioTab } from '@/components/settings/portfolio-tab'
import { onboardingDictionary } from '@/lib/dictionaries/onboarding-dictionary'
import { toast } from 'sonner'

type OnboardingStep = 'welcome' | 'avatar' | 'skills' | 'portfolio'
type Language = 'en' | 'fr'

export default function OnboardingPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [language, setLanguage] = useState<Language>('en')
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [loading, setLoading] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([])
  const [isMounted, setIsMounted] = useState(false)

  const dict = onboardingDictionary[language]

  useEffect(() => {
    setIsMounted(true)
    
    // Vérifier si l'utilisateur a déjà complété l'onboarding
    if (session?.user?.onboardingCompleted) {
      router.push('/dashboard')
    }
    
    // Déterminer la langue préférée
    const userLang = navigator.language.startsWith('fr') ? 'fr' : 'en'
    setLanguage(userLang)
  }, [session, router])

  const steps: { 
    id: OnboardingStep; 
    title: string; 
    description: string; 
    icon: any;
    color: string;
  }[] = [
    {
      id: 'avatar',
      title: dict.avatar.title,
      description: dict.avatar.description,
      icon: dict.Camera,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'skills',
      title: dict.skills.title,
      description: dict.skills.description,
      icon: dict.Zap,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'portfolio',
      title: dict.portfolio.title,
      description: dict.portfolio.description,
      icon: dict.FolderOpen,
      color: 'from-orange-500 to-red-500'
    }
  ]

  const progress = currentStep === 'welcome' 
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
      }
    }
  }

  const handlePrevious = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id)
    } else if (currentIndex === 0) {
      setCurrentStep('welcome')
    }
  }

  const handleStepComplete = (step: OnboardingStep) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps(prev => [...prev, step])
      toast.success(language === 'en' ? 'Step completed!' : 'Étape terminée !')
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
          section:"onboardingCompleted",
          data: { onboardingCompleted: true }
        })
      })

      if (response.ok) {
        await update()
        toast.success(language === 'en' 
          ? 'Profile setup complete!' 
          : 'Configuration du profil terminée !')
        
        // Rediriger après un court délai
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast.error(language === 'en' 
        ? 'Failed to complete onboarding' 
        : 'Échec de la complétion de l\'onboarding')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    if (!isMounted) return null

    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center py-12">
            <div className="w-32 h-32 mx-auto mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute inset-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-white" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              {dict.welcomeTitle}
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
              {dict.welcomeDescription}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                {
                  icon: <Trophy className="w-8 h-8 text-yellow-500" />,
                  title: language === 'en' ? 'Showcase Expertise' : 'Montrez votre expertise',
                  description: language === 'en' 
                    ? 'Highlight your skills and experience' 
                    : 'Mettez en valeur vos compétences et votre expérience'
                },
                {
                  icon: <Target className="w-8 h-8 text-blue-500" />,
                  title: language === 'en' ? 'Attract Clients' : 'Attirez des clients',
                  description: language === 'en' 
                    ? 'Get discovered by the right clients' 
                    : 'Soyez découvert par les bons clients'
                },
                {
                  icon: <Users className="w-8 h-8 text-purple-500" />,
                  title: language === 'en' ? 'Build Trust' : 'Établissez la confiance',
                  description: language === 'en' 
                    ? 'Professional profile increases credibility' 
                    : 'Un profil professionnel augmente votre crédibilité'
                }
              ].map((item, index) => (
                <div key={index} className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="mb-4">{item.icon}</div>
                  <h3 className="font-bold text-gray-800 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                </div>
              ))}
            </div>
            
            <Button
              onClick={handleStartOnboarding}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg"
              size="lg"
            >
              {dict.startOnboarding}
            </Button>
          </div>
        )

      case 'avatar':
        return (
          <div className="space-y-6">
            <AvatarStep 
              onComplete={() => handleStepComplete('avatar')}
              onSkip={handleNext}
              language={language}
            />
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💡 {dict.tips.avatar}
              </p>
            </div>
          </div>
        )

      case 'skills':
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                {dict.skills.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {dict.skills.description}
              </p>
            </div>
            
            <SkillsTab 
              user={session?.user} 
              onUpdate={() => handleStepComplete('skills')}
            />
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💡 {dict.tips.skills}
              </p>
            </div>
          </div>
        )

      case 'portfolio':
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                {dict.portfolio.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {dict.portfolio.description}
              </p>
            </div>
            
            <PortfolioTab 
              user={session?.user}
              onUpdate={() => handleStepComplete('portfolio')}
            />
            
            <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💡 {dict.tips.portfolio}
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {dict.loading}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Sélecteur de langue */}
        <div className="flex justify-end mb-6">
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
            <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 text-gray-800 dark:text-gray-200"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>

        {/* En-tête */}
        {currentStep !== 'welcome' && (
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {dict.pageTitle}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {dict.pageSubtitle}
            </p>
          </div>
        )}

        {/* Barre de progression */}
        {currentStep !== 'welcome' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {dict.progress}
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {dict.step} {steps.findIndex(step => step.id === currentStep) + 1} {dict.of} {steps.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>{Math.round(progress)}% {dict.completed}</span>
              <span>
                {completedSteps.length} {dict.of} {steps.length} {dict.completed}
              </span>
            </div>
          </div>
        )}

        {/* Étapes (sauf pour la page d'accueil) */}
        {currentStep !== 'welcome' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {steps.map((step) => {
              const isCompleted = completedSteps.includes(step.id)
              const isCurrent = currentStep === step.id
              const StepIcon = step.icon

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`p-4 rounded-xl border-2 transition-all transform hover:scale-[1.02] ${
                    isCurrent
                      ? `border-blue-500 bg-gradient-to-r ${step.color} bg-opacity-10 shadow-lg scale-[1.02]`
                      : isCompleted
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      isCurrent
                        ? `bg-gradient-to-r ${step.color} text-white shadow-lg`
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <StepIcon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className={`font-semibold ${
                        isCurrent
                          ? 'text-blue-900 dark:text-blue-100'
                          : isCompleted
                          ? 'text-green-900 dark:text-green-100'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {step.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Contenu de l'étape */}
        <Card className="border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <CardHeader className={`pb-6 ${
            currentStep === 'welcome' 
              ? 'bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10' 
              : ''
          }`}>
            {currentStep !== 'welcome' && (
              <>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  {(() => {
                    const step = steps.find(s => s.id === currentStep)
                    const Icon = step?.icon
                    return (
                      <>
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${step?.color} text-white`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        {step?.title}
                      </>
                    )
                  })()}
                </CardTitle>
                <CardDescription className="text-base">
                  {steps.find(step => step.id === currentStep)?.description}
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation (sauf pour la page d'accueil) */}
        {currentStep !== 'welcome' && (
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 'avatar'}
              className="flex items-center gap-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              {dict.previous}
            </Button>

            <Button
              onClick={handleNext}
              disabled={loading}
              className={`flex items-center gap-2 ${
                currentStep === 'portfolio'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90'
              } text-white shadow-lg`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {language === 'en' ? 'Processing...' : 'Traitement...'}
                </>
              ) : currentStep === 'portfolio' ? (
                <>
                  {dict.finish}
                  <CheckCircle className="h-4 w-4" />
                </>
              ) : (
                <>
                  {dict.next}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Indicateur de saut */}
        {currentStep !== 'welcome' && currentStep !== 'portfolio' && (
          <div className="text-center mt-6">
            <button
              onClick={handleNext}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            >
              {dict.skip}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}