// app/[lang]/privacy/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { 
  Shield, 
  Eye, 
  Lock, 
  Database, 
  FileText, 
  Mail, 
  Cookie, 
  Users,
  CheckCircle,
  AlertCircle,
  Globe,
  Server,
  Smartphone,
  CreditCard,
  ArrowRight,
  Briefcase
} from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPolicyPage() {
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

  const t = dict?.legal?.privacy || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">{t.badge || 'Protection des données'}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t.title || 'Politique de Confidentialité'}
            </h1>
            <p className="text-xl text-blue-100">
              {t.subtitle || 'Comment nous protégeons vos données personnelles'}
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
              {t.introTitle || 'Introduction'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.introText || 'Chez NRBTalents, nous nous engageons à protéger votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous utilisez notre plateforme.'}
            </p>
          </div>

          {/* Information Collection */}
          <div className="p-8 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.collectionTitle || 'Informations que nous collectons'}
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {t.collectionDesc || 'Nous collectons différents types d\'informations pour vous fournir nos services :'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {t.personalInfo || 'Informations personnelles'}
                  </h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t.personalInfoDesc || 'Nom, email, téléphone, adresse, photo de profil'}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {t.professionalInfo || 'Informations professionnelles'}
                  </h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t.professionalInfoDesc || 'Compétences, portfolio, expérience, tarifs'}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {t.paymentInfo || 'Informations de paiement'}
                  </h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t.paymentInfoDesc || 'Coordonnées bancaires, historiques de transactions'}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {t.technicalInfo || 'Informations techniques'}
                  </h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t.technicalInfoDesc || 'Adresse IP, type d\'appareil, navigateur, cookies'}
                </p>
              </div>
            </div>
          </div>

          {/* How We Use Data */}
          <div className="p-8 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.usageTitle || 'Comment nous utilisons vos données'}
              </h2>
            </div>
            <div className="space-y-3">
              {[
                { icon: CheckCircle, text: t.usage1 || 'Fournir et améliorer nos services' },
                { icon: CheckCircle, text: t.usage2 || 'Faciliter les mises en relation entre clients et freelances' },
                { icon: CheckCircle, text: t.usage3 || 'Traiter vos paiements et transactions' },
                { icon: CheckCircle, text: t.usage4 || 'Communiquer avec vous concernant votre compte' },
                { icon: CheckCircle, text: t.usage5 || 'Personnaliser votre expérience' },
                { icon: CheckCircle, text: t.usage6 || 'Assurer la sécurité de la plateforme' }
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <item.icon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-600 dark:text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Data Protection */}
          <div className="p-8 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.protectionTitle || 'Protection de vos données'}
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {t.protectionDesc || 'Nous mettons en œuvre des mesures de sécurité pour protéger vos données :'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t.encryption || 'Chiffrement SSL/TLS pour toutes les transmissions'}
                </span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t.accessControl || 'Contrôle d\'accès strict aux données'}
                </span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Server className="h-5 w-5 text-blue-600 mt-0.5" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t.backup || 'Sauvegardes régulières des données'}
                </span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t.monitoring || 'Surveillance continue des menaces'}
                </span>
              </div>
            </div>
          </div>

          {/* Your Rights */}
          <div className="p-8 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.rightsTitle || 'Vos droits'}
              </h2>
            </div>
            <div className="space-y-3">
              {[
                t.right1 || 'Accéder à vos données personnelles',
                t.right2 || 'Rectifier des informations inexactes',
                t.right3 || 'Demander la suppression de vos données',
                t.right4 || 'Vous opposer au traitement de vos données',
                t.right5 || 'Retirer votre consentement à tout moment'
              ].map((right, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-600 dark:text-slate-400">{right}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cookies */}
          <div className="p-8 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <Cookie className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.cookiesTitle || 'Cookies'}
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {t.cookiesDesc || 'Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.'}
            </p>
            <Link 
              href={`/${lang}/cookies`}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              {t.cookiesLink || 'En savoir plus sur notre politique de cookies'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Contact */}
          <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.contactTitle || 'Nous contacter'}
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {t.contactDesc || 'Pour toute question concernant cette politique de confidentialité, contactez-nous :'}
            </p>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-slate-600 dark:text-slate-400">
                📧 {t.email || 'Email'}: <a href="mailto:privacy@nrbtalents.com" className="text-blue-600 hover:underline">privacy@nrbtalents.com</a>
              </p>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                📍 {t.address || 'Adresse'}: 123 Rue de la Tech, 75001 Paris, France
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}