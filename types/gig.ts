// types/gig.ts
export interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  rating?: number
  reviewCount?: number
  joinedAt: string
}

export interface Gig {
  _id: string
  title: string
  description: string
  category: string
  subcategory?: string
  tags: string[]
  price: number
  currency: string
  deliveryTime: number // en jours
  revisions: number
  features: string[]
  requirements: string[]
  images: string[]
  createdBy: string | User
  seller?: User
  createdAt: string
  updatedAt: string
  status: 'active' | 'paused' | 'draft' | 'rejected'
  rating?: number
  reviewsCount?: number
  ordersCount?: number
  views?: number
}

export interface GigFormData {
  title: string
  description: string
  category: string
  subcategory: string
  tags: string[]
  price: number
  deliveryTime: number
  revisions: number
  features: string[]
  requirements: string[]
  images: string[]
}

export interface GigOrder {
  _id: string
  gigId: string
  buyerId: string | User
  sellerId: string | User
  package: 'basic' | 'standard' | 'premium'
  price: number
  status: 'pending' | 'in_progress' | 'delivered' | 'completed' | 'cancelled' | 'disputed'
  requirements: string
  deliveryDate: string
  createdAt: string
  updatedAt: string
  messages: OrderMessage[]
  gig?: Gig
}

export interface OrderMessage {
  _id: string
  orderId: string
  senderId: string | User
  content: string
  attachments: string[]
  createdAt: string
  isSystemMessage?: boolean
}

export interface GigReview {
  _id: string
  gigId: string
  orderId: string
  buyerId: string | User
  sellerId: string | User
  rating: number
  comment: string
  createdAt: string
  response?: string
  respondedAt?: string
}

// Pour les formulaires de création/édition
export interface CreateGigInput {
  title: string
  description: string
  category: string
  subcategory?: string
  tags: string[]
  price: number
  deliveryTime: number
  revisions: number
  features: string[]
  requirements: string[]
  images:[]
}

export interface UpdateGigInput extends Partial<CreateGigInput> {
  status?: Gig['status']
}

// Pour les filtres et recherche
export interface GigFilters {
  category?: string
  minPrice?: string
  maxPrice?: string
  deliveryTime?: number[]
  rating?: number[]
  sortBy?: 'createdAt' | 'rating' | 'price' | 'price_desc' | 'ordersCount'
  search?: string
}

// Pour la pagination
export interface GigPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface GigsResponse {
  gigs: Gig[]
  pagination: GigPagination
}

// Types pour les packages
export type PackageType = 'basic' | 'standard' | 'premium'

export interface GigPackage {
  id: PackageType
  name: string
  description: string
  priceMultiplier: number
  features: string[]
  popular?: boolean
}