// app/[lang]/support/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import {
  HelpCircle,
  AlertCircle,
  Bug,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  Send,
  Paperclip,
  X,
  FileText,
  Shield,
  Zap,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Search,
  ChevronRight,
  ChevronDown,
  Users,
  LifeBuoy,
  Lightbulb,
  BookOpen,
  Video,
  MessageCircle,
  Target,
  Sparkles,
  Headphones
} from 'lucide-react'

// Types
interface FAQItem {
  _id?: string
  id: string
  question: string
  answer: string
  category: string
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
}

// Composant FAQ amélioré
function FAQSection({ faqs, lang, dict, onFeedback }: { 
  faqs: FAQItem[], 
  lang: Locale, 
  dict: any,
  onFeedback: (faqId: string, helpful: boolean) => void
}) {
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({})

  const handleFeedback = async (faqId: string, helpful: boolean) => {
    if (feedbackGiven[faqId]) return
    setFeedbackGiven(prev => ({ ...prev, [faqId]: true }))
    await onFeedback(faqId, helpful)
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {faqs.map((faq) => (
        <Card key={faq.id} className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <button
            onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
            className="w-full text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <CardHeader className="py-3 sm:py-4 px-4 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm sm:text-base font-semibold line-clamp-2">
                  {faq.question}
                </CardTitle>
                {openFaq === faq.id ? (
                  <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                )}
              </div>
            </CardHeader>
          </button>
          
          {openFaq === faq.id && (
           <CardContent className="pt-0 pb-4 px-4 sm:px-6">
  <div className="whitespace-pre-wrap text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4">
    {faq.answer}
  </div>
  
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
    <span className="text-xs sm:text-sm text-slate-500">
      {dict?.support?.wasThisHelpful || "Cet article vous a-t-il été utile ?"}
    </span>
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleFeedback(faq.id, true)}
        disabled={feedbackGiven[faq.id]}
        className="h-8 gap-1 text-xs"
      >
        <ThumbsUp className="h-3 w-3" />
        {faq.helpful}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleFeedback(faq.id, false)}
        disabled={feedbackGiven[faq.id]}
        className="h-8 gap-1 text-xs"
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

// Composant Formulaire de signalement amélioré
function ProblemReportForm({ dict, lang, onSubmit, isSubmitting, setIsSubmitting }: { 
  dict: any, 
  lang: Locale,
  onSubmit: (report: ProblemReport) => Promise<void>,
  isSubmitting: boolean,
  setIsSubmitting: (value: boolean) => void
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
    os: ''
  })
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
    await onSubmit(report)
    setIsSubmitting(false)
    // Reset form
    setReport({
      type: 'bug',
      title: '',
      description: '',
      severity: 'medium',
      steps: '',
      expectedBehavior: '',
      actualBehavior: '',
      browser: '',
      os: ''
    })
    setSelectedFiles([])
  }

  const problemTypes = [
    { value: 'bug', label: dict?.support?.bug || "Bug", icon: Bug, color: "text-red-500" },
    { value: 'feature', label: dict?.support?.featureRequest || "Fonctionnalité", icon: Lightbulb, color: "text-yellow-500" },
    { value: 'performance', label: dict?.support?.performance || "Performance", icon: Zap, color: "text-orange-500" },
    { value: 'security', label: dict?.support?.security || "Sécurité", icon: Shield, color: "text-green-500" },
    { value: 'usability', label: dict?.support?.usability || "Utilisation", icon: Target, color: "text-purple-500" },
    { value: 'other', label: dict?.support?.other || "Autre", icon: AlertCircle, color: "text-slate-500" }
  ]

  const severityLevels = [
    { value: 'low', label: dict?.support?.low || "Faible", color: "bg-blue-500" },
    { value: 'medium', label: dict?.support?.medium || "Moyenne", color: "bg-yellow-500" },
    { value: 'high', label: dict?.support?.high || "Haute", color: "bg-orange-500" },
    { value: 'critical', label: dict?.support?.critical || "Critique", color: "bg-red-500" }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <Label className="text-xs sm:text-sm font-semibold mb-2 block">
            {dict?.support?.problemType || "Type"} *
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
                    "p-2 sm:p-3 rounded-lg border-2 text-left transition-all",
                    report.type === type.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  )}
                >
                  <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5 mb-1 sm:mb-2", type.color, report.type === type.value ? "opacity-100" : "opacity-60")} />
                  <span className="text-xs sm:text-sm font-medium block">{type.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <Label className="text-xs sm:text-sm font-semibold mb-2 block">
            {dict?.support?.severity || "Sévérité"} *
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {severityLevels.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setReport(prev => ({ ...prev, severity: level.value as any }))}
                className={cn(
                  "p-2 sm:p-3 rounded-lg border-2 text-left transition-all flex items-center gap-2 sm:gap-3",
                  report.severity === level.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-slate-200 dark:border-slate-800"
                )}
              >
                <div className={cn("w-2 h-2 sm:w-3 sm:h-3 rounded-full", level.color)} />
                <span className="text-xs sm:text-sm">{level.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="title" className="text-xs sm:text-sm font-semibold mb-2 block">
          {dict?.support?.title || "Titre"} *
        </Label>
        <Input
          id="title"
          value={report.title}
          onChange={(e) => setReport(prev => ({ ...prev, title: e.target.value }))}
          placeholder={dict?.support?.titlePlaceholder || "Ex: Impossible de télécharger mon CV"}
          className="h-9 sm:h-10 text-sm"
          required
        />
      </div>

      <div>
        <Label htmlFor="description" className="text-xs sm:text-sm font-semibold mb-2 block">
          {dict?.support?.description || "Description"} *
        </Label>
        <Textarea
          id="description"
          value={report.description}
          onChange={(e) => setReport(prev => ({ ...prev, description: e.target.value }))}
          placeholder={dict?.support?.descriptionPlaceholder || "Décrivez le problème en détail..."}
          rows={4}
          className="text-sm"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="browser" className="text-xs sm:text-sm font-semibold mb-2 block">
            {dict?.support?.browser || "Navigateur"}
          </Label>
          <Input
            id="browser"
            value={report.browser}
            onChange={(e) => setReport(prev => ({ ...prev, browser: e.target.value }))}
            placeholder="Chrome, Firefox, Safari..."
            className="h-9 sm:h-10 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="os" className="text-xs sm:text-sm font-semibold mb-2 block">
            {dict?.support?.operatingSystem || "Système d'exploitation"}
          </Label>
          <Input
            id="os"
            value={report.os}
            onChange={(e) => setReport(prev => ({ ...prev, os: e.target.value }))}
            placeholder="Windows, macOS, Linux..."
            className="h-9 sm:h-10 text-sm"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs sm:text-sm font-semibold mb-2 block">
          {dict?.support?.attachments || "Pièces jointes"}
        </Label>
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-3 sm:p-4">
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
            <Paperclip className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400 mb-1 sm:mb-2" />
            <span className="text-xs sm:text-sm text-slate-500 text-center">
              {dict?.support?.dragOrClick || "Cliquez pour ajouter des fichiers"}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 mt-1">
              {dict?.support?.fileFormats || "Images, PDF, TXT (max 10MB)"}
            </span>
          </label>
        </div>
        
        {selectedFiles.length > 0 && (
          <div className="mt-2 sm:mt-3 space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm truncate">{file.name}</span>
                  <span className="text-[10px] sm:text-xs text-slate-500 flex-shrink-0">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded flex-shrink-0"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full h-9 sm:h-10 text-sm">
        {isSubmitting ? (
          <>
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
            {dict?.support?.sending || "Envoi..."}
          </>
        ) : (
          <>
            <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            {dict?.support?.submitReport || "Envoyer"}
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [faqs, setFaqs] = useState<FAQItem[]>([])
  const [loadingFaqs, setLoadingFaqs] = useState(true)
  const [submittingReport, setSubmittingReport] = useState(false)
  const [stats, setStats] = useState({
    supportAvailable: '24/7',
    responseTime: '< 2h',
    satisfaction: '98%',
    problemsSolved: '4'
  })

  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  // Charger les FAQs depuis l'API
  const loadFaqs = useCallback(async () => {
    setLoadingFaqs(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      
      const response = await fetch(`/api/support/faq?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setFaqs(data.faqs.map((faq: any) => ({ ...faq, id: faq._id || faq.id })))
      }
    } catch (error) {
      console.error('Error loading FAQs:', error)
      toast.error(dict?.support?.loadError || "Erreur lors du chargement des FAQs")
    } finally {
      setLoadingFaqs(false)
    }
  }, [searchQuery, selectedCategory, dict])

  useEffect(() => {
    if (dict) {
      loadFaqs()
    }
  }, [loadFaqs, dict])

  // Gérer le feedback sur les FAQs
  const handleFeedback = async (faqId: string, helpful: boolean) => {
    try {
      const response = await fetch('/api/support/faq/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faqId, helpful })
      })
      
      if (response.ok) {
        toast.success(helpful 
          ? dict?.support?.feedbackThanks || "Merci !"
          : dict?.support?.feedbackHelp || "Nous allons améliorer cette réponse")
        // Recharger les FAQs pour mettre à jour les compteurs
        loadFaqs()
      }
    } catch (error) {
      console.error('Error sending feedback:', error)
    }
  }

  // Gérer l'envoi de signalement
  const handleProblemReport = async (report: ProblemReport) => {
    try {
      const response = await fetch('/api/support/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      })
      
      if (response.ok) {
        toast.success(dict?.support?.reportSubmitted || "Signalement envoyé avec succès")
      } else {
        throw new Error('Failed to submit report')
      }
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error(dict?.support?.reportError || "Erreur lors de l'envoi")
      throw error
    }
  }

  const handleCreateTicket = () => {
    router.push(`/${lang}/support/chat`)
  }

  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20 pt-14 sm:pt-16">
      {/* Hero Section - Réduite et plus compacte */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-8 sm:py-12 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto">
            <LifeBuoy className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-90" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
              {dict?.support?.title || "Centre d'aide"}
            </h1>
            <p className="text-sm sm:text-base opacity-90 mb-4 sm:mb-6">
              {dict?.support?.subtitle || "Nous sommes là pour vous aider"}
            </p>
            
            {/* Barre de recherche compacte */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={dict?.support?.searchPlaceholder || "Rechercher..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {/* Stats - Grille responsive compacte */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12">
          {[
            { icon: Headphones, value: stats.supportAvailable, label: dict?.support?.supportAvailable || "Disponible" },
            { icon: Clock, value: stats.responseTime, label: dict?.support?.responseTime || "Réponse moyenne" },
            { icon: ThumbsUp, value: stats.satisfaction, label: dict?.support?.satisfaction || "Satisfaction" },
            { icon: Users, value: stats.problemsSolved, label: dict?.support?.problemsSolved || "Problèmes résolus" }
          ].map((stat, index) => (
            <Card key={index} className="border-slate-200 dark:border-slate-800">
              <CardContent className="py-3 sm:py-4 text-center">
                <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-blue-500" />
                <div className="text-base sm:text-xl font-bold">{stat.value}</div>
                <div className="text-[10px] sm:text-xs text-slate-500">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <TabsTrigger value="faq" className="rounded-md text-xs sm:text-sm py-1.5">
              <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {dict?.support?.faq || "FAQ"}
            </TabsTrigger>
            <TabsTrigger value="report" className="rounded-md text-xs sm:text-sm py-1.5">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {dict?.support?.reportProblem || "Signaler"}
            </TabsTrigger>
            <TabsTrigger value="contact" className="rounded-md text-xs sm:text-sm py-1.5">
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {dict?.support?.contactSupport || "Contact"}
            </TabsTrigger>
          </TabsList>

          {/* Section FAQ */}
          <TabsContent value="faq" className="space-y-4">
            {/* Filtres responsives */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: dict?.support?.all || "Tous" },
                { value: 'account', label: dict?.support?.account || "Compte" },
                { value: 'payment', label: dict?.support?.payment || "Paiement" },
                { value: 'project', label: dict?.support?.project || "Projet" },
                { value: 'freelance', label: dict?.support?.freelance || "Freelance" },
                { value: 'client', label: dict?.support?.client || "Client" }
              ].map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={cn(
                    "px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm transition-all",
                    selectedCategory === cat.value
                      ? "bg-blue-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Liste des FAQs */}
            {loadingFaqs ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="py-4">
                      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : faqs.length > 0 ? (
              <FAQSection faqs={faqs} lang={lang} dict={dict} onFeedback={handleFeedback} />
            ) : (
              <Card className="text-center py-8 sm:py-12">
                <CardContent>
                  <Search className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-slate-400" />
                  <h3 className="font-semibold text-sm sm:text-base mb-2">{dict?.support?.noResults || "Aucun résultat"}</h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {dict?.support?.noResultsDesc || "Essayez avec d'autres mots-clés"}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Lien d'aide supplémentaire */}
            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-none">
              <CardContent className="p-4 sm:p-6 text-center">
                <h3 className="font-semibold text-sm sm:text-base mb-2">
                  {dict?.support?.needMoreHelp || "Besoin d'aide supplémentaire ?"}
                </h3>
                <Button onClick={() => setActiveTab('contact')} variant="outline" size="sm" className="text-xs sm:text-sm">
                  {dict?.support?.contactSupport || "Contacter le support"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Section Signalement */}
          <TabsContent value="report">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">{dict?.support?.reportProblem || "Signaler un problème"}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {dict?.support?.reportDesc || "Décrivez-nous le problème rencontré"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProblemReportForm 
                      dict={dict} 
                      lang={lang} 
                      onSubmit={handleProblemReport}
                      isSubmitting={submittingReport}
                      setIsSubmitting={setSubmittingReport}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{dict?.support?.tips || "Conseils"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      "Soyez précis dans la description",
                      "Ajoutez des captures d'écran",
                      "Indiquez les étapes de reproduction",
                      "Précisez votre navigateur"
                    ].map((tip, i) => (
                      <div key={i} className="flex gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm">{tip}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{dict?.support?.prioritySupport || "Support prioritaire"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3">
                      Pour les problèmes urgents, notre support est disponible 24/7.
                    </p>
                    <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm" onClick={handleCreateTicket}>
                      <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      {dict?.support?.openTicket || "Ticket prioritaire"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Section Contact */}
          <TabsContent value="contact">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    {dict?.support?.emailSupport || "Email"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a href="mailto:support@nrbtalents.com" className="text-blue-600 dark:text-blue-400 font-medium text-sm break-all">
                    support@nrbtalents.com
                  </a>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                    <Clock className="h-3 w-3" />
                    {dict?.support?.responseDelay || "Réponse sous 24-48h"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    {dict?.support?.phoneSupport || "Téléphone"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a href="tel:+261333332642" className="text-green-600 dark:text-green-400 font-medium text-base sm:text-lg">
                    +261 33 33 326 42
                  </a>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                    <Clock className="h-3 w-3" />
                    {dict?.support?.phoneHours || "Lun-Ven: 9h-18h"}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                    {dict?.support?.chatSupport || "Chat en direct"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3">
                    {dict?.support?.chatDesc || "Discutez en temps réel avec un agent"}
                  </p>
                  <Button onClick={handleCreateTicket} size="sm" className="text-xs sm:text-sm">
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    {dict?.support?.startChat || "Démarrer un chat"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Section Ressources - Optionnelle, peut être supprimée pour économiser de l'espace */}
        <div className="mt-8 sm:mt-12">
          <h2 className="text-base sm:text-xl font-bold mb-4 text-center">
            {dict?.support?.resources || "Ressources utiles"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: Video, label: "Tutoriels", color: "text-blue-500" },
              { icon: BookOpen, label: "Documentation", color: "text-green-500" },
              { icon: Users, label: "Communauté", color: "text-purple-500" },
              { icon: Zap, label: "Statut", color: "text-yellow-500" }
            ].map((resource, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="py-3 sm:py-4 text-center">
                  <resource.icon className={cn("h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2", resource.color)} />
                  <p className="text-xs sm:text-sm font-medium">{resource.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}