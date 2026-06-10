// app/[lang]/onboarding/client/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building, DollarSign, Calendar, Target, Users, FileText,
  ArrowRight, ArrowLeft, CheckCircle, Briefcase, Clock, Award
} from 'lucide-react'
import { toast } from 'sonner'
import type { Locale } from '@/lib/i18n/config'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'

type OnboardingStep = 'welcome' | 'company' | 'project' | 'budget' | 'timeline'

export default function ClientOnboardingPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const params = useParams()
  const lang = params.lang as Locale

  const [dict, setDict] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [loading, setLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    companySize: '',
    industry: '',
    projectTitle: '',
    projectDescription: '',
    projectType: '',
    budget: '',
    timeline: '',
    teamSize: '1',
    urgency: 'normal'
  })

  useEffect(() => {
    setIsMounted(true)
    getDictionarySafe(lang).then(setDict)
    
    if (session?.user?.onboardingCompleted) {
      router.push(`/${lang}/dashboard`)
    }
  }, [session, router, lang])

  const steps = [
    { id: 'company', icon: Building, title: 'Company', color: 'from-blue-500 to-cyan-500' },
    { id: 'project', icon: Target, title: 'Project', color: 'from-purple-500 to-pink-500' },
    { id: 'budget', icon: DollarSign, title: 'Budget', color: 'from-green-500 to-emerald-500' },
    { id: 'timeline', icon: Calendar, title: 'Timeline', color: 'from-orange-500 to-red-500' }
  ]

  const progress = currentStep === 'welcome' 
    ? 0 
    : ((steps.findIndex(s => s.id === currentStep) + 1) / steps.length) * 100

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep === 'welcome') {
      setCurrentStep('company')
    } else {
      const currentIndex = steps.findIndex(s => s.id === currentStep)
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1].id)
      } else {
        handleComplete()
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrevious = () => {
    if (currentStep === 'company') {
      setCurrentStep('welcome')
    } else {
      const currentIndex = steps.findIndex(s => s.id === currentStep)
      if (currentIndex > 0) {
        setCurrentStep(steps[currentIndex - 1].id)
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'clientOnboarding',
          data: {
            onboardingCompleted: true,
            clientProfile: formData
          }
        })
      })

      if (response.ok) {
        await update()
        toast.success(dict?.success || "Profile setup complete!")
        setTimeout(() => router.push(`/${lang}/dashboard`), 1500)
      }
    } catch (error) {
      toast.error(dict?.error || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 'company':
        return formData.companyName && formData.companySize && formData.industry
      case 'project':
        return formData.projectTitle && formData.projectDescription && formData.projectType
      case 'budget':
        return formData.budget
      case 'timeline':
        return formData.timeline
      default:
        return true
    }
  }

  if (!isMounted || !dict) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-6">
      <div className="container max-w-4xl mx-auto px-4">
        
        {/* Welcome Step */}
        {currentStep === 'welcome' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 animate-pulse" />
              <div className="absolute inset-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Building className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              {dict.welcomeTitle || "Find the Perfect Freelancer"}
            </h1>
            
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {dict.welcomeDescription || "Tell us about your project and we'll match you with the best talent"}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: <Users className="h-5 w-5 text-blue-500" />, text: "Top 1% Talent" },
                { icon: <Clock className="h-5 w-5 text-purple-500" />, text: "Fast Matching" },
                { icon: <Award className="h-5 w-5 text-green-500" />, text: "Quality Guaranteed" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-center gap-2 text-sm">
                  {item.icon}
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-600 to-purple-600 px-8"
            >
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Progress */}
            <div className="mb-6">
              <Progress value={progress} className="h-1.5" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Step {steps.findIndex(s => s.id === currentStep) + 1}/{steps.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex gap-2 mb-6">
              {steps.map((step) => {
                const isCurrent = currentStep === step.id
                const StepIcon = step.icon
                return (
                  <div
                    key={step.id}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                      isCurrent
                        ? `bg-gradient-to-r ${step.color} text-white shadow-md`
                        : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    <StepIcon className="h-3 w-3" />
                    <span className="hidden sm:inline">{step.title}</span>
                  </div>
                )
              })}
            </div>

            {/* Form Card */}
            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    
                    {/* Company Info */}
                    {currentStep === 'company' && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Company Name *</Label>
                          <Input
                            value={formData.companyName}
                            onChange={(e) => updateForm('companyName', e.target.value)}
                            placeholder="e.g., TechCorp Inc."
                            className="mt-1.5"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm font-medium">Company Size *</Label>
                            <Select value={formData.companySize} onValueChange={(v) => updateForm('companySize', v)}>
                              <SelectTrigger className="mt-1.5">
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1-10">1-10 employees</SelectItem>
                                <SelectItem value="11-50">11-50 employees</SelectItem>
                                <SelectItem value="51-200">51-200 employees</SelectItem>
                                <SelectItem value="201+">201+ employees</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Industry *</Label>
                            <Select value={formData.industry} onValueChange={(v) => updateForm('industry', v)}>
                              <SelectTrigger className="mt-1.5">
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tech">Technology</SelectItem>
                                <SelectItem value="finance">Finance</SelectItem>
                                <SelectItem value="healthcare">Healthcare</SelectItem>
                                <SelectItem value="ecommerce">E-commerce</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Project Info */}
                    {currentStep === 'project' && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Project Title *</Label>
                          <Input
                            value={formData.projectTitle}
                            onChange={(e) => updateForm('projectTitle', e.target.value)}
                            placeholder="e.g., E-commerce Website Development"
                            className="mt-1.5"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Project Type *</Label>
                          <Select value={formData.projectType} onValueChange={(v) => updateForm('projectType', v)}>
                            <SelectTrigger className="mt-1.5">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="web">Web Development</SelectItem>
                              <SelectItem value="mobile">Mobile App</SelectItem>
                              <SelectItem value="design">UI/UX Design</SelectItem>
                              <SelectItem value="marketing">Digital Marketing</SelectItem>
                              <SelectItem value="content">Content Writing</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Project Description *</Label>
                          <Textarea
                            value={formData.projectDescription}
                            onChange={(e) => updateForm('projectDescription', e.target.value)}
                            placeholder="Describe your project requirements, goals, and expectations..."
                            rows={4}
                            className="mt-1.5"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Team Size</Label>
                          <Select value={formData.teamSize} onValueChange={(v) => updateForm('teamSize', v)}>
                            <SelectTrigger className="mt-1.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Just me</SelectItem>
                              <SelectItem value="2-5">2-5 people</SelectItem>
                              <SelectItem value="6-10">6-10 people</SelectItem>
                              <SelectItem value="10+">10+ people</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Budget */}
                    {currentStep === 'budget' && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Budget Range *</Label>
                          <Select value={formData.budget} onValueChange={(v) => updateForm('budget', v)}>
                            <SelectTrigger className="mt-1.5">
                              <SelectValue placeholder="Select budget range" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="under-1k">Under $1,000</SelectItem>
                              <SelectItem value="1k-5k">$1,000 - $5,000</SelectItem>
                              <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                              <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                              <SelectItem value="25k+">$25,000+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            💡 Tip: A clear budget helps attract the right freelancers for your project
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Timeline */}
                    {currentStep === 'timeline' && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Project Timeline *</Label>
                          <Select value={formData.timeline} onValueChange={(v) => updateForm('timeline', v)}>
                            <SelectTrigger className="mt-1.5">
                              <SelectValue placeholder="Select timeline" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="urgent">ASAP (Less than 1 week)</SelectItem>
                              <SelectItem value="2-weeks">1-2 weeks</SelectItem>
                              <SelectItem value="month">1 month</SelectItem>
                              <SelectItem value="1-3months">1-3 months</SelectItem>
                              <SelectItem value="3+months">3+ months</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Urgency Level</Label>
                          <Select value={formData.urgency} onValueChange={(v) => updateForm('urgency', v)}>
                            <SelectTrigger className="mt-1.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low - Planning phase</SelectItem>
                              <SelectItem value="normal">Normal - Ready to start</SelectItem>
                              <SelectItem value="high">High - Need it quickly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex gap-3 mt-8">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={loading || !isStepValid()}
                    className={`flex-1 ${
                      currentStep === 'timeline'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : currentStep === 'timeline' ? (
                      <>
                        Complete
                        <CheckCircle className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}