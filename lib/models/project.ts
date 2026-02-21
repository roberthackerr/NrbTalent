import mongoose, { type Document, Schema } from "mongoose"

export interface IMilestone {
  title: string
  description: string
  amount: number
  dueDate: Date
  status: "pending" | "in_progress" | "completed" | "paid"
  completedAt?: Date
}

export interface ITask {
  id: string
  title: string
  description: string
  assignedTo?: string
  status: "todo" | "in_progress" | "review" | "done"
  priority: "low" | "medium" | "high"
  dueDate?: Date
  createdAt: Date
  completedAt?: Date
  comments?: {
    id: string
    userId: string
    userName: string
    content: string
    createdAt: Date
  }[]
}

export interface IProjectFile {
  id: string
  name: string
  url: string
  size: number
  type: string
  uploadedBy: string
  uploadedAt: Date
}

export interface IProject extends Document {
  title: string
  description: string
  category: string
  budget: number
  deadline: Date
  clientId: string
  freelancerId?: string
  status: "open" | "in_progress" | "completed" | "cancelled"
  skills: string[]
  applications: string[]
  createdAt: Date
  updatedAt: Date

  milestones: IMilestone[]
  tasks: ITask[]
  files: IProjectFile[]
  teamMembers?: {
    userId: string
    role: string
    joinedAt: Date
  }[]
  videoCallUrl?: string
  isTeamProject: boolean
  calendarEvents?: {
    id: string
    title: string
    description: string
    startDate: Date
    endDate: Date
    type: "meeting" | "deadline" | "milestone" | "reminder"
    attendees?: string[]
    googleEventId?: string
    outlookEventId?: string
  }[]
}

const ProjectSchema = new Schema<IProject>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  budget: { type: Number, required: true },
  deadline: { type: Date, required: true },
  clientId: { type: String, required: true },
  freelancerId: { type: String },
  status: { type: String, enum: ["open", "in_progress", "completed", "cancelled"], default: "open" },
  skills: [{ type: String }],
  applications: [{ type: String }],
  milestones: [
    {
      title: String,
      description: String,
      amount: Number,
      dueDate: Date,
      status: { type: String, enum: ["pending", "in_progress", "completed", "paid"], default: "pending" },
      completedAt: Date,
    },
  ],
  tasks: [
    {
      id: String,
      title: String,
      description: String,
      assignedTo: String,
      status: { type: String, enum: ["todo", "in_progress", "review", "done"], default: "todo" },
      priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
      dueDate: Date,
      createdAt: { type: Date, default: Date.now },
      completedAt: Date,
      comments: [
        {
          id: String,
          userId: String,
          userName: String,
          content: String,
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
  ],
  files: [
    {
      id: String,
      name: String,
      url: String,
      size: Number,
      type: String,
      uploadedBy: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  teamMembers: [
    {
      userId: String,
      role: String,
      joinedAt: { type: Date, default: Date.now },
    },
  ],
  videoCallUrl: String,
  isTeamProject: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  calendarEvents: [
    {
      id: String,
      title: String,
      description: String,
      startDate: Date,
      endDate: Date,
      type: { type: String, enum: ["meeting", "deadline", "milestone", "reminder"] },
      attendees: [String],
      googleEventId: String,
      outlookEventId: String,
    },
  ],
})

export default mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema)
