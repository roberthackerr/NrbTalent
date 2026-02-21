import { ObjectId } from "mongodb"
import { GroupRole } from "./group"

// /lib/models/group-member.ts
export interface GroupMember {
  _id?: ObjectId
  groupId: ObjectId
  userId: ObjectId
  
  role: GroupRole
  status: 'active' | 'pending' | 'banned' | 'muted'
  
  // Permissions spécifiques
  permissions: {
    canPost: boolean
    canComment: boolean
    canInvite: boolean
    canModerate: boolean
    canDeleteOwnPosts: boolean
    canCreateEvents: boolean
    canPostJobs: boolean
  }
  
  // Métriques de participation
  activity: {
    postCount: number
    commentCount: number
    eventCount: number
    jobCount: number
    lastActive: Date
    joinDate: Date
  }
  
  // Préférences de notification
  notifications: {
    newPosts: boolean
    newEvents: boolean
    newJobs: boolean
    mentions: boolean
    dailyDigest: boolean
    weeklySummary: boolean
  }
  
  // Sanctions
  sanctions?: Array<{
    type: 'warning' | 'mute' | 'ban'
    reason: string
    duration?: number // heures
    moderatorId: ObjectId
    createdAt: Date
    expiresAt?: Date
  }>
  
  // Contribution
  badges: string[]
  reputation: number
  
  // Dates
  joinedAt: Date
  updatedAt: Date
}