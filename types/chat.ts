// types/chat.ts - FIXED VERSION
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error'
export interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  title?: string
  skills?: string[]
  isOnline?: boolean
  lastSeen?: string
  role?: 'ai_assistant' | 'freelancer' | 'freelance' // Added role to User
}

export interface Conversation {
  _id: string
  participants: Array<{
    _id: string
    name: string
    email: string
    avatar?: string
    isOnline?: boolean
    role: 'ai_assistant' | 'freelancer' | 'freelance'
  }>
  lastMessage?: string
  createdAt: string // Removed duplicate
  updatedAt: string
  unreadCount: number
  isGroup?: boolean
  groupName?: string
  groupAvatar?: string
  isAIConversation?: boolean // Added for AI conversations
  orderId?: string // Added for order-related conversations
  type?: 'direct' | 'group' | 'ai_assistant' | 'order' // Added conversation type
}

export interface Message {
  _id: string
  conversationId: string
  senderId: string
  receiverId?: string // Made optional for group/AI messages
  content: string
  read: boolean
  createdAt: string
  updatedAt?: string
  isAIMessage?: boolean // Made optional for backward compatibility
  type?: 'text' | 'image' | 'file' | 'system'
  status?: MessageStatus
  readAt?: string
  readBy?: string[] // For group messages
  tempId?: string // For optimistic updates
  aiUser?: { // For AI messages
    _id: string
    name: string
    avatar?: string
    role: 'ai_assistant'
  }
}
export interface MessagePreferences {
  // 🔔 Notifications
  soundEnabled: boolean
  desktopNotifications: boolean
  vibration: boolean
  
  // 💬 Message Behavior
  enterToSend: boolean
  markAsReadOnOpen: boolean
  showTypingIndicators: boolean
  showReadReceipts: boolean
  showOnlineStatus: boolean
  
  // 🎨 Appearance
  theme: 'light' | 'dark' | 'auto'
  fontSize: 'small' | 'medium' | 'large'
  bubbleStyle: 'default' | 'minimal' | 'rounded'
  
  // 🔒 Privacy
  lastSeen: 'everyone' | 'contacts' | 'nobody'
  profilePhoto: 'everyone' | 'contacts' | 'nobody'
  readReceipts: 'everyone' | 'contacts' | 'nobody'
  
  // 💾 Storage
  autoDownloadMedia: boolean
  saveToCameraRoll: boolean
  backupMessages: boolean
  
  // ⚡ Performance
  lowDataMode: boolean
  autoPlayGifs: boolean
  previewLinks: boolean
}

// 🔥 ADDITIONAL TYPES FOR BETTER TYPE SAFETY

export interface AIUser extends User {
  role: 'ai_assistant'
  isAI: true
}

export interface FreelancerUser extends User {
  role: 'freelancer' | 'freelance'
  skills: string[]
  title: string
}

export interface WebSocketMessage {
  type: string
  data?: any
  messageId?: string
  timestamp?: number
}

export interface TypingIndicator {
  conversationId: string
  userId: string
  userName: string
  isTyping: boolean
  timestamp: number
}

export interface ConversationContext {
  conversationId: string
  participants: User[]
  isAIConversation: boolean
  userId: string
  userName: string
  userEmail: string
}

export interface SendMessagePayload {
  conversationId: string
  receiverId?: string
  content: string
  tempId?: string
  type?: 'text' | 'image' | 'file'
}

export interface AIResponse {
  success: boolean
  response: {
    content: string
    type: string
    messageId?: string
    aiUser?: {
      _id: string
      name: string
      avatar?: string
    }
  }
}

// 🔥 TYPE GUARDS FOR RUNTIME SAFETY

export const isAIUser = (user: User): user is AIUser => {
  return user.role === 'ai_assistant'
}

export const isFreelancerUser = (user: User): user is FreelancerUser => {
  return user.role === 'freelancer' || user.role === 'freelance'
}

export const isValidMessage = (message: any): message is Message => {
  return (
    message &&
    typeof message._id === 'string' &&
    typeof message.conversationId === 'string' &&
    typeof message.senderId === 'string' &&
    typeof message.content === 'string' &&
    typeof message.createdAt === 'string'
  )
}

export const isValidConversation = (conversation: any): conversation is Conversation => {
  return (
    conversation &&
    typeof conversation._id === 'string' &&
    Array.isArray(conversation.participants) &&
    conversation.participants.every((p: any) => 
      p && typeof p._id === 'string' && typeof p.name === 'string'
    )
  )
}

export const isValidUser = (user: any): user is User => {
  return (
    user &&
    typeof user._id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string'
  )
}

// 🔥 DEFAULT VALUES FOR SAFE INITIALIZATION

export const DEFAULT_MESSAGE_PREFERENCES: MessagePreferences = {
  // Notifications
  soundEnabled: true,
  desktopNotifications: true,
  vibration: true,
  
  // Message Behavior
  enterToSend: true,
  markAsReadOnOpen: true,
  showTypingIndicators: true,
  showReadReceipts: true,
  showOnlineStatus: true,
  
  // Appearance
  theme: 'auto',
  fontSize: 'medium',
  bubbleStyle: 'default',
  
  // Privacy
  lastSeen: 'contacts',
  profilePhoto: 'contacts',
  readReceipts: 'contacts',
  
  // Storage
  autoDownloadMedia: true,
  saveToCameraRoll: false,
  backupMessages: true,
  
  // Performance
  lowDataMode: false,
  autoPlayGifs: true,
  previewLinks: true
}

export const createEmptyMessage = (overrides: Partial<Message> = {}): Message => ({
  _id: `temp-${Date.now()}`,
  conversationId: '',
  senderId: '',
  content: '',
  read: false,
  createdAt: new Date().toISOString(),
  isAIMessage: false,
  type: 'text',
  status: 'sending',
  ...overrides
})

export const createEmptyConversation = (overrides: Partial<Conversation> = {}): Conversation => ({
  _id: '',
  participants: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  unreadCount: 0,
  isGroup: false,
  ...overrides
})

// 🔥 UTILITY TYPES FOR BETTER DEVELOPER EXPERIENCE


export type MessageType = Message['type']
export type ConversationType = Conversation['type']
export type UserRole = User['role']
export type ThemePreference = MessagePreferences['theme']

// 🔥 API RESPONSE TYPES

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ConversationsResponse {
  conversations: Conversation[]
}

export interface MessagesResponse {
  messages: Message[]
  hasMore: boolean
  nextCursor?: string
}

export interface UserSearchResponse {
  users: User[]
  total: number
}