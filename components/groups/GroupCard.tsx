// /components/groups/GroupCard.tsx - VERSION SIMPLIFIÉE & PROFESSIONNELLE
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Users, MessageSquare, MapPin, Globe, Lock, Calendar, MoreVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface GroupCardProps {
  group: {
    _id: string
    name: string
    slug: string
    description: string
    type: string
    avatar: string
    coverImage?: string
    stats: {
      totalMembers: number
      totalPosts: number
      totalEvents?: number
    }
    tags?: string[]
    location?: string
    visibility: 'public' | 'private' | 'hidden'
    isMember?: boolean
    isVerified?: boolean
  }
  showJoinButton?: boolean
}

export function GroupCard({ group, showJoinButton = true }: GroupCardProps) {
  const [isJoining, setIsJoining] = useState(false)
  const [isMember, setIsMember] = useState(group.isMember || false)
  const [imageError, setImageError] = useState(false)

  // Types avec couleurs
  const getTypeInfo = (type: string) => {
    const types: Record<string, { label: string; color: string; bgColor: string }> = {
      'skill': { label: 'Compétences', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      'location': { label: 'Local', color: 'text-green-600', bgColor: 'bg-green-100' },
      'professional': { label: 'Professionnel', color: 'text-purple-600', bgColor: 'bg-purple-100' },
      'company': { label: 'Entreprise', color: 'text-red-600', bgColor: 'bg-red-100' },
      'learning': { label: 'Apprentissage', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
      'interest': { label: 'Intérêt', color: 'text-orange-600', bgColor: 'bg-orange-100' }
    }
    return types[type] || { label: 'Groupe', color: 'text-slate-600', bgColor: 'bg-slate-100' }
  }

  const typeInfo = getTypeInfo(group.type)

  // Gestion de l'image de couverture
  const renderCoverImage = () => {
    const hasCoverImage = group.coverImage && !imageError
    
    if (hasCoverImage) {
      return (
        <div className="relative h-40 w-full">
          <Image
            src={group.coverImage}
            alt={`Couverture de ${group.name}`}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Overlay léger */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
        </div>
      )
    }
    
    // Fallback : couleur basée sur le type
    return (
      <div className={`h-40 w-full ${typeInfo.bgColor} relative`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Users className="h-16 w-16 text-white/20" />
        </div>
      </div>
    )
  }

  const handleJoinGroup = async () => {
    setIsJoining(true)
    try {
      const response = await fetch(`/api/groups/${group._id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        setIsMember(true)
      }
    } catch (error) {
      console.error('Error joining group:', error)
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <Card className="overflow-hidden border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200">
      {/* Image de couverture */}
      {renderCoverImage()}
      
      <CardContent className="pt-12 pb-4 px-4 relative">
        {/* Avatar positionné sur l'image de couverture */}
        <div className="absolute -top-8 left-4">
          <Avatar className="h-16 w-16 border-4 border-white shadow-md">
            {group.avatar ? (
              <AvatarImage 
                src={group.avatar} 
                alt={group.name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            ) : null}
            <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              {group.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Badge de vérification */}
        {group.isVerified && (
          <div className="absolute -top-2 left-14 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
            <span className="text-white text-xs">✓</span>
          </div>
        )}

        {/* En-tête avec nom et type */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <Link href={`/groups/${group.slug}`}>
              <h3 className="font-bold text-lg hover:text-blue-600 transition-colors line-clamp-1">
                {group.name}
              </h3>
            </Link>
            
            {/* Type et visibilité */}
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={`text-xs ${typeInfo.bgColor} ${typeInfo.color} border-0`}>
                {typeInfo.label}
              </Badge>
              
              <div className="flex items-center gap-1 text-slate-500 text-sm">
                {group.visibility === 'public' ? (
                  <>
                    <Globe className="h-3 w-3" />
                    <span>Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" />
                    <span>Privé</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">
          {group.description}
        </p>

        {/* Statistiques */}
        <div className="flex items-center gap-4 text-sm text-slate-500 border-t border-b border-slate-100 py-3">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="font-semibold">{group.stats.totalMembers.toLocaleString()}</span>
            <span>membres</span>
          </div>
          
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span className="font-semibold">{group.stats.totalPosts}</span>
            <span>publications</span>
          </div>
          
          {group.stats.totalEvents && group.stats.totalEvents > 0 && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className="font-semibold">{group.stats.totalEvents}</span>
              <span>événements</span>
            </div>
          )}
        </div>

        {/* Localisation et tags */}
        <div className="mt-3 space-y-2">
          {group.location && (
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-4 w-4" />
              <span>{group.location}</span>
            </div>
          )}
          
          {group.tags && group.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {group.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {group.tags.length > 3 && (
                <span className="text-xs text-slate-400">
                  +{group.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Bouton d'action */}
      {showJoinButton && (
        <CardFooter className="px-4 py-3 border-t border-slate-100 bg-slate-50">
          {isMember ? (
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/groups/${group.slug}`}>
                Voir le groupe
              </Link>
            </Button>
          ) : (
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleJoinGroup}
              disabled={isJoining}
            >
              {isJoining ? 'En cours...' : group.visibility === 'public' ? 'Rejoindre' : 'Demander à rejoindre'}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}