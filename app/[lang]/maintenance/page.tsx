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
  XCircle,
  Headphones,
  MessageCircle,
  LifeBuoy,
  ExternalLink
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

  const stats = [
    { icon: Headphones, value: '24/7', label: 'Support disponible', color: 'text-blue-400' },
    { icon: Clock, value: '< 2h', label: 'Temps de réponse moyen', color: 'text-green-400' },
    { icon: TrendingUp, value: '98%', label: 'Satisfaction client', color: 'text-yellow-400' },
    { icon: Users, value: '15k+', label: 'Problèmes résolus', color: 'text-purple-400' }
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
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Barre de notification SEO */}
        <div className="bg-gradient-to-r from-red-600/90 to-red-700/90 backdrop-blur-sm border-b border-red-500/30 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-2.5">
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-white/90">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="font-medium">NRBTalents n'est pas référencé (temporairement) sur :</span>
              </div>
              {seoEngines.map((engine) => (
                <div key={engine.name} className="flex items-center gap-1.5 bg-black/20 rounded-full px-2 py-0.5">
                  <span className="text-sm">{engine.icon}</span>
                  <span className="text-xs">{engine.name}</span>
                  <XCircle className="h-3 w-3 text-red-300" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20 max-w-5xl">
          {/* Badge maintenance */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
              <div className="relative">
                <Wrench className="h-4 w-4 text-yellow-400 animate-pulse" />
                <span className="absolute inset-0 animate-ping opacity-75">⚙️</span>
              </div>
              <span className="text-sm font-medium text-white">Maintenance en cours - Mise à jour majeure</span>
            </div>
          </div>

          {/* Logo ou icône principale */}
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-6 shadow-2xl animate-bounce-slow">
                <Rocket className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
              </div>
            </div>
          </div>

          {/* Titre principal */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-4">
            🔧 NRBTalents entre dans une{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              nouvelle phase
            </span>
          </h1>

          {/* Sous-titre */}
          <p className="text-lg sm:text-xl text-blue-200 text-center mb-12 max-w-2xl mx-auto">
            Une mise à jour majeure arrive très bientôt. Nous préparons quelque chose d'exceptionnel pour vous.
          </p>

          {/* Message principal */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Ce qui change
              </h2>
              <div className="space-y-3 text-white/80">
                <p>✨ Nouvelles fonctionnalités collaboratives</p>
                <p>⚡ Performances optimisées</p>
                <p>🎨 Interface utilisateur repensée</p>
                <p>🔍 Référencement amélioré</p>
                <p>🤖 IA plus intelligente</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-400" />
                Nouveau domaine
              </h2>
              <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/30 mb-4">
                <p className="text-sm text-blue-300 mb-1">Notre nouvelle adresse :</p>
                <a 
                  href="https://www.nrbtalents.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl sm:text-2xl font-bold text-white hover:text-blue-300 transition-colors block break-all"
                >
                  🌐 www.nrbtalents.com
                </a>
              </div>
              <p className="text-white/70 text-sm">
                Mettez à jour vos favoris et signets
              </p>
            </div>
          </div>

          {/* Mission */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-6 sm:p-8 mb-10 border border-white/10 text-center backdrop-blur-sm">
            <Shield className="h-8 w-8 mx-auto mb-3 text-blue-400 opacity-75" />
            <p className="text-white/90 text-lg italic">
              "Notre mission reste la même : connecter les talents africains aux opportunités du monde entier 
              grâce à la technologie et à l'intelligence artificielle."
            </p>
          </div>

          {/* Section Support - NOUVEAU */}
          <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-2xl p-6 sm:p-8 mb-10 border border-white/20">
            <div className="text-center mb-6">
              <LifeBuoy className="h-10 w-10 mx-auto mb-3 text-blue-400" />
              <h2 className="text-2xl font-bold text-white mb-2">Besoin d'aide pendant la maintenance ?</h2>
              <p className="text-blue-200">
                Notre équipe de support reste disponible pour répondre à vos questions
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Link 
                href={`/${lang}/support`}
                className="group flex items-center justify-between gap-3 p-4 bg-white/10 rounded-xl hover:bg-white/15 transition-all duration-300 border border-white/10 hover:border-blue-500/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg group-hover:scale-110 transition-transform">
                    <MessageCircle className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">Centre d'aide</p>
                    <p className="text-xs text-blue-300">FAQ et guides</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>

              <a 
                href="mailto:support@nrbtalents.com"
                className="group flex items-center justify-between gap-3 p-4 bg-white/10 rounded-xl hover:bg-white/15 transition-all duration-300 border border-white/10 hover:border-blue-500/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:scale-110 transition-transform">
                    <MailIcon className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">Support par email</p>
                    <p className="text-xs text-purple-300">support@nrbtalents.com</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-white/50 group-hover:text-white transition-all" />
              </a>
            </div>

            {/* Statistiques de support */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={index} className="text-center">
                    <Icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
                    <div className="text-lg font-bold text-white">{stat.value}</div>
                    <div className="text-[10px] text-white/50">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Message de remerciement */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm text-white/70">
                Merci pour votre patience, votre confiance et votre soutien
              </span>
            </div>
          </div>

          {/* Compte à rebours / Notification */}
          <div className="bg-white/5 rounded-2xl p-6 mb-10 text-center border border-white/10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400 font-medium">Maintenance en cours</span>
            </div>
            <p className="text-white/60 text-sm">
              Nous vous tiendrons informés de l'avancement sur nos réseaux sociaux
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <a href="#" className="text-white/40 hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-white/40 hover:text-blue-400 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-white/40 hover:text-blue-400 transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Hashtags */}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 pt-6 pb-4">
            {[
              '#NRBTalents', '#AfricanTalents', '#Startup', '#TechStartup',
              '#AI', '#Freelance', '#Innovation', '#AfricaTech', 
              '#FutureOfWork', '#BuildInPublic'
            ].map((tag) => (
              <span key={tag} className="text-xs text-white/30 hover:text-white/50 transition-colors cursor-default">
                {tag}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center text-white/20 text-xs pt-8 border-t border-white/5">
            <p>© 2024 NRBTalents - En maintenance</p>
            <p className="mt-1">
              Cette page n'est pas référencée par les moteurs de recherche
            </p>
          </div>
        </div>
      </div>

      {/* Animation CSS personnalisée */}
      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </>
  )
}