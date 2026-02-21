// hooks/useMessageManager.ts
import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Conversation, Message, User } from "@/types/chat"

export const useMessageManager = (session: any) => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pendingRequestsRef = useRef(new Map<string, (value: any) => void>())

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }, [])

  const selectedConv = useMemo(() => 
    conversations.find(c => c._id === selectedConversation),
    [conversations, selectedConversation]
  )

  const otherParticipant = useMemo(() => 
    selectedConv?.participants.find(p => p._id !== (session?.user as any)?.id),
    [selectedConv, session]
  )

  // WebSocket message sender
  const sendWebSocketMessage = useCallback((type: string, data: any, messageId?: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const ws = (window as any).wsRef?.current
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket non connecté'))
        return
      }

      const msgId = messageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const message = {
        type,
        data,
        messageId: msgId
      }

      console.log(`📤 [FRONT] Envoi WebSocket: ${type}`, data)

      pendingRequestsRef.current.set(msgId, resolve)

      const timeout = setTimeout(() => {
        if (pendingRequestsRef.current.has(msgId)) {
          console.log(`⏰ Timeout requête: ${msgId}`)
          pendingRequestsRef.current.delete(msgId)
          reject(new Error(`Timeout WebSocket: ${type}`))
        }
      }, 10000)

      try {
        ws.send(JSON.stringify(message))
      } catch (error) {
        console.error('❌ Erreur envoi WebSocket:', error)
        clearTimeout(timeout)
        pendingRequestsRef.current.delete(msgId)
        reject(new Error('Erreur envoi message'))
      }
    })
  }, [])

  // Handle incoming WebSocket responses
  const handleWebSocketResponse = useCallback((message: any) => {
    if (message.messageId && pendingRequestsRef.current.has(message.messageId)) {
      const resolve = pendingRequestsRef.current.get(message.messageId)!
      pendingRequestsRef.current.delete(message.messageId)
      resolve(message.data)
    }
  }, [])

  // 🔥 CORRECTION : Charger les messages quand une conversation est sélectionnée
  useEffect(() => {
    if (selectedConversation && session?.user) {
      console.log(`🎯 Chargement automatique des messages pour: ${selectedConversation}`)
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation, session])

  // Fetch conversations via WebSocket
  const fetchConversations = useCallback(async () => {
    setIsLoading(true)
    try {
      await sendWebSocketMessage('GET_CONVERSATIONS', {})
    } catch (error) {
      console.error('Erreur chargement conversations:', error)
      toast.error('Impossible de charger les conversations')
      setIsLoading(false)
    }
  }, [sendWebSocketMessage])

  // Fetch messages via WebSocket
// hooks/useMessageManager.ts - Ajoutez cette fonction
const fetchMessages = useCallback(async (conversationId: string) => {
  console.log(`📨 Chargement messages pour: ${conversationId}`)
  try {
    await sendWebSocketMessage('GET_MESSAGES', { conversationId })
    
    // 🔥 Ajouter un timeout de secours
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout chargement messages')), 10000)
    })
    
    await Promise.race([
      sendWebSocketMessage('GET_MESSAGES', { conversationId }),
      timeoutPromise
    ])
    
  } catch (error: any) {
    console.error('❌ Erreur chargement messages:', error)
    
    // 🔥 CORRECTION : Meilleure gestion des erreurs
    if (error.message.includes('Timeout') || error.message.includes('WebSocket non connecté')) {
      toast.error("Problème de connexion - Réessayez")
    } else {
      toast.error("Erreur lors du chargement des messages")
    }
    
    // 🔥 Optionnel : Fallback vers API REST si WebSocket échoue
    try {
      console.log('🔄 Fallback vers API REST pour messages')
      const response = await fetch(`/api/messages?conversationId=${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        scrollToBottom()
        console.log(`✅ ${data.messages?.length} messages chargés via API REST`)
      }
    } catch (fallbackError) {
      console.error('❌ Erreur fallback REST:', fallbackError)
    }
  }
}, [sendWebSocketMessage, scrollToBottom])

  // Optimistic message sending with WebSocket
  const sendMessage = useCallback(async (content: string, conversationId: string) => {
    if (!content.trim() || !session?.user) {
      throw new Error("Message vide ou utilisateur non connecté")
    }

    const selectedConv = conversations.find(c => c._id === conversationId)
    if (!selectedConv) {
      throw new Error("Conversation non trouvée")
    }

    const receiver = selectedConv.participants.find(p => p._id !== (session.user as any).id)
    if (!receiver) {
      throw new Error("Destinataire non trouvé")
    }

    setIsSending(true)
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const originalMessage = content

    try {
      // Create optimistic message
      const optimisticMessage: Message = {
        _id: tempId,
        conversationId,
        senderId: (session.user as any).id,
        receiverId: receiver._id,
        content: content.trim(),
        read: false,
        createdAt: new Date().toISOString(),
        status: 'sending'
      }

      // Add optimistic message to UI
      setMessages(prev => [...prev, optimisticMessage])
      scrollToBottom()

      // Send via WebSocket
      await sendWebSocketMessage('SEND_MESSAGE', {
        conversationId,
        receiverId: receiver._id,
        content: content.trim(),
        tempId: tempId
      })

    } catch (error: any) {
      console.error("❌ Erreur envoi message:", error)
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempId))
      
      toast.error("Erreur envoi message - Réessayez")
      throw error
    } finally {
      setIsSending(false)
    }
  }, [conversations, session, sendWebSocketMessage, scrollToBottom])

  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await sendWebSocketMessage('MARK_AS_READ', { conversationId })
      
      setConversations(prev => 
        prev.map(conv => 
          conv._id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      )
    } catch (error) {
      console.error('Erreur marquage lu:', error)
    }
  }, [sendWebSocketMessage])

  return {
    conversations,
    messages,
    selectedConversation,
    setSelectedConversation,
    isLoading,
    setIsLoading,
    isSending,
    selectedConv,
    otherParticipant,
    messagesEndRef,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markAsRead,
    setConversations,
    setMessages,
    scrollToBottom,
    handleWebSocketResponse,
    sendWebSocketMessage
  }
}