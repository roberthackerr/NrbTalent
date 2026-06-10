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
  ArrowRight, ArrowLeft, CheckCircle, Briefcase, Clock, Award,
  Sparkles, TrendingUp, Shield, Zap, Globe, Star
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
    { id: 'company', icon: Building, title: 'Company', color: 'from-blue-500 to-cyan-500', bgColor: 'from-blue-500/10 to-cyan-500/10', borderColor: 'border-blue-200 dark:border-blue-800' },
    { id: 'project', icon: Target, title: 'Project', color: 'from-purple-500 to-pink-500', bgColor: 'from-purple-500/10 to-pink-500/10', borderColor: 'border-purple-200 dark:border-purple-800' },
    { id: 'budget', icon: DollarSign, title: 'Budget', color: 'from-green-500 to-emerald-500', bgColor: 'from-green-500/10 to-emerald-500/10', borderColor: 'border-green-200 dark:border-green-800' },
    { id: 'timeline', icon: Calendar, title: 'Timeline', color: 'from-orange-500 to-red-500', bgColor: 'from-orange-500/10 to-red-500/10', borderColor: 'border-orange-200 dark:border-orange-800' }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-20 animate-pulse" />
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin relative" />
        </div>
      </div>
    )
  }

  const currentStepConfig = steps.find(s => s.id === currentStep)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 dark:bg-pink-900/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container max-w-4xl mx-auto px-4">
        
        {/* Welcome Step */}
        {currentStep === 'welcome' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            {/* Animated icon */}
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse" />
              <div className="absolute inset-2 bg-gradient-to-br from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 rounded-full flex items-center justify-center shadow-2xl">
                <Building className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-4">
              {dict.welcomeTitle || "Find the Perfect Freelancer"}
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {dict.welcomeDescription || "Tell us about your project and we'll match you with the best talent"}
            </p>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: <Users className="h-5 w-5" />, text: "Top 1% Talent", color: "from-blue-500 to-cyan-500", gradient: "from-blue-500/10 to-cyan-500/10" },
                { icon: <Clock className="h-5 w-5" />, text: "Fast Matching", color: "from-purple-500 to-pink-500", gradient: "from-purple-500/10 to-pink-500/10" },
                { icon: <Award className="h-5 w-5" />, text: "Quality Guaranteed", color: "from-green-500 to-emerald-500", gradient: "from-green-500/10 to-emerald-500/10" }
              ].map((item, i) => (
                <div
                  key={i}
                  className={`group p-4 rounded-xl bg-gradient-to-r ${item.gradient} backdrop-blur-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-lg`}
                >
                  <div className={`inline-flex p-2 rounded-lg bg-gradient-to-r ${item.color} text-white mb-2 group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.text}</p>
                </div>
              ))}
            </div>

            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8"
            >
              Get Started
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Progress Section */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                <span>Step {steps.findIndex(s => s.id === currentStep) + 1}/{steps.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2 bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Step Indicators - Desktop */}
            <div className="hidden md:flex gap-2 mb-6">
              {steps.map((step) => {
                const isCurrent = currentStep === step.id
                const isCompleted = steps.findIndex(s => s.id === currentStep) > steps.findIndex(s => s.id === step.id)
                const StepIcon = step.icon
                return (
                  <button
                    key={step.id}
                    onClick={() => !isCompleted && setCurrentStep(step.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isCurrent
                        ? `bg-gradient-to-r ${step.color} text-white shadow-md scale-[1.02]`
                        : isCompleted
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                    <span>{step.title}</span>
                  </button>
                )
              })}
            </div>

            {/* Mobile Step Indicator */}
            <div className="md:hidden flex items-center justify-between mb-6">
              <button
                onClick={handlePrevious}
                className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              <div className="flex gap-1">
                {steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`h-2 rounded-full transition-all ${
                      idx <= steps.findIndex(s => s.id === currentStep)
                        ? `w-6 bg-gradient-to-r ${step.color}`
                        : 'w-2 bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              
              <div className={`p-2 rounded-full bg-gradient-to-r ${currentStepConfig?.color} text-white shadow-sm`}>
                {currentStepConfig && <currentStepConfig.icon className="h-5 w-5" />}
              </div>
            </div>

            {/* Main Form Card */}
            <Card className="border-0 shadow-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm overflow-hidden">
              {/* Card header with gradient */}
              <div className={`h-1 bg-gradient-to-r ${currentStepConfig?.color}`} />
              
              <CardContent className="p-6 md:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    
                    {/* Company Info Step */}
                    {currentStep === 'company' && (
                      <div className="space-y-5">
                        <div className="text-center mb-2">
                          <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${currentStepConfig?.bgColor} border ${currentStepConfig?.borderColor} mb-3`}>
                            <Building className={`h-6 w-6 bg-gradient-to-r ${currentStepConfig?.color} bg-clip-text text-transparent`} />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tell us about your company</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This helps us understand your needs better</p>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company Name *</Label>
                          <Input
                            value={formData.companyName}
                            onChange={(e) => updateForm('companyName', e.target.value)}
                            placeholder="e.g., TechCorp Inc."
                            className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company Size *</Label>
                            <Select value={formData.companySize} onValueChange={(v) => updateForm('companySize', v)}>
                              <SelectTrigger className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
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
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Industry *</Label>
                            <Select value={formData.industry} onValueChange={(v) => updateForm('industry', v)}>
                              <SelectTrigger className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tech">Technology</SelectItem>
                                <SelectItem value="finance">Finance</SelectItem>
                                <SelectItem value="healthcare">Healthcare</SelectItem>
                                <SelectItem value="ecommerce">E-commerce</SelectItem>
                                <SelectItem value="education">Education</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Project Info Step */}
                    {currentStep === 'project' && (
                      <div className="space-y-5">
                        <div className="text-center mb-2">
                          <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${currentStepConfig?.bgColor} border ${currentStepConfig?.borderColor} mb-3`}>
                            <Target className={`h-6 w-6 bg-gradient-to-r ${currentStepConfig?.color} bg-clip-text text-transparent`} />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Describe your project</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">The more details, the better matches we'll find</p>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Title *</Label>
                          <Input
                            value={formData.projectTitle}
                            onChange={(e) => updateForm('projectTitle', e.target.value)}
                            placeholder="e.g., E-commerce Website Development"
                            className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Type *</Label>
                          <Select value={formData.projectType} onValueChange={(v) => updateForm('projectType', v)}>
                            <SelectTrigger className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="web">Web Development</SelectItem>
                              <SelectItem value="mobile">Mobile App</SelectItem>
                              <SelectItem value="design">UI/UX Design</SelectItem>
                              <SelectItem value="marketing">Digital Marketing</SelectItem>
                              <SelectItem value="content">Content Writing</SelectItem>
                              <SelectItem value="consulting">Business Consulting</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Description *</Label>
                          <Textarea
                            value={formData.projectDescription}
                            onChange={(e) => updateForm('projectDescription', e.target.value)}
                            placeholder="Describe your project requirements, goals, and expectations..."
                            rows={4}
                            className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 resize-none"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formData.projectDescription.length}/500 characters
                          </p>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Team Size</Label>
                          <Select value={formData.teamSize} onValueChange={(v) => updateForm('teamSize', v)}>
                            <SelectTrigger className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Just me (Solo)</SelectItem>
                              <SelectItem value="2-5">2-5 people (Small team)</SelectItem>
                              <SelectItem value="6-10">6-10 people (Medium team)</SelectItem>
                              <SelectItem value="10+">10+ people (Large team)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Budget Step */}
                    {currentStep === 'budget' && (
                      <div className="space-y-5">
                        <div className="text-center mb-2">
                          <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${currentStepConfig?.bgColor} border ${currentStepConfig?.borderColor} mb-3`}>
                            <DollarSign className={`h-6 w-6 bg-gradient-to-r ${currentStepConfig?.color} bg-clip-text text-transparent`} />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Set your budget</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Be transparent to attract the right freelancers</p>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Budget Range *</Label>
                          <Select value={formData.budget} onValueChange={(v) => updateForm('budget', v)}>
                            <SelectTrigger className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                              <SelectValue placeholder="Select budget range" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="under-1k">Under $1,000</SelectItem>
                              <SelectItem value="1k-5k">$1,000 - $5,000</SelectItem>
                              <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                              <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                              <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                              <SelectItem value="50k+">$50,000+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
                          <div className="flex items-start gap-3">
                            <Sparkles className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Pro Tip</p>
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                A clear budget range helps attract the most qualified freelancers for your project scope
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timeline Step */}
                    {currentStep === 'timeline' && (
                      <div className="space-y-5">
                        <div className="text-center mb-2">
                          <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${currentStepConfig?.bgColor} border ${currentStepConfig?.borderColor} mb-3`}>
                            <Calendar className={`h-6 w-6 bg-gradient-to-r ${currentStepConfig?.color} bg-clip-text text-transparent`} />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Set your timeline</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Help freelancers understand your schedule</p>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Timeline *</Label>
                          <Select value={formData.timeline} onValueChange={(v) => updateForm('timeline', v)}>
                            <SelectTrigger className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                              <SelectValue placeholder="Select timeline" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="urgent">ASAP (Less than 1 week)</SelectItem>
                              <SelectItem value="2-weeks">1-2 weeks</SelectItem>
                              <SelectItem value="month">1 month</SelectItem>
                              <SelectItem value="1-3months">1-3 months</SelectItem>
                              <SelectItem value="3-6months">3-6 months</SelectItem>
                              <SelectItem value="6+months">6+ months</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Urgency Level</Label>
                          <Select value={formData.urgency} onValueChange={(v) => updateForm('urgency', v)}>
                            <SelectTrigger className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low - Planning / Research phase</SelectItem>
                              <SelectItem value="normal">Normal - Ready to start within a month</SelectItem>
                              <SelectItem value="high">High - Need to start immediately</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-lg p-4 border border-orange-100 dark:border-orange-900">
                          <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-orange-500 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-1">Timeline Note</p>
                              <p className="text-sm text-orange-700 dark:text-orange-300">
                                Being realistic about your timeline helps ensure quality delivery and reduces stress
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex gap-3 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    className="flex-1 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={loading || !isStepValid()}
                    className={`flex-1 transition-all duration-300 ${
                      currentStep === 'timeline'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                        : `bg-gradient-to-r ${currentStepConfig?.color} hover:opacity-90`
                    } text-white shadow-lg hover:shadow-xl`}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : currentStep === 'timeline' ? (
                      <>
                        Complete Setup
                        <CheckCircle className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Progress summary */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {Math.round(progress)}% complete • {steps.findIndex(s => s.id === currentStep) + 1} of {steps.length} steps
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}