// app/[lang]/dashboard/client/mycompany/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { Menu, Building, MapPin, Mail, Phone, Globe, Users, Calendar, Edit2, Save, X, Camera, CheckCircle, AlertCircle, Shield, Sparkles, TrendingUp, Clock, Briefcase } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import Image from "next/image"
import LanguageSwitcher from '@/components/common/LanguageSwitcher'

export default function CompanySettingsPage() {
  const params = useParams()
  const router = useRouter()
  const lang = params.lang as Locale
  const { data: session, update } = useSession()

  const [dict, setDict] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  
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
    vatNumber: '',
    registrationNumber: ''
  })

  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
    fetchCompanyProfile()
  }, [lang])

  const fetchCompanyProfile = async () => {
    try {
      const response = await fetch('/api/users/client-profile')
      const data = await response.json()

      if (response.ok && data.clientProfile) {
        const profile = data.clientProfile
        setFormData({
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
          vatNumber: profile.company?.vatNumber || '',
          registrationNumber: profile.company?.registrationNumber || ''
        })
        
        if (profile.company?.logo) {
          setAvatarPreview(profile.company.logo)
        }
      }
    } catch (error) {
      console.error('Error fetching company profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompanyLogoUpload = async (file: File) => {
    if (!file) return
    
    setUploadingLogo(true)
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
        toast.success(dict?.companySettings?.logoSuccess || 'Company logo updated!')
      } else {
        throw new Error('Failed to upload logo')
      }
    } catch (error) {
      toast.error(dict?.companySettings?.logoError || 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
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
              logo: avatarPreview,
              vatNumber: formData.vatNumber,
              registrationNumber: formData.registrationNumber
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
            }
          }
        })
      })

      if (response.ok) {
        await update()
        toast.success(dict?.companySettings?.saveSuccess || 'Company profile updated!')
        setIsEditing(false)
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast.error(dict?.companySettings?.saveError || 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading || !dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4 mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">
            {dict?.common?.loading || 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">
      <DashboardSidebar
        role="client"
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="md:pl-72 transition-all duration-300 ease-in-out">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 md:hidden px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-semibold text-slate-800 dark:text-white text-sm">
              {dict?.companySettings?.title || 'Company Settings'}
            </span>
          </div>
          <LanguageSwitcher lang={lang} />
        </header>

        {/* Desktop Language Switcher */}
        <div className="hidden md:block absolute top-4 right-8 z-30">
          <LanguageSwitcher lang={lang} />
        </div>

        <main className="py-6 px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {dict?.companySettings?.title || 'Company Settings'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {dict?.companySettings?.description || 'Manage your company profile and contact information'}
              </p>
            </div>

            {/* Company Logo Card */}
            <Card className="mb-6 border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-6 flex-wrap md:flex-nowrap">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden shadow-lg">
                      {avatarPreview ? (
                        <Image
                          src={avatarPreview}
                          alt={dict?.companySettings?.companyLogo || "Company logo"}
                          width={96}
                          height={96}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <Building className="h-12 w-12 text-white" />
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 p-1.5 bg-white dark:bg-slate-800 rounded-full cursor-pointer shadow-md border border-slate-200 dark:border-slate-700 transition-all hover:scale-110">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleCompanyLogoUpload(file)
                          }
                        }}
                      />
                      <Camera className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                    </label>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {dict?.companySettings?.companyLogo || 'Company Logo'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {dict?.companySettings?.logoHint || 'Upload your company logo. Recommended size: 200x200px'}
                    </p>
                  </div>
                  {uploadingLogo && (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                      <span className="text-sm text-slate-500">{dict?.companySettings?.uploading || 'Uploading...'}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Main Form Card */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
              
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle>{dict?.companySettings?.companyDetails || 'Company Details'}</CardTitle>
                    <CardDescription>
                      {dict?.companySettings?.companyDetailsDesc || 'Manage your company information'}
                    </CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      {dict?.companySettings?.edit || 'Edit'}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-2" />
                        {dict?.companySettings?.cancel || 'Cancel'}
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-purple-600"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                            {dict?.companySettings?.saving || 'Saving...'}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {dict?.companySettings?.save || 'Save Changes'}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="general">
                      {dict?.companySettings?.tabs?.general || 'General'}
                    </TabsTrigger>
                    <TabsTrigger value="location">
                      {dict?.companySettings?.tabs?.location || 'Location'}
                    </TabsTrigger>
                    <TabsTrigger value="contact">
                      {dict?.companySettings?.tabs?.contact || 'Contact'}
                    </TabsTrigger>
                  </TabsList>

                  {/* General Tab */}
                  <TabsContent value="general" className="space-y-4">
                    <div className="grid gap-4">
                      <div>
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {dict?.clientOnboarding?.company?.name || 'Company Name'} *
                        </Label>
                        <Input
                          value={formData.companyName}
                          onChange={(e) => updateForm('companyName', e.target.value)}
                          disabled={!isEditing}
                          className="mt-1.5"
                          placeholder={dict?.clientOnboarding?.company?.namePlaceholder || "e.g., TechCorp Solutions"}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {dict?.clientOnboarding?.company?.size || 'Company Size'}
                          </Label>
                          <Select 
                            value={formData.companySize} 
                            onValueChange={(v) => updateForm('companySize', v)}
                            disabled={!isEditing}
                          >
                            <SelectTrigger className="mt-1.5">
                              <SelectValue placeholder={dict?.clientOnboarding?.company?.sizePlaceholder || "Select size"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-10">1-10 {dict?.companySettings?.employees || 'employees'}</SelectItem>
                              <SelectItem value="11-50">11-50 {dict?.companySettings?.employees || 'employees'}</SelectItem>
                              <SelectItem value="51-200">51-200 {dict?.companySettings?.employees || 'employees'}</SelectItem>
                              <SelectItem value="201-500">201-500 {dict?.companySettings?.employees || 'employees'}</SelectItem>
                              <SelectItem value="501+">501+ {dict?.companySettings?.employees || 'employees'}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {dict?.clientOnboarding?.company?.industry || 'Industry'}
                          </Label>
                          <Select 
                            value={formData.industry} 
                            onValueChange={(v) => updateForm('industry', v)}
                            disabled={!isEditing}
                          >
                            <SelectTrigger className="mt-1.5">
                              <SelectValue placeholder={dict?.clientOnboarding?.company?.industryPlaceholder || "Select industry"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tech">{dict?.companySettings?.industries?.tech || 'Technology / Software'}</SelectItem>
                              <SelectItem value="finance">{dict?.companySettings?.industries?.finance || 'Finance / Banking'}</SelectItem>
                              <SelectItem value="healthcare">{dict?.companySettings?.industries?.healthcare || 'Healthcare / Medical'}</SelectItem>
                              <SelectItem value="ecommerce">{dict?.companySettings?.industries?.ecommerce || 'E-commerce / Retail'}</SelectItem>
                              <SelectItem value="education">{dict?.companySettings?.industries?.education || 'Education / Training'}</SelectItem>
                              <SelectItem value="marketing">{dict?.companySettings?.industries?.marketing || 'Marketing / Advertising'}</SelectItem>
                              <SelectItem value="consulting">{dict?.companySettings?.industries?.consulting || 'Consulting'}</SelectItem>
                              <SelectItem value="other">{dict?.companySettings?.industries?.other || 'Other'}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {dict?.clientOnboarding?.company?.website || 'Company Website'}
                        </Label>
                        <Input
                          value={formData.companyWebsite}
                          onChange={(e) => updateForm('companyWebsite', e.target.value)}
                          disabled={!isEditing}
                          className="mt-1.5"
                          placeholder="https://yourcompany.com"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {dict?.clientOnboarding?.company?.description || 'Company Description'}
                        </Label>
                        <Textarea
                          value={formData.companyDescription}
                          onChange={(e) => updateForm('companyDescription', e.target.value)}
                          disabled={!isEditing}
                          rows={4}
                          className="mt-1.5 resize-none"
                          placeholder={dict?.clientOnboarding?.company?.descriptionPlaceholder || "Tell us about your company..."}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {dict?.clientOnboarding?.company?.founded || 'Year Founded'}
                          </Label>
                          <Input
                            value={formData.yearFounded}
                            onChange={(e) => updateForm('yearFounded', e.target.value)}
                            disabled={!isEditing}
                            className="mt-1.5"
                            placeholder="e.g., 2020"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {dict?.companySettings?.vatNumber || 'VAT Number'}
                          </Label>
                          <Input
                            value={formData.vatNumber}
                            onChange={(e) => updateForm('vatNumber', e.target.value)}
                            disabled={!isEditing}
                            className="mt-1.5"
                            placeholder={dict?.companySettings?.vatPlaceholder || "e.g., VAT123456789"}
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {dict?.companySettings?.registrationNumber || 'Registration Number'}
                          </Label>
                          <Input
                            value={formData.registrationNumber}
                            onChange={(e) => updateForm('registrationNumber', e.target.value)}
                            disabled={!isEditing}
                            className="mt-1.5"
                            placeholder={dict?.companySettings?.regPlaceholder || "e.g., REG123456"}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Location Tab */}
                  <TabsContent value="location" className="space-y-4">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {dict?.clientOnboarding?.company?.country || 'Country'} *
                          </Label>
                          <Select 
                            value={formData.country} 
                            onValueChange={(v) => updateForm('country', v)}
                            disabled={!isEditing}
                          >
                            <SelectTrigger className="mt-1.5">
                              <SelectValue placeholder={dict?.clientOnboarding?.company?.countryPlaceholder || "Select country"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="us">{dict?.countries?.us || 'United States'}</SelectItem>
                              <SelectItem value="uk">{dict?.countries?.uk || 'United Kingdom'}</SelectItem>
                              <SelectItem value="ca">{dict?.countries?.ca || 'Canada'}</SelectItem>
                              <SelectItem value="fr">{dict?.countries?.fr || 'France'}</SelectItem>
                              <SelectItem value="de">{dict?.countries?.de || 'Germany'}</SelectItem>
                              <SelectItem value="es">{dict?.countries?.es || 'Spain'}</SelectItem>
                              <SelectItem value="it">{dict?.countries?.it || 'Italy'}</SelectItem>
                              <SelectItem value="other">{dict?.countries?.other || 'Other'}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {dict?.clientOnboarding?.company?.city || 'City'} *
                          </Label>
                          <Input
                            value={formData.city}
                            onChange={(e) => updateForm('city', e.target.value)}
                            disabled={!isEditing}
                            className="mt-1.5"
                            placeholder="e.g., San Francisco"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {dict?.clientOnboarding?.company?.address || 'Address'}
                        </Label>
                        <Textarea
                          value={formData.address}
                          onChange={(e) => updateForm('address', e.target.value)}
                          disabled={!isEditing}
                          rows={3}
                          className="mt-1.5 resize-none"
                          placeholder={dict?.clientOnboarding?.company?.addressPlaceholder || "Street address, P.O. Box, etc."}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Contact Tab */}
                  <TabsContent value="contact" className="space-y-4">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {dict?.clientOnboarding?.contact?.fullName || 'Full Name'} *
                          </Label>
                          <Input
                            value={formData.contactName}
                            onChange={(e) => updateForm('contactName', e.target.value)}
                            disabled={!isEditing}
                            className="mt-1.5"
                            placeholder={dict?.clientOnboarding?.contact?.namePlaceholder || "Your full name"}
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {dict?.clientOnboarding?.contact?.position || 'Position / Title'}
                          </Label>
                          <Input
                            value={formData.contactPosition}
                            onChange={(e) => updateForm('contactPosition', e.target.value)}
                            disabled={!isEditing}
                            className="mt-1.5"
                            placeholder={dict?.clientOnboarding?.contact?.positionPlaceholder || "e.g., CEO, Hiring Manager"}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {dict?.clientOnboarding?.contact?.email || 'Email Address'} *
                          </Label>
                          <Input
                            type="email"
                            value={formData.contactEmail}
                            onChange={(e) => updateForm('contactEmail', e.target.value)}
                            disabled={!isEditing}
                            className="mt-1.5"
                            placeholder="contact@company.com"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {dict?.clientOnboarding?.contact?.phone || 'Phone Number'} *
                          </Label>
                          <Input
                            value={formData.contactPhone}
                            onChange={(e) => updateForm('contactPhone', e.target.value)}
                            disabled={!isEditing}
                            className="mt-1.5"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Shield className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                              {dict?.clientOnboarding?.contact?.privacyTitle || 'Privacy Protected'}
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              {dict?.clientOnboarding?.contact?.privacyText || 'Your contact information is only shared with freelancers you hire'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {dict?.companySettings?.stats?.profileCompletion || 'Profile Completion'}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">85%</p>
                    </div>
                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {dict?.companySettings?.stats?.totalProjects || 'Total Projects'}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">12</p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {dict?.companySettings?.stats?.activeHires || 'Active Hires'}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">3</p>
                    </div>
                    <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}