// app/[lang]/gigs/create/page.tsx
'use client'

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { 
  Plus, X, ArrowLeft, Zap, ChevronRight, ChevronLeft, Upload, 
  Image as ImageIcon, Star, Clock, RotateCcw, Eye, EyeOff,
  Loader2, CheckCircle2, AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { CreateGigInput } from "@/types/gig"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { cn } from "@/lib/utils"

interface Category {
  _id: string
  name: string
  count: number
  subcategories: string[]
  icon?: string
  description?: string
}

interface Skill {
  _id: string
  skill: string
  count: number
  avgBudget: number
  category?: string
}

export default function CreateGigPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const lang = params.lang as Locale
  
  const [dict, setDict] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [popularSkills, setPopularSkills] = useState<Skill[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isPremium, setIsPremium] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<CreateGigInput>({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    tags: [],
    price: 50,
    deliveryTime: 7,
    revisions: 1,
    features: [""],
    requirements: [""],
    images: []
  })
  
  const [tagInput, setTagInput] = useState("")
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([])

  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  // Définir les étapes avec le dictionnaire
  const STEPS = dict ? [
    { id: 'basic', title: dict.gigs?.steps?.basic || 'Informations de base', description: dict.gigs?.steps?.basicDesc || 'Décrivez votre service' },
    { id: 'pricing', title: dict.gigs?.steps?.pricing || 'Prix et délais', description: dict.gigs?.steps?.pricingDesc || 'Définissez votre tarification' },
    { id: 'gallery', title: dict.gigs?.steps?.gallery || 'Galerie d\'images', description: dict.gigs?.steps?.galleryDesc || 'Ajoutez des images à votre service' },
    { id: 'features', title: dict.gigs?.steps?.features || 'Ce qui est inclus', description: dict.gigs?.steps?.featuresDesc || 'Listez les fonctionnalités' },
    { id: 'requirements', title: dict.gigs?.steps?.requirements || 'Prérequis', description: dict.gigs?.steps?.requirementsDesc || 'Informations nécessaires' },
    { id: 'review', title: dict.gigs?.steps?.review || 'Vérification', description: dict.gigs?.steps?.reviewDesc || 'Vérifiez votre service' }
  ] : []

  // Remove image from the form data
  const removeImage = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      images: prev.images.filter((_: any, i: any) => i !== index)
    }))
    toast.success(dict?.common?.imageDeleted || "Image supprimée")
  }

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true)
        const response = await fetch('/api/projects/categories')
        
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories || [])
          setPopularSkills(data.popularSkills || [])
        } else {
          console.error('Failed to fetch categories')
          toast.error(dict?.gigs_create?.errors?.loadCategories || "Erreur lors du chargement des catégories")
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        toast.error(dict?.gigs_create?.errors?.loadCategories || "Erreur lors du chargement des catégories")
      } finally {
        setCategoriesLoading(false)
      }
    }

    if (dict) {
      fetchCategories()
    }
  }, [dict])

  // Update suggested skills when category changes
  useEffect(() => {
    if (formData.category && popularSkills.length > 0) {
      const categorySkills = popularSkills
        .filter(skill => skill.category === formData.category)
        .sort((a, b) => b.count - a.count)
        .map(skill => skill.skill)
        .slice(0, 10)
      setSuggestedSkills(categorySkills)
    } else {
      setSuggestedSkills([])
    }
  }, [formData.category, popularSkills])

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Informations de base
        if (!formData.title.trim()) {
          toast.error(dict?.gigs_create?.errors?.titleRequired || "Le titre est requis")
          return false
        }
        if (formData.title.length < 10) {
          toast.error(dict?.gigs_create?.errors?.titleMinLength || "Le titre doit contenir au moins 10 caractères")
          return false
        }
        if (!formData.description.trim()) {
          toast.error(dict?.gigs_create?.errors?.descriptionRequired || "La description est requise")
          return false
        }
        if (formData.description.length < 50) {
          toast.error(dict?.gigs_create?.errors?.descriptionMinLength || "La description doit contenir au moins 50 caractères")
          return false
        }
        if (!formData.category) {
          toast.error(dict?.gigs_create?.errors?.categoryRequired || "La catégorie est requise")
          return false
        }
        return true

      case 1: // Prix et délais
        if (formData.price < 5) {
          toast.error(dict?.gigs_create?.errors?.priceMin || "Le prix minimum est de 5€")
          return false
        }
        if (formData.deliveryTime < 1) {
          toast.error(dict?.gigs_create?.errors?.deliveryTimeMin || "Le délai de livraison doit être d'au moins 1 jour")
          return false
        }
        return true

      case 2: // Galerie d'images
        if (formData.images.length === 0) {
          toast.error(dict?.gigs_create?.errors?.imagesRequired || "Ajoutez au moins une image à votre service")
          return false
        }
        return true

      case 3: // Fonctionnalités
        if (formData.features.filter(f => f.trim()).length === 0) {
          toast.error(dict?.gigs_create?.errors?.featuresRequired || "Ajoutez au moins une fonctionnalité")
          return false
        }
        return true

      default:
        return true
    }
  }

  // Enhanced file upload with Cloudinary
  const handleFileUpload = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    )

    if (validFiles.length === 0) {
      toast.error(dict?.gigs_create?.errors?.invalidImages || "Veuillez sélectionner des images valides (max 5MB par image)")
      return
    }

    if (validFiles.length + formData.images.length > 10) {
      toast.error(dict?.gigs_create?.errors?.maxImages || "Maximum 10 images autorisées")
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const totalFiles = validFiles.length
      let completedFiles = 0

      for (const file of validFiles) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'gigs')

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (uploadResponse.ok) {
          const data = await uploadResponse.json()
          setFormData((prev: any) => ({
            ...prev,
            images: [...prev.images, { 
              url: data.url, 
              publicId: data.publicId,
              thumbnail: data.thumbnail 
            }]
          }))
          completedFiles++
          setUploadProgress((completedFiles / totalFiles) * 100)
        } else {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || `Failed to upload ${file.name}`)
        }
      }
      
      toast.success(dict?.gigs_create?.success?.imagesUploaded?.replace('{count}', validFiles.length.toString()) || 
        `${validFiles.length} image(s) téléchargée(s) avec succès`)
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error((error as any).message || dict?.gigs_create?.errors?.uploadFailed || "Erreur lors du téléchargement des images")
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      toast.error(dict?.gigs_create?.errors?.loginRequired || "Veuillez vous connecter pour créer un service")
      router.push(`/${lang}/auth/signin`)
      return
    }

    if (!validateCurrentStep()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/gigs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          features: formData.features.filter(f => f.trim() !== ""),
          requirements: formData.requirements.filter(r => r.trim() !== ""),
          isPremium,
          isPrivate,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(dict?.gigs_create?.success?.created || "Service créé avec succès!")
        router.push(`/${lang}/gigs/${data.gig._id}`)
      } else {
        throw new Error(data.error || dict?.gigs_create?.errors?.creationFailed || "Erreur lors de la création")
      }
    } catch (error) {
      console.error("Error creating gig:", error)
      toast.error(dict?.gigs_create?.errors?.creationFailed || "Erreur lors de la création du service")
    } finally {
      setLoading(false)
    }
  }

  // Character counters
  const titleLength = formData.title.length
  const descriptionLength = formData.description.length

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
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

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ""]
    }))
  }

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }))
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, ""]
    }))
  }

  const updateRequirement = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((r, i) => i === index ? value : r)
    }))
  }

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }

  const getCurrentCategorySubcategories = () => {
    const currentCategory = categories.find(cat => cat.name === formData.category)
    return currentCategory?.subcategories || []
  }

  // Calculate completion percentage
  const completionPercentage = STEPS.length > 0 ? Math.round((currentStep / (STEPS.length - 1)) * 100) : 0

  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            {dict?.gigs_create?.loginRequired || "Connexion requise"}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {dict?.gigs_create?.loginRequiredDesc || "Vous devez être connecté pour créer un service"}
          </p>
          <Button onClick={() => router.push(`/${lang}/auth/signin`)}>
            {dict?.common?.signin || "Se connecter"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/${lang}/gigs`)}
            className="mb-4 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {dict?.common?.back || "Retour"} {dict?.gigs_create?.toGigs || "aux services"}
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                {dict?.gigs_create?.createTitle || "Créer un nouveau service"}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {dict?.gigs_create?.createSubtitle || "Remplissez les informations ci-dessous pour proposer votre service"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                {dict?.common?.progress || "Progression"}: {completionPercentage}%
              </div>
              <Progress value={completionPercentage} className="w-32 h-2" />
            </div>
          </div>
        </div>

        {/* Enhanced Progress Steps */}
        {STEPS.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 overflow-x-auto pb-2">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1 min-w-[80px]">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-300",
                      index === currentStep
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : index < currentStep
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    )}>
                      {index < currentStep ? <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" /> : index + 1}
                    </div>
                    <span className={cn(
                      "text-[10px] sm:text-xs mt-2 text-center font-medium",
                      index === currentStep
                        ? 'text-blue-600 dark:text-blue-400'
                        : index < currentStep
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-slate-500'
                    )}>
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 sm:h-1 mx-1 sm:mx-2 transition-all duration-300",
                      index < currentStep ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Étape 1: Informations de base - Enhanced */}
            {currentStep === 0 && (
              <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                      1
                    </div>
                    {STEPS[0]?.title}
                  </CardTitle>
                  <CardDescription>{STEPS[0]?.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <Label htmlFor="title" className="flex items-center gap-2 mb-2">
                      {dict?.gigs_create?.title || "Titre du service"} *
                      {titleLength > 0 && (
                        <span className={`text-xs ${titleLength < 10 ? 'text-red-500' : 'text-green-500'}`}>
                          ({titleLength}/10+)
                        </span>
                      )}
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder={dict?.gigs_create?.titlePlaceholder || "Ex: Création de site web WordPress professionnel avec design responsive"}
                      className="h-12 text-base sm:text-lg"
                      required
                    />
                    {titleLength > 0 && titleLength < 10 && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {dict?.gigs_create?.errors?.titleMinLength || "Le titre doit contenir au moins 10 caractères"}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description" className="flex items-center gap-2 mb-2">
                      {dict?.gigs_create?.description || "Description détaillée"} *
                      {descriptionLength > 0 && (
                        <span className={`text-xs ${descriptionLength < 50 ? 'text-red-500' : 'text-green-500'}`}>
                          ({descriptionLength}/50+)
                        </span>
                      )}
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={dict?.gigs_create?.descriptionPlaceholder || "Décrivez en détail ce que vous proposez, vos compétences, votre expérience, les bénéfices pour le client..."}
                      rows={8}
                      className="resize-none"
                      required
                    />
                    {descriptionLength > 0 && descriptionLength < 50 && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {dict?.gigs_create?.errors?.descriptionMinLength || "La description doit contenir au moins 50 caractères"}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="category" className="mb-2">{dict?.gigs_create?.category || "Catégorie"} *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, subcategory: "" }))}
                        disabled={categoriesLoading}
                      >
                        <SelectTrigger className="h-12">
                          {categoriesLoading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>{dict?.common?.loading || "Chargement..."}</span>
                            </div>
                          ) : (
                            <SelectValue placeholder={dict?.gigs_create?.selectCategory || "Sélectionnez une catégorie"} />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category._id} value={category.name}>
                              <div className="flex items-center justify-between w-full">
                                <span>{category.name}</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {category.count}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="subcategory" className="mb-2">{dict?.gigs_create?.subcategory || "Sous-catégorie"}</Label>
                      <Select
                        value={formData.subcategory}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}
                        disabled={!formData.category || categoriesLoading}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={dict?.gigs_create?.selectSubcategory || "Sélectionnez une sous-catégorie"} />
                        </SelectTrigger>
                        <SelectContent>
                          {getCurrentCategorySubcategories().map((subcat) => (
                            <SelectItem key={subcat} value={subcat}>
                              {subcat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tags" className="mb-2">{dict?.gigs_create?.keywords || "Mots-clés"}</Label>
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          placeholder={dict?.gigs_create?.addKeyword || "Ajouter un mot-clé (Appuyez sur Entrée)"}
                          list="skill-suggestions"
                          className="flex-1"
                        />
                        <datalist id="skill-suggestions">
                          {suggestedSkills.map((skill) => (
                            <option key={skill} value={skill} />
                          ))}
                        </datalist>
                        <Button type="button" onClick={addTag} className="whitespace-nowrap">
                          <Plus className="h-4 w-4 mr-1" />
                          {dict?.common?.add || "Ajouter"}
                        </Button>
                      </div>
                      
                      {suggestedSkills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-500 mr-2">{dict?.gigs_create?.suggestions || "Suggestions"}:</span>
                          {suggestedSkills.map((skill) => (
                            <Badge 
                              key={skill} 
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 transition-colors"
                              onClick={() => {
                                if (!formData.tags.includes(skill)) {
                                  setFormData(prev => ({
                                    ...prev,
                                    tags: [...prev.tags, skill]
                                  }))
                                }
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1 pl-3 pr-2 py-1 text-xs sm:text-sm">
                              {tag}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-red-600 transition-colors"
                                onClick={() => removeTag(tag)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Étape 2: Prix et délais - Enhanced */}
            {currentStep === 1 && (
              <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                      2
                    </div>
                    {STEPS[1]?.title}
                  </CardTitle>
                  <CardDescription>{STEPS[1]?.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="price" className="flex items-center gap-2 mb-2">
                        <span>{dict?.gigs_create?.basePrice || "Prix de base"} (€) *</span>
                        <Badge variant="outline" className="text-xs">
                          {dict?.gigs_create?.minimum || "Minimum"}: 5€
                        </Badge>
                      </Label>
                      <div className="relative">
                        <Input
                          id="price"
                          type="number"
                          min="5"
                          max="10000"
                          step="5"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                          className="h-12 text-base sm:text-lg pl-8"
                          required
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">€</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-2">
                        <span>{dict?.gigs_create?.economical || "Économique"}</span>
                        <span>{dict?.gigs_create?.standard || "Standard"}</span>
                        <span>{dict?.gigs_create?.premium || "Premium"}</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="500"
                        step="5"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600"
                      />
                    </div>

                    <div>
                      <Label htmlFor="deliveryTime" className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4" />
                        {dict?.gigs_create?.deliveryTime || "Délai de livraison"} ({dict?.gigs_create?.days || "jours"}) *
                      </Label>
                      <div className="relative">
                        <Input
                          id="deliveryTime"
                          type="number"
                          min="1"
                          max="365"
                          value={formData.deliveryTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, deliveryTime: parseInt(e.target.value) || 1 }))}
                          className="h-12 text-base sm:text-lg pl-12"
                          required
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="revisions" className="flex items-center gap-2 mb-2">
                      <RotateCcw className="h-4 w-4" />
                      {dict?.gigs_create?.revisions || "Nombre de révisions incluses"} *
                    </Label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <Input
                        id="revisions"
                        type="number"
                        min="0"
                        max="10"
                        value={formData.revisions}
                        onChange={(e) => setFormData(prev => ({ ...prev, revisions: parseInt(e.target.value) || 0 }))}
                        className="h-12 text-base sm:text-lg w-24"
                        required
                      />
                      <div className="flex-1 text-sm text-slate-600 dark:text-slate-400">
                        {formData.revisions === 0 ? (
                          dict?.gigs_create?.noRevisions || "Aucune révision incluse"
                        ) : formData.revisions === 1 ? (
                          dict?.gigs_create?.oneRevision || "1 révision incluse"
                        ) : (
                          dict?.gigs_create?.revisionsCount?.replace('{count}', formData.revisions.toString()) || 
                          `${formData.revisions} révisions incluses`
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="space-y-1">
                        <Label htmlFor="premium" className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          {dict?.gigs_create?.premiumService || "Service Premium"}
                        </Label>
                        <p className="text-xs text-slate-500">
                          {dict?.gigs_create?.premiumDesc || "Mettez en avant votre service"}
                        </p>
                      </div>
                      <Switch
                        id="premium"
                        checked={isPremium}
                        onCheckedChange={setIsPremium}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="space-y-1">
                        <Label htmlFor="private" className="flex items-center gap-2">
                          {isPrivate ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {dict?.gigs_create?.privateService || "Service Privé"}
                        </Label>
                        <p className="text-xs text-slate-500">
                          {dict?.gigs_create?.privateDesc || "Visible uniquement sur invitation"}
                        </p>
                      </div>
                      <Switch
                        id="private"
                        checked={isPrivate}
                        onCheckedChange={setIsPrivate}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Étape 3: Galerie d'images - Enhanced avec Cloudinary */}
            {currentStep === 2 && (
              <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                      3
                    </div>
                    {STEPS[2]?.title}
                  </CardTitle>
                  <CardDescription>{STEPS[2]?.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Enhanced Upload Zone */}
                  <div 
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-300"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    />
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {dict?.gigs_create?.dragDrop || "Glissez-déposez vos images ici"}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {dict?.gigs_create?.clickToSelect || "ou cliquez pour sélectionner des fichiers"}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                          PNG, JPG, JPEG - 5MB max - 10 images maximum
                        </p>
                      </div>
                      <Button type="button" variant="outline" className="border-2">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {dict?.gigs_create?.selectImages || "Sélectionner des images"}
                      </Button>
                    </div>
                  </div>

                  {/* Enhanced Upload Progress */}
                  {uploading && (
                    <div className="text-center space-y-3">
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {dict?.common?.uploading || "Téléchargement en cours..."}
                        </span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-slate-500">
                        {Math.round(uploadProgress)}% {dict?.common?.completed || "complété"}
                      </p>
                    </div>
                  )}

                  {/* Enhanced Image Gallery Preview with Cloudinary */}
                  {formData.images.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <Label className="text-sm font-semibold">
                          {dict?.gigs_create?.uploadedImages || "Images téléchargées"} ({formData.images.length}/10)
                        </Label>
                        {formData.images.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(dict?.gigs_create?.confirmDeleteAll || 'Êtes-vous sûr de vouloir supprimer toutes les images ?')) {
                                setFormData((prev: any) => ({ ...prev, images: [] }))
                                toast.success(dict?.common?.allDeleted || "Toutes les images ont été supprimées")
                              }
                            }}
                            className="text-red-600 border-red-300 hover:bg-red-50 text-xs w-full sm:w-auto"
                          >
                            <X className="h-3 w-3 mr-1" />
                            {dict?.common?.deleteAll || "Tout supprimer"}
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {formData.images.map((image: any, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image.thumbnail || image.url}
                              alt={`Preview ${index + 1}`}
                              className="w-full aspect-square object-cover rounded-lg border-2 border-slate-200 dark:border-slate-700 group-hover:border-blue-400 transition-all duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="bg-red-500 text-white rounded-full p-1.5 sm:p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 transform hover:scale-110 shadow-lg"
                                title={dict?.common?.delete || "Supprimer l'image"}
                              >
                                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                              </button>
                            </div>
                            <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black bg-opacity-50 text-white text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Étape 4: Fonctionnalités */}
            {currentStep === 3 && (
              <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                      4
                    </div>
                    {STEPS[3]?.title}
                  </CardTitle>
                  <CardDescription>{STEPS[3]?.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder={`${dict?.gigs_create?.feature || "Fonctionnalité"} ${index + 1}`}
                        className="flex-1"
                      />
                      {formData.features.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeFeature(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addFeature} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    {dict?.gigs_create?.addFeature || "Ajouter une fonctionnalité"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Étape 5: Prérequis */}
            {currentStep === 4 && (
              <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                      5
                    </div>
                    {STEPS[4]?.title}
                  </CardTitle>
                  <CardDescription>{STEPS[4]?.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {formData.requirements.map((requirement, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={requirement}
                        onChange={(e) => updateRequirement(index, e.target.value)}
                        placeholder={`${dict?.gigs_create?.requirement || "Prérequis"} ${index + 1}`}
                        className="flex-1"
                      />
                      {formData.requirements.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeRequirement(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addRequirement} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    {dict?.gigs_create?.addRequirement || "Ajouter un prérequis"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Étape 6: Vérification */}
            {currentStep === 5 && (
              <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                      6
                    </div>
                    {STEPS[5]?.title}
                  </CardTitle>
                  <CardDescription>{STEPS[5]?.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <Label className="text-sm font-semibold text-slate-500">{dict?.gigs_create?.title || "Titre"}</Label>
                      <p className="text-slate-900 dark:text-slate-100 mt-1">{formData.title}</p>
                    </div>
                    
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <Label className="text-sm font-semibold text-slate-500">{dict?.gigs_create?.category || "Catégorie"}</Label>
                      <p className="text-slate-900 dark:text-slate-100 mt-1">
                        {formData.category} {formData.subcategory && `> ${formData.subcategory}`}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <Label className="text-sm font-semibold text-slate-500">{dict?.gigs_create?.price || "Prix"}</Label>
                        <p className="text-slate-900 dark:text-slate-100 mt-1 text-lg font-bold">{formData.price}€</p>
                      </div>
                      
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <Label className="text-sm font-semibold text-slate-500">{dict?.gigs_create?.deliveryTime || "Délai"}</Label>
                        <p className="text-slate-900 dark:text-slate-100 mt-1">
                          {formData.deliveryTime} {dict?.gigs_create?.days || "jours"}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <Label className="text-sm font-semibold text-slate-500 mb-2 block">{dict?.gigs_create?.features || "Fonctionnalités"}</Label>
                      <ul className="list-disc list-inside space-y-1">
                        {formData.features.filter(f => f.trim()).map((feature, index) => (
                          <li key={index} className="text-slate-700 dark:text-slate-300">{feature}</li>
                        ))}
                      </ul>
                    </div>

                    {formData.images.length > 0 && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <Label className="text-sm font-semibold text-slate-500 mb-2 block">{dict?.gigs_create?.images || "Images"}</Label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {formData.images.slice(0, 6).map((image: any, index) => (
                            <img
                              key={index}
                              src={image.thumbnail || image.url}
                              alt={`Preview ${index + 1}`}
                              className="w-full aspect-square object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                            />
                          ))}
                          {formData.images.length > 6 && (
                            <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg aspect-square">
                              <span className="text-sm font-medium">+{formData.images.length - 6}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Navigation */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0 || loading}
                className="flex items-center justify-center gap-2 border-2 w-full sm:w-auto order-2 sm:order-1"
              >
                <ChevronLeft className="h-4 w-4" />
                {dict?.common?.previous || "Précédent"}
              </Button>

              {currentStep < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 w-full sm:w-auto order-1 sm:order-2"
                >
                  {dict?.common?.next || "Suivant"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/25 w-full sm:w-auto order-1 sm:order-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {dict?.common?.creating || "Création en cours..."}
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      {dict?.gigs_create?.publish || "Publier le service"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}