"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { GigGallery } from "@/components/gigs/GigGallery"
import { GigPackages } from "@/components/gigs/GigPackages"
import { 
  Star, 
  Clock, 
  Shield, 
  CheckCircle, 
  MessageCircle, 
  Heart, 
  Share2, 
  ArrowLeft,
  MapPin,
  Eye,
  Zap
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function GigDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [gig, setGig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState<'basic' | 'standard' | 'premium'>('basic')
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    const fetchGig = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/gigs/${id}`)
        const data = await response.json()

        if (response.ok) {
          setGig(data.gig)
        } else {
          throw new Error(data.error || 'Gig not found')
        }
      } catch (error) {
        console.error('Error fetching gig:', error)
        toast.error("Service non trouvé")
        router.push('/gigs')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchGig()
    }
  }, [id, router])

  const handleContact = async () => {
    if (!session) {
      toast.error("Veuillez vous connecter pour contacter le vendeur")
      return
    }

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          participantIds: [gig.createdBy?._id || gig.createdBy] 
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Conversation créée!")
        router.push(`/messages/${data.conversation._id}`)
      } else {
        throw new Error('Erreur création conversation')
      }
    } catch (error) {
      toast.error("Erreur lors de la prise de contact")
    }
  }

  const handleOrder = async (packageId: string) => {
    if (!session) {
      toast.error("Veuillez vous connecter pour commander")
      return
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gigId: gig._id, 
          package: packageId,
          requirements: `Commande du package ${packageId} pour: ${gig.title}`
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Commande créée avec succès!")
        router.push(`/orders/${data.order._id}`)
      } else {
        throw new Error('Erreur création commande')
      }
    } catch (error) {
      toast.error("Erreur lors de la commande")
    }
  }

  const toggleLike = async () => {
    if (!session) {
      toast.error("Veuillez vous connecter pour ajouter aux favoris")
      return
    }

    try {
      setIsLiked(!isLiked)
      toast.success(isLiked ? "Retiré des favoris" : "Ajouté aux favoris")
    } catch (error) {
      toast.error("Erreur lors de l'action")
    }
  }

  const shareGig = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: gig.title,
          text: gig.description,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Lien copié dans le presse-papier")
    }
  }

  if (loading) {
    return <GigDetailSkeleton />
  }

  if (!gig) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Service non trouvé
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Le service que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <Button onClick={() => router.push('/gigs')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux services
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header avec navigation */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/gigs')}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux services
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={shareGig}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLike}
              >
                <Heart className={cn(
                  "h-4 w-4 mr-2",
                  isLiked && "fill-red-500 text-red-500"
                )} />
                Favoris
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne de gauche - Contenu */}
          <div className="lg:col-span-2 space-y-8">
            {/* En-tête du gig */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="outline" className={cn(
                        "text-xs font-semibold",
                        gig.status === 'active' 
                          ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      )}>
                        {gig.status === 'active' ? 'Actif' : 'En pause'}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                        <Eye className="h-4 w-4" />
                        <span>{gig.views || 0} vues</span>
                      </div>
                    </div>
                    
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                      {gig.title}
                    </h1>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {gig.rating || 'Nouveau'}
                        </span>
                        {gig.reviewsCount && (
                          <span>({gig.reviewsCount} avis)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{gig.ordersCount || 0} commandes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informations vendeur */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-700 shadow-sm">
                    <AvatarImage src={gig.seller?.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                      {gig.seller?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      {gig.seller?.name || 'Vendeur'}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Membre depuis 2024
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleContact}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contacter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Gallery */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle>Galerie</CardTitle>
              </CardHeader>
              <CardContent>
                <GigGallery images={gig.images} title={gig.title} />
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle>Description du service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {gig.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Caractéristiques */}
            {gig.features && gig.features.length > 0 && (
              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle>Ce qui est inclus</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {gig.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Avis (à implémenter) */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle>Avis clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <Star className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>Aucun avis pour le moment</p>
                  <p className="text-sm">Soyez le premier à noter ce service</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne de droite - Commande */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <GigPackages 
                gig={gig}
                selectedPackage={selectedPackage}
                onPackageSelect={setSelectedPackage}
                onOrder={handleOrder}
              />

              {/* Garanties */}
              <Card className="border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="h-5 w-5 text-green-500" />
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Garantie satisfait ou remboursé
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Vous êtes protégé par notre garantie. Si le service ne correspond pas à la description, vous serez remboursé.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function GigDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-6" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-1/2 mb-4" />
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}