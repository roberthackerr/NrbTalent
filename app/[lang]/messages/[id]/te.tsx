// app/messages/[id]/page.tsx - VERSION ULTRA-CORRIGÉE - TOUTES ANOMALIES RÉSOLUES
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"

// Components
import { ConnectionStatus } from "@/components/ConnectionStatus"
import { MessageBubble } from "@/components/MessageBubble"
import { ConversationsSidebar } from "@/components/ConversationsSidebar"
import { ChatHeader } from "@/components/ChatHeader"
import { MessageInput } from "@/components/MessageInput"
import { NewConversationModal } from "@/components/NewConversationModal"
import { DeleteConversationModal } from "@/components/DeleteConversationModal"
import { TypingIndicator } from "@/components/TypingIndicator"
import { MessageSettings } from "@/components/MessageSettings"

// Hooks
import { useWebSocketManager } from "@/hooks/useWebSocket"
import { useConversationManager } from "@/hooks/useConversationManager"
import { useTypingManager } from "@/hooks/useTypingManager"
import { useMessagePreferences } from "@/hooks/useMessagePreferences"

// Types
import { Conversation, Message, User } from "@/types/chat"

export default function ConversationPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const params = useParams()
  const conversationId = params?.id as string | undefined
  
  const conversationManager = useConversationManager()
  const typingManager = useTypingManager()
  const messagePreferences = useMessagePreferences()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // 🔥 FIX: Références de contrôle
  const hasLoadedInitialConversations = useRef(false)
  const hasOpenedUrlConversation = useRef(false)
  const isLoadingMessages = useRef(false)
  const lastSelectedConversation = useRef<string | null>(null)

  // 🔥 FIX: Scroll sécurisé et optimisé
  const scrollToBottom = useCallback((force: boolean = false) => {
    if (!messagesEndRef.current) return
    
    try {
      if (force) {
        messagesEndRef.current.scrollIntoView({ behavior: "auto" })
      } else {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 100)
      }
    } catch (error) {
      console.log('Scroll error (non-critical):', error)
    }
  }, [])

  // 🔥 FIX: Chargement des conversations STABLE
  const fetchConversations = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return
    
    try {
      console.log('🔄 Chargement conversations...')
      const response = await fetch("/api/conversations", {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      const conversations = data.conversations || []
      console.log('✅ Conversations chargées:', conversations.length)
      
      conversationManager.setConversations(conversations)
      conversationManager.setIsLoading(false)
      
      // 🔥 FIX: Ouvrir la conversation URL UNE SEULE FOIS
      if (conversationId && conversations.length > 0 && !hasOpenedUrlConversation.current) {
        const targetConversation = conversations.find(
          (conv: Conversation) => conv._id === conversationId
        )
        
        if (targetConversation) {
          console.log('🎯 Ouverture conversation URL:', conversationId)
          hasOpenedUrlConversation.current = true
          conversationManager.selectConversation(conversationId)
          setTimeout(() => fetchMessages(conversationId), 200)
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement conversations:', error)
      toast.error('Impossible de charger les conversations')
      conversationManager.setIsLoading(false)
    }
  }, [sessionStatus, conversationId])

  // 🔥 FIX: Chargement des messages ROBUSTE avec gestion du cache
  const fetchMessages = useCallback(async (convId: string) => {
    if (!convId || sessionStatus !== 'authenticated') {
      console.log('⏳ Fetch messages skipped - no ID or not authenticated')
      return
    }

    // 🔥 Éviter les chargements multiples simultanés
    if (isLoadingMessages.current) {
      console.log('⏳ Chargement déjà en cours, skip')
      return
    }

    isLoadingMessages.current = true
    console.log('🔄 Chargement messages pour:', convId)
    
    try {
      const response = await fetch(`/api/messages?conversationId=${convId}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      const messages = data.messages || []
      console.log('✅ Messages chargés:', messages.length)
      
      // 🔥 FIX: Mise à jour synchrone du cache ET de l'état
      conversationManager.updateMessages(convId, messages)
      
      // Scroll forcé après chargement initial
      setTimeout(() => scrollToBottom(true), 100)
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error)
      toast.error('Erreur lors du chargement des messages')
    } finally {
      isLoadingMessages.current = false
    }
  }, [sessionStatus, conversationManager, scrollToBottom])

  // 🔥 FIX: Handlers de typing SANS fuites mémoire
  const handleTypingStart = useCallback(() => {
    if (!conversationManager.selectedConversationId || !session?.user) return
    
    try {
      const ws = (window as any).wsRef?.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return

      ws.send(JSON.stringify({
        type: 'TYPING_START',
        data: { conversationId: conversationManager.selectedConversationId },
        messageId: `typing-${Date.now()}`
      }))
    } catch (error) {
      console.log('Typing start error (non-critical):', error)
    }
  }, [conversationManager.selectedConversationId, session])

  const handleTypingStop = useCallback(() => {
    if (!conversationManager.selectedConversationId || !session?.user) return
    
    try {
      const ws = (window as any).wsRef?.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return

      ws.send(JSON.stringify({
        type: 'TYPING_STOP',
        data: { conversationId: conversationManager.selectedConversationId },
        messageId: `typing-stop-${Date.now()}`
      }))
    } catch (error) {
      console.log('Typing stop error (non-critical):', error)
    }
  }, [conversationManager.selectedConversationId, session])

  // 🔥 FIX: Handler WebSocket ULTRA-ROBUSTE
  const handleWebSocketMessage = useCallback((message: any) => {
    if (!message?.type) return
    
    console.log('📨 WebSocket:', message.type)
    
    try {
      switch (message.type) {
        case 'AUTH_SUCCESS':
          console.log('✅ Auth WebSocket OK')
          break
          
        case 'CONVERSATIONS_FETCHED':
          const conversations = message.data?.conversations || []
          console.log('✅ Conversations WS:', conversations.length)
          conversationManager.setConversations(conversations)
          conversationManager.setIsLoading(false)
          break

        case 'MESSAGES_FETCHED':
          const msgs = message.data?.messages || []
          const cId = message.data?.conversationId
          
          if (!cId) break
          
          console.log('✅ Messages WS pour:', cId, msgs.length)
          conversationManager.updateMessages(cId, msgs)
          scrollToBottom(true)
          break
          
        case 'NEW_MESSAGE':
          const newMsg = message.data
          if (!newMsg?.conversationId || !newMsg._id) break
          
          console.log('🆕 NEW MESSAGE:', {
            id: newMsg._id,
            conv: newMsg.conversationId,
            active: conversationManager.selectedConversationId,
            isAI: newMsg.isAIMessage
          })
          
          // 🔥 FIX: Ajouter le message immédiatement
          conversationManager.addMessage(newMsg)
          
          if (newMsg.conversationId === conversationManager.selectedConversationId) {
            console.log('✅ Message pour conversation active')
            scrollToBottom()
            
            // Marquer comme lu
            conversationManager.updateConversation(newMsg.conversationId, {
              unreadCount: 0,
              lastMessage: newMsg.content,
              updatedAt: new Date().toISOString()
            })
          } else {
            console.log('📭 Message pour autre conversation')
            // Incrémenter unread count
            const conv = conversationManager.getConversation(newMsg.conversationId)
            if (conv) {
              conversationManager.updateConversation(newMsg.conversationId, {
                unreadCount: (conv.unreadCount || 0) + 1,
                lastMessage: newMsg.content,
                updatedAt: new Date().toISOString()
              })
            }
          }
          break

        case 'MESSAGE_SENT':
          const sentMsg = message.data
          if (!sentMsg?.conversationId || !sentMsg?.tempId) break
          
          console.log('✅ Message envoyé confirmé:', sentMsg.tempId, '→', sentMsg.messageId)
          
          // 🔥 FIX: Remplacer le message temporaire par le message confirmé
          const currentMsgs = conversationManager.getCachedMessages(sentMsg.conversationId)
          const updatedMsgs = currentMsgs.map(msg => 
            msg._id === sentMsg.tempId
              ? { 
                  ...msg, 
                  _id: sentMsg.messageId,
                  createdAt: sentMsg.createdAt || msg.createdAt
                }
              : msg
          )
          conversationManager.updateMessages(sentMsg.conversationId, updatedMsgs)
          break

        case 'USER_TYPING':
          if (!message.data?.conversationId || !message.data?.userId) break
          
          typingManager.startTyping(
            message.data.conversationId,
            message.data.userId,
            message.data.userName || 'Utilisateur'
          )
          break

        case 'USER_STOPPED_TYPING':
          if (!message.data?.conversationId) break
          typingManager.stopTyping(message.data.conversationId)
          break

        case 'ERROR':
          console.error('❌ Erreur WebSocket:', message.data)
          toast.error(message.data?.message || 'Erreur de connexion')
          break
      }
    } catch (error) {
      console.error('❌ Erreur traitement message WS:', error)
    }
  }, [conversationManager, scrollToBottom, typingManager])

  const wsManager = useWebSocketManager(handleWebSocketMessage)

  // 🔥 FIX: Sélection de conversation ULTRA-STABLE
  const handleSelectConversation = useCallback((convId: string) => {
    if (!convId) {
      console.error('❌ ID conversation invalide')
      return
    }
    
    // 🔥 Éviter de recharger la même conversation
    if (lastSelectedConversation.current === convId) {
      console.log('⏭️ Même conversation déjà sélectionnée')
      return
    }
    
    console.log('🎯 Sélection conversation:', convId)
    lastSelectedConversation.current = convId
    
    // Cleanup
    typingManager.cleanup()
    
    // 🔥 FIX: Ne PAS vider les messages immédiatement (évite le flash)
    // Les messages seront écrasés par fetchMessages
    conversationManager.selectConversation(convId)
    
    // Update URL
    try {
      window.history.pushState({}, '', `/messages/${convId}`)
    } catch (error) {
      console.log('History push error (non-critical):', error)
    }
    
    // Charger les messages après un délai minimal
    setTimeout(() => {
      fetchMessages(convId)
    }, 50)
  }, [conversationManager, typingManager, fetchMessages])

  // 🔥 FIX: Envoi message STANDARD robuste
  const handleSendMessage = useCallback(async (content: string, convId: string) => {
    if (!content.trim() || !session?.user) {
      throw new Error("Message vide ou utilisateur non connecté")
    }

    const conversation = conversationManager.getConversation(convId)
    if (!conversation) {
      throw new Error("Conversation non trouvée")
    }

    const receiver = conversation.participants.find(p => p._id !== (session.user as any).id)
    if (!receiver) {
      throw new Error("Destinataire non trouvé")
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const tempMessage: Message = {
      _id: tempId,
      conversationId: convId,
      senderId: (session.user as any).id,
      receiverId: receiver._id,
      content: content.trim(),
      read: false,
      createdAt: new Date().toISOString(),
      isAIMessage: false
    }

    // 🔥 FIX: Ajouter immédiatement à l'UI
    conversationManager.addMessage(tempMessage)
    scrollToBottom()

    try {
      const ws = (window as any).wsRef?.current
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket non connecté')
      }

      ws.send(JSON.stringify({
        type: 'SEND_MESSAGE',
        data: {
          conversationId: convId,
          receiverId: receiver._id,
          content: content.trim(),
          tempId: tempId
        },
        messageId: `send-${Date.now()}`
      }))

    } catch (error: any) {
      console.error("❌ Erreur envoi message:", error)
      // Retirer le message temporaire en cas d'erreur
      conversationManager.removeMessage(convId, tempId)
      toast.error("Erreur envoi message - Réessayez")
      throw error
    }
  }, [conversationManager, session, scrollToBottom])

  // 🔥 FIX: Envoi message AI ULTRA-ROBUSTE
  const handleSendAIMessage = useCallback(async (content: string, convId: string) => {
    if (!content.trim() || !session?.user) {
      throw new Error("Message vide ou utilisateur non connecté")
    }

    const conversation = conversationManager.getConversation(convId)
    if (!conversation) {
      throw new Error("Conversation non trouvée")
    }

    const otherParticipant = conversation.participants.find(p => p._id !== (session.user as any).id)
    const tempId = `temp-ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Message temporaire utilisateur
    const tempUserMessage: Message = {
      _id: tempId,
      conversationId: convId,
      senderId: (session.user as any).id,
      receiverId: otherParticipant?._id || 'ai-assistant',
      content: content.trim(),
      read: false,
      createdAt: new Date().toISOString(),
      isAIMessage: false
    }
    
    // 🔥 FIX: Ajouter immédiatement
    conversationManager.addMessage(tempUserMessage)
    scrollToBottom()

    try {
      const response = await fetch('/api/ai/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          conversationId: convId,
          conversationType: 'general'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'AI API call failed')
      }

      const data = await response.json()
      
      // 🔥 FIX: Remplacer le message temporaire par le message confirmé
      conversationManager.removeMessage(convId, tempId)

      // Message utilisateur confirmé
      const confirmedUserMessage: Message = {
        _id: data.userMessage?.messageId || `user-${Date.now()}`,
        conversationId: convId,
        senderId: (session.user as any).id,
        receiverId: otherParticipant?._id || 'ai-assistant',
        content: content.trim(),
        read: false,
        createdAt: data.userMessage?.createdAt || new Date().toISOString(),
        isAIMessage: false
      }
      conversationManager.addMessage(confirmedUserMessage)

      // Message AI
      const aiMessage: Message = {
        _id: data.response?.messageId || `ai-${Date.now()}`,
        conversationId: convId,
        senderId: data.response?.aiUser?._id || 'ai-assistant',
        receiverId: (session.user as any).id,
        content: data.response?.content || 'Désolé, je n\'ai pas pu générer de réponse.',
        read: false,
        createdAt: data.response?.createdAt || new Date().toISOString(),
        isAIMessage: true,
        aiUser: data.response?.aiUser
      }
      conversationManager.addMessage(aiMessage)
      
      scrollToBottom()
      return data

    } catch (error: any) {
      console.error("❌ Erreur envoi message AI:", error)
      conversationManager.removeMessage(convId, tempId)
      toast.error("Erreur avec l'assistant AI - Réessayez")
      throw error
    }
  }, [conversationManager, session, scrollToBottom])

  // 🔥 FIX: Création conversation AI
  const createAIConversation = useCallback(async () => {
    if (sessionStatus !== 'authenticated') {
      toast.error('Veuillez vous connecter d\'abord')
      return
    }

    try {
      // Vérifier si une conversation AI existe déjà
      const existingAIConv = conversationManager.conversations.find(conv => 
        conv.isAIConversation || conv.participants?.some(p => p.role === "ai_assistant")
      )

      if (existingAIConv) {
        handleSelectConversation(existingAIConv._id)
        toast.success("Conversation AI rouverte !")
        return
      }

      const response = await fetch('/api/ai/chat-assistant', {
        method: 'PUT'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.conversation?._id) {
        throw new Error('Réponse API invalide')
      }
      
      // Recharger les conversations
      await fetchConversations()
      
      // Sélectionner la nouvelle conversation
      handleSelectConversation(data.conversation._id)
      toast.success("Conversation AI créée !")
      
      // Message de bienvenue après un délai
      setTimeout(() => {
        const welcomeMessage: Message = {
          _id: `ai-welcome-${Date.now()}`,
          conversationId: data.conversation._id,
          senderId: data.aiUser?._id || 'ai-assistant',
          receiverId: (session.user as any).id,
          content: "👋 Bonjour ! Je suis votre assistant AI NRBTalents. Je peux vous aider à améliorer vos briefs projets, répondre à vos questions sur la plateforme, et vous conseiller dans vos communications. Comment puis-je vous aider aujourd'hui ?",
          read: false,
          createdAt: new Date().toISOString(),
          isAIMessage: true,
          aiUser: data.aiUser
        }
        conversationManager.addMessage(welcomeMessage)
        scrollToBottom()
      }, 500)
      
    } catch (error) {
      console.error("Erreur création conversation AI:", error)
      toast.error("Erreur lors de la création de la conversation AI")
    }
  }, [conversationManager, handleSelectConversation, fetchConversations, scrollToBottom, sessionStatus, session])

  // 🔥 FIX: Création conversation normale
  const createConversation = useCallback(async (user: User) => {
    if (!user?._id || sessionStatus !== 'authenticated') {
      toast.error('Données utilisateur invalides')
      return
    }

    try {
      const existingConv = conversationManager.conversations.find(conv => 
        conv.participants?.some(p => p._id === user._id)
      )

      if (existingConv) {
        router.push(`/messages/${existingConv._id}`)
        setShowNewConversation(false)
        setSearchQuery("")
        setSearchResults([])
        return
      }

      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantIds: [user._id] }),
      })

      if (response.ok) {
        const data = await response.json()
        setShowNewConversation(false)
        setSearchQuery("")
        setSearchResults([])
        await fetchConversations()
        router.push(`/messages/${data.conversation._id}`)
        toast.success("Conversation créée !")
      } else {
        throw new Error("Erreur création conversation")
      }
    } catch (error) {
      console.error("Erreur création conversation:", error)
      toast.error("Erreur lors de la création de la conversation")
    }
  }, [conversationManager, router, fetchConversations, sessionStatus])

  // Suppression conversation
  const deleteConversation = async (convId: string) => {
    if (!convId || sessionStatus !== 'authenticated') {
      toast.error('ID de conversation invalide')
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/conversations?conversationId=${convId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        conversationManager.removeConversation(convId)
        
        if (conversationManager.selectedConversationId === convId) {
          conversationManager.selectConversation(null)
          lastSelectedConversation.current = null
          router.push('/messages')
        }
        
        toast.success("Conversation supprimée")
        setShowDeleteModal(false)
        setConversationToDelete(null)
      } else {
        throw new Error("Erreur lors de la suppression")
      }
    } catch (error: any) {
      console.error("Erreur suppression:", error)
      toast.error(error.message || "Erreur lors de la suppression")
    } finally {
      setIsDeleting(false)
    }
  }

  // 🔥 Connexion WebSocket - UNE FOIS
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      wsManager.connect()
    } else if (sessionStatus === 'unauthenticated') {
      wsManager.cleanup()
      conversationManager.clearAll()
      typingManager.cleanup()
    }
  }, [sessionStatus, wsManager])

  // 🔥 Chargement initial - UNE FOIS
  useEffect(() => {
    if (sessionStatus === 'authenticated' && !hasLoadedInitialConversations.current) {
      console.log('🎯 Chargement initial...')
      hasLoadedInitialConversations.current = true
      fetchConversations()
    }
  }, [sessionStatus])

  // Recherche utilisateurs
  useEffect(() => {
    const searchUsers = async (query: string) => {
      if (!query.trim() || sessionStatus !== 'authenticated') {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          const filteredUsers = data.users?.filter((user: User) => 
            user._id !== (session?.user as any)?.id
          ) || []
          setSearchResults(filteredUsers)
        }
      } catch (error) {
        console.error("Erreur recherche:", error)
      } finally {
        setIsSearching(false)
      }
    }

    const timeoutId = setTimeout(() => searchUsers(searchQuery), 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, session, sessionStatus])

  // Contexte de conversation
  const selectedConversation = conversationManager.getConversation(
    conversationManager.selectedConversationId || ''
  )

  const otherParticipant = selectedConversation?.participants?.find(
    p => p._id !== (session?.user as any)?.id
  )

  const conversationContext = selectedConversation ? {
    conversationId: selectedConversation._id,
    participants: selectedConversation.participants || [],
    isAIConversation: selectedConversation.isAIConversation || otherParticipant?.role === 'ai_assistant',
    userId: (session?.user as any)?.id,
    userName: session?.user?.name,
    userEmail: session?.user?.email
  } : null

  // Rendu des messages
  const renderMessages = () => {
    if (!conversationManager.messages.length) return null

    return conversationManager.messages.map((msg, index) => {
      const isMe = msg.senderId === (session?.user as any)?.id
      const isAI = msg.isAIMessage || (otherParticipant?.role === 'ai_assistant' && !isMe)
      const showAvatar = index === 0 || 
        conversationManager.messages[index - 1]?.senderId !== msg.senderId
      
      return (
        <MessageBubble
          key={msg._id || `msg-${index}`}
          message={msg}
          isMe={isMe}
          isAI={isAI}
          showAvatar={showAvatar}
          userAvatar={otherParticipant?.avatar}
          userName={otherParticipant?.name}
          aiUser={msg.aiUser}
        />
      )
    })
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <ConnectionStatus 
        connectionStatus={wsManager.connectionStatus}
        reconnectAttempt={wsManager.reconnectAttempt}
        onReconnect={wsManager.reconnect}
      />

      <ConversationsSidebar
        conversations={conversationManager.conversations}
        selectedConversation={conversationManager.selectedConversationId}
        onSelectConversation={handleSelectConversation}
        isLoading={conversationManager.isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewConversation={() => setShowNewConversation(true)}
        onNewAIConversation={createAIConversation}
        onDeleteConversation={(conv, e) => {
          e?.stopPropagation?.()
          setConversationToDelete(conv)
          setShowDeleteModal(true)
        }}
        isConnected={wsManager.isConnected}
        session={session}
      />

      {selectedConversation ? (
        <div className="flex flex-1 flex-col">
          <ChatHeader
            onOpenSettings={() => setShowSettings(true)}
            conversation={selectedConversation}
            otherParticipant={otherParticipant}
            onRefresh={() => {
              if (conversationManager.selectedConversationId) {
                fetchMessages(conversationManager.selectedConversationId)
              }
            }}
            isConnected={wsManager.isConnected}
          />

          <div className="flex-1 overflow-hidden">
            {conversationManager.messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mb-6">
                  <div className="text-3xl">💬</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Aucun message
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                  {conversationContext?.isAIConversation 
                    ? "Demandez-moi de l'aide pour vos projets ou posez-moi vos questions !"
                    : "Envoyez le premier message pour commencer la conversation"
                  }
                </p>
              </div>
            ) : (
              <div className="h-full overflow-y-auto">
                <div className="p-6 space-y-4">
                  {renderMessages()}
                  
                  <TypingIndicator 
                    text={typingManager.getTypingText(conversationManager.selectedConversationId!)} 
                  />
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>

          <MessageInput
            onSendMessage={handleSendMessage}
            onSendAIMessage={handleSendAIMessage}
            selectedConversation={conversationManager.selectedConversationId}
            disabled={!wsManager.isConnected && !conversationContext?.isAIConversation}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            conversationContext={conversationContext}
            isConnected={wsManager.isConnected}
          />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center p-8">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="text-5xl">👋</div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {conversationManager.conversations.length === 0 ? "Bienvenue dans la messagerie" : "Sélectionnez une conversation"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
              {conversationManager.conversations.length === 0 
                ? "Commencez par créer une nouvelle conversation pour discuter avec vos contacts ou avec notre assistant AI"
                : "Choisissez une conversation dans la liste pour afficher les messages"
              }
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowNewConversation(true)}
                disabled={!wsManager.isConnected}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Nouvelle conversation
              </button>
              
              <button
                onClick={createAIConversation}
                className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-6 py-3 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
              >
                <span>🤖</span>
                Discuter avec l'AI
              </button>
            </div>
          </div>
        </div>
      )}

      <NewConversationModal
        isOpen={showNewConversation}
        onClose={() => {
          setShowNewConversation(false)
          setSearchQuery("")
          setSearchResults([])
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        onUserClick={createConversation}
      />

      <MessageSettings
        preferences={messagePreferences.preferences}
        onSave={messagePreferences.savePreferences}
        onReset={messagePreferences.resetPreferences}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <DeleteConversationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setConversationToDelete(null)
        }}
        conversation={conversationToDelete}
        onDelete={deleteConversation}
        isDeleting={isDeleting}
        session={session}
      />
    </div>
  )
}