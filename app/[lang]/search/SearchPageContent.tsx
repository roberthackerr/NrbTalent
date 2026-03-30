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
  Loader2,
  Filter,
  X,
  Sparkles,
  Building2,
  Calendar,
  Eye,
  Verified,
  TrendingUp,
  MessageCircle,
  Heart,
  Share2,
  Bookmark,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  List,
  SlidersHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  author?: {
    name: string
    avatar?: string
    role?: string
  }
  engagement?: {
    likes: number
    comments: number
    shares: number
  }
}

// Données fictives
const fakeData: Record<string, SearchResult[]> = {
  projects: [
    {
      id: '1',
      title: 'Développement Site E-commerce React',
      description: 'Recherche développeur React pour créer un site e-commerce complet avec panier et paiement Stripe. Stack: React, Node.js, MongoDB, Stripe API.',
      type: 'project',
      badges: ['React', 'Node.js', 'Stripe'],
      stats: { budget: '2500-4000€', deadline: '30 jours', proposals: 12 },
      url: '/projects/1',
      featured: true,
      author: { name: 'TechCorp', role: 'Client vérifié' },
      engagement: { likes: 24, comments: 5, shares: 3 }
    },
    {
      id: '2',
      title: 'Refonte UI/UX Application Mobile',
      description: 'Designer UI/UX pour refondre l\'interface d\'une application mobile de fitness avec 50k+ utilisateurs.',
      type: 'project',
      badges: ['Figma', 'UI/UX', 'Mobile'],
      stats: { budget: '1500-2500€', deadline: '15 jours', proposals: 8 },
      url: '/projects/2',
      author: { name: 'FitApp', role: 'Startup' },
      engagement: { likes: 18, comments: 3, shares: 2 }
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
      stats: { rating: 4.9, reviews: 128, rate: '45€/h', location: 'Paris', projects: 47 },
      url: '/profile/1',
      verified: true,
      featured: true,
      author: { name: 'Thomas Martin', role: 'Freelance Expert' },
      engagement: { likes: 342, comments: 28, shares: 45 }
    },
    {
      id: '2',
      title: 'Sophie Dubois',
      description: 'Designer UI/UX spécialisée dans les applications mobiles et le design système. 6 ans d\'expérience.',
      type: 'freelancer',
      image: 'https://randomuser.me/api/portraits/women/2.jpg',
      badges: ['Figma', 'Adobe XD', 'UI/UX'],
      stats: { rating: 4.8, reviews: 95, rate: '50€/h', location: 'Lyon', projects: 32 },
      url: '/profile/2',
      verified: true,
      author: { name: 'Sophie Dubois', role: 'UI/UX Designer' },
      engagement: { likes: 287, comments: 42, shares: 23 }
    }
  ],
  posts: [
    {
      id: '1',
      title: 'Comment réussir son premier projet freelance',
      description: 'Guide complet pour débuter en freelance et trouver ses premiers clients. Astuces, pièges à éviter et stratégies gagnantes.',
      type: 'post',
      badges: ['Guide', 'Débutant'],
      stats: { date: '15 mars 2024', readTime: '8 min' },
      url: '/posts/1',
      featured: true,
      author: { name: 'Marie Lambert', avatar: 'https://randomuser.me/api/portraits/women/5.jpg', role: 'Expert Freelance' },
      engagement: { likes: 156, comments: 23, shares: 67 }
    }
  ],
  teams: [
    {
      id: '1',
      title: 'Équipe Dev React',
      description: 'Groupe de développeurs React passionnés pour projets collaboratifs et open source.',
      type: 'team',
      badges: ['React', 'Open Source'],
      stats: { members: 12, projects: 8 },
      url: '/teams/1',
      author: { name: 'React Community', role: 'Communauté' },
      engagement: { likes: 89, comments: 12, shares: 8 }
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
  const [sort, setSort] = useState(searchParams.sort || 'relevance')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [activeTab, setActiveTab] = useState<'all' | 'projects' | 'freelancers' | 'posts'>('all')
  
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
    router.replace(`${pathname}?${urlParams.toString()}`, { scroll: false })
  }, [query, type, sort, router, pathname])
  
  useEffect(() => {
    performSearch()
  }, [performSearch])
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch()
  }
  
  const clearFilters = () => {
    setQuery('')
    setType('all')
    setSort('relevance')
  }
  
  const hasFilters = query || type !== 'all' || sort !== 'relevance'
  
  const tabs = [
    { id: 'all', label: t.all || 'Tout', icon: Search },
    { id: 'projects', label: t.projects || 'Projets', icon: Briefcase },
    { id: 'freelancers', label: t.freelancers || 'Freelances', icon: User },
    { id: 'posts', label: 'Publications', icon: FileText },
  ]
  
  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header avec recherche */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 py-3">
            {/* Barre de recherche */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.placeholder || "Rechercher des projets, freelances..."}
                  className="w-full pl-9 pr-12 py-2 text-sm rounded-full bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </form>
            
            {/* Filtre rapide */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "rounded-full",
                showFilters && "bg-gray-100 dark:bg-gray-800"
              )}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
            
            {/* Vue mode */}
            <div className="hidden sm:flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={cn(
                  "rounded-full",
                  viewMode === 'list' && "bg-gray-100 dark:bg-gray-800"
                )}
              >
                <List className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={cn(
                  "rounded-full",
                  viewMode === 'grid' && "bg-gray-100 dark:bg-gray-800"
                )}
              >
                <Grid3X3 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filtres */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex-shrink-0 overflow-hidden"
              >
                <div className="w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky top-20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Filtres</h3>
                    {hasFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                  
                  {/* Type */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Type
                    </label>
                    <div className="space-y-1">
                      {tabs.map(tab => {
                        const Icon = tab.icon
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setType(tab.id === 'all' ? 'all' : tab.id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                              type === (tab.id === 'all' ? 'all' : tab.id)
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{tab.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  
                  {/* Tri */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Trier par
                    </label>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                    >
                      <option value="relevance">Pertinence</option>
                      <option value="rating">Meilleure note</option>
                      <option value="date">Plus récent</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700 mb-6">
              {tabs.map(tab => {
                const Icon = tab.icon
                const isActive = type === (tab.id === 'all' ? 'all' : tab.id)
                return (
                  <button
                    key={tab.id}
                    onClick={() => setType(tab.id === 'all' ? 'all' : tab.id)}
                    className={cn(
                      "flex items-center gap-2 pb-3 text-sm font-medium transition-colors relative",
                      isActive 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.id !== 'all' && fakeData[tab.id as keyof typeof fakeData] && (
                      <span className="text-xs text-gray-400">
                        {fakeData[tab.id as keyof typeof fakeData]?.length || 0}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                      />
                    )}
                  </button>
                )
              })}
            </div>
            
            {/* Résultats count */}
            {!loading && results.length > 0 && (
              <div className="mb-4 text-sm text-gray-500">
                <span className="font-medium text-gray-900 dark:text-white">{total}</span> résultats
              </div>
            )}
            
            {/* Liste des résultats */}
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
                    <PostSkeleton key={i} viewMode={viewMode} />
                  ))}
                </motion.div>
              ) : results.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    Aucun résultat trouvé
                  </h3>
                  <p className="text-sm text-gray-500">
                    Essayez avec d'autres mots-clés
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "space-y-4",
                    viewMode === 'grid' && "grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0"
                  )}
                >
                  {results.map((result, index) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {viewMode === 'grid' ? (
                        <GridCard result={result} lang={lang} />
                      ) : (
                        <FeedCard result={result} lang={lang} />
                      )}
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

// Composant Feed Card (style réseau social)
function FeedCard({ result, lang }: { result: SearchResult; lang: Locale }) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const getTypeColor = () => {
    switch (result.type) {
      case 'project': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'freelancer': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      case 'post': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
      case 'team': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }
  
  return (
    <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={result.author?.avatar || result.image} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
              {result.title?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {result.author?.name || result.title}
              </span>
              {result.verified && (
                <Verified className="h-3.5 w-3.5 text-blue-500" />
              )}
              <Badge className={cn("text-[10px]", getTypeColor())}>
                {result.type === 'project' ? 'Projet' : 
                 result.type === 'freelancer' ? 'Freelance' : 
                 result.type === 'post' ? 'Article' : 'Équipe'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{result.author?.role || ''}</span>
              {result.stats?.date && (
                <>
                  <span>•</span>
                  <span>{result.stats.date}</span>
                </>
              )}
              {result.stats?.readTime && (
                <>
                  <span>•</span>
                  <span>{result.stats.readTime} de lecture</span>
                </>
              )}
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Contenu */}
      <div className="p-4">
        <Link href={`/${lang}${result.url}`}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 transition-colors mb-2">
            {result.title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {result.description}
          </p>
        </Link>
        
        {/* Badges */}
        {result.badges && result.badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {result.badges.slice(0, 3).map((badge) => (
              <Badge key={badge} variant="secondary" className="text-xs">
                {badge}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Stats */}
        {result.stats && (
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
            {result.stats.budget && (
              <div className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                <span>{result.stats.budget}</span>
              </div>
            )}
            {result.stats.rate && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{result.stats.rate}</span>
              </div>
            )}
            {result.stats.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{result.stats.location}</span>
              </div>
            )}
            {result.stats.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                <span>{result.stats.rating} ({result.stats.reviews})</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLiked(!liked)}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors",
              liked ? "text-red-500" : "text-gray-500 hover:text-red-500"
            )}
          >
            <Heart className={cn("h-5 w-5", liked && "fill-current")} />
            <span>{(result.engagement?.likes || 0) + (liked ? 1 : 0)}</span>
          </button>
          <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-500 transition-colors">
            <MessageCircle className="h-5 w-5" />
            <span>{result.engagement?.comments || 0}</span>
          </button>
          <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-500 transition-colors">
            <Share2 className="h-5 w-5" />
            <span>{result.engagement?.shares || 0}</span>
          </button>
        </div>
        <button
          onClick={() => setSaved(!saved)}
          className={cn(
            "text-gray-400 hover:text-blue-500 transition-colors",
            saved && "text-blue-500"
          )}
        >
          <Bookmark className={cn("h-5 w-5", saved && "fill-current")} />
        </button>
      </div>
    </article>
  )
}

// Composant Grid Card
function GridCard({ result, lang }: { result: SearchResult; lang: Locale }) {
  return (
    <Link href={`/${lang}${result.url}`}>
      <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-200 dark:border-gray-700 group">
        {result.image && (
          <div className="aspect-video overflow-hidden">
            <Image
              src={result.image}
              alt={result.title}
              width={400}
              height={225}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              {result.type === 'project' ? 'Projet' : 
               result.type === 'freelancer' ? 'Freelance' : 
               result.type === 'post' ? 'Article' : 'Équipe'}
            </Badge>
            {result.featured && (
              <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                En vedette
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">
            {result.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {result.description}
          </p>
          {result.stats?.rating && (
            <div className="flex items-center gap-1 mt-3">
              <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {result.stats.rating}
              </span>
              <span className="text-xs text-gray-500">
                ({result.stats.reviews})
              </span>
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}

function PostSkeleton({ viewMode }: { viewMode: string }) {
  if (viewMode === 'grid') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 animate-pulse">
        <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      </div>
    )
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-1" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        </div>
      </div>
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
    </div>
  )
}