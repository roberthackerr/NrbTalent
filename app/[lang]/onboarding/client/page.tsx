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
  Building, User, MapPin, Globe, Phone, Mail, Briefcase,
  ArrowRight, ArrowLeft, CheckCircle, Users, Calendar,
  Sparkles, Shield, TrendingUp, Award, Clock, Star
} from 'lucide-react'
import { toast } from 'sonner'
import type { Locale } from '@/lib/i18n/config'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import Image from 'next/image'

type OnboardingStep = 'welcome' | 'company' | 'contact' | 'verify'

export default function ClientOnboardingPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const params = useParams()
  const lang = params.lang as Locale

  const [dict, setDict] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [loading, setLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  
  const [formData, setFormData] = useState({
    // Company Information
    companyName: '',
    companyWebsite: '',
    companySize: '',
    industry: '',
    companyDescription: '',
    yearFounded: '',
    
    // Location
    country: '',
    city: '',
    address: '',
    
    // Contact Person
    contactName: '',
    contactPosition: '',
    contactPhone: '',
    contactEmail: '',
    
    // Preferences
    preferredLanguage: 'en',
    newsletterOptIn: false,
    termsAccepted: false
  })

  useEffect(() => {
    setIsMounted(true)
    getDictionarySafe(lang).then(setDict)
    
    // Pre-fill with session data
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        contactName: session.user.name || '',
        contactEmail: session.user.email || '',
      }))
    }
    
    if (session?.user?.onboardingCompleted) {
      router.push(`/${lang}/dashboard`)
    }
  }, [session, router, lang])

  const steps = [
    { 
      id: 'company', 
      icon: Building, 
      title: 'Company', 
      description: 'Tell us about your business',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/10 to-cyan-500/10'
    },
    { 
      id: 'contact', 
      icon: User, 
      title: 'Contact', 
      description: 'How to reach you',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/10 to-pink-500/10'
    },
    { 
      id: 'verify', 
      icon: Shield, 
      title: 'Verify', 
      description: 'Confirm your details',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-500/10 to-emerald-500/10'
    }
  ]

  const progress = currentStep === 'welcome' 
    ? 0 
    : ((steps.findIndex(s => s.id === currentStep) + 1) / steps.length) * 100

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

 const handleCompanyLogoUpload = async (file: File) => {
  if (!file) return
  
  setUploadingAvatar(true)
  const formData = new FormData()
  formData.append('logo', file) // Note: 'logo' instead of 'avatar'
  
  try {
    const response = await fetch('/api/users/company-logo', {
      method: 'POST',
      body: formData,
    })
    
    if (response.ok) {
      const data = await response.json()
      setAvatarPreview(data.logoUrl)
      
      // Update session with new logo
      await update({
        ...session,
        user: {
          ...session?.user,
          clientProfile: {
            ...(session?.user as any)?.clientProfile,
            company: {
              ...(session?.user as any)?.clientProfile?.company,
              logo: data.logoUrl
            }
          }
        }
      })
      
      toast.success('Company logo uploaded successfully!')
    } else {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload logo')
    }
  } catch (error) {
    console.error('Error uploading company logo:', error)
    toast.error(error instanceof Error ? error.message : 'Failed to upload logo')
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
            logo: session?.user?.image || null
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
      toast.success(data.message || "Company profile setup complete!")
      setTimeout(() => router.push(`/${lang}/dashboard`), 1500)
    } else {
      throw new Error(data.error || "Something went wrong")
    }
  } catch (error) {
    console.error('Error completing onboarding:', error)
    toast.error(error instanceof Error ? error.message : "Something went wrong")
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
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse" />
              <div className="absolute inset-2 bg-gradient-to-br from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 rounded-full flex items-center justify-center shadow-2xl">
                <Building className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-4">
              Set up your company profile
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Complete your business profile to start hiring top talent. This information will help us match you with the best freelancers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: <Shield className="h-5 w-5" />, text: "Verified Companies", color: "from-blue-500 to-cyan-500" },
                { icon: <TrendingUp className="h-5 w-5" />, text: "Better Matches", color: "from-purple-500 to-pink-500" },
                { icon: <Clock className="h-5 w-5" />, text: "Faster Hiring", color: "from-green-500 to-emerald-500" }
              ].map((item, i) => (
                <div
                  key={i}
                  className="group p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-lg"
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
              Start Setup
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                <span>Step {steps.findIndex(s => s.id === currentStep) + 1}/{steps.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2 bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Step Indicators */}
            <div className="hidden md:flex gap-3 mb-8">
              {steps.map((step, idx) => {
                const isCurrent = currentStep === step.id
                const isCompleted = steps.findIndex(s => s.id === currentStep) > idx
                const StepIcon = step.icon
                return (
                  <div
                    key={step.id}
                    className={`flex-1 flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                      isCurrent
                        ? `bg-gradient-to-r ${step.color} text-white shadow-lg`
                        : isCompleted
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isCurrent
                        ? 'bg-white/20'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <StepIcon className={`h-4 w-4 ${isCurrent ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${isCurrent ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                        Step {idx + 1}
                      </p>
                      <p className={`text-sm font-semibold ${isCurrent ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
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
              
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Step {steps.findIndex(s => s.id === currentStep) + 1}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{currentStepConfig?.title}</p>
              </div>
              
              <div className={`p-2 rounded-full bg-gradient-to-r ${currentStepConfig?.color} text-white shadow-sm`}>
                {currentStepConfig && <currentStepConfig.icon className="h-5 w-5" />}
              </div>
            </div>

            {/* Form Card */}
            <Card className="border-0 shadow-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm overflow-hidden">
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
                    
                    {/* Company Information Step */}
                    {currentStep === 'company' && (
                      <div className="space-y-6">
                        <div className="text-center mb-4">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Company Information</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tell us about your business</p>
                        </div>

                        {/* Company Logo Upload */}
                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
                              {avatarPreview || session?.user?.image ? (
                                <Image
                                  src={avatarPreview || session.user.image}
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
                                    setAvatarFile(file)
                                    handleCompanyLogoUpload(file) // Use the new function
                                    }
                                }}
                                />
                              <Camera className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                            </label>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Company Logo</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Upload your logo (optional)</p>
                          </div>
                        </div>

                        <div className="grid gap-5">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company Name *</Label>
                            <Input
                              value={formData.companyName}
                              onChange={(e) => updateForm('companyName', e.target.value)}
                              placeholder="e.g., TechCorp Solutions"
                              className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company Size *</Label>
                              <Select value={formData.companySize} onValueChange={(v) => updateForm('companySize', v)}>
                                <SelectTrigger className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                  <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1-10">1-10 employees (Startup)</SelectItem>
                                  <SelectItem value="11-50">11-50 employees (Small business)</SelectItem>
                                  <SelectItem value="51-200">51-200 employees (Medium business)</SelectItem>
                                  <SelectItem value="201-500">201-500 employees (Large business)</SelectItem>
                                  <SelectItem value="501+">501+ employees (Enterprise)</SelectItem>
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
                                  <SelectItem value="tech">Technology / Software</SelectItem>
                                  <SelectItem value="finance">Finance / Banking</SelectItem>
                                  <SelectItem value="healthcare">Healthcare / Medical</SelectItem>
                                  <SelectItem value="ecommerce">E-commerce / Retail</SelectItem>
                                  <SelectItem value="education">Education / Training</SelectItem>
                                  <SelectItem value="marketing">Marketing / Advertising</SelectItem>
                                  <SelectItem value="consulting">Consulting / Professional Services</SelectItem>
                                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                  <SelectItem value="realestate">Real Estate</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company Website</Label>
                            <Input
                              value={formData.companyWebsite}
                              onChange={(e) => updateForm('companyWebsite', e.target.value)}
                              placeholder="https://yourcompany.com"
                              className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                            />
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company Description</Label>
                            <textarea
                              value={formData.companyDescription}
                              onChange={(e) => updateForm('companyDescription', e.target.value)}
                              placeholder="Tell us about your company's mission, values, and what you do..."
                              rows={3}
                              className="mt-1.5 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year Founded</Label>
                              <Input
                                value={formData.yearFounded}
                                onChange={(e) => updateForm('yearFounded', e.target.value)}
                                placeholder="e.g., 2020"
                                className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Location Section */}
                        <div className="pt-2">
                          <div className="flex items-center gap-2 mb-4">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">Location *</Label>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Country *</Label>
                              <Select value={formData.country} onValueChange={(v) => updateForm('country', v)}>
                                <SelectTrigger className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="us">United States</SelectItem>
                                  <SelectItem value="uk">United Kingdom</SelectItem>
                                  <SelectItem value="ca">Canada</SelectItem>
                                  <SelectItem value="au">Australia</SelectItem>
                                  <SelectItem value="fr">France</SelectItem>
                                  <SelectItem value="de">Germany</SelectItem>
                                  <SelectItem value="es">Spain</SelectItem>
                                  <SelectItem value="it">Italy</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">City *</Label>
                              <Input
                                value={formData.city}
                                onChange={(e) => updateForm('city', e.target.value)}
                                placeholder="e.g., San Francisco"
                                className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</Label>
                              <Input
                                value={formData.address}
                                onChange={(e) => updateForm('address', e.target.value)}
                                placeholder="Street address (optional)"
                                className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contact Information Step */}
                    {currentStep === 'contact' && (
                      <div className="space-y-6">
                        <div className="text-center mb-4">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Contact Information</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">How should freelancers reach you?</p>
                        </div>

                        <div className="grid gap-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name *</Label>
                              <Input
                                value={formData.contactName}
                                onChange={(e) => updateForm('contactName', e.target.value)}
                                placeholder="Your full name"
                                className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                              />
                            </div>

                            <div>
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Position / Title</Label>
                              <Input
                                value={formData.contactPosition}
                                onChange={(e) => updateForm('contactPosition', e.target.value)}
                                placeholder="e.g., CEO, Hiring Manager"
                                className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address *</Label>
                              <Input
                                type="email"
                                value={formData.contactEmail}
                                onChange={(e) => updateForm('contactEmail', e.target.value)}
                                placeholder="contact@company.com"
                                className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                              />
                            </div>

                            <div>
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number *</Label>
                              <Input
                                value={formData.contactPhone}
                                onChange={(e) => updateForm('contactPhone', e.target.value)}
                                placeholder="+1 (555) 000-0000"
                                className="mt-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                              />
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
                            <div className="flex items-start gap-3">
                              <Shield className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Privacy Protected</p>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                  Your contact information is only shared with freelancers you hire
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Verify Step */}
                    {currentStep === 'verify' && (
                      <div className="space-y-6">
                        <div className="text-center mb-4">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Verify Your Information</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please review your details</p>
                        </div>

                        {/* Summary Cards */}
                        <div className="space-y-3">
                          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-2 mb-3">
                              <Building className="h-4 w-4 text-blue-500" />
                              <h4 className="font-semibold text-gray-900 dark:text-white">Company Information</h4>
                            </div>
                            <div className="space-y-1 text-sm">
                              <p><span className="text-gray-500 dark:text-gray-400">Name:</span> {formData.companyName || 'Not provided'}</p>
                              <p><span className="text-gray-500 dark:text-gray-400">Industry:</span> {formData.industry || 'Not provided'}</p>
                              <p><span className="text-gray-500 dark:text-gray-400">Size:</span> {formData.companySize || 'Not provided'}</p>
                              <p><span className="text-gray-500 dark:text-gray-400">Location:</span> {formData.city}, {formData.country}</p>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-2 mb-3">
                              <User className="h-4 w-4 text-purple-500" />
                              <h4 className="font-semibold text-gray-900 dark:text-white">Contact Person</h4>
                            </div>
                            <div className="space-y-1 text-sm">
                              <p><span className="text-gray-500 dark:text-gray-400">Name:</span> {formData.contactName}</p>
                              <p><span className="text-gray-500 dark:text-gray-400">Email:</span> {formData.contactEmail}</p>
                              <p><span className="text-gray-500 dark:text-gray-400">Phone:</span> {formData.contactPhone}</p>
                            </div>
                          </div>
                        </div>

                        {/* Terms */}
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.termsAccepted}
                              onChange={(e) => updateForm('termsAccepted', e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              I confirm that the information provided is accurate and I agree to the 
                              <a href="#" className="text-blue-600 hover:underline mx-1">Terms of Service</a>
                              and
                              <a href="#" className="text-blue-600 hover:underline mx-1">Privacy Policy</a>
                            </span>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.newsletterOptIn}
                              onChange={(e) => updateForm('newsletterOptIn', e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Subscribe to our newsletter for tips and updates (optional)
                            </span>
                          </label>
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
                      currentStep === 'verify'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                        : `bg-gradient-to-r ${currentStepConfig?.color} hover:opacity-90`
                    } text-white shadow-lg hover:shadow-xl`}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : currentStep === 'verify' ? (
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

// Missing Camera import
import { Camera } from 'lucide-react'