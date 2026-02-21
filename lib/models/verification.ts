import type { ObjectId } from "mongodb"

export interface Verification {
  _id?: ObjectId
  userId: ObjectId
  type: "identity" | "payment" | "email" | "phone"
  status: "pending" | "approved" | "rejected"
  documents?: {
    type: "passport" | "id_card" | "driver_license"
    url: string
    uploadedAt: Date
  }[]
  rejectionReason?: string
  verifiedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface VideoCall {
  _id?: ObjectId
  roomId: string
  participants: ObjectId[]
  projectId?: ObjectId
  startedAt: Date
  endedAt?: Date
  duration?: number
  status: "active" | "ended"
}
