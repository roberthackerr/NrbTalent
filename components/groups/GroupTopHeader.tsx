// /components/groups/GroupTopHeader.tsx - HEADER FIXE EN HAUT DE PAGE
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Users, 
  Globe, 
  Lock, 
  ChevronDown,
  Bell,
  Share2,
  Search,
  Home,
  MessageSquare,
  Settings,
  LogOut,
  UserPlus,
  Sparkles,
  TrendingUp,
  Zap,
  Menu,
  X,
  Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

interface GroupTopHeaderProps {
  group: {
    _id: string
    name: string
    avatar: string
    visibility: 'public' | 'private' | 'hidden'
    isMember: boolean
    stats: {
      totalMembers: number
      totalPosts: number
      activeMembers?: number
      weeklyGrowth?: number
    }
    memberRole?: 'owner' | 'admin' | 'moderator' | 'member'
    engagementRate?: number
  }
  onJoinClick?: () => void
  onCreatePost?: () => void
  currentPath?: string
}

export function GroupTopHeader({ 
  group, 
  onJoinClick, 
  onCreatePost,
  currentPath = '/groups'
}: GroupTopHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const calculateEngagement = () => {
    return group.engagementRate || 72
  }

  const getRoleColor = () => {
    const colors = {
      owner: 'from-amber-500 to-orange-500',
      admin: 'from-red-500 to-pink-500',
      moderator: 'from-blue-500 to-cyan-500',
      member: 'from-green-500 to-emerald-500'
    }
    return colors[group.memberRole as keyof typeof colors] || 'from-gray-500 to-gray-600'
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: group.name, url })
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Implémentez la recherche ici
      console.log('Searching for:', searchQuery)
    }
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
    <>
      {/* Header principal fixe */}
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-xl border-b shadow-lg py-2' 
          : 'bg-white border-b py-3'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Partie gauche : Logo et infos groupe */}
            <div className="flex items-center gap-4">
              {/* Logo/Brand */}
              <Link href="/" className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-gray-900 hidden md:inline">Groups</span>
              </Link>

              {/* Séparateur */}
              <div className="h-6 w-px bg-gray-200 hidden md:block" />

              {/* Infos groupe compactes */}
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                  <AvatarImage src={group.avatar} alt={group.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
                    {group.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="hidden md:block">
                  <div className="flex items-center gap-2">
                    <h1 className="font-bold text-gray-900 text-sm md:text-base line-clamp-1 max-w-[200px]">
                      {group.name}
                    </h1>
                    
                    {/* Badge de privacy */}
                    <Badge className={`px-2 py-0.5 text-xs ${
                      group.visibility === 'public' 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-purple-100 text-purple-700 border-purple-200'
                    }`}>
                      {group.visibility === 'public' ? (
                        <>
                          <Globe className="h-3 w-3 mr-1" />
                          Public
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3 mr-1" />
                          Privé
                        </>
                      )}
                    </Badge>

                    {/* Badge de rôle */}
                    {group.memberRole && (
                      <Badge className={`px-2 py-0.5 text-xs bg-gradient-to-r ${getRoleColor()} text-white border-0`}>
                        {group.memberRole === 'owner' ? 'Fondateur' : 
                         group.memberRole === 'admin' ? 'Admin' : 
                         group.memberRole === 'moderator' ? 'Modérateur' : 'Membre'}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="h-3 w-3" />
                      <span className="font-medium text-gray-700">{formatNumber(group.stats.totalMembers)}</span>
                      <span>membres</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MessageSquare className="h-3 w-3" />
                      <span className="font-medium text-gray-700">{formatNumber(group.stats.totalPosts)}</span>
                      <span>posts</span>
                    </div>

                    {group.stats.weeklyGrowth && group.stats.weeklyGrowth > 0 && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <TrendingUp className="h-3 w-3" />
                        <span>+{group.stats.weeklyGrowth}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Centre : Barre de recherche (desktop seulement) */}
            <div className="hidden lg:flex flex-1 max-w-xl mx-6">
              <form onSubmit={handleSearch} className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Rechercher dans le groupe..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200 rounded-full focus:bg-white focus:border-blue-500 text-sm"
                />
              </form>
            </div>

            {/* Partie droite : Actions */}
            <div className="flex items-center gap-2">
              {/* Bouton d'action principal */}
              {group.isMember ? (
                <Button
                  onClick={onCreatePost}
                  size="sm"
                  className="hidden md:flex bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Créer
                </Button>
              ) : (
                <Button
                  onClick={onJoinClick}
                  size="sm"
                  className="hidden md:flex bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Rejoindre
                </Button>
              )}

              {/* Boutons d'actions secondaires */}
              <div className="hidden md:flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="h-9 w-9 rounded-full"
                >
                  <Share2 className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className="h-9 w-9 rounded-full"
                >
                  {notificationsEnabled ? (
                    <Bell className="h-4 w-4" />
                  ) : (
                    <Bell className="h-4 w-4 text-gray-400" />
                  )}
                </Button>

                {/* Menu utilisateur */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                          VO
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      Connecté en tant que
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <Settings className="h-4 w-4 mr-2" />
                        Mon profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="h-4 w-4 mr-2" />
                        Paramètres
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {group.isMember && (
                      <DropdownMenuItem 
                        onClick={handleLeaveGroup}
                        className="text-red-600 focus:text-red-600"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Quitter le groupe
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/logout" className="cursor-pointer text-red-600 focus:text-red-600">
                        <LogOut className="h-4 w-4 mr-2" />
                        Déconnexion
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Menu mobile */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    {isMobileMenuOpen ? (
                      <X className="h-5 w-5" />
                    ) : (
                      <Menu className="h-5 w-5" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col h-full">
                    {/* En-tête mobile */}
                    <div className="flex items-center gap-3 mb-6">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={group.avatar} alt={group.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                          {group.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="font-bold text-gray-900">{group.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {formatNumber(group.stats.totalMembers)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {group.visibility === 'public' ? 'Public' : 'Privé'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Navigation mobile */}
                    <nav className="flex-1">
                      <div className="space-y-1">
                        <Link
                          href={`/groups/${group._id}`}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Home className="h-4 w-4" />
                          <span>Accueil du groupe</span>
                        </Link>
                        
                        <Link
                          href={`/groups/${group._id}/posts`}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>Posts</span>
                          <Badge className="ml-auto">{formatNumber(group.stats.totalPosts)}</Badge>
                        </Link>

                        {group.isMember && onCreatePost && (
                          <button
                            onClick={() => {
                              onCreatePost()
                              setIsMobileMenuOpen(false)
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                          >
                            <Sparkles className="h-4 w-4" />
                            <span>Créer un post</span>
                          </button>
                        )}

                        {!group.isMember && onJoinClick && (
                          <button
                            onClick={() => {
                              onJoinClick()
                              setIsMobileMenuOpen(false)
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                          >
                            <UserPlus className="h-4 w-4" />
                            <span>Rejoindre le groupe</span>
                          </button>
                        )}

                        <button
                          onClick={handleShare}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                        >
                          <Share2 className="h-4 w-4" />
                          <span>Partager</span>
                        </button>

                        <Link
                          href={`/groups/${group._id}/settings`}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Paramètres</span>
                        </Link>
                      </div>
                    </nav>

                    {/* Stats rapides */}
                    <div className="mt-6 pt-6 border-t">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-900">{calculateEngagement()}%</div>
                          <div className="text-xs text-gray-500">Engagement</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-900">
                            {group.stats.activeMembers ? formatNumber(group.stats.activeMembers) : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">Actifs</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Barre de recherche mobile */}
          <div className="lg:hidden mt-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Rechercher dans le groupe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 rounded-full"
              />
            </form>
          </div>

          {/* Indicateur d'engagement (apparaît au scroll) */}
          {isScrolled && (
            <div className="hidden md:flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Target className="h-3 w-3 text-blue-500" />
                <span>Engagement :</span>
                <span className="font-bold text-blue-600">{calculateEngagement()}%</span>
              </div>
              <div className="flex-1 max-w-xs">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full"
                    style={{ width: `${calculateEngagement()}%` }}
                  />
                </div>
              </div>
              {group.isMember && (
                <Button
                  onClick={onCreatePost}

                  className="ml-auto size-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Nouveau post
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Header secondaire compact (pour certaines pages) */}
      {isScrolled && (
        <div className="sticky top-16 z-40 bg-white/90 backdrop-blur-md border-b shadow-sm">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={group.avatar} alt={group.name} />
                    <AvatarFallback className="text-xs">{group.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm text-gray-900">{group.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {formatNumber(group.stats.totalMembers)} membres
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {formatNumber(group.stats.totalPosts)} posts
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleShare}
                >
                  <Share2 className="h-3 w-3 mr-1" />
                  Partager
                </Button>
                {group.isMember ? (
                  <Button
                    onClick={onCreatePost}
                    size="sm"
                    className="h-7 text-xs bg-gradient-to-r from-blue-600 to-blue-700"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Créer
                  </Button>
                ) : (
                  <Button
                    onClick={onJoinClick}
                    size="sm"
                    className="h-7 text-xs bg-gradient-to-r from-green-600 to-emerald-600"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Rejoindre
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}