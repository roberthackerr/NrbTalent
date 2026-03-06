// /app/(dashboard)/groups/create/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Upload, 
  Globe, 
  Lock, 
  Users, 
  Check, 
  X, 
  Image as ImageIcon,
  Info,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import Image from 'next/image'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// Composant pour l'icône de visibilité
const VisibilityIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'public':
      return <Globe className="h-4 w-4" />
    case 'private':
      return <Lock className="h-4 w-4" />
    case 'hidden':
      return <Users className="h-4 w-4" />
    default:
      return <Globe className="h-4 w-4" />
  }
}

export default function CreateGroupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'skill',
    visibility: 'public',
    tags: [] as string[],
    skills: [] as string[],
    location: '',
    company: '',
    image: null as File | null
  })

  const [formErrors, setFormErrors] = useState({
    name: '',
    description: '',
    image: ''
  })

  const [tagInput, setTagInput] = useState('')
  const [skillInput, setSkillInput] = useState('')

  const GROUP_TYPES = [
    { 
      value: 'skill', 
      label: 'Compétences', 
      description: 'Groupes par domaine d\'expertise',
      icon: '💼'
    },
    { 
      value: 'location', 
      label: 'Localisation', 
      description: 'Groupes géographiques',
      icon: '📍'
    },
    { 
      value: 'professional', 
      label: 'Professionnel', 
      description: 'Groupes par métier',
      icon: '👔'
    },
    { 
      value: 'company', 
      label: 'Entreprise', 
      description: 'Groupes d\'entreprise',
      icon: '🏢'
    },
    { 
      value: 'learning', 
      label: 'Apprentissage', 
      description: 'Groupes d\'apprentissage',
      icon: '🎓'
    },
    { 
      value: 'interest', 
      label: 'Intérêt', 
      description: 'Groupes par centre d\'intérêt',
      icon: '❤️'
    }
  ]

  const VISIBILITY_OPTIONS = [
    {
      value: 'public',
      label: 'Public',
      description: 'Visible par tous, tout le monde peut rejoindre',
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    {
      value: 'private',
      label: 'Privé',
      description: 'Visible, demande d\'adhésion nécessaire',
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      value: 'hidden',
      label: 'Caché',
      description: 'Invisible, invitation uniquement',
      color: 'text-slate-600 bg-slate-50 border-slate-200'
    }
  ]

  const POPULAR_TAGS = [
    'Tech', 'Design', 'Marketing', 'Business', 'Startup',
    'Remote Work', 'Freelance', 'Networking', 'Mentoring',
    'Innovation', 'Leadership', 'Productivity'
  ]

  const POPULAR_SKILLS = [
    'React', 'JavaScript', 'TypeScript', 'Node.js', 'Python',
    'UI/UX', 'Graphic Design', 'Content Writing', 'SEO',
    'Project Management', 'Data Analysis', 'Cloud Computing'
  ]

  // Validation functions
  const validateName = (name: string) => {
    if (name.length < 3) return 'Le nom doit contenir au moins 3 caractères'
    if (name.length > 50) return 'Le nom ne doit pas dépasser 50 caractères'
    return ''
  }

  const validateDescription = (description: string) => {
    if (description.length < 20) return 'La description doit contenir au moins 20 caractères'
    if (description.length > 500) return 'La description ne doit pas dépasser 500 caractères'
    return ''
  }

  const validateImage = (file: File | null) => {
    if (!file) return ''
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return 'Format non supporté. Utilisez JPG, PNG ou WebP'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'L\'image est trop volumineuse (max 2MB)'
    }
    return ''
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const error = validateImage(file)
    if (error) {
      setFormErrors(prev => ({ ...prev, image: error }))
      return
    }

    setFormData(prev => ({ ...prev, image: file }))
    setFormErrors(prev => ({ ...prev, image: '' }))
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }))
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (!trimmedTag) return
    
    if (formData.tags.length >= 10) {
      toast.error('Maximum 10 tags autorisés')
      return
    }
    
    if (formData.tags.includes(trimmedTag)) {
      toast.info('Ce tag existe déjà')
      return
    }
    
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, trimmedTag]
    }))
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim()
    if (!trimmedSkill) return
    
    if (formData.skills.length >= 15) {
      toast.error('Maximum 15 compétences autorisées')
      return
    }
    
    if (formData.skills.includes(trimmedSkill)) {
      toast.info('Cette compétence existe déjà')
      return
    }
    
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, trimmedSkill]
    }))
  }

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !validateName(formData.name) && !validateDescription(formData.description)
      case 2:
        return formData.type !== ''
      case 3:
        return formData.tags.length > 0
      default:
        return true
    }
  }

  const handleStepChange = (nextStep: number) => {
    if (nextStep < step) {
      setStep(nextStep)
      return
    }
    
    // Validation pour l'étape 1
    if (step === 1) {
      const nameError = validateName(formData.name)
      const descError = validateDescription(formData.description)
      const isValid = !nameError && !descError
      
      if (!isValid) {
        setFormErrors({
          name: nameError,
          description: descError,
          image: formErrors.image
        })
        toast.error('Veuillez corriger les erreurs avant de continuer')
        return
      }
    }
    
    setStep(nextStep)
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      toast.error('Veuillez ajouter au moins un tag')
      return
    }

    setLoading(true)
    try {
      const formDataToSend = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'image' && value) {
          formDataToSend.append(key, value)
        } else if (Array.isArray(value)) {
          formDataToSend.append(key, JSON.stringify(value))
        } else {
          formDataToSend.append(key, value as string)
        }
      })

      const response = await fetch('/api/groups', {
        method: 'POST',
        body: formDataToSend
      })

      if (response.ok) {
        const group = await response.json()
        toast.success('Groupe créé avec succès !')
        router.push(`/groups/${group.slug}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la création')
      }
    } catch (error) {
      toast.error('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const progressPercentage = (step / 3) * 100

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 -ml-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        
        <h1 className="text-3xl font-bold">Créer un nouveau groupe</h1>
        <p className="text-slate-600 mt-2">
          Créez une communauté autour de vos intérêts et compétences
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            Étape {step} sur 3
          </span>
          <span className="text-sm text-slate-500">
            {Math.round(progressPercentage)}% complété
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Form */}
      <Card className="border-slate-200">
        <CardContent className="pt-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="name" className="text-base">
                    Nom du groupe *
                  </Label>
                  <span className="text-sm text-slate-500">
                    {formData.name.length}/50
                  </span>
                </div>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                    // Validation uniquement si l'utilisateur a déjà saisi quelque chose
                    if (e.target.value.length > 0) {
                      setFormErrors(prev => ({ ...prev, name: validateName(e.target.value) }))
                    }
                  }}
                  onBlur={(e) => {
                    setFormErrors(prev => ({ ...prev, name: validateName(e.target.value) }))
                  }}
                  placeholder="Ex: Développeurs React Madagascar"
                  className={`mt-1 ${formErrors.name ? 'border-red-500' : ''}`}
                  maxLength={50}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="description" className="text-base">
                    Description *
                  </Label>
                  <span className="text-sm text-slate-500">
                    {formData.description.length}/500
                  </span>
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, description: e.target.value }))
                    // Validation uniquement si l'utilisateur a déjà saisi quelque chose
                    if (e.target.value.length > 0) {
                      setFormErrors(prev => ({ ...prev, description: validateDescription(e.target.value) }))
                    }
                  }}
                  onBlur={(e) => {
                    setFormErrors(prev => ({ ...prev, description: validateDescription(e.target.value) }))
                  }}
                  placeholder="Décrivez l'objectif, les activités et les valeurs de votre groupe..."
                  rows={6}
                  className={`mt-1 ${formErrors.description ? 'border-red-500' : ''}`}
                  maxLength={500}
                />
                {formErrors.description && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {formErrors.description}
                  </p>
                )}
                <div className="text-sm text-slate-500 mt-2 space-y-1">
                  <p>✓ Expliquez le but du groupe</p>
                  <p>✓ Décrivez les activités prévues</p>
                  <p>✓ Mentionnez les valeurs importantes</p>
                </div>
              </div>

              <div>
                <Label className="text-base mb-4 block">Logo du groupe</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  className="hidden"
                />
                
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-slate-200">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized // Pour les previews locales
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Changer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={removeImage}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="font-medium mb-2">Télécharger un logo</p>
                    <p className="text-sm text-slate-500">
                      PNG, JPG, WebP (max 2MB)
                    </p>
                    {formErrors.image && (
                      <p className="text-red-500 text-sm mt-2">{formErrors.image}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Annuler
                </Button>
                <div className="space-x-3">
                  <Button
                    onClick={() => handleStepChange(2)}
                    className="min-w-[120px]"
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Type & Visibility */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <Label className="text-base mb-4 block">Type de groupe *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {GROUP_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      className={`border-2 rounded-lg p-4 text-left transition-all hover:scale-[1.02] ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div>
                          <div className="font-semibold mb-1">{type.label}</div>
                          <div className="text-sm text-slate-600">{type.description}</div>
                        </div>
                        {formData.type === type.value && (
                          <Check className="h-5 w-5 text-blue-500 ml-auto" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {formData.type === 'location' && (
                <div>
                  <Label htmlFor="location" className="text-base">
                    Localisation
                    <span className="text-slate-400 ml-2 text-sm font-normal">(optionnel)</span>
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Ex: Antananarivo, Madagascar"
                    className="mt-2"
                  />
                </div>
              )}

              {formData.type === 'company' && (
                <div>
                  <Label htmlFor="company" className="text-base">
                    Entreprise
                    <span className="text-slate-400 ml-2 text-sm font-normal">(optionnel)</span>
                  </Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Ex: Google, Microsoft, Startup X"
                    className="mt-2"
                  />
                </div>
              )}

              <div>
                <Label className="text-base mb-4 block">Visibilité du groupe *</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {VISIBILITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`border rounded-lg p-4 text-left transition-all ${
                        formData.visibility === option.value
                          ? `${option.color} shadow-sm`
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, visibility: option.value }))}
                    >
                      <div className="flex items-start gap-3">
                        <VisibilityIcon type={option.value} />
                        <div className="flex-1">
                          <div className="font-semibold mb-1">{option.label}</div>
                          <div className="text-sm text-slate-600">{option.description}</div>
                        </div>
                        {formData.visibility === option.value && (
                          <Check className="h-5 w-5" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Alert className="bg-slate-50 border-slate-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-slate-700">
                  Vous pourrez modifier la visibilité plus tard, mais cela affectera qui peut voir et rejoindre votre groupe.
                </AlertDescription>
              </Alert>

              <div className="flex justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleStepChange(1)}
                >
                  Retour
                </Button>
                <div className="space-x-3">
                  <Button
                    onClick={() => handleStepChange(3)}
                    className="min-w-[120px]"
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Tags & Skills */}
          {step === 3 && (
            <div className="space-y-8">
              <div>
                <Label className="text-base mb-4 block flex items-center gap-2">
                  Tags *
                  <Badge variant="outline" className="text-xs">
                    {formData.tags.length}/10
                  </Badge>
                </Label>
                
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Ajouter un tag (appuyez sur Entrée)..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag(tagInput)
                          setTagInput('')
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        addTag(tagInput)
                        setTagInput('')
                      }}
                      disabled={!tagInput.trim()}
                      variant="secondary"
                    >
                      Ajouter
                    </Button>
                  </div>
                  
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-lg">
                      {formData.tags.map(tag => (
                        <Badge 
                          key={tag} 
                          variant="secondary"
                          className="pl-3 pr-2 py-1.5 text-sm hover:bg-slate-300 transition-colors"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 hover:text-red-500 p-0.5 rounded"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Tags populaires :</p>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_TAGS.map(tag => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                          onClick={() => addTag(tag)}
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base mb-4 block flex items-center gap-2">
                  Compétences associées
                  <Badge variant="outline" className="text-xs">
                    {formData.skills.length}/15
                  </Badge>
                </Label>
                
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="Ajouter une compétence (appuyez sur Entrée)..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSkill(skillInput)
                          setSkillInput('')
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        addSkill(skillInput)
                        setSkillInput('')
                      }}
                      disabled={!skillInput.trim()}
                      variant="secondary"
                    >
                      Ajouter
                    </Button>
                  </div>
                  
                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-lg">
                      {formData.skills.map(skill => (
                        <Badge 
                          key={skill} 
                          variant="secondary"
                          className="pl-3 pr-2 py-1.5 text-sm hover:bg-slate-300 transition-colors"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-2 hover:text-red-500 p-0.5 rounded"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Compétences populaires :</p>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_SKILLS.map(skill => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                          onClick={() => addSkill(skill)}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <h4 className="font-semibold text-blue-900 mb-4 text-lg flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Récapitulatif
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-blue-700 font-medium mb-1">Nom du groupe</div>
                      <div className="text-lg font-semibold text-blue-900 truncate">
                        {formData.name || 'Non spécifié'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-blue-700 font-medium mb-1">Type</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {GROUP_TYPES.find(t => t.value === formData.type)?.label || formData.type}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-blue-700 font-medium mb-1">Visibilité</div>
                      <div className="flex items-center gap-2">
                        <VisibilityIcon type={formData.visibility} />
                        <Badge variant="outline" className="capitalize">
                          {VISIBILITY_OPTIONS.find(v => v.value === formData.visibility)?.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-blue-700 font-medium mb-1">Tags</div>
                      <div className="flex flex-wrap gap-1">
                        {formData.tags.slice(0, 5).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                        {formData.tags.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{formData.tags.length - 5}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {formData.skills.length > 0 && (
                      <div>
                        <div className="text-sm text-blue-700 font-medium mb-1">Compétences</div>
                        <div className="flex flex-wrap gap-1">
                          {formData.skills.slice(0, 5).map(skill => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {formData.skills.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{formData.skills.length - 5}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm text-blue-700 font-medium mb-1">Description</div>
                    <div className="text-blue-900 line-clamp-3 p-3 bg-white/50 rounded-lg">
                      {formData.description || 'Aucune description'}
                    </div>
                  </div>
                </div>
              </div>

              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  Vérifiez toutes les informations avant de créer le groupe. Vous pourrez modifier la plupart des paramètres plus tard.
                </AlertDescription>
              </Alert>

              <div className="flex justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleStepChange(2)}
                >
                  Retour
                </Button>
                <div className="space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="min-w-[140px]"
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Création...
                      </>
                    ) : 'Créer le groupe'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}