'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { MessageSquare, Calendar, Briefcase, Star, BookmarkCheck, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { PostCard } from './PostCard/PostCard'
import { CommentsSection } from './Comments/CommentsSection'
import { Post, GroupPostsProps, ActiveTab, ReactionType } from './utils/types'
import { useSession } from 'next-auth/react'

export function GroupPosts({ groupId, isMember, userRole }: GroupPostsProps) {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>('all')
  const [selectedPostForComments, setSelectedPostForComments] = useState<string | null>(null)
  const [reactingPosts, setReactingPosts] = useState<Set<string>>(new Set())
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set())
  const [userReactions, setUserReactions] = useState<Record<string, ReactionType>>({})

  const fetchPosts = useCallback(async (tab = activeTab) => {
    if (!groupId) return
    
    setLoading(true)
    try {
      let url = `/api/groups/${groupId}/posts?page=${page}&limit=10`
      
      switch (tab) {
        case 'featured':
          url += '&featured=true'
          break
        case 'pinned':
          url += '&pinned=true'
          break
        case 'events':
          url += '&type=event'
          break
        case 'jobs':
          url += '&type=job'
          break
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des posts')
      }
      
      const data = await response.json()
      
      if (page === 1) {
        setPosts(data.posts || [])
      } else {
        setPosts(prev => [...prev, ...(data.posts || [])])
      }
      
      setHasMore(data.pagination?.page < data.pagination?.pages)
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast.error('Erreur lors du chargement des posts')
    } finally {
      setLoading(false)
    }
  }, [groupId, page, activeTab])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts, activeTab])

  const handleReaction = async (postId: string, reaction: ReactionType) => {
    if (reactingPosts.has(postId) || !isMember) return
    
    setReactingPosts(prev => new Set(prev).add(postId))
    
    try {
      const response = await fetch(`/api/groups/${groupId}/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction })
      })

      if (response.ok) {
        const data = await response.json()
        
        setPosts(prev => prev.map(post => {
          if (post._id === postId) {
            const currentCount = post.reactionCounts[reaction] || 0
            
            if (data.action === 'removed') {
              setUserReactions(prev => {
                const newReactions = { ...prev }
                delete newReactions[postId]
                return newReactions
              })
              return {
                ...post,
                reactionCounts: {
                  ...post.reactionCounts,
                  [reaction]: Math.max(0, currentCount - 1)
                }
              }
            } else {
              setUserReactions(prev => ({
                ...prev,
                [postId]: reaction
              }))
              return {
                ...post,
                reactionCounts: {
                  ...post.reactionCounts,
                  [reaction]: currentCount + 1
                }
              }
            }
          }
          return post
        }))
      }
    } catch (error) {
      console.error('Error reacting to post:', error)
      toast.error('Erreur lors de la réaction')
    } finally {
      setReactingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const handleSavePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/posts/${postId}/save`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.action === 'saved') {
          setSavedPosts(prev => new Set(prev).add(postId))
          toast.success('Post sauvegardé !')
        } else {
          setSavedPosts(prev => {
            const newSet = new Set(prev)
            newSet.delete(postId)
            return newSet
          })
          toast.success('Post retiré des sauvegardes')
        }
      }
    } catch (error) {
      console.error('Error saving post:', error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleShare = async (postId: string, platform?: string) => {
    const shareUrl = `${window.location.origin}/groups/${groupId}/posts/${postId}`
    
    if (platform === 'copy') {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Lien copié !')
      return
    }
    
    if (navigator.share && !platform) {
      try {
        await navigator.share({
          title: 'Partager ce post',
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

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse overflow-hidden">
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
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs de filtrage */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4">
        <Tabs value={activeTab} onValueChange={(v: any) => { 
          setActiveTab(v); 
          setPage(1) 
        }}>
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="all">
              <MessageSquare className="h-4 w-4 mr-2" />
              Tous
            </TabsTrigger>
            <TabsTrigger value="featured">
              <Star className="h-4 w-4 mr-2" />
              En vedette
            </TabsTrigger>
            <TabsTrigger value="pinned">
              <BookmarkCheck className="h-4 w-4 mr-2" />
              Épinglés
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="h-4 w-4 mr-2" />
              Événements
            </TabsTrigger>
            <TabsTrigger value="jobs">
              <Briefcase className="h-4 w-4 mr-2" />
              Emplois
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Posts */}
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          groupId={groupId}
          isMember={isMember}
          userRole={userRole}
          isSaved={savedPosts.has(post._id)}
          userReaction={userReactions[post._id]}
          isReacting={reactingPosts.has(post._id)}
          onSave={handleSavePost}
          onShare={handleShare}
          onReaction={handleReaction}
          onComment={() => setSelectedPostForComments(post._id)}
        />
      ))}

      {/* Dialog pour les commentaires */}
<Dialog open={!!selectedPostForComments} onOpenChange={(open) => !open && setSelectedPostForComments(null)}>
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden p-0">
    <DialogHeader className="px-6 pt-6 pb-4">
      <DialogTitle>Commentaires</DialogTitle>
    </DialogHeader>
    
    {selectedPostForComments && (
      <div className="overflow-hidden flex flex-col" style={{ maxHeight: 'calc(80vh - 100px)' }}>
        <CommentsSection 
          postId={selectedPostForComments}
          groupId={groupId}
          isMember={isMember}
          userId={session?.user?.id}
          userRole={userRole}
          maxHeight="100%"
          autoScrollToNew={true}
          scrollBehavior="smooth"
        />
      </div>
    )}
  </DialogContent>
</Dialog>

      {/* Pagination */}
      {hasMore && (
        <div className="flex justify-center pt-6">
          <Button
            variant="outline"
            onClick={() => setPage(prev => prev + 1)}
            disabled={loading}
            className="gap-3 px-8 py-6 rounded-xl border-2 hover:border-primary"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Chargement...</span>
              </>
            ) : (
              <>
                <span>Voir plus de posts</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {posts.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-6">
            <MessageSquare className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Aucun post pour l'instant</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
            {isMember 
              ? 'Soyez le premier à partager quelque chose dans ce groupe !'
              : 'Rejoignez le groupe pour voir les posts et participer.'}
          </p>
          {isMember && (
            <Button size="lg" className="gap-3 px-8 py-6 rounded-xl text-lg">
              <MessageSquare className="h-5 w-5" />
              Créer le premier post
            </Button>
          )}
        </div>
      )}
    </div>
  )
}