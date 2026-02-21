import type { ObjectId } from "mongodb"

export interface CalendarEvent {
  _id?: ObjectId
  userId: ObjectId
  title: string
  description: string
  start: Date
  end: Date
  client: string
  type: 'meeting' | 'project' | 'delivery' | 'call' | 'workshop' | 'training'
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  location?: string
  project?: string
  projectId?: ObjectId
  clientId?: ObjectId
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    endDate?: Date
    count?: number
  }
  reminders: {
    type: 'email' | 'notification' | 'both'
    minutesBefore: number
    sent: boolean
  }[]
  color?: string
  tags: string[]
  isAllDay: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateEventRequest {
  title: string
  description: string
  start: string
  end: string
  client: string
  type: 'meeting' | 'project' | 'delivery' | 'call' | 'workshop' | 'training'
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  location?: string
  project?: string
  projectId?: string
  clientId?: string
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    endDate?: string
    count?: number
  }
  reminders?: {
    type: 'email' | 'notification' | 'both'
    minutesBefore: number
  }[]
  color?: string
  tags?: string[]
  isAllDay?: boolean
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {}