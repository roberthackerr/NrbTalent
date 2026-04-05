// app/projects/[id]/edit/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Save, 
  X, 
  Calendar,
  MapPin,
  DollarSign,
  Tag,
  FileText,
  AlertCircle,
  Upload,
  Trash2,
  Plus,
  Globe,
  Lock,
  Clock,
  Target,
  Code,
  Palette,
  Megaphone,
  PenTool,
  Video,
  Users,
  Brain,
  Sparkles,
  Loader2,
  Check,
  Cpu,
  Cloud,
  Smartphone,
  Shield,
  Briefcase,
  TrendingUp,
  Star,
  Edit3,
  Layout,
  Menu,
  ChevronDown,
  Search,
  Eye,
  EyeOff
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import { COUNTRIES } from '@/lib/constants/countries'
import { CurrencySelector } from '@/components/currency/CurrencySelector'
import Image from 'next/image'

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

interface UploadedFile {
  url: string
  publicId: string
  name: string
  type: string
  size: number
  thumbnail?: string
}

interface ProjectData {
  _id: string
  title: string
  description: string
  budget: {
    min: number
    max: number
    type: 'fixed' | 'hourly'
    currency: string
  }
  category: string
  subcategory?: string
  skills: string[]
  deadline: string
  location?: {
    country: string
    city: string
    remote: boolean
  }
  visibility: 'public' | 'private'
  status: 'draft' | 'open' | 'in-progress' | 'completed' | 'cancelled' | 'paused'
  tags: string[]
  urgency: 'low' | 'medium' | 'high'
  complexity: 'beginner' | 'intermediate' | 'expert'
  clientId: string
  applicationCount?: number
  saveCount?: number
  featured?: boolean
  acceptTeams?: boolean
  enableMilestones?: boolean
  requirements?: string
  deliverables?: string[]
  attachments?: UploadedFile[]
  milestones?: Array<{
    title: string
    amount: number
    dueDate: string
    description: string
    currency: string
  }>
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const id = params.id as string
  const lang = params.lang as string
  
