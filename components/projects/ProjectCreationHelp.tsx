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
  DialogTrigger,
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
  MapPin,
  Globe,
  Shield,
  FileText,
  Users,
  Clock,
  CheckCircle2,
  X,
  Lightbulb,
  TrendingUp,
  Briefcase,
  MessageCircle,
  Star
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ProjectCreationHelpProps {
  dict: any
  lang: string
  currentStep?: number
  onTipClick?: (tip: string) => void
}

export function ProjectCreationHelp({ dict, lang, currentStep = 1, onTipClick }: ProjectCreationHelpProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('tips')

  const t = dict?.projects?.create || {}
  const helpT = dict?.help || {
    title: "Aide à la création de projet",
    description: "Conseils et bonnes pratiques pour créer un projet attractif",
    tips: "Conseils",
    examples: "Exemples",
    checklist: "Checklist",
    bestPractices: "Bonnes pratiques",
    commonMistakes: "Erreurs à éviter"
  }

  const tips = [
    {
      step: 1,
      icon: <FileText className="h-4 w-4" />,
      title: "Titre accrocheur",
      description: "Utilisez des mots-clés pertinents et soyez spécifique. Ex: 'Développeur React pour application e-commerce' plutôt que 'Cherche développeur'",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30"
    },
    {
      step: 1,
      icon: <FileText className="h-4 w-4" />,
      title: "Description détaillée",
      description: "Décrivez votre projet en détail : objectifs, fonctionnalités attendues, contraintes techniques, et livrables.",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30"
    },
    {
      step: 1,
      icon: <Tag className="h-4 w-4" />,
      title: "Choisissez la bonne catégorie",
      description: "Sélectionnez la catégorie la plus pertinente pour que les bons freelances trouvent votre projet.",
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/30"
    },
    {
      step: 2,
      icon: <DollarSign className="h-4 w-4" />,
      title: "Budget réaliste",
      description: "Proposez un budget réaliste basé sur la complexité du projet. Un budget trop bas peut rebuter les meilleurs talents.",
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-950/30"
    },
    {
      step: 2,
      icon: <Calendar className="h-4 w-4" />,
      title: "Délai réaliste",
      description: "Prévoyez une marge pour les imprévus. Un délai trop serré peut compromettre la qualité du travail.",
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950/30"
    },
    {
      step: 3,
      icon: <Sparkles className="h-4 w-4" />,
      title: "Compétences claires",
      description: "Listez les compétences techniques indispensables pour le projet. Soyez précis mais pas trop restrictif.",
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/30"
    },
    {
      step: 4,
      icon: <Shield className="h-4 w-4" />,
      title: "Visibilité",
      description: "Les projets publics attirent plus de candidatures. Utilisez le mode privé uniquement si vous avez des freelances spécifiques en tête.",
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/30"
    }
  ]

  const examples = {
    titles: [
      "✅ Développement d'une application mobile React Native pour startup fintech",
      "✅ Création d'un site e-commerce Shopify avec intégration API",
      "✅ Refonte UI/UX d'une application SaaS existante",
      "❌ Cherche développeur",
      "❌ Besoin d'un site web",
      "❌ Projet urgent"
    ],
    descriptions: [
      {
        good: "Nous recherchons un développeur React expérimenté pour créer un tableau de bord analytique interactif. Fonctionnalités attendues : graphiques temps réel, export de données, filtres avancés. Stack technique : React, D3.js, Socket.io, Node.js. Livrables : code source documenté, déploiement sur AWS.",
        bad: "Besoin d'un développeur pour faire un site web avec des graphiques."
      }
    ],
    budgets: [
      "Site vitrine simple: 500-1500€",
      "Site e-commerce: 2000-8000€",
      "Application mobile: 3000-15000€",
      "Plateforme SaaS complexe: 10000-50000€"
    ],
    skills: [
      "React, TypeScript, Tailwind CSS",
      "Node.js, Express, MongoDB",
      "Python, Django, PostgreSQL",
      "Figma, Adobe XD, UI/UX Design"
    ]
  }

  const checklist = [
    { step: 1, item: "Titre clair et descriptif", checked: false, icon: "📝" },
    { step: 1, item: "Description détaillée (au moins 200 caractères)", checked: false, icon: "📄" },
    { step: 1, item: "Catégorie et sous-catégorie sélectionnées", checked: false, icon: "🏷️" },
    { step: 2, item: "Budget défini (min et max)", checked: false, icon: "💰" },
    { step: 2, item: "Date limite réaliste", checked: false, icon: "📅" },
    { step: 3, item: "Au moins 3 compétences requises", checked: false, icon: "⚡" },
    { step: 3, item: "Tags pertinents ajoutés", checked: false, icon: "🔖" },
    { step: 4, item: "Visibilité choisie", checked: false, icon: "👁️" }
  ]

  const bestPractices = [
    "Soyez transparent sur le budget",
    "Détaillez les livrables attendus",
    "Indiquez les technologies préférées",
    "Précisez si le télétravail est accepté",
    "Partagez des exemples ou maquettes si possible",
    "Répondez rapidement aux candidatures"
  ]

  const commonMistakes = [
    "Budget trop vague",
    "Description trop courte ou floue",
    "Délai irréaliste",
    "Trop ou pas assez de compétences requises",
    "Ne pas répondre aux candidatures",
    "Changer les exigences en cours de route"
  ]

  const getStepColor = (step: number) => {
    if (currentStep === step) return "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
    if (currentStep > step) return "border-green-500 bg-green-50 dark:bg-green-950/30"
    return "border-gray-200 dark:border-gray-700"
  }

  return (
    <>
      {/* Bouton d'aide flottant */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsOpen(true)}
              className="fixed bottom-20 right-6 z-40 h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 text-white"
            >
              <HelpCircle className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Aide à la création de projet</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-3 border-b border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <Lightbulb className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                    {helpT.title || "Aide à la création de projet"}
                  </DialogTitle>
                  <DialogDescription className="text-slate-600 dark:text-slate-400">
                    {helpT.description || "Conseils et bonnes pratiques pour créer un projet attractif"}
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                Étape {currentStep}/4
              </Badge>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-6 mt-3 mb-2 bg-slate-100 dark:bg-slate-800 p-1">
              <TabsTrigger value="tips" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                {helpT.tips || "Conseils"}
              </TabsTrigger>
              <TabsTrigger value="examples" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {helpT.examples || "Exemples"}
              </TabsTrigger>
              <TabsTrigger value="checklist" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {helpT.checklist || "Checklist"}
              </TabsTrigger>
              <TabsTrigger value="bestpractices" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                {helpT.bestPractices || "Bonnes pratiques"}
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-6 pb-6">
              {/* Tips Tab */}
              <TabsContent value="tips" className="m-0 mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tips.map((tip, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border ${getStepColor(tip.step)} cursor-pointer transition-all hover:shadow-md`}
                      onClick={() => {
                        if (onTipClick) onTipClick(tip.title)
                        setIsOpen(false)
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${tip.bg} ${tip.color}`}>
                          {tip.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white">{tip.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              Étape {tip.step}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{tip.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Examples Tab */}
              <TabsContent value="examples" className="m-0 mt-4 space-y-6">
                {/* Titres */}
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Exemples de titres
                  </h3>
                  <div className="space-y-2">
                    {examples.titles.map((title, index) => (
                      <div key={index} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <p className={`text-sm ${title.startsWith('✅') ? 'text-green-600 dark:text-green-400' : title.startsWith('❌') ? 'text-red-600 dark:text-red-400' : ''}`}>
                          {title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Descriptions */}
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-500" />
                    Exemples de descriptions
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                      <Badge variant="outline" className="mb-2 bg-green-100 text-green-700">✅ Bon exemple</Badge>
                      <p className="text-sm text-green-800 dark:text-green-300">{examples.descriptions[0].good}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <Badge variant="outline" className="mb-2 bg-red-100 text-red-700">❌ Mauvais exemple</Badge>
                      <p className="text-sm text-red-800 dark:text-red-300">{examples.descriptions[0].bad}</p>
                    </div>
                  </div>
                </div>

                {/* Budgets */}
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    Fourchettes de budget indicatives
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {examples.budgets.map((budget, index) => (
                      <div key={index} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-sm">{budget}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compétences */}
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Exemples de compétences
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {examples.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-sm py-1.5">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Checklist Tab */}
              <TabsContent value="checklist" className="m-0 mt-4">
                <div className="space-y-3">
                  {checklist.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700 dark:text-slate-300">{item.item}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Étape {item.step}
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Best Practices Tab */}
              <TabsContent value="bestpractices" className="m-0 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <h3 className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Bonnes pratiques
                    </h3>
                    <ul className="space-y-2">
                      {bestPractices.map((practice, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-400">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{practice}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                    <h3 className="font-semibold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
                      <X className="h-4 w-4" />
                      Erreurs à éviter
                    </h3>
                    <ul className="space-y-2">
                      {commonMistakes.map((mistake, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
                          <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{mistake}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          {/* Footer */}
          <div className="p-4 pt-3 border-t border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/20">
            <p className="text-xs text-center text-purple-600 dark:text-purple-400">
              💡 {helpT.footer || "Des questions ? Contactez notre support à support@nrbtalents.com"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}