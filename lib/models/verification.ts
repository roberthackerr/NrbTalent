export interface IdentityDocument {
  front: string // URL or path to front image
  back?: string // URL or path to back image (if applicable)
  type: 'passport' | 'id_card' | 'driver_license'
  number?: string
  expiryDate?: Date
  issuedCountry: string
}

export interface VerificationRequest {
  _id?: string
  userId: string
  type: 'identity' | 'phone' | 'payment' | 'email'
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  submittedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
  comments?: string
  
  // Identity-specific fields
  identityDocuments?: IdentityDocument[]
  firstName?: string
  lastName?: string
  dateOfBirth?: Date
  
  // Phone-specific fields
  phoneNumber?: string
  phoneVerified?: boolean
  verificationCode?: string
  codeExpiresAt?: Date
  
  // Payment-specific fields
  paymentMethod?: 'card' | 'bank_account'
  lastFourDigits?: string
  provider?: string
  
  // Common fields
  rejectionReason?: string
  metadata?: Record<string, any>
  files?: Array<{
    url: string
    filename: string
    size: number
    mimeType: string
    uploadedAt: Date
  }>
}

export interface UserVerificationStatus {
  userId: string
  email: boolean
  phone: boolean
  identity: boolean
  payment: boolean
  overallStatus: 'unverified' | 'partially_verified' | 'fully_verified'
  lastUpdated: Date
  level: 0 | 1 | 2 | 3 // Verification level based on completed verifications
}