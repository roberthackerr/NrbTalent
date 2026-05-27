// lib/models/user.ts

// ============================================
// USER MODEL - MongoDB Collection Structure
// ============================================

import { ObjectId } from "mongodb"

// ============================================
// ENUMS & TYPES
// ============================================

/**
 * User role enumeration
 * - freelance: Can receive job offers and complete projects
 * - client: Can post projects and hire freelancers
 * - admin: Has full platform access
 */
export type UserRole = "freelance" | "client" | "admin"

/**
 * Skill proficiency levels
 */
export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert"

/**
 * User availability status
 */
export type AvailabilityStatus = "available" | "busy" | "unavailable"

// ============================================
// SKILL INTERFACE
// ============================================

/**
 * Skill object structure
 * Embedded in User document
 */
export interface Skill {
  /** Unique skill identifier */
  id: string
  /** Skill name (e.g., "React", "TypeScript") */
  name: string
  /** Skill category (e.g., "Web Development", "Mobile") */
  category: string
  /** Proficiency level */
  level: SkillLevel
  /** Years of experience with this skill */
  yearsOfExperience: number
  /** Whether this skill is featured on profile */
  featured: boolean
}

// ============================================
// PORTFOLIO INTERFACE
// ============================================

/**
 * Portfolio project structure
 * Embedded in User document
 */
export interface Portfolio {
  /** Unique project identifier */
  id: string
  /** Project title */
  title: string
  /** Project description */
  description: string
  /** Project image URL */
  image: string
  /** Optional project URL (live demo, GitHub, etc.) */
  url?: string
  /** Technologies used in the project */
  technologies: string[]
  /** Project category */
  category: string
  /** Whether this project is featured */
  featured: boolean
  /** Creation timestamp */
  createdAt: Date
  /** Last update timestamp */
  updatedAt?: Date
}

// ============================================
// EXPERIENCE INTERFACE
// ============================================

/**
 * Work experience structure
 * Embedded in User document
 */
export interface Experience {
  /** Unique experience identifier */
  id: string
  /** Company name */
  company: string
  /** Job position */
  position: string
  /** Work location (city, country) */
  location?: string
  /** Start date (YYYY-MM format) */
  startDate: string
  /** End date (YYYY-MM format) - undefined if current position */
  endDate?: string
  /** Whether this is the current position */
  current: boolean
  /** Job description */
  description: string
  /** Technologies used in this position */
  technologies: string[]
  /** Key achievement or accomplishment */
  achievement: string
  /** Creation timestamp */
  createdAt?: Date
  /** Last update timestamp */
  updatedAt?: Date
}

// ============================================
// EDUCATION INTERFACE
// ============================================

/**
 * Education structure
 * Embedded in User document
 */
export interface Education {
  /** Unique education identifier */
  id: string
  /** Institution name */
  institution: string
  /** Degree obtained */
  degree: string
  /** Field of study */
  fieldOfStudy: string
  /** Start date */
  startDate: string
  /** End date */
  endDate?: string
  /** Whether currently studying */
  current: boolean
  /** Description */
  description?: string
  /** Creation timestamp */
  createdAt?: Date
}

// ============================================
// SOCIAL LINKS INTERFACE
// ============================================

/**
 * Social media links structure
 */
export interface SocialLinks {
  /** GitHub profile URL */
  github?: string
  /** LinkedIn profile URL */
  linkedin?: string
  /** Twitter profile URL */
  twitter?: string
  /** Portfolio website URL */
  website?: string
  /** Dribbble profile URL */
  dribbble?: string
  /** Behance profile URL */
  behance?: string
  /** Stack Overflow profile URL */
  stackoverflow?: string
  /** Medium blog URL */
  medium?: string
}

// ============================================
// USER PREFERENCES INTERFACE
// ============================================

/**
 * User preferences structure
 */
export interface UserPreferences {
  /** Email notification preferences */
  emailNotifications: boolean
  /** Newsletter subscription */
  newsletter: boolean
  /** Language preference */
  language: 'fr' | 'en' | 'mg'
  /** Theme preference */
  theme: 'light' | 'dark' | 'system'
  /** Project alerts */
  projectAlerts: boolean
  /** Message notifications */
  messageNotifications: boolean
}

// ============================================
// MAIN USER INTERFACE
// ============================================

/**
 * Main User document structure for MongoDB
 * This represents the complete user profile
 */
