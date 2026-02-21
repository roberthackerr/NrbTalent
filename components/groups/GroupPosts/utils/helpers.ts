import { fr } from 'date-fns/locale'
import { formatDistanceToNow } from 'date-fns'
import { Post, ReactionType } from './types'
import { REACTION_EMOJIS } from './constants'

export const formatDate = (dateString: string) => {
  return formatDistanceToNow(new Date(dateString), { 
    addSuffix: true,
    locale: fr 
  })
}

export const getTopReactions = (post: Post) => {
  const reactions = Object.entries(post.reactionCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
  
  return reactions.map(([type]) => REACTION_EMOJIS[type as ReactionType]).join(' ')
}

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const getFileIcon = (type: string) => {
  if (type.includes('pdf')) return '📄'
  if (type.includes('word') || type.includes('document')) return '📝'
  if (type.includes('sheet') || type.includes('excel')) return '📊'
  if (type.includes('presentation') || type.includes('powerpoint')) return '📽️'
  if (type.includes('zip') || type.includes('compressed')) return '📦'
  return '📎'
}