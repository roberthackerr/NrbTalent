// components/groups/GroupAccessButton.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Users, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

interface GroupAccessButtonProps {
  groupId: string
  groupName?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  showIcon?: boolean
  lang?: Locale
  className?: string
  onNavigate?: () => void
}

export function GroupAccessButton({
  groupId,
  groupName,
  variant = 'default',
  size = 'default',
  showIcon = true,
  lang = 'fr',
  className = '',
  onNavigate
}: GroupAccessButtonProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [dict, setDict] = useState<any>(null)
  const [isMember, setIsMember] = useState(false)
  const [loading, setLoading] = useState(false)

  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  // Vérifier si l'utilisateur est membre
  useEffect(() => {
    const checkMembership = async () => {
      if (!session?.user?.id) return
      
      try {
        const response = await fetch(`/api/groups/${groupId}/membership`)
        const data = await response.json()
        setIsMember(data.isMember)
      } catch (error) {
        console.error('Error checking membership:', error)
      }
    }

    if (groupId && session?.user?.id) {
      checkMembership()
    }
  }, [groupId, session?.user?.id])

  const handleClick = async () => {
    if (onNavigate) {
      onNavigate()
    }
    
    setLoading(true)
    
    try {
      // Si pas membre, rejoindre d'abord
      if (!isMember && session?.user?.id) {
        const response = await fetch(`/api/groups/${groupId}/join`, {
          method: 'POST'
        })
        
        if (response.ok) {
          setIsMember(true)
        }
      }
      
      // Naviguer vers le groupe
      router.push(`/groups/${groupId}`)
    } catch (error) {
      console.error('Error accessing group:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!dict) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={className}
      >
        {showIcon && <Users className="mr-2 h-4 w-4 animate-pulse" />}
        Chargement...
      </Button>
    )
  }

  const buttonText = isMember 
    ? dict.groups?.viewGroup || 'Voir le groupe'
    : dict.groups?.joinGroup || 'Rejoindre le groupe'

  const buttonTitle = groupName 
    ? `${buttonText} ${groupName}`
    : buttonText

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={loading}
      className={`group relative ${className}`}
      title={buttonTitle}
    >
      {showIcon && (
        <Users className={`mr-2 h-4 w-4 transition-transform group-hover:scale-110 ${
          loading ? 'animate-spin' : ''
        }`} />
      )}
      <span className="flex-1">{buttonText}</span>
      <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Button>
  )
}