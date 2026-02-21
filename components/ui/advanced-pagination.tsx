// components/ui/advanced-pagination.tsx
'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (limit: number) => void
  loading?: boolean
  showItemsPerPage?: boolean
  showInfo?: boolean
  itemsPerPageOptions?: number[]
  maxVisiblePages?: number
  variant?: 'default' | 'compact' | 'full'
  className?: string
}

export function AdvancedPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  loading = false,
  showItemsPerPage = true,
  showInfo = true,
  itemsPerPageOptions = [6, 12, 24, 48, 96],
  maxVisiblePages = 7,
  variant = 'default',
  className
}: PaginationProps) {
  
  // Calculer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    
    if (totalPages <= maxVisiblePages) {
      // Afficher toutes les pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Affichage intelligent avec ellipses
      const leftSiblingIndex = Math.max(currentPage - 1, 1)
      const rightSiblingIndex = Math.min(currentPage + 1, totalPages)
      
      const shouldShowLeftDots = leftSiblingIndex > 2
      const shouldShowRightDots = rightSiblingIndex < totalPages - 1
      
      // Toujours afficher la première page
      pages.push(1)
      
      if (shouldShowLeftDots) {
        pages.push('...')
      }
      
      // Afficher les pages autour de la page actuelle
      for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i)
        }
      }
      
      if (shouldShowRightDots) {
        pages.push('...')
      }
      
      // Toujours afficher la dernière page
      if (totalPages !== 1) {
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  // Calculer les éléments affichés
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)
  
  const pageNumbers = getPageNumbers()

  // Pagination compacte
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center justify-between gap-2", className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {currentPage} / {totalPages}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  // Pagination complète
  return (
    <div className={cn("space-y-4", className)}>
      {/* Informations */}
      {showInfo && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="text-slate-600 dark:text-slate-400">
            Affichage de{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {startItem.toLocaleString()}
            </span>
            {' '}-{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {endItem.toLocaleString()}
            </span>
            {' '}sur{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {totalItems.toLocaleString()}
            </span>
            {' '}résultats
          </div>
          
          {showItemsPerPage && onItemsPerPageChange && (
            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-400">Par page:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
                disabled={loading}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {itemsPerPageOptions.map(option => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Contrôles de pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
        {/* Boutons de navigation rapide */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || loading}
            className="hidden sm:flex gap-1"
            title="Première page"
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="hidden lg:inline">Premier</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="gap-1"
            title="Page précédente"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden md:inline">Précédent</span>
          </Button>
        </div>

        {/* Numéros de page */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-slate-400"
                >
                  ...
                </span>
              )
            }

            const page = pageNum as number
            const isActive = page === currentPage

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                disabled={loading}
                className={cn(
                  "min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-all duration-200",
                  "hover:scale-105 active:scale-95",
                  isActive
                    ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                    : "border border-slate-300 dark:border-slate-600 hover:border-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 text-slate-700 dark:text-slate-300",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                {page}
              </button>
            )
          })}
        </div>

        {/* Boutons de navigation rapide */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="gap-1"
            title="Page suivante"
          >
            <span className="hidden md:inline">Suivant</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || loading}
            className="hidden sm:flex gap-1"
            title="Dernière page"
          >
            <span className="hidden lg:inline">Dernier</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Saut de page rapide */}
      {variant === 'full' && totalPages > 10 && (
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Aller à la page:
          </span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value)
              if (page >= 1 && page <= totalPages) {
                onPageChange(page)
              }
            }}
            disabled={loading}
            className="w-20 px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-800 dark:text-white text-center"
          />
        </div>
      )}

      {/* Barre de progression */}
      {variant === 'full' && (
        <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-300"
            style={{ width: `${(currentPage / totalPages) * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}