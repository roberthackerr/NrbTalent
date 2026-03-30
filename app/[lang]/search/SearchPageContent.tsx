// app/[lang]/search/SearchPageContent.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { 
  Search, 
  Briefcase, 
  User, 
  Users, 
  FileText, 
  Star,
  MapPin,
  Clock,
  DollarSign,
  Loader2,
  Filter,
  X,
  TrendingUp,
  Award,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Building2,
  Globe2,
  Calendar,
  Eye,
  Heart,
  Share2,
  Verified,
  GraduationCap,
  Code2,
  Palette,
  Megaphone,
  Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchResult {
  id: string
  title: string
  description: string
  type: 'project' | 'freelancer' | 'client' | 'post' | 'team'
  image?: string
  badges?: string[]
  stats?: any
  url: string
  featured?: boolean
  verified?: boolean
}

// Données fictives enrichies
const fakeData: Record<string, SearchResult[]> = {
  projects: [
    {
      id: '1',
      title: 'Développement Site E-commerce React',
      description: 'Recherche développeur React pour créer un site e-commerce complet avec panier et paiement Stripe. Stack: React, Node.js, MongoDB, Stripe API.',
      type: 'project',
      badges: ['React', 'Node.js', 'Stripe', 'MongoDB'],
      stats: { price: '2500-4000€', date: 'Publié il y a 2 jours', applications: 12, urgency: 'Urgent' },
      url: '/projects/1',
      featured: true
    },
    {
      id: '2',
      title: 'Refonte UI/UX Application Mobile',
      description: 'Designer UI/UX pour refondre l\'interface d\'une application mobile de fitness avec 50k+ utilisateurs.',
      type: 'project',
      badges: ['Figma', 'UI/UX', 'Mobile', 'Prototypage'],
      stats: { price: '1500-2500€', date: 'Publié il y a 5 jours', applications: 8 },
      url: '/projects/2'
    },
    {
      id: '3',
      title: 'Développement API REST avec Node.js',
      description: 'Création d\'une API RESTful pour une application de livraison de repas.',
      type: 'project',
      badges: ['Node.js', 'Express', 'PostgreSQL', 'JWT'],
      stats: { price: '3000-4500€', date: 'Publié il y a 1 jour', applications: 5 },
      url: '/projects/3'
    }
  ],
  freelancers: [
    {
      id: '1',
      title: 'Thomas Martin',
      description: 'Développeur Full Stack React/Node.js avec 8 ans d\'expérience. Expert en architecture microservices et cloud AWS.',
      type: 'freelancer',
      image: 'https://randomuser.me/api/portraits/men/1.jpg',
      badges: ['React', 'Node.js', 'TypeScript', 'AWS'],
      stats: { rating: 4.9, reviews: 128, price: '45€/h', location: 'Paris', projects: 47, availability: 'Disponible' },
      url: '/profile/1',
      verified: true,
      featured: true
    },
    {
      id: '2',
      title: 'Sophie Dubois',
      description: 'Designer UI/UX spécialisée dans les applications mobiles et le design système. 6 ans d\'expérience.',
      type: 'freelancer',
      image: 'https://randomuser.me/api/portraits/women/2.jpg',
      badges: ['Figma', 'Adobe XD', 'UI/UX', 'Design System'],
      stats: { rating: 4.8, reviews: 95, price: '50€/h', location: 'Lyon', projects: 32 },
      url: '/profile/2',
      verified: true
    },
    {
      id: '3',
      title: 'Marc Leclerc',
      description: 'Expert en Marketing Digital et Growth Hacking. Spécialiste SEO, SEA et réseaux sociaux.',
      type: 'freelancer',
      image: 'https://randomuser.me/api/portraits/men/3.jpg',
      badges: ['SEO', 'Google Ads', 'Facebook Ads', 'Analytics'],
      stats: { rating: 4.7, reviews: 64, price: '60€/h', location: 'Bordeaux', projects: 28 },
      url: '/profile/3'
    }
  ],
  clients: [
    {
      id: '1',
      title: 'TechCorp France',
      description: 'Leader français des solutions SaaS pour les entreprises. Recherche des freelances pour projets innovants.',
      type: 'client',
      image: 'https://logo.clearbit.com/techcorp.com',
      badges: ['SaaS', 'Tech', 'Startup'],
      stats: { location: 'Paris', projects: 45, budget: '200k+', since: 2018 },
      url: '/clients/1',
      verified: true
    }
  ],
  posts: [
    {
      id: '1',
      title: 'Comment réussir son premier projet freelance',
      description: 'Guide complet pour débuter en freelance et trouver ses premiers clients. Astuces, pièges à éviter et stratégies gagnantes.',
      type: 'post',
      badges: ['Guide', 'Débutant', 'Conseils'],
      stats: { date: '15 mars 2024', views: 1234, likes: 89, comments: 23 },
      url: '/posts/1',
      featured: true
    }
  ],
  teams: [
    {
      id: '1',
      title: 'Équipe Dev React',
      description: 'Groupe de développeurs React passionnés pour projets collaboratifs et open source.',
      type: 'team',
      badges: ['React', 'Open Source', 'Mentorat'],
      stats: { members: 12, projects: 8, skills: ['React', 'Next.js', 'Tailwind'] },
      url: '/teams/1'
    }
  ]
}

