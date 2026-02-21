import type { ObjectId } from "mongodb"

export type UserRole = "freelance" | "client" | null

export interface Badge {
  type: "top_rated" | "rising_talent" | "expert" | "mentor" | "team_player" | "fast_delivery" | "premium"
  earnedAt: Date
  level?: number
  expiresAt?: Date
}

export interface Availability {
  status: "available" | "busy" | "unavailable" | "away"
  hoursPerWeek?: number
  nextAvailable?: Date
  responseTime?: string
}

export interface Education {
  id: string
  school: string
  degree: string
  field: string
  startDate: Date
  endDate?: Date
  current: boolean
  description?: string
  grade?: string
}

export interface Experience {
  id: string
  company: string
  position: string
  location?: string
  startDate: Date
  endDate?: Date
  current: boolean
  description: string
  technologies: string[]
  achievement: string
}

export interface PortfolioItem {
  id: string
  title: string
  description: string
  url?: string
  image: string
  category: string
  technologies: string[]
  featured: boolean
  client?: string
  duration?: string
  budget?: number
  createdAt: Date
}

export interface Review {
  _id?: ObjectId
  projectId: ObjectId
  reviewerId: ObjectId
  reviewerName: string
  reviewerAvatar?: string
  reviewedId: ObjectId
  rating: number
  comment: string
  wouldRecommend: boolean
  strengths?: string[]
  createdAt: Date
}

export interface Certification {
  name: string
  issuer: string
  earnedAt: Date
  certificateUrl?: string
  credentialId?: string
  expiresAt?: Date
  skills: string[]
}

export interface UserPreferences {
  emailNotifications: {
    newMessages: boolean
    projectInvites: boolean
    applicationUpdates: boolean
    paymentNotifications: boolean
    newsletter: boolean
  }
  pushNotifications: {
    newMessages: boolean
    projectMatches: boolean
    deadlineReminders: boolean
  }
  privacy: {
    profileVisible: boolean
    earningsVisible: boolean
    onlineStatus: boolean
    searchVisibility: boolean
  }
  communication: {
    language: string
    timezone: string
    responseTime: string
  }
}

export interface UserStatistics {
  completedProjects: number
  successRate: number
  onTimeDelivery: number
  clientSatisfaction: number
  responseRate: number
  avgResponseTime: number // in hours
  totalHoursWorked: number
  repeatClientRate: number
  earnings: {
    total: number
    thisMonth: number
    lastMonth: number
  }
  profileViews: number
  proposalAcceptanceRate: number
}

export interface SocialLinks {
  website?: string
  linkedin?: string
  github?: string
  twitter?: string
  behance?: string
  dribbble?: string
}

export interface User {
  onboardingCompleted: boolean,
  _id?: ObjectId
  name: string
  email: string
  password: string
  role: UserRole
  avatar?: string
  coverImage?: string
  bio?: string
  title?: string
  skills: string[]
  hourlyRate?: number
  location?: string
  timezone?: string
  languages: string[]
  socialLinks?: SocialLinks
  portfolio?: PortfolioItem[]
  education?: Education[]
  experience?: Experience[]
  certifications?: Certification[]
  reviews?: Review[]
  badges?: Badge[]
  availability?: Availability
  preferences?: UserPreferences
  statistics?: UserStatistics
  enrolledCourses?: ObjectId[]
  savedProjects?: ObjectId[]
  following?: ObjectId[]
  followers?: ObjectId[]
  verified?: boolean
  emailVerified?: boolean | Date        // true ou Date de vérification
  emailVerificationToken?: string       // Token temporaire pour vérification
  emailVerificationExpires?: Date       // Expiration du token (24h)
  verificationAttempts?: number   
  phoneVerified?: boolean
  phone?: string
  phoneVerificationToken?: string
  phoneVerificationExpires?: Date
  phoneVerificationAttempts?: number
  identityVerified?: boolean
  completionScore?: number
  isActive?: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date

   teams?: ObjectId[];  // ← Array of team IDs user belongs to
  teamPreferences?: {
    openToTeams: boolean;
    preferredRoles: string[];
    maxTeamSize: number;
    workStyle: "sync" | "async" | "mixed";
  };
     bankAccount?: {
    iban: string;
    bic: string;
    accountHolder: string;
    bankName: string;
    verified: boolean;
    verifiedAt?: Date;
  };
  
  // Infos fiscales
  taxInfo?: {
    siren?: string;          // Pour auto-entrepreneur
    siret?: string;
    vatNumber?: string;      // TVA intracommunautaire
    legalForm?: string;      // 'auto-entrepreneur', 'sarl', 'ei', etc.
    address?: string;
  };
  
  // Paiements reçus
  paymentsReceived?: {
    totalEarnings: number;
    pendingAmount: number;
    availableAmount: number;
    transactions: Array<{
      projectId: ObjectId;
      amount: number;
      date: Date;
      status: 'pending' | 'paid' | 'processing';
      transferId?: string;
    }>;
  };
  
