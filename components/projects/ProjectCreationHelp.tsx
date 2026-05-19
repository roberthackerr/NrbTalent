// components/projects/ProjectCreationHelp.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
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
  Users,
  Award,
  Rocket,
  Target,
  Zap,
  Menu,
  XCircle
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ProjectCreationHelpProps {
  dict: any
  lang: string
  currentStep?: number
  onTipClick?: (tip: string) => void
}

export function ProjectCreationHelp({ dict, lang, currentStep = 1, onTipClick }: ProjectCreationHelpProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('tips')
  const [isMobile, setIsMobile] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
      bg: "bg-blue-50 dark:bg-blue-950/30"
    },
    {
      step: 1,
      icon: <FileText className="h-4 w-4" />,
      title: "Description détaillée",
      description: "Décrivez objectifs, fonctionnalités, contraintes techniques et livrables.",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30"
    },
    {
      step: 1,
      icon: <Tag className="h-4 w-4" />,
      title: "Catégorie pertinente",
      description: "Sélectionnez la catégorie qui correspond le mieux à votre projet.",
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/30"
    },
    {
      step: 2,
      icon: <DollarSign className="h-4 w-4" />,
      title: "Budget réaliste",
      description: "Proposez un budget basé sur la complexité du projet.",
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-950/30"
    },
    {
      step: 2,
      icon: <Calendar className="h-4 w-4" />,
      title: "Délai réaliste",
      description: "Prévoyez une marge de sécurité dans vos délais.",
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950/30"
    },
    {
      step: 3,
      icon: <Sparkles className="h-4 w-4" />,
      title: "Compétences claires",
      description: "Listez les compétences indispensables pour le projet.",
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/30"
    },
    {
      step: 4,
      icon: <Shield className="h-4 w-4" />,
      title: "Visibilité adaptée",
      description: "Public pour plus de candidatures, Privé pour des freelances ciblés.",
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/30"
    }
  ]

  const examples = {
    titles: [
      { text: "Développement d'une application mobile React Native pour startup fintech", type: "good" },
      { text: "Création d'un site e-commerce Shopify avec intégration API", type: "good" },
      { text: "Refonte UI/UX d'une application SaaS", type: "good" },
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
      "Figma, Adobe XD"
    ]
  }

  const checklist = [
    { step: 1, item: "Titre clair et descriptif", icon: "📝" },
    { step: 1, item: "Description détaillée (+200 caractères)", icon: "📄" },
    { step: 1, item: "Catégorie sélectionnée", icon: "🏷️" },
    { step: 2, item: "Budget défini (min et max)", icon: "💰" },
    { step: 2, item: "Date limite réaliste", icon: "📅" },
    { step: 3, item: "Au moins 3 compétences requises", icon: "⚡" },
    { step: 3, item: "Tags pertinents", icon: "🔖" },
    { step: 4, item: "Visibilité choisie", icon: "👁️" }
  ]

  const bestPractices = [
    { title: "Budget transparent", description: "Soyez clair sur les montants", icon: "💰" },
    { title: "Livrables détaillés", description: "Listez précisément les attendus", icon: "📦" },
    { title: "Technologies préférées", description: "Indiquez votre stack technique", icon: "💻" },
    { title: "Documents annexes", description: "Partagez des maquettes ou briefs", icon: "📎" },
    { title: "Réactivité", description: "Répondez rapidement aux candidatures", icon: "⚡" }
  ]

  const commonMistakes = [
    { title: "Budget vague", description: "Évitez 'négociable'", icon: "🎯" },
    { title: "Description courte", description: "Soyez détaillé", icon: "📝" },
    { title: "Délai irréaliste", description: "Prévoyez une marge", icon: "⏰" },
    { title: "Trop de compétences", description: "Priorisez l'essentiel", icon: "🎓" },
    { title: "Absence de réponse", description: "Répondez aux candidats", icon: "💬" }
  ]

  const getStepBadge = (step: number) => {
    if (currentStep === step) return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
    if (currentStep > step) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
  }

  const progressValue = (currentStep / 4) * 100

  const TabButton = ({ value, icon, label }: { value: string; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
        activeTab === value
          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsOpen(true)}
              className="fixed bottom-20 right-6 z-40 h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-110 transition-all duration-200 flex items-center justify-center"
            >
              <HelpCircle className="h-6 w-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-gray-900 text-white">
            <p>Aide à la création de projet</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] sm:h-auto sm:max-h-[85vh] flex flex-col p-0 rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="flex-shrink-0 p-5 pb-3 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
                  <Rocket className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                    {helpT.title || "Assistant création"}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {helpT.description || "Conseils pour un projet réussi"}
                  </p>
                </div>
              </div>
              <Badge className={`${getStepBadge(currentStep)} px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm`}>
                Étape {currentStep}/4
              </Badge>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Début</span>
                <span>Description</span>
                <span>Budget</span>
                <span>Compétences</span>
                <span>Fin</span>
              </div>
              <Progress value={progressValue} className="h-1.5 bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>

          {/* Tabs Navigation - Scrollable sur mobile */}
          <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              <TabButton value="tips" icon={<Lightbulb className="h-4 w-4" />} label={helpT.tips || "Conseils"} />
              <TabButton value="examples" icon={<Briefcase className="h-4 w-4" />} label={helpT.examples || "Exemples"} />
              <TabButton value="checklist" icon={<CheckCircle2 className="h-4 w-4" />} label={helpT.checklist || "Checklist"} />
              <TabButton value="bestpractices" icon={<Star className="h-4 w-4" />} label={helpT.bestPractices || "Pratiques"} />
            </div>
          </div>

          {/* Scrollable Content */}
          <div ref={contentRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
            {/* Tips Tab */}
            {activeTab === 'tips' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {tips.map((tip, index) => (
                  <div
                    key={index}
                    className={`p-3 sm:p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md group ${tip.bg} ${tip.border} `}
                    onClick={() => {
                      if (onTipClick) onTipClick(tip.title)
                      setIsOpen(false)
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 sm:p-2 rounded-lg ${tip.bg} ${tip.color} group-hover:scale-110 transition-transform flex-shrink-0`}>
                        {tip.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                          <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{tip.title}</h4>
                          <Badge variant="outline" className="text-xs flex-shrink-0">Étape {tip.step}</Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{tip.description}</p>
                        {tip.example && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2">{tip.example}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Examples Tab */}
            {activeTab === 'examples' && (
              <div className="space-y-5">
                {/* Titres */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Exemples de titres
                  </h3>
                  <div className="space-y-2">
                    {examples.titles.map((title, index) => (
                      <div
                        key={index}
                        className={`p-2 sm:p-3 rounded-lg flex items-center gap-2 sm:gap-3 ${
                          title.type === 'good'
                            ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
                        }`}
                      >
                        {title.type === 'good' ? (
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-red-600 flex-shrink-0" />
                        )}
                        <p className={`text-xs sm:text-sm ${
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
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    Budgets indicatifs
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {examples.budgets.map((budget, index) => (
                      <div key={index} className="p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{budget.project}</p>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{budget.range}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compétences */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Exemples de compétences
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {examples.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs sm:text-sm py-1 px-2 sm:py-1.5 sm:px-3 bg-gray-100 dark:bg-gray-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Checklist Tab */}
            {activeTab === 'checklist' && (
              <div className="space-y-2 sm:space-y-3">
                {checklist.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                  >
                    <span className="text-xl sm:text-2xl flex-shrink-0">{item.icon}</span>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{item.item}</p>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0 bg-white dark:bg-gray-900">
                      Étape {item.step}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Best Practices Tab */}
            {activeTab === 'bestpractices' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-4 w-4 text-green-600" />
                    <h3 className="font-semibold text-green-800 dark:text-green-300 text-sm sm:text-base">
                      Bonnes pratiques
                    </h3>
                  </div>
                  <ul className="space-y-2 sm:space-y-3">
                    {bestPractices.map((practice, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-base sm:text-lg flex-shrink-0">{practice.icon}</span>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{practice.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{practice.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm sm:text-base">
                      Erreurs à éviter
                    </h3>
                  </div>
                  <ul className="space-y-2 sm:space-y-3">
                    {commonMistakes.map((mistake, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-base sm:text-lg flex-shrink-0">{mistake.icon}</span>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{mistake.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{mistake.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-3 sm:p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Info className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-center sm:text-left">Basé sur l'analyse de +10 000 projets</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1 text-xs sm:text-sm"
              >
                Fermer
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #c1c1c1 #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
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