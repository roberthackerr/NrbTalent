// app/[lang]/ai-matching/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, User, Sparkles, Zap, Target, Users, ArrowRight, Brain, TrendingUp, Award } from "lucide-react"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { AIMatchingButton } from '@/components/ai-matching/AIMatchingButton'

export default function AIMatchingLandingPage() {
  const params = useParams()
  const router = useRouter()
  const lang = params.lang as Locale
  
  const [dict, setDict] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
    setIsLoading(false)
  }, [lang])

  if (isLoading || !dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950/20">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <Sparkles className="w-6 h-6 text-purple-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">{dict?.common?.loading || 'Chargement...'}</p>
        </div>
      </div>
    )
  }

  const t = dict?.aiMatching || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full mb-6 shadow-lg shadow-purple-500/25">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">{t.badge || 'AI Matching Beta'}</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t.title || 'Trouvez Votre Match Parfait'}
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
            {t.subtitle || 'Notre intelligence artificielle analyse compétences, expériences et compatibilité pour créer des connexions qui ont du sens.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/${lang}/ai-matching/clients`}>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25">
                <Building className="mr-2 h-4 w-4" />
                {t.clientButton || 'Je suis un Client'}
              </Button>
            </Link>
            <Link href={`/${lang}/ai-matching/freelancers`}>
              <Button size="lg" variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30">
                <User className="mr-2 h-4 w-4" />
                {t.freelancerButton || 'Je suis un Freelancer'}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all hover:scale-[1.02] duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-slate-900 dark:text-white">{t.feature1Title || 'Matching Intelligent'}</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {t.feature1Desc || 'Algorithmes avancés basés sur les compétences, l\'expérience et la compatibilité'}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center border-green-200 dark:border-green-800 hover:shadow-xl transition-all hover:scale-[1.02] duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-slate-900 dark:text-white">{t.feature2Title || 'Recommandations Personnalisées'}</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {t.feature2Desc || 'Suggestions adaptées à votre profil et vos préférences'}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all hover:scale-[1.02] duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-slate-900 dark:text-white">{t.feature3Title || 'Analyses Détaillées'}</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {t.feature3Desc || 'Scores détaillés, points forts et opportunités d\'amélioration'}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 bg-white/50 dark:bg-slate-800/30 rounded-2xl p-8 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">98%</div>
            <p className="text-slate-600 dark:text-slate-400">{t.statAccuracy || 'Taux de précision'}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">10K+</div>
            <p className="text-slate-600 dark:text-slate-400">{t.statMatches || 'Matchs réussis'}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">24h</div>
            <p className="text-slate-600 dark:text-slate-400">{t.statTime || 'Temps de réponse moyen'}</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-slate-900 dark:text-white">
            {t.howItWorks || 'Comment ça marche ?'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-white text-xl font-bold">1</span>
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-white">{t.step1Title || 'Créez votre profil'}</h3>
              <p className="text-slate-600 dark:text-slate-400">{t.step1Desc || 'Renseignez vos compétences, expériences et préférences'}</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-white">{t.step2Title || 'Analyse AI'}</h3>
              <p className="text-slate-600 dark:text-slate-400">{t.step2Desc || 'Notre IA analyse votre profil et trouve les meilleurs matchs'}</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-white">{t.step3Title || 'Connectez-vous'}</h3>
              <p className="text-slate-600 dark:text-slate-400">{t.step3Desc || 'Entrez en contact avec vos meilleurs matchs et collaborez'}</p>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800 max-w-3xl mx-auto mb-12">
          <CardContent className="pt-8 pb-8 text-center">
            <Award className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-lg italic text-slate-700 dark:text-slate-300 mb-4">
              "{t.testimonial || 'Grâce à l\'AI Matching, j\'ai trouvé le freelance parfait pour mon projet en moins de 24h. Un gain de temps incroyable !'}"
            </p>
            <p className="font-semibold text-slate-900 dark:text-white">— {t.testimonialAuthor || 'Marie Dupont, CEO TechStart'}</p>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 max-w-4xl mx-auto">
          <CardContent className="pt-8 pb-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              {t.ctaTitle || 'Prêt à révolutionner votre recherche ?'}
            </h3>
            <p className="text-blue-100 mb-6">
              {t.ctaDesc || 'Rejoignez des centaines de clients et freelancers qui utilisent déjà notre AI Matching'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${lang}/ai-matching/clients`}>
                <Button className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg">
                  {t.clientCTA || 'Commencer en tant que Client'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/${lang}/ai-matching/freelancers`}>
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  {t.freelancerCTA || 'Commencer en tant que Freelancer'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}