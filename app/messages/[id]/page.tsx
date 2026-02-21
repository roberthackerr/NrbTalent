// app/messages/[id]/page.tsx - VERSION CORRIGÉE - BOUCLES INFINIES RÉSOLUES
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

// Hooks
import { useWebSocketManager } from "@/hooks/useWebSocket"
import { useConversationManager } from "@/hooks/useConversationManager"
import { useTypingManager } from "@/hooks/useTypingManager"

// Types
import { Conversation, Message, User } from "@/types/chat"
import { useMessagePreferences } from "@/hooks/useMessagePreferences"
import { MessageSettings } from "@/components/MessageSettings"

export default function ConversationPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const params = useParams()
  const conversationId = params?.id as string | undefined
  
  const conversationManager = useConversationManager()
  const typingManager = useTypingManager()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const messagePreferences = useMessagePreferences()

  // 🔥 FIX: Référence stable pour éviter les boucles
  const hasLoadedInitialConversations = useRef(false)
  const hasOpenedUrlConversation = useRef(false)

  // 🔥 FIX: Scroll sécurisé
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      try {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      } catch (error) {
        console.log('Scroll error (non-critical):', error)
      }
    }, 100)
  }, [])

  // 🔥 FIX: Chargement des conversations SANS dépendances dangereuses
  const fetchConversations = useCallback(async () => {
    if (sessionStatus !== 'authenticated') {
      console.log('⏳ En attente authentification...')
      return
    }
    
    try {
      console.log('🔄 Chargement conversations...')
      const response = await fetch("/api/conversations")
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Conversations chargées:', data.conversations?.length || 0)
      
      conversationManager.setConversations(data.conversations || [])
      conversationManager.setIsLoading(false)
      
      // 🔥 FIX: Ouvrir la conversation URL seulement UNE FOIS
      if (conversationId && data.conversations?.length > 0 && !hasOpenedUrlConversation.current) {
        const targetConversation = data.conversations.find(
          (conv: Conversation) => conv._id === conversationId
        )
        
        if (targetConversation) {
          console.log('🎯 Conversation trouvée dans URL, ouverture automatique:', conversationId)
          hasOpenedUrlConversation.current = true
          conversationManager.selectConversation(conversationId)
          // Charger les messages après un court délai
          setTimeout(() => {
            fetchMessages(conversationId)
          }, 100)
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement conversations:', error)
      if (conversationManager.conversations.length === 0) {
        toast.error('Impossible de charger les conversations')
      }
      conversationManager.setIsLoading(false)
    }
  }, [sessionStatus, conversationId]) // 🔥 RETIRER conversationManager des dépendances

  // 🔥 FIX: Chargement des messages avec validation
  const fetchMessages = useCallback(async (convId: string) => {
    if (!convId || sessionStatus !== 'authenticated') {
      console.log('⏳ Message fetch skipped - no conversation ID or not authenticated')
      return
    }

    console.log('🔄 Chargement messages pour:', convId)
    try {
      const response = await fetch(`/api/messages?conversationId=${convId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Messages chargés:', data.messages?.length || 0)
      
      conversationManager.updateMessages(convId, data.messages || [])
      scrollToBottom()
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error)
      toast.error('Erreur lors du chargement des messages')
    }
  }, [sessionStatus, scrollToBottom]) // 🔥 RETIRER conversationManager

  // 🔥 FIX: Handlers de typing sécurisés
  const handleTypingStart = useCallback(() => {
    if (!conversationManager.selectedConversationId || !session?.user) return
    
    try {
      const ws = (window as any).wsRef?.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return

      const message = {
        type: 'TYPING_START',
        data: {
          conversationId: conversationManager.selectedConversationId
        },
        messageId: `typing-${Date.now()}`
      }

      console.log('⌨️ Début typing envoyé')
      ws.send(JSON.stringify(message))
    } catch (error) {
      console.log('Typing start error (non-critical):', error)
    }
  }, [conversationManager.selectedConversationId, session])

  const handleTypingStop = useCallback(() => {
    if (!conversationManager.selectedConversationId || !session?.user) return
    
    try {
      const ws = (window as any).wsRef?.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return

      const message = {
        type: 'TYPING_STOP',
        data: {
          conversationId: conversationManager.selectedConversationId
        },
        messageId: `typing-stop-${Date.now()}`
      }

      console.log('💤 Arrêt typing envoyé')
      ws.send(JSON.stringify(message))
    } catch (error) {
      console.log('Typing stop error (non-critical):', error)
    }
  }, [conversationManager.selectedConversationId, session])

  // 🔥 FIX: Handler WebSocket robuste SANS boucles
  const handleWebSocketMessage = useCallback((message: any) => {
    if (!message?.type) {
      console.log('📨 Message WebSocket malformé:', message)
      return
    }
    
    console.log('📨 Message WebSocket:', message.type, message.data)
    
    try {
      switch (message.type) {
        case 'AUTH_SUCCESS':
          console.log('✅ Authentification WebSocket réussie')
          // 🔥 NE PAS appeler fetchConversations ici - cause des boucles
          break
          
        case 'CONVERSATIONS_FETCHED':
          console.log('✅ Conversations chargées:', message.data.conversations?.length)
          conversationManager.setConversations(message.data.conversations || [])
          conversationManager.setIsLoading(false)
          break

        case 'MESSAGES_FETCHED':
          const messages = message.data.messages || []
          const convId = message.data.conversationId
          
          if (!convId) {
            console.error('❌ Conversation ID manquant dans MESSAGES_FETCHED')
            break
          }
          
          console.log('✅ Messages chargés pour:', convId, messages.length)
          conversationManager.updateMessages(convId, messages)
          scrollToBottom()
          break
          
        case 'NEW_MESSAGE':
          const newMessage = message.data
          if (!newMessage?.conversationId) {
            console.error('❌ Message malformé dans NEW_MESSAGE:', newMessage)
            break
          }
          
          console.log('🆕 NOUVEAU MESSAGE:', {
            id: newMessage._id,
            conversationId: newMessage.conversationId,
            activeConversation: conversationManager.selectedConversationId,
            content: newMessage.content?.substring(0, 50)
          })
          
          if (newMessage.conversationId === conversationManager.selectedConversationId) {
            console.log('✅ MESSAGE POUR CONVERSATION ACTIVE')
            conversationManager.addMessage(newMessage)
            scrollToBottom()
            
            conversationManager.setConversations(prev => 
              prev.map(conv => 
                conv._id === newMessage.conversationId 
                  ? { ...conv, unreadCount: 0 }
                  : conv
              )
            )
          } else {
            console.log('📭 MESSAGE POUR AUTRE CONVERSATION')
            conversationManager.setConversations(prev => {
              const updated = prev.map(conv => 
                conv._id === newMessage.conversationId 
                  ? {
                      ...conv,
                      lastMessage: newMessage.content,
                      updatedAt: new Date().toISOString(),
                      unreadCount: (conv.unreadCount || 0) + 1
                    }
                  : conv
              )
              return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            })
          }
          break

        case 'MESSAGE_SENT':
          const sentMessage = message.data
          if (!sentMessage?.conversationId || !sentMessage?.tempId) {
            console.error('❌ Message malformé dans MESSAGE_SENT:', sentMessage)
            break
          }
          
          console.log('✅ Message envoyé confirmé:', sentMessage.tempId)
          
          conversationManager.updateMessages(
            sentMessage.conversationId,
            conversationManager.getCachedMessages(sentMessage.conversationId).map(msg => {
              if (msg._id === sentMessage.tempId) {
                return { 
                  ...msg, 
                  _id: sentMessage.messageId,
                  createdAt: sentMessage.createdAt
                }
              }
              return msg
            })
          )
          break

        case 'USER_TYPING':
          if (!message.data?.conversationId || !message.data?.userId) {
            console.error('❌ Données typing malformées:', message.data)
            break
          }
          
          console.log('⌨️ Utilisateur en train d\'écrire:', message.data)
          typingManager.startTyping(
            message.data.conversationId,
            message.data.userId,
            message.data.userName || 'Utilisateur'
          )
          break

        case 'USER_STOPPED_TYPING':
          if (!message.data?.conversationId) {
            console.error('❌ Données typing stop malformées:', message.data)
            break
          }
          
          console.log('💤 Utilisateur a arrêté d\'écrire:', message.data)
          typingManager.stopTyping(message.data.conversationId)
          break

        case 'ERROR':
          console.error('❌ Erreur WebSocket:', message.data)
          toast.error(message.data?.message || 'Erreur de connexion')
          break

        default:
          console.log('📨 Message non géré:', message.type)
      }
    } catch (error) {
      console.error('❌ Erreur traitement message WebSocket:', error)
    }
  }, [conversationManager, scrollToBottom, typingManager]) // 🔥 Dépendances correctes

  const wsManager = useWebSocketManager(handleWebSocketMessage)

  // 🔥 FIX: Sélection de conversation sécurisée
  const handleSelectConversation = useCallback((convId: string) => {
    if (!convId) {
      console.error('❌ ID de conversation invalide')
      return
    }
    
    console.log('🎯 Sélection conversation:', convId)
    
    typingManager.cleanup()
    
    conversationManager.setMessages([])
    conversationManager.selectConversation(convId)
    
    try {
      window.history.pushState({}, '', `/messages/${convId}`)
    } catch (error) {
      console.log('History push error (non-critical):', error)
    }
    
    setTimeout(() => {
      fetchMessages(convId)
    }, 10)
  }, [fetchMessages, typingManager]) // 🔥 RETIRER conversationManager

  // 🔥 FIX: Envoi de message sécurisé
  const handleSendMessage = useCallback(async (content: string, convId: string) => {
    if (!content.trim() || !session?.user) {
      throw new Error("Message vide ou utilisateur non connecté")
    }

    if (!convId) {
      throw new Error("ID de conversation invalide")
    }

    const conversation = conversationManager.conversations.find(c => c._id === convId)
    if (!conversation) {
      throw new Error("Conversation non trouvée")
    }

    const receiver = conversation.participants.find(p => p._id !== (session.user as any).id)
    if (!receiver) {
      throw new Error("Destinataire non trouvé")
    }

    const tempId = `temp-${Date.now()}`
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

    conversationManager.addMessage(tempMessage)
    scrollToBottom()

    try {
      const ws = (window as any).wsRef?.current
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket non connecté')
      }

      const message = {
        type: 'SEND_MESSAGE',
        data: {
          conversationId: convId,
          receiverId: receiver._id,
          content: content.trim(),
          tempId: tempId
        },
        messageId: `send-${Date.now()}`
      }

      ws.send(JSON.stringify(message))

    } catch (error: any) {
      console.error("❌ Erreur envoi message:", error)
      conversationManager.updateMessages(
        convId,
        conversationManager.getCachedMessages(convId).filter(msg => msg._id !== tempId)
      )
      toast.error("Erreur envoi message - Réessayez")
      throw error
    }
  }, [conversationManager, session, scrollToBottom])

  // 🔥 FIX: Envoi de message AI sécurisé
  const handleSendAIMessage = useCallback(async (content: string, convId: string) => {
    if (!content.trim() || !session?.user) {
      throw new Error("Message vide ou utilisateur non connecté")
    }

    if (!convId) {
      throw new Error("ID de conversation invalide")
    }

    const conversation = conversationManager.conversations.find(c => c._id === convId)
    if (!conversation) {
      throw new Error("Conversation non trouvée")
    }

    const otherParticipant = conversation?.participants.find(p => p._id !== (session.user as any).id)
    const tempId = `temp-${Date.now()}`
    const tempMessage: Message = {
      _id: tempId,
      conversationId: convId,
      senderId: (session.user as any).id,
      receiverId: otherParticipant?._id || '',
      content: content.trim(),
      read: false,
      createdAt: new Date().toISOString(),
      isAIMessage: false
    }
    
    conversationManager.addMessage(tempMessage)
    scrollToBottom()

    try {
      const response = await fetch('/api/ai/chat-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      
      conversationManager.updateMessages(
        convId,
        conversationManager.getCachedMessages(convId).filter(msg => msg._id !== tempId)
      )

      const userMessage: Message = {
        _id: `user-${Date.now()}`,
        conversationId: convId,
        senderId: (session.user as any).id,
        content: content.trim(),
        read: false,
        createdAt: new Date().toISOString(),
        isAIMessage: false
      }
      conversationManager.addMessage(userMessage)

      const aiMessage: Message = {
        _id: data.response?.messageId || `ai-${Date.now()}`,
        conversationId: convId,
        senderId: data.response?.aiUser?._id || 'ai-assistant',
        content: data.response?.content || 'Désolé, je n\'ai pas pu générer de réponse.',
        read: false,
        createdAt: new Date().toISOString(),
        isAIMessage: true,
        aiUser: data.response?.aiUser
      }
      conversationManager.addMessage(aiMessage)
      
      scrollToBottom()
      
      return data

    } catch (error: any) {
      console.error("❌ Erreur envoi message AI:", error)
      conversationManager.updateMessages(
        convId,
        conversationManager.getCachedMessages(convId).filter(msg => msg._id !== tempId)
      )
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
      const existingAIConv = conversationManager.conversations.find(conv => 
        conv.participants?.some(p => p.role === "ai_assistant")
      )

      if (existingAIConv) {
        handleSelectConversation(existingAIConv._id)
        toast.success("Conversation avec l'AI rouverte !")
        return
      }

      const response = await fetch('/api/ai/chat-assistant', {
        method: 'PUT'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Erreur création conversation AI`)
      }

      const data = await response.json()
      
      if (!data.conversation?._id) {
        throw new Error('Réponse API invalide')
      }
      
      await fetchConversations()
      
      handleSelectConversation(data.conversation._id)
      toast.success("Conversation avec l'AI créée !")
      
      setTimeout(() => {
        const welcomeMessage: Message = {
          _id: `ai-welcome-${Date.now()}`,
          conversationId: data.conversation._id,
          senderId: data.aiUser?._id || 'ai-assistant',
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
  }, [conversationManager.conversations, handleSelectConversation, fetchConversations, conversationManager, scrollToBottom, sessionStatus])

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
  }, [conversationManager.conversations, router, fetchConversations, sessionStatus])

  // 🔥 FIX: Suppression conversation
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
        conversationManager.setConversations(prev => prev.filter(conv => conv._id !== convId))
        
        if (conversationManager.selectedConversationId === convId) {
          conversationManager.selectConversation(null)
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

  // 🔥 FIX: Connexion WebSocket - UNE SEULE FOIS
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      console.log('🔄 Connexion WebSocket...')
      wsManager.connect()
    } else if (sessionStatus === 'unauthenticated') {
      console.log('🔒 Déconnexion WebSocket (non authentifié)')
      wsManager.cleanup()
      conversationManager.setConversations([])
      conversationManager.setMessages([])
      typingManager.cleanup()
    }
  }, [sessionStatus, wsManager, conversationManager, typingManager])

  // 🔥 FIX: Chargement initial - UNE SEULE FOIS
  useEffect(() => {
    if (sessionStatus === 'authenticated' && !hasLoadedInitialConversations.current) {
      console.log('🎯 Session authentifiée, chargement initial...')
      hasLoadedInitialConversations.current = true
      fetchConversations()
    }
  }, [sessionStatus]) // 🔥 RETIRER fetchConversations des dépendances

  // 🔥 FIX: Recherche utilisateurs
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

    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, session, sessionStatus])

  // Contexte de conversation
  const selectedConversation = conversationManager.conversations.find(
    c => c._id === conversationManager.selectedConversationId
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
              console.log('🔄 Rechargement manuel')
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