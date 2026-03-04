// components/PostView.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { MessageSquare, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { PostCard } from './PostCard/PostCard'
import { CommentsSection } from './Comments/CommentsSection'
import { Post, ReactionType } from './utils/types'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

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
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [reacting, setReacting] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [userReaction, setUserReaction] = useState<ReactionType | undefined>()

  // Charger le post spécifique
  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/groups/${groupId}/posts/${postId}`)
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement du post')
        }
        
        const data = await response.json()
        setPost(data.post)
        
        // Vérifier si l'utilisateur a réagi
        if (data.userReaction) {
          setUserReaction(data.userReaction)
        }
        
        // Vérifier si le post est sauvegardé
        if (data.isSaved) {
          setIsSaved(true)
        }
      } catch (error) {
        console.error('Error fetching post:', error)
        toast.error('Erreur lors du chargement du post')
      } finally {
        setLoading(false)
      }
    }

    if (postId && groupId) {
      fetchPost()
    }
  }, [postId, groupId])

  const handleReaction = async (reaction: ReactionType) => {
    if (reacting || !isMember) return
    
    setReacting(true)
    
    try {
      const response = await fetch(`/api/groups/${groupId}/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.action === 'removed') {
          setUserReaction(undefined)
          setPost(prev => {
            if (!prev) return prev
            return {
              ...prev,
              reactionCounts: {
                ...prev.reactionCounts,
                [reaction]: Math.max(0, (prev.reactionCounts[reaction] || 0) - 1)
              }
            }
          })
        } else {
          setUserReaction(reaction)
          setPost(prev => {
            if (!prev) return prev
            return {
              ...prev,
              reactionCounts: {
                ...prev.reactionCounts,
                [reaction]: (prev.reactionCounts[reaction] || 0) + 1
              }
            }
          })
        }
      }
    } catch (error) {
      console.error('Error reacting to post:', error)
      toast.error('Erreur lors de la réaction')
    } finally {
      setReacting(false)
    }
  }

  const handleSavePost = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/posts/${postId}/save`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setIsSaved(data.action === 'saved')
        toast.success(data.action === 'saved' ? 'Post sauvegardé !' : 'Post retiré des sauvegardes')
      }
    } catch (error) {
      console.error('Error saving post:', error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleShare = async (platform?: string) => {
    const shareUrl = `${window.location.origin}/groups/${groupId}/posts/${postId}`
    
    if (platform === 'copy') {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Lien copié !')
      return
    }
    
    if (navigator.share && !platform) {
      try {
        await navigator.share({
          title: post?.title || 'Partager ce post',
          text: post?.content,
          url: shareUrl
        })
        
        await fetch(`/api/groups/${groupId}/posts/${postId}/share`, {
          method: 'POST'
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Lien copié dans le presse-papier !')
    }
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
        <h3 className="text-2xl font-bold mb-3">Post introuvable</h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
          Le post que vous cherchez n'existe pas ou a été supprimé.
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
          className="gap-2 mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour aux posts
        </Button>
      )}

      {/* Post */}
      <PostCard
        post={post}
        groupId={groupId}
        isMember={isMember}
        userRole={userRole}
        isSaved={isSaved}
        userReaction={userReaction}
        isReacting={reacting}
        onSave={handleSavePost}
        onShare={handleShare}
        onReaction={handleReaction}
        expanded={true}
      />

      {/* Section commentaires */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Commentaires
          </h3>
        </div>
        
        <div className="p-6">
          <CommentsSection 
            postId={postId}
            groupId={groupId}
            isMember={isMember}
            userId={session?.user?.id}
            userRole={userRole}
            autoScrollToNew={true}
            scrollBehavior="smooth"
          />
        </div>
      </div>
    </div>
  )
}