interface SearchPageContentProps {
  params: { lang: Locale }
  searchParams: { q?: string; type?: string; page?: string; sort?: string }
}

export function SearchPageContent({ params, searchParams }: SearchPageContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { lang } = params
  
  const [dict, setDict] = useState<any>(null)
  const [query, setQuery] = useState(searchParams.q || '')
  const [type, setType] = useState(searchParams.type || 'all')
  const [page, setPage] = useState(parseInt(searchParams.page || '1'))
  const [sort, setSort] = useState(searchParams.sort || 'relevance')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [expandedFilters, setExpandedFilters] = useState<string[]>(['type', 'sort'])
  
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])
  
  const t = dict?.search || {}
  
  const performSearch = useCallback(async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    let allResults: SearchResult[] = []
    
    if (type === 'all' || type === 'projects') allResults = [...allResults, ...fakeData.projects]
    if (type === 'all' || type === 'freelancers') allResults = [...allResults, ...fakeData.freelancers]
    if (type === 'all' || type === 'clients') allResults = [...allResults, ...fakeData.clients]
    if (type === 'all' || type === 'posts') allResults = [...allResults, ...fakeData.posts]
    if (type === 'all' || type === 'teams') allResults = [...allResults, ...fakeData.teams]
    
    if (query) {
      allResults = allResults.filter(r => 
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.description.toLowerCase().includes(query.toLowerCase()) ||
        r.badges?.some(b => b.toLowerCase().includes(query.toLowerCase()))
      )
    }
    
    if (sort === 'rating') {
      allResults.sort((a, b) => (b.stats?.rating || 0) - (a.stats?.rating || 0))
    } else if (sort === 'date') {
      allResults.sort((a, b) => (b.stats?.date || '').localeCompare(a.stats?.date || ''))
    }
    
    setResults(allResults)
    setTotal(allResults.length)
    setLoading(false)
    
    const urlParams = new URLSearchParams()
    if (query) urlParams.set('q', query)
    if (type !== 'all') urlParams.set('type', type)
    if (sort !== 'relevance') urlParams.set('sort', sort)
    if (page > 1) urlParams.set('page', page.toString())
    router.replace(`${pathname}?${urlParams.toString()}`, { scroll: false })
  }, [query, type, page, sort, router, pathname])
  
  useEffect(() => {
    performSearch()
  }, [performSearch])
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    performSearch()
  }
  
  const clearFilters = () => {
    setQuery('')
    setType('all')
    setSort('relevance')
    setPage(1)
  }
  
  const toggleFilter = (filter: string) => {
    setExpandedFilters(prev => 
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    )
  }
  
  const hasFilters = query || type !== 'all' || sort !== 'relevance'
  
  const typeOptions = [
    { value: 'all', label: t.all || 'Tout', icon: Search, color: 'text-gray-500' },
    { value: 'projects', label: t.projects || 'Projets', icon: Briefcase, color: 'text-blue-500' },
    { value: 'freelancers', label: t.freelancers || 'Freelances', icon: User, color: 'text-green-500' },
    { value: 'clients', label: 'Clients', icon: Building2, color: 'text-purple-500' },
    { value: 'posts', label: 'Publications', icon: FileText, color: 'text-orange-500' },
    { value: 'teams', label: t.team || 'Équipes', icon: Users, color: 'text-cyan-500' },
  ]
  
  const sortOptions = [
    { value: 'relevance', label: 'Pertinence', icon: Sparkles },
    { value: 'rating', label: 'Meilleure note', icon: Star },
    { value: 'date', label: 'Plus récent', icon: Calendar },
  ]
  
  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 py-16 md:py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-medium text-white">
                  {query ? `${total} résultats trouvés` : 'Recherche avancée'}
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {query ? `${query}` : t.title || 'Recherche'}
              </h1>
              <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                {query 
                  ? `Découvrez ${total} résultat${total > 1 ? 's' : ''} correspondant à votre recherche`
                  : 'Trouvez les meilleurs talents, projets et opportunités sur NRBTalents'
                }
              </p>
              
              {/* Barre de recherche */}
              <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.placeholder || "Rechercher des projets, freelances..."}
                    className="w-full pl-12 pr-36 py-4 text-base rounded-2xl border-0 shadow-xl bg-white/95 backdrop-blur-sm focus:bg-white transition-all"
                  />
                  <Button 
                    type="submit" 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 rounded-xl"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        {t.searchButton || 'Rechercher'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filtres */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "lg:w-80 flex-shrink-0 transition-all duration-300",
              showFilters ? "block" : "hidden lg:block"
            )}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 sticky top-24 overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-blue-600" />
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {t.filters || 'Filtres'}
                    </h2>
                  </div>
                  {hasFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      {t.clearAll || 'Effacer tout'}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-5 space-y-6">
                {/* Type de contenu */}
                <div>
                  <button
                    onClick={() => toggleFilter('type')}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type de contenu</span>
                    {expandedFilters.includes('type') ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {expandedFilters.includes('type') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1">
                          {typeOptions.map(option => {
                            const Icon = option.icon
                            return (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setType(option.value)
                                  setPage(1)
                                }}
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200",
                                  type === option.value
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                )}
                              >
                                <Icon className={cn("h-4 w-4", option.color)} />
                                <span className="text-sm font-medium">{option.label}</span>
                                {type === option.value && (
                                  <div className="ml-auto w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Tri */}
                <div>
                  <button
                    onClick={() => toggleFilter('sort')}
                    className="flex items-center justify-between w-full mb-3"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trier par</span>
                    {expandedFilters.includes('sort') ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {expandedFilters.includes('sort') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1">
                          {sortOptions.map(option => {
                            const Icon = option.icon
                            return (
                              <button
                                key={option.value}
                                onClick={() => setSort(option.value)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200",
                                  sort === option.value
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                )}
                              >
                                <Icon className="h-4 w-4" />
                                <span className="text-sm font-medium">{option.label}</span>
                                {sort === option.value && (
                                  <div className="ml-auto w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Résultats */}
          <div className="flex-1">
            {/* Mobile filter button */}
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full gap-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
              </Button>
            </div>
            
            {/* Résultats header */}
            {!loading && results.length > 0 && (
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">{total}</span> {t.results || 'résultats'}
                </div>
                <div className="text-xs text-gray-400">
                  Affichage des {Math.min(10, total)} premiers résultats
                </div>
              </div>
            )}
            
            {/* Résultats */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {[...Array(3)].map((_, i) => (
                    <ResultCardSkeleton key={i} />
                  ))}
                </motion.div>
              ) : results.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm"
                >
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {t.noResults || 'Aucun résultat trouvé'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    {t.tryDifferent || 'Essayez avec d\'autres mots-clés ou retirez certains filtres'}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {results.map((result, index) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ResultCard result={result} lang={lang} t={t} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant de carte de résultat professionnel
function ResultCard({ result, lang, t }: { result: SearchResult; lang: Locale; t: any }) {
  const getTypeConfig = () => {
    switch (result.type) {
      case 'project':
        return { icon: Briefcase, color: 'bg-blue-500', bgLight: 'bg-blue-50 dark:bg-blue-900/20', textColor: 'text-blue-600' }
      case 'freelancer':
        return { icon: User, color: 'bg-green-500', bgLight: 'bg-green-50 dark:bg-green-900/20', textColor: 'text-green-600' }
      case 'client':
        return { icon: Building2, color: 'bg-purple-500', bgLight: 'bg-purple-50 dark:bg-purple-900/20', textColor: 'text-purple-600' }
      case 'post':
        return { icon: FileText, color: 'bg-orange-500', bgLight: 'bg-orange-50 dark:bg-orange-900/20', textColor: 'text-orange-600' }
      case 'team':
        return { icon: Users, color: 'bg-cyan-500', bgLight: 'bg-cyan-50 dark:bg-cyan-900/20', textColor: 'text-cyan-600' }
      default:
        return { icon: Search, color: 'bg-gray-500', bgLight: 'bg-gray-50 dark:bg-gray-800', textColor: 'text-gray-600' }
    }
  }
  
  const config = getTypeConfig()
  const Icon = config.icon
  
  return (
    <Link href={`/${lang}${result.url}`}>
      <article className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800">
        <div className="p-6">
          <div className="flex items-start gap-5">
            {/* Avatar/Icon */}
            <div className="relative flex-shrink-0">
              {result.image ? (
                <div className="relative">
                  <Image
                    src={result.image}
                    alt={result.title}
                    width={64}
                    height={64}
                    className="rounded-2xl object-cover ring-4 ring-white dark:ring-gray-800"
                  />
                  {result.verified && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 ring-2 ring-white dark:ring-gray-800">
                      <Verified className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105",
                  config.bgLight
                )}>
                  <Icon className={cn("h-8 w-8", config.textColor)} />
                </div>
              )}
              
              {result.featured && (
                <div className="absolute -top-2 -right-2">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full p-1">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
            </div>
            
            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {result.title}
                    </h2>
                    {result.verified && (
                      <Verified className="h-4 w-4 text-blue-500" />
                    )}
                    {result.stats?.urgency && (
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        {result.stats.urgency}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <Badge variant="secondary" className="text-xs font-medium">
                      {result.type === 'project' ? (t.project || 'Projet') :
                       result.type === 'freelancer' ? (t.user || 'Freelance') :
                       result.type === 'client' ? 'Client' :
                       result.type === 'post' ? 'Publication' : (t.team || 'Équipe')}
                    </Badge>
                    
                    {result.stats?.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {result.stats.rating}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({result.stats.reviews})
                        </span>
                      </div>
                    )}
                    
                    {result.stats?.availability && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {result.stats.availability}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {result.stats?.price && (
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {result.stats.price}
                    </div>
                    <div className="text-xs text-gray-500">
                      {result.type === 'project' ? 'Budget' : 'Tarif horaire'}
                    </div>
                  </div>
                )}
              </div>
              
              <p className="mt-3 text-gray-600 dark:text-gray-400 line-clamp-2 text-sm">
                {result.description}
              </p>
              
              {/* Badges */}
              {result.badges && result.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {result.badges.slice(0, 4).map((badge) => (
                    <Badge key={badge} variant="outline" className="text-xs bg-gray-50 dark:bg-gray-800/50">
                      {badge}
                    </Badge>
                  ))}
                  {result.badges.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{result.badges.length - 4}
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Stats */}
              <div className="flex flex-wrap gap-4 mt-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                {result.stats?.location && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{result.stats.location}</span>
                  </div>
                )}
                {result.stats?.date && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{result.stats.date}</span>
                  </div>
                )}
                {result.stats?.applications && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Users className="h-3.5 w-3.5" />
                    <span>{result.stats.applications} candidatures</span>
                  </div>
                )}
                {result.stats?.projects && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>{result.stats.projects} projets</span>
                  </div>
                )}
                {result.stats?.views && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{result.stats.views} vues</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}

function ResultCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 animate-pulse">
      <div className="flex gap-5">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="flex gap-2 mt-3">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          </div>
        </div>
      </div>
    </div>
  )
}