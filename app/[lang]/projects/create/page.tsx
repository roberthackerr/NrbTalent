// app/[lang]/projects/create/page.tsx
'use client'

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Plus, 
  Trash2, 
  Upload, 
  DollarSign, 
  Calendar,
  Tag,
  Users,
  FileText,
  CheckCircle2,
  Zap,
  TrendingUp,
  Globe,
  Calculator,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Briefcase,
  MapPin,
  Clock,
  Layers,
  Shield,
  Eye,
  EyeOff,
  HeartHandshake,
  Settings
} from "lucide-react"
import { CurrencySelector } from "@/components/currency/CurrencySelector"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { COUNTRIES } from "@/lib/constants/countries"

interface ProjectFormData {
  title: string
  description: string
  category: string
  subcategory: string
  budget: {
    min: number
    max: number
    type: "fixed" | "hourly"
    currency: string
  }
  skills: string[]
  deadline: string
  visibility: "public" | "private"
  tags: string[]
  attachments: Array<{
    name: string
    url: string
    type: string
  }>
  milestones: Array<{
    title: string
    amount: number
    dueDate: string
    description: string
    currency: string
  }>
  location: {
    country: string
    city: string
    remote: boolean
  }
}

interface Category {
  name: string
  count: number
  subcategories: string[]
}

interface Skill {
  skill: string
  count: number
  avgBudget: number
}

// Types de projets
const PROJECT_TYPES = [
  { value: "fixed", label: "Prix fixe", icon: DollarSign, description: "Budget défini à l'avance" },
  { value: "hourly", label: "Taux horaire", icon: Clock, description: "Paiement à l'heure travaillée" }
]

// Niveaux de complexité
const COMPLEXITY_LEVELS = [
  { value: "beginner", label: "Débutant", description: "Tâches simples" },
  { value: "intermediate", label: "Intermédiaire", description: "Expérience requise" },
  { value: "expert", label: "Expert", description: "Expertise avancée" }
]

// Urgences
const URGENCY_LEVELS = [
  { value: "low", label: "Normal", color: "bg-green-500" },
  { value: "medium", label: "Urgent", color: "bg-orange-500" },
  { value: "high", label: "Très urgent", color: "bg-red-500" }
]

