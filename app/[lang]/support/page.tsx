// app/[lang]/support/page.tsx
'use client'

import { useState,  useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import {
  HelpCircle,
  AlertCircle,
  Bug,
  MessageSquare,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  Send,
  Paperclip,
  X,
  FileText,
  User,
  Calendar,
  Star,
  Shield,
  Zap,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Copy,
  Check,
  Users,
  Briefcase,
  DollarSign,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Laptop,
  Globe,
  Database,
  Server,
  Cloud,
  Wifi,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Edit,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Home,
  Settings,
  UserCog,
  Building,
  CreditCard,
  Wallet,
  Banknote,
  Receipt,
  FileWarning,
  Flame,
  AlertTriangle,
  Info,
  Lightbulb,
  BookOpen,
  Video,
  Headphones,
  MessageCircle,
  LifeBuoy,
  Award,
  Target,
  Heart,
  ShieldCheck
} from 'lucide-react'

// Types
interface SupportTicket {
  id: string
  subject: string
  category: SupportCategory
  priority: Priority
  status: TicketStatus
  description: string
  attachments?: string[]
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  messages: TicketMessage[]
}

interface TicketMessage {
  id: string
  content: string
  isFromUser: boolean
  createdAt: string
  attachments?: string[]
}

type SupportCategory = 
  | 'technical'
  | 'billing'
  | 'project'
  | 'account'
  | 'payment'
  | 'freelance'
  | 'client'
  | 'other'

type Priority = 'low' | 'medium' | 'high' | 'urgent'
type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: SupportCategory
  helpful: number
  notHelpful: number
}

interface ProblemReport {
  type: 'bug' | 'feature' | 'performance' | 'security' | 'usability' | 'other'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  steps?: string
  expectedBehavior?: string
  actualBehavior?: string
  browser?: string
  os?: string
  screenshots?: string[]
}

