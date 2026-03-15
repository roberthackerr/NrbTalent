// components/PostView.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { MessageSquare, ChevronLeft, Users } from 'lucide-react'
import { toast } from 'sonner'
import { PostCard } from './PostCard/PostCard'
import { CommentsSection } from './Comments/CommentsSection'
import { Post, ReactionType } from './utils/types'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

interface PostViewProps {
  postId: string
  groupId: string
  isMember?: boolean
  userRole?: string
  onBack?: () => void
  lang?: Locale
}

export function PostView({ 
  postId, 
  groupId: initialGroupId, 
  isMember = false, 
  userRole, 
  onBack,
  lang: propLang 
}: PostViewProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  
  // Déterminer la langue (priorité: prop > params > 'fr')
  const lang = propLang || (params?.lang as Locale) || 'fr'
  
  const [dict, setDict] = useState<any>(null)
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [userReaction, setUserReaction] = useState<ReactionType | undefined>()
  const [groupName, setGroupName] = useState<string>('')
  const [groupObjectId, setGroupObjectId] = useState<string>('')
  const [resolvingGroup, setResolvingGroup] = useState(false)
  const [isReacting, setIsReacting] = useState(false)

  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  // Fonction pour obtenir l'ObjectId du groupe à partir du slug
  const getGroupObjectId = async (slug: string): Promise<string> => {
    // Si c'est déjà un ObjectId, on le garde
    if (slug.match(/^[0-9a-fA-F]{24}$/)) {
      return slug
    }
    
    setResolvingGroup(true)
    try {
      const response = await fetch(`/api/groups/slug/${slug}`)
      if (response.ok) {
        const data = await response.json()
        return data._id
      }
    } catch (error) {
      console.error('Error resolving group ObjectId:', error)
    } finally {
      setResolvingGroup(false)
    }
    return slug
  }

  // Charger le post spécifique
  useEffect(() => {
    const fetchPost = async () => {
      if (!postId || !initialGroupId || !dict) return
      
      setLoading(true)
      try {
        // ÉTAPE 1: Obtenir l'ObjectId du groupe à partir du slug
        const objectId = await getGroupObjectId(initialGroupId)
        setGroupObjectId(objectId)
        
        // ÉTAPE 2: Utiliser l'ObjectId pour l'appel API
        const response = await fetch(`/api/groups/${objectId}/posts/${postId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setPost(null)
            return
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        setPost(data)
        
        // Récupérer le nom du groupe si disponible
        if (data.group?.name) {
          setGroupName(data.group.name)
        }
        
        // Récupérer la réaction de l'utilisateur
        await fetchUserReaction(objectId)
        
        if (data.isSaved) {
          setIsSaved(true)
        }
      } catch (error) {
        console.error('Error fetching post:', error)
        toast.error(dict?.common?.error || 'Erreur lors du chargement du post')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [postId, initialGroupId, dict])

  // Fonction pour charger la réaction de l'utilisateur
  const fetchUserReaction = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/posts/${postId}/reactions`)
      if (response.ok) {
        const data = await response.json()
        setUserReaction(data.userReaction)
      }
    } catch (error) {
      console.error('Error fetching user reaction:', error)
    }
  }

  // ✅ CORRECTION ICI: Signature identique à GroupPosts (postId, reaction)
  const handleReaction = async (clickedPostId: string, reaction: ReactionType) => {
    // Vérifier que c'est le bon post
    if (clickedPostId !== postId) return
    
    if (!isMember || !groupObjectId) {
      toast.error(dict?.feed?.joinToReact || 'Rejoignez le groupe pour réagir')
      return
    }
    
    setIsReacting(true)
    
    try {
      const response = await fetch(`/api/groups/${groupObjectId}/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction })
      })

      const data = await response.json()

      if (response.ok) {
        // MISE À JOUR LOCALE (comme dans GroupPosts)
        setPost(prev => {
          if (!prev) return prev
          
          const currentCount = prev.reactionCounts[reaction] || 0
          
          if (data.action === 'removed') {
            setUserReaction(undefined)
            return {
              ...prev,
              reactionCounts: {
                ...prev.reactionCounts,
                [reaction]: Math.max(0, currentCount - 1)
              }
            }
          } else {
            setUserReaction(reaction)
            return {
              ...prev,
              reactionCounts: {
                ...prev.reactionCounts,
                [reaction]: currentCount + 1
              }
            }
          }
        })

        toast.success(
          data.action === 'removed' 
            ? (dict?.feed?.reactionRemoved || 'Réaction retirée')
            : (dict?.feed?.reactionAdded || 'Réaction ajoutée')
        )
      } else {
        toast.error(data.error || dict?.common?.error || 'Erreur lors de la réaction')
      }
    } catch (error) {
      console.error('Error reacting to post:', error)
      toast.error(dict?.common?.error || 'Erreur lors de la réaction')
    } finally {
      setIsReacting(false)
    }
  }

  // ✅ CORRECTION: handleSavePost doit accepter postId
  const handleSavePost = async (clickedPostId: string) => {
    if (clickedPostId !== postId) return
    if (!groupObjectId) return
    
    try {
      const response = await fetch(`/api/groups/${groupObjectId}/posts/${postId}/save`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setIsSaved(data.action === 'saved')
        toast.success(
          data.action === 'saved' 
            ? (dict?.feed?.saved || 'Post sauvegardé !') 
            : (dict?.feed?.unsaved || 'Post retiré des sauvegardes')
        )
      }
    } catch (error) {
      console.error('Error saving post:', error)
      toast.error(dict?.common?.error || 'Erreur lors de la sauvegarde')
    }
  }

  // ✅ CORRECTION: handleShare doit accepter postId
  const handleShare = async (clickedPostId: string, platform?: string) => {
    if (clickedPostId !== postId) return
    
    const shareUrl = `${window.location.origin}/${lang}/groups/${initialGroupId}/posts/${postId}`
    
    if (platform === 'copy') {
      await navigator.clipboard.writeText(shareUrl)
      toast.success(dict?.feed?.linkCopied || 'Lien copié !')
      return
    }
    
    if (navigator.share && !platform) {
      try {
        await navigator.share({
          title: post?.title || dict?.feed?.share || 'Partager ce post',
          text: post?.content,
          url: shareUrl
        })
        
        if (groupObjectId) {
          await fetch(`/api/groups/${groupObjectId}/posts/${postId}/share`, {
            method: 'POST'
          })
        }
        toast.success(dict?.feed?.shared || 'Post partagé !')
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      toast.success(dict?.feed?.linkCopied || 'Lien copié dans le presse-papier !')
    }
  }

  if (!dict || resolvingGroup) {
    return (
      <Card className="animate-pulse overflow-hidden">
        <CardHeader className="space-y-3">
          <Skeleton className="h-10 w-full" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-6 w-1/2" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full rounded-full" />
        </CardFooter>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="animate-pulse overflow-hidden">
        <CardHeader className="space-y-3">
          <Skeleton className="h-10 w-full" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-6 w-1/2" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full rounded-full" />
        </CardFooter>
      </Card>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full mb-6">
          <MessageSquare className="h-10 w-10 text-red-600" />
        </div>
        <h3 className="text-2xl font-bold mb-3">
          {dict?.feed?.noPosts || 'Post introuvable'}
        </h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
          {dict?.feed?.noPostsDesc || "Le post que vous cherchez n'existe pas ou a été supprimé."}
        </p>
        <Button 
          size="lg" 
          className="gap-3 px-8 py-6 rounded-xl text-lg"
          onClick={onBack || (() => router.back())}
        >
          <ChevronLeft className="h-5 w-5" />
          {dict?.common?.back || 'Retour'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Barre de navigation */}
      <div className="flex items-center justify-between gap-4">
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            {dict?.feed?.backToPosts || 'Retour aux posts'}
          </Button>
        )}
        
        <Button
          onClick={() => router.push(`/${lang}/groups/${initialGroupId}`)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          {dict?.feed?.viewGroup || 'Voir le groupe'}
        </Button>
      </div>

      {/* Post */}
      <PostCard
        post={post}
        groupId={initialGroupId}
        isMember={isMember}
        userRole={userRole}
        isSaved={isSaved}
        userReaction={userReaction}
        isReacting={isReacting}
        onSave={handleSavePost}      // ✅ Maintenant accepte (postId)
        onShare={handleShare}         // ✅ Maintenant accepte (postId, platform?)
        onReaction={handleReaction}   // ✅ Maintenant accepte (postId, reaction)
        onComment={() => {}}          // Optionnel
        expanded={true}
        dict={dict}
        lang={lang}
      />

      {/* Section commentaires */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            {dict?.feed?.comments || 'Commentaires'}
            {post.commentCount ? ` (${post.commentCount})` : ''}
          </h3>
        </div>
        
        <div className="p-6">
          {!isMember ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                {dict?.feed?.joinToComment || 'Rejoignez le groupe pour commenter'}
              </p>
              <Button 
                variant="outline" 
                onClick={() => router.push(`/${lang}/groups/${initialGroupId}`)}
              >
                <Users className="h-4 w-4 mr-2" />
                {dict?.feed?.joinGroups || 'Rejoindre le groupe'}
              </Button>
            </div>
          ) : (
            <CommentsSection 
              postId={postId}
              groupId={initialGroupId}
              isMember={isMember}
              userId={session?.user?.id}
              userRole={userRole}
              autoScrollToNew={true}
              scrollBehavior="smooth"
              lang={lang}
              dict={dict}
            />
          )}
        </div>
      </div>
    </div>
  )
}