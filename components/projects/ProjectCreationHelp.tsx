// components/projects/ProjectCreationHelp.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  HelpCircle,
  Sparkles,
  DollarSign,
  Calendar,
  Tag,
  Shield,
  FileText,
  CheckCircle2,
  X,
  Lightbulb,
  Briefcase,
  Star,
  ArrowRight,
  Check,
  AlertCircle,
  Info,
  TrendingUp,
  Clock,
  MapPin,
  Users,
  MessageCircle,
  Award,
  Rocket,
  Target,
  Zap
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'

interface ProjectCreationHelpProps {
  dict: any
  lang: string
  currentStep?: number
  onTipClick?: (tip: string) => void
}

export function ProjectCreationHelp({ dict, lang, currentStep = 1, onTipClick }: ProjectCreationHelpProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('tips')

  const helpT = dict?.help || {
    title: "Aide à la création de projet",
    description: "Conseils et bonnes pratiques pour créer un projet attractif",
    tips: "Conseils",
    examples: "Exemples",
    checklist: "Checklist",
    bestPractices: "Bonnes pratiques",
    commonMistakes: "Erreurs à éviter",
    footer: "Des questions ? Contactez notre support"
  }

  const tips = [
    {
      step: 1,
      icon: <FileText className="h-4 w-4" />,
      title: "Titre accrocheur",
      description: "Utilisez des mots-clés pertinents et soyez spécifique.",
      example: "✅ 'Développeur React pour application e-commerce'",
      badExample: "❌ 'Cherche développeur'",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800"
    },
    {
      step: 1,
      icon: <FileText className="h-4 w-4" />,
      title: "Description détaillée",
      description: "Décrivez objectifs, fonctionnalités, contraintes techniques et livrables.",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800"
    },
    {
      step: 1,
      icon: <Tag className="h-4 w-4" />,
      title: "Choisissez la bonne catégorie",
      description: "Sélectionnez la catégorie la plus pertinente pour attirer les bons freelances.",
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/30",
      border: "border-purple-200 dark:border-purple-800"
    },
    {
      step: 2,
      icon: <DollarSign className="h-4 w-4" />,
      title: "Budget réaliste",
      description: "Proposez un budget basé sur la complexité du projet.",
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-200 dark:border-green-800"
    },
    {
      step: 2,
      icon: <Calendar className="h-4 w-4" />,
      title: "Délai réaliste",
      description: "Prévoyez une marge pour les imprévus.",
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      border: "border-orange-200 dark:border-orange-800"
    },
    {
      step: 3,
      icon: <Sparkles className="h-4 w-4" />,
      title: "Compétences claires",
      description: "Listez les compétences indispensables, soyez précis mais pas trop restrictif.",
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/30",
      border: "border-purple-200 dark:border-purple-800"
    },
    {
      step: 4,
      icon: <Shield className="h-4 w-4" />,
      title: "Visibilité",
      description: "Les projets publics attirent plus de candidatures.",
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800"
    }
  ]

  const examples = {
    titles: [
      { text: "Développement d'une application mobile React Native pour startup fintech", type: "good" },
      { text: "Création d'un site e-commerce Shopify avec intégration API", type: "good" },
      { text: "Refonte UI/UX d'une application SaaS existante", type: "good" },
      { text: "Cherche développeur", type: "bad" },
      { text: "Besoin d'un site web", type: "bad" },
      { text: "Projet urgent", type: "bad" }
    ],
    budgets: [
      { project: "Site vitrine simple", range: "500€ - 1 500€" },
      { project: "Site e-commerce", range: "2 000€ - 8 000€" },
      { project: "Application mobile", range: "3 000€ - 15 000€" },
      { project: "Plateforme SaaS complexe", range: "10 000€ - 50 000€" }
    ],
    skills: [
      "React, TypeScript, Tailwind CSS",
      "Node.js, Express, MongoDB",
      "Python, Django, PostgreSQL",
      "Figma, Adobe XD, UI/UX Design"
    ]
  }

  const checklist = [
    { step: 1, item: "Titre clair et descriptif", icon: "📝", completed: false },
    { step: 1, item: "Description détaillée (+200 caractères)", icon: "📄", completed: false },
    { step: 1, item: "Catégorie et sous-catégorie sélectionnées", icon: "🏷️", completed: false },
    { step: 2, item: "Budget défini (min et max)", icon: "💰", completed: false },
    { step: 2, item: "Date limite réaliste", icon: "📅", completed: false },
    { step: 3, item: "Au moins 3 compétences requises", icon: "⚡", completed: false },
    { step: 3, item: "Tags pertinents ajoutés", icon: "🔖", completed: false },
    { step: 4, item: "Visibilité choisie", icon: "👁️", completed: false }
  ]

  const bestPractices = [
    { title: "Transparence financière", description: "Soyez clair sur le budget et les modalités de paiement", icon: "💰" },
    { title: "Livrables détaillés", description: "Listez précisément ce qui est attendu", icon: "📦" },
    { title: "Technologies préférées", description: "Indiquez votre stack technique idéale", icon: "💻" },
    { title: "Flexibilité de travail", description: "Précisez si le télétravail est accepté", icon: "🏠" },
    { title: "Documents annexes", description: "Partagez des maquettes ou cahier des charges", icon: "📎" },
    { title: "Réactivité", description: "Répondez rapidement aux candidatures", icon: "⚡" }
  ]

  const commonMistakes = [
    { title: "Budget vague", description: "Évitez 'négociable' ou des fourchettes trop larges", icon: "🎯" },
    { title: "Description courte", description: "Une description floue attire des candidatures inadaptées", icon: "📝" },
    { title: "Délai irréaliste", description: "Sous-estimer le temps compromet la qualité", icon: "⏰" },
    { title: "Trop de compétences", description: "Lister 10+ compétences peut rebuter les candidats", icon: "🎓" },
    { title: "Absence de réponse", description: "Ne pas répondre aux candidatures nuit à votre réputation", icon: "💬" },
    { title: "Changements en cours", description: "Modifier les exigences après le début du projet est problématique", icon: "🔄" }
  ]

  const getStepColor = (step: number) => {
    if (currentStep === step) return "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20"
    if (currentStep > step) return "border-green-500 bg-green-50/50 dark:bg-green-950/20"
    return "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
  }

  const getStepIcon = (step: number) => {
    if (currentStep > step) return <Check className="h-4 w-4 text-green-500" />
    if (currentStep === step) return <Target className="h-4 w-4 text-purple-500" />
    return <Clock className="h-4 w-4 text-gray-400" />
  }

  const getStepBadge = (step: number) => {
    if (currentStep === step) return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
    if (currentStep > step) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
  }

  const progressValue = (currentStep / 4) * 100

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsOpen(true)}
              className="fixed bottom-20 right-6 z-40 h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 text-white hover:scale-110 transition-transform duration-200"
            >
              <HelpCircle className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-gray-900 text-white">
            <p>Aide à la création de projet</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] flex flex-col p-0 rounded-2xl overflow-hidden">
          {/* Header avec progression */}
          <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg shadow-purple-500/25">
                  <Rocket className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                    {helpT.title || "Assistant création de projet"}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {helpT.description || "Conseils et bonnes pratiques pour un projet réussi"}
                  </p>
                </div>
              </div>
              <Badge className={`${getStepBadge(currentStep)} px-3 py-1`}>
                Étape {currentStep}/4
              </Badge>
            </div>
            
            {/* Barre de progression */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Départ</span>
                <span>Description</span>
                <span>Budget</span>
                <span>Compétences</span>
                <span>Finalisation</span>
              </div>
              <Progress value={progressValue} className="h-2 bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="px-6 pt-4 pb-2 border-b border-gray-200 dark:border-gray-800">
                <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                  <TabsTrigger value="tips" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 rounded-lg px-4">
                    <Lightbulb className="h-4 w-4" />
                    <span className="hidden sm:inline">{helpT.tips || "Conseils"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="examples" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 rounded-lg px-4">
                    <Briefcase className="h-4 w-4" />
                    <span className="hidden sm:inline">{helpT.examples || "Exemples"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="checklist" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 rounded-lg px-4">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{helpT.checklist || "Checklist"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="bestpractices" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 rounded-lg px-4">
                    <Star className="h-4 w-4" />
                    <span className="hidden sm:inline">{helpT.bestPractices || "Bonnes pratiques"}</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 px-6 py-4 custom-scrollbar">
                {/* Tips Tab */}
                <TabsContent value="tips" className="m-0 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tips.map((tip, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border ${tip.border} ${getStepColor(tip.step)} cursor-pointer transition-all duration-200 hover:shadow-md group`}
                        onClick={() => {
                          if (onTipClick) onTipClick(tip.title)
                          setIsOpen(false)
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${tip.bg} ${tip.color} group-hover:scale-110 transition-transform`}>
                            {tip.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">{tip.title}</h4>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                Étape {tip.step}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tip.description}</p>
                            {tip.example && (
                              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                {tip.example}
                              </div>
                            )}
                            {tip.badExample && (
                              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                {tip.badExample}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Examples Tab */}
                <TabsContent value="examples" className="m-0 space-y-6">
                  {/* Titres */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      Exemples de titres
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {examples.titles.map((title, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg flex items-center gap-3 ${
                            title.type === 'good'
                              ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                              : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {title.type === 'good' ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <p className={`text-sm ${
                            title.type === 'good'
                              ? 'text-green-800 dark:text-green-300'
                              : 'text-red-800 dark:text-red-300'
                          }`}>
                            {title.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Budgets */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      Fourchettes de budget indicatives
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {examples.budgets.map((budget, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 border border-gray-200 dark:border-gray-700"
                        >
                          <p className="font-medium text-gray-900 dark:text-white">{budget.project}</p>
                          <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">{budget.range}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Compétences */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      Exemples de compétences
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {examples.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-sm py-2 px-3 bg-gray-100 dark:bg-gray-800">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Checklist Tab */}
                <TabsContent value="checklist" className="m-0">
                  <div className="space-y-3">
                    {checklist.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.item}</p>
                        </div>
                        <Badge variant="outline" className="text-xs bg-white dark:bg-gray-900">
                          Étape {item.step}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Best Practices Tab */}
                <TabsContent value="bestpractices" className="m-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <Award className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="font-semibold text-green-800 dark:text-green-300">
                          Bonnes pratiques
                        </h3>
                      </div>
                      <ul className="space-y-3">
                        {bestPractices.map((practice, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-lg flex-shrink-0">{practice.icon}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{practice.title}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{practice.description}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="font-semibold text-red-800 dark:text-red-300">
                          Erreurs à éviter
                        </h3>
                      </div>
                      <ul className="space-y-3">
                        {commonMistakes.map((mistake, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-lg flex-shrink-0">{mistake.icon}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{mistake.title}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{mistake.description}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>Conseils basés sur l'analyse de +10 000 projets réussis</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400"
              >
                Fermer
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </>
  )
}