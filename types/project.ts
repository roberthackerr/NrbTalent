// lib/models/project.ts
import { ObjectId } from "mongodb"
import { z } from "zod"

// Types de base
export type BudgetType = "fixed" | "hourly"
export type ProjectStatus = "draft" | "open" | "in-progress" | "completed" | "cancelled" | "paused"
export type ProjectVisibility = "public" | "private"
export type Complexity = "beginner" | "intermediate" | "expert"
export type Currency = "USD" | "EUR" | "MGA" | "GBP"

// Interface Budget
export interface ProjectBudget {
  min: number
  max: number
  type: BudgetType
  currency: Currency
  originalCurrency?: Currency
  exchangeRate?: number
}

// Interface Localized Content
export interface LocalizedField {
  [key: string]: string // ex: { fr: "Titre", en: "Title", es: "Título", mg: "Lohateny" }
}

// Interface pour les champs localisés
export interface ProjectLocalized {
  title: LocalizedField
  description: LocalizedField
  summary?: LocalizedField
  deliverables?: LocalizedField[]
}

// Interface Location
export interface ProjectLocation {
  remote: boolean
  country?: string
  city?: string
  timezone?: string
}

// Interface Timeline
export interface ProjectTimeline {
  startDate?: Date
  deadline: Date
  estimatedDuration?: number // en jours
  complexity?: Complexity
}

// Interface Client Info
export interface ClientInfo {
  _id: ObjectId
  name: string
  avatar?: string
  title?: string
  rating?: number
  completedProjects: number
  country?: string
  verified?: boolean
  memberSince?: Date
}

// MAIN PROJECT INTERFACE
export interface Project {
  _id: ObjectId
  
  // Champs localisés
  localized: ProjectLocalized
  
  // Champs non localisés (communs)
  category: string
  subcategory?: string
  skills: string[]
  budget: ProjectBudget
  timeline: ProjectTimeline
  location: ProjectLocation
  status: ProjectStatus
  visibility: ProjectVisibility
  tags: string[]
  
  // Relations
  clientId: ObjectId
  client?: ClientInfo
  
  // Métadonnées
  applications: ObjectId[]
  applicationCount: number
  views: number
  savedBy: ObjectId[]
  
  // Statistiques
  averageBid?: number
  minBid?: number
  maxBid?: number
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  closedAt?: Date
}

// DTO pour la création
export interface CreateProjectDTO {
  clientId: ObjectId
  localized: ProjectLocalized
  category: string
  subcategory?: string
  skills: string[]
  budget: ProjectBudget
  deadline: Date
  location?: ProjectLocation
  visibility?: ProjectVisibility
  tags?: string[]
  estimatedDuration?: number
  complexity?: Complexity
}

// DTO pour la réponse (safe)
export interface ProjectResponseDTO {
  id: string
  title: string
  description: string
  summary?: string
  category: string
  subcategory?: string
  skills: string[]
  budget: ProjectBudget
  deadline: Date
  status: ProjectStatus
  location: ProjectLocation
  client?: {
    id: string
    name: string
    avatar?: string
    rating?: number
    verified?: boolean
  }
  applicationCount: number
  views: number
  createdAt: Date
  matchedSkills?: string[]
  matchScore?: number
}

// ==================== HELPER FUNCTIONS ====================

export function createProject(data: CreateProjectDTO): Omit<Project, '_id'> {
  const now = new Date()
  
  return {
    localized: data.localized,
    category: data.category,
    subcategory: data.subcategory,
    skills: data.skills,
    budget: data.budget,
    timeline: {
      deadline: data.deadline,
      estimatedDuration: data.estimatedDuration,
      complexity: data.complexity,
    },
    location: data.location || { remote: true },
    status: 'open',
    visibility: data.visibility || 'public',
    tags: data.tags || [],
    clientId: data.clientId,
    applications: [],
    applicationCount: 0,
    views: 0,
    savedBy: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function toProjectResponseDTO(
  project: Project, 
  lang: string = 'fr',
  userSkills: string[] = []
): ProjectResponseDTO {
  // Récupérer les champs localisés selon la langue
  const title = project.localized.title[lang] || project.localized.title['fr'] || ''
  const description = project.localized.description[lang] || project.localized.description['fr'] || ''
  const summary = project.localized.summary?.[lang] || project.localized.summary?.['fr']
  
  // Calculer le score de correspondance
  const matchedSkills = project.skills.filter(skill => 
    userSkills.some(us => us.toLowerCase().includes(skill.toLowerCase()))
  )
  const matchScore = project.skills.length > 0 
    ? Math.round((matchedSkills.length / project.skills.length) * 100)
    : 0

  return {
    id: project._id.toString(),
    title,
    description,
    summary,
    category: project.category,
    subcategory: project.subcategory,
    skills: project.skills,
    budget: project.budget,
    deadline: project.timeline.deadline,
    status: project.status,
    location: project.location,
    client: project.client ? {
      id: project.client._id.toString(),
      name: project.client.name,
      avatar: project.client.avatar,
      rating: project.client.rating,
      verified: project.client.verified,
    } : undefined,
    applicationCount: project.applicationCount,
    views: project.views,
    createdAt: project.createdAt,
    matchedSkills,
    matchScore,
  }
}