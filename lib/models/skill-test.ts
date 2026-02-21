import type { ObjectId } from "mongodb"

export interface SkillTest {
  _id?: ObjectId
  title: string
  category: string
  description: string
  duration: number // in minutes
  questions: Question[]
  passingScore: number // percentage
  createdAt: Date
  updatedAt: Date
}

export interface Question {
  id: string
  question: string
  type: "multiple-choice" | "code" | "true-false"
  options?: string[]
  correctAnswer: string | number
  points: number
  explanation?: string
}

export interface TestResult {
  _id?: ObjectId
  userId: ObjectId
  testId: ObjectId
  score: number
  passed: boolean
  answers: UserAnswer[]
  completedAt: Date
}

export interface UserAnswer {
  questionId: string
  answer: string | number
  correct: boolean
  points: number
}

export interface Referral {
  _id?: ObjectId
  referrerId: ObjectId
  referredEmail: string
  referredUserId?: ObjectId
  status: "pending" | "completed"
  reward: number
  createdAt: Date
  completedAt?: Date
}
