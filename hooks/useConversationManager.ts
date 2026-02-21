// hooks/useConversationManager.ts - ENHANCED & SAFE VERSION
import { useState, useCallback, useRef } from "react"
import { Conversation, Message } from "@/types/chat"

export const useConversationManager = () => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  
  const messagesCache = useRef<Map<string, Message[]>>(new Map())

  // 🔥 FIX: Safe cache operations
  const cacheMessages = useCallback((conversationId: string, newMessages: Message[]) => {
    if (!conversationId) {
      console.warn('⚠️ Attempted to cache messages without conversationId')
      return
    }
    messagesCache.current.set(conversationId, newMessages)
  }, [])

  const getCachedMessages = useCallback((conversationId: string): Message[] => {
    if (!conversationId) {
      console.warn('⚠️ Attempted to get cached messages without conversationId')
      return []
    }
    return messagesCache.current.get(conversationId) || []
  }, [])

  // 🔥 FIX: Safe conversation selection with validation
  const selectConversation = useCallback((conversationId: string | null) => {
    console.log('🔄 Changement conversation:', { from: selectedConversationId, to: conversationId })
    
    setSelectedConversationId(conversationId)
    
    if (conversationId) {
      try {
        const cachedMessages = getCachedMessages(conversationId)
        setMessages(cachedMessages)
        
        // Marquer comme lu - safely
        setConversations(prev => 
          prev.map(conv => 
            conv?._id === conversationId 
              ? { ...conv, unreadCount: 0 }
              : conv
          ).filter(Boolean) as Conversation[]
        )
      } catch (error) {
        console.error('❌ Error selecting conversation:', error)
        setMessages([])
      }
    } else {
      setMessages([])
    }
  }, [selectedConversationId, getCachedMessages])

  // 🔥 FIX: Safe message updates with validation
  const updateMessages = useCallback((conversationId: string, newMessages: Message[]) => {
    if (!conversationId) {
      console.error('❌ Cannot update messages: missing conversationId')
      return
    }

    if (!Array.isArray(newMessages)) {
      console.error('❌ Cannot update messages: newMessages is not an array')
      return
    }

    console.log('💾 Cache messages:', conversationId, newMessages.length)
    
    try {
      cacheMessages(conversationId, newMessages)
      
      if (conversationId === selectedConversationId) {
        setMessages(newMessages)
      }
    } catch (error) {
      console.error('❌ Error updating messages:', error)
    }
  }, [cacheMessages, selectedConversationId])

  // 🔥 FIX: Safe message addition with comprehensive validation
  const addMessage = useCallback((message: Message) => {
    if (!message?.conversationId) {
      console.error('❌ Cannot add message: missing conversationId', message)
      return
    }

    const conversationId = message.conversationId
    
    try {
      const currentMessages = getCachedMessages(conversationId)
      
      // Vérifier si le message existe déjà
      const exists = currentMessages.some(msg => msg._id === message._id)
      if (exists) {
        console.log('📝 Message déjà présent, mise à jour')
        const updatedMessages = currentMessages.map(msg => 
          msg._id === message._id ? message : msg
        )
        cacheMessages(conversationId, updatedMessages)
        if (conversationId === selectedConversationId) {
          setMessages(updatedMessages)
        }
      } else {
        console.log('➕ Nouveau message ajouté')
        const updatedMessages = [...currentMessages, message]
        cacheMessages(conversationId, updatedMessages)
        if (conversationId === selectedConversationId) {
          setMessages(updatedMessages)
        }
      }
      
      // 🔥 FIX: Safe conversation update with error handling
      setConversations(prev => {
        try {
          const updated = prev.map(conv => {
            if (!conv || !conv._id) return conv
            
            if (conv._id === conversationId) {
              return {
                ...conv,
                lastMessage: message.content?.substring(0, 100) || 'Nouveau message',
                updatedAt: new Date().toISOString(),
                unreadCount: conv._id === selectedConversationId ? 0 : (conv.unreadCount || 0) + 1
              }
            }
            return conv
          }).filter(Boolean) as Conversation[]
          
          // Safe sorting
          return updated.sort((a, b) => {
            try {
              const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime()
              const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime()
              return dateB - dateA
            } catch (error) {
              console.warn('⚠️ Error sorting conversations:', error)
              return 0
            }
          })
        } catch (error) {
          console.error('❌ Error updating conversations:', error)
          return prev // Return previous state on error
        }
      })
    } catch (error) {
      console.error('❌ Error adding message:', error)
    }
  }, [cacheMessages, getCachedMessages, selectedConversationId])

  // 🔥 NEW: Safe conversation removal
  const removeConversation = useCallback((conversationId: string) => {
    if (!conversationId) {
      console.error('❌ Cannot remove conversation: missing conversationId')
      return
    }

    try {
      // Remove from cache
      messagesCache.current.delete(conversationId)
      
      // Remove from conversations list
      setConversations(prev => prev.filter(conv => conv._id !== conversationId))
      
      // Clear messages if this was the selected conversation
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null)
        setMessages([])
      }
    } catch (error) {
      console.error('❌ Error removing conversation:', error)
    }
  }, [selectedConversationId])

  // 🔥 NEW: Safe conversation update
  const updateConversation = useCallback((conversationId: string, updates: Partial<Conversation>) => {
    if (!conversationId) {
      console.error('❌ Cannot update conversation: missing conversationId')
      return
    }

    setConversations(prev => 
      prev.map(conv => 
        conv._id === conversationId 
          ? { ...conv, ...updates, updatedAt: new Date().toISOString() }
          : conv
      )
    )
  }, [])

  // 🔥 NEW: Clear all data (for logout scenarios)
  const clearAll = useCallback(() => {
    try {
      messagesCache.current.clear()
      setConversations([])
      setSelectedConversationId(null)
      setMessages([])
      setIsLoading(true)
      setIsSending(false)
    } catch (error) {
      console.error('❌ Error clearing conversation manager:', error)
    }
  }, [])

  // 🔥 NEW: Safe message removal
  const removeMessage = useCallback((conversationId: string, messageId: string) => {
    if (!conversationId || !messageId) {
      console.error('❌ Cannot remove message: missing conversationId or messageId')
      return
    }

    try {
      const currentMessages = getCachedMessages(conversationId)
      const updatedMessages = currentMessages.filter(msg => msg._id !== messageId)
      
      cacheMessages(conversationId, updatedMessages)
      
      if (conversationId === selectedConversationId) {
        setMessages(updatedMessages)
      }
    } catch (error) {
      console.error('❌ Error removing message:', error)
    }
  }, [cacheMessages, getCachedMessages, selectedConversationId])

  // 🔥 NEW: Get conversation by ID safely
  const getConversation = useCallback((conversationId: string): Conversation | null => {
    if (!conversationId) return null
    return conversations.find(conv => conv._id === conversationId) || null
  }, [conversations])

  return {
    // State
    conversations,
    selectedConversationId,
    messages,
    isLoading,
    isSending,
    
    // Setters
    setConversations,
    setIsLoading,
    setIsSending,
    setMessages,
    
    // 🔥 ENHANCED: Core methods with safety
    selectConversation,
    updateMessages,
    addMessage,
    getCachedMessages,
    
    // 🔥 NEW: Additional safe methods
    removeConversation,
    updateConversation,
    clearAll,
    removeMessage,
    getConversation
  }
}