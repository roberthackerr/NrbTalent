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
  FileText,
  Loader2,
  Sparkles,
  TrendingUp,
  Award,
  Shield,
  Truck,
  Check,
  X,
  Send
} from "lucide-react"
import { format } from "date-fns"
import { fr, enUS } from "date-fns/locale"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { getDictionarySafe } from "@/lib/i18n/dictionaries"
import type { Locale } from "@/lib/i18n/config"

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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bgColor: string; textColor: string }> = {
  pending: { 
    label: 'En attente', 
    color: 'bg-yellow-500', 
    icon: Clock, 
    bgColor: 'bg-yellow-100 dark:bg-yellow-950/30',
    textColor: 'text-yellow-700 dark:text-yellow-300'
  },
  accepted: { 
    label: 'Acceptée', 
    color: 'bg-blue-500', 
    icon: CheckCircle, 
    bgColor: 'bg-blue-100 dark:bg-blue-950/30',
    textColor: 'text-blue-700 dark:text-blue-300'
  },
  in_progress: { 
    label: 'En cours', 
    color: 'bg-purple-500', 
    icon: Package, 
    bgColor: 'bg-purple-100 dark:bg-purple-950/30',
    textColor: 'text-purple-700 dark:text-purple-300'
  },
  delivered: { 
    label: 'Livré', 
    color: 'bg-indigo-500', 
    icon: Truck, 
    bgColor: 'bg-indigo-100 dark:bg-indigo-950/30',
    textColor: 'text-indigo-700 dark:text-indigo-300'
  },
  completed: { 
    label: 'Terminé', 
    color: 'bg-green-500', 
    icon: CheckCircle, 
    bgColor: 'bg-green-100 dark:bg-green-950/30',
    textColor: 'text-green-700 dark:text-green-300'
  },
  cancelled: { 
    label: 'Annulé', 
    color: 'bg-red-500', 
    icon: XCircle, 
    bgColor: 'bg-red-100 dark:bg-red-950/30',
    textColor: 'text-red-700 dark:text-red-300'
  },
  disputed: { 
    label: 'Litige', 
    color: 'bg-orange-500', 
    icon: AlertCircle, 
    bgColor: 'bg-orange-100 dark:bg-orange-950/30',
    textColor: 'text-orange-700 dark:text-orange-300'
  }
}

const STATUS_ACTIONS = {
  pending: ['accept', 'cancel'],
  accepted: ['start', 'cancel'],
  in_progress: ['deliver', 'dispute'],
  delivered: ['complete', 'dispute'],
  completed: [],
  cancelled: [],
  disputed: ['resolve']
}

