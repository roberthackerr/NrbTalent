"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, User, Star, MapPin, Briefcase, Loader2, CheckCircle2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface SearchCommandProps {
  variant?: "default" | "mobile"
}

interface SearchUser {
  _id: string
  name: string
  email: string
  title: string
  description: string
  bio: string
  avatar: string
  coverImage: string
  skills: Array<{ name: string; level?: string; category?: string }>
  location: string
  hourlyRate: number
  statistics?: {
    rating: number
    completedProjects: number
    responseRate?: number
    clientSatisfaction?: number
  }
  verified: boolean
  isActive: boolean
  createdAt: string
}

interface SearchResult {
  users: SearchUser[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function SearchCommand({ variant = "default" }: SearchCommandProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Recherche en temps réel
  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setResults(null)
        return
      }

      setLoading(true)
      try {
        const params = new URLSearchParams({
          q: query,
          limit: "6",
          role: "freelance"
        })

        const response = await fetch(`/api/users/search?${params}`)
        
        if (response.ok) {
          const data = await response.json()
          setResults(data)
        }
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(searchUsers, 300)
    return () => clearTimeout(timeoutId)
  }, [query])

  const handleSelectUser = (userId: string) => {
    console.log("🎯 Navigation vers profil:", userId)
    setOpen(false)
    setQuery("")
    router.push(`/profile/${userId}`)
  }

  const handleViewAllResults = () => {
    setOpen(false)
    setQuery("")
    router.push(`/talents?q=${encodeURIComponent(query)}`)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      {/* Bouton de déclenchement */}
      {variant === "default" ? (
        <Button
          variant="outline"
          className={cn(
            "relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2",
            "border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background/70"
          )}
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4 xl:mr-2" />
          <span className="hidden xl:inline-flex">Rechercher des freelances...</span>
          <span className="hidden xl:inline-flex ml-auto text-xs text-muted-foreground">
            ⌘K
          </span>
        </Button>
      ) : (
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground"
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4 mr-2" />
          Rechercher des freelances...
        </Button>
      )}

      {/* Dialog de recherche SIMPLIFIÉ */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-0">
          {/* DialogTitle caché pour l'accessibilité */}
          <DialogTitle className="sr-only">
            Recherche de freelances
          </DialogTitle>
          
          <div className="flex flex-col h-[600px]">
            {/* Header avec input */}
            <div className="p-4 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des freelances par nom, compétence, spécialité..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 pr-10 h-12 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  autoFocus
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Contenu des résultats */}
            <div className="flex-1 overflow-auto">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                  <span className="text-sm text-muted-foreground">Recherche en cours...</span>
                </div>
              )}

              {!loading && results && results.users.length > 0 && (
                <div className="p-2">
                  <div className="px-4 py-2 text-sm font-medium text-muted-foreground">
                    Freelances ({results.pagination.total})
                  </div>
                  {results.users.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleSelectUser(user._id)}
                      className="flex flex-col items-start gap-2 p-4 cursor-pointer hover:bg-accent/50 border-b border-border/20 last:border-0 transition-colors"
                    >
                      <div className="flex items-start gap-3 w-full">
                        {/* Avatar */}
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name}
                                className="h-12 w-12 rounded-full object-cover"
                              />
                            ) : (
                              getInitials(user.name)
                            )}
                          </div>
                          {user.verified && (
                            <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                              <CheckCircle2 className="h-3 w-3 text-white fill-white" />
                            </div>
                          )}
                        </div>
                        
                        {/* Informations */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground truncate">
                              {user.name}
                            </span>
                            {user.statistics?.rating > 0 && (
                              <div className="flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded-full">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                <span className="font-medium">{user.statistics.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground truncate mb-2">
                            {user.title}
                          </p>
                          
                          {/* Métriques */}
                          <div className="flex items-center gap-4 mb-2 text-xs text-muted-foreground">
                            {user.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{user.location}</span>
                              </div>
                            )}
                            
                            {user.hourlyRate > 0 && (
                              <div className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                <span className="font-medium text-green-600">
                                  {formatCurrency(user.hourlyRate)}/h
                                </span>
                              </div>
                            )}
                            
                            {user.statistics?.completedProjects > 0 && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{user.statistics.completedProjects} projets</span>
                              </div>
                            )}
                          </div>

                          {/* Compétences */}
                          {user.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {user.skills.slice(0, 3).map((skill, index) => (
                                <Badge 
                                  key={index} 
                                  variant="secondary" 
                                  className="text-xs font-normal"
                                >
                                  {skill.name}
                                </Badge>
                              ))}
                              {user.skills.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{user.skills.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Bouton voir tous */}
                  {results.pagination.total > results.users.length && (
                    <div className="p-4 border-t border-border/50">
                      <Button
                        variant="ghost"
                        className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={handleViewAllResults}
                      >
                        Voir tous les résultats ({results.pagination.total})
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {!loading && query && (!results || results.users.length === 0) && (
                <div className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Search className="h-12 w-12 text-muted-foreground/60" />
                    <div>
                      <p className="text-base font-medium text-foreground mb-1">
                        Aucun freelance trouvé
                      </p>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Aucun résultat pour "<span className="font-medium">{query}</span>". 
                        Essayez d'autres termes ou parcourez tous les freelances.
                      </p>
                    </div>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => router.push('/talents')}
                      className="mt-2"
                    >
                      Parcourir tous les freelances
                    </Button>
                  </div>
                </div>
              )}

              {!loading && !query && (
                <div className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Search className="h-12 w-12 text-muted-foreground/60" />
                    <div>
                      <p className="text-base font-medium text-foreground mb-1">
                        Rechercher des freelances
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Tapez pour rechercher par nom, compétence ou spécialité
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center text-xs text-muted-foreground mt-2">
                      <span className="bg-accent px-2 py-1 rounded">Développeur React</span>
                      <span className="bg-accent px-2 py-1 rounded">Designer UI/UX</span>
                      <span className="bg-accent px-2 py-1 rounded">Marketing Digital</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}