export interface User {
  // ========== SYSTEM FIELDS ==========
  /** MongoDB ObjectId (automatically generated) */
  _id: ObjectId
  /** Creation timestamp (automatically set) */
  createdAt: Date
  /** Cover image URL */
  coverImage?: any
  /** Last update timestamp (automatically updated) */
  updatedAt: Date

  // ========== BASIC INFORMATION ==========
  /** User's full name or username */
  name: string
  /** Unique email address (used for login) */
  email: string
  /** Hashed password (empty for OAuth users) */
  password?: string
  /** Email verification status */
  emailVerified?: Date | null
  /** Email verification token (for unverified users) */
  verificationToken?: string
  /** Email verification token expiry */
  verificationTokenExpiry?: Date
  /** User role - determines platform permissions */
  role: UserRole
  /** Profile picture URL */
  avatar?: string
  /** Short biography */
  bio?: string
  /** User's location */
  location?: string
  /** Phone number (optional) */
  phone?: string
  /** Date of birth (optional) */
  dateOfBirth?: Date

  // ========== PROFESSIONAL INFORMATION ==========
  /** Current job title */
  title?: string
  /** Job title (alias) */
  jobTitle?: string
  /** Hourly rate in the default currency */
  hourlyRate?: number
  /** Preferred currency (USD, EUR, MGA, etc.) */
  currency?: string
  /** List of professional skills */
  skills: Skill[]
  /** Languages spoken with proficiency levels */
  languages?: Array<{
    name: string
    level: 'basic' | 'conversational' | 'fluent' | 'native'
  }>
  /** Current availability status */
  availability: AvailabilityStatus
  /** Years of professional experience */
  totalExperience?: number

  // ========== PORTFOLIO & WORK ==========
  /** List of portfolio projects */
  portfolio: Portfolio[]
  /** List of work experiences */
  experience: Experience[]
  /** List of educational background */
  education?: Education[]
  /** Professional certifications */
  certifications?: Array<{
    name: string
    issuer: string
    date: Date
    url?: string
  }>
  /** Uploaded CV/resume URL */
  resume?: string
  cv?:any
  // ========== SOCIAL & LINKS ==========
  /** Social media profiles */
  socialLinks?: SocialLinks

  // ========== STATISTICS & METRICS ==========
  /** Average rating from clients */
  rating?: number
  /** Statistics object */
  statistics?: {
    rating: number
    completedProjects: number
    responseRate: number
    successRate?: number
    clientSatisfaction?: number
    totalSpent?: number
    totalProjects?: number
  }
  /** Number of completed projects */
  completedProjects: number
  /** Total earnings across all projects */
  totalEarnings: number
  /** Average response time in hours */
  responseTime?: number
  /** Profile view count */
  profileViews?: number
  /** Number of times hired */
  hireCount?: number

  // ========== BADGES & ACHIEVEMENTS ==========
  /** List of earned badges */
  badges?: Array<{
    id: string
    name: string
    icon: string
    earnedAt: Date
  }>

  // ========== VERIFICATION & STATUS ==========
  /** Whether email is verified (legacy field) */
  verified: boolean
  /** Whether identity is verified */
  identityVerified?: boolean
  /** Whether phone is verified */
  phoneVerified?: boolean
  /** Whether profile is complete */
  onboardingCompleted: boolean
  /** Whether onboarding role is completed */
  onboardingRoleCompleted?: boolean
  /** Account status (active, suspended, banned) */
  status?: 'active' | 'suspended' | 'banned'
  /** Whether account is active */
  isActive?: boolean
  /** Whether account is deactivated (temporary) */
  isDeactivated?: boolean
  /** Date when account was deactivated */
  deactivatedAt?: Date
  /** Reason for deactivation */
  deactivationReason?: string
  /** Reactivation token */
  reactivationToken?: string
  /** Reactivation token expiry */
  reactivationTokenExpiry?: Date
  /** Date when account was reactivated */
  reactivatedAt?: Date
  /** Last login timestamp */
  lastLogin?: Date
  /** Verification code for 2FA */
  verificationCode?: any
  /** Verification code expiry */
  verificationCodeExpiry?: any

  // ========== PREFERENCES ==========
  /** User preferences */
  preferences?: UserPreferences
  /** User language */
  language?: 'fr' | 'en' | 'mg'

