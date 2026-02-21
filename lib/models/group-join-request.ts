// /lib/models/group-join-request.ts
import { ObjectId } from "mongodb"

export type JoinRequestStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'

export interface GroupJoinRequest {
  _id?: ObjectId
  groupId: ObjectId
  userId: ObjectId
  message?: string
  status: JoinRequestStatus
  
  // Réponse de l'admin
  response?: {
    adminId: ObjectId
    message?: string
    respondedAt: Date
  }
  
  // Dates
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date // Après X jours, automatiquement rejeté
}