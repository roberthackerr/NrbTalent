"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MessageCircle,
  Eye,
  ArrowRight,
  User,
  Check,
  X,
  Loader2,
  ShoppingBag,
  TrendingUp,
  Award,
  Sparkles
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bgColor: string }> = {
  pending: { label: 'En attente', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-950/30', icon: Clock },
  accepted: { label: 'Acceptée', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-950/30', icon: CheckCircle },
  in_progress: { label: 'En cours', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-950/30', icon: Package },
  delivered: { label: 'Livré', color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-950/30', icon: CheckCircle },
  completed: { label: 'Terminé', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-950/30', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-950/30', icon: XCircle },
  disputed: { label: 'Litige', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-950/30', icon: AlertCircle }
}

export default function OrdersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const lang = (params?.lang as string) || 'fr'
  
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [acceptMessage, setAcceptMessage] = useState("")
  const [accepting, setAccepting] = useState(false)

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
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending
  }

  const handleAcceptOrder = async () => {
    if (!selectedOrder) return
    
    setAccepting(true)
    try {
      const response = await fetch(`/api/orders/${selectedOrder._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'accept',
          message: acceptMessage || undefined
        })
      })

      if (response.ok) {
        toast.success('Commande acceptée avec succès !')
        setAcceptDialogOpen(false)
        setAcceptMessage("")
        
        // Mettre à jour la commande dans la liste
        setOrders(prev => prev.map(order => 
          order._id === selectedOrder._id 
            ? { ...order, status: 'accepted' }
            : order
        ))
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de l\'acceptation')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setAccepting(false)
    }
  }

  const openAcceptDialog = (order: Order) => {
    setSelectedOrder(order)
    setAcceptDialogOpen(true)
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-10 w-10 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Connexion requise
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connectez-vous pour voir vos commandes
          </p>
          <Button onClick={() => router.push(`/${lang}/auth/signin`)} className="bg-gradient-to-r from-purple-600 to-pink-600">
            Se connecter
          </Button>
        </div>
      </div>
    )
  }

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const activeOrders = orders.filter(o => ['accepted', 'in_progress', 'delivered'].includes(o.status))
  const completedOrders = orders.filter(o => o.status === 'completed')
  const cancelledOrders = orders.filter(o => o.status === 'cancelled')

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/25">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
              Mes Commandes
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-11">
            Gérez vos commandes en tant qu'acheteur ou vendeur
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">En attente</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">{pendingOrders.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">En cours</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{activeOrders.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600 dark:text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300">Terminées</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-200">{completedOrders.length}</p>
                </div>
                <Award className="h-8 w-8 text-green-600 dark:text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300">Annulées</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-200">{cancelledOrders.length}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-lg mb-6 max-w-md">
          <Button
            variant={activeTab === 'buyer' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('buyer')}
            className={`flex-1 ${activeTab === 'buyer' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : ''}`}
          >
            <User className="h-4 w-4 mr-2" />
            Commandes achetées
          </Button>
          <Button
            variant={activeTab === 'seller' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('seller')}
            className={`flex-1 ${activeTab === 'seller' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : ''}`}
          >
            <Package className="h-4 w-4 mr-2" />
            Commandes vendues
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-purple-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <Skeleton className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800" />
                      <Skeleton className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 bg-gray-200 dark:bg-gray-800" />
                        <Skeleton className="h-6 w-24 bg-gray-200 dark:bg-gray-800" />
                      </div>
                    </div>
                    <Skeleton className="h-9 w-24 bg-gray-200 dark:bg-gray-800" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card className="border-purple-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-10 w-10 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Aucune commande {activeTab === 'buyer' ? 'achetée' : 'vendue'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {activeTab === 'buyer' 
                  ? "Vous n'avez pas encore passé de commande"
                  : "Vous n'avez pas encore reçu de commande"
                }
              </p>
              <Button onClick={() => router.push(`/${lang}/gigs`)} className="bg-gradient-to-r from-purple-600 to-pink-600">
                {activeTab === 'buyer' ? 'Découvrir les services' : 'Promouvoir mes services'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            <div className="space-y-4">
              {orders.map((order, index) => {
                const StatusIcon = getStatusConfig(order.status).icon
                const statusColor = getStatusConfig(order.status).color
                const statusBgColor = getStatusConfig(order.status).bgColor
                const statusLabel = getStatusConfig(order.status).label

                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-purple-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-2xl -mr-16 -mt-16" />
                      
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                                  {order.gig?.title || 'Service'}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                                  {order.gig?.description || 'Aucune description'}
                                </p>
                              </div>
                              <Badge className={`${statusBgColor} ${statusColor} border-0`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusLabel}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Package:</span>
                                <span className="text-gray-600 dark:text-gray-400">{order.package}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Prix:</span>
                                <span className="text-gray-600 dark:text-gray-400">{order.price}€</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Livraison:</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {format(new Date(order.deliveryDate), 'dd MMM yyyy', { locale: fr })}
                                </span>
                              </div>
                            </div>

                            {order.requirements && (
                              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                  Exigences:
                                </span>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                  {order.requirements}
                                </p>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-500">
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

                          <div className="flex flex-row lg:flex-col gap-2">
                            <Button
                              size="sm"
                              onClick={() => router.push(`/${lang}/orders/${order._id}`)}
                              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                              <Eye className="h-4 w-4" />
                              Détails
                            </Button>
                            
                            {activeTab === 'seller' && order.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openAcceptDialog(order)}
                                className="flex items-center gap-2 border-green-500 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/30"
                              >
                                <Check className="h-4 w-4" />
                                Accepter
                              </Button>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/${lang}/messages?order=${order._id}`)}
                              className="flex items-center gap-2 border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950/30"
                            >
                              <MessageCircle className="h-4 w-4" />
                              Message
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Accept Order Dialog */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-900 border-purple-200 dark:border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Accepter la commande
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Vous êtes sur le point d'accepter cette commande. Un message optionnel peut être envoyé à l'acheteur.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedOrder && (
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-white mb-1">{selectedOrder.gig?.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Prix: {selectedOrder.price}€
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="message" className="text-gray-700 dark:text-gray-300">
                Message à l'acheteur (optionnel)
              </Label>
              <Textarea
                id="message"
                placeholder="Bonjour, je confirme que j'ai bien reçu votre commande et je commence à travailler dessus..."
                value={acceptMessage}
                onChange={(e) => setAcceptMessage(e.target.value)}
                rows={4}
                className="border-purple-200 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setAcceptDialogOpen(false)}
              className="border-gray-300 dark:border-gray-700"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAcceptOrder}
              disabled={accepting}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Acceptation...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Accepter la commande
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}