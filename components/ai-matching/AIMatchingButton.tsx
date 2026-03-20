// components/ai-matching/AIMatchingButton.tsx
'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Sparkles, Loader2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AIMatchingButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'gradient'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showIcon?: boolean
  label?: string
  dict?: any
  lang?: string
}

export function AIMatchingButton({
  variant = 'gradient',
  size = 'default',
  className,
  showIcon = true,
  label,
  dict,
  lang
}: AIMatchingButtonProps) {
  const router = useRouter()
  const params = useParams()
  const currentLang = lang || (params.lang as string) || 'fr'
  const [loading, setLoading] = useState(false)

  const t = dict?.aiMatching || {}
  const defaultLabel = label || t.buttonLabel || 'AI Matching'

  const getVariantStyles = () => {
    switch (variant) {
      case 'gradient':
        return 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25'
      case 'outline':
        return 'border-2 border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30'
      case 'ghost':
        return 'text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30'
      default:
        return 'bg-purple-600 hover:bg-purple-700 text-white'
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

  const handleClick = () => {
    setLoading(true)
    router.push(`/${currentLang}/ai-matching`)
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        getVariantStyles(),
        getSizeStyles(),
        'font-medium transition-all duration-300',
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
          {showIcon && <Sparkles className={cn(
            size === 'sm' ? 'h-3.5 w-3.5 mr-1.5' : 
            size === 'lg' ? 'h-5 w-5 mr-2' : 
            'h-4 w-4 mr-2'
          )} />}
          {size !== 'icon' && defaultLabel}
        </>
      )}
    </Button>
  )
}

// Version compacte pour la navbar
export function AIMatchingButtonCompact({ dict, lang }: { dict?: any; lang?: string }) {
  return (
    <AIMatchingButton
      variant="ghost"
      size="sm"
      showIcon={true}
      label={dict?.aiMatching?.buttonLabelShort || 'AI Match'}
      dict={dict}
      lang={lang}
    />
  )
}

// Version hero pour les grandes sections
export function AIMatchingButtonHero({ dict, lang }: { dict?: any; lang?: string }) {
  return (
    <AIMatchingButton
      variant="gradient"
      size="lg"
      showIcon={true}
      label={dict?.aiMatching?.heroButton || 'Découvrir AI Matching'}
      dict={dict}
      lang={lang}
      className="px-8 py-6 text-lg shadow-2xl shadow-purple-500/30 hover:scale-105 transition-transform"
    />
  )
}

// Version avec flèche pour CTA
export function AIMatchingButtonCTA({ dict, lang }: { dict?: any; lang?: string }) {
  return (
    <AIMatchingButton
      variant="gradient"
      size="lg"
      showIcon={true}
      label={dict?.aiMatching?.tryNow || 'Essayer AI Matching'}
      dict={dict}
      lang={lang}
      className="group"
    >
      <ChevronRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
    </AIMatchingButton>
  )
}