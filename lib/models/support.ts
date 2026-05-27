// lib/models/support.ts
import { ObjectId } from "mongodb"

export interface FAQ {
  _id?: ObjectId
  question: string
  answer: string
  category: 'account' | 'billing' | 'project' | 'payment' | 'freelance' | 'client' | 'technical' | 'other'
  order: number
  helpful: number
  notHelpful: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProblemReport {
  _id?: ObjectId
  userId: ObjectId
  user: {
    name: string
    email: string
    role: string
  }
  type: 'bug' | 'feature' | 'performance' | 'security' | 'usability' | 'other'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  steps?: string
  expectedBehavior?: string
  actualBehavior?: string
  browser?: string
  os?: string
  screenshots: string[]
  status: 'pending' | 'reviewing' | 'in_progress' | 'resolved' | 'rejected'
  assignedTo?: ObjectId
  resolvedAt?: Date
  resolution?: string
  createdAt: Date
  updatedAt: Date
}

export interface SupportTicket {
  _id?: ObjectId
  ticketId: string
  userId: ObjectId
  user: {
    name: string
    email: string
    role: string
  }
  subject: string
  category: 'technical' | 'billing' | 'project' | 'account' | 'payment' | 'freelance' | 'client' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  description: string
  attachments: string[]
  messages: TicketMessage[]
  assignedTo?: ObjectId
  resolvedAt?: Date
  resolution?: string
  createdAt: Date
  updatedAt: Date
}

export interface TicketMessage {
  id: string
  content: string
  isFromUser: boolean
  createdAt: Date
  attachments: string[]
}

export interface SupportChat {
  _id?: ObjectId
  userId: ObjectId
  user: {
    name: string
    email: string
  }
  status: 'active' | 'closed' | 'waiting'
  assignedAgent?: ObjectId
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

export interface ChatMessage {
  id: string
  content: string
  isFromUser: boolean
  createdAt: Date
  read: boolean
}

export interface FAQFeedback {
  _id?: ObjectId
  faqId: ObjectId
  userId: ObjectId
  helpful: boolean
  createdAt: Date
}