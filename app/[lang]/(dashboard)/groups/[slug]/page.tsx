// /app/(dashboard)/groups/[slug]/page.tsx - VERSION FINALE MODERNE
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { GroupHeader } from '@/components/groups/GroupHeader'
import { GroupPosts } from '@/components/groups/GroupPosts/GroupPosts'
import { GroupSidebar } from '@/components/groups/GroupSidebar'
import { CreatePostForm } from '@/components/groups/CreatePostForm'
import { GroupEvents } from '@/components/groups/GroupEvents'
import { GroupMembers } from '@/components/groups/GroupMembers'
import { GroupJobs } from '@/components/groups/GroupJobs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, Lock, AlertCircle, MessageSquare, Calendar, 
  Briefcase, Users as UsersIcon, FileText, Plus,
  MapPin, UserPlus, Search, Home, Bell, Share2,
  Globe, Zap, Sparkles, TrendingUp, Video, Image as ImageIcon,
  Hash, Mail, Settings, Bookmark, HelpCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Navigation } from '@/components/navigation'

interface GroupData {
  _id: string
  name: string
  slug: string
  description: string
  type: string
  avatar: string
  banner?: string
  color?: string
  visibility: 'public' | 'private' | 'hidden'
  isMember: boolean
  isFollowing?: boolean
  stats: {
    totalMembers: number
    totalPosts: number
    totalEvents?: number
    totalJobs?: number
    activeMembers?: number
  }
  location?: string
  company?: string
  skills?: string[]
  tags?: string[]
  createdAt: string
  owner?: {
    _id: string
    name: string
    avatar?: string
  }
}

