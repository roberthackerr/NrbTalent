// app/orders/[id]/accept/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Calendar,
  MessageSquare,
  FileText,
  User,
  Briefcase,
  Shield,
  Star,
  ArrowLeft,
  Loader2,
  Check,
  X,
  Send,
  Eye,
  TrendingUp,
  Award,
  Heart,
  Zap,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

interface Order {
  _id: string
  status: string
  price: number
  currency: string
  deliveryDate: string
  requirements: string
  createdAt: string
  gig: {
    _id: string
    title: string
    description: string
    images: string[]
    deliveryTime: number
    revisions: number
  }
  buyer: {
    _id: string
    name: string
    avatar: string
    rating: number
    completedOrders: number
    memberSince: string
  }
  seller: {
    _id: string
    name: string
    avatar: string
    rating: number
    completedOrders: number
    memberSince: string
  }
}

export default function AcceptOrderPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const orderId = params.id as string
  const lang = (params.lang as Locale) || 'fr'

  const [dict, setDict] = useState<any>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [message, setMessage] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [selectedOption, setSelectedOption] = useState<'accept' | 'negotiate' | null>(null)

  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
    fetchOrder()
  }, [orderId, lang])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      } else {
        toast.error('Impossible de charger la commande')
        router.push(`/${lang}/orders`)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!acceptTerms) {
      toast.error('Veuillez accepter les conditions')
      return
    }

    setAccepting(true)
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'accept',
          message: message || undefined
        })
      })

      if (response.ok) {
        toast.success('Commande acceptée avec succès !')
        setTimeout(() => {
          router.push(`/${lang}/orders/${orderId}`)
        }, 1500)
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

  const handleReject = async () => {
    setRejecting(true)
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'cancel',
          message: message || 'Commande refusée'
        })
      })

      if (response.ok) {
        toast.success('Commande refusée')
        setTimeout(() => {
          router.push(`/${lang}/orders`)
        }, 1500)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors du refus')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    } finally {
      setRejecting(false)
    }
  }

  if (loading || !dict) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 blur-2xl opacity-20 animate-pulse rounded-full"></div>
            <Loader2 className="h-16 w-16 text-purple-600 dark:text-purple-400 animate-spin relative z-10" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chargement de la commande...</h3>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 text-center border-purple-200 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Commande non trouvée</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Cette commande n'existe pas ou vous n'avez pas accès.</p>
            <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600">
              <Link href={`/${lang}/orders`}>Voir mes commandes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const t = dict?.orders?.accept || {
    title: 'Accepter la commande',
    subtitle: 'Vous avez reçu une nouvelle commande',
    orderDetails: 'Détails de la commande',
    service: 'Service',
    buyer: 'Client',
    price: 'Prix',
    deliveryDate: 'Date de livraison estimée',
    requirements: 'Exigences du client',
    messageToBuyer: 'Message au client (optionnel)',
    messagePlaceholder: 'Dites bonjour et rassurez le client sur la qualité de votre travail...',
    acceptTerms: 'J\'accepte les conditions et m\'engage à livrer le travail dans les délais',
    acceptButton: 'Accepter la commande',
    rejectButton: 'Refuser',
    acceptConfirm: 'Accepter',
    total: 'Total',
    revision: 'révision(s) incluse(s)',
    deliveryTime: 'délai de livraison',
    memberSince: 'Membre depuis',
    completedOrders: 'commandes complétées',
    rating: 'Note',
    cancel: 'Annuler'
  }

  const deliveryDate = new Date(order.deliveryDate)
  const today = new Date()
  const daysUntilDelivery = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950/30"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/25">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
              {t.title}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-11">{t.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-purple-200 dark:border-gray-700 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Briefcase className="h-5 w-5" />
                    {t.orderDetails}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Gig Info */}
                  <div className="flex items-start gap-4">
                    {order.gig.images?.[0] && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                        <img 
                          src={order.gig.images[0]} 
                          alt={order.gig.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{order.gig.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {order.gig.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                          <Clock className="h-3 w-3 mr-1" />
                          {order.gig.deliveryTime} {t.deliveryTime}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                          <Zap className="h-3 w-3 mr-1" />
                          {order.gig.revisions} {t.revision}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-purple-200 dark:bg-gray-700" />

                  {/* Price */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t.total}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {order.price.toLocaleString()} {order.currency}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t.deliveryDate}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {deliveryDate.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      {daysUntilDelivery > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Livraison dans {daysUntilDelivery} jour{daysUntilDelivery > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Requirements */}
                  {order.requirements && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        {t.requirements}
                      </Label>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {order.requirements}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Message to Buyer */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      {t.messageToBuyer}
                    </Label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t.messagePlaceholder}
                      rows={4}
                      className="border-purple-200 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>

                  {/* Terms Acceptance */}
                  <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <label className="text-sm text-amber-800 dark:text-amber-300 cursor-pointer">
                      {t.acceptTerms}
                    </label>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleAccept}
                    disabled={accepting || !acceptTerms}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-6 text-lg"
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Acceptation...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        {t.acceptButton}
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleReject}
                    disabled={rejecting}
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    {rejecting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Refus...
                      </>
                    ) : (
                      <>
                        <X className="h-5 w-5 mr-2" />
                        {t.rejectButton}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar - Buyer Info */}
          <div className="space-y-6">
            {/* Buyer Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-purple-200 dark:border-gray-700 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <User className="h-5 w-5" />
                    {t.buyer}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16 ring-2 ring-purple-200 dark:ring-purple-800">
                      <AvatarImage src={order.buyer.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg">
                        {order.buyer.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{order.buyer.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{order.buyer.rating || 'Nouveau'}</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-purple-200 dark:bg-gray-700" />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{t.completedOrders}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{order.buyer.completedOrders || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{t.memberSince}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {order.buyer.memberSince 
                          ? new Date(order.buyer.memberSince).getFullYear()
                          : '2024'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tips Card */}
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
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">Livrez avant la date prévue si possible</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Support Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-purple-200 dark:border-gray-700 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                      <Heart className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Besoin d'aide ?</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Notre équipe est là pour vous</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full border-purple-200 dark:border-purple-800">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contacter le support
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}