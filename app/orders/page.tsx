"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MessageCircle,
  Eye,
  ArrowRight,
  User
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

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
  gig?: {
    _id: string
    title: string
    description: string
    images: string[]
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

export default function OrdersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer')

  useEffect(() => {
    const fetchOrders = async () => {
      if (!session) return

      try {
        setLoading(true)
        const response = await fetch(`/api/orders?role=${activeTab}`)
        const data = await response.json()

        if (response.ok) {
          setOrders(data.orders || [])
        } else {
          console.error('Error fetching orders:', data.error)
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [session, activeTab])

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Connexion requise
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Connectez-vous pour voir vos commandes
          </p>
          <Button onClick={() => router.push('/auth/signin')}>
            Se connecter
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Mes Commandes
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Gérez vos commandes en tant qu'acheteur ou vendeur
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg mb-6 max-w-md">
          <Button
            variant={activeTab === 'buyer' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('buyer')}
            className="flex-1"
          >
            <User className="h-4 w-4 mr-2" />
            Commandes achetées
          </Button>
          <Button
            variant={activeTab === 'seller' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('seller')}
            className="flex-1"
          >
            <Package className="h-4 w-4 mr-2" />
            Commandes vendues
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-9 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Aucune commande {activeTab === 'buyer' ? 'achetée' : 'vendue'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {activeTab === 'buyer' 
                  ? "Vous n'avez pas encore passé de commande"
                  : "Vous n'avez pas encore reçu de commande"
                }
              </p>
              <Button onClick={() => router.push('/gigs')}>
                {activeTab === 'buyer' ? 'Découvrir les services' : 'Promouvoir mes services'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const StatusIcon = getStatusConfig(order.status).icon
              const statusColor = getStatusConfig(order.status).color
              const statusLabel = getStatusConfig(order.status).label

              return (
                <Card key={order._id} className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1">
                              {order.gig?.title || 'Service'}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-2">
                              {order.gig?.description || 'Aucune description'}
                            </p>
                          </div>
                          <Badge className={`${statusColor} text-white`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusLabel}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <div>
                            <span className="font-medium">Package:</span> {order.package}
                          </div>
                          <div>
                            <span className="font-medium">Prix:</span> {order.price}€
                          </div>
                          <div>
                            <span className="font-medium">Livraison:</span>{' '}
                            {format(new Date(order.deliveryDate), 'dd MMM yyyy', { locale: fr })}
                          </div>
                        </div>

                        {order.requirements && (
                          <div className="mt-3">
                            <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                              Exigences:
                            </span>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                              {order.requirements}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Commandé le {format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: fr })}
                          </div>
                          {activeTab === 'buyer' && order.seller && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              Vendeur: {order.seller.name}
                            </div>
                          )}
                          {activeTab === 'seller' && order.buyer && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              Acheteur: {order.buyer.name}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/orders/${order._id}`)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Détails
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/messages?order=${order._id}`)}
                          className="flex items-center gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}