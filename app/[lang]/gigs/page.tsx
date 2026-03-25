"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import { GigsShowcase } from "@/components/home/gigs-showcase"
import { GigFilters } from "@/components/gigs/GigFilters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Filter, SlidersHorizontal, Grid3X3, List, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getDictionarySafe } from "@/lib/i18n/dictionaries"
import type { Locale } from "@/lib/i18n/config"
import { OrdersButtonHero } from "@/components/orders/OrdersButton"

interface Filters {
  category: string
  minPrice: string
  maxPrice: string
  deliveryTime: string[]
  rating: string[]
  sortBy: string
  search: string
}

export default function GigsPage() {
  const { data: session } = useSession()
  const params = useParams()
  const lang = params.lang as Locale
  
  const [dict, setDict] = useState<any>(null)
  const [gigs, setGigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<Filters>({
    category: '',
    minPrice: '',
    maxPrice: '',
    deliveryTime: [],
    rating: [],
    sortBy: 'createdAt',
    search: ''
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  const fetchGigs = useCallback(async () => {
    if (!dict) return
    
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      // Ajouter les filtres aux paramètres
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach((v: any) => params.append(key, v.toString()))
          } else {
            params.append(key, value.toString())
          }
        }
      })

      const response = await fetch(`/api/gigs?${params}`)
      const data = await response.json()

      if (response.ok) {
        setGigs(data.gigs || [])
      } else {
        throw new Error(data.error || 'Failed to fetch gigs')
      }
    } catch (error) {
      console.error('Error fetching gigs:', error)
      toast.error(dict?.gigs_page?.errors?.fetch || "Erreur lors du chargement des services")
    } finally {
      setLoading(false)
    }
  }, [filters, dict])

  useEffect(() => {
    if (dict) {
      fetchGigs()
    }
  }, [fetchGigs, dict])

  // Recherche avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchQuery }))
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  if (!isMounted || !dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            {dict?.common?.loading || "Chargement..."}
          </p>
        </div>
      </div>
    )
  }

  const activeGigsCount = gigs.filter(g => g.status === 'active').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-slate-900">
      {/* Header Hero */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="hero-section">
  <h1>Bienvenue</h1>
  <OrdersButtonHero dict={dict} lang={lang} />
</div>

          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {dict?.gigs_page?.heroTitle || "Trouvez le service parfait"}
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              {dict?.gigs_page?.heroSubtitle || "Des milliers de freelances talentueux prêts à réaliser vos projets"}
            </p>
            
            {/* Barre de recherche principale */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder={dict?.gigs_page?.searchPlaceholder || "Rechercher un service, une compétence..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-slate-900 bg-white border-0 rounded-full shadow-lg focus:ring-2 focus:ring-blue-500"
              />
              <Button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                {dict?.gigs_page?.filters || "Filtres"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <div className={cn(
            "lg:w-80 flex-shrink-0 transition-all duration-300",
            showFilters ? "block" : "hidden lg:block"
          )}>
            <GigFilters 
              filters={filters} 
              onFiltersChange={setFilters}
              dict={dict}
              lang={lang}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header avec stats et contrôles */}
            <Card className="border-slate-200 dark:border-slate-800 mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {dict?.gigs_page?.availableTitle || "Services Disponibles"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                      {!loading && (
                        <>
                       {/* {gigs.length} {
  dict?.gigs_page?.servicesFound
    ?.replace('{count}', gigs.length.toString())
    ?.replace('{s}', gigs.length > 1 ? 's' : '') || 
    `service${gigs.length > 1 ? 's' : ''} trouvé${gigs.length > 1 ? 's' : ''}`
} */}
<span className="text-green-600 dark:text-green-400 font-medium ml-2">
  • {activeGigsCount} {
    dict?.gigs_page?.active
      ?.replace('{count}', activeGigsCount.toString())
  
  }
</span>
                        </>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Toggle View Mode */}
                    <div className="flex border border-slate-300 dark:border-slate-600 rounded-lg p-1">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className={cn(
                          "h-9 w-9 p-0",
                          viewMode === 'grid' && "bg-blue-600 text-white"
                        )}
                        title={dict?.gigs_page?.gridView || "Vue grille"}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={cn(
                          "h-9 w-9 p-0",
                          viewMode === 'list' && "bg-blue-600 text-white"
                        )}
                        title={dict?.gigs_page?.listView || "Vue liste"}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Toggle Filters Mobile */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="lg:hidden"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      {dict?.gigs_page?.filters || "Filtres"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gig Showcase */}
            <GigsShowcase 
              gigs={gigs}
              loading={loading}
              searchQuery={searchQuery}
              showCreateButton={!!session}
              dict={dict}
              lang={lang}
            />
          </div>
        </div>
      </div>

      {/* Overlay pour mobile filters */}
      {showFilters && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowFilters(false)}
        />
      )}
    </div>
  )
}