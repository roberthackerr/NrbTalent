// hooks/useSimpleMessaging.ts
import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function useSimpleMessaging() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Connect to WebSocket
  useEffect(() => {
    if (!session?.user) return

    const websocket = new WebSocket('ws://localhost:3001/api/ws')
    
    websocket.onopen = () => {
      console.log('✅ Connected to WebSocket')
      setIsConnected(true)
      
      // Authenticate
      websocket.send(JSON.stringify({
        type: 'AUTH',
        data: { userId: (session.user as any).id },
        messageId: 'auth-' + Date.now()
      }))
    }

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      handleWebSocketMessage(message)
    }

    websocket.onclose = () => {
      console.log('🔴 WebSocket disconnected')
      setIsConnected(false)
    }

    setWs(websocket)

    return () => {
      websocket.close()
    }
  }, [session])

  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'AUTH_SUCCESS':
        loadConversations()
        break
        
      case 'CONVERSATIONS_FETCHED':
        setConversations(message.data.conversations || [])
        break
        
      case 'MESSAGES_FETCHED':
        setMessages(message.data.messages || [])
        break
        
      case 'NEW_MESSAGE':
        if (message.data.conversationId === selectedConversation) {
          setMessages(prev => [...prev, message.data])
        }
        // Update conversation list
        setConversations(prev => 
          prev.map(conv => 
            conv._id === message.data.conversationId 
              ? { ...conv, lastMessage: message.data.content, updatedAt: new Date().toISOString() }
              : conv
          ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        )
        break
        
      case 'MESSAGE_SENT':
        // Remove temp message and replace with real one
        setMessages(prev => 
          prev.map(msg => 
            msg._id === message.data.tempId 
              ? { ...msg, _id: message.data.messageId, createdAt: message.data.createdAt }
              : msg
          )
        )
        break
    }
  }, [selectedConversation])

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations')
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }, [])

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) return
    
    try {
      const response = await fetch(`/api/messages?conversationId=${conversationId}`)
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !selectedConversation || !ws) return

    const conversation = conversations.find(c => c._id === selectedConversation)
    if (!conversation) return

    const receiver = conversation.participants.find((p: any) => p._id !== (session?.user as any).id)
    if (!receiver) return

    // Create temporary message for instant display
    const tempId = 'temp-' + Date.now()
    const tempMessage = {
      _id: tempId,
      conversationId: selectedConversation,
      senderId: (session?.user as any).id,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      read: false
    }

    setMessages(prev => [...prev, tempMessage])

    // Send via WebSocket
    ws.send(JSON.stringify({
      type: 'SEND_MESSAGE',
      data: {
        conversationId: selectedConversation,
        receiverId: receiver._id,
        content: content.trim(),
        tempId
      },
      messageId: 'send-' + Date.now()
    }))
  }, [selectedConversation, conversations, ws, session])

  const selectConversation = useCallback((conversationId: string) => {
    setSelectedConversation(conversationId)
    loadMessages(conversationId)
    // Update URL
    window.history.pushState({}, '', `/messages/${conversationId}`)
  }, [loadMessages])

  const createConversation = useCallback(async (userId: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantIds: [userId] })
      })

      if (response.ok) {
        const data = await response.json()
        await loadConversations()
        selectConversation(data.conversation._id)
        return data.conversation
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }, [loadConversations, selectConversation])

  return {
    conversations,
    messages,
    selectedConversation,
    isLoading,
    isConnected,
    sendMessage,
    selectConversation,
    createConversation,
    loadConversations
  }
}