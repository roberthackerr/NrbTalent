// /components/groups/GroupPosts/Comments/CommentReplies.tsx
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Comment } from './types'
import { CommentItem } from './CommentItem'

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
  onGoToComment?: () => void // Nouveau prop
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
  onGoToComment
}: CommentRepliesProps) {
  const [replies, setReplies] = useState<Comment[]>(initialReplies || [])
  const [showReplies, setShowReplies] = useState(false) // Changé à false par défaut
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [allLoaded, setAllLoaded] = useState(false)

  // Synchroniser les réponses initiales
  useEffect(() => {
    if (initialReplies && initialReplies.length > 0) {
      setReplies(initialReplies)
      // Si des réponses sont fournies initialement, on les montre
      if (initialReplies.length > 0 && !showReplies) {
        setShowReplies(true)
      }
    }
  }, [initialReplies])

  // Charger plus de réponses
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
          
          // Vérifier si on a chargé toutes les réponses
          if (newReplies.length < 10) { // Suppose que l'API retourne 10 réponses par page
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

  // Charger les réponses initiales si elles ne sont pas fournies
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
    
    // Si on ouvre les réponses et qu'elles ne sont pas chargées, on les charge
    if (newShowState && replies.length === 0) {
      fetchInitialReplies()
    }
  }

  // Mettre à jour les réponses quand une nouvelle réponse est ajoutée
  const handleNewReply = async (content: string, parentId?: string) => {
    try {
      await onReply(content, parentId || commentId)
      
      // Recharger les réponses pour inclure la nouvelle
      if (showReplies) {
        await fetchInitialReplies()
      }
    } catch (error) {
      console.error('Error handling reply:', error)
    }
  }

  // Supprimer une réponse de la liste
  const handleDeleteReply = async (replyId: string) => {
    if (onDelete) {
      try {
        await onDelete(replyId)
        // Retirer la réponse de la liste locale
        setReplies(prev => prev.filter(reply => reply._id !== replyId))
      } catch (error) {
        console.error('Error deleting reply:', error)
      }
    }
  }

  return (
    <div className="ml-8 mt-3">
      {/* Bouton pour afficher/masquer les réponses */}
      {replies.length > 0 && (
        <div className="flex items-center mb-2">
          <div className="h-px flex-1 bg-gray-200"></div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleReplies}
            className="text-xs text-gray-600 hover:text-gray-800 mx-2"
            disabled={loading}
          >
            {showReplies ? (
              <>
                <ChevronUp className="mr-1 h-3 w-3" />
                Masquer les réponses
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-3 w-3" />
                {replies.length} réponse{replies.length > 1 ? 's' : ''}
              </>
            )}
            {loading && <Loader2 className="ml-1 h-3 w-3 animate-spin" />}
          </Button>
          <div className="h-px flex-1 bg-gray-200"></div>
        </div>
      )}

      {/* Section des réponses */}
      {showReplies && (
        <div className="space-y-3 border-l-2 border-gray-100 pl-4">
          {replies.map((reply) => (
            <CommentItem
              key={reply._id}
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
            />
          ))}
          
          {/* État de chargement */}
          {loading && replies.length === 0 && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
          
          {/* Message si aucune réponse */}
          {!loading && replies.length === 0 && (
            <div className="text-center text-sm text-gray-500 py-2 italic">
              Aucune réponse pour l'instant
            </div>
          )}
          
          {/* Bouton pour charger plus de réponses */}
          {hasMore && !allLoaded && (
            <div className="pl-4 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMoreReplies}
                disabled={loading}
                className="w-full text-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  'Charger plus de réponses'
                )}
              </Button>
            </div>
          )}
          
          {/* Indicateur que toutes les réponses sont chargées */}
          {allLoaded && replies.length > 5 && (
            <div className="text-center text-xs text-gray-500 pt-2">
              ✓ Toutes les réponses sont affichées
            </div>
          )}
        </div>
      )}
      
      {/* Si aucune réponse n'est chargée mais le parent a des réponses */}
      {!showReplies && initialReplies.length === 0 && commentId && (
        <Button
          variant="link"
          size="sm"
          onClick={toggleReplies}
          className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Chargement...
            </>
          ) : (
            'Voir les réponses'
          )}
        </Button>
      )}
    </div>
  )
}