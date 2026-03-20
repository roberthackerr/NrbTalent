// app/[lang]/cookies/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { 
  Cookie, 
  Settings, 
  Target, 
  Globe, 
  Shield, 
  Info,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Badge
} from 'lucide-react'
import Link from 'next/link'
import { Switch } from '@/components/ui/switch'

export default function CookiePolicyPage() {
  const params = useParams()
  const lang = params.lang as Locale
  const [dict, setDict] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cookiePreferences, setCookiePreferences] = useState({
    necessary: true,
    functional: true,
    analytics: true,
    marketing: false
  })

  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
    // Charger les préférences de cookies
    const savedPrefs = localStorage.getItem('cookiePreferences')
    if (savedPrefs) {
      setCookiePreferences(JSON.parse(savedPrefs))
    }
    setIsLoading(false)
  }, [lang])

  const savePreferences = () => {
    localStorage.setItem('cookiePreferences', JSON.stringify(cookiePreferences))
    window.location.reload()
  }

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

  const t = dict?.legal?.cookies || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Cookie className="h-4 w-4" />
              <span className="text-sm font-medium">{t.badge || 'Politique de cookies'}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t.title || 'Politique de Cookies'}
            </h1>
            <p className="text-xl text-blue-100">
              {t.subtitle || 'Comment nous utilisons les cookies pour améliorer votre expérience'}
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
              {t.introTitle || 'Que sont les cookies ?'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.introText || 'Les cookies sont de petits fichiers texte stockés sur votre appareil lorsque vous visitez notre site. Ils nous aident à améliorer votre expérience en mémorisant vos préférences et en analysant votre utilisation de la plateforme.'}
            </p>
          </div>

          {/* Cookie Types */}
          <div className="p-8 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.typesTitle || 'Types de cookies que nous utilisons'}
              </h2>
            </div>
            <div className="space-y-6">
              {/* Necessary Cookies */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {t.necessaryTitle || 'Cookies nécessaires'}
                    </h3>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    {t.alwaysActive || 'Toujours actifs'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t.necessaryDesc || 'Ces cookies sont essentiels au fonctionnement du site. Ils ne peuvent pas être désactivés.'}
                </p>
              </div>

              {/* Functional Cookies */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {t.functionalTitle || 'Cookies fonctionnels'}
                    </h3>
                  </div>
                  <Switch
                    checked={cookiePreferences.functional}
                    onCheckedChange={(checked) => setCookiePreferences(prev => ({ ...prev, functional: checked }))}
                  />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t.functionalDesc || 'Ces cookies mémorisent vos préférences (langue, thème) pour une expérience personnalisée.'}
                </p>
              </div>

              {/* Analytics Cookies */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {t.analyticsTitle || 'Cookies analytiques'}
                    </h3>
                  </div>
                  <Switch
                    checked={cookiePreferences.analytics}
                    onCheckedChange={(checked) => setCookiePreferences(prev => ({ ...prev, analytics: checked }))}
                  />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t.analyticsDesc || 'Ces cookies nous aident à comprendre comment vous utilisez notre site pour l\'améliorer.'}
                </p>
              </div>

              {/* Marketing Cookies */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {t.marketingTitle || 'Cookies marketing'}
                    </h3>
                  </div>
                  <Switch
                    checked={cookiePreferences.marketing}
                    onCheckedChange={(checked) => setCookiePreferences(prev => ({ ...prev, marketing: checked }))}
                  />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t.marketingDesc || 'Ces cookies suivent votre activité pour vous proposer des publicités pertinentes.'}
                </p>
              </div>
            </div>

            {/* Save Preferences Button */}
            <div className="mt-6">
              <button
                onClick={savePreferences}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-all"
              >
                {t.savePreferences || 'Enregistrer mes préférences'}
              </button>
            </div>
          </div>

          {/* Third-party Cookies */}
          <div className="p-8 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.thirdPartyTitle || 'Cookies tiers'}
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {t.thirdPartyDesc || 'Nous utilisons certains services tiers qui peuvent déposer des cookies :'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="font-medium text-slate-900 dark:text-white">Google Analytics</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.gaDesc || 'Analyse du trafic et du comportement'}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="font-medium text-slate-900 dark:text-white">Stripe</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.stripeDesc || 'Paiements sécurisés'}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="font-medium text-slate-900 dark:text-white">Cloudinary</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.cloudinaryDesc || 'Gestion des images'}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="font-medium text-slate-900 dark:text-white">Agora</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.agoraDesc || 'Appels vidéo'}</p>
              </div>
            </div>
          </div>

          {/* How to Manage Cookies */}
          <div className="p-8 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.manageTitle || 'Comment gérer les cookies ?'}
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {t.manageDesc || 'Vous pouvez gérer vos préférences de cookies à tout moment :'}
            </p>
            <ul className="space-y-2">
              {[
                t.manage1 || 'Utilisez notre gestionnaire de cookies ci-dessus',
                t.manage2 || 'Configurez votre navigateur pour bloquer les cookies',
                t.manage3 || 'Supprimez les cookies existants de votre navigateur'
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Info className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.contactTitle || 'Pour plus d\'informations'}
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {t.contactDesc || 'Si vous avez des questions concernant notre utilisation des cookies, contactez-nous :'}
            </p>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-slate-600 dark:text-slate-400">
                📧 {t.email || 'Email'}: <a href="mailto:cookies@nrbtalents.com" className="text-blue-600 hover:underline">cookies@nrbtalents.com</a>
              </p>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                🔗 {t.links || 'Liens utiles'}: 
                <Link href={`/${lang}/privacy`} className="text-blue-600 hover:underline ml-2">Politique de confidentialité</Link>
                <span className="mx-2">•</span>
                <Link href={`/${lang}/terms`} className="text-blue-600 hover:underline">Conditions d'utilisation</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}