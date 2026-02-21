import mongoose, { type Document, Schema } from "mongoose"

export interface ILesson {
  id: string
  title: string
  description: string
  videoUrl?: string
  content: string
  duration: number
  order: number
}

export interface ICourse extends Document {
  title: string
  description: string
  category: string
  level: "beginner" | "intermediate" | "advanced"
  instructor: string
  thumbnail: string
  price: number
  duration: number
  lessons: ILesson[]
  skills: string[]
  enrolledStudents: string[]
  rating: number
  reviews: {
    userId: string
    rating: number
    comment: string
    createdAt: Date
  }[]
  certification: {
    enabled: boolean
    passingScore: number
    certificateName: string
  }
  createdAt: Date
  updatedAt: Date
}

const CourseSchema = new Schema<ICourse>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  level: { type: String, enum: ["beginner", "intermediate", "advanced"], required: true },
  instructor: { type: String, required: true },
  thumbnail: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  lessons: [
    {
      id: String,
      title: String,
      description: String,
      videoUrl: String,
      content: String,
      duration: Number,
      order: Number,
    },
  ],
  skills: [{ type: String }],
  enrolledStudents: [{ type: String }],
  rating: { type: Number, default: 0 },
  reviews: [
    {
      userId: String,
      rating: Number,
      comment: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  certification: {
    enabled: { type: Boolean, default: false },
    passingScore: { type: Number, default: 70 },
    certificateName: String,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

export default mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema)
