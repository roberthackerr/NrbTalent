// /components/groups/GroupMembers.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  UserPlus, 
  Crown, 
  Shield, 
  User, 
  Mail, 
  MoreVertical,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
  Calendar,
  UserMinus,
  UserCheck,
  Ban,
  AlertCircle,
  ChevronDown,
  Loader2
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Member {
  _id: string
  userId: string
  role: 'owner' | 'admin' | 'moderator' | 'member'
  status: 'active' | 'pending' | 'banned'
  joinedAt: string
  lastActivity?: string
  activity?: {
    postCount: number
    commentCount: number
    eventAttendance: number
    lastActivity: string
  }
  user: {
    _id: string
    name: string
    avatar?: string
    title?: string
    company?: string
    skills?: string[]
    location?: string
    isVerified?: boolean
  }
}

interface JoinRequest {
  _id: string
  userId: string
  message: string
  status: string
  createdAt: string
  user: {
    _id: string
    name: string
    avatar?: string
    title?: string
    company?: string
    location?: string
  }
}

interface GroupMembersProps {
  groupId: string
}

export function GroupMembers({ groupId }: GroupMembersProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('members')
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [stats, setStats] = useState({
    total: 0,
    owners: 0,
    admins: 0,
    moderators: 0,
    members: 0,
    pending: 0
  })

  useEffect(() => {
    fetchMembers()
    if (currentUserRole === 'owner' || currentUserRole === 'admin') {
      fetchJoinRequests()
    }
  }, [groupId, roleFilter, activeTab])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (search) params.set('search', search)
      
      const response = await fetch(`/api/groups/${groupId}/members?${params}`)
      const data = await response.json()
      
      setMembers(data.members || [])
      setCurrentUserRole(data.currentUserRole || '')
      
      // Calculer les statistiques
      const statsData = {
        total: data.members?.length || 0,
        owners: data.members?.filter((m: Member) => m.role === 'owner').length || 0,
        admins: data.members?.filter((m: Member) => m.role === 'admin').length || 0,
        moderators: data.members?.filter((m: Member) => m.role === 'moderator').length || 0,
        members: data.members?.filter((m: Member) => m.role === 'member').length || 0,
        pending: 0 // Seront calculés plus tard
      }
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Erreur lors du chargement des membres')
    } finally {
      setLoading(false)
    }
  }

  const fetchJoinRequests = async () => {
    setLoadingRequests(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/join-requests`)
      if (response.ok) {
        const data = await response.json()
        setJoinRequests(data.requests || [])
        // Mettre à jour les stats des demandes en attente
        setStats(prev => ({ ...prev, pending: data.requests?.length || 0 }))
      }
    } catch (error) {
      console.error('Error fetching join requests:', error)
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      if (response.ok) {
        toast.success('Rôle mis à jour avec succès')
        fetchMembers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du rôle')
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${memberName} du groupe ?`)) return

    try {
      const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Membre retiré avec succès')
        fetchMembers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors du retrait')
      }
    } catch (error) {
      toast.error('Erreur lors du retrait du membre')
    }
  }

  const handleProcessJoinRequest = async (requestId: string, action: 'approve' | 'reject', userName: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/join-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId, 
          action,
          role: 'member' // Par défaut, on ajoute comme membre
        })
      })

      if (response.ok) {
        toast.success(action === 'approve' 
          ? `${userName} a été accepté(e) dans le groupe` 
          : `Demande de ${userName} refusée`)
        fetchJoinRequests()
        fetchMembers() // Rafraîchir la liste des membres si acceptée
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors du traitement')
      }
    } catch (error) {
      toast.error('Erreur lors du traitement de la demande')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4" />
      case 'admin': return <Shield className="h-4 w-4" />
      case 'moderator': return <UserCheck className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'moderator': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        )
      case 'banned':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <Ban className="h-3 w-3 mr-1" />
            Banni
          </Badge>
        )
      default:
        return null
    }
  }

  const canManageMember = (targetRole: string) => {
    // Logique de permission
    if (currentUserRole === 'owner') {
      return true // Owner peut gérer tout le monde (sauf autres owners)
    }
    if (currentUserRole === 'admin') {
      return !['owner', 'admin'].includes(targetRole) // Admin peut gérer modérateurs et membres
    }
    if (currentUserRole === 'moderator') {
      return false // Modérateur ne peut gérer personne
    }
    return false
  }

  const filteredMembers = members.filter(member =>
    search === '' ||
    member.user.name.toLowerCase().includes(search.toLowerCase()) ||
    member.user.title?.toLowerCase().includes(search.toLowerCase()) ||
    member.user.company?.toLowerCase().includes(search.toLowerCase()) ||
    member.user.skills?.some(skill => 
      skill.toLowerCase().includes(search.toLowerCase())
    )
  )

  const renderStatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
      <Card className="col-span-2 md:col-span-1">
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-slate-600 flex items-center gap-1">
            <Users className="h-3 w-3" />
            Total
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{stats.owners}</div>
          <div className="text-sm text-slate-600 flex items-center gap-1">
            <Crown className="h-3 w-3" />
            Propriétaires
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{stats.admins}</div>
          <div className="text-sm text-slate-600 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Admins
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{stats.moderators}</div>
          <div className="text-sm text-slate-600 flex items-center gap-1">
            <UserCheck className="h-3 w-3" />
            Modérateurs
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{stats.members}</div>
          <div className="text-sm text-slate-600 flex items-center gap-1">
            <User className="h-3 w-3" />
            Membres
          </div>
        </CardContent>
      </Card>
      {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
        <Card className={stats.pending > 0 ? 'border-yellow-300 bg-yellow-50' : ''}>
          <CardContent className="p-4">
            <div className={`text-2xl font-bold ${stats.pending > 0 ? 'text-yellow-700' : ''}`}>
              {stats.pending}
            </div>
            <div className="text-sm text-slate-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              En attente
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-slate-200 rounded animate-pulse mb-6"></div>
        {renderStatsCards()}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-3 p-4 border rounded-lg">
            <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Membres du groupe</h2>
          <p className="text-slate-600">
            Gérez les membres, les rôles et les demandes d'adhésion
          </p>
        </div>
        
        {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Inviter des membres
          </Button>
        )}
      </div>

      {/* Stats */}
      {renderStatsCards()}

      {/* Navigation par onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Membres
            <Badge variant="secondary" className="ml-1">
              {stats.total}
            </Badge>
          </TabsTrigger>
          
          {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
            <>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Demandes
                {stats.pending > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {stats.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="banned" className="flex items-center gap-2">
                <Ban className="h-4 w-4" />
                Bannis
              </TabsTrigger>
            </>
          )}
          
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Activité
          </TabsTrigger>
        </TabsList>

        {/* Onglet Membres */}
        <TabsContent value="members" className="space-y-4">
          {/* Barre de recherche et filtres */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher un membre par nom, poste, entreprise..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Rôle: {roleFilter === 'all' ? 'Tous' : roleFilter}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setRoleFilter('all')}>
                        <Users className="h-4 w-4 mr-2" />
                        Tous les rôles
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setRoleFilter('owner')}>
                        <Crown className="h-4 w-4 mr-2" />
                        Propriétaires
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRoleFilter('admin')}>
                        <Shield className="h-4 w-4 mr-2" />
                        Administrateurs
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRoleFilter('moderator')}>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Modérateurs
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRoleFilter('member')}>
                        <User className="h-4 w-4 mr-2" />
                        Membres
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button 
                    variant="outline" 
                    onClick={fetchMembers}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualiser'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des membres */}
          <Card>
            <CardContent className="p-6">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">
                    {search ? 'Aucun membre ne correspond à votre recherche' : 'Aucun membre dans ce groupe'}
                  </p>
                  {search && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setSearch('')}
                    >
                      Effacer la recherche
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMembers.map((member) => (
                    <div
                      key={member._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.user.avatar} />
                            <AvatarFallback className="text-lg">
                              {member.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {member.user.isVerified && (
                            <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                              <CheckCircle className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{member.user.name}</span>
                            <Badge className={`${getRoleColor(member.role)} text-xs`}>
                              {getRoleIcon(member.role)}
                              <span className="ml-1 capitalize">{member.role}</span>
                            </Badge>
                            {getStatusBadge(member.status)}
                          </div>
                          
                          <div className="text-sm text-slate-600 space-x-3">
                            {member.user.title && (
                              <span>{member.user.title}</span>
                            )}
                            {member.user.company && (
                              <span>• {member.user.company}</span>
                            )}
                            {member.user.location && (
                              <span>• {member.user.location}</span>
                            )}
                          </div>
                          
                          <div className="text-xs text-slate-500">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            Membre depuis {new Date(member.joinedAt).toLocaleDateString('fr-FR')}
                            {member.activity?.lastActivity && (
                              <>
                                <span className="mx-2">•</span>
                                Dernière activité: {formatDistanceToNow(new Date(member.activity.lastActivity), { 
                                  addSuffix: true,
                                  locale: fr 
                                })}
                              </>
                            )}
                          </div>
                          

{member.user.skills && member.user.skills.length > 0 && (
  <div className="flex flex-wrap gap-1 pt-1">
    {member.user.skills.slice(0, 4).map(skill => {
      // Vérifier si skill est un objet ou une string
      const skillName = typeof skill === 'string' ? skill : skill.name || skill.title || 'Compétence'
      const skillId = typeof skill === 'object' && skill.id ? skill.id : skillName
      
      return (
        <Badge key={skillId} variant="secondary" className="text-xs">
          {skillName}
        </Badge>
      )
    })}
    {member.user.skills.length > 4 && (
      <Badge variant="outline" className="text-xs">
        +{member.user.skills.length - 4}
      </Badge>
    )}
  </div>
)}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-start sm:self-center">
                        {/* Statistiques d'activité */}
                        <div className="flex gap-3 text-sm">
                          <div className="text-center">
                            <div className="font-semibold">{member.activity?.postCount || 0}</div>
                            <div className="text-xs text-slate-500">Posts</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{member.activity?.commentCount || 0}</div>
                            <div className="text-xs text-slate-500">Commentaires</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{member.activity?.eventAttendance || 0}</div>
                            <div className="text-xs text-slate-500">Événements</div>
                          </div>
                        </div>
                        
                        {/* Menu d'actions */}
                        {canManageMember(member.role) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Envoyer un message
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Voir le profil
                              </DropdownMenuItem>
                              
                              {/* Changer le rôle */}
                              {member.role !== 'owner' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuLabel>Changer le rôle</DropdownMenuLabel>
                                  {member.role !== 'admin' && (
                                    <DropdownMenuItem onClick={() => handleUpdateRole(member.user._id, 'admin')}>
                                      <Shield className="h-4 w-4 mr-2" />
                                      Promouvoir admin
                                    </DropdownMenuItem>
                                  )}
                                  {member.role !== 'moderator' && (
                                    <DropdownMenuItem onClick={() => handleUpdateRole(member.user._id, 'moderator')}>
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Promouvoir modérateur
                                    </DropdownMenuItem>
                                  )}
                                  {member.role !== 'member' && (
                                    <DropdownMenuItem onClick={() => handleUpdateRole(member.user._id, 'member')}>
                                      <User className="h-4 w-4 mr-2" />
                                      Rétrograder membre
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleRemoveMember(member.user._id, member.user.name)}
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Retirer du groupe
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Demandes d'adhésion */}
        {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Demandes d'adhésion en attente</CardTitle>
                <CardDescription>
                  Gérez les demandes d'adhésion au groupe
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRequests ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : joinRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <p className="text-slate-600">Aucune demande d'adhésion en attente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {joinRequests.map((request) => (
                      <div
                        key={request._id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={request.user.avatar} />
                            <AvatarFallback>{request.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <div className="font-medium">{request.user.name}</div>
                            <div className="text-sm text-slate-600 space-x-3">
                              {request.user.title && <span>{request.user.title}</span>}
                              {request.user.company && <span>• {request.user.company}</span>}
                              {request.user.location && <span>• {request.user.location}</span>}
                            </div>
                            {request.message && (
                              <div className="mt-2 text-sm text-slate-700 bg-slate-50 p-3 rounded border">
                                "{request.message}"
                              </div>
                            )}
                            <div className="mt-1 text-xs text-slate-500">
                              Demandé {formatDistanceToNow(new Date(request.createdAt), { 
                                addSuffix: true,
                                locale: fr 
                              })}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleProcessJoinRequest(request._id, 'approve', request.user.name)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accepter
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleProcessJoinRequest(request._id, 'reject', request.user.name)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Refuser
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Onglet Membres bannis */}
        {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
          <TabsContent value="banned">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Ban className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">Aucun membre banni pour l'instant</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Onglet Activité */}
        <TabsContent value="activity">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Les statistiques d'activité seront affichées ici</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}