// app/projects/[id]/edit/page.tsx
'use client'

import { useState, useEffect } from 'react'
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
  Zap,
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
  Building,
  Cpu,
  Cloud,
  Database,
  Smartphone,
  Shield,
  Layers,
  Briefcase,
  TrendingUp,
  BarChart3,
  Award,
  Star,
  Edit3,
  Layout
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Language dictionary
const dictionary = {
  en: {
    // Page titles
    pageTitle: 'Edit Project',
    pageSubtitle: 'Update project details and settings',
    backToProject: 'Back to Project',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    saved: 'Saved!',
    
    // Section headers
    basicInfo: 'Basic Information',
    budgetTimeline: 'Budget & Timeline',
    skillsTags: 'Skills & Tags',
    advancedSettings: 'Advanced Settings',
    projectRequirements: 'Project Requirements',
    
    // Form labels
    projectTitle: 'Project Title *',
    projectDescription: 'Project Description *',
    category: 'Category *',
    subcategory: 'Subcategory',
    skills: 'Required Skills',
    addSkill: 'Add Skill',
    tags: 'Project Tags',
    addTag: 'Add Tag',
    budgetType: 'Budget Type *',
    fixedPrice: 'Fixed Price',
    hourlyRate: 'Hourly Rate',
    budgetRange: 'Budget Range *',
    minBudget: 'Minimum Budget',
    maxBudget: 'Maximum Budget',
    deadline: 'Project Deadline *',
    location: 'Location',
    remoteWork: 'Remote Work',
    onSite: 'On Site',
    hybrid: 'Hybrid',
    visibility: 'Visibility',
    public: 'Public',
    private: 'Private',
    status: 'Project Status *',
    urgency: 'Urgency Level',
    complexity: 'Complexity Level',
    
    // Status options
    draft: 'Draft',
    open: 'Open for Applications',
    inProgress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    paused: 'Paused',
    
    // Urgency options
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    
    // Complexity options
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    expert: 'Expert',
    
    // Categories
    webDevelopment: 'Web Development',
    mobileDevelopment: 'Mobile Development',
    uiUxDesign: 'UI/UX Design',
    graphicDesign: 'Graphic Design',
    digitalMarketing: 'Digital Marketing',
    contentWriting: 'Content Writing',
    videoEditing: 'Video Editing',
    dataScience: 'Data Science',
    devOps: 'DevOps',
    cybersecurity: 'Cybersecurity',
    consulting: 'Consulting',
    other: 'Other',
    
    // Validation errors
    validationError: 'Validation Error',
    titleRequired: 'Project title is required',
    descriptionRequired: 'Project description is required',
    categoryRequired: 'Category is required',
    budgetRequired: 'Budget is required',
    deadlineRequired: 'Deadline is required',
    deadlineFuture: 'Deadline must be in the future',
    budgetMinMax: 'Minimum budget must be less than maximum budget',
    
    // Success messages
    updateSuccess: 'Project updated successfully!',
    updateError: 'Failed to update project',
    loadError: 'Failed to load project',
    unauthorized: 'Unauthorized access',
    
    // Notes
    importantNote: 'Important Note',
    modificationNote: 'Modifying an in-progress project requires freelancer agreement',
    requiredFieldsNote: 'Fields marked with * are required',
    notificationNote: 'Any changes will be notified to applied freelancers',
    
    // Additional info
    projectScope: 'Project Scope',
    technicalRequirements: 'Technical Requirements',
    deliverables: 'Deliverables',
    communication: 'Communication',
    attachments: 'Attachments',
    milestones: 'Milestones',
    
    // Tabs
    overview: 'Overview',
    requirements: 'Requirements',
    team: 'Team',
    documents: 'Documents',
    
    // Placeholders
    titlePlaceholder: 'e.g., Build a React E-commerce Website',
    descriptionPlaceholder: 'Describe your project in detail...',
    skillPlaceholder: 'e.g., React, Node.js, Figma',
    tagPlaceholder: 'e.g., urgent, startup, saas',
    locationPlaceholder: 'e.g., Paris, France or Remote',
    
    // Stats
    characters: 'characters',
    skillsCount: 'skills',
    tagsCount: 'tags',
    daysLeft: 'days left',
    
    // Actions
    remove: 'Remove',
    add: 'Add',
    upload: 'Upload',
    delete: 'Delete',
    preview: 'Preview',
    
    // Additional settings
    featuredProject: 'Featured Project',
    acceptTeams: 'Accept Team Applications',
    enableMilestones: 'Enable Milestones',
    autoExtend: 'Auto-extend Deadline',
    requireProposal: 'Require Proposal',
    allowQuestions: 'Allow Questions',
    
    // Progress
    completion: 'Completion',
    profileComplete: 'Project profile complete',
    requirementsComplete: 'Requirements specified',
    budgetSet: 'Budget set',
    timelineSet: 'Timeline set'
  },
  fr: {
    // French translations
    pageTitle: 'Modifier le Projet',
    pageSubtitle: 'Mettre à jour les détails et paramètres du projet',
    backToProject: 'Retour au Projet',
    cancel: 'Annuler',
    saveChanges: 'Enregistrer les modifications',
    saving: 'Enregistrement...',
    saved: 'Enregistré !',
    
    // ... add all French translations
  }
}

