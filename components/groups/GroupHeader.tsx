// /components/groups/GroupHeader.tsx - VERSION ULTIME
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Share2,
  Globe,
  Lock,
  Users2,
  Zap,
  Bookmark,
  Bell,
  BellOff,
  MoreVertical,
  Sparkles,
  Star,
  TrendingUp,
  Award,
  Shield,
  Crown,
  ChevronRight,
  Link as LinkIcon,
  Settings,
  LogOut,
  Eye,
  EyeOff,
  Heart,
  UserPlus,
  Target,
  BarChart3,
  Clock,
  Building,
  Hash,
  Trophy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface GroupHeaderProps {
  group: {
    _id: string
    name: string
    description: string
    type: string
    avatar: string
    banner?: string
    color?: string
    visibility: 'public' | 'private' | 'hidden'
    isMember: boolean
    isFollowing?: boolean
    memberRole?: 'owner' | 'admin' | 'moderator' | 'member'
    stats: {
      totalMembers: number
      totalPosts: number
      totalEvents?: number
      totalJobs?: number
      activeMembers?: number
      weeklyGrowth?: number
      avgPostsPerDay?: number
    }
    location?: string
    company?: string
    skills?: string[]
    tags?: string[]
    joinedAt?: string
    engagementRate?: number
    createdAt: string
  }
  currentTab: string
  onTabChange: (tab: string) => void
  onJoinClick?: () => void
}

