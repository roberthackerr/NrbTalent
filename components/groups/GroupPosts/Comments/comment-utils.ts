// /components/groups/GroupPosts/Comments/comment-utils.ts
import { Comment } from './types'

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

// Fonction pour trouver un commentaire par son ID dans l'arbre
export const findCommentById = (
  comments: Comment[],
  commentId: string
): Comment | null => {
  for (const comment of comments) {
    if (comment._id === commentId) {
      return comment
    }
    
    // Si le commentaire a des réponses, chercher récursivement
    if (comment.replies && comment.replies.length > 0) {
      const foundInReplies = findCommentById(comment.replies, commentId)
      if (foundInReplies) {
        return foundInReplies
      }
    }
  }
  
  return null
}

// Fonction pour trouver le chemin d'un commentaire (utile pour la navigation)
export const findCommentPath = (
  comments: Comment[],
  commentId: string,
  path: string[] = []
): string[] | null => {
  for (const comment of comments) {
    if (comment._id === commentId) {
      return [...path, comment._id]
    }
    
    if (comment.replies && comment.replies.length > 0) {
      const foundPath = findCommentPath(comment.replies, commentId, [...path, comment._id])
      if (foundPath) {
        return foundPath
      }
    }
  }
  
  return null
}

// Fonction pour obtenir le parent d'un commentaire
export const findParentComment = (
  comments: Comment[],
  commentId: string
): Comment | null => {
  for (const comment of comments) {
    // Vérifier si c'est le parent direct
    if (comment.replies?.some(reply => reply._id === commentId)) {
      return comment
    }
    
    // Chercher récursivement dans les réponses
    if (comment.replies && comment.replies.length > 0) {
      const parent = findParentComment(comment.replies, commentId)
      if (parent) {
        return parent
      }
    }
  }
  
  return null
}

// Fonction pour mettre à jour le nombre de réponses après suppression
export const updateRepliesCountAfterDeletion = (
  comments: Comment[],
  deletedCommentId: string
): Comment[] => {
  return comments.map(comment => {
    // Vérifier si ce commentaire contient la réponse supprimée
    if (comment.replies?.some(reply => reply._id === deletedCommentId)) {
      return {
        ...comment,
        repliesCount: Math.max(0, (comment.repliesCount || 0) - 1),
        replies: comment.replies.filter(reply => reply._id !== deletedCommentId)
      }
    }
    
    // Chercher récursivement dans les réponses
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateRepliesCountAfterDeletion(comment.replies, deletedCommentId)
      }
    }
    
    return comment
  })
}

// Fonction pour obtenir tous les IDs de commentaires dans un arbre
export const getAllCommentIds = (comments: Comment[]): string[] => {
  return comments.flatMap(comment => [
    comment._id,
    ...(comment.replies ? getAllCommentIds(comment.replies) : [])
  ])
}

// Fonction pour aplatir l'arbre des commentaires (utile pour le scroll)
export const flattenCommentTree = (comments: Comment[]): (Comment & { depth: number })[] => {
  const result: (Comment & { depth: number })[] = []
  
  const flatten = (comment: Comment, depth: number = 0) => {
    result.push({ ...comment, depth })
    
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach(reply => flatten(reply, depth + 1))
    }
  }
  
  comments.forEach(comment => flatten(comment))
  return result
}