export default function CreateProjectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const lang = params.lang as Locale
  
  const [dict, setDict] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [popularSkills, setPopularSkills] = useState<Skill[]>([])
  const [skillInput, setSkillInput] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [complexity, setComplexity] = useState("intermediate")
  const [urgency, setUrgency] = useState("low")
  const [showPreview, setShowPreview] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState("MG")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    budget: {
      min: 0,
      max: 0,
      type: "fixed",
      currency: "MGA"
    },
    skills: [],
    deadline: "",
    visibility: "public",
    tags: [],
    attachments: [],
    milestones: [],
    location: {
      country: "MG",
      city: "",
      remote: true
    }
  })

  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  // Charger les catégories et compétences
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/projects/categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories)
          setPopularSkills(data.popularSkills)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchData()
  }, [])

  // Vérifier l'authentification et le rôle
  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push(`/${lang}/auth/signin`)
      return
    }

    if ((session.user as any).role !== "client") {
      toast.error(dict?.projects?.errors?.clientOnly || "Seuls les clients peuvent créer des projets")
      router.push(`/${lang}/`)
    }
  }, [session, status, router, lang, dict])

  const t = dict?.projects?.create || {}

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleBudgetChange = (field: string, value: number | string) => {
    setFormData(prev => ({
      ...prev,
      budget: { ...prev.budget, [field]: value }
    }))
  }

  const addSkill = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }))
    }
    setSkillInput("")
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(skill => skill !== skillToRemove) }))
  }

  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput] }))
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }))
  }

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, {
        title: "",
        amount: 0,
        dueDate: "",
        description: "",
        currency: formData.budget.currency
      }]
    }))
  }

  const updateMilestone = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => i === index ? { ...m, [field]: value } : m)
    }))
  }

  const removeMilestone = (index: number) => {
    setFormData(prev => ({ ...prev, milestones: prev.milestones.filter((_, i) => i !== index) }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: return !!(formData.title && formData.description && formData.category)
      case 2: return !!(formData.budget.min > 0 && formData.budget.max >= formData.budget.min && formData.deadline)
      case 3: return !!(formData.skills.length > 0)
      default: return true
    }
  }

  const handleSaveDraft = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status: "draft" })
      })
      if (response.ok) {
        const data = await response.json()
        toast.success(t.draftSaved || "Projet sauvegardé en brouillon")
        router.push(`/${lang}/projects/${data.projectId}`)
      }
    } catch (error) {
      toast.error(t.saveError || "Erreur lors de la sauvegarde")
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status: "open" })
      })
      if (response.ok) {
        const data = await response.json()
        toast.success(t.published || "Projet publié avec succès !")
        router.push(`/${lang}/projects/${data.projectId}`)
      }
    } catch (error) {
      toast.error(t.publishError || "Erreur lors de la publication")
    } finally {
      setLoading(false)
    }
  }

  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header avec gradient */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.back || "Retour"}
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl shadow-lg shadow-purple-500/25">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-700 via-fuchsia-700 to-pink-700 dark:from-purple-300 dark:via-fuchsia-300 dark:to-pink-300 bg-clip-text text-transparent">
                  {t.title || "Créer un nouveau projet"}
                </h1>
              </div>
              <p className="text-slate-600 dark:text-slate-400 ml-11">
                {t.subtitle || "Publiez votre projet et trouvez les meilleurs talents"}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={loading || !formData.title}
                className="border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30"
              >
                <Save className="h-4 w-4 mr-2" />
                {t.saveDraft || "Sauvegarder le brouillon"}
              </Button>
              
              <Button
                onClick={handlePublish}
                disabled={loading || !validateStep(3)}
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 shadow-lg shadow-purple-500/25"
              >
                <Send className="h-4 w-4 mr-2" />
                {t.publish || "Publier le projet"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Steps */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Layers className="h-5 w-5" />
                  {t.steps || "Étapes de création"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { step: 1, title: t.step1Title || "Description", description: t.step1Desc || "Détails du projet", icon: FileText },
                  { step: 2, title: t.step2Title || "Budget & Délai", description: t.step2Desc || "Financement et timing", icon: DollarSign },
                  { step: 3, title: t.step3Title || "Compétences", description: t.step3Desc || "Expertise requise", icon: Sparkles },
                  { step: 4, title: t.step4Title || "Options", description: t.step4Desc || "Paramètres supplémentaires", icon: Settings }
                ].map((item) => {
                  const Icon = item.icon
                  const isActive = currentStep === item.step
                  const isCompleted = currentStep > item.step
                  
                  return (
                    <div
                      key={item.step}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30 border border-purple-200 dark:border-purple-800"
                          : "hover:bg-purple-50/30 dark:hover:bg-purple-950/20"
                      }`}
                      onClick={() => setCurrentStep(item.step)}
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                        isActive
                          ? "bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-md"
                          : isCompleted
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium text-sm ${isActive ? "text-purple-700 dark:text-purple-300" : "text-slate-700 dark:text-slate-300"}`}>
                          {item.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="mt-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  {t.tips || "Conseils"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{t.tip1Title || "Budget réaliste"}</div>
                    <div className="text-slate-600 dark:text-slate-400 text-xs">
                      {t.tip1Desc || "Fixez un budget attractif pour attirer les meilleurs talents"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{t.tip2Title || "Description détaillée"}</div>
                    <div className="text-slate-600 dark:text-slate-400 text-xs">
                      {t.tip2Desc || "Plus vous êtes précis, plus vous attirerez des candidats qualifiés"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-purple-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{t.tip3Title || "Compétences claires"}</div>
                    <div className="text-slate-600 dark:text-slate-400 text-xs">
                      {t.tip3Desc || "Listez les compétences essentielles pour le projet"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-500/10">
              <CardContent className="p-6">
                {/* Step 1: Description */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="title" className="text-base font-semibold text-purple-700 dark:text-purple-300">
                        {t.titleLabel || "Titre du projet"} *
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        placeholder={t.titlePlaceholder || "Ex: Développement d'une application React Native"}
                        className="mt-2 text-lg border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500"
                      />
                      <p className="text-sm text-slate-500 mt-1">{t.titleHelp || "Soyez clair et concis. 60 caractères maximum."}</p>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-base font-semibold text-purple-700 dark:text-purple-300">
                        {t.descriptionLabel || "Description détaillée"} *
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder={t.descriptionPlaceholder || "Décrivez en détail votre projet, vos objectifs, les fonctionnalités attendues..."}
                        rows={8}
                        className="mt-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-base font-semibold text-purple-700 dark:text-purple-300">
                          {t.categoryLabel || "Catégorie"} *
                        </Label>
                        <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                          <SelectTrigger className="mt-2 border-purple-200 dark:border-purple-800">
                            <SelectValue placeholder={t.selectCategory || "Sélectionnez une catégorie"} />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.name} value={category.name}>
                                {category.name} ({category.count})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-base font-semibold text-purple-700 dark:text-purple-300">
                          {t.subcategoryLabel || "Sous-catégorie"}
                        </Label>
                        <Select
                          value={formData.subcategory}
                          onValueChange={(value) => handleInputChange("subcategory", value)}
                          disabled={!formData.category}
                        >
                          <SelectTrigger className="mt-2 border-purple-200 dark:border-purple-800">
                            <SelectValue placeholder={t.selectSubcategory || "Sélectionnez une sous-catégorie"} />
                          </SelectTrigger>
                          <SelectContent>
                            {categories
                              .find(cat => cat.name === formData.category)
                              ?.subcategories.map((subcat) => (
                                <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-base font-semibold text-purple-700 dark:text-purple-300">
                          {t.countryLabel || "Pays"}
                        </Label>
                        <Select
                          value={formData.location.country}
                          onValueChange={(value) => handleInputChange("location", { ...formData.location, country: value })}
                        >
                          <SelectTrigger className="mt-2 border-purple-200 dark:border-purple-800">
                            <SelectValue placeholder={t.selectCountry || "Sélectionnez un pays"} />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            {COUNTRIES.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.flag} {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-base font-semibold text-purple-700 dark:text-purple-300">
                          {t.cityLabel || "Ville"}
                        </Label>
                        <Input
                          value={formData.location.city}
                          onChange={(e) => handleInputChange("location", { ...formData.location, city: e.target.value })}
                          placeholder={t.cityPlaceholder || "Ex: Antananarivo"}
                          className="mt-2 border-purple-200 dark:border-purple-800"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="remote"
                        checked={formData.location.remote}
                        onCheckedChange={(checked) => handleInputChange("location", { ...formData.location, remote: checked })}
                      />
                      <Label htmlFor="remote" className="cursor-pointer text-slate-700 dark:text-slate-300">
                        {t.remoteWork || "Travail à distance accepté"}
                      </Label>
                    </div>

                    <div className="flex justify-between pt-4">
                      <div className="text-sm text-slate-500">{t.stepCount || "Étape 1 sur 4"}</div>
                      <Button onClick={() => setCurrentStep(2)} disabled={!validateStep(1)} className="bg-purple-600 hover:bg-purple-700">
                        {t.continue || "Continuer"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Budget & Deadline */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold text-purple-700 dark:text-purple-300">
                        {t.currencyLabel || "Devise"}
                      </Label>
                      <CurrencySelector
                        value={formData.budget.currency}
                        onChange={(currency) => handleBudgetChange("currency", currency)}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-base font-semibold text-purple-700 dark:text-purple-300 mb-4 block">
                        {t.budgetType || "Type de budget"}
                      </Label>
                      <div className="grid grid-cols-2 gap-4">
                        {PROJECT_TYPES.map((type) => {
                          const Icon = type.icon
                          const isSelected = formData.budget.type === type.value
                          return (
                            <Button
                              key={type.value}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              onClick={() => handleBudgetChange("type", type.value)}
                              className={`h-auto py-4 flex flex-col items-center gap-2 ${isSelected ? "bg-gradient-to-r from-purple-600 to-fuchsia-600" : "border-purple-200 dark:border-purple-800"}`}
                            >
                              <Icon className="h-5 w-5" />
                              <span>{type.label}</span>
                              <span className="text-xs opacity-80">{type.description}</span>
                            </Button>
                          )
                        })}
                      </div>
                    </div>

                    {formData.budget.type === "hourly" ? (
                      <div>
                        <Label htmlFor="hourlyRate" className="text-base font-semibold text-purple-700 dark:text-purple-300">
                          {t.hourlyRate || "Taux horaire"} *
                        </Label>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="relative flex-1">
                            <Input
                              id="hourlyRate"
                              type="number"
                              value={formData.budget.min || ""}
                              onChange={(e) => handleBudgetChange("min", Number(e.target.value))}
                              placeholder="0"
                              className="pr-20 border-purple-200 dark:border-purple-800"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm">
                              / heure
                            </div>
                          </div>
                          <div className="text-sm text-slate-600">en {formData.budget.currency}</div>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {t.hourlyHelp || "Indiquez votre taux horaire, le freelancer vous facturera le temps travaillé"}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="budgetMin" className="text-base font-semibold text-purple-700 dark:text-purple-300">
                            {t.budgetMin || "Budget minimum"} *
                          </Label>
                          <div className="relative mt-2">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                            <Input
                              id="budgetMin"
                              type="number"
                              value={formData.budget.min || ""}
                              onChange={(e) => handleBudgetChange("min", Number(e.target.value))}
                              placeholder="0"
                              className="pl-10 border-purple-200 dark:border-purple-800"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="budgetMax" className="text-base font-semibold text-purple-700 dark:text-purple-300">
                            {t.budgetMax || "Budget maximum"} *
                          </Label>
                          <div className="relative mt-2">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                            <Input
                              id="budgetMax"
                              type="number"
                              value={formData.budget.max || ""}
                              onChange={(e) => handleBudgetChange("max", Number(e.target.value))}
                              placeholder="0"
                              className="pl-10 border-purple-200 dark:border-purple-800"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="deadline" className="text-base font-semibold text-purple-700 dark:text-purple-300">
                        {t.deadline || "Date limite"} *
                      </Label>
                      <div className="relative mt-2">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                        <Input
                          id="deadline"
                          type="date"
                          value={formData.deadline}
                          onChange={(e) => handleInputChange("deadline", e.target.value)}
                          className="pl-10 border-purple-200 dark:border-purple-800"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>

                    {/* Urgency & Complexity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-base font-semibold text-purple-700 dark:text-purple-300">
                          {t.urgency || "Urgence"}
                        </Label>
                        <div className="flex gap-2 mt-2">
                          {URGENCY_LEVELS.map((level) => (
                            <Button
                              key={level.value}
                              type="button"
                              variant={urgency === level.value ? "default" : "outline"}
                              onClick={() => setUrgency(level.value)}
                              className={`flex-1 ${urgency === level.value ? `bg-${level.color} hover:bg-${level.color}` : "border-purple-200 dark:border-purple-800"}`}
                            >
                              {level.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-base font-semibold text-purple-700 dark:text-purple-300">
                          {t.complexity || "Complexité"}
                        </Label>
                        <Select value={complexity} onValueChange={setComplexity}>
                          <SelectTrigger className="mt-2 border-purple-200 dark:border-purple-800">
                            <SelectValue placeholder={t.selectComplexity || "Sélectionnez un niveau"} />
                          </SelectTrigger>
                          <SelectContent>
                            {COMPLEXITY_LEVELS.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                <div>
                                  <div>{level.label}</div>
                                  <div className="text-xs text-slate-500">{level.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Milestones */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-base font-semibold text-purple-700 dark:text-purple-300">
                          {t.milestones || "Jalons de paiement"}
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={addMilestone} className="border-purple-200 hover:bg-purple-50">
                          <Plus className="h-4 w-4 mr-2" />
                          {t.addMilestone || "Ajouter un jalon"}
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {formData.milestones.map((milestone, index) => (
                          <div key={index} className="flex gap-4 items-start p-4 border border-purple-200 dark:border-purple-800 rounded-xl">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>{t.milestoneTitle || "Titre"}</Label>
                                <Input
                                  value={milestone.title}
                                  onChange={(e) => updateMilestone(index, "title", e.target.value)}
                                  placeholder={t.milestoneTitlePlaceholder || "Ex: Maquettes finalisées"}
                                  className="border-purple-200 dark:border-purple-800"
                                />
                              </div>
                              <div>
                                <Label>{t.milestoneAmount || "Montant"}</Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    value={milestone.amount}
                                    onChange={(e) => updateMilestone(index, "amount", Number(e.target.value))}
                                    placeholder="0"
                                    className="flex-1 border-purple-200 dark:border-purple-800"
                                  />
                                  <div className="text-sm text-slate-600 flex items-center px-3 border rounded bg-slate-50 dark:bg-slate-800">
                                    {milestone.currency}
                                  </div>
                                </div>
                              </div>
                              <div className="md:col-span-2">
                                <Label>{t.milestoneDueDate || "Date d'échéance"}</Label>
                                <Input
                                  type="date"
                                  value={milestone.dueDate}
                                  onChange={(e) => updateMilestone(index, "dueDate", e.target.value)}
                                  min={new Date().toISOString().split('T')[0]}
                                  className="border-purple-200 dark:border-purple-800"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label>{t.milestoneDescription || "Description"}</Label>
                                <Textarea
                                  value={milestone.description}
                                  onChange={(e) => updateMilestone(index, "description", e.target.value)}
                                  placeholder={t.milestoneDescPlaceholder || "Description des livrables attendus..."}
                                  rows={2}
                                  className="border-purple-200 dark:border-purple-800"
                                />
                              </div>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeMilestone(index)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setCurrentStep(1)} className="border-purple-200 hover:bg-purple-50">
                        {t.back || "Retour"}
                      </Button>
                      <Button onClick={() => setCurrentStep(3)} disabled={!validateStep(2)} className="bg-purple-600 hover:bg-purple-700">
                        {t.continue || "Continuer"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Skills */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold text-purple-700 dark:text-purple-300">
                        {t.skills || "Compétences requises"} *
                      </Label>
                      <div className="flex gap-2 mb-4 mt-2">
                        <Input
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          placeholder={t.skillPlaceholder || "Rechercher ou ajouter une compétence..."}
                          onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) } }}
                          className="border-purple-200 dark:border-purple-800"
                        />
                        <Button type="button" onClick={() => addSkill(skillInput)} className="bg-purple-600 hover:bg-purple-700">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {formData.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1.5">
                            {skill}
                            <button onClick={() => removeSkill(skill)} className="ml-2 hover:text-red-500">×</button>
                          </Badge>
                        ))}
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-3 block text-purple-600 dark:text-purple-400">
                          {t.popularSkills || "Compétences populaires"}
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {popularSkills.slice(0, 15).map((skill) => (
                            <Badge
                              key={skill.skill}
                              variant="outline"
                              className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800"
                              onClick={() => addSkill(skill.skill)}
                            >
                              {skill.skill}
                              <span className="text-xs text-purple-500 ml-1">({skill.count})</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-semibold text-purple-700 dark:text-purple-300">
                        {t.tags || "Tags"}
                      </Label>
                      <div className="flex gap-2 mb-4 mt-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder={t.tagPlaceholder || "Ajouter des tags..."}
                          onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                          className="border-purple-200 dark:border-purple-800"
                        />
                        <Button type="button" variant="outline" onClick={addTag} className="border-purple-200 hover:bg-purple-50">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="border-purple-200 dark:border-purple-800">
                            #{tag}
                            <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500">×</button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setCurrentStep(2)} className="border-purple-200 hover:bg-purple-50">
                        {t.back || "Retour"}
                      </Button>
                      <Button onClick={() => setCurrentStep(4)} disabled={!validateStep(3)} className="bg-purple-600 hover:bg-purple-700">
                        {t.continue || "Continuer"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4: Advanced Options */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold text-purple-700 dark:text-purple-300 mb-4 block">
                        {t.visibility || "Visibilité"}
                      </Label>
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          type="button"
                          variant={formData.visibility === "public" ? "default" : "outline"}
                          onClick={() => handleInputChange("visibility", "public")}
                          className={`h-auto py-4 flex flex-col items-center gap-2 ${formData.visibility === "public" ? "bg-gradient-to-r from-purple-600 to-fuchsia-600" : "border-purple-200 dark:border-purple-800"}`}
                        >
                          <Globe className="h-5 w-5" />
                          <span>{t.public || "Public"}</span>
                          <span className="text-xs opacity-80 text-center">{t.publicDesc || "Visible par tous les freelances"}</span>
                        </Button>
                        <Button
                          type="button"
                          variant={formData.visibility === "private" ? "default" : "outline"}
                          onClick={() => handleInputChange("visibility", "private")}
                          className={`h-auto py-4 flex flex-col items-center gap-2 ${formData.visibility === "private" ? "bg-gradient-to-r from-purple-600 to-fuchsia-600" : "border-purple-200 dark:border-purple-800"}`}
                        >
                          <Shield className="h-5 w-5" />
                          <span>{t.private || "Privé"}</span>
                          <span className="text-xs opacity-80 text-center">{t.privateDesc || "Invitation uniquement"}</span>
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-semibold text-purple-700 dark:text-purple-300">
                        {t.attachments || "Fichiers joints"}
                      </Label>
                      <div className="border-2 border-dashed border-purple-200 dark:border-purple-800 rounded-xl p-8 text-center mt-2 hover:border-purple-400 transition-colors">
                        <Upload className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                        <div className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                          {t.dragDrop || "Glissez-déposez vos fichiers ici"}
                        </div>
                        <div className="text-sm text-slate-500 mb-4">
                          {t.orClick || "ou cliquez pour parcourir"}
                        </div>
                        <Button variant="outline" className="border-purple-200 hover:bg-purple-50">
                          <Upload className="h-4 w-4 mr-2" />
                          {t.selectFiles || "Choisir des fichiers"}
                        </Button>
                      </div>
                    </div>

                    {/* Preview Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPreview(!showPreview)}
                      className="w-full border-purple-200 hover:bg-purple-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {showPreview ? t.hidePreview || "Masquer l'aperçu" : t.showPreview || "Afficher l'aperçu"}
                    </Button>

                    {showPreview && (
                      <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg text-purple-700 dark:text-purple-300">
                            {t.preview || "Aperçu du projet"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><div className="font-medium text-purple-600 dark:text-purple-400">{t.title || "Titre"}</div><div>{formData.title || "-"}</div></div>
                            <div><div className="font-medium text-purple-600 dark:text-purple-400">{t.category || "Catégorie"}</div><div>{formData.category || "-"}</div></div>
                            <div><div className="font-medium text-purple-600 dark:text-purple-400">{t.budget || "Budget"}</div><div>{formData.budget.min > 0 ? `${formData.budget.min} - ${formData.budget.max} ${formData.budget.currency} (${formData.budget.type === "fixed" ? "Fixe" : "Horaire"})` : "-"}</div></div>
                            <div><div className="font-medium text-purple-600 dark:text-purple-400">{t.deadline || "Date limite"}</div><div>{formData.deadline ? new Date(formData.deadline).toLocaleDateString() : "-"}</div></div>
                            <div className="col-span-2"><div className="font-medium text-purple-600 dark:text-purple-400">{t.skills || "Compétences"}</div><div className="flex flex-wrap gap-1 mt-1">{formData.skills.map(s => <Badge key={s} variant="secondary" className="bg-purple-100">{s}</Badge>)}</div></div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setCurrentStep(3)} className="border-purple-200 hover:bg-purple-50">
                        {t.back || "Retour"}
                      </Button>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={handleSaveDraft} disabled={loading || !formData.title} className="border-purple-200 hover:bg-purple-50">
                          <Save className="h-4 w-4 mr-2" />
                          {t.saveDraft || "Sauvegarder"}
                        </Button>
                        <Button onClick={handlePublish} disabled={loading || !validateStep(3)} className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700">
                          <Send className="h-4 w-4 mr-2" />
                          {t.publish || "Publier"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}