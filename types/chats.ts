// types/chat.ts
export interface User {
  _id: string
  name: string
  avatar?: string
  isOnline?: boolean
  lastSeen?: string
}

export interface Message {
  _id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
  read: boolean
  type?: 'text' | 'image' | 'file'
}

export interface Conversation {
  _id: string
  participants: User[]
  lastMessage?: string
  updatedAt: string
  unreadCount: number
  isAIConversation?: boolean
}