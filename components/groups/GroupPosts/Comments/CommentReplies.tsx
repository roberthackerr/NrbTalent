// components/groups/GroupPosts/Comments/CommentReplies.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Loader2, MessageCircle } from 'lucide-react'
import { Comment } from './types'
import { CommentItem } from './CommentItem'
import { motion, AnimatePresence } from 'framer-motion'

interface CommentRepliesProps {
  commentId: string
  groupId: string
  postId: string
  initialReplies: Comment[]
  isMember: boolean
  userId?: string
  userRole?: string
  onLike: (commentId: string) => Promise<void>
  onReply: (content: string, parentId?: string) => Promise<void>
  onDelete?: (commentId: string) => Promise<void>
  onEdit?: (commentId: string, content: string) => Promise<void>
  onGoToComment?: () => void
  dict?: any
  lang?: string
}

export function CommentReplies({
  commentId,
  groupId,
  postId,
  initialReplies,
  isMember,
  userId,
  userRole,
  onLike,
  onReply,
  onDelete,
  onEdit,
  onGoToComment,
  dict,
  lang = 'fr'
}: CommentRepliesProps) {
  const [replies, setReplies] = useState<Comment[]>(initialReplies || [])
  const [showReplies, setShowReplies] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [allLoaded, setAllLoaded] = useState(false)

  const t = dict?.comments || {
    hideReplies: 'Masquer les réponses',
    showReplies: 'Voir les réponses',
    loadMore: 'Charger plus de réponses',
    allRepliesLoaded: 'Toutes les réponses sont affichées',
    loading: 'Chargement...',
    noReplies: 'Aucune réponse pour l\'instant',
    replies: 'réponses'
  }

  useEffect(() => {
    if (initialReplies && initialReplies.length > 0) {
      setReplies(initialReplies)
      if (initialReplies.length > 0 && !showReplies) {
        setShowReplies(true)
      }
    }
  }, [initialReplies])

  const loadMoreReplies = async () => {
    if (loading || allLoaded) return
    
    setLoading(true)
    try {
      const response = await fetch(
        `/api/groups/${groupId}/posts/${postId}/comments/${commentId}/replies?page=${page + 1}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        const newReplies = data.replies || []
        
        if (newReplies.length > 0) {
          setReplies(prev => [...prev, ...newReplies])
          setPage(prev => prev + 1)
          
          if (newReplies.length < 10) {
            setAllLoaded(true)
          }
        } else {
          setAllLoaded(true)
        }
        
        setHasMore(data.hasMore || false)
      }
    } catch (error) {
      console.error('Error loading replies:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInitialReplies = async () => {
    if (replies.length > 0 || loading) return
    
    setLoading(true)
    try {
      const response = await fetch(
        `/api/groups/${groupId}/posts/${postId}/comments/${commentId}/replies?page=1`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        const fetchedReplies = data.replies || []
        setReplies(fetchedReplies)
        setHasMore(data.hasMore || false)
        setPage(1)
        setAllLoaded(fetchedReplies.length === 0)
      }
    } catch (error) {
      console.error('Error fetching replies:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleReplies = () => {
    const newShowState = !showReplies
    setShowReplies(newShowState)
    
    if (newShowState && replies.length === 0) {
      fetchInitialReplies()
    }
  }

  const handleNewReply = async (content: string, parentId?: string) => {
    try {
      await onReply(content, parentId || commentId)
      
      if (showReplies) {
        await fetchInitialReplies()
      }
    } catch (error) {
      console.error('Error handling reply:', error)
    }
  }

  const handleDeleteReply = async (replyId: string) => {
    if (onDelete) {
      try {
        await onDelete(replyId)
        setReplies(prev => prev.filter(reply => reply._id !== replyId))
      } catch (error) {
        console.error('Error deleting reply:', error)
      }
    }
  }

  return (
    <div className="ml-8 mt-3">
      {/* Toggle Replies Button */}
      {replies.length > 0 && (
        <div className="flex items-center mb-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent"></div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleReplies}
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mx-2"
            disabled={loading}
          >
            {showReplies ? (
              <>
                <ChevronUp className="mr-1 h-3 w-3" />
                {t.hideReplies}
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-3 w-3" />
                {replies.length} {t.replies}
              </>
            )}
            {loading && <Loader2 className="ml-1 h-3 w-3 animate-spin" />}
          </Button>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gray-200 dark:via-gray-800 to-transparent"></div>
        </div>
      )}

      {/* Replies Section */}
      <AnimatePresence>
        {showReplies && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 border-l-2 border-gray-200 dark:border-gray-800 pl-4"
          >
            {replies.map((reply, index) => (
              <motion.div
                key={reply._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CommentItem
                  comment={reply}
                  groupId={groupId}
                  postId={postId}
                  isMember={isMember}
                  userId={userId}
                  userRole={userRole}
                  onLike={onLike}
                  onReply={handleNewReply}
                  onDelete={handleDeleteReply}
                  onEdit={onEdit}
                  onGoToComment={onGoToComment}
                  dict={dict}
                  lang={lang}
                />
              </motion.div>
            ))}
            
            {/* Loading State */}
            {loading && replies.length === 0 && (
              <div className="flex justify-center py-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-xl opacity-20 animate-pulse rounded-full"></div>
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400 relative z-10" />
                </div>
              </div>
            )}
            
            {/* No Replies Message */}
            {!loading && replies.length === 0 && (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 italic">
                  <MessageCircle className="h-4 w-4" />
                  {t.noReplies}
                </div>
              </div>
            )}
            
            {/* Load More Button */}
            {hasMore && !allLoaded && (
              <div className="pl-4 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMoreReplies}
                  disabled={loading}
                  className="w-full text-xs border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      {t.loading}
                    </>
                  ) : (
                    t.loadMore
                  )}
                </Button>
              </div>
            )}
            
            {/* All Loaded Indicator */}
            {allLoaded && replies.length > 5 && (
              <div className="text-center pt-2">
                <span className="text-xs text-green-600 dark:text-green-400">
                  ✓ {t.allRepliesLoaded}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Show Replies Button (when collapsed and no replies loaded) */}
      {!showReplies && initialReplies.length === 0 && commentId && (
        <Button
          variant="link"
          size="sm"
          onClick={toggleReplies}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-0 h-auto"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              {t.loading}
            </>
          ) : (
            t.showReplies
          )}
        </Button>
      )}
    </div>
  )
}