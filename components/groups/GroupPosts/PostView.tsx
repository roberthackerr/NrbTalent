// components/PostView.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { MessageSquare, ChevronLeft, Users, ArrowLeft, MessageCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { PostCard } from './PostCard/PostCard'
import { CommentsSection } from './Comments/CommentsSection'
import { Post, ReactionType } from './utils/types'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { motion, AnimatePresence } from 'framer-motion'

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

  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  const getGroupObjectId = async (slug: string): Promise<string> => {
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

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId || !initialGroupId || !dict) return
      
      setLoading(true)
      try {
        const objectId = await getGroupObjectId(initialGroupId)
        setGroupObjectId(objectId)
        
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
        
        if (data.group?.name) {
          setGroupName(data.group.name)
        }
        
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

  const handleReaction = async (clickedPostId: string, reaction: ReactionType) => {
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
      <Card className="animate-pulse overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader className="space-y-3">
          <Skeleton className="h-10 w-full bg-gray-200 dark:bg-gray-800" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800" />
          <Skeleton className="h-40 w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
          <Skeleton className="h-6 w-1/2 bg-gray-200 dark:bg-gray-800" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full rounded-full bg-gray-200 dark:bg-gray-800" />
        </CardFooter>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="animate-pulse overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader className="space-y-3">
          <Skeleton className="h-10 w-full bg-gray-200 dark:bg-gray-800" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800" />
          <Skeleton className="h-40 w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
          <Skeleton className="h-6 w-1/2 bg-gray-200 dark:bg-gray-800" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full rounded-full bg-gray-200 dark:bg-gray-800" />
        </CardFooter>
      </Card>
    )
  }

  if (!post) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full mb-6">
          <MessageSquare className="h-12 w-12 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {dict?.feed?.noPosts || 'Post introuvable'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg">
          {dict?.feed?.noPostsDesc || "Le post que vous cherchez n'existe pas ou a été supprimé."}
        </p>
        <Button 
          size="lg" 
          className="gap-3 px-8 py-6 rounded-xl text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          onClick={onBack || (() => router.back())}
        >
          <ChevronLeft className="h-5 w-5" />
          {dict?.common?.back || 'Retour'}
        </Button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Navigation Bar */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between gap-4"
      >
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {dict?.feed?.backToPosts || 'Retour aux posts'}
          </Button>
        )}
        
        <Button
          onClick={() => router.push(`/${lang}/groups/${initialGroupId}`)}
          variant="outline"
          size="sm"
          className="gap-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Users className="h-4 w-4" />
          {dict?.feed?.viewGroup || 'Voir le groupe'}
        </Button>
      </motion.div>

      {/* Post Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <PostCard
          post={post}
          groupId={initialGroupId}
          isMember={isMember}
          userRole={userRole}
          isSaved={isSaved}
          userReaction={userReaction}
          isReacting={isReacting}
          onSave={handleSavePost}
          onShare={handleShare}
          onReaction={handleReaction}
          onComment={() => {}}
          expanded={true}
          dict={dict}
          lang={lang}
        />
      </motion.div>

      {/* Comments Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-900">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
            <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            {dict?.feed?.comments || 'Commentaires'}
            {post.commentCount ? ` (${post.commentCount})` : ''}
          </h3>
        </div>
        
        <div className="p-6">
          {!isMember ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-500 dark:text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {dict?.feed?.joinToComment || 'Rejoignez le groupe pour commenter'}
              </p>
              <Button 
                variant="outline" 
                onClick={() => router.push(`/${lang}/groups/${initialGroupId}`)}
                className="border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
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
      </motion.div>
    </div>
  )
}