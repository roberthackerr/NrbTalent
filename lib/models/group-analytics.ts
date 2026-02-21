// /lib/models/group-analytics.ts
import { ObjectId } from "mongodb"

export interface DailyStats {
  date: Date
  newMembers: number
  activeMembers: number
  newPosts: number
  newComments: number
  newEvents: number
  newJobs: number
  views: number
}

export interface MemberActivity {
  userId: ObjectId
  date: Date
  actions: {
    posts: number
    comments: number
    reactions: number
    shares: number
    events: number
  }
  timeSpent: number // en minutes
}

export interface GroupAnalytics {
  _id?: ObjectId
  groupId: ObjectId
  period: 'daily' | 'weekly' | 'monthly'
  
  // Statistiques générales
  stats: {
    totalMembers: number
    activeMembers: number
    engagementRate: number
    growthRate: number
    retentionRate: number
    avgTimeSpent: number
  }
  
  // Activité par jour
  dailyStats: DailyStats[]
  
  // Top contributeurs
  topContributors: Array<{
    userId: ObjectId
    name: string
    avatar?: string
    score: number
    posts: number
    comments: number
    reactions: number
  }>
  
  // Contenu populaire
  popularContent: Array<{
    postId: ObjectId
    title: string
    type: string
    views: number
    reactions: number
    comments: number
    shares: number
  }>
  
  // Démographie
  demographics: {
    locations: Record<string, number>
    skills: Record<string, number>
    experience: {
      beginner: number
      intermediate: number
      expert: number
    }
  }
  
  // Heures d'activité
  activityHours: Record<string, number> // heure -> activité
  
  // Référence
  referrers: Array<{
    source: string
    count: number
  }>
  
  // Date
  startDate: Date
  endDate: Date
  generatedAt: Date
}