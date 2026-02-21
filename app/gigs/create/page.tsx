"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
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

const STEPS = [
  { id: 'basic', title: 'Informations de base', description: 'Décrivez votre service' },
  { id: 'pricing', title: 'Prix et délais', description: 'Définissez votre tarification' },
  { id: 'gallery', title: 'Galerie d\'images', description: 'Ajoutez des images à votre service' },
  { id: 'features', title: 'Ce qui est inclus', description: 'Listez les fonctionnalités' },
  { id: 'requirements', title: 'Prérequis', description: 'Informations nécessaires' },
  { id: 'review', title: 'Vérification', description: 'Vérifiez votre service' }
]

export default function CreateGigPage() {
  const { data: session } = useSession()
  const router = useRouter()
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
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
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
  const [forceUpdate, setForceUpdate] = useState(0);
  const [tagInput, setTagInput] = useState("")
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([])

  // Remove image from the form data
  const removeImage = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      images: prev.images.filter((_: any, i: any) => i !== index)
    }))
    toast.success("Image supprimée")
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
          toast.error("Erreur lors du chargement des catégories")
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        toast.error("Erreur lors du chargement des catégories")
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [])

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
          toast.error("Le titre est requis")
          return false
        }
        if (formData.title.length < 10) {
          toast.error("Le titre doit contenir au moins 10 caractères")
          return false
        }
        if (!formData.description.trim()) {
          toast.error("La description est requise")
          return false
        }
        if (formData.description.length < 50) {
          toast.error("La description doit contenir au moins 50 caractères")
          return false
        }
        if (!formData.category) {
          toast.error("La catégorie est requise")
          return false
        }
        return true

      case 1: // Prix et délais
        if (formData.price < 5) {
          toast.error("Le prix minimum est de 5€")
          return false
        }
        if (formData.deliveryTime < 1) {
          toast.error("Le délai de livraison doit être d'au moins 1 jour")
          return false
        }
        return true

      case 2: // Galerie d'images
        if (formData.images.length === 0) {
          toast.error("Ajoutez au moins une image à votre service")
          return false
        }
        return true

      case 3: // Fonctionnalités
        if (formData.requirements.filter(f => f.trim()).length === 0) {
          toast.error("Ajoutez au moins une fonctionnalité")
          return false
        }
        return true

      default:
        return true
    }
  }

  // Enhanced file upload with progress
  const handleFileUpload = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    )

    if (validFiles.length === 0) {
      toast.error("Veuillez sélectionner des images valides (max 5MB par image)")
      return
    }

    if (validFiles.length + formData.images.length > 10) {
      toast.error("Maximum 10 images autorisées")
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

        const uploadResponse = await fetch('/api/gigs/upload', {
          method: 'POST',
          body: formData,
        })

        if (uploadResponse.ok) {
          const data = await uploadResponse.json()
          setFormData((prev: any) => ({
            ...prev,
            images: [...prev.images, { url: data.url, publicId: data.publicId }]
          }))
          completedFiles++
          setUploadProgress((completedFiles / totalFiles) * 100)
          setForceUpdate(prev => prev + 1);
        } else {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || `Failed to upload ${file.name}`)
        }
      }
      
      toast.success(`${validFiles.length} image(s) téléchargée(s) avec succès`)
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error((error as any).message || "Erreur lors du téléchargement des images")
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
      toast.error("Veuillez vous connecter pour créer un service")
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
        toast.success("Service créé avec succès!")
        // Redirect to the new gig page
        router.push(`/gigs/${data.gig._id}`)
      } else {
        throw new Error(data.error || "Erreur lors de la création")
      }
    } catch (error) {
      console.error("Error creating gig:", error)
      toast.error("Erreur lors de la création du service")
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
  const completionPercentage = Math.round(
    (currentStep / (STEPS.length - 1)) * 100
  )

// Version SIMPLIFIÉE qui force l'affichage
const SimpleImageDisplay = ({ image, index, onRemove }: { 
  image: any; 
  index: number; 
  onRemove: () => void;
}) => {
  const [showImage, setShowImage] = useState(true);

  console.log('SimpleImageDisplay:', image.url);

  return (
    <div className="relative group" key={`${image.publicId}-${Date.now()}`}>
      {/* TOUJOURS afficher l'image directement */}
      <div className="w-full h-32 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
        <img
          src={image.url}
          alt={`Preview ${index + 1}`}
          className="w-full h-full object-cover"
          onLoad={() => console.log('✅ Image visible:', image.url)}
          onError={(e) => {
            console.error('❌ Image error:', image.url);
            // Masquer en cas d'erreur après 3 secondes
            setTimeout(() => setShowImage(false), 3000);
          }}
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
        <button
          type="button"
          onClick={onRemove}
          className="bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 transform hover:scale-110 shadow-lg"
          title="Supprimer l'image"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Numéro */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
        {index + 1}
      </div>
    </div>
  );
};

// Utilisation SIMPLIFIÉE dans votre JSX :

// Utilisation




  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Connexion requise
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Vous devez être connecté pour créer un service
          </p>
          <Button onClick={() => router.push('/auth/signin')}>
            Se connecter
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
            onClick={() => router.push('/gigs')}
            className="mb-4 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux services
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Créer un nouveau service
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Remplissez les informations ci-dessous pour proposer votre service
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                Progression: {completionPercentage}%
              </div>
              <Progress value={completionPercentage} className="w-32 h-2" />
            </div>
          </div>
        </div>

        {/* Enhanced Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    index === currentStep
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : index < currentStep
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {index < currentStep ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                  </div>
                  <span className={`text-xs mt-2 text-center font-medium ${
                    index === currentStep
                      ? 'text-blue-600 dark:text-blue-400'
                      : index < currentStep
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-slate-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 transition-all duration-300 ${
                    index < currentStep ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

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
                    {STEPS[0].title}
                  </CardTitle>
                  <CardDescription>{STEPS[0].description}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <Label htmlFor="title" className="flex items-center gap-2 mb-2">
                      Titre du service *
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
                      placeholder="Ex: Création de site web WordPress professionnel avec design responsive"
                      className="h-12 text-lg"
                      required
                    />
                    {titleLength > 0 && titleLength < 10 && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Le titre doit contenir au moins 10 caractères
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description" className="flex items-center gap-2 mb-2">
                      Description détaillée *
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
                      placeholder="Décrivez en détail ce que vous proposez, vos compétences, votre expérience, les bénéfices pour le client..."
                      rows={8}
                      className="resize-none"
                      required
                    />
                    {descriptionLength > 0 && descriptionLength < 50 && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        La description doit contenir au moins 50 caractères
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="category" className="mb-2">Catégorie *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, subcategory: "" }))}
                        disabled={categoriesLoading}
                      >
                        <SelectTrigger className="h-12">
                          {categoriesLoading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Chargement...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Sélectionnez une catégorie" />
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
                      <Label htmlFor="subcategory" className="mb-2">Sous-catégorie</Label>
                      <Select
                        value={formData.subcategory}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}
                        disabled={!formData.category || categoriesLoading}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Sélectionnez une sous-catégorie" />
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
                    <Label htmlFor="tags" className="mb-2">Mots-clés</Label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          placeholder="Ajouter un mot-clé (Appuyez sur Entrée)"
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
                          Ajouter
                        </Button>
                      </div>
                      
                      {suggestedSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-slate-500 mr-2">Suggestions :</span>
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
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1 pl-3 pr-2 py-1">
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
                    {STEPS[1].title}
                  </CardTitle>
                  <CardDescription>{STEPS[1].description}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="price" className="flex items-center gap-2 mb-2">
                        <span>Prix de base (€) *</span>
                        <Badge variant="outline" className="text-xs">
                          Minimum: 5€
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
                          className="h-12 text-lg pl-8"
                          required
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">€</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-2">
                        <span>Économique</span>
                        <span>Standard</span>
                        <span>Premium</span>
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
                        Délai de livraison (jours) *
                      </Label>
                      <div className="relative">
                        <Input
                          id="deliveryTime"
                          type="number"
                          min="1"
                          max="365"
                          value={formData.deliveryTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, deliveryTime: parseInt(e.target.value) || 1 }))}
                          className="h-12 text-lg pl-12"
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
                      Nombre de révisions incluses *
                    </Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="revisions"
                        type="number"
                        min="0"
                        max="10"
                        value={formData.revisions}
                        onChange={(e) => setFormData(prev => ({ ...prev, revisions: parseInt(e.target.value) || 0 }))}
                        className="h-12 text-lg w-24"
                        required
                      />
                      <div className="flex-1 text-sm text-slate-600 dark:text-slate-400">
                        {formData.revisions === 0 ? (
                          "Aucune révision incluse"
                        ) : formData.revisions === 1 ? (
                          "1 révision incluse"
                        ) : (
                          `${formData.revisions} révisions incluses`
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="space-y-1">
                        <Label htmlFor="premium" className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          Service Premium
                        </Label>
                        <p className="text-xs text-slate-500">
                          Mettez en avant votre service
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
                          Service Privé
                        </Label>
                        <p className="text-xs text-slate-500">
                          Visible uniquement sur invitation
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

            {/* Étape 3: Galerie d'images - Enhanced */}
            {currentStep === 2 && (
              <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                      3
                    </div>
                    {STEPS[2].title}
                  </CardTitle>
                  <CardDescription>{STEPS[2].description}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Enhanced Upload Zone */}
                  <div 
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-300"
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
                      <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Upload className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          Glissez-déposez vos images ici
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                          ou cliquez pour sélectionner des fichiers
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                          PNG, JPG, JPEG jusqu'à 5MB. Maximum 10 images.
                        </p>
                      </div>
                      <Button type="button" variant="outline" className="border-2">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Sélectionner des images
                      </Button>
                    </div>
                  </div>

                  {/* Enhanced Upload Progress */}
                  {uploading && (
                    <div className="text-center space-y-3">
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Téléchargement en cours...
                        </span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-slate-500">
                        {Math.round(uploadProgress)}% complété
                      </p>
                    </div>
                  )}

                  {/* Enhanced Image Gallery Preview */}
{/* Enhanced Image Gallery Preview */}
{formData.images.length > 0 && (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Label className="text-sm font-semibold">
        Images téléchargées ({formData.images.length}/10)
      </Label>
      {formData.images.length > 1 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (confirm('Êtes-vous sûr de vouloir supprimer toutes les images ?')) {
              setFormData((prev: any) => ({ ...prev, images: [] }))
              toast.success("Toutes les images ont été supprimées")
            }
          }}
          className="text-red-600 border-red-300 hover:bg-red-50 text-xs"
        >
          <X className="h-3 w-3 mr-1" />
          Tout supprimer
        </Button>
      )}
    </div>
    
    {/* Composant GigImage interne */}
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {formData.images.map((image:any, index) => (
    <SimpleImageDisplay 
      key={`${image.publicId}-${index}-${Date.now()}`} // Key unique à chaque render
      image={image} 
      index={index}
      onRemove={() => removeImage(index)}
    />
  ))}
</div>
  </div>
)}


                </CardContent>
              </Card>
            )}
             {/* Étape 4: Fonctionnalités */}
                      {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>{STEPS[3].title}</CardTitle>
                  <CardDescription>{STEPS[3].description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {formData.requirements.map((requirement, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={requirement}
                        onChange={(e) => updateRequirement(index, e.target.value)}
                        placeholder={`Prérequis ${index + 1}`}
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
                  <Button type="button" variant="outline" onClick={addRequirement}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un prérequis
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Étape 5: Vérification */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>{STEPS[4].title}</CardTitle>
                  <CardDescription>{STEPS[4].description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Titre</Label>
                      <p className="text-slate-700 dark:text-slate-300">{formData.title}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Catégorie</Label>
                      <p className="text-slate-700 dark:text-slate-300">{formData.category} {formData.subcategory && `> ${formData.subcategory}`}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Prix</Label>
                      <p className="text-slate-700 dark:text-slate-300">{formData.price}€</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Délai de livraison</Label>
                      <p className="text-slate-700 dark:text-slate-300">{formData.deliveryTime} jour{formData.deliveryTime > 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Fonctionnalités incluses</Label>
                      <ul className="list-disc list-inside text-slate-700 dark:text-slate-300">
                        {formData.features.filter(f => f.trim()).map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          {currentStep === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle>{STEPS[5].title}</CardTitle>
                  <CardDescription>{STEPS[5].description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Titre</Label>
                      <p className="text-slate-700 dark:text-slate-300">{formData.title}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Catégorie</Label>
                      <p className="text-slate-700 dark:text-slate-300">{formData.category} {formData.subcategory && `> ${formData.subcategory}`}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Prix</Label>
                      <p className="text-slate-700 dark:text-slate-300">{formData.price}€</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Images</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {formData.images.map((image:any, index) => (
                          <img
                            key={index}
                            src={image.url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                        ))}
                      </div>
                    </div>
                    {/* ... (rest of review content) ... */}
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Rest of the steps remain similar but can be enhanced similarly */}

            {/* Enhanced Navigation */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0 || loading}
                className="flex items-center gap-2 border-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>

              {currentStep < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/25"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Publier le service
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



