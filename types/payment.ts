// types/payment.ts
export interface PaymentPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  platformFee: number // percentage
}

export interface PaymentTransaction {
  _id: string
  userId: string
  planId: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paypalOrderId: string
  paypalCaptureId?: string
  payerEmail?: string
  createdAt: Date
  completedAt?: Date
  metadata?: any
}

export interface UserSubscription {
  _id: string
  userId: string
  planId: string
  status: 'active' | 'cancelled' | 'expired'
  startDate: Date
  endDate: Date
  autoRenew: boolean
  platformFee: number
}