  const [isMobile, setIsMobile] = useState(false)
  const [dict, setDict] = useState<any>(null)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [popularSkills, setPopularSkills] = useState<Skill[]>([])
  const [categorySearch, setCategorySearch] = useState("")
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const hasLoaded = useRef(false)
  const isMounted = useRef(true)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    skills: [] as string[],
    newSkill: '',
    tags: [] as string[],
    newTag: '',
    budgetType: 'fixed' as 'fixed' | 'hourly',
    budgetMin: 0,
    budgetMax: 0,
    currency: 'MGA',
    deadline: '',
    location: {
      country: 'MG',
      city: '',
      remote: true
    },
    visibility: 'public' as 'public' | 'private',
    status: 'draft' as ProjectData['status'],
    urgency: 'medium' as 'low' | 'medium' | 'high',
    complexity: 'intermediate' as 'beginner' | 'intermediate' | 'expert',
    featured: false,
    acceptTeams: false,
    enableMilestones: false,
    requirements: '',
    deliverables: [] as string[],
    newDeliverable: '',
    attachments: [] as UploadedFile[],
    milestones: [] as Array<{
      title: string
      amount: number
      dueDate: string
      description: string
      currency: string
    }>
  })

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/projects/categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories || [])
          setPopularSkills(data.popularSkills || [])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
    return () => {
      isMounted.current = false
    }
  }, [lang])

  const transformComplexity = (value: string): 'beginner' | 'intermediate' | 'expert' => {
    if (value === 'complex' || value === 'very-complex') return 'expert'
    if (value === 'simple') return 'beginner'
    if (value === 'beginner' || value === 'intermediate' || value === 'expert') return value
    return 'intermediate'
  }

  const transformUrgency = (value: string): 'low' | 'medium' | 'high' => {
    if (value === 'normal') return 'medium'
    if (value === 'urgent') return 'high'
    if (value === 'low' || value === 'medium' || value === 'high') return value
    return 'medium'
  }

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', `projects/${id}`)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      return {
        url: result.url,
        publicId: result.publicId,
        name: file.name,
        type: file.type,
        size: file.size,
        thumbnail: result.thumbnail
      }
    } catch (error) {
      console.error('Upload error:', error)
      return null
    }
  }

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    const filesArray = Array.from(files)
    const validFiles: File[] = []
    const invalidFiles: string[] = []

    for (const file of filesArray) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        invalidFiles.push(`${file.name} (type non supporté)`)
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (taille > 10MB)`)
        continue
      }
      validFiles.push(file)
    }

    if (invalidFiles.length > 0) {
      toast.error(`${invalidFiles.length} fichier(s) ignoré(s): ${invalidFiles.join(', ')}`)
    }

    if (validFiles.length === 0) {
      setUploading(false)
      return
    }

    const newFiles: UploadedFile[] = []
    let completed = 0

    for (const file of validFiles) {
      const uploadedFile = await uploadFile(file)
      if (uploadedFile) {
        newFiles.push(uploadedFile)
      }
      completed++
      setUploadProgress((completed / validFiles.length) * 100)
    }

    if (newFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newFiles]
      }))
      toast.success(`${newFiles.length} fichier(s) uploadé(s) avec succès`)
    }

    setUploading(false)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = async (index: number) => {
    const fileToRemove = formData.attachments[index]
    
    if (fileToRemove.publicId) {
      try {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: fileToRemove.publicId })
        })
      } catch (error) {
        console.error('Error deleting file:', error)
      }
    }
    
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const loadProject = useCallback(async () => {
    if (hasLoaded.current || !dict) return
    
    const t = dict?.projects?.edit || {}
    
    try {
      hasLoaded.current = true
      setLoading(true)
      
      const response = await fetch(`/api/projects/${id}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t.loadError || 'Failed to load project')
      }
      
      const data = await response.json()
      
      const sessionRes = await fetch('/api/auth/session')
      const session = await sessionRes.json()
      
      if (!session.user?.id || session.user.id !== data.clientId) {
        toast({
          title: t.unauthorized || 'Unauthorized',
          description: t.unauthorized || 'You are not authorized to edit this project',
          variant: 'destructive'
        })
        router.push(`/${lang}/projects/${id}`)
        return
      }
      
      if (isMounted.current) {
        setProjectData(data)
        
        setFormData({
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          subcategory: data.subcategory || '',
          skills: data.skills || [],
          newSkill: '',
          tags: data.tags || [],
          newTag: '',
          budgetType: data.budget?.type || 'fixed',
          budgetMin: data.budget?.min || 0,
          budgetMax: data.budget?.max || 0,
          currency: data.budget?.currency || 'MGA',
          deadline: data.deadline ? new Date(data.deadline).toISOString().split('T')[0] : '',
          location: data.location || { country: 'MG', city: '', remote: true },
          visibility: data.visibility || 'public',
          status: data.status || 'draft',
          urgency: transformUrgency(data.urgency || 'medium'),
          complexity: transformComplexity(data.complexity || 'intermediate'),
          featured: data.featured || false,
          acceptTeams: data.acceptTeams || false,
          enableMilestones: data.enableMilestones || false,
          requirements: data.requirements || '',
          deliverables: data.deliverables || [],
          newDeliverable: '',
          attachments: data.attachments || [],
          milestones: data.milestones || []
        })
      }
      
    } catch (error) {
      console.error('Error loading project:', error)
      if (isMounted.current) {
        toast({
          title: t.loadError || 'Error',
          description: error instanceof Error ? error.message : t.loadError || 'Failed to load project',
          variant: 'destructive'
        })
        router.push(`/${lang}/projects/${id}`)
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [id, lang, router, toast, dict])

  useEffect(() => {
    if (dict && !hasLoaded.current) {
      loadProject()
    }
  }, [dict, loadProject])

  const t = dict?.projects?.edit || {}

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addSkill = () => {
    if (formData.newSkill.trim() && !formData.skills.includes(formData.newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, prev.newSkill.trim()],
        newSkill: ''
      }))
    }
  }

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  const addTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }))
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const addDeliverable = () => {
    if (formData.newDeliverable.trim()) {
      setFormData(prev => ({
        ...prev,
        deliverables: [...prev.deliverables, prev.newDeliverable.trim()],
        newDeliverable: ''
      }))
    }
  }

  const removeDeliverable = (deliverable: string) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter(d => d !== deliverable)
    }))
  }

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, {
        title: "",
        amount: 0,
        dueDate: "",
        description: "",
        currency: prev.currency
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
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }))
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({ title: t.validationError || 'Validation Error', description: t.titleRequired || 'Project title is required', variant: 'destructive' })
      return false
    }
    if (!formData.description.trim()) {
      toast({ title: t.validationError || 'Validation Error', description: t.descriptionRequired || 'Project description is required', variant: 'destructive' })
      return false
    }
    if (!formData.category) {
      toast({ title: t.validationError || 'Validation Error', description: t.categoryRequired || 'Category is required', variant: 'destructive' })
      return false
    }
    if (formData.budgetMin <= 0 || formData.budgetMax <= 0) {
      toast({ title: t.validationError || 'Validation Error', description: t.budgetRequired || 'Budget is required', variant: 'destructive' })
      return false
    }
    if (formData.budgetMin > formData.budgetMax) {
      toast({ title: t.validationError || 'Validation Error', description: t.budgetMinMax || 'Minimum budget must be less than maximum budget', variant: 'destructive' })
      return false
    }
    if (!formData.deadline) {
      toast({ title: t.validationError || 'Validation Error', description: t.deadlineRequired || 'Deadline is required', variant: 'destructive' })
      return false
    }
    if (new Date(formData.deadline) < new Date()) {
      toast({ title: t.validationError || 'Validation Error', description: t.deadlineFuture || 'Deadline must be in the future', variant: 'destructive' })
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setSaving(true)
    
    try {
      const projectUpdate = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        skills: formData.skills,
        tags: formData.tags,
        budget: {
          min: formData.budgetMin,
          max: formData.budgetMax,
          type: formData.budgetType,
          currency: formData.currency
        },
        deadline: new Date(formData.deadline).toISOString(),
        location: formData.location,
        visibility: formData.visibility,
        status: formData.status,
        urgency: formData.urgency,
        complexity: formData.complexity,
        featured: formData.featured,
        acceptTeams: formData.acceptTeams,
        enableMilestones: formData.enableMilestones,
        requirements: formData.requirements,
        deliverables: formData.deliverables,
        attachments: formData.attachments,
        milestones: formData.milestones
      }
      
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectUpdate),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t.updateError || 'Failed to update project')
      }
      
      toast({
        title: t.updateSuccess || 'Success',
        description: t.updateSuccess || 'Project updated successfully!',
        className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0'
      })
      
      setTimeout(() => {
        router.push(`/${lang}/projects/${id}`)
        router.refresh()
      }, 1500)
      
    } catch (error) {
      console.error('Error updating project:', error)
      toast({
        title: t.updateError || 'Error',
        description: error instanceof Error ? error.message : t.updateError || 'Failed to update project',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (confirm(t.cancelConfirm || 'Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push(`/${lang}/projects/${id}`)
    }
  }

  const calculateProgress = () => {
    let progress = 0
    const fields = [
      formData.title,
      formData.description,
      formData.category,
      formData.budgetMin > 0,
      formData.budgetMax > 0,
      formData.deadline,
      formData.skills.length > 0,
      formData.status
    ]
    
    const completed = fields.filter(Boolean).length
    progress = Math.round((completed / fields.length) * 100)
    return progress
  }

  const progress = calculateProgress()
  const daysLeft = formData.deadline 
    ? Math.ceil((new Date(formData.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const CategorySelector = () => (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowCategoryDialog(true)}
        className="w-full justify-between border-purple-200 dark:border-purple-800"
      >
        {formData.category || t.selectCategory || "Sélectionnez une catégorie"}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>

      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-purple-700 dark:text-purple-300">
              {t.selectCategory || "Sélectionnez une catégorie"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
            <Input
              placeholder={t.searchCategory || "Rechercher une catégorie..."}
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="pl-10 border-purple-200 dark:border-purple-800"
            />
          </div>
          
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {categories.filter(cat => 
                cat.name.toLowerCase().includes(categorySearch.toLowerCase())
              ).length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  {t.noCategories || "Aucune catégorie trouvée"}
                </div>
              ) : (
                categories.filter(cat => 
                  cat.name.toLowerCase().includes(categorySearch.toLowerCase())
                ).map((category) => (
                  <Button
                    key={category.name}
                    type="button"
                    variant="ghost"
                    className="w-full justify-between hover:bg-purple-50 dark:hover:bg-purple-950/30"
                    onClick={() => {
                      handleChange("category", category.name)
                      setShowCategoryDialog(false)
                      setCategorySearch("")
                    }}
                  >
                    <span>{category.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )

  if (loading || !dict) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-20 animate-pulse rounded-full"></div>
            <Loader2 className="h-16 w-16 text-blue-600 dark:text-blue-400 animate-spin relative z-10" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t.loading || 'Loading...'}</h3>
          <p className="text-slate-600 dark:text-slate-400">{t.loadingDesc || 'Preparing your project editor'}</p>
        </div>
      </div>
    )
  }

  const SidebarContent = () => (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            {t.completion || 'Completion'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">{t.profileComplete || 'Project Profile'}</span>
              <span className="font-bold text-slate-900 dark:text-white">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>{t.budgetSet || 'Budget set'}</span>
              <Check className="h-4 w-4 text-green-500" />
            </div>
            <div className="flex items-center justify-between">
              <span>{t.timelineSet || 'Timeline set'}</span>
              {formData.deadline ? <Check className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-amber-500" />}
            </div>
            <div className="flex items-center justify-between">
              <span>{t.requirementsComplete || 'Requirements specified'}</span>
              {formData.skills.length > 0 ? <Check className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-slate-900 dark:text-white">{t.quickStats || 'Quick Stats'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{t.skillsCount || 'skills'}</span>
            </div>
            <span className="font-bold">{formData.skills.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-purple-500" />
              <span className="text-sm">{t.tagsCount || 'tags'}</span>
            </div>
            <span className="font-bold">{formData.tags.length}</span>
          </div>
          {formData.deadline && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-500" />
                <span className="text-sm">{t.daysLeft || 'days left'}</span>
              </div>
              <span className="font-bold">{daysLeft}</span>
            </div>
          )}
          {projectData && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">{t.applications || 'Applications'}</span>
                </div>
                <span className="font-bold">{projectData.applicationCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">{t.saved || 'Saved'}</span>
                </div>
                <span className="font-bold">{projectData.saveCount || 0}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white dark:from-gray-800 dark:to-gray-900">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            {t.aiAssistant || 'AI Assistant'}
          </CardTitle>
          <CardDescription>{t.getSuggestions || 'Get suggestions for your project'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/30"
            onClick={() => toast({ 
              title: t.comingSoon || 'Coming Soon', 
              description: t.aiDescription || 'AI assistant will be available soon!' 
            })}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {t.optimizeDescription || 'Optimize Description'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const tabItems = [
    { id: 'basic', label: t.basicInfo || 'Basic Info', icon: FileText },
    { id: 'budget', label: t.budgetTimeline || 'Budget & Timeline', icon: DollarSign },
    { id: 'skills', label: t.skillsTags || 'Skills & Tags', icon: Tag },
    { id: 'advanced', label: t.advancedSettings || 'Advanced', icon: Target }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20">
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-gray-800/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/${lang}/projects/${id}`)}
                  className="hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t.backToProject || 'Back'}
                </Button>
                <Badge variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 whitespace-nowrap">
                  <Edit3 className="h-3 w-3 mr-1" />
                  {t.editing || 'Editing'}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                {t.pageTitle || 'Edit Project'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1 hidden sm:block">
                {t.pageSubtitle || 'Update project details and settings'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"
              >
                {t.cancel || 'Cancel'}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.saving || 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isMobile ? (t.saveChanges?.split(' ')[0] || 'Save') : (t.saveChanges || 'Save Changes')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          <div className="hidden lg:block lg:col-span-1">
            <SidebarContent />
          </div>

          <div className="lg:col-span-3 space-y-6">
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full border-slate-300 dark:border-gray-700">
                    <Menu className="h-4 w-4 mr-2" />
                    {t.quickStats || 'Quick Stats'} & {t.completion || 'Progress'}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{t.pageTitle || 'Edit Project'}</SheetTitle>
                    <SheetDescription>{t.pageSubtitle || 'Update project details and settings'}</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <SidebarContent />
                  </div>
                </SheetContent>
              </Sheet>
            )}

            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="overflow-x-auto">
                    <TabsList className="w-full justify-start h-auto min-h-[52px] bg-transparent border-b rounded-none px-4 sm:px-6">
                      {tabItems.map((tab) => {
                        const Icon = tab.icon
                        return (
                          <TabsTrigger 
                            key={tab.id} 
                            value={tab.id} 
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/10 data-[state=active]:to-purple-500/10 rounded-none h-full py-3 px-3 sm:px-4 border-b-2 border-transparent data-[state=active]:border-blue-500 text-xs sm:text-sm whitespace-nowrap"
                          >
                            <Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                          </TabsTrigger>
                        )
                      })}
                    </TabsList>
                  </div>

                  <TabsContent value="basic" className="p-4 sm:p-6">
                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                          {t.projectTitle || 'Project Title'} *
                        </Label>
                        <Input
                          value={formData.title}
                          onChange={(e) => handleChange('title', e.target.value)}
                          placeholder={t.titlePlaceholder || "e.g., Build a React E-commerce Website"}
                          className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                          {t.projectDescription || 'Project Description'} *
                        </Label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => handleChange('description', e.target.value)}
                          placeholder={t.descriptionPlaceholder || "Describe your project in detail..."}
                          rows={6}
                          className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                            {t.category || 'Category'} *
                          </Label>
                          <CategorySelector />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                            {t.subcategory || 'Subcategory'}
                          </Label>
                          <Input
                            value={formData.subcategory}
                            onChange={(e) => handleChange('subcategory', e.target.value)}
                            placeholder={t.selectSubcategory || "Select subcategory"}
                            className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                            {t.countryLabel || "Country"}
                          </Label>
                          <Select
                            value={formData.location.country}
                            onValueChange={(value) => handleChange("location", { ...formData.location, country: value })}
                          >
                            <SelectTrigger className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700">
                              <SelectValue placeholder={t.selectCountry || "Select a country"} />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              <ScrollArea className="h-[300px]">
                                {COUNTRIES.map((country) => (
                                  <SelectItem key={country.code} value={country.code}>
                                    <span className="flex items-center gap-2">
                                      <span className="text-lg">{country.flag}</span>
                                      <span>{country.name}</span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                            {t.cityLabel || "City"}
                          </Label>
                          <Input
                            value={formData.location.city}
                            onChange={(e) => handleChange("location", { ...formData.location, city: e.target.value })}
                            placeholder={t.cityPlaceholder || "e.g., Antananarivo"}
                            className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="remote"
                          checked={formData.location.remote}
                          onCheckedChange={(checked) => handleChange("location", { ...formData.location, remote: checked })}
                        />
                        <Label htmlFor="remote" className="cursor-pointer text-slate-700 dark:text-slate-300">
                          {t.remoteWork || "Remote work accepted"}
                        </Label>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                          {t.technicalRequirements || 'Technical Requirements'}
                        </Label>
                        <Textarea
                          value={formData.requirements}
                          onChange={(e) => handleChange('requirements', e.target.value)}
                          placeholder={t.listRequirements || "List any technical requirements..."}
                          rows={4}
                          className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="budget" className="p-4 sm:p-6">
                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                          {t.currencyLabel || "Currency"}
                        </Label>
                        <CurrencySelector
                          value={formData.currency}
                          onChange={(currency) => handleChange('currency', currency)}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-900 dark:text-white mb-3 block">
                          {t.budgetType || 'Budget Type'} *
                        </Label>
                        <RadioGroup 
                          value={formData.budgetType} 
                          onValueChange={(value) => handleChange('budgetType', value as 'fixed' | 'hourly')}
                          className="flex flex-wrap gap-4 sm:gap-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fixed" id="fixed" />
                            <Label htmlFor="fixed" className="font-medium cursor-pointer">{t.fixedPrice || 'Fixed Price'}</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="hourly" id="hourly" />
                            <Label htmlFor="hourly" className="font-medium cursor-pointer">{t.hourlyRate || 'Hourly Rate'}</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                          {t.budgetRange || 'Budget Range'} *
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                              {t.minBudget || 'Minimum Budget'}
                            </Label>
                            <div className="relative">
                              <Input
                                type="number"
                                value={formData.budgetMin}
                                onChange={(e) => handleChange('budgetMin', parseInt(e.target.value) || 0)}
                                className="pl-8 bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700"
                              />
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                                {formData.currency}
                              </span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                              {t.maxBudget || 'Maximum Budget'}
                            </Label>
                            <div className="relative">
                              <Input
                                type="number"
                                value={formData.budgetMax}
                                onChange={(e) => handleChange('budgetMax', parseInt(e.target.value) || 0)}
                                className="pl-8 bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700"
                              />
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                                {formData.currency}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {t.deadline || 'Deadline'} *
                          </Label>
                          <Input
                            type="date"
                            value={formData.deadline}
                            onChange={(e) => handleChange('deadline', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Label className="text-sm font-medium text-slate-900 dark:text-white">
                            {t.milestones || "Milestones"}
                          </Label>
                          <Button type="button" variant="outline" size="sm" onClick={addMilestone} className="border-slate-300">
                            <Plus className="h-4 w-4 mr-2" />
                            {t.addMilestone || "Add Milestone"}
                          </Button>
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                          {formData.milestones.map((milestone, index) => (
                            <div key={index} className="flex gap-4 items-start p-4 border border-slate-200 dark:border-gray-700 rounded-xl">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>{t.milestoneTitle || "Title"}</Label>
                                  <Input
                                    value={milestone.title}
                                    onChange={(e) => updateMilestone(index, "title", e.target.value)}
                                    placeholder={t.milestoneTitlePlaceholder || "e.g., Finalized designs"}
                                    className="border-slate-300 dark:border-gray-700"
                                  />
                                </div>
                                <div>
                                  <Label>{t.milestoneAmount || "Amount"}</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      value={milestone.amount}
                                      onChange={(e) => updateMilestone(index, "amount", Number(e.target.value))}
                                      placeholder="0"
                                      className="flex-1 border-slate-300 dark:border-gray-700"
                                    />
                                    <div className="text-sm text-slate-600 flex items-center px-3 border rounded bg-slate-50 dark:bg-slate-800">
                                      {milestone.currency}
                                    </div>
                                  </div>
                                </div>
                                <div className="md:col-span-2">
                                  <Label>{t.milestoneDueDate || "Due Date"}</Label>
                                  <Input
                                    type="date"
                                    value={milestone.dueDate}
                                    onChange={(e) => updateMilestone(index, "dueDate", e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="border-slate-300 dark:border-gray-700"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <Label>{t.milestoneDescription || "Description"}</Label>
                                  <Textarea
                                    value={milestone.description}
                                    onChange={(e) => updateMilestone(index, "description", e.target.value)}
                                    placeholder={t.milestoneDescPlaceholder || "Description of expected deliverables..."}
                                    rows={2}
                                    className="border-slate-300 dark:border-gray-700"
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

                      <div>
                        <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                          {t.deliverables || 'Deliverables'}
                        </Label>
                        <div className="flex flex-col sm:flex-row gap-2 mb-3">
                          <Input
                            value={formData.newDeliverable}
                            onChange={(e) => handleChange('newDeliverable', e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDeliverable())}
                            placeholder={t.deliverablesPlaceholder || "e.g., Source code, Documentation"}
                            className="flex-1 bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700"
                          />
                          <Button
                            type="button"
                            onClick={addDeliverable}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {t.add || 'Add'}
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {formData.deliverables.map((deliverable, index) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-lg gap-2 sm:gap-4">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span className="text-sm break-words">{deliverable}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDeliverable(deliverable)}
                                className="h-8 w-8 p-0 text-slate-500 hover:text-red-500 flex-shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="skills" className="p-4 sm:p-6">
                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                          {t.skills || 'Skills'}
                        </Label>
                        <div className="flex flex-col sm:flex-row gap-2 mb-4">
                          <div className="relative flex-1">
                            <Input
                              value={formData.newSkill}
                              onChange={(e) => handleChange('newSkill', e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                              placeholder={t.skillPlaceholder || "e.g., React, Node.js, Figma"}
                              className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700 pl-10"
                            />
                            <Code className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          </div>
                          <Button
                            type="button"
                            onClick={addSkill}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {t.add || 'Add'}
                          </Button>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {t.popularSkills || 'Popular skills'}:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {popularSkills.slice(0, isMobile ? 12 : 20).map((skill) => (
                              <Badge
                                key={skill.skill}
                                variant={formData.skills.includes(skill.skill) ? 'default' : 'outline'}
                                className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                onClick={() => {
                                  if (formData.skills.includes(skill.skill)) {
                                    removeSkill(skill.skill)
                                  } else {
                                    handleChange('skills', [...formData.skills, skill.skill])
                                  }
                                }}
                              >
                                {skill.skill}
                                {formData.skills.includes(skill.skill) && <Check className="h-3 w-3 ml-1" />}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="border border-slate-200 dark:border-gray-700 rounded-lg p-4 min-h-[100px]">
                          {formData.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {formData.skills.map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="secondary"
                                  className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                >
                                  {skill}
                                  <button
                                    type="button"
                                    onClick={() => removeSkill(skill)}
                                    className="ml-2 text-blue-500 hover:text-blue-700"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                              <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>{t.noSkillsYet || 'No skills added yet'}</p>
                              <p className="text-sm">{t.noSkillsDesc || 'Add skills to help freelancers find your project'}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                          {t.tags || 'Tags'}
                        </Label>
                        <div className="flex flex-col sm:flex-row gap-2 mb-3">
                          <Input
                            value={formData.newTag}
                            onChange={(e) => handleChange('newTag', e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            placeholder={t.tagPlaceholder || "e.g., urgent, startup, saas"}
                            className="flex-1 bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700"
                          />
                          <Button
                            type="button"
                            onClick={addTag}
                            variant="outline"
                            className="border-slate-300 dark:border-gray-700"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="bg-slate-50 dark:bg-gray-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-gray-700"
                            >
                              #{tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-2 text-slate-500 hover:text-slate-700"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="p-4 sm:p-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <Label className="text-sm font-medium text-slate-900 dark:text-white mb-3 block">
                            {t.visibility || 'Visibility'}
                          </Label>
                          <RadioGroup 
                            value={formData.visibility} 
                            onValueChange={(value) => handleChange('visibility', value as 'public' | 'private')}
                            className="space-y-3"
                          >
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem value="public" id="public" className="mt-0.5" />
                              <Label htmlFor="public" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4 text-blue-500" />
                                  <span className="font-medium">{t.public || 'Public'}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{t.publicDesc || 'Visible to all freelancers'}</p>
                              </Label>
                            </div>
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem value="private" id="private" className="mt-0.5" />
                              <Label htmlFor="private" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <Lock className="h-4 w-4 text-purple-500" />
                                  <span className="font-medium">{t.private || 'Private'}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{t.privateDesc || 'Only by invitation'}</p>
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                            {t.status || 'Status'} *
                          </Label>
                          <Select value={formData.status} onValueChange={(value) => handleChange('status', value as ProjectData['status'])}>
                            <SelectTrigger className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">{t.draft || 'Draft'}</SelectItem>
                              <SelectItem value="open">{t.open || 'Open'}</SelectItem>
                              <SelectItem value="in-progress">{t.inProgress || 'In Progress'}</SelectItem>
                              <SelectItem value="paused">{t.paused || 'Paused'}</SelectItem>
                              <SelectItem value="completed">{t.completed || 'Completed'}</SelectItem>
                              <SelectItem value="cancelled">{t.cancelled || 'Cancelled'}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                            {t.urgency || 'Urgency'}
                          </Label>
                          <Select value={formData.urgency} onValueChange={(value) => handleChange('urgency', value as 'low' | 'medium' | 'high')}>
                            <SelectTrigger className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">{t.low || 'Low'}</SelectItem>
                              <SelectItem value="medium">{t.medium || 'Medium'}</SelectItem>
                              <SelectItem value="high">{t.high || 'High'}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                            {t.complexity || 'Complexity'}
                          </Label>
                          <Select value={formData.complexity} onValueChange={(value) => handleChange('complexity', value as 'beginner' | 'intermediate' | 'expert')}>
                            <SelectTrigger className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">{t.beginner || 'Beginner'}</SelectItem>
                              <SelectItem value="intermediate">{t.intermediate || 'Intermediate'}</SelectItem>
                              <SelectItem value="expert">{t.expert || 'Expert'}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator />
                      
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium text-slate-900 dark:text-white">
                              {t.featuredProject || 'Featured Project'}
                            </Label>
                            <p className="text-xs text-slate-500">{t.featuredDesc || 'Highlight your project in search results'}</p>
                          </div>
                          <Switch
                            checked={formData.featured}
                            onCheckedChange={(checked) => handleChange('featured', checked)}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium text-slate-900 dark:text-white">
                              {t.acceptTeams || 'Accept Team Applications'}
                            </Label>
                            <p className="text-xs text-slate-500">{t.acceptTeamsDesc || 'Allow teams to apply for this project'}</p>
                          </div>
                          <Switch
                            checked={formData.acceptTeams}
                            onCheckedChange={(checked) => handleChange('acceptTeams', checked)}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium text-slate-900 dark:text-white">
                              {t.enableMilestones || 'Enable Milestones'}
                            </Label>
                            <p className="text-xs text-slate-500">{t.enableMilestonesDesc || 'Break project into milestones with payments'}</p>
                          </div>
                          <Switch
                            checked={formData.enableMilestones}
                            onCheckedChange={(checked) => handleChange('enableMilestones', checked)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-900 dark:text-white mb-3 block">
                          {t.attachments || 'Attachments'}
                        </Label>
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.txt"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleFileUpload(e.target.files)
                            }
                          }}
                          className="hidden"
                          id="file-upload-input"
                        />
                        
                        <div 
                          className="border-2 border-dashed border-slate-300 dark:border-gray-700 rounded-xl p-6 text-center hover:border-purple-400 transition-colors cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.add('border-purple-500', 'bg-purple-50/30')
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('border-purple-500', 'bg-purple-50/30')
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove('border-purple-500', 'bg-purple-50/30')
                            const files = e.dataTransfer.files
                            if (files.length > 0) {
                              handleFileUpload(files)
                            }
                          }}
                        >
                          <Upload className="h-10 w-10 text-purple-400 mx-auto mb-3" />
                          <div className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                            {t.dragDrop || "Drag & drop files here"}
                          </div>
                          <div className="text-sm text-slate-500 mb-4">
                            {t.orClick || "or click to browse"}
                          </div>
                          <Button 
                            variant="outline" 
                            type="button" 
                            onClick={(e) => {
                              e.stopPropagation()
                              fileInputRef.current?.click()
                            }}
                            className="border-slate-300 hover:bg-purple-50"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {t.selectFiles || "Select Files"}
                          </Button>
                          <p className="text-xs text-slate-400 mt-3">
                            {t.fileHelp || "Images, PDF, DOC, TXT - Max 10MB per file"}
                          </p>
                        </div>

                        {uploading && (
                          <div className="mt-4 p-4 border border-purple-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-purple-600">{t.uploading || "Uploading..."}</span>
                              <span className="text-sm text-purple-600">{Math.round(uploadProgress)}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-2" />
                          </div>
                        )}

                        {formData.attachments.length > 0 && (
                          <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-purple-700">
                                {t.uploadedFiles || "Uploaded files"} ({formData.attachments.length})
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, attachments: [] }))
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                {t.clearAll || "Clear all"}
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {formData.attachments.map((file, index) => (
                                <div
                                  key={index}
                                  className="relative group border border-slate-200 dark:border-gray-700 rounded-lg p-2 hover:bg-purple-50/30 transition-colors"
                                >
                                  {file.thumbnail ? (
                                    <div className="aspect-video relative mb-2 rounded overflow-hidden bg-purple-50">
                                      <Image
                                        src={file.thumbnail}
                                        alt={file.name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : file.type.startsWith('image/') ? (
                                    <div className="aspect-video relative mb-2 rounded overflow-hidden bg-purple-50">
                                      <Image
                                        src={file.url}
                                        alt={file.name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center h-20 bg-purple-50 rounded mb-2">
                                      <FileText className="h-8 w-8 text-purple-400" />
                                    </div>
                                  )}
                                  <div className="text-xs truncate" title={file.name}>
                                    {file.name}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPreview(!showPreview)}
                        className="w-full border-slate-300 hover:bg-purple-50"
                      >
                        {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {showPreview ? t.hidePreview || "Hide Preview" : t.showPreview || "Show Preview"}
                      </Button>

                      {showPreview && (
                        <Card className="border-slate-200 dark:border-gray-700 bg-purple-50/30 dark:bg-purple-950/20">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-purple-700 dark:text-purple-300">
                              {t.preview || "Project Preview"}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="font-medium text-purple-600 dark:text-purple-400">{t.title || "Title"}</div>
                                <div>{formData.title || "-"}</div>
                              </div>
                              <div>
                                <div className="font-medium text-purple-600 dark:text-purple-400">{t.category || "Category"}</div>
                                <div>{formData.category || "-"}</div>
                              </div>
                              <div>
                                <div className="font-medium text-purple-600 dark:text-purple-400">{t.budget || "Budget"}</div>
                                <div>{formData.budgetMin > 0 ? `${formData.budgetMin} - ${formData.budgetMax} ${formData.currency} (${formData.budgetType === "fixed" ? "Fixed" : "Hourly"})` : "-"}</div>
                              </div>
                              <div>
                                <div className="font-medium text-purple-600 dark:text-purple-400">{t.deadline || "Deadline"}</div>
                                <div>{formData.deadline ? new Date(formData.deadline).toLocaleDateString() : "-"}</div>
                              </div>
                              <div className="col-span-2">
                                <div className="font-medium text-purple-600 dark:text-purple-400">{t.skills || "Skills"}</div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {formData.skills.map(s => <Badge key={s} variant="secondary" className="bg-purple-100">{s}</Badge>)}
                                </div>
                              </div>
                              {formData.attachments.length > 0 && (
                                <div className="col-span-2">
                                  <div className="font-medium text-purple-600 dark:text-purple-400">{t.attachments || "Attachments"}</div>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {formData.attachments.map((f, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {f.name}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-2">
                      {t.importantNote || 'Important Note'}
                    </h4>
                    <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-400">
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                        <span>{t.modificationNote || 'Modifying an in-progress project requires freelancer agreement'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                        <span>{t.requiredFieldsNote || 'Fields marked with * are required'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                        <span>{t.notificationNote || 'Any changes will be notified to applied freelancers'}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}