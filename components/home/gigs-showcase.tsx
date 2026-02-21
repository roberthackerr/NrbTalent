"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, Clock, DollarSign, MapPin, Zap, Eye, MessageCircle, TrendingUp, Heart, CheckCircle, Shield } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useState } from "react"

interface GigsShowcaseProps {
  gigs: any[]
  loading: boolean
  searchQuery: string
  showCreateButton?: boolean
}

export function GigsShowcase({ gigs, loading, searchQuery, showCreateButton = true }: GigsShowcaseProps) {
  if (loading) {
    return <GigsSkeleton />
  }

  if (gigs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="h-10 w-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 text-lg">
          {searchQuery ? "Aucun service trouvé" : "Aucun service disponible"}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
          {searchQuery 
            ? "Essayez de modifier vos critères de recherche ou explorez d'autres catégories"
            : "Soyez le premier à proposer vos compétences et démarquez-vous sur la plateforme"
          }
        </p>
        {showCreateButton && (
          <Button asChild>
            <Link href="/gigs/create">
              <Zap className="h-4 w-4 mr-2" />
              Créer mon premier service
            </Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* En-tête avec statistiques */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Services Disponibles
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {gigs.length} service{gigs.length > 1 ? 's' : ''} de freelances experts • 
            <span className="text-green-600 dark:text-green-400 font-medium ml-1">
              {gigs.filter(g => g.status === 'active').length} actif{gigs.filter(g => g.status === 'active').length > 1 ? 's' : ''}
            </span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/gigs/trending">
              <TrendingUp className="h-4 w-4 mr-2" />
              Tendance
            </Link>
          </Button>
          {showCreateButton && (
            <Button asChild>
              <Link href="/gigs/create">
                <Zap className="h-4 w-4 mr-2" />
                Nouveau service
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Grid des services */}
     <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-2">
        {gigs.map((gig) => (
          <GigCard key={gig._id} gig={gig} />
        ))}
      </div>

      {/* Voir plus */}
      {gigs.length >= 12 && (
        <div className="text-center pt-4">
          <Button variant="outline" size="lg" asChild>
            <Link href="/gigs">
              Voir tous les services
              <TrendingUp className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

function GigCard({ gig }: { gig: any }) {
  const [isLiked, setIsLiked] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleContact = async () => {
    try {
      // Créer une conversation avec le vendeur
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantIds: [gig.createdBy?._id || gig.createdBy] })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Conversation créée!")
        // Rediriger vers la conversation
        window.location.href = `/messages/${data.conversation._id}`
      } else {
        throw new Error('Erreur création conversation')
      }
    } catch (error) {
      toast.error("Erreur lors de la prise de contact")
    }
  }

  const handleQuickOrder = async () => {
    try {
      // Créer une commande rapide
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gigId: gig._id, 
          package: 'basic',
          requirements: 'Je souhaite commander ce service'
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Commande créée avec succès!")
        // Rediriger vers la page de commande
        window.location.href = `/orders/${data.order._id}`
      } else {
        throw new Error('Erreur création commande')
      }
    } catch (error) {
      toast.error("Erreur lors de la commande")
    }
  }

  const toggleLike = async () => {
    try {
      // Implémentation du like
      setIsLiked(!isLiked)
      toast.success(isLiked ? "Service retiré des favoris" : "Service ajouté aux favoris")
    } catch (error) {
      toast.error("Erreur lors de l'action")
    }
  }

  return (
    <Card className="group border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden">
      {/* Image du gig */}
      <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {gig.images && gig.images.length > 0 ? (
          <>
            <img
              src={gig.images[0].url}
              alt={gig.title}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="h-8 w-8 text-slate-400 animate-pulse" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <Zap className="h-12 w-12" />
          </div>
        )}
        
        {/* Badge de statut */}
        <div className="absolute top-3 left-3">
          <Badge className={cn(
            "text-xs font-semibold",
            gig.status === 'active' 
              ? "bg-green-500 hover:bg-green-600 text-white" 
              : gig.status === 'paused'
              ? "bg-yellow-500 hover:bg-yellow-600 text-white"
              : "bg-slate-500 hover:bg-slate-600 text-white"
          )}>
            {gig.status === 'active' ? 'Actif' : gig.status === 'paused' ? 'En pause' : 'Brouillon'}
          </Badge>
        </div>

        {/* Actions rapides */}
        <div className="absolute top-3 right-3 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white"
            onClick={toggleLike}
          >
            <Heart 
              className={cn(
                "h-4 w-4 transition-colors",
                isLiked 
                  ? "fill-red-500 text-red-500" 
                  : "text-slate-600"
              )} 
            />
          </Button>
        </div>

        {/* Overlay au hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button 
            variant="secondary" 
            size="sm"
            className="bg-white/90 backdrop-blur-sm hover:bg-white"
            asChild
          >
            <Link href={`/gigs/${gig._id}`}>
              Voir les détails
            </Link>
          </Button>
        </div>
      </div>

      <CardHeader className="pb-3">
        {/* En-tête avec avatar et note */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm">
            <AvatarImage src={gig.seller?.avatar || gig.createdBy?.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
              {gig.seller?.name?.charAt(0).toUpperCase() || gig.createdBy?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">
              {gig.seller?.name || gig.createdBy?.name || 'Vendeur'}
            </h4>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {gig.rating || 'Nouveau'} {gig.reviewsCount && `(${gig.reviewsCount})`}
              </span>
            </div>
          </div>
        </div>

        {/* Titre et description */}
        <CardTitle className="text-lg leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
          <Link href={`/gigs/${gig._id}`} className="hover:underline">
            {gig.title}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm min-h-[40px]">
          {gig.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Métriques du service */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200">
            <DollarSign className="h-3 w-3 mr-1" />
            À partir de {gig.price} {gig.currency || '€'}
          </Badge>
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200">
            <Clock className="h-3 w-3 mr-1" />
            {gig.deliveryTime} jour{gig.deliveryTime > 1 ? 's' : ''}
          </Badge>
          {gig.revisions > 0 && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              {gig.revisions} révision{gig.revisions > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Catégorie et tags */}
        <div className="space-y-2">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Catégorie: <span className="font-medium text-slate-700 dark:text-slate-300">{gig.category}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {gig.tags?.slice(0, 3).map((tag: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {gig.tags && gig.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{gig.tags.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{gig.views || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            <span>{gig.ordersCount || 0}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleContact}
            className="border-slate-300 dark:border-slate-600"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Contacter
          </Button>
          <Button 
            size="sm" 
            onClick={handleQuickOrder}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Commander
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

function GigsSkeleton() {
  return (
    <div className="space-y-8">
      {/* En-tête skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Image skeleton */}
            <div className="aspect-video bg-slate-200 dark:bg-slate-700 relative">
              <Skeleton className="w-full h-full" />
            </div>

            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>

            <CardContent className="pb-3 space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-10" />
                <Skeleton className="h-5 w-14" />
              </div>
            </CardContent>

            <CardFooter className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between w-full">
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}