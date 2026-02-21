// /components/groups/GroupPosts/Comments/utils/comment-utils.ts
import { Comment } from '../types'

// Fonction récursive pour trouver et mettre à jour un commentaire
export const updateCommentInTree = (
  comments: Comment[],
  commentId: string,
  updater: (comment: Comment) => Comment
): Comment[] => {
  return comments.map(comment => {
    if (comment._id === commentId) {
      return updater(comment)
    }
    
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateCommentInTree(comment.replies, commentId, updater)
      }
    }
    
    return comment
  })
}

// Fonction pour ajouter une réponse à un commentaire
export const addReplyToComment = (
  comments: Comment[],
  parentId: string,
  newReply: Comment
): Comment[] => {
  return comments.map(comment => {
    if (comment._id === parentId) {
      return {
        ...comment,
        replies: [...(comment.replies || []), newReply],
        repliesCount: (comment.repliesCount || 0) + 1
      }
    }
    
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: addReplyToComment(comment.replies, parentId, newReply)
      }
    }
    
    return comment
  })
}

// Fonction pour supprimer un commentaire
export const removeCommentFromTree = (
  comments: Comment[],
  commentId: string
): Comment[] => {
  return comments
    .map(comment => {
      if (comment._id === commentId) {
        return null
      }
      
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: removeCommentFromTree(comment.replies, commentId)
        }
      }
      
      return comment
    })
    .filter(Boolean) as Comment[]
}

// Fonction pour formater les données du commentaire
export const formatCommentResponse = (comment: any): Comment => {
  return {
    _id: comment._id?.toString() || '',
    content: comment.content || '',
    author: {
      _id: comment.author?._id?.toString() || comment.userId?.toString() || '',
      name: comment.author?.name || 'Utilisateur',
      avatar: comment.author?.avatar || '',
      title: comment.author?.title || '',
      company: comment.author?.company || '',
      isVerified: comment.author?.isVerified || false
    },
    authorRole: comment.authorRole || 'member',
    createdAt: comment.createdAt || new Date().toISOString(),
    updatedAt: comment.updatedAt || new Date().toISOString(),
    likes: comment.likes || comment.likesCount || 0,
    likesCount: comment.likesCount || comment.likes || 0,
    userLiked: comment.userLiked || false,
    replies: comment.replies || [],
    repliesCount: comment.repliesCount || 0,
    parentId: comment.parentId || null,
    attachments: comment.attachments || [],
    mentions: comment.mentions || [],
    isEdited: comment.isEdited || false,
    editedAt: comment.editedAt || null,
    isPinned: comment.isPinned || false
  }
}