// Composant FAQ
function FAQSection({ faqs, lang, dict }: { faqs: FAQItem[], lang: Locale, dict: any }) {
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({})

  const handleFeedback = async (faqId: string, helpful: boolean) => {
    if (feedbackGiven[faqId]) return
    
    try {
      await fetch('/api/support/faq/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faqId, helpful })
      })
      
      setFeedbackGiven(prev => ({ ...prev, [faqId]: true }))
      toast.success(helpful 
        ? dict?.support?.feedbackThanks || "Merci pour votre retour !"
        : dict?.support?.feedbackHelp || "Nous allons améliorer cette réponse")
    } catch (error) {
      console.error('Error sending feedback:', error)
    }
  }

  return (
    <div className="space-y-4">
      {faqs.map((faq) => (
        <Card key={faq.id} className="border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
            className="w-full text-left"
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base sm:text-lg font-semibold">
                {faq.question}
              </CardTitle>
              {openFaq === faq.id ? (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-slate-400" />
              )}
            </CardHeader>
          </button>
          
          {openFaq === faq.id && (
            <CardContent className="pt-0">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {faq.answer}
              </p>
              
              <div className="flex items-center gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-sm text-slate-500">
                  {dict?.support?.wasThisHelpful || "Cet article vous a-t-il été utile ?"}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeedback(faq.id, true)}
                    disabled={feedbackGiven[faq.id]}
                    className="gap-1"
                  >
                    <ThumbsUp className="h-3 w-3" />
                    {faq.helpful}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeedback(faq.id, false)}
                    disabled={feedbackGiven[faq.id]}
                    className="gap-1"
                  >
                    <ThumbsDown className="h-3 w-3" />
                    {faq.notHelpful}
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}

// Composant Formulaire de signalement
function ProblemReportForm({ dict, lang, onSubmit }: { 
  dict: any, 
  lang: Locale,
  onSubmit: (report: ProblemReport) => void 
}) {
  const [report, setReport] = useState<ProblemReport>({
    type: 'bug',
    title: '',
    description: '',
    severity: 'medium',
    steps: '',
    expectedBehavior: '',
    actualBehavior: '',
    browser: '',
    os: '',
    screenshots: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setSelectedFiles(prev => [...prev, ...files])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Simuler l'envoi
      await new Promise(resolve => setTimeout(resolve, 1000))
      onSubmit(report)
      toast.success(dict?.support?.reportSubmitted || "Signalement envoyé avec succès")
    } catch (error) {
      toast.error(dict?.support?.reportError || "Erreur lors de l'envoi")
    } finally {
      setIsSubmitting(false)
    }
  }

  const problemTypes = [
    { value: 'bug', label: dict?.support?.bug || "Bug technique", icon: Bug },
    { value: 'feature', label: dict?.support?.featureRequest || "Demande de fonctionnalité", icon: Lightbulb },
    { value: 'performance', label: dict?.support?.performance || "Problème de performance", icon: Zap },
    { value: 'security', label: dict?.support?.security || "Problème de sécurité", icon: Shield },
    { value: 'usability', label: dict?.support?.usability || "Problème d'utilisation", icon: Target },
    { value: 'other', label: dict?.support?.other || "Autre", icon: AlertCircle }
  ]

  const severityLevels = [
    { value: 'low', label: dict?.support?.low || "Faible", color: "bg-blue-500" },
    { value: 'medium', label: dict?.support?.medium || "Moyenne", color: "bg-yellow-500" },
    { value: 'high', label: dict?.support?.high || "Haute", color: "bg-orange-500" },
    { value: 'critical', label: dict?.support?.critical || "Critique", color: "bg-red-500" }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Type de problème */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">
            {dict?.support?.problemType || "Type de problème"} *
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {problemTypes.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setReport(prev => ({ ...prev, type: type.value as any }))}
                  className={cn(
                    "p-3 rounded-lg border-2 text-left transition-all",
                    report.type === type.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 mb-2",
                    report.type === type.value ? "text-blue-500" : "text-slate-400"
                  )} />
                  <span className="text-sm font-medium block">{type.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Sévérité */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">
            {dict?.support?.severity || "Sévérité"} *
          </Label>
          <div className="space-y-2">
            {severityLevels.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setReport(prev => ({ ...prev, severity: level.value as any }))}
                className={cn(
                  "w-full p-2 rounded-lg border text-left transition-all flex items-center gap-3",
                  report.severity === level.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-slate-200 dark:border-slate-800"
                )}
              >
                <div className={cn("w-3 h-3 rounded-full", level.color)} />
                <span className="text-sm">{level.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Titre */}
      <div>
        <Label htmlFor="title" className="text-sm font-semibold mb-2 block">
          {dict?.support?.title || "Titre"} *
        </Label>
        <Input
          id="title"
          value={report.title}
          onChange={(e) => setReport(prev => ({ ...prev, title: e.target.value }))}
          placeholder={dict?.support?.titlePlaceholder || "Ex: Impossible de télécharger mon CV"}
          required
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description" className="text-sm font-semibold mb-2 block">
          {dict?.support?.description || "Description"} *
        </Label>
        <Textarea
          id="description"
          value={report.description}
          onChange={(e) => setReport(prev => ({ ...prev, description: e.target.value }))}
          placeholder={dict?.support?.descriptionPlaceholder || "Décrivez le problème en détail..."}
          rows={4}
          required
        />
      </div>

      {/* Étapes de reproduction */}
      <div>
        <Label htmlFor="steps" className="text-sm font-semibold mb-2 block">
          {dict?.support?.stepsToReproduce || "Étapes pour reproduire"}
        </Label>
        <Textarea
          id="steps"
          value={report.steps}
          onChange={(e) => setReport(prev => ({ ...prev, steps: e.target.value }))}
          placeholder={dict?.support?.stepsPlaceholder || "1. Aller sur...\n2. Cliquer sur...\n3. Observer l'erreur..."}
          rows={3}
        />
      </div>

      {/* Comportement attendu vs réel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expected" className="text-sm font-semibold mb-2 block">
            {dict?.support?.expectedBehavior || "Comportement attendu"}
          </Label>
          <Textarea
            id="expected"
            value={report.expectedBehavior}
            onChange={(e) => setReport(prev => ({ ...prev, expectedBehavior: e.target.value }))}
            placeholder={dict?.support?.expectedPlaceholder || "Ce qui devrait se produire..."}
            rows={2}
          />
        </div>
        <div>
          <Label htmlFor="actual" className="text-sm font-semibold mb-2 block">
            {dict?.support?.actualBehavior || "Comportement réel"}
          </Label>
          <Textarea
            id="actual"
            value={report.actualBehavior}
            onChange={(e) => setReport(prev => ({ ...prev, actualBehavior: e.target.value }))}
            placeholder={dict?.support?.actualPlaceholder || "Ce qui se produit réellement..."}
            rows={2}
          />
        </div>
      </div>

      {/* Informations système */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="browser" className="text-sm font-semibold mb-2 block">
            {dict?.support?.browser || "Navigateur"}
          </Label>
          <Input
            id="browser"
            value={report.browser}
            onChange={(e) => setReport(prev => ({ ...prev, browser: e.target.value }))}
            placeholder="Chrome 120, Firefox 121, Safari 17..."
          />
        </div>
        <div>
          <Label htmlFor="os" className="text-sm font-semibold mb-2 block">
            {dict?.support?.operatingSystem || "Système d'exploitation"}
          </Label>
          <Input
            id="os"
            value={report.os}
            onChange={(e) => setReport(prev => ({ ...prev, os: e.target.value }))}
            placeholder="Windows 11, macOS Sonoma, iOS 17..."
          />
        </div>
      </div>

      {/* Pièces jointes */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">
          {dict?.support?.attachments || "Pièces jointes"}
        </Label>
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.txt"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <Paperclip className="h-8 w-8 text-slate-400 mb-2" />
            <span className="text-sm text-slate-500">
              {dict?.support?.dragOrClick || "Glissez-déposez ou cliquez pour ajouter des fichiers"}
            </span>
            <span className="text-xs text-slate-400 mt-1">
              {dict?.support?.fileFormats || "Images, PDF, TXT (max 10MB)"}
            </span>
          </label>
        </div>
        
        {selectedFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-slate-500">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {dict?.support?.sending || "Envoi en cours..."}
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            {dict?.support?.submitReport || "Envoyer le signalement"}
          </>
        )}
      </Button>
    </form>
  )
}

// Composant principal
export default function SupportPage() {
  const { data: session } = useSession()
  const params = useParams()
  const lang = params.lang as Locale
  const router = useRouter()
  
  const [dict, setDict] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('faq')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<SupportCategory | 'all'>('all')
  
  // Données mockées pour l'exemple
  const faqs: FAQItem[] = [
    {
      id: '1',
      question: "Comment créer un compte freelance ?",
      answer: "Pour créer un compte freelance, cliquez sur 'S'inscrire' en haut à droite, choisissez 'Freelance', remplissez vos informations personnelles, puis complétez votre profil avec vos compétences, expériences et portfolio. Une fois vérifié, vous pourrez commencer à postuler aux projets.",
      category: 'account',
      helpful: 45,
      notHelpful: 3
    },
    {
      id: '2',
      question: "Comment fonctionne le système de paiement ?",
      answer: "Nrbtalents utilise un système de paiement sécurisé. Les clients déposent les fonds sur un compte séquestre. Une fois le projet validé, les fonds sont libérés automatiquement au freelance. Des frais de service de 10% sont appliqués sur chaque transaction.",
      category: 'payment',
      helpful: 38,
      notHelpful: 5
    },
    {
      id: '3',
      question: "Comment signaler un problème sur un projet ?",
      answer: "Vous pouvez signaler un problème via le tableau de bord du projet > 'Signaler un problème'. Notre équipe de médiation interviendra dans les 24h pour résoudre le litige. Pour les urgences, utilisez notre support prioritaire.",
      category: 'project',
      helpful: 52,
      notHelpful: 2
    },
    {
      id: '4',
      question: "Puis-je modifier mon CV après soumission ?",
      answer: "Oui, vous pouvez modifier votre CV à tout moment depuis votre profil freelance. Les clients verront toujours la dernière version. Nous vous recommandons de maintenir votre CV à jour pour maximiser vos chances.",
      category: 'freelance',
      helpful: 41,
      notHelpful: 1
    },
    {
      id: '5',
      question: "Comment obtenir le statut 'Vérifié' ?",
      answer: "Le statut 'Vérifié' est accordé après validation de votre identité (pièce d'identité) et vérification de vos compétences via des tests ou certifications. Les freelances vérifiés bénéficient d'une meilleure visibilité.",
      category: 'account',
      helpful: 33,
      notHelpful: 4
    },
    {
      id: '6',
      question: "Que faire en cas de non-paiement ?",
      answer: "En cas de non-paiement, contactez notre support immédiatement. Tous les paiements sont protégés par notre système de séquestre. Nous enquêtons et prenons les mesures nécessaires, y compris la suspension du compte client.",
      category: 'payment',
      helpful: 47,
      notHelpful: 6
    }
  ]

  // Filtrer les FAQs
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  const handleProblemReport = (report: ProblemReport) => {
    console.log('Problem report:', report)
    // Ici, envoyer au backend
  }

  const handleCreateTicket = () => {
    // Rediriger vers le chat de support
    router.push(`/${lang}/support/chat`)
  }

  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20 pt-16">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-16 lg:py-24">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <LifeBuoy className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              {dict?.support?.title || "Centre d'aide Nrbtalents"}
            </h1>
            <p className="text-lg sm:text-xl opacity-90 mb-8">
              {dict?.support?.subtitle || "Nous sommes là pour vous aider. Trouvez des réponses ou contactez notre équipe."}
            </p>
            
            {/* Barre de recherche */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder={dict?.support?.searchPlaceholder || "Rechercher une aide, une question..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Statistiques de support */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="text-center border-slate-200 dark:border-slate-800">
            <CardContent className="pt-6">
              <Headphones className="h-8 w-8 mx-auto mb-3 text-blue-500" />
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm text-slate-500">{dict?.support?.supportAvailable || "Support disponible"}</div>
            </CardContent>
          </Card>
          <Card className="text-center border-slate-200 dark:border-slate-800">
            <CardContent className="pt-6">
              <Clock className="h-8 w-8 mx-auto mb-3 text-green-500" />
              <div className="text-2xl font-bold">&lt; 2h</div>
              <div className="text-sm text-slate-500">{dict?.support?.responseTime || "Temps de réponse moyen"}</div>
            </CardContent>
          </Card>
          <Card className="text-center border-slate-200 dark:border-slate-800">
            <CardContent className="pt-6">
              <ThumbsUp className="h-8 w-8 mx-auto mb-3 text-yellow-500" />
              <div className="text-2xl font-bold">98%</div>
              <div className="text-sm text-slate-500">{dict?.support?.satisfaction || "Satisfaction client"}</div>
            </CardContent>
          </Card>
          <Card className="text-center border-slate-200 dark:border-slate-800">
            <CardContent className="pt-6">
              <Users className="h-8 w-8 mx-auto mb-3 text-purple-500" />
              <div className="text-2xl font-bold">15k+</div>
              <div className="text-sm text-slate-500">{dict?.support?.problemsSolved || "Problèmes résolus"}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <TabsTrigger value="faq" className="rounded-lg">
              <HelpCircle className="h-4 w-4 mr-2" />
              {dict?.support?.faq || "FAQ"}
            </TabsTrigger>
            <TabsTrigger value="report" className="rounded-lg">
              <AlertCircle className="h-4 w-4 mr-2" />
              {dict?.support?.reportProblem || "Signaler un problème"}
            </TabsTrigger>
            <TabsTrigger value="contact" className="rounded-lg">
              <MessageCircle className="h-4 w-4 mr-2" />
              {dict?.support?.contactSupport || "Contacter le support"}
            </TabsTrigger>
          </TabsList>

          {/* Section FAQ */}
          <TabsContent value="faq" className="space-y-6">
            {/* Filtres */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm transition-all",
                    selectedCategory === 'all'
                      ? "bg-blue-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  )}
                >
                  {dict?.support?.all || "Tous"}
                </button>
                <button
                  onClick={() => setSelectedCategory('account')}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm transition-all",
                    selectedCategory === 'account'
                      ? "bg-blue-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  )}
                >
                  {dict?.support?.account || "Compte"}
                </button>
                <button
                  onClick={() => setSelectedCategory('payment')}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm transition-all",
                    selectedCategory === 'payment'
                      ? "bg-blue-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  )}
                >
                  {dict?.support?.payment || "Paiement"}
                </button>
                <button
                  onClick={() => setSelectedCategory('project')}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm transition-all",
                    selectedCategory === 'project'
                      ? "bg-blue-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  )}
                >
                  {dict?.support?.project || "Projet"}
                </button>
              </div>
            </div>

            {/* Liste des FAQs */}
            {filteredFaqs.length > 0 ? (
              <FAQSection faqs={filteredFaqs} lang={lang} dict={dict} />
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Search className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="font-semibold mb-2">{dict?.support?.noResults || "Aucun résultat trouvé"}</h3>
                  <p className="text-slate-500">
                    {dict?.support?.noResultsDesc || "Essayez avec d'autres mots-clés ou contactez notre support"}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Lien vers plus de ressources */}
            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-none">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold mb-2">
                  {dict?.support?.needMoreHelp || "Vous n'avez pas trouvé votre réponse ?"}
                </h3>
                <Button onClick={() => setActiveTab('contact')} variant="outline">
                  {dict?.support?.contactSupport || "Contacter le support"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Section Signalement de problème */}
          <TabsContent value="report">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{dict?.support?.reportProblem || "Signaler un problème"}</CardTitle>
                    <CardDescription>
                      {dict?.support?.reportDesc || "Décrivez-nous le problème rencontré pour que nous puissions vous aider rapidement"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProblemReportForm dict={dict} lang={lang} onSubmit={handleProblemReport} />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{dict?.support?.tips || "Conseils"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">Soyez le plus précis possible dans la description</p>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">Ajoutez des captures d'écran si possible</p>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">Indiquez les étapes précises pour reproduire l'erreur</p>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">Précisez votre navigateur et système d'exploitation</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{dict?.support?.prioritySupport || "Support prioritaire"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Pour les problèmes urgents, notre support prioritaire est disponible 24/7.
                    </p>
                    <Button variant="outline" className="w-full" onClick={handleCreateTicket}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {dict?.support?.openTicket || "Ouvrir un ticket prioritaire"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Section Contact Support */}
          <TabsContent value="contact">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-500" />
                    {dict?.support?.emailSupport || "Support par email"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-400">
                    {dict?.support?.emailDesc || "Pour les questions générales et les demandes non urgentes"}
                  </p>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <a href="mailto:support@nrbtalents.com" className="text-blue-600 dark:text-blue-400 font-medium">
                      support@nrbtalents.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="h-4 w-4" />
                    {dict?.support?.responseDelay || "Réponse sous 24-48h ouvrées"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-green-500" />
                    {dict?.support?.phoneSupport || "Support téléphonique"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-400">
                    {dict?.support?.phoneDesc || "Pour les urgences et les demandes prioritaires"}
                  </p>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <a href="tel:+261333332642" className="text-green-600 dark:text-green-400 font-medium text-lg">
                   +261 33 33 326 42
                    </a>
                  </div>
                  <div className="space-y-2 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {dict?.support?.phoneHours || "Lun-Ven: 9h-18h (heure de Paris)"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {dict?.support?.priorityNumber || "Numéro prioritaire pour les clients premium"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-purple-500" />
                    {dict?.support?.chatSupport || "Chat en direct"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {dict?.support?.chatDesc || "Discutez en temps réel avec un agent de support"}
                  </p>
                  <Button onClick={handleCreateTicket} className="w-full sm:w-auto">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {dict?.support?.startChat || "Démarrer un chat"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Section Resources */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {dict?.support?.resources || "Ressources utiles"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Video className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                <h3 className="font-semibold mb-1">{dict?.support?.videoTutorials || "Tutoriels vidéo"}</h3>
                <p className="text-sm text-slate-500">{dict?.support?.watchGuides || "Regardez nos guides"}</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <BookOpen className="h-8 w-8 mx-auto mb-3 text-green-500" />
                <h3 className="font-semibold mb-1">{dict?.support?.documentation || "Documentation"}</h3>
                <p className="text-sm text-slate-500">{dict?.support?.readDocs || "Guide complet"}</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-3 text-purple-500" />
                <h3 className="font-semibold mb-1">{dict?.support?.community || "Communauté"}</h3>
                <p className="text-sm text-slate-500">{dict?.support?.askCommunity || "Échangez avec d'autres"}</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Zap className="h-8 w-8 mx-auto mb-3 text-yellow-500" />
                <h3 className="font-semibold mb-1">{dict?.support?.statusPage || "Statut du service"}</h3>
                <p className="text-sm text-slate-500">{dict?.support?.checkStatus || "Disponibilité des services"}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}