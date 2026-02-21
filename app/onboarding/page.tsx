// app/onboarding/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Camera, Building, Zap, FolderOpen, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { ExperienceSection } from '@/components/settings/experience-section'
import { SkillsTab } from '@/components/settings/skills-tab'
import { PortfolioSection } from '@/components/settings/portfolio-section'
import { AvatarStep } from '@/components/onboarding/AvatarStep'

type OnboardingStep = 'avatar' | 'experience' | 'skills' | 'portfolio'

export default function OnboardingPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('avatar')
  const [loading, setLoading] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([])

  const steps: { id: OnboardingStep; title: string; description: string; icon: any }[] = [
    {
      id: 'avatar',
      title: 'Photo de profil',
      description: 'Ajoutez une photo pour personnaliser votre profil',
      icon: Camera
    },
    {
      id: 'experience',
      title: 'Expérience professionnelle',
      description: 'Montrez votre parcours et votre expertise',
      icon: Building
    },
    {
      id: 'skills',
      title: 'Compétences techniques',
      description: 'Listez vos technologies et domaines de compétence',
      icon: Zap
    },
    {
      id: 'portfolio',
      title: 'Portfolio',
      description: 'Présentez vos meilleurs projets',
      icon: FolderOpen
    }
  ]

  const progress = (steps.findIndex(step => step.id === currentStep) + 1) / steps.length * 100

  const handleNext = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id)
    } else {
      handleCompleteOnboarding()
    }
  }

  const handlePrevious = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id)
    }
  }

  const handleStepComplete = (step: OnboardingStep) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps(prev => [...prev, step])
    }
  }

  const handleCompleteOnboarding = async () => {
    setLoading(true)
    try {
      // Marquer l'onboarding comme terminé
      const response = await fetch('/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: 'onboarding',
          data: { completed: true }
        })
      })

      if (response.ok) {
        // Mettre à jour la session
        await update()
        router.push('/profile')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'avatar':
        return (
          <AvatarStep 
            onComplete={() => handleStepComplete('avatar')}
            onSkip={handleNext}
          />
        )
      case 'experience':
        return (
          <ExperienceSection 
            experiences={[]}
            onUpdate={() => handleStepComplete('experience')}
            loading={false}
          />
        )
      case 'skills':
        return <SkillsTab user={session?.user} />
      case 'portfolio':
        return (
          <PortfolioSection 
            items={[]}
            onUpdate={() => handleStepComplete('portfolio')}
            loading={false}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Complétez votre profil
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Quelques étapes pour présenter votre expertise aux clients
          </p>
        </div>

        {/* Barre de progression */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>{Math.round(progress)}% complété</span>
            <span>
              Étape {steps.findIndex(step => step.id === currentStep) + 1} sur {steps.length}
            </span>
          </div>
        </div>

        {/* Étapes */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id)
            const isCurrent = currentStep === step.id
            const StepIcon = step.icon

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : isCompleted
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isCurrent
                      ? 'bg-blue-500 text-white'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      isCurrent
                        ? 'text-blue-900 dark:text-blue-100'
                        : isCompleted
                        ? 'text-green-900 dark:text-green-100'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Contenu de l'étape */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const step = steps.find(s => s.id === currentStep)
                const Icon = step?.icon
                return (
                  <>
                    <Icon className="h-6 w-6 text-blue-500" />
                    {step?.title}
                  </>
                )
              })()}
            </CardTitle>
            <CardDescription>
              {steps.find(step => step.id === currentStep)?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 'avatar'}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Précédent
          </Button>

          <Button
            onClick={handleNext}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {currentStep === 'portfolio' ? (
              <>
                Terminer
                <CheckCircle className="h-4 w-4" />
              </>
            ) : (
              <>
                Suivant
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}