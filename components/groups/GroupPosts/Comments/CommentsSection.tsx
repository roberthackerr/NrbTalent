// /components/groups/GroupPosts/Comments/CommentsSection.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import { Comment } from './types'
import { CommentItem } from './CommentItem'
import { CommentForm } from './CommentForm'
import { addReplyToComment, updateCommentInTree, removeCommentFromTree } from './comment-utils'

interface CommentsSectionProps {
  postId: string
  groupId: string
  isMember: boolean
  userId?: string
  userRole?: string
  onCommentAdded?: () => void
  maxHeight?: string
  autoScrollToNew?: boolean
  scrollBehavior?: 'smooth' | 'auto'
}

export function CommentsSection({
  postId,
  groupId,
  isMember,
  userId,
  userRole,
  onCommentAdded,
  maxHeight = '500px',
  autoScrollToNew = true,
  scrollBehavior = 'smooth'
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  
  const commentsContainerRef = useRef<HTMLDivElement>(null)
  const lastCommentCountRef = useRef(0)
  const initialLoadDoneRef = useRef(false)

  // Fonction pour scroll vers un commentaire spécifique
  const scrollToComment = useCallback((commentId: string) => {
    const commentElement = document.getElementById(`comment-${commentId}`)
    if (commentElement) {
      commentElement.scrollIntoView({
        behavior: scrollBehavior,
        block: 'center'
      })
      
      // Animation de mise en évidence
      commentElement.classList.add('bg-blue-50', 'border-l-4', 'border-blue-500')
      setTimeout(() => {
        commentElement.classList.remove('bg-blue-50', 'border-l-4', 'border-blue-500')
      }, 2000)
    }
  }, [scrollBehavior])

  // Fonction pour scroll vers le bas
  const scrollToBottom = useCallback(() => {
    if (commentsContainerRef.current) {
      commentsContainerRef.current.scrollTo({
        top: commentsContainerRef.current.scrollHeight,
        behavior: scrollBehavior
      })
    }
  }, [scrollBehavior])

  // Fonction pour scroll vers le haut
  const scrollToTop = useCallback(() => {
    if (commentsContainerRef.current) {
      commentsContainerRef.current.scrollTo({
        top: 0,
        behavior: scrollBehavior
      })
    }
  }, [scrollBehavior])

  // Fonction pour gérer le scroll
  const handleScroll = useCallback(() => {
    if (!commentsContainerRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = commentsContainerRef.current
    const scrollBottom = scrollHeight - clientHeight - scrollTop
    
    setShowScrollTop(scrollTop > 200)
    setShowScrollBottom(scrollBottom > 100)
    
    // Charger plus de commentaires quand on est proche du bas
    if (scrollBottom < 100 && !loadingMore && hasMore && page > 1) {
      loadMoreComments()
    }
  }, [loadingMore, hasMore, page])

  // Effet pour l'auto-scroll
  useEffect(() => {
    if (!autoScrollToNew || !comments.length) return

    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    } else if (comments.length > lastCommentCountRef.current) {
      const newCommentCount = comments.length - lastCommentCountRef.current
      if (newCommentCount === 1) {
        const lastComment = comments[0]
        setTimeout(() => {
          scrollToComment(lastComment._id)
        }, 100)
      } else {
        setTimeout(() => {
          scrollToBottom()
        }, 100)
      }
    }
    
    lastCommentCountRef.current = comments.length
  }, [comments, autoScrollToNew, scrollToBottom, scrollToComment])

  // Ajouter l'écouteur de scroll
  useEffect(() => {
    const container = commentsContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      handleScroll() // Initial check
      
      return () => {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [handleScroll])

  const fetchComments = async (pageNum = 1) => {
    if (pageNum === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    
    try {
      const response = await fetch(
        `/api/groups/${groupId}/posts/${postId}/comments?page=${pageNum}`
      )

      if (response.ok) {
        const data = await response.json()
        
        if (pageNum === 1) {
          setComments(data.comments || [])
          initialLoadDoneRef.current = false
        } else {
          setComments(prev => [...prev, ...(data.comments || [])])
        }
        
        setHasMore(data.pagination?.hasMore || false)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMoreComments = async () => {
    if (loadingMore || !hasMore) return
    
    const nextPage = page + 1
    setPage(nextPage)
    await fetchComments(nextPage)
  }

  useEffect(() => {
    fetchComments()
  }, [])

  const handleCommentSubmit = async (content: string, parentId?: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content,
          parentId: parentId || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la publication')
      }

      const newComment = await response.json()

      if (parentId) {
        setComments(prev => addReplyToComment(prev, parentId, newComment))
        setTimeout(() => {
          scrollToComment(newComment._id)
        }, 100)
      } else {
        setComments(prev => [newComment, ...prev])
      }
      
      onCommentAdded?.()
      
    } catch (error: any) {
      console.error('Error posting comment:', error)
      alert(error.message || "Erreur lors de la publication du commentaire")
    }
  }

  const handleLike = async (commentId: string) => {
    try {
      const response = await fetch(
        `/api/groups/${groupId}/posts/${postId}/comments/${commentId}/like`,
        { method: 'POST' }
      )

      if (response.ok) {
        setComments(prev => updateCommentInTree(prev, commentId, (comment) => ({
          ...comment,
          likesCount: comment.userLiked ? comment.likesCount - 1 : comment.likesCount + 1,
          userLiked: !comment.userLiked
        })))
      }
    } catch (error) {
      console.error('Error liking comment:', error)
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      const response = await fetch(
        `/api/groups/${groupId}/posts/${postId}/comments/${commentId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        setComments(prev => removeCommentFromTree(prev, commentId))
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const handleEdit = async (commentId: string, content: string) => {
    try {
      const response = await fetch(
        `/api/groups/${groupId}/posts/${postId}/comments/${commentId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        }
      )

      if (response.ok) {
        setComments(prev => updateCommentInTree(prev, commentId, (comment) => ({
          ...comment,
          content,
          isEdited: true,
          editedAt: new Date().toISOString()
        })))
      }
    } catch (error) {
      console.error('Error editing comment:', error)
    }
  }

  if (loading && comments.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {isMember && (
        <>
          <div className="px-4">
            <CommentForm
              onSubmit={(content) => handleCommentSubmit(content)}
              placeholder="Partagez vos pensées..."
              autoFocus={false}
            />
          </div>
          <Separator className="my-4" />
        </>
      )}

      {/* Conteneur des commentaires - c'est ici que le scroll doit se faire */}
      <div 
        ref={commentsContainerRef}
        className="flex-1 overflow-y-auto px-4 custom-scrollbar"
        style={{ 
          maxHeight,
          minHeight: '0' // Important pour le flexbox
        }}
      >
        <div className="space-y-4 pb-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              groupId={groupId}
              postId={postId}
              isMember={isMember}
              userId={userId}
              userRole={userRole}
              onLike={handleLike}
              onReply={handleCommentSubmit}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onGoToComment={() => scrollToComment(comment._id)}
            />
          ))}
          
          {comments.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              Aucun commentaire pour l'instant
            </div>
          )}
        </div>

        {loadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {hasMore && !loadingMore && comments.length > 0 && (
          <div className="text-center py-4">
            <Button
              variant="outline"
              onClick={loadMoreComments}
              className="px-6"
            >
              Charger plus de commentaires
            </Button>
          </div>
        )}
      </div>

      {/* Boutons de navigation flottants */}
      <div className="absolute right-6 bottom-6 flex flex-col gap-2 z-10">
        {showScrollTop && (
          <Button
            size="icon"
            variant="secondary"
            className="h-10 w-10 rounded-full shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-sm"
            onClick={scrollToTop}
            title="Remonter en haut"
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
        )}
        
        {showScrollBottom && (
          <Button
            size="icon"
            variant="secondary"
            className="h-10 w-10 rounded-full shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-sm"
            onClick={scrollToBottom}
            title="Aller en bas"
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  )
}