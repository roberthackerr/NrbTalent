// components/orders/OrdersButton.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Package, ShoppingBag, Clock, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

interface OrdersButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'gradient'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showIcon?: boolean
  showCount?: boolean
  label?: string
  dict?: any
  lang?: string
}

export function OrdersButton({
  variant = 'gradient',
  size = 'default',
  className,
  showIcon = true,
  showCount = true,
  label,
  dict,
  lang
}: OrdersButtonProps) {
  const router = useRouter()
  const params = useParams()
  const currentLang = lang || (params.lang as string) || 'fr'
  const [orderCount, setOrderCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [localDict, setLocalDict] = useState<any>(null)

  // Charger le dictionnaire si non fourni
  useEffect(() => {
    if (!dict) {
      getDictionarySafe(currentLang).then(setLocalDict)
    }
  }, [currentLang, dict])

  const t = dict || localDict
  const ordersText = t?.orders?.title || 'Mes Commandes'
  const myOrdersText = t?.orders?.myOrders || 'Mes commandes'

  // Récupérer le nombre de commandes (optionnel)
  useEffect(() => {
    if (!showCount) return

    const fetchOrderCount = async () => {
      try {
        const response = await fetch('/api/orders/count')
        const data = await response.json()
        if (response.ok && data.count !== undefined) {
          setOrderCount(data.count)
        }
      } catch (error) {
        console.error('Error fetching order count:', error)
      }
    }

    fetchOrderCount()
  }, [showCount])

  const handleClick = () => {
    setLoading(true)
    router.push(`/${currentLang}/orders`)
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'gradient':
        return 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25'
      case 'outline':
        return 'border-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30'
      case 'ghost':
        return 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30'
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'h-8 px-3 text-xs'
      case 'lg':
        return 'h-12 px-6 text-base'
      case 'icon':
        return 'h-10 w-10 p-0'
      default:
        return 'h-10 px-4 text-sm'
    }
  }

  const defaultLabel = label || (size === 'icon' ? '' : (size === 'sm' ? myOrdersText : ordersText))

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        getVariantStyles(),
        getSizeStyles(),
        'font-medium transition-all duration-300 relative',
        loading && 'opacity-70 cursor-not-allowed',
        className
      )}
    >
      {loading ? (
        <Loader2 className={cn(
          'animate-spin',
          size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
        )} />
      ) : (
        <>
          {showIcon && <Package className={cn(
            size === 'sm' ? 'h-3.5 w-3.5 mr-1.5' : 
            size === 'lg' ? 'h-5 w-5 mr-2' : 
            'h-4 w-4 mr-2'
          )} />}
          {size !== 'icon' && defaultLabel}
          {showCount && orderCount !== null && orderCount > 0 && size !== 'icon' && (
            <Badge 
              variant="secondary" 
              className={cn(
                'ml-2 bg-white/20 text-white border-0',
                variant === 'outline' && 'bg-blue-100 text-blue-700'
              )}
            >
              {orderCount}
            </Badge>
          )}
        </>
      )}
    </Button>
  )
}

// Version compacte pour la navbar
export function OrdersButtonCompact({ dict, lang }: { dict?: any; lang?: string }) {
  return (
    <OrdersButton
      variant="ghost"
      size="sm"
      showIcon={true}
      showCount={true}
      label={dict?.orders?.myOrders || 'Commandes'}
      dict={dict}
      lang={lang}
    />
  )
}

// Version avec icône seulement
export function OrdersButtonIcon({ dict, lang }: { dict?: any; lang?: string }) {
  return (
    <OrdersButton
      variant="ghost"
      size="icon"
      showIcon={true}
      showCount={true}
      dict={dict}
      lang={lang}
    />
  )
}

// Version avec badge de notification
export function OrdersButtonWithBadge({ dict, lang, count }: { dict?: any; lang?: string; count?: number }) {
  const [orderCount, setOrderCount] = useState<number | null>(count || null)
  const params = useParams()
  const currentLang = lang || (params.lang as string) || 'fr'

  useEffect(() => {
    if (count !== undefined) {
      setOrderCount(count)
      return
    }

    const fetchOrderCount = async () => {
      try {
        const response = await fetch('/api/orders/count')
        const data = await response.json()
        if (response.ok && data.count !== undefined) {
          setOrderCount(data.count)
        }
      } catch (error) {
        console.error('Error fetching order count:', error)
      }
    }

    fetchOrderCount()
  }, [count])

  const t = dict
  const ordersText = t?.orders?.title || 'Mes Commandes'

  return (
    <Button
      onClick={() => window.location.href = `/${currentLang}/orders`}
      variant="ghost"
      size="sm"
      className="relative"
    >
      <Package className="h-5 w-5" />
      {orderCount !== null && orderCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {orderCount > 9 ? '9+' : orderCount}
        </span>
      )}
      <span className="sr-only">{ordersText}</span>
    </Button>
  )
}

// Version hero section
export function OrdersButtonHero({ dict, lang }: { dict?: any; lang?: string }) {
  return (
    <OrdersButton
      variant="gradient"
      size="lg"
      showIcon={true}
      showCount={false}
      label={dict?.orders?.viewOrders || 'Voir mes commandes'}
      dict={dict}
      lang={lang}
      className="px-8 py-6 text-lg shadow-2xl shadow-blue-500/30 hover:scale-105 transition-transform"
    />
  )
}