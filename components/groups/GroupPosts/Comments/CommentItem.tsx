// /components/groups/GroupPosts/Comments/CommentItem.tsx
import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, MessageSquare, MoreVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { Comment } from './types'
import { formatDate, formatRelativeTime } from './helpers'
import { CommentForm } from './CommentForm'
import { CommentReplies } from './CommentReplies'
import { ROLE_CONFIG } from './constants'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface CommentItemProps {
  comment: Comment
  groupId: string
  postId: string
  isMember: boolean
  userId?: string
  userRole?: string
  onLike: (commentId: string) => Promise<void>
  onReply: (content: string, parentId?: string) => Promise<void>
  onDelete?: (commentId: string) => Promise<void>
  onEdit?: (commentId: string, content: string) => Promise<void>
  onGoToComment?: () => void // Nouveau prop
}

export function CommentItem({
  comment,
  groupId,
  postId,
  isMember,
  userId,
  userRole,
  onLike,
  onReply,
  onDelete,
  onEdit,
  onGoToComment
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showReplies, setShowReplies] = useState(false) // Changé à false par défaut
  const [isEditing, setIsEditing] = useState(false)
  const [isHighlighted, setIsHighlighted] = useState(false)
  
  const roleConfig = comment.authorRole ? ROLE_CONFIG[comment.authorRole] : null
  const isAuthor = userId === comment.author._id
  const canModerate = userRole === 'admin' || userRole === 'owner' || userRole === 'moderator'

  // Effet pour gérer la mise en évidence quand on navigue vers un commentaire
  useEffect(() => {
    if (isHighlighted) {
      const timer = setTimeout(() => setIsHighlighted(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isHighlighted])

  const handleReplySubmit = async (content: string) => {
    try {
      await onReply(content, comment._id)
      setShowReplyForm(false)
      // Ne pas ouvrir automatiquement les réponses
    } catch (error) {
      console.error('Error submitting reply:', error)
    }
  }

  const handleEditSubmit = async (content: string) => {
    try {
      if (onEdit) {
        await onEdit(comment._id, content)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error editing comment:', error)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    
    if (window.confirm('Voulez-vous vraiment supprimer ce commentaire ?')) {
      try {
        await onDelete(comment._id)
      } catch (error) {
        console.error('Error deleting comment:', error)
      }
    }
  }

  const toggleReplies = () => {
    setShowReplies(!showReplies)
  }

  const handleGoToCommentClick = () => {
    if (onGoToComment) {
      onGoToComment()
      setIsHighlighted(true)
    }
  }

  const handleShowRepliesAndGo = () => {
    if (!showReplies) {
      setShowReplies(true)
    }
    if (onGoToComment) {
      setTimeout(() => {
        onGoToComment()
        setIsHighlighted(true)
      }, 100)
    }
  }

  return (
    <div 
      id={`comment-${comment._id}`}
      className={`group transition-all duration-300 ${isHighlighted ? 'comment-highlight' : ''}`}
    >
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.author.avatar} />
          <AvatarFallback>
            {comment.author.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className={`bg-gray-50 rounded-xl px-4 py-3 transition-colors duration-300 ${
            isHighlighted ? 'bg-blue-50 border-l-4 border-blue-500' : ''
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">
                  {comment.author.name}
                </span>
                
                {comment.author.isVerified && (
                  <Badge variant="outline" className="h-5 px-2 text-xs">
                    ✓
                  </Badge>
                )}
                
                {roleConfig && (
                  <Badge variant="outline" className={`text-xs ${roleConfig.color}`}>
                    {roleConfig.label}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                {/* Bouton pour naviguer vers ce commentaire */}
                {onGoToComment && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleGoToCommentClick}
                    title="Aller à ce commentaire"
                  >
                    <span className="text-xs">📍</span>
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowReplyForm(true)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Répondre
                    </DropdownMenuItem>
                    
                    {onGoToComment && (
                      <DropdownMenuItem onClick={handleGoToCommentClick}>
                        <span className="mr-2">📍</span>
                        Aller au commentaire
                      </DropdownMenuItem>
                    )}
                    
                    {isAuthor && onEdit && (
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <span className="mr-2">✏️</span>
                        Modifier
                      </DropdownMenuItem>
                    )}
                    
                    {(isAuthor || canModerate) && onDelete && (
                      <DropdownMenuItem 
                        onClick={handleDelete} 
                        className="text-red-600"
                      >
                        <span className="mr-2">🗑️</span>
                        Supprimer
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {isEditing ? (
              <div className="mb-3">
                <CommentForm
                  onSubmit={handleEditSubmit}
                  initialValue={comment.content}
                  placeholder="Modifier votre commentaire..."
                  onCancel={() => setIsEditing(false)}
                  autoFocus
                />
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words mb-2">
                  {comment.content}
                </p>
                
                {comment.isEdited && (
                  <div className="text-xs text-gray-500 mb-1">
                    ✏️ Modifié {formatRelativeTime(comment.editedAt || comment.createdAt)}
                  </div>
                )}
              </>
            )}
            
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-gray-500">
                {formatRelativeTime(comment.createdAt)}
              </span>
              
              <button
                onClick={() => onLike(comment._id)}
                disabled={!isMember}
                className={`text-xs flex items-center gap-1 transition-colors ${
                  comment.userLiked 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-gray-500 hover:text-gray-700'
                } ${!isMember ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Heart className={`h-3.5 w-3.5 ${comment.userLiked ? 'fill-current' : ''}`} />
                {comment.likesCount > 0 ? comment.likesCount : ''}
              </button>
              
              {isMember && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5 inline mr-1" />
                  Répondre
                </button>
              )}
              
              {comment.repliesCount > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleReplies}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                  >
                    {showReplies ? (
                      <>
                        <ChevronUp className="h-3 w-3" />
                        Masquer les réponses
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        Voir {comment.repliesCount} réponse{comment.repliesCount > 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                  
                  {/* Bouton pour voir les réponses ET aller au commentaire */}
                  {onGoToComment && comment.repliesCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-1"
                      onClick={handleShowRepliesAndGo}
                      title="Voir les réponses et aller au commentaire"
                    >
                      <span className="text-xs">↗️</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Formulaire de réponse */}
          {showReplyForm && (
            <div className="ml-8 mt-3">
              <CommentForm
                onSubmit={handleReplySubmit}
                placeholder={`Répondre à ${comment.author.name}...`}
                onCancel={() => setShowReplyForm(false)}
                autoFocus
              />
            </div>
          )}
          
          {/* Section des réplies */}
          {showReplies && comment.repliesCount > 0 && (
            <CommentReplies
              commentId={comment._id}
              groupId={groupId}
              postId={postId}
              initialReplies={comment.replies || []}
              isMember={isMember}
              userId={userId}
              userRole={userRole}
              onLike={onLike}
              onReply={onReply}
              onDelete={onDelete}
              onEdit={onEdit}
              onGoToComment={onGoToComment}
            />
          )}
        </div>
      </div>
    </div>
  )
}