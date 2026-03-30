// components/search/SearchCommand.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { 
  Search, 
  Users, 
  Briefcase, 
  MessageSquare, 
  User, 
  Settings, 
  Clock,
  Star,
  X,
  Loader2,
  Home,
  TrendingUp,
  MapPin,
  Verified
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/useDebounce"
import { getDictionarySafe } from "@/lib/i18n/dictionaries"
import type { Locale } from "@/lib/i18n/config"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface SearchResult {
  id: string
  title: string
  description?: string
  type: 'project' | 'user' | 'conversation' | 'category' | 'skill'
  icon?: React.ReactNode
  url: string
  badge?: string
  avatar?: string
  category?: string
  rating?: number
  location?: string
  verified?: boolean
}

interface SearchCommandProps {
  isOpen: boolean
  onClose: () => void
  lang?: Locale
}

export function SearchCommand({ isOpen, onClose, lang = 'fr' }: SearchCommandProps) {
  const router = useRouter()
  const { data: session } = useSession()
  
  const [dict, setDict] = useState<any>(null)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchType, setSearchType] = useState<'all' | 'users' | 'projects'>('all')
  
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  // Charger les traductions
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  const t = dict?.search || {}

  // Shortcuts
  const shortcuts: SearchResult[] = [
    {
      id: 'home',
      title: t.goToHome || 'Accueil',
      type: 'category',
      icon: <Home className="h-4 w-4" />,
      url: `/${lang}`
    },
    {
      id: 'projects',
      title: t.goToProjects || 'Projets',
      type: 'category',
      icon: <Briefcase className="h-4 w-4" />,
      url: `/${lang}/projects`
    },
    {
      id: 'messages',
      title: t.goToMessages || 'Messages',
      type: 'category',
      icon: <MessageSquare className="h-4 w-4" />,
      url: `/${lang}/messages`
    },
    {
      id: 'profile',
      title: t.goToProfile || 'Mon profil',
      type: 'category',
      icon: <User className="h-4 w-4" />,
      url: `/${lang}/profile/${session?.user?.id}`
    },
    {
      id: 'settings',
      title: t.goToSettings || 'Paramètres',
      type: 'category',
      icon: <Settings className="h-4 w-4" />,
      url: `/${lang}/settings`
    }
  ]

  // Popular searches (statiques)
  const popularSearches: SearchResult[] = [
    {
      id: 'popular-1',
      title: 'Développement Web',
      type: 'category',
      icon: <TrendingUp className="h-4 w-4" />,
      url: `/${lang}/search?q=développement web`
    },
    {
      id: 'popular-2',
      title: 'React.js',
      type: 'skill',
      icon: <Star className="h-4 w-4" />,
      url: `/${lang}/search?q=react`
    },
    {
      id: 'popular-3',
      title: 'Design UI/UX',
      type: 'category',
      icon: <Briefcase className="h-4 w-4" />,
      url: `/${lang}/search?q=design ui/ux`
    },
    {
      id: 'popular-4',
      title: 'Freelances React',
      type: 'user',
      icon: <Users className="h-4 w-4" />,
      url: `/${lang}/search?q=react&type=freelancers`
    }
  ]

  // Charger les recherches récentes
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5))
      } catch (e) {
        console.error('Error loading recent searches', e)
      }
    }
  }, [])

  // Sauvegarder recherche
  const saveRecentSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return
    
    setRecentSearches(prev => {
      const updated = [searchTerm, ...prev.filter(s => s !== searchTerm)].slice(0, 5)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      return updated
    })
  }, [])

  // Recherche API - Utilisateurs uniquement pour la commande rapide
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    const search = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          limit: '5',
          page: '1'
        })
        
        const response = await fetch(`/api/users/search?${params}`)
        
        if (response.ok) {
          const data = await response.json()
          const formattedResults: SearchResult[] = []
          
          // Utilisateurs (freelances et clients)
          if (data.users?.length && (searchType === 'all' || searchType === 'users')) {
            formattedResults.push(...data.users.map((u: any) => ({
              id: u._id,
              title: u.name,
              description: u.title || u.bio?.substring(0, 80) || '',
              type: 'user' as const,
              icon: <User className="h-4 w-4" />,
              url: `/${lang}/profile/${u._id}`,
              avatar: u.avatar,
              badge: u.role === 'freelance' ? 'Freelance' : 'Client',
              rating: u.statistics?.rating,
              location: u.location,
              verified: u.verified
            })))
          }
          
          setResults(formattedResults.slice(0, 8))
        } else {
          console.error('Search API error')
          setResults([])
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }
    
    search()
  }, [debouncedQuery, searchType, lang])

  // Gestion clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        return
      }
      
      if (!isOpen) return
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < (results.length + (query ? 0 : shortcuts.length + popularSearches.length) - 1) 
              ? prev + 1 
              : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
          break
        case 'Enter':
          e.preventDefault()
          const allItems = query ? results : [...shortcuts, ...popularSearches]
          if (allItems[selectedIndex]) {
            handleSelect(allItems[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
        case 'Tab':
          e.preventDefault()
          setSearchType(prev => {
            if (prev === 'all') return 'users'
            if (prev === 'users') return 'projects'
            return 'all'
          })
          break
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, query, shortcuts, popularSearches, selectedIndex, onClose])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex])

  const handleSelect = (result: SearchResult) => {
    if (query) {
      saveRecentSearch(query)
    }
    onClose()
    router.push(result.url)
  }

  const handleRecentClick = (searchTerm: string) => {
    setQuery(searchTerm)
    saveRecentSearch(searchTerm)
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  if (!isOpen) return null

  const displayResults = query ? results : [...shortcuts, ...popularSearches]
  const hasResults = displayResults.length > 0

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      <div className="fixed top-[20%] left-1/2 transform -translate-x-1/2 w-full max-w-2xl z-50 animate-in slide-in-from-top-4 duration-200">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex items-center px-4">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.placeholder || "Rechercher..."}
                className="flex-1 px-3 py-4 text-base bg-transparent outline-none placeholder:text-gray-400"
                autoComplete="off"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            
            {/* Filtres rapides */}
            <div className="flex items-center gap-1 pr-2">
              <button
                onClick={() => setSearchType('all')}
                className={cn(
                  "px-2 py-1 text-xs rounded-md transition-colors",
                  searchType === 'all' 
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {t.all || 'Tout'}
              </button>
              <button
                onClick={() => setSearchType('users')}
                className={cn(
                  "px-2 py-1 text-xs rounded-md transition-colors",
                  searchType === 'users' 
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {t.freelancers || 'Freelances'}
              </button>
            </div>
          </div>
          
          {/* Résultats */}
          <div ref={resultsRef} className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">{t.loading || 'Chargement...'}</span>
              </div>
            ) : !hasResults && query ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">{t.noResults || 'Aucun résultat trouvé'}</p>
                <button
                  onClick={() => {
                    onClose()
                    router.push(`/${lang}/search?q=${encodeURIComponent(query)}`)
                  }}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                >
                  Voir tous les résultats →
                </button>
              </div>
            ) : (
              <div className="py-2">
                {/* Recherches récentes */}
                {!query && recentSearches.length > 0 && (
                  <div className="px-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {t.recentSearches || 'Recherches récentes'}
                      </p>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        {t.clear || 'Effacer'}
                      </button>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((search, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleRecentClick(search)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{search}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Résultats */}
                <div className="px-2">
                  {displayResults.map((result, idx) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                        selectedIndex === idx && "bg-gray-100 dark:bg-gray-800"
                      )}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      {/* Avatar/Icône */}
                      <div className="flex-shrink-0">
                        {result.avatar ? (
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={result.avatar} />
                            <AvatarFallback>{result.title?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center",
                            result.type === 'user' && "bg-green-100 text-green-600 dark:bg-green-900/30",
                            result.type === 'category' && "bg-orange-100 text-orange-600 dark:bg-orange-900/30",
                            result.type === 'skill' && "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30"
                          )}>
                            {result.icon || <User className="h-5 w-5" />}
                          </div>
                        )}
                      </div>
                      
                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {result.title}
                          </p>
                          {result.verified && (
                            <Verified className="h-3.5 w-3.5 text-blue-500" />
                          )}
                          {result.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600">
                              {result.badge}
                            </span>
                          )}
                        </div>
                        {result.description && (
                          <p className="text-sm text-gray-500 truncate mt-0.5">
                            {result.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          {result.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              <span>{result.rating}</span>
                            </div>
                          )}
                          {result.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{result.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Voir tous les résultats */}
                      {query && idx === displayResults.length - 1 && displayResults.length >= 5 && (
                        <div className="flex-shrink-0 text-xs text-blue-600">
                          Voir plus →
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Lien vers page de recherche complète */}
                {query && (
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 mt-2">
                    <button
                      onClick={() => {
                        onClose()
                        router.push(`/${lang}/search?q=${encodeURIComponent(query)}`)
                      }}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Voir tous les résultats pour "{query}" →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↑↓</kbd>
                <span>{t.navigate || 'naviguer'}</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↵</kbd>
                <span>{t.select || 'sélectionner'}</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Esc</kbd>
                <span>{t.close || 'fermer'}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">⌘K</kbd>
              <span>{t.or || 'ou'}</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Ctrl+K</kbd>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export function useSearchCommand() {
  const [isOpen, setIsOpen] = useState(false)
  
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])
  
  return { isOpen, open, close, toggle }
}

export function SearchButton({ onClick, lang = 'fr' }: { onClick?: () => void; lang?: Locale }) {
  const [isMac, setIsMac] = useState(false)
  const [dict, setDict] = useState<any>(null)
  
  useEffect(() => {
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform))
    getDictionarySafe(lang).then(setDict)
  }, [lang])
  
  const t = dict?.search || {}
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
        "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
        "hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      )}
    >
      <Search className="h-4 w-4 text-gray-400" />
      <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">
        {t.placeholder || 'Rechercher...'}
      </span>
      <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 dark:bg-gray-700 rounded">
        {isMac ? '⌘K' : 'Ctrl+K'}
      </kbd>
    </button>
  )
}