// Project data interface
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
  location?: string
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
  attachments?: Array<{
    name: string
    url: string
    type: string
  }>
}

// Helper to transform urgency values
const transformUrgency = (value: string): 'low' | 'medium' | 'high' => {
  if (value === 'normal') return 'medium';
  return value as 'low' | 'medium' | 'high';
};

// Helper to transform complexity values
const transformComplexity = (value: string): 'beginner' | 'intermediate' | 'expert' => {
  if (value === 'very-complex') return 'expert';
  return value as 'beginner' | 'intermediate' | 'expert';
};

// Category options with icons
const categories = [
  { value: 'web-development', label: 'Web Development', icon: Code, color: 'text-blue-600', bg: 'bg-blue-100' },
  { value: 'mobile-development', label: 'Mobile Development', icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-100' },
  { value: 'ui-ux-design', label: 'UI/UX Design', icon: Palette, color: 'text-pink-600', bg: 'bg-pink-100' },
  { value: 'graphic-design', label: 'Graphic Design', icon: Layout, color: 'text-rose-600', bg: 'bg-rose-100' },
  { value: 'digital-marketing', label: 'Digital Marketing', icon: Megaphone, color: 'text-orange-600', bg: 'bg-orange-100' },
  { value: 'content-writing', label: 'Content Writing', icon: PenTool, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { value: 'video-editing', label: 'Video Editing', icon: Video, color: 'text-red-600', bg: 'bg-red-100' },
  { value: 'data-science', label: 'Data Science', icon: Cpu, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { value: 'devops', label: 'DevOps', icon: Cloud, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  { value: 'cybersecurity', label: 'Cybersecurity', icon: Shield, color: 'text-amber-600', bg: 'bg-amber-100' },
  { value: 'consulting', label: 'Consulting', icon: Users, color: 'text-violet-600', bg: 'bg-violet-100' },
  { value: 'other', label: 'Other', icon: Briefcase, color: 'text-gray-600', bg: 'bg-gray-100' }
];

// Subcategories
const subcategories: Record<string, { value: string; label: string }[]> = {
  'web-development': [
    { value: 'frontend', label: 'Frontend Development' },
    { value: 'backend', label: 'Backend Development' },
    { value: 'full-stack', label: 'Full Stack Development' },
    { value: 'ecommerce', label: 'E-commerce Development' },
    { value: 'wordpress', label: 'WordPress Development' },
    { value: 'api-development', label: 'API Development' }
  ],
  'mobile-development': [
    { value: 'ios', label: 'iOS Development' },
    { value: 'android', label: 'Android Development' },
    { value: 'react-native', label: 'React Native' },
    { value: 'flutter', label: 'Flutter Development' },
    { value: 'cross-platform', label: 'Cross-platform' }
  ],
  'ui-ux-design': [
    { value: 'web-design', label: 'Web Design' },
    { value: 'mobile-design', label: 'Mobile App Design' },
    { value: 'user-research', label: 'User Research' },
    { value: 'wireframing', label: 'Wireframing' },
    { value: 'prototyping', label: 'Prototyping' }
  ],
  'digital-marketing': [
    { value: 'seo', label: 'SEO' },
    { value: 'social-media', label: 'Social Media Marketing' },
    { value: 'content-marketing', label: 'Content Marketing' },
    { value: 'email-marketing', label: 'Email Marketing' },
    { value: 'ppc', label: 'PPC Advertising' }
  ]
};

// Popular skills suggestions
const popularSkills = [
  'React', 'Node.js', 'TypeScript', 'Python', 'JavaScript',
  'Next.js', 'Vue.js', 'Angular', 'Express', 'MongoDB',
  'PostgreSQL', 'GraphQL', 'AWS', 'Docker', 'Kubernetes',
  'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator',
  'SEO', 'Google Analytics', 'Social Media', 'Content Strategy',
  'UI Design', 'UX Research', 'Prototyping', 'Wireframing'
];

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const id = params.id as string
  
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [language, setLanguage] = useState('en')
  
  const dict = dictionary[language as keyof typeof dictionary]
  
  // Form state
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
    currency: 'USD',
    deadline: '',
    location: '',
    workType: 'remote' as 'remote' | 'onsite' | 'hybrid',
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
    attachments: [] as Array<{ name: string; url: string; type: string }>
  })

  // Calculate progress
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

  // Load project data
  useEffect(() => {
    async function loadProject() {
      try {
        setLoading(true)
        const response = await fetch(`/api/projects/${id}`)
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || dict.loadError)
        }
        
        const data = await response.json()
        
        // Check if user is the owner
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()
        
        if (!session.user?.id || session.user.id !== data.clientId) {
          toast({
            title: dict.unauthorized,
            description: dict.unauthorized,
            variant: 'destructive'
          })
          router.push(`/projects/${id}`)
          return
        }
        
        setProjectData(data)
        
        // Transform and set form data
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
          currency: data.budget?.currency || 'USD',
          deadline: data.deadline ? new Date(data.deadline).toISOString().split('T')[0] : '',
          location: data.location || '',
          workType: 'remote', // Default
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
          attachments: data.attachments || []
        })
        
      } catch (error) {
        console.error('Error loading project:', error)
        toast({
          title: dict.loadError,
          description: error instanceof Error ? error.message : dict.loadError,
          variant: 'destructive'
        })
        router.push(`/projects/${id}`)
      } finally {
        setLoading(false)
      }
    }
    
    loadProject()
  }, [id, router, toast, dict])

  // Handle form changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Add skill
  const addSkill = () => {
    if (formData.newSkill.trim() && !formData.skills.includes(formData.newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, prev.newSkill.trim()],
        newSkill: ''
      }))
    }
  }

  // Remove skill
  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  // Add tag
  const addTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }))
    }
  }

  // Remove tag
  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  // Add deliverable
  const addDeliverable = () => {
    if (formData.newDeliverable.trim()) {
      setFormData(prev => ({
        ...prev,
        deliverables: [...prev.deliverables, prev.newDeliverable.trim()],
        newDeliverable: ''
      }))
    }
  }

  // Remove deliverable
  const removeDeliverable = (deliverable: string) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter(d => d !== deliverable)
    }))
  }

  // Validate form
  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        title: dict.validationError,
        description: dict.titleRequired,
        variant: 'destructive'
      })
      return false
    }
    
    if (!formData.description.trim()) {
      toast({
        title: dict.validationError,
        description: dict.descriptionRequired,
        variant: 'destructive'
      })
      return false
    }
    
    if (!formData.category) {
      toast({
        title: dict.validationError,
        description: dict.categoryRequired,
        variant: 'destructive'
      })
      return false
    }
    
    if (formData.budgetMin <= 0 || formData.budgetMax <= 0) {
      toast({
        title: dict.validationError,
        description: dict.budgetRequired,
        variant: 'destructive'
      })
      return false
    }
    
    if (formData.budgetMin > formData.budgetMax) {
      toast({
        title: dict.validationError,
        description: dict.budgetMinMax,
        variant: 'destructive'
      })
      return false
    }
    
    if (!formData.deadline) {
      toast({
        title: dict.validationError,
        description: dict.deadlineRequired,
        variant: 'destructive'
      })
      return false
    }
    
    if (new Date(formData.deadline) < new Date()) {
      toast({
        title: dict.validationError,
        description: dict.deadlineFuture,
        variant: 'destructive'
      })
      return false
    }
    
    return true
  }

  // Submit form
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
        location: formData.location || undefined,
        visibility: formData.visibility,
        status: formData.status,
        urgency: formData.urgency,
        complexity: formData.complexity,
        featured: formData.featured,
        acceptTeams: formData.acceptTeams,
        enableMilestones: formData.enableMilestones,
        requirements: formData.requirements,
        deliverables: formData.deliverables,
        attachments: formData.attachments
      }
      
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectUpdate),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || dict.updateError)
      }
      
      toast({
        title: dict.updateSuccess,
        description: dict.updateSuccess,
        className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0'
      })
      
      // Refresh and redirect
      setTimeout(() => {
        router.push(`/projects/${id}`)
        router.refresh()
      }, 1500)
      
    } catch (error) {
      console.error('Error updating project:', error)
      toast({
        title: dict.updateError,
        description: error instanceof Error ? error.message : dict.updateError,
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  // Cancel editing
  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push(`/projects/${id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-20 animate-pulse rounded-full"></div>
            <Loader2 className="h-16 w-16 text-blue-600 dark:text-blue-400 animate-spin relative z-10" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Loading Project...
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Preparing your project editor
          </p>
        </div>
      </div>
    )
  }

  const progress = calculateProgress()
  const daysLeft = formData.deadline 
    ? Math.ceil((new Date(formData.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-gray-800/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/projects/${id}`)}
                  className="hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {dict.backToProject}
                </Button>
                <Badge variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                  <Edit3 className="h-3 w-3 mr-1" />
                  Editing
                </Badge>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {dict.pageTitle}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {dict.pageSubtitle}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"
              >
                {dict.cancel}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 shadow-lg hover:shadow-xl"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {dict.saving}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {dict.saveChanges}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Progress & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Progress Card */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {dict.completion}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Project Profile</span>
                    <span className="font-bold text-slate-900 dark:text-white">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">{dict.budgetSet}</span>
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">{dict.timelineSet}</span>
                    {formData.deadline ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">{dict.requirementsComplete}</span>
                    {formData.skills.length > 0 ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-slate-900 dark:text-white">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{dict.skillsCount}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{formData.skills.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{dict.tagsCount}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{formData.tags.length}</span>
                </div>
                
                {formData.deadline && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">{dict.daysLeft}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">{daysLeft}</span>
                  </div>
                )}
                
                {projectData && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-amber-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Applications</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {projectData.applicationCount || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Saved</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {projectData.saveCount || 0}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* AI Assistant */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white dark:from-gray-800 dark:to-gray-900">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  AI Assistant
                </CardTitle>
                <CardDescription>
                  Get suggestions for your project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/30"
                  onClick={() => toast({
                    title: 'Coming Soon',
                    description: 'AI assistant will be available soon!',
                  })}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Optimize Description
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tabs Navigation */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-0">
                <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full justify-start h-14 bg-transparent border-b rounded-none px-6">
                    <TabsTrigger value="basic" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/10 data-[state=active]:to-purple-500/10 rounded-none h-full px-4 border-b-2 border-transparent data-[state=active]:border-blue-500">
                      <FileText className="h-4 w-4 mr-2" />
                      {dict.basicInfo}
                    </TabsTrigger>
                    <TabsTrigger value="budget" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/10 data-[state=active]:to-purple-500/10 rounded-none h-full px-4 border-b-2 border-transparent data-[state=active]:border-blue-500">
                      <DollarSign className="h-4 w-4 mr-2" />
                      {dict.budgetTimeline}
                    </TabsTrigger>
                    <TabsTrigger value="skills" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/10 data-[state=active]:to-purple-500/10 rounded-none h-full px-4 border-b-2 border-transparent data-[state=active]:border-blue-500">
                      <Tag className="h-4 w-4 mr-2" />
                      {dict.skillsTags}
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/10 data-[state=active]:to-purple-500/10 rounded-none h-full px-4 border-b-2 border-transparent data-[state=active]:border-blue-500">
                      <Target className="h-4 w-4 mr-2" />
                      {dict.advancedSettings}
                    </TabsTrigger>
                  </TabsList>

                  {/* Basic Info Tab */}
                  <TabsContent value="basic" className="p-6">
                    <div className="space-y-6">
                      {/* Title */}
                      <div>
                        <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                          {dict.projectTitle}
                        </Label>
                        <Input
                          value={formData.title}
                          onChange={(e) => handleChange('title', e.target.value)}
                          placeholder={dict.titlePlaceholder}
                          className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700"
                        />
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                          <span>{formData.title.length}/200 {dict.characters}</span>
                          <span className={formData.title.length > 180 ? 'text-amber-500' : ''}>
                            {200 - formData.title.length} left
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                          {dict.projectDescription}
                        </Label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => handleChange('description', e.target.value)}
                          placeholder={dict.descriptionPlaceholder}
                          rows={6}
                          className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700"
                        />
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                          <span>{formData.description.length}/5000 {dict.characters}</span>
                          <span className={formData.description.length > 4500 ? 'text-amber-500' : ''}>
                            {5000 - formData.description.length} left
                          </span>
                        </div>
                      </div>

                      {/* Category & Subcategory */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                            {dict.category}
                          </Label>
                          <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                            <SelectTrigger className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  <div className="flex items-center gap-2">
                                    <cat.icon className={`h-4 w-4 ${cat.color}`} />
                                    {cat.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                            {dict.subcategory}
                          </Label>
                          <Select 
                            value={formData.subcategory} 
                            onValueChange={(value) => handleChange('subcategory', value)}
                            disabled={!formData.category || !subcategories[formData.category]?.length}
                          >
                            <SelectTrigger className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700">
                              <SelectValue placeholder="Select subcategory" />
                            </SelectTrigger>
                            <SelectContent>
                              {subcategories[formData.category]?.map((sub) => (
                                <SelectItem key={sub.value} value={sub.value}>
                                  {sub.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Requirements */}
                      <div>
                        <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                          {dict.technicalRequirements}
                        </Label>
                        <Textarea
                          value={formData.requirements}
                          onChange={(e) => handleChange('requirements', e.target.value)}
                          placeholder="List any technical requirements, constraints, or special considerations..."
                          rows={4}
                          className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Budget & Timeline Tab */}
                  <TabsContent value="budget" className="p-6">
                    <div className="space-y-6">
                      {/* Budget Type */}
                      <div>
                        <Label className="text-sm font-medium text-slate-900 dark:text-white mb-3 block">
                          {dict.budgetType}
                        </Label>
                        <RadioGroup 
                          value={formData.budgetType} 
                          onValueChange={(value) => handleChange('budgetType', value as 'fixed' | 'hourly')}
                          className="flex gap-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fixed" id="fixed" />
                            <Label htmlFor="fixed" className="font-medium cursor-pointer">
                              {dict.fixedPrice}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="hourly" id="hourly" />
                            <Label htmlFor="hourly" className="font-medium cursor-pointer">
                              {dict.hourlyRate}
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Budget Range */}
                      <div>
                        <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                          {dict.budgetRange}
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                              {dict.minBudget}
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
                              {dict.maxBudget}
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
                        {formData.budgetMin > formData.budgetMax && (
                          <p className="text-xs text-red-500 mt-2">{dict.budgetMinMax}</p>
                        )}
                      </div>

                      {/* Timeline */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {dict.deadline}
                          </Label>
                          <Input
                            type="date"
                            value={formData.deadline}
                            onChange={(e) => handleChange('deadline', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700"
                          />
                          {daysLeft > 0 && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                              {daysLeft} {dict.daysLeft}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {dict.location}
                          </Label>
                          <Input
                            value={formData.location}
                            onChange={(e) => handleChange('location', e.target.value)}
                            placeholder={dict.locationPlaceholder}
                            className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700"
                          />
                        </div>
                      </div>

                      {/* Work Type */}
                      <div>
                        <Label className="text-sm font-medium text-slate-900 dark:text-white mb-3 block">
                          Work Type
                        </Label>
                        <div className="flex flex-wrap gap-4">
                          <Button
                            type="button"
                            variant={formData.workType === 'remote' ? 'default' : 'outline'}
                            onClick={() => handleChange('workType', 'remote')}
                            className={formData.workType === 'remote' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : ''}
                          >
                            {dict.remoteWork}
                          </Button>
                          <Button
                            type="button"
                            variant={formData.workType === 'onsite' ? 'default' : 'outline'}
                            onClick={() => handleChange('workType', 'onsite')}
                            className={formData.workType === 'onsite' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : ''}
                          >
                            {dict.onSite}
                          </Button>
                          <Button
                            type="button"
                            variant={formData.workType === 'hybrid' ? 'default' : 'outline'}
                            onClick={() => handleChange('workType', 'hybrid')}
                            className={formData.workType === 'hybrid' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : ''}
                          >
                            {dict.hybrid}
                          </Button>
                        </div>
                      </div>

                      {/* Deliverables */}
                      <div>
                        <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                          {dict.deliverables}
                        </Label>
                        <div className="flex gap-2 mb-3">
                          <Input
                            value={formData.newDeliverable}
                            onChange={(e) => handleChange('newDeliverable', e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDeliverable())}
                            placeholder="e.g., Source code, Documentation, Deployment"
                            className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700"
                          />
                          <Button
                            type="button"
                            onClick={addDeliverable}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {formData.deliverables.map((deliverable, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-sm">{deliverable}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDeliverable(deliverable)}
                                className="h-8 w-8 p-0 text-slate-500 hover:text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Skills & Tags Tab */}
                  <TabsContent value="skills" className="p-6">
                    <div className="space-y-6">
                      {/* Skills */}
                      <div>
                        <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                          {dict.skills}
                        </Label>
                        <div className="flex gap-2 mb-4">
                          <div className="relative flex-1">
                            <Input
                              value={formData.newSkill}
                              onChange={(e) => handleChange('newSkill', e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                              placeholder={dict.skillPlaceholder}
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
                            {dict.add}
                          </Button>
                        </div>
                        
                        {/* Popular Skills */}
                        <div className="mb-4">
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Popular skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {popularSkills.map((skill) => (
                              <Badge
                                key={skill}
                                variant={formData.skills.includes(skill) ? 'default' : 'outline'}
                                className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                onClick={() => {
                                  if (formData.skills.includes(skill)) {
                                    removeSkill(skill)
                                  } else {
                                    handleChange('skills', [...formData.skills, skill])
                                  }
                                }}
                              >
                                {skill}
                                {formData.skills.includes(skill) && (
                                  <Check className="h-3 w-3 ml-1" />
                                )}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Selected Skills */}
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
                              <p>No skills added yet</p>
                              <p className="text-sm">Add skills to help freelancers find your project</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      <div>
                        <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                          {dict.tags}
                        </Label>
                        <div className="flex gap-2 mb-3">
                          <Input
                            value={formData.newTag}
                            onChange={(e) => handleChange('newTag', e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            placeholder={dict.tagPlaceholder}
                            className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700"
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
                        
                        {/* Selected Tags */}
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

                  {/* Advanced Settings Tab */}
                  <TabsContent value="advanced" className="p-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Visibility */}
                        <div>
                          <Label className="text-sm font-medium text-slate-900 dark:text-white mb-3 block">
                            {dict.visibility}
                          </Label>
                          <RadioGroup 
                            value={formData.visibility} 
                            onValueChange={(value) => handleChange('visibility', value as 'public' | 'private')}
                            className="space-y-3"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="public" id="public" />
                              <Label htmlFor="public" className="flex items-center gap-2 cursor-pointer">
                                <Globe className="h-4 w-4 text-blue-500" />
                                <div>
                                  <span className="font-medium">{dict.public}</span>
                                  <p className="text-xs text-slate-500">Visible to all freelancers</p>
                                </div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="private" id="private" />
                              <Label htmlFor="private" className="flex items-center gap-2 cursor-pointer">
                                <Lock className="h-4 w-4 text-purple-500" />
                                <div>
                                  <span className="font-medium">{dict.private}</span>
                                  <p className="text-xs text-slate-500">Only by invitation</p>
                                </div>
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Status */}
                        <div>
                          <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                            {dict.status}
                          </Label>
                          <Select value={formData.status} onValueChange={(value) => handleChange('status', value as ProjectData['status'])}>
                            <SelectTrigger className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">{dict.draft}</SelectItem>
                              <SelectItem value="open">{dict.open}</SelectItem>
                              <SelectItem value="in-progress">{dict.inProgress}</SelectItem>
                              <SelectItem value="paused">{dict.paused}</SelectItem>
                              <SelectItem value="completed">{dict.completed}</SelectItem>
                              <SelectItem value="cancelled">{dict.cancelled}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Urgency */}
                        <div>
                          <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                            {dict.urgency}
                          </Label>
                          <Select value={formData.urgency} onValueChange={(value) => handleChange('urgency', value as 'low' | 'medium' | 'high')}>
                            <SelectTrigger className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">{dict.low}</SelectItem>
                              <SelectItem value="medium">{dict.medium}</SelectItem>
                              <SelectItem value="high">{dict.high}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Complexity */}
                        <div>
                          <Label className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                            {dict.complexity}
                          </Label>
                          <Select value={formData.complexity} onValueChange={(value) => handleChange('complexity', value as 'beginner' | 'intermediate' | 'expert')}>
                            <SelectTrigger className="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">{dict.beginner}</SelectItem>
                              <SelectItem value="intermediate">{dict.intermediate}</SelectItem>
                              <SelectItem value="expert">{dict.expert}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Additional Settings */}
                      <Separator />
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium text-slate-900 dark:text-white">
                              {dict.featuredProject}
                            </Label>
                            <p className="text-xs text-slate-500">Highlight your project in search results</p>
                          </div>
                          <Switch
                            checked={formData.featured}
                            onCheckedChange={(checked) => handleChange('featured', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium text-slate-900 dark:text-white">
                              {dict.acceptTeams}
                            </Label>
                            <p className="text-xs text-slate-500">Allow teams to apply for this project</p>
                          </div>
                          <Switch
                            checked={formData.acceptTeams}
                            onCheckedChange={(checked) => handleChange('acceptTeams', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium text-slate-900 dark:text-white">
                              {dict.enableMilestones}
                            </Label>
                            <p className="text-xs text-slate-500">Break project into milestones with payments</p>
                          </div>
                          <Switch
                            checked={formData.enableMilestones}
                            onCheckedChange={(checked) => handleChange('enableMilestones', checked)}
                          />
                        </div>
                      </div>

                      {/* Attachments */}
                      <div>
                        <Label className="text-sm font-medium text-slate-900 dark:text-white mb-3 block">
                          {dict.attachments}
                        </Label>
                        <div className="border-2 border-dashed border-slate-300 dark:border-gray-700 rounded-lg p-8 text-center">
                          <Upload className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                          <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">
                            Drag & drop files or click to upload
                          </p>
                          <p className="text-slate-500 dark:text-slate-500 text-sm mb-4">
                            Supports PDF, DOC, JPG, PNG up to 10MB
                          </p>
                          <Button variant="outline" className="border-slate-300 dark:border-gray-700">
                            <Upload className="h-4 w-4 mr-2" />
                            {dict.upload}
                          </Button>
                        </div>
                        
                        {/* Attachment List */}
                        {formData.attachments.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {formData.attachments.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-slate-500" />
                                  <div>
                                    <p className="font-medium text-sm text-slate-900 dark:text-white">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-slate-500">{file.type}</p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-slate-500 hover:text-red-500"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Important Note */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-2">
                      {dict.importantNote}
                    </h4>
                    <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-400">
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                        <span>{dict.modificationNote}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                        <span>{dict.requiredFieldsNote}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                        <span>{dict.notificationNote}</span>
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