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

export interface PostAttachment {
  url: string
  name: string
  size: number
  type: string
  thumbnail?: string
}

export interface Post {
  _id: string
  title: string
  content: string
  type: 'discussion' | 'question' | 'event' | 'job' | 'announcement' | 'poll'
  images?: string[]
  videos?: string[]
  attachments?: PostAttachment[]
  author: PostAuthor
  authorRole?: 'owner' | 'admin' | 'moderator' | 'member'
  createdAt: string
  updatedAt?: string
  reactionCounts: {
    like: number
    love: number
    insightful: number
    helpful: number
    celebrate: number
  }
  userReactions?: {
    [key: string]: string[]
  }
  commentCount: number
  viewCount: number
  shareCount: number
  saveCount: number
  tags: string[]
  isPinned?: boolean
  isFeatured?: boolean
  isSponsored?: boolean
  status: 'published' | 'draft' | 'archived'
  pollData?: PollData
  eventData?: EventData
  jobData?: JobData
  metrics?: PostMetrics
}

export interface PollData {
  question: string
  options: PollOption[]
  totalVotes: number
  endsAt?: string
  multipleChoice: boolean
  voted?: boolean
}

export interface PollOption {
  id: string
  text: string
  votes: number
  percentage: number
  voted: boolean
}

export interface EventData {
  startDate: string
  endDate?: string
  location: string
  venue?: string
  isOnline: boolean
  attendees: number
  maxAttendees?: number
}

export interface JobData {
  company: string
  location: string
  salary: string
  type: 'full-time' | 'part-time' | 'contract' | 'internship'
  experience: string
  remote: boolean
  applyLink: string
}

export interface PostMetrics {
  engagementRate: number
  reach: number
  impressions: number
}

export interface Comment {
  _id: string
  content: string
  author: PostAuthor
  authorRole?: string
  createdAt: string
  updatedAt?: string
  likes: number
  replies: Comment[]
  repliesCount: number
  userLiked: boolean
  parentId?: string
  attachments?: CommentAttachment[]
  mentions?: string[]
  isEdited?: boolean
  editedAt?: string
  isPinned?: boolean
}

export interface CommentAttachment {
  url: string
  type: 'image' | 'video' | 'file'
  name?: string
  size?: number
  thumbnail?: string
}

export interface GroupPostsProps {
  groupId: string
  isMember: boolean
  userRole?: 'owner' | 'admin' | 'moderator' | 'member'
}

export type ReactionType = 'like' | 'love' | 'insightful' | 'helpful' | 'celebrate'
export type ActiveTab = 'all' | 'featured' | 'pinned' | 'events' | 'jobs'