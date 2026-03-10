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
import { GroupAccessButton } from '@/components/groups/GroupAccessButton'

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
  const [reacting, setReacting] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [userReaction, setUserReaction] = useState<ReactionType | undefined>()
  const [groupName, setGroupName] = useState<string>('')
  const [resolvedGroupId, setResolvedGroupId] = useState<string>(initialGroupId)
  const [resolvingGroup, setResolvingGroup] = useState(false)

  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  // Fonction pour résoudre le groupId (ID MongoDB → slug)
  const resolveGroupId = async (groupId: string): Promise<string> => {
    // Si c'est déjà un slug (contient des lettres et tirets, pas que des hex)
    if (!groupId.match(/^[0-9a-fA-F]{24}$/)) {
      return groupId
    }
    
    setResolvingGroup(true)
    try {
      const response = await fetch(`/api/groups/id-to-slug?groupId=${groupId}`)
      if (response.ok) {
        const data = await response.json()
        return data.slug || groupId
      }
    } catch (error) {
      console.error('Error resolving group slug:', error)
    } finally {
      setResolvingGroup(false)
    }
    return groupId
  }

  // Charger le post spécifique
  useEffect(() => {
    const fetchPost = async () => {
      if (!postId || !initialGroupId || !dict) return
      
      setLoading(true)
      try {
        // Résoudre le groupId si c'est un ID MongoDB
        const resolvedId = await resolveGroupId(initialGroupId)
        setResolvedGroupId(resolvedId)
        
        const response = await fetch(`/api/groups/${resolvedId}/posts/${postId}`)
        
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
        
        if (data.userReaction) {
          setUserReaction(data.userReaction)
        }
        
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

  const handleReaction = async (reaction: ReactionType) => {
    if (reacting || !isMember) return
    
    setReacting(true)
    
    try {
      const response = await fetch(`/api/groups/${resolvedGroupId}/posts/${postId}/reactions`, {
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
          toast.success(dict?.feed?.reactionRemoved || 'Réaction retirée')
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
          toast.success(dict?.feed?.reactionAdded || 'Réaction ajoutée')
        }
      }
    } catch (error) {
      console.error('Error reacting to post:', error)
      toast.error(dict?.common?.error || 'Erreur lors de la réaction')
    } finally {
      setReacting(false)
    }
  }

  const handleSavePost = async () => {
    try {
      const response = await fetch(`/api/groups/${resolvedGroupId}/posts/${postId}/save`, {
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

  const handleShare = async (platform?: string) => {
    const shareUrl = `${window.location.origin}/${lang}/groups/${resolvedGroupId}/posts/${postId}`
    
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
        
        await fetch(`/api/groups/${resolvedGroupId}/posts/${postId}/share`, {
          method: 'POST'
        })
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
      {/* Barre de navigation avec bouton retour et accès groupe */}
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
        
        <GroupAccessButton
          groupId={resolvedGroupId}
          groupName={groupName}
          variant="outline"
          size="sm"
          lang={lang}
          className="ml-auto"
        />
      </div>

      {/* Post */}
      <PostCard
        post={post}
        groupId={resolvedGroupId}
        isMember={isMember}
        userRole={userRole}
        isSaved={isSaved}
        userReaction={userReaction}
        isReacting={reacting}
        onSave={handleSavePost}
        onShare={handleShare}
        onReaction={handleReaction}
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
                onClick={() => router.push(`/${lang}/groups/${resolvedGroupId}/join`)}
              >
                <Users className="h-4 w-4 mr-2" />
                {dict?.feed?.joinGroups || 'Rejoindre le groupe'}
              </Button>
            </div>
          ) : (
            <CommentsSection 
              postId={postId}
              groupId={resolvedGroupId}
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