// types/contract.ts
export interface Contract {
  _id: string
  projectId: string
  clientId: string
  freelancerId: string
  title: string
  description: string
  status: 'draft' | 'pending' | 'signed' | 'active' | 'completed' | 'cancelled'
  type: 'fixed_price' | 'hourly' | 'milestone'
  
  // Détails financiers
  amount: number
  currency: string
  paymentSchedule?: {
    type: 'upfront' | 'milestone' | 'completion' | 'hourly'
    milestones?: Array<{
      title: string
      amount: number
      dueDate: Date
      status: 'pending' | 'paid'
    }>
  }
  
  // Détails temporels
  startDate: Date
  endDate?: Date
  duration?: number // en jours
  
  // Spécifications
  deliverables: string[]
  scopeOfWork: string
  termsAndConditions: string
  
  // Signatures
  clientSignature?: {
    signedAt: Date
    ipAddress: string
    userAgent: string
  }
  freelancerSignature?: {
    signedAt: Date
    ipAddress: string
    userAgent: string
  }
  
  // Dates
  createdAt: Date
  updatedAt: Date
  signedAt?: Date
  
  // Contrôle de version
  version: number
  previousVersionId?: string
}