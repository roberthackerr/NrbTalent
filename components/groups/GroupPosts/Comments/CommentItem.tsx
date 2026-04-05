// components/groups/GroupPosts/Comments/CommentItem.tsx
'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, MessageSquare, MoreVertical, ChevronDown, ChevronUp, Flag, Edit, Trash2, Link2 } from 'lucide-react'
import { Comment } from './types'
import { formatDate, formatRelativeTime } from './helpers'
import { CommentForm } from './CommentForm'
import { CommentReplies } from './CommentReplies'
import { ROLE_CONFIG } from './constants'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'

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
  onGoToComment?: () => void
  dict?: any
  lang?: string
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
  onGoToComment,
  dict,
  lang = 'fr'
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isHighlighted, setIsHighlighted] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  
  const t = dict?.comments || {
    reply: 'Répondre',
    edit: 'Modifier',
    delete: 'Supprimer',
    report: 'Signaler',
    goToComment: 'Aller au commentaire',
    edited: 'Modifié',
    hideReplies: 'Masquer les réponses',
    showReplies: 'Voir les réponses',
    replyTo: 'Répondre à',
    confirmDelete: 'Voulez-vous vraiment supprimer ce commentaire ?',
    replies: 'réponses',
    noReplies: 'Aucune réponse pour l\'instant',
    loadMore: 'Charger plus de réponses',
    allRepliesLoaded: 'Toutes les réponses sont affichées',
    loading: 'Chargement...'
  }

  const roleConfig = comment.authorRole ? ROLE_CONFIG[comment.authorRole] : null
  const isAuthor = userId === comment.author._id
  const canModerate = userRole === 'admin' || userRole === 'owner' || userRole === 'moderator'

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
    
    if (window.confirm(t.confirmDelete)) {
      try {
        await onDelete(comment._id)
      } catch (error) {
        console.error('Error deleting comment:', error)
      }
    }
  }

  const handleLike = async () => {
    if (!isMember || isLiking) return
    setIsLiking(true)
    try {
      await onLike(comment._id)
    } finally {
      setIsLiking(false)
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
    <motion.div 
      id={`comment-${comment._id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group transition-all duration-300 ${isHighlighted ? 'comment-highlight' : ''}`}
    >
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-white dark:ring-gray-800">
          <AvatarImage src={comment.author.avatar} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
            {comment.author.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 transition-all duration-300 ${
            isHighlighted ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500' : ''
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                  {comment.author.name}
                </span>
                
                {comment.author.isVerified && (
                  <Badge variant="outline" className="h-5 px-2 text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                    ✓ Vérifié
                  </Badge>
                )}
                
                {roleConfig && (
                  <Badge variant="outline" className={`text-xs ${roleConfig.color} dark:bg-opacity-20`}>
                    {roleConfig.icon && <span className="mr-1">{roleConfig.icon}</span>}
                    {roleConfig.label}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                {onGoToComment && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={handleGoToCommentClick}
                    title={t.goToComment}
                  >
                    <Link2 className="h-3 w-3" />
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                    <DropdownMenuItem onClick={() => setShowReplyForm(true)} className="cursor-pointer">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {t.reply}
                    </DropdownMenuItem>
                    
                    {onGoToComment && (
                      <DropdownMenuItem onClick={handleGoToCommentClick} className="cursor-pointer">
                        <Link2 className="h-4 w-4 mr-2" />
                        {t.goToComment}
                      </DropdownMenuItem>
                    )}
                    
                    {isAuthor && onEdit && (
                      <DropdownMenuItem onClick={() => setIsEditing(true)} className="cursor-pointer">
                        <Edit className="h-4 w-4 mr-2" />
                        {t.edit}
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-800" />
                    
                    <DropdownMenuItem className="cursor-pointer text-amber-600 dark:text-amber-400">
                      <Flag className="h-4 w-4 mr-2" />
                      {t.report}
                    </DropdownMenuItem>
                    
                    {(isAuthor || canModerate) && onDelete && (
                      <DropdownMenuItem 
                        onClick={handleDelete} 
                        className="cursor-pointer text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t.delete}
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
                  placeholder={t.edit}
                  onCancel={() => setIsEditing(false)}
                  autoFocus
                  dict={dict}
                  lang={lang}
                />
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words mb-2">
                  {comment.content}
                </p>
                
                {comment.isEdited && (
                  <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">
                    ✏️ {t.edited} {formatRelativeTime(comment.editedAt || comment.createdAt, lang)}
                  </div>
                )}
              </>
            )}
            
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {formatRelativeTime(comment.createdAt, lang)}
              </span>
              
              <button
                onClick={handleLike}
                disabled={!isMember || isLiking}
                className={`text-xs flex items-center gap-1 transition-colors ${
                  comment.userLiked 
                    ? 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300' 
                    : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                } ${!isMember ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <Heart className={`h-3.5 w-3.5 transition-transform ${comment.userLiked ? 'fill-current scale-110' : ''}`} />
                {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
              </button>
              
              {isMember && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-xs text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center gap-1"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  {t.reply}
                </button>
              )}
              
              {comment.repliesCount > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleReplies}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                  >
                    {showReplies ? (
                      <>
                        <ChevronUp className="h-3 w-3" />
                        {t.hideReplies}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        {t.showReplies} ({comment.repliesCount})
                      </>
                    )}
                  </button>
                  
                  {onGoToComment && comment.repliesCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      onClick={handleShowRepliesAndGo}
                      title={t.goToComment}
                    >
                      <Link2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Reply Form */}
          <AnimatePresence>
            {showReplyForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="ml-8 mt-3"
              >
                <CommentForm
                  onSubmit={handleReplySubmit}
                  placeholder={`${t.replyTo} ${comment.author.name}...`}
                  onCancel={() => setShowReplyForm(false)}
                  autoFocus
                  dict={dict}
                  lang={lang}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Replies Section */}
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
              dict={dict}
              lang={lang}
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}