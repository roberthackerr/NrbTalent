"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
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
  RefreshCw
} from "lucide-react"
import { CurrencySelector } from "@/components/currency/CurrencySelector"
import { useCurrency } from "@/hooks/useCurrency"
import { currencyConverter } from "@/lib/currency/converter"
import { MADAGASCAR_CONFIG } from "@/lib/config/madagascar"

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
    originalCurrency?: string
    exchangeRate?: number
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
    country?: string
    city?: string
    timezone?: string
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

export default function CreateProjectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { userCurrency, format, convert, rates, loading: ratesLoading } = useCurrency()
  
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [popularSkills, setPopularSkills] = useState<Skill[]>([])
  const [skillInput, setSkillInput] = useState("")
  const [tagInput, setTagInput] = useState("")
  
  // États pour la conversion
  const [showConversion, setShowConversion] = useState(false)
  const [convertedPreview, setConvertedPreview] = useState<{
    userCurrency: string
    amounts: {
      min: number
      max: number
      hourly?: number
    }
  } | null>(null)
  
  // États pour les estimations horaires
  const [estimatedHours, setEstimatedHours] = useState(40)

  // Ref pour éviter les boucles infinies
  const isConvertingRef = useRef(false)
  const lastConversionRef = useRef<string>('')

  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    budget: {
      min: 0,
      max: 0,
      type: "fixed",
      currency: userCurrency
    },
    skills: [],
    deadline: "",
    visibility: "public",
    tags: [],
    attachments: [],
    milestones: [],
    location: {
      remote: true
    }
  })

  // Mettre à jour la devise quand userCurrency change (seulement au début)
  useEffect(() => {
    if (formData.budget.min === 0 && formData.budget.max === 0) {
      setFormData(prev => ({
        ...prev,
        budget: {
          ...prev.budget,
          currency: userCurrency
        }
      }))
    }
  }, [userCurrency])

  // Calculer l'estimation pour les projets horaires
  useEffect(() => {
    if (formData.budget.type === "hourly" && formData.budget.min > 0 && !isConvertingRef.current) {
      const total = formData.budget.min * estimatedHours
      setFormData(prev => ({
        ...prev,
        budget: {
          ...prev.budget,
          max: total
        }
      }))
    }
  }, [estimatedHours, formData.budget.type, formData.budget.min])

  // Calculer la conversion pour l'aperçu (avec debounce)
  useEffect(() => {
    const calculateConversion = async () => {
      // Vérifier si on doit calculer
      if (isConvertingRef.current) return
      if (formData.budget.min <= 0) {
        setConvertedPreview(null)
        return
      }
      if (userCurrency === formData.budget.currency) {
        setConvertedPreview(null)
        return
      }

      // Créer une clé unique pour cette conversion
      const conversionKey = `${formData.budget.min}-${formData.budget.max}-${formData.budget.currency}-${userCurrency}`
      if (lastConversionRef.current === conversionKey) return
      
      isConvertingRef.current = true
      lastConversionRef.current = conversionKey

      try {
        const minConverted = await convert(formData.budget.min, formData.budget.currency, userCurrency)
        const maxConverted = formData.budget.max > 0 
          ? await convert(formData.budget.max, formData.budget.currency, userCurrency)
          : minConverted
          
        setConvertedPreview({
          userCurrency,
          amounts: {
            min: minConverted,
            max: maxConverted,
            hourly: formData.budget.type === "hourly" ? await convert(formData.budget.min, formData.budget.currency, userCurrency) : undefined
          }
        })
      } catch (error) {
        console.error("Erreur de conversion:", error)
        setConvertedPreview(null)
      } finally {
        isConvertingRef.current = false
      }
    }
    
    // Debounce de 500ms
    const timeoutId = setTimeout(() => {
      calculateConversion()
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [formData.budget.min, formData.budget.max, formData.budget.currency, formData.budget.type, userCurrency, convert])

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
      router.push("/auth/signin")
      return
    }

    if ((session.user as any).role !== "client") {
      toast.error("Seuls les clients peuvent créer des projets")
      router.push("/")
    }
  }, [session, status, router])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleBudgetChange = (field: string, value: number | string) => {
    setFormData(prev => ({
      ...prev,
      budget: {
        ...prev.budget,
        [field]: value
      }
    }))
  }

  const handleCurrencyChange = async (newCurrency: string) => {
    if (isConvertingRef.current) return
    
    // Si les montants sont à 0, juste changer la devise
    if (formData.budget.min === 0 && formData.budget.max === 0) {
      handleBudgetChange("currency", newCurrency)
      return
    }

    // Convertir les montants
    isConvertingRef.current = true
    try {
      const minConverted = await convert(formData.budget.min, formData.budget.currency, newCurrency)
      const maxConverted = formData.budget.max > 0 
        ? await convert(formData.budget.max, formData.budget.currency, newCurrency)
        : minConverted
      
      setFormData(prev => ({
        ...prev,
        budget: {
          ...prev.budget,
          currency: newCurrency,
          min: Math.round(minConverted),
          max: Math.round(maxConverted)
        }
      }))
      
      // Réinitialiser la clé de conversion
      lastConversionRef.current = ''
    } catch (error) {
      console.error("Erreur lors de la conversion:", error)
      toast.error("Erreur lors de la conversion de devise")
      handleBudgetChange("currency", newCurrency)
    } finally {
      setTimeout(() => {
        isConvertingRef.current = false
      }, 100)
    }
  }

  const addSkill = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }))
    }
    setSkillInput("")
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput]
      }))
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        {
          title: "",
          amount: 0,
          dueDate: "",
          description: "",
          currency: formData.budget.currency
        }
      ]
    }))
  }

  const updateMilestone = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) =>
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }))
  }

  const removeMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.title && formData.description && formData.category)
      case 2:
        return !!(formData.budget.min > 0 && formData.budget.max >= formData.budget.min && formData.deadline)
      case 3:
        return !!(formData.skills.length > 0)
      default:
        return true
    }
  }

  const handleSaveDraft = async () => {
    setLoading(true)
    try {
      let budgetWithExchange = { ...formData.budget }
      if (formData.budget.currency !== userCurrency) {
        const rate = await currencyConverter.convert(1, formData.budget.currency, userCurrency)
        budgetWithExchange = {
          ...budgetWithExchange,
          originalCurrency: formData.budget.currency,
          exchangeRate: rate.rate
        }
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          budget: budgetWithExchange,
          status: "draft"
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Projet sauvegardé en brouillon")
        router.push(`/projects/${data.projectId}`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Erreur lors de la sauvegarde")
      }
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    setLoading(true)
    try {
      let budgetWithExchange = { ...formData.budget }
      if (formData.budget.currency !== userCurrency) {
        const rate = await currencyConverter.convert(1, formData.budget.currency, userCurrency)
        budgetWithExchange = {
          ...budgetWithExchange,
          originalCurrency: formData.budget.currency,
          exchangeRate: rate.rate
        }
      }

      const projectData = {
        ...formData,
        budget: budgetWithExchange,
        status: "open",
        metadata: {
          vatRate: formData.budget.currency === 'MGA' ? MADAGASCAR_CONFIG.taxes.vat : 0,
          country: formData.location.country || 'MG',
          timezone: formData.location.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData)
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Projet publié avec succès !")
        router.push(`/projects/${data.projectId}`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Erreur lors de la publication")
      }
    } catch (error) {
      toast.error("Erreur lors de la publication")
    } finally {
      setLoading(false)
    }
  }

  const formatBudgetDisplay = (amount: number, currency: string) => {
    return currencyConverter.formatForDisplay(amount, currency, true)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* En-tête */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                Créer un nouveau projet
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Publiez votre projet et trouvez les meilleurs talents
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Devise: {userCurrency}
              </div>
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={loading || !formData.title}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Sauvegarder le brouillon
              </Button>
              
              <Button
                onClick={handlePublish}
                disabled={loading || !validateStep(3)}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Publier le projet
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Étapes */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Étapes de création</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { step: 1, title: "Description", description: "Détails du projet" },
                  { step: 2, title: "Budget & Délai", description: "Financement et timing" },
                  { step: 3, title: "Compétences", description: "Expertise requise" },
                  { step: 4, title: "Options avancées", description: "Paramètres supplémentaires" }
                ].map((item) => (
                  <div
                    key={item.step}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      currentStep === item.step
                        ? "bg-blue-50 border border-blue-200 dark:bg-blue-950/50 dark:border-blue-800"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                    onClick={() => setCurrentStep(item.step)}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      currentStep === item.step
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                    }`}>
                      {currentStep > item.step ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        item.step
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {item.description}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Aide contextuelle */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Conseils
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Budget en Ariary</div>
                    <div className="text-slate-600 dark:text-slate-400">
                      Fixez votre budget en MGA pour attirer les talents locaux
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calculator className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Conversion automatique</div>
                    <div className="text-slate-600 dark:text-slate-400">
                      Les montants sont convertis dans la devise des freelances
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-purple-500 mt-0.5" />
                  <div>
                    <div className="font-medium">TVA Madagascar</div>
                    <div className="text-slate-600 dark:text-slate-400">
                      TVA de {MADAGASCAR_CONFIG.taxes.vat * 100}% appliquée pour les projets en MGA
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                {/* Étape 1: Description du projet */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="title" className="text-base font-semibold">
                        Titre du projet *
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        placeholder="Ex: Développement d'une application React Native"
                        className="mt-2 text-lg"
                      />
                      <div className="text-sm text-slate-500 mt-1">
                        Soyez clair et concis. 60 caractères maximum.
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-base font-semibold">
                        Description détaillée *
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Décrivez en détail votre projet, vos objectifs, les fonctionnalités attendues..."
                        rows={8}
                        className="mt-2"
                      />
                      <div className="text-sm text-slate-500 mt-1">
                        Plus votre description est précise, plus vous attirerez des talents qualifiés.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category" className="text-base font-semibold">
                          Catégorie *
                        </Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => handleInputChange("category", value)}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Sélectionnez une catégorie" />
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
                        <Label htmlFor="subcategory" className="text-base font-semibold">
                          Sous-catégorie
                        </Label>
                        <Select
                          value={formData.subcategory}
                          onValueChange={(value) => handleInputChange("subcategory", value)}
                          disabled={!formData.category}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Sélectionnez une sous-catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories
                              .find(cat => cat.name === formData.category)
                              ?.subcategories.map((subcat) => (
                                <SelectItem key={subcat} value={subcat}>
                                  {subcat}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="country" className="text-base font-semibold">
                          Pays
                        </Label>
                        <Select
                          value={formData.location.country}
                          onValueChange={(value) => 
                            handleInputChange("location", {
                              ...formData.location,
                              country: value
                            })
                          }
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Sélectionnez un pays" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MG">🇲🇬 Madagascar</SelectItem>
                            <SelectItem value="FR">🇫🇷 France</SelectItem>
                            <SelectItem value="US">🇺🇸 États-Unis</SelectItem>
                            <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                            <SelectItem value="SN">🇸🇳 Sénégal</SelectItem>
                            <SelectItem value="CI">🇨🇮 Côte d'Ivoire</SelectItem>
                            <SelectItem value="CM">🇨🇲 Cameroun</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="city" className="text-base font-semibold">
                          Ville (Optionnel)
                        </Label>
                        <Input
                          id="city"
                          value={formData.location.city || ""}
                          onChange={(e) => 
                            handleInputChange("location", {
                              ...formData.location,
                              city: e.target.value
                            })
                          }
                          placeholder="Ex: Antananarivo"
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="remote"
                        checked={formData.location.remote}
                        onCheckedChange={(checked) => 
                          handleInputChange("location", {
                            ...formData.location,
                            remote: checked
                          })
                        }
                      />
                      <Label htmlFor="remote" className="cursor-pointer">
                        Travail à distance accepté
                      </Label>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div className="text-sm text-slate-500">
                        Étape 1 sur 4
                      </div>
                      <Button
                        onClick={() => setCurrentStep(2)}
                        disabled={!validateStep(1)}
                      >
                        Continuer
                      </Button>
                    </div>
                  </div>
                )}

                {/* Étape 2: Budget et délai */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold mb-2 block">
                        Devise du projet
                      </Label>
                      <div className="flex items-center gap-4">
                        <div className="w-64">
                          <CurrencySelector
                            value={formData.budget.currency}
                            onChange={handleCurrencyChange}
                            showFlag={true}
                            showName={true}
                            compact={false}
                          />
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Les freelances verront le montant dans leur devise locale
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-semibold mb-4 block">
                        Type de budget
                      </Label>
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant={formData.budget.type === "fixed" ? "default" : "outline"}
                          onClick={() => handleBudgetChange("type", "fixed")}
                          className="flex-1"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Prix fixe
                        </Button>
                        <Button
                          type="button"
                          variant={formData.budget.type === "hourly" ? "default" : "outline"}
                          onClick={() => handleBudgetChange("type", "hourly")}
                          className="flex-1"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Taux horaire
                        </Button>
                      </div>
                    </div>

                    {formData.budget.type === "hourly" ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="hourlyRate" className="text-base font-semibold">
                            Taux horaire *
                          </Label>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="relative flex-1">
                              <Input
                                id="hourlyRate"
                                type="number"
                                value={formData.budget.min || ""}
                                onChange={(e) => handleBudgetChange("min", Number(e.target.value))}
                                placeholder="0"
                                className="pr-20"
                              />
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm">
                                / heure
                              </div>
                            </div>
                            <div className="text-sm text-slate-600">
                              en {formData.budget.currency}
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="estimatedHours" className="text-base font-semibold">
                            Estimation d'heures
                          </Label>
                          <div className="flex items-center gap-4 mt-2">
                            <Input
                              id="estimatedHours"
                              type="number"
                              value={estimatedHours}
                              onChange={(e) => setEstimatedHours(Number(e.target.value))}
                              placeholder="40"
                              className="w-32"
                            />
                            <div className="text-sm text-slate-600">
                              heures estimées
                            </div>
                          </div>
                          <div className="text-sm text-slate-500 mt-1">
                            Budget total estimé: {formatBudgetDisplay(formData.budget.max, formData.budget.currency)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="budgetMin" className="text-base font-semibold">
                            Budget minimum *
                          </Label>
                          <div className="relative mt-2">
                            <Input
                              id="budgetMin"
                              type="number"
                              value={formData.budget.min || ""}
                              onChange={(e) => handleBudgetChange("min", Number(e.target.value))}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="budgetMax" className="text-base font-semibold">
                            Budget maximum *
                          </Label>
                          <div className="relative mt-2">
                            <Input
                              id="budgetMax"
                              type="number"
                              value={formData.budget.max || ""}
                              onChange={(e) => handleBudgetChange("max", Number(e.target.value))}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {convertedPreview && formData.budget.currency !== userCurrency && (
                      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calculator className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium">
                                Aperçu de la conversion
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowConversion(!showConversion)}
                            >
                              {showConversion ? "Masquer" : "Voir"}
                            </Button>
                          </div>
                          
                          {showConversion && (
                            <div className="mt-3 space-y-2 text-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="text-slate-600">Montant original:</div>
                                <div className="font-medium text-right">
                                  {formData.budget.min > 0 && 
                                    `${formatBudgetDisplay(formData.budget.min, formData.budget.currency)} - ${formatBudgetDisplay(formData.budget.max, formData.budget.currency)}`}
                                </div>
                                
                                <div className="text-slate-600">Taux de change:</div>
                                <div className="font-medium text-right">
                                  1 {formData.budget.currency} ≈ {
                                    formData.budget.min > 0 && Number.isFinite(formData.budget.min)
                                      ? ((): any => {
                                          const numer = (convertedPreview.amounts.hourly ?? convertedPreview.amounts.min)
                                          if (typeof numer !== 'number' || !isFinite(numer)) return '-'
                                          const rateVal = numer / formData.budget.min
                                          return Number.isFinite(rateVal) ? rateVal.toFixed(4) : '-'
                                        })()
                                      : '-'
                                  } {userCurrency}
                                </div>
                                
                                <div className="text-slate-600">Dans votre devise:</div>
                                <div className="font-medium text-right">
                                  {formatBudgetDisplay(convertedPreview.amounts.min, userCurrency)} - {formatBudgetDisplay(convertedPreview.amounts.max, userCurrency)}
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {formData.budget.currency === 'MGA' && formData.budget.min > 0 && (
                      <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">
                              TVA Madagascar ({MADAGASCAR_CONFIG.taxes.vat * 100}%)
                            </span>
                          </div>
                          <div className="text-sm text-slate-600">
                            Une TVA de {MADAGASCAR_CONFIG.taxes.vat * 100}% sera ajoutée au budget final
                            pour les freelances basés à Madagascar.
                          </div>
                          <div className="mt-2 text-sm">
                            <span className="text-slate-500">Montant TVA: </span>
                            <span className="font-medium">
                              {formatBudgetDisplay(formData.budget.max * MADAGASCAR_CONFIG.taxes.vat, 'MGA')}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div>
                      <Label htmlFor="deadline" className="text-base font-semibold">
                        Date limite *
                      </Label>
                      <div className="relative mt-2">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="deadline"
                          type="date"
                          value={formData.deadline}
                          onChange={(e) => handleInputChange("deadline", e.target.value)}
                          className="pl-10"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-base font-semibold">
                          Jalons de paiement (Optionnel)
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addMilestone}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter un jalon
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {formData.milestones.map((milestone, index) => (
                          <div key={index} className="flex gap-4 items-start p-4 border rounded-lg">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Titre du jalon</Label>
                                <Input
                                  value={milestone.title}
                                  onChange={(e) => updateMilestone(index, "title", e.target.value)}
                                  placeholder="Ex: Maquettes finalisées"
                                />
                              </div>
                              <div>
                                <Label>Montant</Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    value={milestone.amount}
                                    onChange={(e) => updateMilestone(index, "amount", Number(e.target.value))}
                                    placeholder="0"
                                    className="flex-1"
                                  />
                                  <div className="text-sm text-slate-600 flex items-center px-2 border rounded">
                                    {milestone.currency}
                                  </div>
                                </div>
                              </div>
                              <div className="md:col-span-2">
                                <Label>Date d'échéance</Label>
                                <Input
                                  type="date"
                                  value={milestone.dueDate}
                                  onChange={(e) => updateMilestone(index, "dueDate", e.target.value)}
                                  min={new Date().toISOString().split('T')[0]}
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label>Description</Label>
                                <Textarea
                                  value={milestone.description}
                                  onChange={(e) => updateMilestone(index, "description", e.target.value)}
                                  placeholder="Description des livrables attendus pour ce jalon..."
                                  rows={2}
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMilestone(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                      >
                        Retour
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(3)}
                        disabled={!validateStep(2)}
                      >
                        Continuer
                      </Button>
                    </div>
                  </div>
                )}

                {/* Étape 3: Compétences requises */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold mb-4 block">
                        Compétences requises *
                      </Label>
                      
                      <div className="flex gap-2 mb-4">
                        <Input
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          placeholder="Rechercher ou ajouter une compétence..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addSkill(skillInput)
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={() => addSkill(skillInput)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {formData.skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="px-3 py-1 text-sm"
                          >
                            {skill}
                            <button
                              onClick={() => removeSkill(skill)}
                              className="ml-2 hover:text-red-500"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-3 block">
                          Compétences populaires
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {popularSkills.slice(0, 15).map((skill) => (
                            <Badge
                              key={skill.skill}
                              variant="outline"
                              className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                              onClick={() => addSkill(skill.skill)}
                            >
                              {skill.skill}
                              <span className="text-xs text-slate-500 ml-1">
                                ({skill.count})
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-semibold mb-4 block">
                        Tags (Optionnel)
                      </Label>
                      
                      <div className="flex gap-2 mb-4">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="Ajouter des tags..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addTag()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addTag}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="px-2 py-1 text-xs"
                          >
                            #{tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-red-500"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                      >
                        Retour
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(4)}
                        disabled={!validateStep(3)}
                      >
                        Continuer
                      </Button>
                    </div>
                  </div>
                )}

                {/* Étape 4: Options avancées */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold mb-4 block">
                        Visibilité du projet
                      </Label>
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant={formData.visibility === "public" ? "default" : "outline"}
                          onClick={() => handleInputChange("visibility", "public")}
                          className="flex-1 flex flex-col items-center justify-center h-auto py-4"
                        >
                          <Users className="h-4 w-4 mb-2" />
                          <span>Public</span>
                          <span className="text-xs opacity-70 mt-1 text-center">
                            Visible par tous les freelances
                          </span>
                        </Button>
                        <Button
                          type="button"
                          variant={formData.visibility === "private" ? "default" : "outline"}
                          onClick={() => handleInputChange("visibility", "private")}
                          className="flex-1 flex flex-col items-center justify-center h-auto py-4"
                        >
                          <FileText className="h-4 w-4 mb-2" />
                          <span>Privé</span>
                          <span className="text-xs opacity-70 mt-1 text-center">
                            Invitation uniquement
                          </span>
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-semibold mb-4 block">
                        Fichiers joints (Optionnel)
                      </Label>
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center">
                        <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <div className="font-medium mb-2">
                          Glissez-déposez vos fichiers ici
                        </div>
                        <div className="text-sm text-slate-500 mb-4">
                          ou cliquez pour parcourir
                        </div>
                        <Button variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Choisir des fichiers
                        </Button>
                      </div>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Récapitulatif du projet</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-slate-500">Titre</div>
                            <div>{formData.title || "Non spécifié"}</div>
                          </div>
                          <div>
                            <div className="font-medium text-slate-500">Catégorie</div>
                            <div>{formData.category || "Non spécifié"}</div>
                          </div>
                          <div>
                            <div className="font-medium text-slate-500">Devise</div>
                            <div className="flex items-center gap-2">
                              <span>{formData.budget.currency}</span>
                              {formData.budget.currency === 'MGA' && (
                                <Badge variant="outline" className="text-xs">
                                  🇲🇬 Madagascar
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-slate-500">Budget</div>
                            <div>
                              {formData.budget.min > 0 ? 
                                `${formatBudgetDisplay(formData.budget.min, formData.budget.currency)} - ${formatBudgetDisplay(formData.budget.max, formData.budget.currency)} (${formData.budget.type})` 
                                : "Non spécifié"}
                              {convertedPreview && (
                                <div className="text-xs text-slate-500 mt-1">
                                  ≈ {formatBudgetDisplay(convertedPreview.amounts.min, userCurrency)} - {formatBudgetDisplay(convertedPreview.amounts.max, userCurrency)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-slate-500">Date limite</div>
                            <div>{formData.deadline ? new Date(formData.deadline).toLocaleDateString() : "Non spécifié"}</div>
                          </div>
                          <div>
                            <div className="font-medium text-slate-500">Localisation</div>
                            <div>
                              {formData.location.country ? 
                                `${formData.location.country}${formData.location.city ? `, ${formData.location.city}` : ''}`
                                : "Non spécifié"}
                              {formData.location.remote && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Remote
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="font-medium text-slate-500">Compétences</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {formData.skills.map(skill => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex items-center justify-between pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(3)}
                      >
                        Retour
                      </Button>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={handleSaveDraft}
                          disabled={loading || !formData.title}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Sauvegarder le brouillon
                        </Button>
                        <Button
                          onClick={handlePublish}
       
disabled={loading || !validateStep(3)}
>
<Send className="h-4 w-4 mr-2" />
Publier le projet
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