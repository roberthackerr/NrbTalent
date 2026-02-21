// /lib/models/group-event.ts
import { ObjectId } from "mongodb"

export type EventType = 
  | 'meetup'
  | 'webinar'
  | 'workshop'
  | 'networking'
  | 'hackathon'
  | 'social'

export type EventStatus = 
  | 'draft'
  | 'scheduled'
  | 'live'
  | 'completed'
  | 'cancelled'

export interface EventRegistration {
  userId: ObjectId
  registeredAt: Date
  status: 'confirmed' | 'waiting' | 'cancelled'
  checkInAt?: Date
}

export interface GroupEvent {
  _id?: ObjectId
  groupId: ObjectId
  organizerId: ObjectId
  
  // Informations de base
  title: string
  description: string
  type: EventType
  status: EventStatus
  
  // Date et heure
  startDate: Date
  endDate: Date
  timezone: string
  
  // Localisation
  location: {
    type: 'online' | 'in-person' | 'hybrid'
    address?: string
    city?: string
    country?: string
    onlineLink?: string
    mapUrl?: string
  }
  
  // Configuration
  capacity?: number
  isPublic: boolean
  requiresApproval: boolean
  registrationDeadline?: Date
  
  // Participants
  registrations: EventRegistration[]
  attendees: ObjectId[] // Users qui ont participé
  
  // Ressources
  attachments: Array<{
    name: string
    url: string
    type: string
  }>
  
  // Agenda
  agenda?: Array<{
    time: Date
    title: string
    speaker?: string
    description?: string
  }>
  
  // Sponsors et partenaires
  sponsors?: Array<{
    name: string
    logo: string
    website?: string
  }>
  
  // Suivi
  viewCount: number
  saveCount: number
  shareCount: number
  
  // Feedback
  feedback?: {
    averageRating: number
    totalRatings: number
    comments: Array<{
      userId: ObjectId
      comment: string
      rating: number
      createdAt: Date
    }>
  }
  
  // Dates
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}