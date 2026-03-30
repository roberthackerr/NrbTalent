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
  MessageCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'

interface SearchResult {
  id: string
  title: string
  description: string
  type: 'project' | 'freelancer' | 'client' | 'post' | 'team'
  image?: string
  badges?: string[]
  stats?: any
  url: string
}

// Données fictives pour l'exemple
const fakeData: Record<string, SearchResult[]> = {
  projects: [
    {
      id: '1',
      title: 'Développement Site E-commerce React',
      description: 'Recherche développeur React pour créer un site e-commerce complet avec panier et paiement Stripe',
      type: 'project',
      badges: ['React', 'Node.js', 'Stripe'],
      stats: { price: '2500-4000€', date: 'Publié il y a 2 jours' },
      url: '/projects/1'
    },
    {
      id: '2',
      title: 'Refonte UI/UX Application Mobile',
      description: 'Designer UI/UX pour refondre l\'interface d\'une application mobile de fitness',
      type: 'project',
      badges: ['Figma', 'UI/UX', 'Mobile'],
      stats: { price: '1500-2500€', date: 'Publié il y a 5 jours' },
      url: '/projects/2'
    }
  ],
  freelancers: [
    {
      id: '1',
      title: 'Thomas Martin',
      description: 'Développeur Full Stack React/Node.js avec 8 ans d\'expérience',
      type: 'freelancer',
      image: 'https://randomuser.me/api/portraits/men/1.jpg',
      badges: ['React', 'Node.js', 'TypeScript'],
      stats: { rating: 4.9, reviews: 128, price: '45€/h', location: 'Paris' },
      url: '/profile/1'
    },
    {
      id: '2',
      title: 'Sophie Dubois',
      description: 'Designer UI/UX spécialisée dans les applications mobiles',
      type: 'freelancer',
      image: 'https://randomuser.me/api/portraits/women/2.jpg',
      badges: ['Figma', 'Adobe XD', 'UI/UX'],
      stats: { rating: 4.8, reviews: 95, price: '50€/h', location: 'Lyon' },
      url: '/profile/2'
    }
  ],
  clients: [
    {
      id: '1',
      title: 'TechCorp France',
      description: 'Entreprise tech recherchant des freelances pour projets innovants',
      type: 'client',
      badges: ['Tech', 'Startup'],
      stats: { location: 'Paris', projects: 45 },
      url: '/clients/1'
    }
  ],
  posts: [
    {
      id: '1',
      title: 'Comment réussir son premier projet freelance',
      description: 'Guide complet pour débuter en freelance et trouver ses premiers clients',
      type: 'post',
      badges: ['Guide', 'Débutant'],
      stats: { date: 'Publié le 15 mars 2024', views: 1234 },
      url: '/posts/1'
    }
  ],
  teams: [
    {
      id: '1',
      title: 'Équipe Dev React',
      description: 'Groupe de développeurs React pour projets collaboratifs',
      type: 'team',
      badges: ['React', 'Open Source'],
      stats: { members: 12, projects: 8 },
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
  
  // Charger les traductions
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])
  
  const t = dict?.search || {}
  
  // Simuler la recherche
  const performSearch = useCallback(async () => {
    setLoading(true)
    
    // Simuler un délai API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    let allResults: SearchResult[] = []
    
    if (type === 'all' || type === 'projects') {
      allResults = [...allResults, ...fakeData.projects]
    }
    if (type === 'all' || type === 'freelancers') {
      allResults = [...allResults, ...fakeData.freelancers]
    }
    if (type === 'all' || type === 'clients') {
      allResults = [...allResults, ...fakeData.clients]
    }
    if (type === 'all' || type === 'posts') {
      allResults = [...allResults, ...fakeData.posts]
    }
    if (type === 'all' || type === 'teams') {
      allResults = [...allResults, ...fakeData.teams]
    }
    
    // Filtrer par query
    if (query) {
      allResults = allResults.filter(r => 
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.description.toLowerCase().includes(query.toLowerCase()) ||
        r.badges?.some(b => b.toLowerCase().includes(query.toLowerCase()))
      )
    }
    
    // Trier
    if (sort === 'relevance') {
      // Déjà trié par pertinence
    } else if (sort === 'rating') {
      allResults.sort((a, b) => (b.stats?.rating || 0) - (a.stats?.rating || 0))
    } else if (sort === 'date') {
      allResults.sort((a, b) => (b.stats?.date || '').localeCompare(a.stats?.date || ''))
    }
    
    setResults(allResults)
    setTotal(allResults.length)
    setLoading(false)
    
    // Mettre à jour l'URL
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
  
  const hasFilters = query || type !== 'all' || sort !== 'relevance'
  
  const typeOptions = [
    { value: 'all', label: t.all || 'Tout', icon: Search },
    { value: 'projects', label: t.projects || 'Projets', icon: Briefcase },
    { value: 'freelancers', label: t.freelancers || 'Freelances', icon: User },
    { value: 'clients', label: 'Clients', icon: Users },
    { value: 'posts', label: 'Publications', icon: FileText },
    { value: 'teams', label: t.team || 'Équipes', icon: Users },
  ]
  
  const sortOptions = [
    { value: 'relevance', label: 'Pertinence' },
    { value: 'rating', label: 'Meilleure note' },
    { value: 'date', label: 'Plus récent' },
  ]
  
  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {query ? `${query} - ${t.title || 'Recherche'}` : t.title || 'Recherche'}
            </h1>
            {query && (
              <p className="text-blue-100 text-lg mb-8">
                {total} {t.results || 'résultats'}
              </p>
            )}
            
            {/* Barre de recherche */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.placeholder || "Rechercher..."}
                className="w-full pl-12 pr-32 py-6 text-lg rounded-2xl shadow-xl"
              />
              <Button 
                type="submit" 
                size="lg"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t.searchButton || 'Rechercher'}
              </Button>
            </form>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filtres */}
          <div className={cn(
            "lg:w-80 flex-shrink-0",
            showFilters ? "block" : "hidden lg:block"
          )}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {t.filters || 'Filtres'}
                </h2>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {t.clearAll || 'Effacer tout'}
                  </button>
                )}
              </div>
              
              {/* Type de contenu */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Type
                </label>
                <div className="space-y-2">
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
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                          type === option.value
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{option.label}</span>
                        {type === option.value && (
                          <CheckCircle className="h-4 w-4 ml-auto text-blue-600" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
              
              {/* Tri */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t.sortBy || 'Trier par'}
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Résultats */}
          <div className="flex-1">
            {/* Mobile filter button */}
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
              </Button>
            </div>
            
            {/* Résultats */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <ResultCardSkeleton key={i} />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t.noResults || 'Aucun résultat trouvé'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t.tryDifferent || 'Essayez avec d\'autres mots-clés'}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  {total} {t.results || 'résultats'}
                </div>
                
                <div className="space-y-4">
                  {results.map((result) => (
                    <ResultCard key={result.id} result={result} lang={lang} t={t} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant de carte de résultat
function ResultCard({ result, lang, t }: { result: SearchResult; lang: Locale; t: any }) {
  const getTypeIcon = () => {
    switch (result.type) {
      case 'project': return <Briefcase className="h-5 w-5 text-blue-500" />
      case 'freelancer': return <User className="h-5 w-5 text-green-500" />
      case 'client': return <Users className="h-5 w-5 text-purple-500" />
      case 'post': return <FileText className="h-5 w-5 text-orange-500" />
      case 'team': return <Users className="h-5 w-5 text-cyan-500" />
      default: return <Search className="h-5 w-5 text-gray-500" />
    }
  }
  
  const getTypeLabel = () => {
    switch (result.type) {
      case 'project': return t.project || 'Projet'
      case 'freelancer': return t.user || 'Freelance'
      case 'client': return 'Client'
      case 'post': return 'Publication'
      case 'team': return t.team || 'Équipe'
      default: return ''
    }
  }
  
  return (
    <Link href={`/${lang}${result.url}`}>
      <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Image/Avatar */}
            {result.image ? (
              <Image
                src={result.image}
                alt={result.title}
                width={56}
                height={56}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                {getTypeIcon()}
              </div>
            )}
            
            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 transition-colors">
                    {result.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {getTypeLabel()}
                    </Badge>
                    {result.stats?.rating && (
                      <div className="flex items-center gap-1">
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
                </div>
                
                {result.stats?.price && (
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {result.stats.price}
                    </div>
                    <div className="text-xs text-gray-500">Tarif</div>
                  </div>
                )}
              </div>
              
              <p className="mt-2 text-gray-600 dark:text-gray-400 line-clamp-2">
                {result.description}
              </p>
              
              {/* Badges */}
              {result.badges && result.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {result.badges.slice(0, 3).map((badge) => (
                    <Badge key={badge} variant="outline" className="text-xs">
                      {badge}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Stats */}
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                {result.stats?.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{result.stats.location}</span>
                  </div>
                )}
                {result.stats?.date && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{result.stats.date}</span>
                  </div>
                )}
                {result.stats?.projects && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    <span>{result.stats.projects} projets</span>
                  </div>
                )}
                {result.stats?.members && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{result.stats.members} membres</span>
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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
      <div className="flex gap-4">
        <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}