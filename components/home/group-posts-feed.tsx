// /components/home/group-posts-feed.tsx - Version corrigée
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { PostCard } from '@/components/groups/GroupPosts/PostCard/PostCard'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CommentsSection } from '@/components/groups/GroupPosts/Comments/CommentsSection'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  MessageSquare, Users, Globe, Users as UsersIcon, 
  ArrowRight, Loader2, TrendingUp as TrendingUpIcon,
  Filter, Search, Calendar, Briefcase, Heart, Bookmark, 
  Share2, Eye, Clock, MoreVertical, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'

interface Post {
  _id: string
  title?: string
  content: string
  type: 'post' | 'event' | 'job' | 'discussion' | 'poll'
  author: {
    _id: string
    name: string
    avatar?: string
    title?: string
    company?: string
    authorRole?: string
  }
  group: {
    _id: string
    name: string
    slug: string
    avatar?: string
  }
  images?: string[]
  attachments?: any[]
  tags?: string[]
  reactionCounts?: {
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
  isPinned?: boolean
  isFeatured?: boolean
  isSponsored?: boolean
  createdAt: string
  updatedAt: string
  pollData?: any
  eventData?: any
  jobData?: any
  metrics?: any
}

export function GroupPostsFeed() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'events' | 'jobs'>('all')
  const [selectedPostForComments, setSelectedPostForComments] = useState<string | null>(null)
  const [reactingPosts, setReactingPosts] = useState<Set<string>>(new Set())
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set())
  const [userReactions, setUserReactions] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalPosts: 0
  })

  const fetchPosts = useCallback(async (resetPage = true) => {
    if (!session?.user) return
    
    const currentPage = resetPage ? 1 : page
    
    setLoading(true)
    try {
      let url = `/api/group-posts/feed?page=${currentPage}&limit=10`
      
      if (activeTab !== 'all') {
        url += `&type=${activeTab === 'events' ? 'event' : 'job'}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        
        if (resetPage || currentPage === 1) {
          setPosts(data.posts || [])
        } else {
          setPosts(prev => [...prev, ...(data.posts || [])])
        }
        
        setHasMore(data.pagination?.hasMore || false)
        
        // Mettre à jour les stats
        const groupsMap = new Map()
        data.posts?.forEach((post: Post) => {
          if (post.group) {
            groupsMap.set(post.group._id, post.group)
          }
        })
        
        setStats({
          totalGroups: groupsMap.size,
          totalPosts: data.pagination?.total || 0
        })
        
      } else {
        console.error('Error fetching posts:', response.status)
        toast.error('Erreur lors du chargement des publications')
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast.error('Erreur lors du chargement des publications')
    } finally {
      setLoading(false)
    }
  }, [session, page, activeTab])

  useEffect(() => {
    fetchPosts(true)
  }, [fetchPosts, activeTab])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        // Implémentez la recherche ici si nécessaire
      } else {
        fetchPosts(true)
      }
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleReaction = async (postId: string, reaction: any) => {
    if (reactingPosts.has(postId) || !session?.user) return
    
    setReactingPosts(prev => new Set(prev).add(postId))
    
    try {
      const response = await fetch(`/api/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction })
      })

      if (response.ok) {
        const data = await response.json()
        
        setPosts(prev => prev.map(post => {
          if (post._id === postId) {
            const currentCount = post.reactionCounts?.[reaction as keyof typeof post.reactionCounts] || 0
            
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
              const previousReaction = userReactions[postId]
              setUserReactions(prev => ({
                ...prev,
                [postId]: reaction
              }))
              
              let newReactionCounts = { ...post.reactionCounts }
              
              if (previousReaction && previousReaction !== reaction) {
                const previousCount = newReactionCounts[previousReaction as keyof typeof newReactionCounts] || 0
                newReactionCounts[previousReaction as keyof typeof newReactionCounts] = Math.max(0, previousCount - 1)
              }
              
              newReactionCounts[reaction as keyof typeof newReactionCounts] = currentCount + 1
              
              return {
                ...post,
                reactionCounts: newReactionCounts
              }
            }
          }
          return post
        }))
        
        toast.success(data.action === 'added' ? 'Réaction ajoutée !' : 'Réaction retirée')
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
      const response = await fetch(`/api/posts/${postId}/save`, {
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
    const post = posts.find(p => p._id === postId)
    if (!post || !post.group) return
    
    const shareUrl = `${window.location.origin}/groups/${post.group.slug}/posts/${postId}`
    
    if (platform === 'copy') {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Lien copié !')
      return
    }
    
    if (navigator.share && !platform) {
      try {
        await navigator.share({
          title: post.title || 'Publication',
          text: post.content?.substring(0, 100),
          url: shareUrl
        })
        
        // Mettre à jour le compteur de partage
        await fetch(`/api/posts/${postId}/share`, {
          method: 'POST'
        })
        
        // Mettre à jour localement
        setPosts(prev => prev.map(p => 
          p._id === postId 
            ? { ...p, shareCount: (p.shareCount || 0) + 1 } 
            : p
        ))
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Lien copié dans le presse-papier !')
    }
  }

  const handleLoadMore = () => {
    setPage(prev => prev + 1)
    fetchPosts(false)
  }

  const handleRefresh = () => {
    setPage(1)
    fetchPosts(true)
    toast.success('Publications actualisées')
  }

  // Skeleton loader
  if (loading && posts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse overflow-hidden">
            <CardContent className="p-6">
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Non connecté
  if (!session?.user) {
    return (
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-6">
          <Users className="h-10 w-10 text-blue-600" />
        </div>
        <h3 className="text-2xl font-bold mb-3">Connectez-vous pour voir vos publications</h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Rejoignez vos groupes professionnels et découvrez les dernières discussions, événements et offres d'emploi.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="gap-3" asChild>
            <Link href="/auth/signin">
              <Users className="h-5 w-5" />
              Se connecter
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="gap-3" asChild>
            <Link href="/groups">
              <Globe className="h-5 w-5" />
              Explorer les groupes
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Aucun post
  if (posts.length === 0 && !loading) {
    return (
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
          <MessageSquare className="h-10 w-10 text-gray-600" />
        </div>
        <h3 className="text-2xl font-bold mb-3">
          {activeTab === 'all' ? 'Aucune publication' : 
           activeTab === 'events' ? 'Aucun événement' : 'Aucune offre d\'emploi'}
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {activeTab === 'all' 
            ? 'Rejoignez des groupes ou créez des publications pour commencer.'
            : activeTab === 'events'
            ? 'Aucun événement n\'a été créé dans vos groupes.'
            : 'Aucune offre d\'emploi n\'a été partagée dans vos groupes.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/groups">
              <Globe className="h-4 w-4 mr-2" />
              Explorer les groupes
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/groups/my-groups">
              <UsersIcon className="h-4 w-4 mr-2" />
              Mes groupes
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec stats */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Publications de vos groupes
          </h2>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {stats.totalGroups} groupe{stats.totalGroups > 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {stats.totalPosts} publication{stats.totalPosts > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
          >
            <Loader2 className="h-4 w-4" />
            Actualiser
          </Button>
          <Button size="sm" asChild className="gap-2">
            <Link href="/groups/my-groups">
              <ArrowRight className="h-4 w-4" />
              Mes groupes
            </Link>
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher dans les publications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={activeTab} onValueChange={(v: any) => {
          setActiveTab(v)
          setPage(1)
        }}>
          <TabsList>
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="events">Événements</TabsTrigger>
            <TabsTrigger value="jobs">Offres</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Separator />

      {/* Liste des posts */}
      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={{
              ...post,
              images: post.images || [],
              attachments: post.attachments || [],
              tags: post.tags || [],
              reactionCounts: post.reactionCounts || {
                like: 0,
                love: 0,
                insightful: 0,
                helpful: 0,
                celebrate: 0
              },
              commentCount: post.commentCount || 0,
              shareCount: post.shareCount || 0,
              saveCount: post.saveCount || 0,
              metrics: {
                engagement: post.metrics?.engagement || 0,
                reach: post.metrics?.reach || 0
              }
            }}
            groupId={post.group._id}
            isMember={true}
            userRole={post.author?.authorRole || 'member'}
            isSaved={savedPosts.has(post._id)}
            userReaction={userReactions[post._id]}
            isReacting={reactingPosts.has(post._id)}
            onSave={handleSavePost}
            onShare={handleShare}
            onReaction={handleReaction}
            onComment={() => setSelectedPostForComments(post._id)}
          />
        ))}
      </div>

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
                groupId={posts.find(p => p._id === selectedPostForComments)?.group._id || ''}
                isMember={true}
                userId={session?.user?.id}
                userRole="member"
                maxHeight="100%"
                autoScrollToNew={true}
                scrollBehavior="smooth"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bouton Voir plus */}
      {hasMore && (
        <div className="flex justify-center pt-6">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loading}
            className="gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Chargement...</span>
              </>
            ) : (
              <span>Voir plus de publications</span>
            )}
          </Button>
        </div>
      )}

      {/* Aucun résultat de recherche */}
      {posts.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun résultat</h3>
          <p className="text-gray-600">
            Aucune publication ne correspond à "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  )
}