export default function OrderDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const lang = (params?.lang as Locale) || 'fr'
  
  const [dict, setDict] = useState<any>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const [showMessageInput, setShowMessageInput] = useState(false)

  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

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
          toast.error(t.error || 'Erreur lors du chargement')
          router.push(`/${lang}/orders`)
        }
      } catch (error) {
        console.error('Error fetching order:', error)
        toast.error(t.error || 'Erreur lors du chargement')
        router.push(`/${lang}/orders`)
      } finally {
        setLoading(false)
      }
    }

    if (dict) {
      fetchOrder()
    }
  }, [session, orderId, router, lang, dict])

  const t = dict?.orders || {
    backToOrders: 'Retour aux commandes',
    order: 'Commande',
    details: 'Détails de la commande',
    price: 'Prix',
    package: 'Package',
    deliveryDate: 'Date de livraison',
    orderedOn: 'Commandé le',
    requirements: 'Exigences spécifiques',
    updateStatus: 'Mettre à jour le statut',
    addMessage: 'Ajouter un message (optionnel)',
    history: 'Historique des messages',
    participants: 'Participants',
    buyer: 'Acheteur',
    seller: 'Vendeur',
    actions: 'Actions',
    contact: 'Contacter',
    confirmDelivery: 'Confirmer la livraison',
    cancelOrder: 'Annuler la commande',
    acceptOrder: 'Accepter la commande',
    startWork: 'Commencer le travail',
    deliverWork: 'Livrer le travail',
    completeOrder: 'Terminer la commande',
    openDispute: 'Ouvrir un litige',
    resolveDispute: 'Résoudre le litige',
    error: 'Erreur lors du chargement',
    acceptConfirm: 'Accepter',
    startConfirm: 'Commencer',
    deliverConfirm: 'Livrer',
    completeConfirm: 'Terminer',
    cancelConfirm: 'Annuler',
    disputeConfirm: 'Ouvrir un litige'
  }

  const getDateLocale = () => {
    if (lang === 'fr') return fr
    if (lang === 'mg') return fr
    return enUS
  }

  const updateOrderStatus = async (action: string, customMessage?: string) => {
    if (!order) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action,
          message: customMessage || message
        })
      })

      const data = await response.json()

      if (response.ok) {
        setOrder(data.order)
        toast.success(t.statusUpdated || 'Statut mis à jour avec succès')
        setMessage('')
        setShowMessageInput(false)
      } else {
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error(t.updateError || 'Erreur lors de la mise à jour')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      accept: t.acceptConfirm || 'Accepter',
      start: t.startConfirm || 'Commencer',
      deliver: t.deliverConfirm || 'Livrer',
      complete: t.completeConfirm || 'Terminer',
      cancel: t.cancelConfirm || 'Annuler',
      dispute: t.disputeConfirm || 'Litige',
      resolve: t.resolveDispute || 'Résoudre'
    }
    return labels[action] || action
  }

  const getActionIcon = (action: string) => {
    const icons: Record<string, any> = {
      accept: CheckCircle,
      start: Package,
      deliver: Truck,
      complete: CheckCircle,
      cancel: XCircle,
      dispute: AlertCircle,
      resolve: Shield
    }
    return icons[action] || CheckCircle
  }

  if (loading || !dict) {
    return <OrderDetailSkeleton t={t} lang={lang} />
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Commande non trouvée
          </h3>
          <Button onClick={() => router.push(`/${lang}/orders`)} className="bg-gradient-to-r from-purple-600 to-pink-600">
            {t.backToOrders}
          </Button>
        </div>
      </div>
    )
  }

  const StatusIcon = getStatusConfig(order.status).icon
  const statusBgColor = getStatusConfig(order.status).bgColor
  const statusTextColor = getStatusConfig(order.status).textColor
  const statusLabel = getStatusConfig(order.status).label
  const isBuyer = order.buyerId === (session?.user as any)?.id
  const isSeller = order.sellerId === (session?.user as any)?.id
  const availableActions = STATUS_ACTIONS[order.status as keyof typeof STATUS_ACTIONS] || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push(`/${lang}/orders`)}
            className="mb-4 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950/30"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.backToOrders}
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/25">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                  {t.order} #{order._id.slice(-8)}
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 ml-11">
                {order.gig?.title}
              </p>
            </div>
            <Badge className={`${statusBgColor} ${statusTextColor} border-0 text-lg px-4 py-2`}>
              <StatusIcon className="h-4 w-4 mr-2" />
              {statusLabel}
            </Badge>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-purple-200 dark:border-gray-700 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <FileText className="h-5 w-5" />
                    {t.details}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.price}</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {order.price.toLocaleString()}€
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.package}</p>
                        <p className="font-semibold text-gray-900 dark:text-white capitalize">
                          {order.package}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.deliveryDate}</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {format(new Date(order.deliveryDate), 'dd MMMM yyyy', { locale: getDateLocale() })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.orderedOn}</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: getDateLocale() })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {order.requirements && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{t.requirements}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {order.requirements}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions */}
            {availableActions.length > 0 && (isSeller || isBuyer) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-purple-200 dark:border-gray-700 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                      <Sparkles className="h-5 w-5" />
                      {t.updateStatus}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      {availableActions.map((action) => {
                        const ActionIcon = getActionIcon(action)
                        return (
                          <Button
                            key={action}
                            variant="outline"
                            onClick={() => setShowMessageInput(true)}
                            className="border-green-500 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/30"
                          >
                            <ActionIcon className="h-4 w-4 mr-2" />
                            {getActionLabel(action)}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <AnimatePresence>
                      {showMessageInput && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 pt-2"
                        >
                          <Textarea
                            placeholder={t.addMessage}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                            className="border-purple-200 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                const action = availableActions[0]
                                if (action) updateOrderStatus(action)
                                setShowMessageInput(false)
                              }}
                              disabled={updating}
                              className="bg-gradient-to-r from-green-600 to-emerald-600"
                            >
                              {updating ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 mr-2" />
                              )}
                              Confirmer
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowMessageInput(false)
                                setMessage('')
                              }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Annuler
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Messages History */}
            {order.messages && order.messages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-purple-200 dark:border-gray-700 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                      <MessageCircle className="h-5 w-5" />
                      {t.history}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {order.messages.map((msg, index) => (
                      <motion.div
                        key={msg._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                      >
                        <div className={`p-2 rounded-full ${
                          msg.isSystemMessage 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                        }`}>
                          <MessageCircle className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{msg.content}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {format(new Date(msg.createdAt), 'dd/MM/yyyy à HH:mm', { locale: getDateLocale() })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-purple-200 dark:border-gray-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Users className="h-5 w-5" />
                    {t.participants}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t.buyer}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {order.buyer?.name || 'Inconnu'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t.seller}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {order.seller?.name || 'Inconnu'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-purple-200 dark:border-gray-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Zap className="h-5 w-5" />
                    {t.actions}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                    onClick={() => router.push(`/${lang}/messages?order=${order._id}`)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {t.contact} {isBuyer ? t.seller : t.buyer}
                  </Button>
                  
                  {isBuyer && order.status === 'delivered' && (
                    <Button
                      variant="outline"
                      className="w-full border-green-500 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400"
                      onClick={() => updateOrderStatus('complete')}
                      disabled={updating}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t.confirmDelivery}
                    </Button>
                  )}

                  {isSeller && order.status === 'pending' && (
                    <Button
                      variant="outline"
                      className="w-full border-green-500 text-green-600 hover:bg-green-50"
                      onClick={() => updateOrderStatus('accept')}
                      disabled={updating}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t.acceptOrder}
                    </Button>
                  )}

                  {isSeller && order.status === 'accepted' && (
                    <Button
                      variant="outline"
                      className="w-full border-purple-500 text-purple-600 hover:bg-purple-50"
                      onClick={() => updateOrderStatus('start')}
                      disabled={updating}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      {t.startWork}
                    </Button>
                  )}

                  {isSeller && order.status === 'in_progress' && (
                    <Button
                      variant="outline"
                      className="w-full border-indigo-500 text-indigo-600 hover:bg-indigo-50"
                      onClick={() => updateOrderStatus('deliver')}
                      disabled={updating}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      {t.deliverWork}
                    </Button>
                  )}

                  {(isBuyer || isSeller) && ['pending', 'accepted', 'in_progress'].includes(order.status) && (
                    <Button
                      variant="outline"
                      className="w-full border-red-500 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                      onClick={() => updateOrderStatus('cancel')}
                      disabled={updating}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {t.cancelOrder}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-purple-200 dark:border-gray-700 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Award className="h-5 w-5" />
                    Conseils
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">Communiquez clairement les délais</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">Demandez des clarifications si besoin</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">Gardez une trace de toutes les communications</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderDetailSkeleton({ t, lang }: { t: any; lang: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-32 mb-4 bg-gray-200 dark:bg-gray-800" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-800" />
                <Skeleton className="h-8 w-48 bg-gray-200 dark:bg-gray-800" />
              </div>
              <Skeleton className="h-4 w-64 bg-gray-200 dark:bg-gray-800 ml-11" />
            </div>
            <Skeleton className="h-8 w-24 rounded-full bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-purple-200 dark:border-gray-700">
              <CardHeader>
                <Skeleton className="h-6 w-32 bg-gray-200 dark:bg-gray-800" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-800" />
                      <div>
                        <Skeleton className="h-4 w-16 mb-1 bg-gray-200 dark:bg-gray-800" />
                        <Skeleton className="h-5 w-20 bg-gray-200 dark:bg-gray-800" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-purple-200 dark:border-gray-700">
              <CardHeader>
                <Skeleton className="h-6 w-24 bg-gray-200 dark:bg-gray-800" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800" />
                    <div>
                      <Skeleton className="h-4 w-16 mb-1 bg-gray-200 dark:bg-gray-800" />
                      <Skeleton className="h-5 w-24 bg-gray-200 dark:bg-gray-800" />
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