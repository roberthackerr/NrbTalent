// /lib/models/group.ts
import { ObjectId } from "mongodb"

export type GroupType = 
  | 'skill'          // Groupes par compétence
  | 'location'       // Groupes géographiques
  | 'interest'       // Groupes d'intérêt
  | 'professional'   // Groupes professionnels
  | 'company'        // Groupes d'entreprise
  | 'learning'       // Groupes d'apprentissage

export type GroupVisibility = 
  | 'public'        // Visible et joignable par tous
  | 'private'       // Visible, demande d'adhésion nécessaire
  | 'hidden'        // Invisible, invitation uniquement

export type GroupRole = 
  | 'member'        // Membre de base
  | 'moderator'     // Modérateur
  | 'admin'         // Administrateur
  | 'owner'         // Propriétaire

export interface GroupRules {
  allowPosts: boolean
  allowEvents: boolean
  allowJobs: boolean
  allowFiles: boolean
  requireApproval: boolean
  maxPostsPerDay: number
  minAccountAge: number // jours
  minRating?: number
  requiredSkills?: string[]
  bannedWords?: string[]
}

export interface GroupStats {
  totalMembers: number
  activeMembers: number
  totalPosts: number
  totalEvents: number
  totalJobs: number
  engagementRate: number
  growthRate: number
}

export interface Group {
  _id?: ObjectId
  name: string
  slug: string
  description: string
  type: GroupType
  
  // Visibilité et accès
  visibility: GroupVisibility
  isVerified: boolean
  isFeatured: boolean
  
  // Propriétaire et modération
  ownerId: ObjectId
  moderators: ObjectId[]
  
  // Métadonnées
  tags: string[]
  skills: string[]           // Pour les groupes de compétences
  location?: string          // Pour les groupes géographiques
  company?: string           // Pour les groupes d'entreprise
  
  // Images
  avatar: string
  banner: string
  color: string
  
  // Configuration
  rules: GroupRules
  settings: {
    allowMemberInvites: boolean
    allowCrossPosting: boolean
    autoApproveMembers: boolean
    sendWelcomeMessage: boolean
    notifyOnNewPost: boolean
  }
  
  // Statistiques
  stats: GroupStats
  
  // Membre spécial
  featuredMembers: Array<{
    userId: ObjectId
    role: string
    featuredAt: Date
  }>
  
  // Dates
  createdAt: Date
  updatedAt: Date
  lastActivityAt: Date
  
  // Métriques
  viewCount: number
  saveCount: number
  reportCount: number
}