export function GroupHeader({ group, currentTab, onTabChange, onJoinClick }: GroupHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [showFullDescription, setShowFullDescription] = useState(false)

  // Configuration des types
  const typeConfig = {
    skill: { 
      icon: <Zap className="h-3.5 w-3.5" />, 
      label: 'Compétences', 
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-500'
    },
    location: { 
      icon: <MapPin className="h-3.5 w-3.5" />, 
      label: 'Local', 
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500'
    },
    professional: { 
      icon: <Briefcase className="h-3.5 w-3.5" />, 
      label: 'Professionnel', 
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-500'
    },
    company: { 
      icon: <Building className="h-3.5 w-3.5" />, 
      label: 'Entreprise', 
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500'
    },
    learning: { 
      icon: <Sparkles className="h-3.5 w-3.5" />, 
      label: 'Apprentissage', 
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-500'
    },
    interest: { 
      icon: <Heart className="h-3.5 w-3.5" />, 
      label: 'Communauté', 
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-500'
    }
  }

  const typeInfo = typeConfig[group.type as keyof typeof typeConfig] || {
    icon: <Users2 className="h-3.5 w-3.5" />,
    label: 'Groupe',
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-500'
  }

  const roleConfig = {
    owner: { icon: <Crown className="h-3 w-3" />, label: 'Fondateur', color: 'from-amber-500 to-orange-500' },
    admin: { icon: <Shield className="h-3 w-3" />, label: 'Admin', color: 'from-red-500 to-pink-500' },
    moderator: { icon: <Award className="h-3 w-3" />, label: 'Modérateur', color: 'from-blue-500 to-cyan-500' },
    member: { icon: <Users className="h-3 w-3" />, label: 'Membre', color: 'from-green-500 to-emerald-500' }
  }

  const roleInfo = group.memberRole ? roleConfig[group.memberRole] : null

  // Calculs
  const calculateEngagement = () => {
    return group.engagementRate || (group.stats.activeMembers && group.stats.totalMembers 
      ? Math.round((group.stats.activeMembers / group.stats.totalMembers) * 100)
      : 72)
  }

  const calculateActivityLevel = () => {
    const postsPerDay = group.stats.avgPostsPerDay || group.stats.totalPosts / 30
    if (postsPerDay > 50) return { level: 'Très actif', color: 'text-green-600', bg: 'bg-green-100' }
    if (postsPerDay > 20) return { level: 'Actif', color: 'text-blue-600', bg: 'bg-blue-100' }
    return { level: 'Modéré', color: 'text-yellow-600', bg: 'bg-yellow-100' }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays < 1) return "Aujourd'hui"
    if (diffInDays === 1) return 'Hier'
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`
    if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaines`
    if (diffInDays < 365) return `Il y a ${Math.floor(diffInDays / 30)} mois`
    return `Il y a ${Math.floor(diffInDays / 365)} ans`
  }

  const activityLevel = calculateActivityLevel()

  // Handlers
  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: group.name, text: group.description, url })
        toast.success('Partagé avec succès ✨')
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Erreur de partage:', error)
        }
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Lien copié 📋')
    }
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    toast.success(isFollowing ? 
      'Vous ne suivez plus ce groupe' : 
      '✅ Vous suivez maintenant ce groupe'
    )
  }

  const handleLeaveGroup = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir quitter ce groupe ?')) {
      try {
        const response = await fetch(`/api/groups/${group._id}/members`, { method: 'DELETE' })
        if (response.ok) {
          toast.success('Vous avez quitté le groupe')
          setTimeout(() => window.location.reload(), 1500)
        }
      } catch (error) {
        toast.error('Erreur lors de la sortie du groupe')
      }
    }
  }

  return (
    <div className="relative mb-6">
      {/* Header compact et élégant */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
        {/* Background avec effet de particules */}
        <div className="absolute inset-0">
          <div className={`absolute inset-0 bg-gradient-to-br ${typeInfo.color} opacity-20`} />
          {group.banner ? (
            <>
              <Image
                src={group.banner}
                alt={`Bannière de ${group.name}`}
                fill
                className="object-cover opacity-30"
                priority
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
          )}
          
          {/* Pattern subtil */}
          <div className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        {/* Contenu principal compact */}
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar avec badges */}
            <div className="relative">
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden ring-4 ring-white/10 ring-offset-2 ring-offset-gray-900/50 shadow-2xl group/avatar">
                <Image
                  src={group.avatar}
                  alt={group.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover/avatar:scale-110"
                  sizes="(max-width: 768px) 80px, 96px"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
              </div>
              
              {/* Badge de type */}
              <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full ${typeInfo.bgColor} text-white text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm`}>
                {typeInfo.icon}
                {typeInfo.label}
              </div>

              {/* Badge de rôle */}
              {roleInfo && (
                <div className={`absolute -top-2 -left-2 px-3 py-1 rounded-full bg-gradient-to-r ${roleInfo.color} text-white text-xs font-bold flex items-center gap-1.5 shadow-lg`}>
                  {roleInfo.icon}
                  {roleInfo.label}
                </div>
              )}
            </div>

            {/* Informations principales */}
            <div className="flex-1 space-y-4">
              {/* Ligne 1: Nom et privacy */}
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {group.name}
                </h1>
                
                <div className="flex items-center gap-2">
                  {/* Privacy badge */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className={`px-3 py-1.5 rounded-full ${group.visibility === 'public' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'} backdrop-blur-sm`}>
                          {group.visibility === 'public' ? (
                            <>
                              <Globe className="h-3 w-3 mr-1.5" />
                              Public
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3 mr-1.5" />
                              Privé
                            </>
                          )}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{group.visibility === 'public' ? 'Visible par tout le monde' : 'Seulement pour les membres'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Activity level */}
                  <Badge className={`px-3 py-1.5 rounded-full ${activityLevel.bg} ${activityLevel.color} border-transparent backdrop-blur-sm`}>
                    <TrendingUp className="h-3 w-3 mr-1.5" />
                    {activityLevel.level}
                  </Badge>
                </div>
              </div>

              {/* Ligne 2: Statistiques principales */}
              <div className="flex flex-wrap items-center gap-4 md:gap-6">
                {/* Membres */}
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/5 backdrop-blur-sm">
                    <Users className="h-4 w-4 text-blue-300" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{formatNumber(group.stats.totalMembers)}</div>
                    <div className="text-xs text-gray-300">Membres</div>
                  </div>
                </div>

                {/* Posts */}
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/5 backdrop-blur-sm">
                    <MessageSquare className="h-4 w-4 text-green-300" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{formatNumber(group.stats.totalPosts)}</div>
                    <div className="text-xs text-gray-300">Posts</div>
                  </div>
                </div>

                {/* Engagement */}
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/5 backdrop-blur-sm">
                    <Target className="h-4 w-4 text-purple-300" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{calculateEngagement()}%</div>
                    <div className="text-xs text-gray-300">Engagement</div>
                  </div>
                </div>

                {/* Date de création */}
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/5 backdrop-blur-sm">
                    <Clock className="h-4 w-4 text-yellow-300" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{getTimeSince(group.createdAt)}</div>
                    <div className="text-xs text-gray-300">Création</div>
                  </div>
                </div>

                {/* Localisation (si présente) */}
                {group.location && (
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-white/5 backdrop-blur-sm">
                      <MapPin className="h-4 w-4 text-red-300" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{group.location}</div>
                      <div className="text-xs text-gray-300">Localisation</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Barre d'engagement */}
              <div className="max-w-md">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-gray-300">Performance du groupe</span>
                  <span className="font-semibold text-white">{calculateEngagement()}%</span>
                </div>
                <Progress 
                  value={calculateEngagement()} 
                  className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:via-blue-500 [&>div]:to-purple-500"
                />
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex flex-col gap-3">
              {/* Bouton d'action principal */}
              {group.isMember ? (
                <Button
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-xl rounded-full px-5 h-11 group/btn"
                  onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })}
                >
                  <Sparkles className="h-4 w-4 mr-2 group-hover/btn:rotate-12 transition-transform" />
                  Nouveau post
                </Button>
              ) : (
                <Button
                  onClick={onJoinClick}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl rounded-full px-5 h-11"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {group.visibility === 'public' ? 'Rejoindre' : 'Demander'}
                </Button>
              )}

              {/* Boutons secondaires */}
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleShare}
                        className="rounded-full h-10 w-10 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Partager le groupe</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleFollow}
                        className={`rounded-full h-10 w-10 ${isFollowing ? 'bg-pink-500/20 border-pink-500/30 text-pink-300' : 'bg-white/10 border-white/20 text-white'} hover:scale-105 transition-all`}
                      >
                        {isFollowing ? (
                          <Bookmark className="h-4 w-4 fill-current" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isFollowing ? 'Ne plus suivre' : 'Suivre le groupe'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full h-10 w-10 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Plus d'options</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-gray-900/95 border-gray-700">
                    <DropdownMenuItem onClick={() => setNotificationsEnabled(!notificationsEnabled)} className="text-gray-200 hover:bg-gray-800">
                      {notificationsEnabled ? (
                        <>
                          <BellOff className="h-4 w-4 mr-2" />
                          Désactiver notifications
                        </>
                      ) : (
                        <>
                          <Bell className="h-4 w-4 mr-2" />
                          Activer notifications
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-gray-200 hover:bg-gray-800">
                      <Link href={`/groups/${group._id}/settings`} className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        Paramètres
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShare} className="text-gray-200 hover:bg-gray-800">
                      <Share2 className="h-4 w-4 mr-2" />
                      Partager
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    {group.isMember && (
                      <DropdownMenuItem 
                        onClick={handleLeaveGroup}
                        className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Quitter le groupe
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Description compacte */}
          {group.description && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-start gap-2">
                <Hash className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className={`text-gray-300 text-sm ${!showFullDescription ? 'line-clamp-2' : ''}`}>
                  {group.description}
                </p>
                {group.description.length > 150 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium flex-shrink-0 ml-2"
                  >
                    {showFullDescription ? 'Voir moins' : 'Voir plus'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Badge de croissance */}
        {group.stats.weeklyGrowth && group.stats.weeklyGrowth > 0 && (
          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg animate-pulse">
            <TrendingUp className="h-3 w-3" />
            +{group.stats.weeklyGrowth}% cette semaine
          </div>
        )}
      </div>

      {/* Navigation moderne et compacte */}
      <div className="mt-4">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-gray-200/50 shadow-lg">
          <div className="px-4 py-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Tags et compétences */}
              <div className="flex flex-wrap items-center gap-2">
                {group.skills?.slice(0, 3).map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="rounded-full px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 text-xs"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    {skill}
                  </Badge>
                ))}
                {group.tags?.slice(0, 2).map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="outline"
                    className="rounded-full px-3 py-1.5 border-gray-300 text-gray-600 text-xs"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>

              {/* Navigation tabs compacte */}
              <Tabs value={currentTab} onValueChange={onTabChange} className="w-auto">
                <TabsList className="h-11 bg-gray-100/50 backdrop-blur-sm border border-gray-200/50 rounded-xl p-1">
                  <TabsTrigger 
                    value="posts" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-lg px-4 h-9 text-sm"
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-2" />
                    Posts
                    {group.stats.totalPosts > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                        {formatNumber(group.stats.totalPosts)}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="events" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-600 rounded-lg px-4 h-9 text-sm"
                  >
                    <Calendar className="h-3.5 w-3.5 mr-2" />
                    Événements
                  </TabsTrigger>
                  <TabsTrigger 
                    value="members" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600 rounded-lg px-4 h-9 text-sm"
                  >
                    <Users2 className="h-3.5 w-3.5 mr-2" />
                    Membres
                  </TabsTrigger>
                  <TabsTrigger 
                    value="jobs" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 rounded-lg px-4 h-9 text-sm"
                  >
                    <Briefcase className="h-3.5 w-3.5 mr-2" />
                    Offres
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Informations secondaires */}
            <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
              {group.company && (
                <div className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-gray-400" />
                  <span>{group.company}</span>
                </div>
              )}
              {group.stats.activeMembers && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-green-500" />
                  <span className="font-medium text-green-600">{group.stats.activeMembers} actifs</span>
                </div>
              )}
              {group.stats.avgPostsPerDay && (
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
                  <span>{group.stats.avgPostsPerDay.toFixed(1)} posts/jour</span>
                </div>
              )}
              {group.joinedAt && (
                <div className="flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  <span>Membre depuis {new Date(group.joinedAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}