// components/user/UserCard.tsx
'use client'

import Link from 'next/link'
import { Star, MapPin, Briefcase, Verified } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { normalizeSkills } from '@/lib/utils/skills'

interface User {
  _id: string
  name: string
  title?: string
  avatar?: string
  role: 'freelance' | 'client'
  location?: string
  hourlyRate?: number
  statistics?: {
    rating: number
    completedProjects: number
    successRate?: number
  }
  verified?: boolean
  skills?: any[]
  bio?: string
}

interface UserCardProps {
  user: User
  /** Langue pour les labels */
  lang?: 'fr' | 'en' | 'mg'
  /** Variant d'affichage */
  variant?: 'compact' | 'default' | 'minimal'
  /** Afficher le bouton de contact */
  showContactButton?: boolean
  /** Callback lors du clic sur le bouton contact */
  onContact?: (user: User) => void
  /** Classe additionnelle */
  className?: string
  /** Lien vers le profil (si non fourni, utilise /profile/[id]) */
  profileLink?: string
}

const translations = {
  fr: {
    viewProfile: 'Voir le profil',
    contact: 'Contacter',
    rate: '€/h',
    projects: 'projets',
    rating: 'Note',
    location: 'Localisation',
    verified: 'Vérifié',
    freelance: 'Freelance',
    client: 'Client',
    success: 'succès'
  },
  en: {
    viewProfile: 'View profile',
    contact: 'Contact',
    rate: '/h',
    projects: 'projects',
    rating: 'Rating',
    location: 'Location',
    verified: 'Verified',
    freelance: 'Freelancer',
    client: 'Client',
    success: 'success'
  },
  mg: {
    viewProfile: 'Jereo ny momba azy',
    contact: 'Hifandray',
    rate: '/ora',
    projects: 'tetikasa',
    rating: 'Naoty',
    location: 'Toerana',
    verified: 'Voamarina',
    freelance: 'Freelance',
    client: 'Mpanjifa',
    success: 'fahombiazana'
  }
}

export function UserCard({ 
  user, 
  lang = 'fr',
  variant = 'default',
  showContactButton = true,
  onContact,
  className,
  profileLink
}: UserCardProps) {
  const t = translations[lang]
  
  const link = profileLink || `/${lang}/profile/${user._id}`
  const isFreelance = user.role === 'freelance'
  
  // Normaliser les compétences
  const normalizedSkills = normalizeSkills(user.skills || [])
  const displaySkills = normalizedSkills.slice(0, variant === 'compact' ? 2 : 3)
  const hasMoreSkills = normalizedSkills.length > (variant === 'compact' ? 2 : 3)
  
  // Variant Compact - Ultra petit (pour sidebars, listes rapides)
  if (variant === 'compact') {
    return (
      <Link href={link} className={cn("group block", className)}>
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-gray-800">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
              {user.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-gray-900 dark:text-white truncate text-sm group-hover:text-blue-600">
                {user.name}
              </p>
              {user.verified && <Verified className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />}
            </div>
            {user.title && (
              <p className="text-xs text-gray-500 truncate">{user.title}</p>
            )}
            {isFreelance && user.hourlyRate && (
              <p className="text-xs font-medium text-green-600 mt-0.5">
                {user.hourlyRate}{t.rate}
              </p>
            )}
          </div>
        </div>
      </Link>
    )
  }
  
  // Variant Minimal - Sans description, compact mais avec stats
  if (variant === 'minimal') {
    return (
      <Link href={link} className={cn("group block", className)}>
        <div className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
          <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-gray-800">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {user.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600">
                {user.name}
              </h3>
              {user.verified && <Verified className="h-4 w-4 text-blue-500" />}
              <Badge variant="secondary" className="text-xs">
                {isFreelance ? t.freelance : t.client}
              </Badge>
            </div>
            {user.title && <p className="text-sm text-gray-500 mt-0.5">{user.title}</p>}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              {user.statistics?.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span>{user.statistics.rating.toFixed(1)}</span>
                  <span className="text-gray-400">({user.statistics.completedProjects || 0})</span>
                </div>
              )}
              {user.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">{user.location}</span>
                </div>
              )}
              {isFreelance && user.hourlyRate && (
                <div className="flex items-center gap-1 font-medium text-green-600">
                  <Briefcase className="h-3 w-3" />
                  <span>{user.hourlyRate}{t.rate}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    )
  }
  
  // Variant Default - Complet avec description et compétences
  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700", className)}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Link href={link} className="flex-shrink-0">
            <Avatar className="h-14 w-14 ring-2 ring-white dark:ring-gray-800">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg">
                {user.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <Link href={link}>
                  <h3 className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 transition-colors">
                    {user.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {isFreelance ? t.freelance : t.client}
                  </Badge>
                  {user.verified && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Verified className="h-3.5 w-3.5" />
                      <span>{t.verified}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {isFreelance && user.hourlyRate && (
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {user.hourlyRate}<span className="text-sm font-normal text-gray-500">{t.rate}</span>
                  </div>
                  <div className="text-xs text-gray-500">{t.rate}</div>
                </div>
              )}
            </div>
            
            {user.title && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{user.title}</p>
            )}
            
            {user.bio && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                {user.bio}
              </p>
            )}
            
            {/* Compétences normalisées */}
            {displaySkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {displaySkills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-gray-50 dark:bg-gray-800">
                    {skill}
                  </Badge>
                ))}
                {hasMoreSkills && (
                  <Badge variant="outline" className="text-xs">
                    +{normalizedSkills.length - displaySkills.length}
                  </Badge>
                )}
              </div>
            )}
            
            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
              {user.statistics?.rating && (
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {user.statistics.rating.toFixed(1)}
                  </span>
                  <span>({user.statistics.completedProjects || 0} {t.projects})</span>
                </div>
              )}
              {user.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{user.location}</span>
                </div>
              )}
              {user.statistics?.successRate && (
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>{user.statistics.successRate}% {t.success}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions - Uniquement bouton contact et voir profil */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          {showContactButton && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onContact?.(user)}
              className="text-sm"
            >
              {t.contact}
            </Button>
          )}
          <Button
            size="sm"
            asChild
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Link href={link}>
              {t.viewProfile}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

// Composant de skeleton pour le chargement
export function UserCardSkeleton({ variant = 'default' }: { variant?: 'compact' | 'default' | 'minimal' }) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-3 animate-pulse">
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-1" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    )
  }
  
  if (variant === 'minimal') {
    return (
      <div className="p-4 animate-pulse">
        <div className="flex gap-4">
          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="h-14 w-14 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    </div>
  )
}