// components/search/SearchCommand.tsx
"use client"

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
  HelpCircle, 
  TrendingUp,
  Clock,
  Star,
  X,
  Loader2,
  Command,
  ArrowUp,
  ArrowDown,
  Home,
  FileText,
  Calendar,
  Tag,
  Bookmark,
  Sparkles,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/useDebounce"

interface SearchResult {
  id: string
  title: string
  description?: string
  type: 'project' | 'user' | 'conversation' | 'category' | 'skill' | 'team'
  icon?: React.ReactNode
  url: string
  badge?: string
  avatar?: string
  category?: string
}

interface SearchCommandProps {
  isOpen: boolean
  onClose: () => void
  lang?: 'fr' | 'en' | 'mg'
}

const translations = {
  fr: {
    searchPlaceholder: "Rechercher des projets, freelances, messages...",
    recentSearches: "Recherches récentes",
    popularSearches: "Recherches populaires",
    categories: "Catégories",
    skills: "Compétences",
    noResults: "Aucun résultat trouvé",
    tryDifferent: "Essayez avec des termes différents",
    searchProjects: "Rechercher des projets",
    searchFreelancers: "Rechercher des freelances",
    openMenu: "Ouvrir le menu",
    shortcuts: "Raccourcis",
    goToHome: "Accueil",
    goToProjects: "Projets",
    goToMessages: "Messages",
    goToProfile: "Mon profil",
    goToSettings: "Paramètres",
    loading: "Chargement...",
    pressToSearch: "Appuyez sur ⌘K ou Ctrl+K pour rechercher"
  },
  en: {
    searchPlaceholder: "Search projects, freelancers, messages...",
    recentSearches: "Recent searches",
    popularSearches: "Popular searches",
    categories: "Categories",
    skills: "Skills",
    noResults: "No results found",
    tryDifferent: "Try different terms",
    searchProjects: "Search projects",
    searchFreelancers: "Search freelancers",
    openMenu: "Open menu",
    shortcuts: "Shortcuts",
    goToHome: "Home",
    goToProjects: "Projects",
    goToMessages: "Messages",
    goToProfile: "My profile",
    goToSettings: "Settings",
    loading: "Loading...",
    pressToSearch: "Press ⌘K or Ctrl+K to search"
  },
  mg: {
    searchPlaceholder: "Hikaroka tetikasa, freelances, hafatra...",
    recentSearches: "Fikarohana vao haingana",
    popularSearches: "Fikarohana malaza",
    categories: "Sokajy",
    skills: "Fahaizana",
    noResults: "Tsy misy valiny hita",
    tryDifferent: "Andramo teny hafa",
    searchProjects: "Hikaroka tetikasa",
    searchFreelancers: "Hikaroka freelances",
    openMenu: "Hanokatra menio",
    shortcuts: "Fomba haingana",
    goToHome: "Fandraisana",
    goToProjects: "Tetikasa",
    goToMessages: "Hafatra",
    goToProfile: "Momba ahy",
    goToSettings: "Fandrindrana",
    loading: "Amplasiana...",
    pressToSearch: "Tsindrio ⌘K na Ctrl+K hikaroka"
  }
}

