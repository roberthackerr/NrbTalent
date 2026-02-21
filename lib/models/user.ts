import type { ObjectId } from "mongodb"

export type UserRole = "freelance" | "client"

export interface Badge {
  type: "top_rated" | "rising_talent" | "expert" | "mentor" | "team_player" | "fast_delivery" | "premium"
  earnedAt: Date
  level?: number
  expiresAt?: Date
}

export interface Availability {
  status: "available" | "busy" | "unavailable" | "away"
  hoursPerWeek?: number
  nextAvailable?: Date
  responseTime?: string
}

export interface Education {
  id: string
  school: string
  degree: string
  field: string
  startDate: Date
  endDate?: Date
  current: boolean
  description?: string
  grade?: string
}

export interface Experience {
  id: string
  company: string
  position: string
  location?: string
  startDate: Date
  endDate?: Date
  current: boolean
  description: string
  technologies: string[]
  achievement: string
}

export interface PortfolioItem {
  id: string
  title: string
  description: string
  url?: string
  image: string
  category: string
  technologies: string[]
  featured: boolean
  client?: string
  duration?: string
  budget?: number
  createdAt: Date
}

export interface Review {
  _id?: ObjectId
  projectId: ObjectId
  reviewerId: ObjectId
  reviewerName: string
  reviewerAvatar?: string
  reviewedId: ObjectId
  rating: number
  comment: string
  wouldRecommend: boolean
  strengths?: string[]
  createdAt: Date
}

export interface Certification {
  name: string
  issuer: string
  earnedAt: Date
  certificateUrl?: string
  credentialId?: string
  expiresAt?: Date
  skills: string[]
}

export interface UserPreferences {
  emailNotifications: {
    newMessages: boolean
    projectInvites: boolean
    applicationUpdates: boolean
    paymentNotifications: boolean
    newsletter: boolean
  }
  pushNotifications: {
    newMessages: boolean
    projectMatches: boolean
    deadlineReminders: boolean
  }
  privacy: {
    profileVisible: boolean
    earningsVisible: boolean
    onlineStatus: boolean
    searchVisibility: boolean
  }
  communication: {
    language: string
    timezone: string
    responseTime: string
  }
}

export interface UserStatistics {
  completedProjects: number
  successRate: number
  onTimeDelivery: number
  clientSatisfaction: number
  responseRate: number
  avgResponseTime: number // in hours
  totalHoursWorked: number
  repeatClientRate: number
  earnings: {
    total: number
    thisMonth: number
    lastMonth: number
  }
  profileViews: number
  proposalAcceptanceRate: number
}

export interface SocialLinks {
  website?: string
  linkedin?: string
  github?: string
  twitter?: string
  behance?: string
  dribbble?: string
}

export interface User {
  _id?: ObjectId
  name: string
  email: string
  password: string
  role: UserRole
  avatar?: string
  coverImage?: string
  bio?: string
  title?: string
  skills: string[]
  hourlyRate?: number
  location?: string
  timezone?: string
  languages: string[]
  phone?: string
  socialLinks?: SocialLinks
  portfolio?: PortfolioItem[]
  education?: Education[]
  experience?: Experience[]
  certifications?: Certification[]
  reviews?: Review[]
  badges?: Badge[]
  availability?: Availability
  preferences?: UserPreferences
  statistics?: UserStatistics
  enrolledCourses?: ObjectId[]
  savedProjects?: ObjectId[]
  following?: ObjectId[]
  followers?: ObjectId[]
  verified?: boolean
  emailVerified?: boolean
  phoneVerified?: boolean
  identityVerified?: boolean
  completionScore?: number
  isActive?: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  _id?: ObjectId
  clientId: ObjectId
  title: string
  description: string
  category: string
  subcategory?: string
  freelancerId:number
  budget: {
    min: number
    max: number
    type: "fixed" | "hourly"
    currency: string
  }
  skills: string[]
  deadline?: Date
  status: "draft" | "open" | "in-progress" | "completed" | "cancelled" | "paused"
  visibility: "public" | "private"
  applications: ObjectId[]
  selectedFreelanceId?: ObjectId
  contractId?: ObjectId
  milestones: {
    title: string
    amount: number
    dueDate: Date
    status: "pending" | "completed" | "paid"
  }[]
  attachments: {
    name: string
    url: string
    type: string
  }[]
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Application {
  _id?: ObjectId
  freelancerId: ObjectId
  projectId: ObjectId
  coverLetter: string
  proposedBudget: number
  estimatedDuration: string
  attachments: {
    name: string
    url: string
    type: string
  }[]
  status: "pending" | "accepted" | "rejected" | "withdrawn"
  clientViewed: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Conversation {
  _id?: ObjectId
  participants: ObjectId[]
  lastMessage: string
  lastMessageAt: Date
  unreadCount: number
  projectId?: ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  _id?: ObjectId
  conversationId: ObjectId
  senderId: ObjectId
  content: string
  type: "text" | "file" | "image" | "system"
  attachments: {
    name: string
    url: string
    type: string
    size: number
  }[]
  read: boolean
  readAt?: Date
  createdAt: Date
}

export interface Notification {
  _id?: ObjectId
  userId: ObjectId
  type: "new_application" | "application_accepted" | "application_rejected" | "new_message" | "payment_received" | "project_invite" | "milestone_completed" | "review_received" | "system_alert"
  title: string
  message: string
  data?: any
  projectId?: ObjectId
  read: boolean
  createdAt: Date
}

export interface Contract {
  _id?: ObjectId
  projectId: ObjectId
  clientId: ObjectId
  freelancerId: ObjectId
  title: string
  description: string
  terms: string
  budget: number
  type: "fixed" | "hourly"
  duration: string
  milestones: {
    title: string
    amount: number
    dueDate: Date
    status: "pending" | "completed" | "paid"
  }[]
  status: "draft" | "active" | "completed" | "cancelled" | "disputed"
  startDate: Date
  endDate?: Date
  paymentMethod: string
  createdAt: Date
  updatedAt: Date
}