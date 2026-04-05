// components/groups/GroupPosts/Comments/CommentsSection.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronUp, ChevronDown, MessageCircle, Users, Sparkles } from 'lucide-react'
import { Comment } from './types'
import { CommentItem } from './CommentItem'
import { CommentForm } from './CommentForm'
import { addReplyToComment, updateCommentInTree, removeCommentFromTree } from './comment-utils'
import { motion, AnimatePresence } from 'framer-motion'

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
  lang?: string
  dict?: any
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
  scrollBehavior = 'smooth',
  lang = 'fr',
  dict
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

  const t = dict?.feed || {
    noComments: 'Aucun commentaire pour l\'instant',
    loadMore: 'Charger plus de commentaires',
    joinToComment: 'Rejoignez le groupe pour commenter',
    joinGroups: 'Rejoindre le groupe',
    comments: 'Commentaires'
  }

  const scrollToComment = useCallback((commentId: string) => {
    const commentElement = document.getElementById(`comment-${commentId}`)
    if (commentElement) {
      commentElement.scrollIntoView({
        behavior: scrollBehavior,
        block: 'center'
      })
      
      commentElement.classList.add('bg-blue-50', 'dark:bg-blue-950/30', 'border-l-4', 'border-blue-500')
      setTimeout(() => {
        commentElement.classList.remove('bg-blue-50', 'dark:bg-blue-950/30', 'border-l-4', 'border-blue-500')
      }, 2000)
    }
  }, [scrollBehavior])

  const scrollToBottom = useCallback(() => {
    if (commentsContainerRef.current) {
      commentsContainerRef.current.scrollTo({
        top: commentsContainerRef.current.scrollHeight,
        behavior: scrollBehavior
      })
    }
  }, [scrollBehavior])

  const scrollToTop = useCallback(() => {
    if (commentsContainerRef.current) {
      commentsContainerRef.current.scrollTo({
        top: 0,
        behavior: scrollBehavior
      })
    }
  }, [scrollBehavior])

  const handleScroll = useCallback(() => {
    if (!commentsContainerRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = commentsContainerRef.current
    const scrollBottom = scrollHeight - clientHeight - scrollTop
    
    setShowScrollTop(scrollTop > 200)
    setShowScrollBottom(scrollBottom > 100)
    
    if (scrollBottom < 100 && !loadingMore && hasMore && page > 1) {
      loadMoreComments()
    }
  }, [loadingMore, hasMore, page])

  useEffect(() => {
    const container = commentsContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      handleScroll()
      
      return () => {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [handleScroll])

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
      toast.error(error.message || "Erreur lors de la publication du commentaire")
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
      <div className="flex justify-center items-center py-12">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-xl opacity-20 animate-pulse rounded-full"></div>
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 relative z-10" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full relative">
      {isMember && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4"
        >
          <CommentForm
            onSubmit={(content) => handleCommentSubmit(content)}
            placeholder={dict?.feed?.commentPlaceholder || "Partagez vos pensées..."}
            autoFocus={false}
          />
          <Separator className="my-4 bg-gray-200 dark:bg-gray-800" />
        </motion.div>
      )}

      {/* Comments Container */}
      <div 
        ref={commentsContainerRef}
        className="flex-1 overflow-y-auto px-4 custom-scrollbar"
        style={{ 
          maxHeight,
          minHeight: '0'
        }}
      >
        <div className="space-y-4 pb-4">
          <AnimatePresence mode="popLayout">
            {comments.map((comment, index) => (
              <motion.div
                key={comment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
              >
                <CommentItem
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
                  lang={lang}
                  dict={dict}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {comments.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-10 w-10 text-gray-500 dark:text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {t.noComments}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Soyez le premier à commenter
              </p>
            </motion.div>
          )}
        </div>

        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="relative">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        )}

        {hasMore && !loadingMore && comments.length > 0 && (
          <div className="text-center py-4">
            <Button
              variant="outline"
              onClick={loadMoreComments}
              className="px-6 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {t.loadMore}
            </Button>
          </div>
        )}
      </div>

      {/* Floating Navigation Buttons */}
      <AnimatePresence>
        {(showScrollTop || showScrollBottom) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute right-4 bottom-4 flex flex-col gap-2 z-10"
          >
            {showScrollTop && (
              <Button
                size="icon"
                variant="secondary"
                className="h-10 w-10 rounded-full shadow-lg hover:shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={scrollToTop}
                title="Remonter en haut"
              >
                <ChevronUp className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
            )}
            
            {showScrollBottom && (
              <Button
                size="icon"
                variant="secondary"
                className="h-10 w-10 rounded-full shadow-lg hover:shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={scrollToBottom}
                title="Aller en bas"
              >
                <ChevronDown className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}