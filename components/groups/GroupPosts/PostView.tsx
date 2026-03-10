// components/PostView.tsx (version corrigée)
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { MessageSquare, ChevronLeft, Heart, Eye, Bookmark } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

// Interface adaptée au format réel de l'API
interface PostData {
  _id: string
  type: string
  title?: string
  content?: string
  images?: string[]
  attachments?: any[]
  tags?: string[]
  reactionCounts: {
    like: number
    love: number
    insightful: number
    helpful: number
    celebrate: number
  }
  commentCount: number
  viewCount: number
  shareCount: number
  saveCount: number
  isPinned: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  author: {
    _id: string
    name: string
    avatar?: string
  }
  authorRole: string
  groupId: string
  authorId: string
}

interface PostViewProps {
  postId: string
  groupId: string
  isMember?: boolean
  userRole?: string
  onBack?: () => void
}

export function PostView({ postId, groupId, isMember = false, userRole, onBack }: PostViewProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [post, setPost] = useState<PostData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likesCount, setLikesCount] = useState(0)

  // Charger le post spécifique
  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true)
      setError(null)
      try {
        console.log('Fetching post:', { postId, groupId })
        const response = await fetch(`/api/groups/${groupId}/posts/${postId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Post non trouvé')
          }
          throw new Error('Erreur lors du chargement du post')
        }
        
        const data = await response.json()
        console.log('Post data received:', data)
        
        // Si l'API renvoie directement le post (pas de wrapper)
        setPost(data)
        setLikesCount(data.reactionCounts?.like || 0)
        
        // Vérifier si l'utilisateur a déjà liké (à implémenter avec une API dédiée)
        // Pour l'instant, on peut vérifier dans le localStorage ou faire une requête séparée
        const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}')
        if (likedPosts[postId]) {
          setLiked(true)
        }
        
      } catch (error) {
        console.error('Error fetching post:', error)
        setError(error instanceof Error ? error.message : 'Erreur de chargement')
        toast.error('Erreur lors du chargement du post')
      } finally {
        setLoading(false)
      }
    }

    if (postId && groupId) {
      fetchPost()
    }
  }, [postId, groupId])

  const handleLike = async () => {
    if (!isMember) {
      toast.error('Vous devez être membre pour réagir')
      return
    }

    try {
      const newLikedState = !liked
      setLiked(newLikedState)
      setLikesCount(prev => newLikedState ? prev + 1 : prev - 1)

      // Appel API pour liker/unliker
      const response = await fetch(`/api/groups/${groupId}/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reaction: 'like',
          action: newLikedState ? 'add' : 'remove'
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la réaction')
      }

      // Sauvegarder dans localStorage
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}')
      if (newLikedState) {
        likedPosts[postId] = true
      } else {
        delete likedPosts[postId]
      }
      localStorage.setItem('likedPosts', JSON.stringify(likedPosts))

    } catch (error) {
      // Revert en cas d'erreur
      setLiked(!liked)
      setLikesCount(prev => liked ? prev + 1 : prev - 1)
      toast.error('Erreur lors de la réaction')
    }
  }

  const handleSave = async () => {
    try {
      const newSavedState = !saved
      setSaved(newSavedState)

      const response = await fetch(`/api/groups/${groupId}/posts/${postId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: newSavedState ? 'save' : 'unsave' })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde')
      }

      toast.success(newSavedState ? 'Post sauvegardé !' : 'Post retiré des sauvegardes')

    } catch (error) {
      setSaved(!saved)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: fr 
      })
    } catch {
      return 'Date inconnue'
    }
  }

  if (loading) {
    return (
      <Card className="animate-pulse overflow-hidden">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    )
  }

  if (error || !post) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full mb-6">
          <MessageSquare className="h-10 w-10 text-red-600" />
        </div>
        <h3 className="text-2xl font-bold mb-3">Post introuvable</h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
          {error || "Le post que vous cherchez n'existe pas ou a été supprimé."}
        </p>
        <Button 
          size="lg" 
          className="gap-3 px-8 py-6 rounded-xl text-lg"
          onClick={onBack || (() => router.back())}
        >
          <ChevronLeft className="h-5 w-5" />
          Retour
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Bouton retour */}
      {onBack && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="gap-2 mb-4 hover:bg-gray-100"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour aux posts
        </Button>
      )}

      {/* Post */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 border-2 border-white shadow-md">
              <AvatarImage src={post.author?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {post.author?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-lg truncate">
                {post.author?.name || 'Utilisateur'}
              </h4>
              <p className="text-sm text-gray-500">
                {formatDate(post.createdAt)}
              </p>
            </div>
            {post.type && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {post.type === 'discussion' ? 'Discussion' : post.type}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {post.title && (
            <h2 className="text-2xl font-bold text-gray-900">
              {post.title}
            </h2>
          )}
          
          {post.content && (
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
              {post.content}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 pt-4 border-t">
            <div className="flex items-center gap-2 text-gray-500">
              <Eye className="h-4 w-4" />
              <span className="text-sm">{post.viewCount || 0} vues</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">{post.commentCount || 0} commentaires</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t bg-gray-50 p-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={!isMember}
                className={`gap-2 ${liked ? 'text-red-600' : 'text-gray-600'}`}
              >
                <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
                <span>{likesCount}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-gray-600"
              >
                <MessageSquare className="h-5 w-5" />
                <span>Commenter</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className={`gap-2 ${saved ? 'text-blue-600' : 'text-gray-600'}`}
            >
              <Bookmark className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
              <span>{saved ? 'Sauvegardé' : 'Sauvegarder'}</span>
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Section commentaires (simplifiée pour l'instant) */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Commentaires ({post.commentCount || 0})
          </h3>
        </CardHeader>
        
        <CardContent className="p-6">
          {!isMember ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                Vous devez être membre du groupe pour commenter
              </p>
              <Button variant="outline" onClick={() => router.push(`/groups/${groupId}/join`)}>
                Rejoindre le groupe
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Formulaire de commentaire simplifié */}
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{session?.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <textarea
                    placeholder="Écrire un commentaire..."
                    className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <Button size="sm">Publier</Button>
                  </div>
                </div>
              </div>

              {/* Message si pas de commentaires */}
              {post.commentCount === 0 && (
                <p className="text-center text-gray-500 py-8">
                  Aucun commentaire pour le moment. Soyez le premier à commenter !
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}