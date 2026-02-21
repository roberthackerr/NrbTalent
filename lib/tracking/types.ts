// lib/tracking/types.ts
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'

export interface Project {
  id: string
  title: string
  description: string
  clientId: string
  freelancerId: string
  status: ProjectStatus
  budget: number
  currency: string
  deadline: Date
  createdAt: Date
  updatedAt: Date
  progress: number
  tags: string[]
}

export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string
  dueDate?: Date
  estimatedHours: number
  actualHours?: number
  position: number
  labels: string[]
  attachments: Attachment[]
  comments: Comment[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface Attachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedBy: string
  uploadedAt: Date
}

export interface Comment {
  id: string
  taskId: string
  userId: string
  content: string
  attachments: string[]
  createdAt: Date
  updatedAt: Date
}

export interface TimeEntry {
  id: string
  taskId: string
  userId: string
  startTime: Date
  endTime?: Date
  duration: number
  description: string
  billable: boolean
}

export interface ProjectStats {
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  totalHours: number
  progress: number
  teamMembers: number
}