  // ========== PAYMENT INFORMATION ==========
  /** Stripe customer ID (for payments) */
  stripeCustomerId?: string
  /** Stripe account ID (for payouts) */
  stripeAccountId?: string
  /** Default payment method */
  defaultPaymentMethod?: string
  /** Subscription plan */
  subscriptionPlan?: string
  /** Subscription status */
  subscriptionStatus?: string
  /** Subscription end date */
  subscriptionEndDate?: Date
  /** Platform fee percentage */
  platformFee?: number

  // ========== NOTIFICATIONS ==========
  /** List of notifications */
  notifications?: Array<{
    id: string
    type: string
    message: string
    read: boolean
    createdAt: Date
    link?: string
  }>
  /** Unread notifications count */
  unreadNotifications: number

  // ========== SECURITY ==========
  /** Two-factor authentication enabled */
  twoFactorEnabled?: boolean
  /** Two-factor authentication secret */
  twoFactorSecret?: string
  /** Backup codes for 2FA */
  backupCodes?: string[]
  /** Login attempts for rate limiting */
  loginAttempts?: number
  /** Lock until timestamp (for failed attempts) */
  lockUntil?: Date
}

// ============================================
// USER CREATION DTO (Data Transfer Object)
// ============================================

/**
 * Data required to create a new user
 * Used in registration endpoint
 */
export interface CreateUserDTO {
  name: string
  email: string
  password?: string
  role?: UserRole
  avatar?: string
  lang?: string
}

// ============================================
// USER UPDATE DTO
// ============================================

/**
 * Data allowed for user updates
 * Used in PATCH /api/users/profile
 */
export interface UpdateUserDTO {
  name?: string
  avatar?: string
  bio?: string
  location?: string
  phone?: string
  jobTitle?: string
  hourlyRate?: number
  currency?: string
  skills?: Skill[]
  languages?: User['languages']
  availability?: AvailabilityStatus
  socialLinks?: SocialLinks
  preferences?: Partial<UserPreferences>
  onboardingCompleted?: boolean
}

// ============================================
// USER RESPONSE DTO (Safe for client)
// ============================================

/**
 * User data sent to client (excludes sensitive information)
 */
export interface UserResponseDTO {
  id: string
  coverImage?: any
  name: string
  email: string
  role: UserRole
  avatar?: string
  bio?: string
  location?: string
  jobTitle?: string
  title?: string
  hourlyRate?: number
  currency?: string
  skills: Skill[]
  languages?: User['languages']
  availability: AvailabilityStatus
  portfolio: Portfolio[]
  experience: Experience[]
  education?: Education[]
  socialLinks?: SocialLinks
  rating?: number
  cv?:any
  statistics?: {
    rating: number
    completedProjects: number
    responseRate: number
    successRate?: number
  }
  completedProjects: number
  totalEarnings: number
  responseTime?: number
  badges?: User['badges']
  verified: boolean
  emailVerified?: boolean
  identityVerified?: boolean
  onboardingCompleted: boolean
  onboardingRoleCompleted?: boolean
  isActive?: boolean
  isDeactivated?: boolean
  preferences?: UserPreferences
  language?: 'fr' | 'en' | 'mg'
  createdAt: Date
  updatedAt: Date
  subscriptionPlan?: string
  subscriptionStatus?: string
  subscriptionEndDate?: Date
  platformFee?: number
}

// ============================================
// TOKEN VERIFICATION INTERFACE
// ============================================

/**
 * Email verification token structure
 * Stored in separate collection or embedded
 */
