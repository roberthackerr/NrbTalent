"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MessageCircle,
  ArrowLeft,
  User,
  DollarSign,
  Calendar,
  FileText
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"

interface Order {
  _id: string
  gigId: string
  buyerId: string
  sellerId: string
  package: string
  price: number
  status: string
  requirements: string
  deliveryDate: string
  createdAt: string
  updatedAt: string
  messages: any[]
  gig?: {
    _id: string
    title: string
    description: string
    images: string[]
    deliveryTime: number
  }
  seller?: {
    _id: string
    name: string
    avatar?: string
  }
  buyer?: {
    _id: string
    name: string
    avatar?: string
  }
}

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'bg-yellow-500', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-blue-500', icon: Package },
  delivered: { label: 'Livré', color: 'bg-purple-500', icon: CheckCircle },
  completed: { label: 'Terminé', color: 'bg-green-500', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'bg-red-500', icon: XCircle },
  disputed: { label: 'Litige', color: 'bg-orange-500', icon: AlertCircle }
}

const STATUS_ACTIONS = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['delivered', 'disputed'],
  delivered: ['completed', 'disputed'],
  completed: [],
  cancelled: [],
  disputed: ['completed', 'cancelled']
}

export default function OrderDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchOrder = async () => {
      if (!session) return

      try {
        setLoading(true)
        const response = await fetch(`/api/orders/${orderId}`)
        const data = await response.json()

        if (response.ok) {
          setOrder(data.order)
        } else {
          toast.error(data.error || 'Erreur lors du chargement')
          router.push('/orders')
        }
      } catch (error) {
        console.error('Error fetching order:', error)
        toast.error('Erreur lors du chargement')
        router.push('/orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [session, orderId, router])

  const updateOrderStatus = async (newStatus: string, message?: string) => {
    if (!order) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          message 
        })
      })

      const data = await response.json()

      if (response.ok) {
        setOrder(data.order)
        toast.success('Statut mis à jour avec succès')
        setMessage('')
      } else {
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
  }

  const isBuyer = order?.buyerId === (session?.user as any)?.id
  const isSeller = order?.sellerId === (session?.user as any)?.id
  const canUpdateStatus = isSeller && order && STATUS_ACTIONS[order.status as keyof typeof STATUS_ACTIONS]?.length > 0

  if (loading) {
    return <OrderDetailSkeleton />
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Commande non trouvée
          </h3>
          <Button onClick={() => router.push('/orders')}>
            Retour aux commandes
          </Button>
        </div>
      </div>
    )
  }

  const StatusIcon = getStatusConfig(order.status).icon
  const statusColor = getStatusConfig(order.status).color
  const statusLabel = getStatusConfig(order.status).label

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/orders')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux commandes
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Commande #{order._id.slice(-8)}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {order.gig?.title}
              </p>
            </div>
            <Badge className={`${statusColor} text-white text-lg px-4 py-2`}>
              <StatusIcon className="h-4 w-4 mr-2" />
              {statusLabel}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Détails de la commande */}
            <Card>
              <CardHeader>
                <CardTitle>Détails de la commande</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Prix</p>
                      <p className="font-semibold">{order.price}€</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Package</p>
                      <p className="font-semibold capitalize">{order.package}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Date de livraison</p>
                      <p className="font-semibold">
                        {format(new Date(order.deliveryDate), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Commandé le</p>
                      <p className="font-semibold">
                        {format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                </div>

                {order.requirements && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">Exigences spécifiques</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                      {order.requirements}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {canUpdateStatus && (
              <Card>
                <CardHeader>
                  <CardTitle>Mettre à jour le statut</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {STATUS_ACTIONS[order.status as keyof typeof STATUS_ACTIONS]?.map((status) => {
                      const actionConfig = getStatusConfig(status)
                      const ActionIcon = actionConfig.icon
                      
                      return (
                        <Button
                          key={status}
                          variant="outline"
                          onClick={() => updateOrderStatus(status)}
                          disabled={updating}
                          className="flex items-center gap-2"
                        >
                          <ActionIcon className="h-4 w-4" />
                          {actionConfig.label}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <div>
                    <Textarea
                      placeholder="Ajouter un message (optionnel)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Messages système */}
            {order.messages && order.messages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Historique des messages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.messages.map((msg) => (
                    <div key={msg._id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className={`p-2 rounded-full ${
                        msg.isSystemMessage ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'
                      }`}>
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700 dark:text-slate-300">{msg.content}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {format(new Date(msg.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Utilisateurs */}
            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Acheteur</p>
                    <p className="font-semibold">{order.buyer?.name || 'Inconnu'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Vendeur</p>
                    <p className="font-semibold">{order.seller?.name || 'Inconnu'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => router.push(`/messages/?orderid=${order._id}`)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contacter {isBuyer ? 'le vendeur' : "l'acheteur"}
                </Button>
                
                {isBuyer && order.status === 'delivered' && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => updateOrderStatus('completed')}
                    disabled={updating}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmer la livraison
                  </Button>
                )}

                {(isBuyer || isSeller) && ['pending', 'in_progress'].includes(order.status) && (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => updateOrderStatus('cancelled', 'Commande annulée')}
                    disabled={updating}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Annuler la commande
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-32 mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}