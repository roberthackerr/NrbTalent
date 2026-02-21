"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, Filter, X, Star, Clock, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  "Développement Web",
  "Design Graphique",
  "Rédaction",
  "Marketing Digital",
  "Montage Vidéo",
  "Audio & Musique",
  "Business",
  "Lifestyle"
]

const DELIVERY_TIMES = [
  { value: 1, label: "24 heures" },
  { value: 3, label: "3 jours" },
  { value: 7, label: "7 jours" },
  { value: 14, label: "14 jours" },
  { value: 30, label: "1 mois" }
]

const RATINGS = [5, 4, 3, 2, 1]

interface GigFiltersProps {
  filters: any
  onFiltersChange: (filters: any) => void
}

export function GigFilters({ filters, onFiltersChange }: GigFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
      category: '',
      minPrice: '',
      maxPrice: '',
      deliveryTime: [],
      rating: [],
      sortBy: 'createdAt'
    })
  }

  const hasActiveFilters = filters.category || filters.minPrice || filters.maxPrice || 
                          filters.deliveryTime?.length > 0 || filters.rating?.length > 0

  return (
    <Card className="sticky top-4 border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Effacer
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Recherche */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Recherche</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Catégories */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Catégories</Label>
          <div className="space-y-2">
            {CATEGORIES.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`cat-${category}`}
                  checked={filters.category === category}
                  onCheckedChange={(checked) => 
                    updateFilter('category', checked ? category : '')
                  }
                />
                <Label htmlFor={`cat-${category}`} className="text-sm cursor-pointer">
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Prix */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">
            Prix - {filters.minPrice || 0}€ à {filters.maxPrice || 500}€
          </Label>
          <Slider
            defaultValue={[0, 500]}
            max={500}
            step={10}
            value={[parseInt(filters.minPrice) || 0, parseInt(filters.maxPrice) || 500]}
            onValueChange={([min, max]) => {
              updateFilter('minPrice', min.toString())
              updateFilter('maxPrice', max.toString())
            }}
            className="my-4"
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="min-price" className="text-xs text-slate-500">Min</Label>
              <input
                id="min-price"
                type="number"
                value={filters.minPrice || ''}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-800"
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="max-price" className="text-xs text-slate-500">Max</Label>
              <input
                id="max-price"
                type="number"
                value={filters.maxPrice || ''}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-800"
                placeholder="500"
              />
            </div>
          </div>
        </div>

        {/* Délai de livraison */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Délai de livraison
          </Label>
          <div className="space-y-2">
            {DELIVERY_TIMES.map((time) => (
              <div key={time.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`time-${time.value}`}
                  checked={filters.deliveryTime?.includes(time.value) || false}
                  onCheckedChange={(checked) => {
                    const current = filters.deliveryTime || []
                    const updated = checked 
                      ? [...current, time.value]
                      : current.filter((t: number) => t !== time.value)
                    updateFilter('deliveryTime', updated)
                  }}
                />
                <Label htmlFor={`time-${time.value}`} className="text-sm cursor-pointer">
                  {time.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Star className="h-4 w-4" />
            Note minimum
          </Label>
          <div className="space-y-2">
            {RATINGS.map((rating) => (
              <div key={rating} className="flex items-center space-x-2">
                <Checkbox
                  id={`rating-${rating}`}
                  checked={filters.rating?.includes(rating) || false}
                  onCheckedChange={(checked) => {
                    const current = filters.rating || []
                    const updated = checked 
                      ? [...current, rating]
                      : current.filter((r: number) => r !== rating)
                    updateFilter('rating', updated)
                  }}
                />
                <Label htmlFor={`rating-${rating}`} className="text-sm cursor-pointer flex items-center gap-1">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 text-yellow-500 fill-current" />
                  ))}
                  <span className="ml-1">{rating}.0 et plus</span>
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Tri */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Trier par</Label>
          <select
            value={filters.sortBy || 'createdAt'}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="createdAt">Plus récent</option>
            <option value="rating">Meilleures notes</option>
            <option value="price">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="ordersCount">Plus populaires</option>
          </select>
        </div>

        {/* Filtres actifs */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Filtres actifs</Label>
            <div className="flex flex-wrap gap-2">
              {filters.category && (
                <Badge variant="secondary" className="text-xs">
                  {filters.category}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => updateFilter('category', '')}
                  />
                </Badge>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <Badge variant="secondary" className="text-xs">
                  {filters.minPrice || 0}€ - {filters.maxPrice || 500}€
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => {
                      updateFilter('minPrice', '')
                      updateFilter('maxPrice', '')
                    }}
                  />
                </Badge>
              )}
              {filters.deliveryTime?.map((time: number) => (
                <Badge key={time} variant="secondary" className="text-xs">
                  {DELIVERY_TIMES.find(t => t.value === time)?.label}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => {
                      const updated = filters.deliveryTime.filter((t: number) => t !== time)
                      updateFilter('deliveryTime', updated)
                    }}
                  />
                </Badge>
              ))}
              {filters.rating?.map((rating: number) => (
                <Badge key={rating} variant="secondary" className="text-xs">
                  {rating} étoiles
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => {
                      const updated = filters.rating.filter((r: number) => r !== rating)
                      updateFilter('rating', updated)
                    }}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}