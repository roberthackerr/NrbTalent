// app/[lang]/terms/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { 
  FileText, 
  Scale, 
  Handshake, 
  CreditCard, 
  Shield, 
  AlertCircle,
  CheckCircle,
  Users,
  Clock,
  Globe,
  MessageCircle,
  Zap,
  Award
} from 'lucide-react'
import Link from 'next/link'

export default function TermsOfServicePage() {
  const params = useParams()
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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Chargement...</p>
        </div>
      </div>
    )
  }

  const t = dict?.legal?.terms || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Scale className="h-4 w-4" />
              <span className="text-sm font-medium">{t.badge || 'Conditions d\'utilisation'}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t.title || 'Conditions Générales d\'Utilisation'}
            </h1>
            <p className="text-xl text-blue-100">
              {t.subtitle || 'Les règles qui régissent notre plateforme'}
            </p>
            <p className="text-sm text-blue-200 mt-4">
              {t.lastUpdated || 'Dernière mise à jour'}: {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'en' ? 'en-US' : 'fr-FR')}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Introduction */}
          <div className="p-8 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              {t.introTitle || 'Acceptation des conditions'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.introText || 'En utilisant la plateforme NRBTalents, vous acceptez d\'être lié par les présentes conditions générales d\'utilisation. Si vous n\'acceptez pas ces conditions, veuillez ne pas utiliser nos services.'}
            </p>
          </div>

          {/* Account Registration */}
          <div className="p-8 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.accountTitle || 'Compte utilisateur'}
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-slate-600 dark:text-slate-400">
                  {t.account1 || 'Vous devez avoir au moins 18 ans pour créer un compte'}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-slate-600 dark:text-slate-400">
                  {t.account2 || 'Vous êtes responsable de la confidentialité de votre mot de passe'}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-slate-600 dark:text-slate-400">
                  {t.account3 || 'Vous devez fournir des informations exactes et à jour'}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-slate-600 dark:text-slate-400">
                  {t.account4 || 'Un seul compte par utilisateur est autorisé'}
                </p>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="p-8 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <Handshake className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.servicesTitle || 'Services proposés'}
              </h2>
            </div>
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-400">
                {t.servicesDesc || 'Notre plateforme met en relation :'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {t.freelanceService || 'Freelances'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t.freelanceDesc || 'Proposent leurs services et compétences'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Users className="h-5 w-5 text-green-600 mb-2" />
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {t.clientService || 'Clients'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t.clientDesc || 'Recherchent des talents pour leurs projets'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payments */}
          <div className="p-8 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.paymentsTitle || 'Paiements et transactions'}
              </h2>
            </div>
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-400">
                {t.paymentsDesc || 'Tous les paiements sont sécurisés via notre système de paiement intégré :'}
              </p>
              <ul className="space-y-2 mt-4">
                {[
                  t.payment1 || 'Les fonds sont bloqués jusqu\'à validation du projet',
                  t.payment2 || 'Commission de service de 10% prélevée sur chaque transaction',
                  t.payment3 || 'Paiements sécurisés via Stripe',
                  t.payment4 || 'Délai de déblocage des fonds de 3 à 5 jours ouvrés'
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Responsibilities */}
          <div className="p-8 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.responsibilitiesTitle || 'Responsabilités'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  {t.freelanceResponsibility || 'Responsabilités du freelance'}
                </h3>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li>• {t.freelanceResp1 || 'Fournir un travail de qualité dans les délais'}</li>
                  <li>• {t.freelanceResp2 || 'Communiquer régulièrement avec le client'}</li>
                  <li>• {t.freelanceResp3 || 'Respecter les conditions convenues'}</li>
                </ul>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  {t.clientResponsibility || 'Responsabilités du client'}
                </h3>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li>• {t.clientResp1 || 'Fournir un brief clair et complet'}</li>
                  <li>• {t.clientResp2 || 'Effectuer les paiements dans les délais'}</li>
                  <li>• {t.clientResp3 || 'Fournir des retours constructifs'}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Disputes */}
          <div className="p-8 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.disputesTitle || 'Résolution des litiges'}
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {t.disputesDesc || 'En cas de litige, nous encourageons la communication directe entre les parties. Si le problème persiste :'}
            </p>
            <ol className="space-y-2 list-decimal list-inside text-slate-600 dark:text-slate-400">
              <li>{t.dispute1 || 'Contactez notre support client'}</li>
              <li>{t.dispute2 || 'Nous étudions le litige dans les 48h'}</li>
              <li>{t.dispute3 || 'Nous proposons une médiation si nécessaire'}</li>
              <li>{t.dispute4 || 'En dernier recours, nous pouvons annuler la transaction'}</li>
            </ol>
          </div>

          {/* Termination */}
          <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.terminationTitle || 'Résiliation du compte'}
              </h2>
            </div>
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-400">
                {t.terminationDesc || 'Nous nous réservons le droit de suspendre ou résilier un compte en cas de :'}
              </p>
              <ul className="space-y-2 mt-4">
                {[
                  t.termination1 || 'Violation des conditions d\'utilisation',
                  t.termination2 || 'Fraude ou comportement inapproprié',
                  t.termination3 || 'Non-respect des obligations contractuelles',
                  t.termination4 || 'Inactivité prolongée (plus de 12 mois)'
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}