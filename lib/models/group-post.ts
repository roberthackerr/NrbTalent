import { ObjectId } from "mongodb"

// /lib/models/group-post.ts
export type PostType = 
  | 'discussion'     // Discussion générale
  | 'question'       // Question
  | 'announcement'   // Annonce
  | 'event'          // Événement
  | 'job'            // Offre d'emploi
  | 'resource'       // Ressource partagée
  | 'achievement'    // Succès partagé
  | 'poll'           // Sondage

export type PostStatus = 
  | 'published'
  | 'draft'
  | 'pending'
  | 'archived'
  | 'hidden'

export interface PostPoll {
  question: string
  options: Array<{
    text: string
    votes: number
    voters: ObjectId[]
  }>
  multipleChoice: boolean
  endsAt?: Date
  totalVotes: number
}

export interface PostReaction {
  type: 'like' | 'love' | 'insightful' | 'helpful' | 'celebrate'
  userId: ObjectId
  createdAt: Date
}

export interface PostComment {
  _id?: ObjectId
  userId: ObjectId
  content: string
  mentions: ObjectId[]
  attachments?: string[]
  reactions: PostReaction[]
  isEdited: boolean
  editedAt?: Date
  replyTo?: ObjectId
  replies: PostComment[]
  createdAt: Date
  updatedAt: Date
}

export interface GroupPost {
  _id?: ObjectId
  groupId: ObjectId
  authorId: ObjectId
  type: PostType
  
  // Contenu
  title: string
  content: string
  excerpt?: string
  
  // Formatting
  tags: string[]
  mentions: ObjectId[]
  
  // Attachments
  attachments: Array<{
    type: 'image' | 'video' | 'file' | 'link'
    url: string
    thumbnail?: string
    name?: string
    size?: number
    metadata?: any
  }>
  
  // Pour les événements
  event?: {
    title: string
    description: string
    startDate: Date
    endDate: Date
    location: string
    isOnline: boolean
    meetingLink?: string
    attendees: ObjectId[]
    maxAttendees?: number
  }
  
  // Pour les offres d'emploi
  job?: {
    title: string
    company: string
    location: string
    type: 'full-time' | 'part-time' | 'contract' | 'freelance'
    salary?: {
      min: number
      max: number
      currency: string
      period: 'hour' | 'month' | 'year'
    }
    description: string
    requirements: string[]
    benefits: string[]
    applyLink?: string
    contactEmail?: string
    expiresAt?: Date
  }
  
  // Pour les sondages
  poll?: PostPoll
  
  // Interactions
  reactions: PostReaction[]
  reactionCounts: {
    like: number
    love: number
    insightful: number
    helpful: number
    celebrate: number
  }
  commentCount: number
  viewCount: number
  shareCount: number
  saveCount: number
  
  // Comments (peut être paginé séparément)
  comments?: PostComment[]
  
  // Modération
  status: PostStatus
  isPinned: boolean
  isFeatured: boolean
  moderatorNotes?: string
  
  // Dates
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}