export default function GroupPage() {
  const params = useParams()
  const router = useRouter()
  const [group, setGroup] = useState<GroupData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState('posts')
  const [showPostForm, setShowPostForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (params.slug) {
      fetchGroup()
    }
  }, [params.slug])

  const fetchGroup = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/groups/slug/${params.slug}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setGroup(null)
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setGroup(data)
    } catch (error) {
      console.error('Error fetching group:', error)
      toast.error('Erreur lors du chargement du groupe')
      setGroup(null)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!group) return
    
    try {
      const response = await fetch(`/api/groups/${group._id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        toast.success(group.visibility === 'public' ? 'Vous avez rejoint le groupe !' : 'Demande envoyée avec succès')
        fetchGroup()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la demande')
      }
    } catch (error) {
      toast.error('Erreur lors de la demande')
    }
  }

  const handleLeaveGroup = async () => {
    if (!group) return
    
    try {
      const response = await fetch(`/api/groups/${group._id}/members`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Vous avez quitté le groupe')
        fetchGroup()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur lors de la sortie du groupe')
    }
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  if (!group) {
    return <NotFoundPage router={router} />
  }

  if (group.visibility === 'private' && !group.isMember) {
    return <PrivateGroupPage group={group} onJoinClick={handleJoinGroup} router={router} />
  }

  const renderContent = () => {
    if (showPostForm) {
      return (
        <div className="mb-6">
          <CreatePostForm
            groupId={group._id}
            onSuccess={() => setShowPostForm(false)}
            onCancel={() => setShowPostForm(false)}
          />
        </div>
      )
    }

    switch (currentTab) {
      case 'posts':
        return <GroupPosts groupId={group._id} isMember={group.isMember} />
      case 'events':
        return <GroupEvents groupId={group._id} isMember={group.isMember} />
      case 'members':
        return <GroupMembers groupId={group._id} />
      case 'jobs':
        return <GroupJobs groupId={group._id} isMember={group.isMember} />
      case 'resources':
        return (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">Ressources</h3>
            <p className="text-slate-600">Les ressources partagées seront affichées ici.</p>
          </div>
        )
      default:
        return <GroupPosts groupId={group._id} isMember={group.isMember} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header minimal moderne */}
      <div className="sticky top-0 z-50 bg-white border-b">
        <div className="container mx-auto px-4">
        <Navigation/>
        </div>
      </div>

      {/* Bannière améliorée */}
      <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 h-44 lg:h-52">
        {group.banner && (
          <img 
            src={group.banner} 
            alt={group.name}
            className="w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
          <div className="container mx-auto px-4 h-full flex items-end pb-6">
            <div className="flex items-end gap-4 text-white w-full">
              <Avatar className="h-20 w-20 lg:h-24 lg:w-24 border-4 border-white/90 shadow-xl">
                <AvatarImage src={group.avatar} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600">
                  {group.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl lg:text-3xl font-bold">{group.name}</h1>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    {group.visibility === 'public' ? 'Public' : 'Privé'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm lg:text-base">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {group.stats.totalMembers.toLocaleString()} membres
                  </span>
                  {group.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {group.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4" />
                    {group.stats.totalPosts} posts
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs modernes */}
      <div className="sticky top-16 z-40 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1">
              <TabsList className="h-14 bg-transparent gap-1">
                <TabsTrigger 
                  value="posts" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none h-14 px-6 hover:bg-gray-50"
                >
                  <MessageSquare className="h-4 w-4 mr-3" />
                  <span>Posts</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="events" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none h-14 px-6 hover:bg-gray-50"
                >
                  <Calendar className="h-4 w-4 mr-3" />
                  <span>Événements</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="members" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none h-14 px-6 hover:bg-gray-50"
                >
                  <UsersIcon className="h-4 w-4 mr-3" />
                  <span>Membres</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="jobs" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none h-14 px-6 hover:bg-gray-50"
                >
                  <Briefcase className="h-4 w-4 mr-3" />
                  <span>Offres</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="resources" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none h-14 px-6 hover:bg-gray-50"
                >
                  <FileText className="h-4 w-4 mr-3" />
                  <span>Ressources</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="hidden lg:flex items-center gap-3 ml-4">
              <Button variant="outline" size="sm" className="h-9 rounded-full">
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
              {group.isMember && (
                <Button 
                  onClick={() => setShowPostForm(true)}
                  size="sm"
                  className="h-9 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau post
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Layout principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar gauche - Navigation rapide */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-32 space-y-6">
              {/* Actions rapides */}
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Actions rapides</h3>
                <div className="space-y-2">
                  <Button 
                    onClick={() => setShowPostForm(true)}
                    className="w-full justify-start bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 border-blue-200"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-3" />
                    Créer un post
                  </Button>
                  <Button 
                    className="w-full justify-start hover:bg-gray-50"
                    variant="ghost"
                  >
                    <Video className="h-4 w-4 mr-3 text-red-500" />
                    Créer un live
                  </Button>
                  <Button 
                    className="w-full justify-start hover:bg-gray-50"
                    variant="ghost"
                  >
                    <ImageIcon className="h-4 w-4 mr-3 text-green-500" />
                    Créer un album
                  </Button>
                  <Button 
                    onClick={handleJoinGroup}
                    className="w-full justify-start hover:bg-gray-50"
                    variant="ghost"
                  >
                    <UserPlus className="h-4 w-4 mr-3 text-blue-500" />
                    Inviter des amis
                  </Button>
                </div>
              </div>

              {/* Gestion du groupe */}
              {group.isMember && (
                <div className="bg-white rounded-xl border p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Gérer le groupe</h3>
                  <div className="space-y-2">
                    <Button 
                      className="w-full justify-start hover:bg-gray-50"
                      variant="ghost"
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Paramètres
                    </Button>
                    <Button 
                      className="w-full justify-start hover:bg-gray-50"
                      variant="ghost"
                    >
                      <Users className="h-4 w-4 mr-3" />
                      Gérer les membres
                    </Button>
                    <Button 
                      className="w-full justify-start hover:bg-gray-50"
                      variant="ghost"
                    >
                      <Bell className="h-4 w-4 mr-3" />
                      Notifications
                    </Button>
                  </div>
                </div>
              )}

              {/* Statistiques visuelles */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5" />
                  <h3 className="font-semibold">Statistiques</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Membres</span>
                    <span className="font-bold">{group.stats.totalMembers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Engagement</span>
                    <span className="font-bold">
                      {group.stats.activeMembers 
                        ? Math.round((group.stats.activeMembers / group.stats.totalMembers) * 100) 
                        : 25}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Posts/mois</span>
                    <span className="font-bold">
                      {Math.round(group.stats.totalPosts / 12)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compétences populaires */}
              {group.skills && group.skills.length > 0 && (
                <div className="bg-white rounded-xl border p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-5 w-5 text-orange-500" />
                    <h3 className="font-semibold text-gray-900">Compétences</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.skills.slice(0, 8).map((skill, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:from-blue-100 hover:to-blue-200 transition-all cursor-pointer"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Règles du groupe */}
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Hash className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold text-gray-900">Règles</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mt-1.5"></div>
                    <span>Respect mutuel</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mt-1.5"></div>
                    <span>Pas de spam</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mt-1.5"></div>
                    <span>Contenu pertinent</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu principal - Centré et limité à max-w-xl */}
          <div className="flex-1">
            <div className="max-w-xl mx-auto">
              {/* Zone de création (pour membres) */}
              {group.isMember && !showPostForm && (
                <Card className="mb-6 border-gray-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-blue-100">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                          VO
                        </AvatarFallback>
                      </Avatar>
                      <button
                        onClick={() => setShowPostForm(true)}
                        className="flex-1 text-left p-3 rounded-xl border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all bg-white"
                      >
                        <div className="text-gray-500 font-medium">Partagez vos pensées...</div>
                        <div className="text-sm text-gray-400 mt-1">
                          Post, question, événement ou offre
                        </div>
                      </button>
                    </div>
                    <Separator className="mb-3" />
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setShowPostForm(true)}
                        variant="ghost" 
                        className="flex-1 h-10 hover:bg-blue-50"
                      >
                        <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-gray-700">Post</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="flex-1 h-10 hover:bg-green-50"
                      >
                        <Calendar className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-gray-700">Événement</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="flex-1 h-10 hover:bg-orange-50"
                      >
                        <Briefcase className="h-5 w-5 text-orange-600 mr-2" />
                        <span className="text-gray-700">Offre</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Zone pour non-membres */}
              {!group.isMember && (
                <Card className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">Rejoignez cette communauté !</h3>
                        <p className="text-blue-100">
                          Connectez-vous avec {group.stats.totalMembers} professionnels et accédez à du contenu exclusif.
                        </p>
                      </div>
                      <Button 
                        onClick={handleJoinGroup} 
                        size="lg"
                        className="bg-white text-blue-600 hover:bg-gray-100"
                      >
                        <UserPlus className="h-5 w-5 mr-2" />
                        Rejoindre
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contenu de l'onglet */}
              <div className="animate-fade-in">
                {renderContent()}
              </div>
            </div>
          </div>

          {/* Sidebar droite - Informations du groupe */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-32 space-y-6">
              {/* Carte d'adhésion améliorée */}
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-5">
                  {group.isMember ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="font-semibold text-gray-900">Vous êtes membre</span>
                        </div>
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                          Actif
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => setShowPostForm(true)}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        >
                          Créer un post
                        </Button>
                        <Button 
                          onClick={handleLeaveGroup}
                          variant="outline" 
                          className="flex-1"
                        >
                          Quitter
                        </Button>
                      </div>
                      <div className="text-sm text-gray-500 pt-2 border-t">
                        <div className="flex items-center justify-between mb-1">
                          <span>Votre engagement</span>
                          <span className="font-medium text-gray-700">85%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full w-4/5"></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">Rejoindre ce groupe</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Découvrez du contenu exclusif et connectez-vous avec des professionnels partageant vos intérêts.
                      </p>
                      <Button 
                        onClick={handleJoinGroup}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Rejoindre le groupe
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* À propos */}
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">À propos</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium text-gray-700">Visibilité</div>
                        <div className="text-gray-500">{group.visibility === 'public' ? 'Public - Tout le monde peut voir' : 'Privé - Membres uniquement'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium text-gray-700">Crée le</div>
                        <div className="text-gray-500">
                          {new Date(group.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    {group.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium text-gray-700">Localisation</div>
                          <div className="text-gray-500">{group.location}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <Separator className="my-4" />
                  <p className="text-sm text-gray-600 line-clamp-4">
                    {group.description}
                  </p>
                </CardContent>
              </Card>

              {/* Membres actifs */}
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Membres actifs</h3>
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                      Voir tous
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-green-100">
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white text-sm">
                            U{i}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">Membre Actif {i}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            En ligne maintenant
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="rounded-full">
                          Suivre
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Annonces */}
              <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                    <h3 className="font-semibold text-gray-900">Annonces</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-white/80 rounded-lg border border-amber-200">
                      <div className="font-medium text-sm text-gray-900 mb-1">Bienvenue !</div>
                      <div className="text-xs text-gray-600">
                        Rejoignez notre événement mensuel ce vendredi.
                      </div>
                    </div>
                    <div className="p-3 bg-white/80 rounded-lg border border-amber-200">
                      <div className="font-medium text-sm text-gray-900 mb-1">Nouveautés</div>
                      <div className="text-xs text-gray-600">
                        Découvrez les nouvelles fonctionnalités du groupe.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liens rapides */}
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Liens rapides</h3>
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start">
                      <Bookmark className="h-4 w-4 mr-3 text-gray-500" />
                      <span className="text-gray-700">Posts sauvegardés</span>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <HelpCircle className="h-4 w-4 mr-3 text-gray-500" />
                      <span className="text-gray-700">Aide & Support</span>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <Mail className="h-4 w-4 mr-3 text-gray-500" />
                      <span className="text-gray-700">Contacter l'admin</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Composants helpers
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="animate-pulse h-9 w-9 bg-gray-200 rounded-lg"></div>
            <div className="animate-pulse h-8 w-8 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="hidden lg:block w-64 space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="flex-1 max-w-xl mx-auto space-y-6">
            <div className="animate-pulse h-32 bg-gray-200 rounded-xl"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse h-64 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="hidden lg:block w-80 space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function NotFoundPage({ router }: { router: any }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-0 shadow-xl">
        <CardContent className="pt-8 text-center">
          <div className="h-20 w-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Groupe non trouvé</h1>
          <p className="text-gray-600 mb-8">
            Ce groupe n'existe pas ou vous n'avez pas l'autorisation d'y accéder.
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => router.push('/groups')}
              className="bg-gradient-to-r from-blue-600 to-blue-700"
            >
              Explorer les groupes
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Retour
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PrivateGroupPage({ group, onJoinClick, router }: any) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <GroupHeader 
          group={group} 
          currentTab="posts" 
          onTabChange={() => {}}
          onJoinClick={onJoinClick}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6">
          <div className="lg:col-span-3">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="h-24 w-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Lock className="h-12 w-12 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Groupe privé</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Ce groupe est privé. Vous devez être membre pour voir le contenu.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={onJoinClick}
                    className="bg-gradient-to-r from-blue-600 to-blue-700"
                  >
                    Demander à rejoindre
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/groups')}>
                    Explorer d'autres groupes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <GroupSidebar 
              group={group}
              onJoinClick={onJoinClick}
            />
          </div>
        </div>
      </div>
    </div>
  )
}