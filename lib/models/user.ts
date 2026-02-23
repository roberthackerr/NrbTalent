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

  onboardingRoleCompleted?:boolean
  // ========== SYSTEM FIELDS ==========
  /** MongoDB ObjectId (automatically generated) */
  _id: ObjectId
  /** Creation timestamp (automatically set) */
  createdAt: Date
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

  // ========== SOCIAL & LINKS ==========
  /** Social media profiles */
  socialLinks?: SocialLinks

  // ========== STATISTICS & METRICS ==========
  /** Average rating from clients */
  rating?: number
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
  /** Whether email is verified */
  verified: boolean
  /** Whether identity is verified */
  identityVerified?: boolean
  /** Whether phone is verified */
  phoneVerified?: boolean
  /** Whether profile is complete */
  onboardingCompleted: boolean
  /** Account status (active, suspended, banned) */
  status?: 'active' | 'suspended' | 'banned'
  /** Last login timestamp */
  lastLogin?: Date

  // ========== PREFERENCES ==========
  /** User preferences */
  preferences?: UserPreferences

  // ========== PAYMENT INFORMATION ==========
  /** Stripe customer ID (for payments) */
  stripeCustomerId?: string
  /** Stripe account ID (for payouts) */
  stripeAccountId?: string
  /** Default payment method */
  defaultPaymentMethod?: string

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
// Google = vérifié
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
  name: string
  email: string
  role: UserRole
  avatar?: string
  bio?: string
  location?: string
  jobTitle?: string
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
  completedProjects: number
  totalEarnings: number
  responseTime?: number
  badges?: User['badges']
  verified: boolean
  identityVerified?: boolean
  onboardingCompleted: boolean
  preferences?: UserPreferences
  createdAt: Date
  updatedAt: Date
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
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
    location: user.location,
    jobTitle: user.jobTitle,
    hourlyRate: user.hourlyRate,
    currency: user.currency,
    skills: user.skills || [],
    languages: user.languages,
    availability: user.availability || 'available',
    portfolio: user.portfolio || [],
    experience: user.experience || [],
    education: user.education,
    socialLinks: user.socialLinks,
    rating: user.rating,
    completedProjects: user.completedProjects || 0,
    totalEarnings: user.totalEarnings || 0,
    responseTime: user.responseTime,
    badges: user.badges,
    verified: user.verified || false,
    identityVerified: user.identityVerified,
    onboardingCompleted: user.onboardingCompleted || false,
    preferences: user.preferences,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
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
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now
  }
}