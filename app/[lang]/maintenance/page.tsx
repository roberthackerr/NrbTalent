// app/[lang]/maintenance/page.tsx
'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { 
  Wrench, 
  Globe, 
  Rocket, 
  Mail, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Linkedin,
  Twitter,
  Github,
  Mail as MailIcon,
  Shield,
  Zap,
  Users,
  TrendingUp,
  Search,
  AlertTriangle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'

export default function MaintenancePage() {
  const params = useParams()
  const lang = params.lang as Locale
  const [dict, setDict] = useState<any>(null)

  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  const seoEngines = [
    { name: 'Google', icon: '🔍', status: 'indisponible' },
    { name: 'Yandex', icon: '🌐', status: 'indisponible' },
    { name: 'DuckDuckGo', icon: '🦆', status: 'indisponible' },
    { name: 'Bing', icon: '🔵', status: 'indisponible' }
  ]

  return (
    <>
      {/* Meta tags pour le SEO - Indisponible pour les moteurs de recherche */}
      <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, notranslate, noimageindex" />
      <meta name="googlebot" content="noindex, nofollow, noarchive" />
      <meta name="bingbot" content="noindex, nofollow" />
      <meta name="slurp" content="noindex, nofollow" />
      <meta name="duckduckbot" content="noindex, nofollow" />
      <meta name="yandex" content="noindex, nofollow" />
      <meta name="robots" content="none" />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Barre de notification SEO */}
        <div className="bg-red-600/90 backdrop-blur-sm border-b border-red-500/30">
          <div className="container mx-auto px-4 py-2">
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-white/90">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>NRBTalents n'est pas référencé sur :</span>
              </div>
              {seoEngines.map((engine) => (
                <div key={engine.name} className="flex items-center gap-1">
                  <span>{engine.icon}</span>
                  <span>{engine.name}</span>
                  <XCircle className="h-3 w-3 text-red-300" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 sm:py-20 max-w-4xl">
          {/* Badge maintenance */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <Wrench className="h-4 w-4 text-yellow-400 animate-pulse" />
              <span className="text-sm font-medium text-white">Maintenance en cours</span>
            </div>
          </div>

          {/* Logo ou icône principale */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-50"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-6 shadow-2xl">
                <Rocket className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
              </div>
            </div>
          </div>

          {/* Titre principal */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center mb-4">
            🔧 NRBTalents entre dans une nouvelle phase
          </h1>

          {/* Sous-titre */}
          <p className="text-lg sm:text-xl text-blue-200 text-center mb-8">
            Une mise à jour majeure arrive très bientôt
          </p>

          {/* Message principal */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 mb-8 border border-white/20">
            <div className="space-y-4 text-white/90">
              <p>
                Au cours des prochains jours, la plateforme sera temporairement indisponible afin de déployer 
                une mise à jour majeure et d'améliorer l'expérience globale des utilisateurs.
              </p>
              
              <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/30">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-300" />
                  Nouveau domaine officiel :
                </p>
                <a 
                  href="https://www.nrbtalents.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl sm:text-2xl font-bold text-white hover:text-blue-300 transition-colors block break-all"
                >
                  🌐 www.nrbtalents.com
                </a>
              </div>

              <p>
                Nous travaillons sur des optimisations importantes concernant les performances, 
                l'expérience utilisateur, les fonctionnalités collaboratives et le référencement de la plateforme.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <div className="flex items-center gap-2 text-sm bg-white/10 rounded-full px-3 py-1">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span>Performances</span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-white/10 rounded-full px-3 py-1">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span>Collaboration</span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-white/10 rounded-full px-3 py-1">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span>Référencement</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mission */}
          <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-2xl p-6 sm:p-8 mb-8 border border-white/20 text-center">
            <p className="text-white/80 italic">
              "Notre mission reste la même : connecter les talents africains aux opportunités du monde entier 
              grâce à la technologie et à l'intelligence artificielle."
            </p>
          </div>

          {/* Message de remerciement */}
          <div className="text-center mb-8">
            <p className="text-white/80">
              Merci pour votre patience, votre confiance et votre soutien depuis le début de cette aventure.
            </p>
          </div>

          {/* Rendez-vous */}
          <div className="bg-white/5 rounded-2xl p-6 sm:p-8 mb-8 text-center border border-white/10">
            <Rocket className="h-10 w-10 mx-auto mb-4 text-blue-400" />
            <p className="text-xl sm:text-2xl font-bold text-white mb-2">
              🚀 Rendez-vous très bientôt sur
            </p>
            <a 
              href="https://www.nrbtalents.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl sm:text-3xl font-bold text-blue-400 hover:text-blue-300 transition-colors break-all"
            >
              www.nrbtalents.com
            </a>
            <p className="text-white/70 mt-3">
              pour découvrir la nouvelle version de NRBTalents
            </p>
          </div>

          {/* Contacts */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <MailIcon className="h-5 w-5 text-blue-400" />
                <span className="font-semibold text-white">Contact technique</span>
              </div>
              <a 
                href="mailto:robertolinos@nrbtalents.com"
                className="text-blue-400 hover:text-blue-300 break-all text-sm"
              >
                robertolinos@nrbtalents.com
              </a>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <MailIcon className="h-5 w-5 text-purple-400" />
                <span className="font-semibold text-white">Support client</span>
              </div>
              <a 
                href="mailto:support@nrbtalents.com"
                className="text-purple-400 hover:text-purple-300 break-all text-sm"
              >
                support@nrbtalents.com
              </a>
            </div>
          </div>

          {/* Hashtags */}
          <div className="flex flex-wrap justify-center gap-2 pt-6 pb-4">
            {[
              '#NRBTalents',
              '#AfricanTalents',
              '#Startup',
              '#TechStartup',
              '#AI',
              '#Freelance',
              '#Innovation',
              '#AfricaTech',
              '#FutureOfWork',
              '#BuildInPublic'
            ].map((tag) => (
              <span key={tag} className="text-xs text-white/40 hover:text-white/60 transition-colors">
                {tag}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center text-white/30 text-xs pt-8 border-t border-white/10">
            <p>© 2024 NRBTalents - En maintenance</p>
            <p className="mt-1">
              Cette page n'est pas référencée par les moteurs de recherche
            </p>
          </div>
        </div>
      </div>
    </>
  )
}