// /components/groups/GroupSidebar.tsx - VERSION FACEBOOK
'use client'

import { Calendar, MapPin, Users, Briefcase, Globe, Lock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface GroupSidebarProps {
  group: {
    _id: string
    name: string
    description: string
    type: string
    visibility: string
    location?: string
    company?: string
    skills: string[]
    tags: string[]
    stats: {
      totalMembers: number
      activeMembers: number
      totalPosts: number
      totalEvents: number
      totalJobs: number
    }
    isMember: boolean
    memberRole?: string
    createdAt: string
    lastActivityAt: string
  }
  onJoinClick?: () => void
  onLeaveClick?: () => void
}

export function GroupSidebar({ 
  group, 
  onJoinClick, 
  onLeaveClick
}: GroupSidebarProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-4">
      {/* Action principale - Rejoindre/Quitter */}
      {!group.isMember ? (
        <div className="p-4 bg-white rounded-lg border">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Rejoindre ce groupe</h3>
            </div>
            <p className="text-sm text-gray-600">
              Connectez-vous avec des professionnels partageant les mêmes intérêts.
            </p>
            <Button 
              onClick={onJoinClick}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="default"
            >
              Rejoindre le groupe
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-white rounded-lg border">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Membre du groupe</h3>
              </div>
              <Badge variant="outline">
                {group.memberRole || 'Membre'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                variant="outline" 
                className="flex-1"
              >
                Créer un post
              </Button>
              <Button 
                onClick={onLeaveClick}
                variant="outline" 
                className="flex-1"
              >
                Quitter
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Informations essentielles */}
      <div className="p-4 bg-white rounded-lg border">
        <h3 className="font-bold mb-3">À propos</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Créé le {formatDate(group.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            {group.visibility === 'public' ? (
              <Globe className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            <span>{group.visibility === 'public' ? 'Public' : 'Privé'}</span>
          </div>
          {group.location && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{group.location}</span>
            </div>
          )}
          {group.company && (
            <div className="flex items-center gap-2 text-gray-600">
              <Briefcase className="h-4 w-4" />
              <span>{group.company}</span>
            </div>
          )}
        </div>
      </div>

      {/* Statistiques simplifiées */}
      <div className="p-4 bg-white rounded-lg border">
        <h3 className="font-bold mb-3">Statistiques</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{group.stats.totalMembers}</div>
            <div className="text-xs text-gray-600">Membres</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{group.stats.totalPosts}</div>
            <div className="text-xs text-gray-600">Posts</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">{group.stats.totalEvents}</div>
            <div className="text-xs text-gray-600">Événements</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-600">{group.stats.totalJobs}</div>
            <div className="text-xs text-gray-600">Offres</div>
          </div>
        </div>
      </div>

      {/* Compétences (si elles existent) */}
      {group.skills.length > 0 && (
        <div className="p-4 bg-white rounded-lg border">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-orange-500" />
            <h3 className="font-bold">Compétences</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {group.skills.slice(0, 5).map(skill => (
              <span 
                key={skill} 
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}