// app/[lang]/onboarding/client/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building, User, MapPin, ArrowRight, ArrowLeft, CheckCircle,
  Sparkles, Shield, TrendingUp, Clock, Camera
} from 'lucide-react'
import { toast } from 'sonner'
import type { Locale } from '@/lib/i18n/config'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import Image from 'next/image'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'

type OnboardingStep = 'welcome' | 'company' | 'contact' | 'verify'

// Mobile Step Indicator
interface MobileStepIndicatorProps {
  steps: StepConfig[]
  currentStep: OnboardingStep
  onPrevious: () => void
  onNext: () => void
}

interface StepConfig {
  id: OnboardingStep
  icon: any
  title: string
  color: string
}

function MobileStepIndicator({ steps, currentStep, onPrevious, onNext }: MobileStepIndicatorProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep)
  const isFirst = currentIndex === 0
  const currentStepConfig = steps.find(s => s.id === currentStep)

  return (
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={onPrevious}
        disabled={isFirst}
        className={`p-2 rounded-full transition-colors ${
          isFirst
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Step {currentIndex + 1}/{steps.length}
        </p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {currentStepConfig?.title}
        </p>
      </div>
      
      <button
        onClick={onNext}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  )
}

// Animated Step Wrapper
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

export default function ClientOnboardingPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const params = useParams()
  const lang = params.lang as Locale

  const [dict, setDict] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [loading, setLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  
  const [formData, setFormData] = useState({
    companyName: '',
    companyWebsite: '',
    companySize: '',
    industry: '',
    companyDescription: '',
    yearFounded: '',
    country: '',
    city: '',
    address: '',
    contactName: '',
    contactPosition: '',
    contactPhone: '',
    contactEmail: '',
    preferredLanguage: lang,
    newsletterOptIn: false,
    termsAccepted: false
  })

  // Check mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load dictionary and check existing profile
  useEffect(() => {
    setIsMounted(true)
    
    const loadData = async () => {
      const dictionary = await getDictionarySafe(lang)
      setDict(dictionary)
      
      if (session?.user) {
        await loadClientProfile()
      } else {
        setIsLoadingProfile(false)
      }
    }
    
    loadData()
  }, [lang, session])

  // Redirect if already onboarded
  useEffect(() => {
    if (!isLoadingProfile && session?.user?.onboardingCompleted) {
      router.push(`/${lang}/dashboard`)
    }
  }, [session, isLoadingProfile, router, lang])

  const loadClientProfile = async () => {
    try {
      const response = await fetch('/api/users/client-profile')
      const data = await response.json()

      if (response.ok) {
        if (data.onboardingCompleted === true) {
          toast.info(dict?.clientOnboarding?.alreadyCompleted || "Your profile is already set up!")
          setTimeout(() => router.push(`/${lang}/dashboard`), 1500)
          return
        }

        if (data.clientProfile) {
          const profile = data.clientProfile
          setFormData(prev => ({
            ...prev,
            companyName: profile.company?.name || '',
            companyWebsite: profile.company?.website || '',
            companySize: profile.company?.size || '',
            industry: profile.company?.industry || '',
            companyDescription: profile.company?.description || '',
            yearFounded: profile.company?.yearFounded || '',
            country: profile.location?.country || '',
            city: profile.location?.city || '',
            address: profile.location?.address || '',
            contactName: profile.contact?.name || session?.user?.name || '',
            contactPosition: profile.contact?.position || '',
            contactPhone: profile.contact?.phone || '',
            contactEmail: profile.contact?.email || session?.user?.email || '',
            newsletterOptIn: profile.preferences?.newsletter || false
          }))

          if (profile.company?.logo) {
            setAvatarPreview(profile.company.logo)
          }
        }
      }
    } catch (error) {
      console.error('Error loading client profile:', error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const steps: StepConfig[] = dict ? [
    { 
      id: 'company', 
      icon: Building, 
      title: dict.clientOnboarding?.steps?.company || 'Company',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      id: 'contact', 
      icon: User, 
      title: dict.clientOnboarding?.steps?.contact || 'Contact',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      id: 'verify', 
      icon: Shield, 
      title: dict.clientOnboarding?.steps?.verify || 'Verify',
      color: 'from-green-500 to-emerald-500'
    }
  ] : []

  const progress = currentStep === 'welcome' 
    ? 0 
    : ((steps.findIndex(s => s.id === currentStep) + 1) / steps.length) * 100

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCompanyLogoUpload = async (file: File) => {
    if (!file) return
    
    setUploadingAvatar(true)
    const formDataLogo = new FormData()
    formDataLogo.append('logo', file)
    
    try {
      const response = await fetch('/api/users/company-logo', {
        method: 'POST',
        body: formDataLogo,
      })
      
      if (response.ok) {
        const data = await response.json()
        setAvatarPreview(data.logoUrl)
        toast.success(dict?.clientOnboarding?.logoSuccess || 'Company logo uploaded successfully!')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload logo')
      }
    } catch (error) {
      console.error('Error uploading company logo:', error)
      toast.error(error instanceof Error ? error.message : dict?.clientOnboarding?.logoError || 'Failed to upload logo')
    } finally {
      setUploadingAvatar(false)
    }
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
      const response = await fetch('/api/users/client-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientProfile: {
            company: {
              name: formData.companyName,
              website: formData.companyWebsite,
              size: formData.companySize,
              industry: formData.industry,
              description: formData.companyDescription,
              yearFounded: formData.yearFounded,
              logo: avatarPreview || null
            },
            location: {
              country: formData.country,
              city: formData.city,
              address: formData.address
            },
            contact: {
              name: formData.contactName,
              position: formData.contactPosition,
              phone: formData.contactPhone,
              email: formData.contactEmail
            },
            preferences: {
              language: formData.preferredLanguage,
              newsletter: formData.newsletterOptIn
            }
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        await update()
        toast.success(data.message || dict?.clientOnboarding?.success || "Company profile setup complete!")
        setTimeout(() => router.push(`/${lang}/dashboard`), 1500)
      } else {
        throw new Error(data.error || dict?.clientOnboarding?.error || "Something went wrong")
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast.error(error instanceof Error ? error.message : dict?.clientOnboarding?.error || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 'company':
        return formData.companyName && formData.companySize && 
               formData.industry && formData.country && formData.city
      case 'contact':
        return formData.contactName && formData.contactPhone && formData.contactEmail
      case 'verify':
        return formData.termsAccepted
      default:
        return true
    }
  }

  // Loading state
  if (!isMounted || !dict || isLoadingProfile) {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative container max-w-4xl mx-auto px-4">
        
        {/* Header with Language Switcher */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher lang={lang} />
        </div>
        
        {/* Welcome Step */}
        {currentStep === 'welcome' ? (
          <AnimatedStep isVisible={currentStep === 'welcome'}>
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 animate-pulse" />
                <div className="absolute inset-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <Building className="w-10 h-10 text-white" />
                </div>
              </div>

              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                {dict.clientOnboarding?.welcomeTitle || "Set up your company profile"}
              </h1>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {dict.clientOnboarding?.welcomeDescription || "Complete your business profile to start hiring top talent."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                {[
                  { icon: <Shield className="w-5 h-5" />, text: dict.clientOnboarding?.benefits?.verified || "Verified Companies", color: "from-blue-500 to-cyan-500" },
                  { icon: <TrendingUp className="w-5 h-5" />, text: dict.clientOnboarding?.benefits?.matches || "Better Matches", color: "from-purple-500 to-pink-500" },
                  { icon: <Clock className="w-5 h-5" />, text: dict.clientOnboarding?.benefits?.hiring || "Faster Hiring", color: "from-green-500 to-emerald-500" }
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className={`inline-flex p-1.5 rounded-lg bg-gradient-to-r ${item.color} text-white mb-2`}>
                      {item.icon}
                    </div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.text}</p>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 rounded-lg shadow-lg"
              >
                {dict.clientOnboarding?.startSetup || "Start Setup"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </AnimatedStep>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="mb-6">
              <Progress value={progress} className="h-1.5" />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>{dict.clientOnboarding?.step || "Step"} {steps.findIndex(s => s.id === currentStep) + 1}/{steps.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Mobile Step Indicator */}
            {isMobile && (
              <MobileStepIndicator
                steps={steps}
                currentStep={currentStep}
                onPrevious={handlePrevious}
                onNext={handleNext}
              />
            )}

            {/* Desktop Step Indicators */}
            {!isMobile && (
              <div className="flex gap-2 mb-6">
                {steps.map((step, idx) => {
                  const isCurrent = currentStep === step.id
                  const isCompleted = steps.findIndex(s => s.id === currentStep) > idx
                  const StepIcon = step.icon
                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(step.id)}
                      className={`flex-1 p-2 rounded-lg transition-all ${
                        isCurrent
                          ? `bg-gradient-to-r ${step.color} shadow-md text-white`
                          : isCompleted
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <StepIcon className="h-4 w-4" />
                        )}
                        <span className="text-xs font-medium hidden sm:inline">
                          {step.title}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Form Card */}
            <Card className="border-0 shadow-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6">
                
                {/* Company Information Step */}
                {currentStep === 'company' && (
                  <AnimatedStep isVisible={currentStep === 'company'}>
                    <div className="space-y-6">
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {dict.clientOnboarding?.company?.title || "Company Information"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {dict.clientOnboarding?.company?.description || "Tell us about your business"}
                        </p>
                      </div>

                      {/* Company Logo Upload */}
                      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
                            {avatarPreview ? (
                              <Image
                                src={avatarPreview}
                                alt="Company logo"
                                width={64}
                                height={64}
                                className="object-cover"
                              />
                            ) : (
                              <Building className="h-8 w-8 text-white" />
                            )}
                          </div>
                          <label className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-gray-700 rounded-full cursor-pointer shadow-md">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  setAvatarPreview(URL.createObjectURL(file))
                                  handleCompanyLogoUpload(file)
                                }
                              }}
                            />
                            <Camera className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                          </label>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {dict.clientOnboarding?.company?.logo || "Company Logo"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {dict.clientOnboarding?.company?.logoHint || "Upload your logo (optional)"}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {dict.clientOnboarding?.company?.name || "Company Name"} *
                          </Label>
                          <Input
                            value={formData.companyName}
                            onChange={(e) => updateForm('companyName', e.target.value)}
                            placeholder={dict.clientOnboarding?.company?.namePlaceholder || "e.g., TechCorp Solutions"}
                            className="mt-1.5"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {dict.clientOnboarding?.company?.size || "Company Size"} *
                            </Label>
                            <Select value={formData.companySize} onValueChange={(v) => updateForm('companySize', v)}>
                              <SelectTrigger className="mt-1.5">
                                <SelectValue placeholder={dict.clientOnboarding?.company?.sizePlaceholder || "Select size"} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1-10">1-10 employees</SelectItem>
                                <SelectItem value="11-50">11-50 employees</SelectItem>
                                <SelectItem value="51-200">51-200 employees</SelectItem>
                                <SelectItem value="201-500">201-500 employees</SelectItem>
                                <SelectItem value="501+">501+ employees</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {dict.clientOnboarding?.company?.industry || "Industry"} *
                            </Label>
                            <Select value={formData.industry} onValueChange={(v) => updateForm('industry', v)}>
                              <SelectTrigger className="mt-1.5">
                                <SelectValue placeholder={dict.clientOnboarding?.company?.industryPlaceholder || "Select industry"} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tech">Technology / Software</SelectItem>
                                <SelectItem value="finance">Finance / Banking</SelectItem>
                                <SelectItem value="healthcare">Healthcare / Medical</SelectItem>
                                <SelectItem value="ecommerce">E-commerce / Retail</SelectItem>
                                <SelectItem value="education">Education / Training</SelectItem>
                                <SelectItem value="marketing">Marketing / Advertising</SelectItem>
                                <SelectItem value="consulting">Consulting</SelectItem>
                                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {dict.clientOnboarding?.company?.website || "Company Website"}
                          </Label>
                          <Input
                            value={formData.companyWebsite}
                            onChange={(e) => updateForm('companyWebsite', e.target.value)}
                            placeholder="https://yourcompany.com"
                            className="mt-1.5"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {dict.clientOnboarding?.company?.description || "Company Description"}
                          </Label>
                          <textarea
                            value={formData.companyDescription}
                            onChange={(e) => updateForm('companyDescription', e.target.value)}
                            placeholder={dict.clientOnboarding?.company?.descriptionPlaceholder || "Tell us about your company..."}
                            rows={3}
                            className="mt-1.5 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {dict.clientOnboarding?.company?.founded || "Year Founded"}
                            </Label>
                            <Input
                              value={formData.yearFounded}
                              onChange={(e) => updateForm('yearFounded', e.target.value)}
                              placeholder="e.g., 2020"
                              className="mt-1.5"
                            />
                          </div>
                        </div>

                        {/* Location Section */}
                        <div className="pt-2">
                          <div className="flex items-center gap-2 mb-4">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                              {dict.clientOnboarding?.company?.location || "Location"} *
                            </Label>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {dict.clientOnboarding?.company?.country || "Country"} *
                              </Label>
                              <Select value={formData.country} onValueChange={(v) => updateForm('country', v)}>
                                <SelectTrigger className="mt-1.5">
                                  <SelectValue placeholder={dict.clientOnboarding?.company?.countryPlaceholder || "Select country"} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="us">United States</SelectItem>
                                  <SelectItem value="uk">United Kingdom</SelectItem>
                                  <SelectItem value="ca">Canada</SelectItem>
                                  <SelectItem value="fr">France</SelectItem>
                                  <SelectItem value="de">Germany</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {dict.clientOnboarding?.company?.city || "City"} *
                              </Label>
                              <Input
                                value={formData.city}
                                onChange={(e) => updateForm('city', e.target.value)}
                                placeholder="e.g., San Francisco"
                                className="mt-1.5"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {dict.clientOnboarding?.company?.address || "Address"}
                              </Label>
                              <Input
                                value={formData.address}
                                onChange={(e) => updateForm('address', e.target.value)}
                                placeholder={dict.clientOnboarding?.company?.addressPlaceholder || "Street address (optional)"}
                                className="mt-1.5"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AnimatedStep>
                )}

                {/* Contact Information Step */}
                {currentStep === 'contact' && (
                  <AnimatedStep isVisible={currentStep === 'contact'}>
                    <div className="space-y-6">
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {dict.clientOnboarding?.contact?.title || "Contact Information"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {dict.clientOnboarding?.contact?.description || "How should freelancers reach you?"}
                        </p>
                      </div>

                      <div className="grid gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {dict.clientOnboarding?.contact?.fullName || "Full Name"} *
                            </Label>
                            <Input
                              value={formData.contactName}
                              onChange={(e) => updateForm('contactName', e.target.value)}
                              placeholder={dict.clientOnboarding?.contact?.namePlaceholder || "Your full name"}
                              className="mt-1.5"
                            />
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {dict.clientOnboarding?.contact?.position || "Position / Title"}
                            </Label>
                            <Input
                              value={formData.contactPosition}
                              onChange={(e) => updateForm('contactPosition', e.target.value)}
                              placeholder={dict.clientOnboarding?.contact?.positionPlaceholder || "e.g., CEO, Hiring Manager"}
                              className="mt-1.5"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {dict.clientOnboarding?.contact?.email || "Email Address"} *
                            </Label>
                            <Input
                              type="email"
                              value={formData.contactEmail}
                              onChange={(e) => updateForm('contactEmail', e.target.value)}
                              placeholder="contact@company.com"
                              className="mt-1.5"
                            />
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {dict.clientOnboarding?.contact?.phone || "Phone Number"} *
                            </Label>
                            <Input
                              value={formData.contactPhone}
                              onChange={(e) => updateForm('contactPhone', e.target.value)}
                              placeholder="+1 (555) 000-0000"
                              className="mt-1.5"
                            />
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                                {dict.clientOnboarding?.contact?.privacyTitle || "Privacy Protected"}
                              </p>
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                {dict.clientOnboarding?.contact?.privacyText || "Your contact information is only shared with freelancers you hire"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AnimatedStep>
                )}

                {/* Verify Step */}
                {currentStep === 'verify' && (
                  <AnimatedStep isVisible={currentStep === 'verify'}>
                    <div className="space-y-6">
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {dict.clientOnboarding?.verify?.title || "Verify Your Information"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {dict.clientOnboarding?.verify?.description || "Please review your details"}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                          <div className="flex items-center gap-2 mb-3">
                            <Building className="h-4 w-4 text-blue-500" />
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {dict.clientOnboarding?.verify?.companySection || "Company Information"}
                            </h4>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-gray-500">{dict.clientOnboarding?.company?.name || "Name"}:</span> {formData.companyName || 'Not provided'}</p>
                            <p><span className="text-gray-500">{dict.clientOnboarding?.company?.industry || "Industry"}:</span> {formData.industry || 'Not provided'}</p>
                            <p><span className="text-gray-500">{dict.clientOnboarding?.company?.size || "Size"}:</span> {formData.companySize || 'Not provided'}</p>
                            <p><span className="text-gray-500">{dict.clientOnboarding?.company?.location || "Location"}:</span> {formData.city}, {formData.country}</p>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                          <div className="flex items-center gap-2 mb-3">
                            <User className="h-4 w-4 text-purple-500" />
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {dict.clientOnboarding?.verify?.contactSection || "Contact Person"}
                            </h4>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-gray-500">{dict.clientOnboarding?.contact?.fullName || "Name"}:</span> {formData.contactName}</p>
                            <p><span className="text-gray-500">{dict.clientOnboarding?.contact?.email || "Email"}:</span> {formData.contactEmail}</p>
                            <p><span className="text-gray-500">{dict.clientOnboarding?.contact?.phone || "Phone"}:</span> {formData.contactPhone}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.termsAccepted}
                            onChange={(e) => updateForm('termsAccepted', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {dict.clientOnboarding?.verify?.terms || "I confirm that the information provided is accurate and I agree to the"} 
                            <a href="#" className="text-blue-600 hover:underline mx-1">Terms of Service</a>
                            {dict.clientOnboarding?.verify?.and || "and"}
                            <a href="#" className="text-blue-600 hover:underline mx-1">Privacy Policy</a>
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.newsletterOptIn}
                            onChange={(e) => updateForm('newsletterOptIn', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {dict.clientOnboarding?.verify?.newsletter || "Subscribe to our newsletter for tips and updates (optional)"}
                          </span>
                        </label>
                      </div>
                    </div>
                  </AnimatedStep>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-3 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {dict.clientOnboarding?.back || "Back"}
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={loading || !isStepValid()}
                    className={`flex-1 ${
                      currentStep === 'verify'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {dict.clientOnboarding?.saving || "Saving..."}
                      </>
                    ) : currentStep === 'verify' ? (
                      <>
                        {dict.clientOnboarding?.complete || "Complete Setup"}
                        <CheckCircle className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        {dict.clientOnboarding?.continue || "Continue"}
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
      `}</style>
    </div>
  )
}