// /components/groups/GroupPosts/Comments/types.ts

export interface PostAuthor {
  _id: string
  name: string
  avatar?: string
  title?: string
  company?: string
  isOnline?: boolean
  isVerified?: boolean
  followers?: number
}

export interface CommentAttachment {
  url: string
  name: string
  size: number
  type: 'image' | 'video' | 'file'
  thumbnail?: string
}

export interface Comment {
  _id: string
  content: string
  author: PostAuthor
  authorRole?: 'owner' | 'admin' | 'moderator' | 'member'
  createdAt: string
  updatedAt?: string
  editedAt?: string | null
  likes: number
  likesCount: number
  userLiked: boolean
  replies: Comment[]
  repliesCount: number
  parentId?: string | null
  attachments?: CommentAttachment[]
  mentions?: string[]
  isEdited?: boolean
  isPinned?: boolean
}