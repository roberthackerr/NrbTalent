// /app/(dashboard)/groups/[slug]/requests/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  ArrowLeft,
  AlertCircle,
  Mail,
  Building,
  MapPin,
  Loader2,
  UserCheck,
  UserMinus,
  Shield,
  Crown
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface JoinRequest {
  _id: string
  userId: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  processedAt?: string
  processedBy?: string
  user: {
    _id: string
    name: string
    email: string
    avatar?: string
    title?: string
    company?: string
    location?: string
    bio?: string
    skills?: Array<{
      name: string
      category?: string
      level?: string
    }>
  }
}

interface GroupInfo {
  _id: string
  name: string
  description: string
  visibility: 'public' | 'private'
  stats: {
    totalMembers: number
    pendingRequests: number
  }
}

export default function GroupRequestsPage() {
  const params = useParams()
  const router = useRouter()
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [group, setGroup] = useState<GroupInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    fetchGroupInfo()
    fetchRequests()
  }, [params.slug, activeTab])

  const fetchGroupInfo = async () => {
    try {
      const response = await fetch(`/api/groups/slug/${params.slug}`)
      if (response.ok) {
        const data = await response.json()
        setGroup(data)
      }
    } catch (error) {
      console.error('Error fetching group:', error)
    }
  }

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/groups/slug/${params.slug}/join-requests?status=${activeTab}`)
      
      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Vous n\'avez pas la permission de voir les demandes')
          router.push(`/groups/${params.slug}`)
          return
        }
        throw new Error('Failed to fetch requests')
      }

      const data = await response.json()
      setRequests(data.requests || [])
      setUserRole(data.currentUserRole || '')
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast.error('Erreur lors du chargement des demandes')
    } finally {
      setLoading(false)
    }
  }

  const handleProcessRequest = async (requestId: string, action: 'approve' | 'reject', userName: string) => {
    if (processing) return
    
    setProcessing(requestId)
    try {
      const response = await fetch(`/api/groups/slug/${params.slug}/join-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action })
      })

      if (response.ok) {
        toast.success(
          action === 'approve' 
            ? `${userName} a été accepté(e) dans le groupe` 
            : `Demande de ${userName} refusée`
        )
        fetchRequests()
        if (group) {
          setGroup({
            ...group,
            stats: {
              ...group.stats,
              pendingRequests: action === 'approve' ? group.stats.pendingRequests - 1 : group.stats.pendingRequests
            }
          })
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors du traitement')
      }
    } catch (error) {
      toast.error('Erreur lors du traitement de la demande')
    } finally {
      setProcessing(null)
    }
  }

  const handleBulkAction = async (action: 'approve' | 'reject', selectedIds: string[]) => {
    if (!confirm(`Êtes-vous sûr de vouloir ${action === 'approve' ? 'accepter' : 'refuser'} ${selectedIds.length} demande(s) ?`)) {
      return
    }

    try {
      const promises = selectedIds.map(id =>
        fetch(`/api/groups/slug/${params.slug}/join-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: id, action })
        })
      )

      await Promise.all(promises)
      toast.success(`${selectedIds.length} demande(s) traitées avec succès`)
      fetchRequests()
    } catch (error) {
      toast.error('Erreur lors du traitement en masse')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4" />
      case 'admin': return <Shield className="h-4 w-4" />
      default: return null
    }
  }

  if (loading && requests.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Vérifier si l'utilisateur a la permission
  if (!['owner', 'admin'].includes(userRole)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-3">Accès refusé</h2>
            <p className="text-slate-600 mb-6">
              Vous devez être administrateur ou propriétaire du groupe pour gérer les demandes d'adhésion.
            </p>
            <Button onClick={() => router.push(`/groups/${params.slug}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au groupe
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const approvedRequests = requests.filter(r => r.status === 'approved')
  const rejectedRequests = requests.filter(r => r.status === 'rejected')

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push(`/groups/${params.slug}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au groupe
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Demandes d'adhésion
              {group && (
                <span className="text-slate-600 ml-2">• {group.name}</span>
              )}
            </h1>
            <p className="text-slate-600 mt-2">
              Gérez les demandes d'adhésion pour ce groupe
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              <Users className="h-4 w-4 mr-2" />
              {group?.stats.totalMembers || 0} membres
            </Badge>
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="text-sm">
                <Clock className="h-4 w-4 mr-2" />
                {pendingRequests.length} en attente
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{pendingRequests.length}</div>
                <div className="text-sm text-slate-600">En attente</div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{approvedRequests.length}</div>
                <div className="text-sm text-slate-600">Acceptées</div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{rejectedRequests.length}</div>
                <div className="text-sm text-slate-600">Refusées</div>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <UserMinus className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="mb-8">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            En attente
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Acceptées
            {approvedRequests.length > 0 && (
              <Badge className="ml-2 bg-green-100 text-green-800">
                {approvedRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Refusées
            {rejectedRequests.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {rejectedRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Demandes en attente</CardTitle>
                  <CardDescription>
                    Approuvez ou refusez les demandes d'adhésion
                  </CardDescription>
                </div>
                {pendingRequests.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('approve', pendingRequests.map(r => r._id))}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Tout accepter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('reject', pendingRequests.map(r => r._id))}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Tout refuser
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune demande en attente</h3>
                  <p className="text-slate-600 mb-4">
                    Toutes les demandes d'adhésion ont été traitées
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="border rounded-lg p-6 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        {/* User Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={request.user.avatar} />
                              <AvatarFallback className="text-lg">
                                {request.user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 className="text-xl font-semibold">{request.user.name}</h3>
                                <Badge variant="outline">{request.user.email}</Badge>
                              </div>
                              
                              <div className="space-y-2 text-sm text-slate-600">
                                {request.user.title && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{request.user.title}</span>
                                  </div>
                                )}
                                
                                <div className="flex flex-wrap gap-4">
                                  {request.user.company && (
                                    <div className="flex items-center gap-1">
                                      <Building className="h-4 w-4" />
                                      {request.user.company}
                                    </div>
                                  )}
                                  {request.user.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      {request.user.location}
                                    </div>
                                  )}
                                </div>
                                
                                {request.user.bio && (
                                  <p className="mt-2 text-slate-700">{request.user.bio}</p>
                                )}
                                
                                {request.user.skills && request.user.skills.length > 0 && (
                                  <div className="mt-3">
                                    <div className="text-xs text-slate-500 mb-1">Compétences :</div>
                                    <div className="flex flex-wrap gap-2">
                                      {request.user.skills.map((skill, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          {skill.name}
                                          {skill.level && (
                                            <span className="ml-1 text-xs opacity-75">• {skill.level}</span>
                                          )}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {request.message && (
                                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="text-sm text-blue-800 font-medium mb-1">
                                    Message de l'utilisateur :
                                  </div>
                                  <p className="text-blue-700">"{request.message}"</p>
                                </div>
                              )}
                              
                              <div className="mt-4 text-xs text-slate-500">
                                <Clock className="h-3 w-3 inline mr-1" />
                                Demandé {formatDistanceToNow(new Date(request.createdAt), { 
                                  addSuffix: true,
                                  locale: fr 
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-col gap-3 min-w-[200px]">
                          <Button
                            onClick={() => handleProcessRequest(request._id, 'approve', request.user.name)}
                            disabled={processing === request._id}
                            className="gap-2"
                          >
                            {processing === request._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            Accepter
                          </Button>
                          
                          <Button
                            variant="outline"
                            onClick={() => handleProcessRequest(request._id, 'reject', request.user.name)}
                            disabled={processing === request._id}
                            className="gap-2"
                          >
                            <XCircle className="h-4 w-4" />
                            Refuser
                          </Button>
                          
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Mail className="h-4 w-4" />
                            Contacter
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approved Requests */}
        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Demandes acceptées</CardTitle>
              <CardDescription>
                Historique des demandes d'adhésion acceptées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvedRequests.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Aucune demande acceptée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvedRequests.map((request) => (
                    <div
                      key={request._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={request.user.avatar} />
                          <AvatarFallback>{request.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{request.user.name}</div>
                          <div className="text-sm text-slate-500">
                            Accepté {formatDistanceToNow(new Date(request.processedAt || request.createdAt), { 
                              addSuffix: true,
                              locale: fr 
                            })}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Accepté
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rejected Requests */}
        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Demandes refusées</CardTitle>
              <CardDescription>
                Historique des demandes d'adhésion refusées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rejectedRequests.length === 0 ? (
                <div className="text-center py-12">
                  <XCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Aucune demande refusée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rejectedRequests.map((request) => (
                    <div
                      key={request._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={request.user.avatar} />
                          <AvatarFallback>{request.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{request.user.name}</div>
                          <div className="text-sm text-slate-500">
                            Refusé {formatDistanceToNow(new Date(request.processedAt || request.createdAt), { 
                              addSuffix: true,
                              locale: fr 
                            })}
                          </div>
                          {request.message && (
                            <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                              "{request.message}"
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        <XCircle className="h-3 w-3 mr-1" />
                        Refusé
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h3 className="font-medium mb-4">Statistiques des demandes</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{pendingRequests.length}</div>
              <div className="text-sm text-slate-600">En attente</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{approvedRequests.length}</div>
              <div className="text-sm text-slate-600">Acceptées</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{rejectedRequests.length}</div>
              <div className="text-sm text-slate-600">Refusées</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{requests.length}</div>
              <div className="text-sm text-slate-600">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}