  // Paramètres de paiement
  paymentSettings?: {
    paymentMethod: 'bank_transfer' | 'paypal' | 'wise';
    minimumPayout: number;     // Ex: 50€ minimum pour retirer
    payoutSchedule: 'weekly' | 'bi-weekly' | 'monthly' | 'manual';
    automaticPayout: boolean;
    lastPayoutDate?: Date;
    nextPayoutDate?: Date;
  };
  // Nouveaux champs pour Stripe
  stripeCustomerId?: string;
  stripeAccountId?: string; // Pour les freelances avec Stripe Connect
  paymentMethods?: Array<{
    id: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    isDefault: boolean;
    addedAt: Date;
  }>;
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    postal_code: string;
    country: string;
  };
  
  // Métriques de paiement
  paymentStats?: {
    totalSpent: number;
    totalProjects: number;
    successfulPayments: number;
    failedPayments: number;
    lastPaymentDate?: Date;
  };
}
// lib/models/user.ts - AJOUTER À LA FIN DU FICHIER

export interface Review {
  _id?: ObjectId
  // Relations
  reviewerId: ObjectId        // Qui note
  reviewedId: ObjectId        // Qui est noté
  contractId: ObjectId        // Contrat associé
  projectId?: ObjectId        // Projet associé
  projectTitle?: string       // Titre du projet
  
  // Contenu
  rating: number              // 1-5
  comment: string
  strengths: string[]         // Points forts
  wouldRecommend: boolean     // Recommandation
  
  // Vérifications
  verified: boolean           // Vrai si collaboration vérifiée
  verifiedAt?: Date           // Date de vérification
  verifiedBy?: 'system' | 'admin' | 'auto'
  
  // Métadonnées
  helpfulCount: number        // Nombre de "utile"
  flags?: {
    reported: boolean
    reportedBy?: ObjectId[]
    hidden: boolean
    reason?: string
  }
  
  // Réponse
  response?: {
    content: string
    createdAt: Date
    updatedAt: Date
    updatedBy?: ObjectId
  }
  
  // Informations affichage
  reviewerName?: string
  reviewerAvatar?: string
  reviewerRole?: 'client' | 'freelancer'
  reviewedRole?: 'client' | 'freelancer'
  
  createdAt: Date
  updatedAt: Date
}
export interface Project {
  aiGenerated: any
  _id?: ObjectId
  clientId: ObjectId
  title: string
  description: string
  category: string
  subcategory?: string
  freelancerId: number
  budget: {
    min: number
    max: number
    type: "fixed" | "hourly"
    currency: string // ← Devise principale du projet
    originalCurrency?: string // ← NOUVEAU: Devise originale (si conversion)
    exchangeRate?: number // ← NOUVEAU: Taux de change utilisé
    convertedAt?: Date // ← NOUVEAU: Date de conversion
  }
  skills: string[]
  deadline?: Date
  status: "draft" | "open" | "in-progress" | "completed" | "cancelled" | "paused"
  visibility: "public" | "private"
  applications: ObjectId[]
  selectedFreelanceId?: ObjectId
  contractId?: ObjectId
  milestones: {
    title: string
    amount: number
    dueDate: Date
    status: "pending" | "completed" | "paid"
    currency?: string // ← Optionnel: devise spécifique pour chaque milestone
  }[]
  attachments: {
    name: string
    url: string
    type: string
  }[]
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Application {
  _id?: ObjectId
  freelancerId: ObjectId
  projectId: ObjectId
  coverLetter: string
  proposedBudget: number
  estimatedDuration: string
  attachments: {
    name: string
    url: string
    type: string
  }[]
  status: "pending" | "accepted" | "rejected" | "withdrawn"
  clientViewed: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Conversation {
  _id?: ObjectId
  participants: ObjectId[]
  lastMessage: string
  lastMessageAt: Date
  unreadCount: number
  projectId?: ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  _id?: ObjectId
  conversationId: ObjectId
  senderId: ObjectId
  content: string
  type: "text" | "file" | "image" | "system"
  attachments: {
    name: string
    url: string
    type: string
    size: number
  }[]
  read: boolean
  readAt?: Date
  createdAt: Date
}

export interface Notification {
  _id?: ObjectId
  userId: ObjectId
  type: "new_application" | "application_accepted" | "application_rejected" | "new_message" | "payment_received" | "project_invite" | "milestone_completed" | "review_received" | "system_alert"
  title: string
  message: string
  data?: any
  projectId?: ObjectId
  read: boolean
  createdAt: Date
}

export interface Contract {
  _id?: ObjectId
  projectId: ObjectId
  clientId: ObjectId
  freelancerId: ObjectId
  title: string
  description: string
  terms: string
  budget: number
  type: "fixed" | "hourly"
  duration: string
  milestones: {
    title: string
    amount: number
    dueDate: Date
    status: "pending" | "completed" | "paid"
  }[]
  status: "draft" | "active" | "completed" | "cancelled" | "disputed"
  startDate: Date
  endDate?: Date
  paymentMethod: string
  createdAt: Date
  updatedAt: Date
}