export interface VerificationToken {
  /** Unique token identifier */
  _id: ObjectId
  /** User ID */
  userId: ObjectId
  /** User email */
  email: string
  /** Verification token */
  token: string
  /** Token type (email_verification, password_reset, etc.) */
  type: 'email_verification' | 'password_reset' | 'account_reactivation'
  /** Expiry date */
  expiresAt: Date
  /** Creation date */
  createdAt: Date
  /** Language preference for emails */
  lang?: string
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert a User document to a safe response DTO
 * Removes sensitive data and converts ObjectId to string
 */
export function toUserResponseDTO(user: User): UserResponseDTO {
  return {
    id: user._id.toString(),
    coverImage: user.coverImage,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
    location: user.location,
    jobTitle: user.jobTitle || user.title,
    title: user.title || user.jobTitle,
    hourlyRate: user.hourlyRate,
    currency: user.currency,
    skills: user.skills || [],
    languages: user.languages,
    availability: user.availability || 'available',
    portfolio: user.portfolio || [],
    experience: user.experience || [],
    education: user.education,
    socialLinks: user.socialLinks,
    rating: user.rating || user.statistics?.rating || 0,
    statistics: user.statistics || {
      rating: 0,
      completedProjects: 0,
      responseRate: 0,
      successRate: 0
    },
     cv: user.cv ? {
      url: user.cv.url,
      fileName: user.cv.fileName,
      uploadedAt: user.cv.uploadedAt,
      fileSize: user.cv.fileSize,
      publicId: user.cv.publicId,
      fileType: user.cv.fileType
    } : null,
    completedProjects: user.completedProjects || 0,
    totalEarnings: user.totalEarnings || 0,
    responseTime: user.responseTime,
    badges: user.badges,
    verified: user.verified || false,
    emailVerified: !!user.emailVerified,
    identityVerified: user.identityVerified,
    onboardingCompleted: user.onboardingCompleted || false,
    onboardingRoleCompleted: user.onboardingRoleCompleted || false,
    isActive: user.isActive !== false,
    isDeactivated: user.isDeactivated === true,
    preferences: user.preferences,
    language: user.language || user.preferences?.language || 'fr',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionEndDate: user.subscriptionEndDate,
    platformFee: user.platformFee
  }
}

/**
 * Create a new user object with default values
 */
export function createNewUser(data: CreateUserDTO): Omit<User, '_id'> {
  const now = new Date()
  
  return {
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role || 'freelance',
    avatar: data.avatar || '',
    skills: [],
    portfolio: [],
    experience: [],
    availability: 'available',
    completedProjects: 0,
    totalEarnings: 0,
    verified: false,
    emailVerified: null,
    onboardingCompleted: false,
    onboardingRoleCompleted: false,
    isActive: true,
    isDeactivated: false,
    createdAt: now,
    updatedAt: now,
    unreadNotifications: 0
  }
}

/**
 * Generate a verification token
 */
export function generateVerificationToken(userId: ObjectId, email: string, lang: string = 'fr'): Omit<VerificationToken, '_id'> {
  const crypto = require('crypto')
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 3600000) // 24 heures
  
  return {
    userId,
    email,
    token,
    type: 'email_verification',
    expiresAt,
    createdAt: new Date(),
    lang
  }
}

/**
 * Generate a reactivation token for deactivated accounts
 */
export function generateReactivationToken(userId: ObjectId, email: string, lang: string = 'fr'): Omit<VerificationToken, '_id'> {
  const crypto = require('crypto')
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 3600000) // 24 heures
  
  return {
    userId,
    email,
    token,
    type: 'account_reactivation',
    expiresAt,
    createdAt: new Date(),
    lang
  }
}

/**
 * Check if a verification token is valid
 */
export function isTokenValid(token: VerificationToken): boolean {
  return token.expiresAt > new Date()
}

/**
 * Check if a user account is active and not deactivated
 */
export function isUserActive(user: User): boolean {
  return user.isActive !== false && user.isDeactivated !== true
}

/**
 * Get user status message
 */
export function getUserStatusMessage(user: User, lang: string = 'fr'): string {
  const messages = {
    fr: {
      active: "Compte actif",
      deactivated: "Compte désactivé",
      inactive: "Compte inactif",
      suspended: "Compte suspendu"
    },
    en: {
      active: "Account active",
      deactivated: "Account deactivated",
      inactive: "Account inactive",
      suspended: "Account suspended"
    },
    mg: {
      active: "Kaonty mavitrika",
      deactivated: "Kaonty nesorina",
      inactive: "Kaonty tsy mavitrika",
      suspended: "Kaonty naato"
    }
  }
  
  const t = messages[lang as keyof typeof messages] || messages.fr
  
  if (user.isDeactivated === true) return t.deactivated
  if (user.isActive === false) return t.inactive
  if (user.status === 'suspended') return t.suspended
  return t.active
}

/**
 * Check if user can perform actions based on account status
 */
export function canUserPerformAction(user: User): { allowed: boolean; reason?: string } {
  if (user.isDeactivated === true) {
    return { allowed: false, reason: "Account deactivated. Please reactivate your account." }
  }
  if (user.isActive === false) {
    return { allowed: false, reason: "Account inactive. Please contact support." }
  }
  if (user.status === 'suspended') {
    return { allowed: false, reason: "Account suspended. Please contact support." }
  }
  return { allowed: true }
}