export function SearchCommand({ isOpen, onClose, lang = 'fr' }: SearchCommandProps) {
  const t = translations[lang]
  const router = useRouter()
  const { data: session } = useSession()
  
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchType, setSearchType] = useState<'all' | 'projects' | 'users' | 'messages'>('all')
  
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  // Shortcuts
  const shortcuts: SearchResult[] = [
    {
      id: 'home',
      title: t.goToHome,
      type: 'category',
      icon: <Home className="h-4 w-4" />,
      url: '/'
    },
    {
      id: 'projects',
      title: t.goToProjects,
      type: 'category',
      icon: <Briefcase className="h-4 w-4" />,
      url: '/projects'
    },
    {
      id: 'messages',
      title: t.goToMessages,
      type: 'category',
      icon: <MessageSquare className="h-4 w-4" />,
      url: '/messages'
    },
    {
      id: 'profile',
      title: t.goToProfile,
      type: 'category',
      icon: <User className="h-4 w-4" />,
      url: `/profile/${session?.user?.id}`
    },
    {
      id: 'settings',
      title: t.goToSettings,
      type: 'category',
      icon: <Settings className="h-4 w-4" />,
      url: '/settings'
    }
  ]

  // Popular searches (à charger depuis API)
  const popularSearches: SearchResult[] = [
    {
      id: 'popular-1',
      title: 'Développement Web',
      type: 'category',
      icon: <Tag className="h-4 w-4" />,
      url: '/projects?category=web-development'
    },
    {
      id: 'popular-2',
      title: 'React.js',
      type: 'skill',
      icon: <Sparkles className="h-4 w-4" />,
      url: '/projects?skills=React'
    },
    {
      id: 'popular-3',
      title: 'Design UI/UX',
      type: 'category',
      icon: <Star className="h-4 w-4" />,
      url: '/projects?category=design'
    },
    {
      id: 'popular-4',
      title: 'Freelances React',
      type: 'user',
      icon: <Users className="h-4 w-4" />,
      url: '/freelancers?skills=React'
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

  // Recherche API
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
          type: searchType
        })
        
        const response = await fetch(`/api/search?${params}`)
        
        if (response.ok) {
          const data = await response.json()
          const formattedResults: SearchResult[] = []
          
          // Projets
          if (data.projects?.length && (searchType === 'all' || searchType === 'projects')) {
            formattedResults.push(...data.projects.map((p: any) => ({
              id: p._id,
              title: p.title,
              description: p.description?.substring(0, 100),
              type: 'project' as const,
              icon: <Briefcase className="h-4 w-4" />,
              url: `/projects/${p._id}`,
              badge: `${p.budget?.min}${p.budget?.currency}`,
              category: p.category
            })))
          }
          
          // Utilisateurs
          if (data.users?.length && (searchType === 'all' || searchType === 'users')) {
            formattedResults.push(...data.users.map((u: any) => ({
              id: u._id,
              title: u.name,
              description: u.title || u.email,
              type: 'user' as const,
              icon: <User className="h-4 w-4" />,
              url: `/profile/${u._id}`,
              avatar: u.avatar,
              badge: u.role === 'freelance' ? 'Freelance' : 'Client'
            })))
          }
          
          // Conversations
          if (data.conversations?.length && (searchType === 'all' || searchType === 'messages')) {
            formattedResults.push(...data.conversations.map((c: any) => ({
              id: c._id,
              title: c.otherParticipant?.name || 'Conversation',
              description: c.lastMessage?.substring(0, 60),
              type: 'conversation' as const,
              icon: <MessageSquare className="h-4 w-4" />,
              url: `/messages/${c._id}`,
              badge: c.unreadCount > 0 ? `${c.unreadCount}` : undefined
            })))
          }
          
          setResults(formattedResults.slice(0, 10))
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
  }, [debouncedQuery, searchType])

  // Gestion clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K ou Ctrl+K pour ouvrir
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else onClose() // Pour ouvrir, le parent doit gérer l'état
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
            if (prev === 'all') return 'projects'
            if (prev === 'projects') return 'users'
            if (prev === 'users') return 'messages'
            return 'all'
          })
          break
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, query, shortcuts, popularSearches, selectedIndex, onClose])

  // Focus input quand ouvert
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Scroll dans les résultats
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
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed top-[20%] left-1/2 transform -translate-x-1/2 w-full max-w-2xl z-50 animate-in slide-in-from-top-4 duration-200">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header avec filtres */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex items-center px-4">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
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
            
            {/* Filtres */}
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
                Tout
              </button>
              <button
                onClick={() => setSearchType('projects')}
                className={cn(
                  "px-2 py-1 text-xs rounded-md transition-colors",
                  searchType === 'projects' 
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                Projets
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
                Freelances
              </button>
              <button
                onClick={() => setSearchType('messages')}
                className={cn(
                  "px-2 py-1 text-xs rounded-md transition-colors",
                  searchType === 'messages' 
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                Messages
              </button>
            </div>
          </div>
          
          {/* Résultats */}
          <div ref={resultsRef} className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">{t.loading}</span>
              </div>
            ) : !hasResults && query ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">{t.noResults}</p>
                <p className="text-sm text-gray-400 mt-1">{t.tryDifferent}</p>
              </div>
            ) : (
              <div className="py-2">
                {/* Recherches récentes (seulement si pas de query) */}
                {!query && recentSearches.length > 0 && (
                  <div className="px-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {t.recentSearches}
                      </p>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Effacer
                      </button>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((search, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleRecentClick(search)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                            "hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
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
                          <img 
                            src={result.avatar} 
                            alt={result.title}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center",
                            result.type === 'project' && "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
                            result.type === 'user' && "bg-green-100 text-green-600 dark:bg-green-900/30",
                            result.type === 'conversation' && "bg-purple-100 text-purple-600 dark:bg-purple-900/30",
                            result.type === 'category' && "bg-orange-100 text-orange-600 dark:bg-orange-900/30",
                            result.type === 'skill' && "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30"
                          )}>
                            {result.icon || (
                              result.type === 'project' ? <Briefcase className="h-5 w-5" /> :
                              result.type === 'user' ? <User className="h-5 w-5" /> :
                              result.type === 'conversation' ? <MessageSquare className="h-5 w-5" /> :
                              <Search className="h-5 w-5" />
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {result.title}
                          </p>
                          {result.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                              {result.badge}
                            </span>
                          )}
                          {result.category && (
                            <span className="text-[10px] text-gray-400">
                              {result.category}
                            </span>
                          )}
                        </div>
                        {result.description && (
                          <p className="text-sm text-gray-500 truncate mt-0.5">
                            {result.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Type badge */}
                      <div className="flex-shrink-0">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full",
                          result.type === 'project' && "bg-blue-100 text-blue-700",
                          result.type === 'user' && "bg-green-100 text-green-700",
                          result.type === 'conversation' && "bg-purple-100 text-purple-700",
                          result.type === 'category' && "bg-orange-100 text-orange-700",
                          result.type === 'skill' && "bg-cyan-100 text-cyan-700"
                        )}>
                          {result.type === 'project' && 'Projet'}
                          {result.type === 'user' && 'Freelance'}
                          {result.type === 'conversation' && 'Message'}
                          {result.type === 'category' && 'Catégorie'}
                          {result.type === 'skill' && 'Compétence'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer avec raccourcis */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px]">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px]">↓</kbd>
                <span>naviguer</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px]">↵</kbd>
                <span>sélectionner</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px]">⌘K</kbd>
                <span>fermer</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px]">⌘K</kbd>
              <span>ou</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px]">Ctrl+K</kbd>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Hook personnalisé pour utiliser la recherche
export function useSearchCommand() {
  const [isOpen, setIsOpen] = useState(false)
  
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])
  
  return { isOpen, open, close, toggle }
}

// Bouton de déclenchement
export function SearchButton({ onClick }: { onClick?: () => void }) {
  const [isMac, setIsMac] = useState(false)
  
  useEffect(() => {
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform))
  }, [])
  
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
        Rechercher...
      </span>
      <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 dark:bg-gray-700 rounded">
        {isMac ? '⌘K' : 'Ctrl+K'}
      </kbd>
    </button>
  )
}