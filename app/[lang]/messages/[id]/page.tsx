// app/messages/[id]/page.tsx - VERSION RESPONSIVE COMPLÈTE
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

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
import { VideoCallModal, VideoCallModalHandle } from "@/components/VideoCallModal"
import { IncomingCallPopup } from "@/components/IncomingCallPopup"
import { OutgoingCallPopup } from "@/components/OutgoingCallPopup"

// Hooks
import { useWebSocketManager } from "@/hooks/useWebSocket"
import { useConversationManager } from "@/hooks/useConversationManager"
import { useTypingManager } from "@/hooks/useTypingManager"
import { useMessagePreferences } from "@/hooks/useMessagePreferences"

// Types
import { Conversation, Message, User } from "@/types/chat"
import { CallDebugPanel } from "@/components/CallDebugPanel"
import { MeetButtonFloating } from "@/components/meet/MeetButton"
import { cn } from "@/lib/utils"

export default function ConversationPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const params = useParams()
  const conversationId = params?.id as string | undefined
  
  const conversationManager = useConversationManager()
  const typingManager = useTypingManager()
  const messagePreferences = useMessagePreferences()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 🔥 ÉTATS POUR LES APPELS
  const [showIncomingCall, setShowIncomingCall] = useState(false)
  const [incomingCallData, setIncomingCallData] = useState<{
    callerName: string
    callerAvatar?: string
    channelName: string
    conversationId: string
    isVideoCall: boolean
  } | null>(null)

  const [showOutgoingCall, setShowOutgoingCall] = useState(false)
  const [outgoingCallData, setOutgoingCallData] = useState<{
    recipientName: string
    recipientAvatar?: string
    isVideoCall: boolean
  } | null>(null)

  const [showNewConversation, setShowNewConversation] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false)
  const [videoCallChannel, setVideoCallChannel] = useState("")
  const [callStatus, setCallStatus] = useState<"idle" | "ringing" | "connecting" | "connected">("idle")
  const [remoteUsers, setRemoteUsers] = useState<number[]>([])
  const videoCallRef = useRef<VideoCallModalHandle>(null)
  const [isCallLoading, setIsCallLoading] = useState(false)

  // 🔥 ÉTAT POUR LE MENU MOBILE
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Références de contrôle
  const hasLoadedInitialConversations = useRef(false)
  const hasOpenedUrlConversation = useRef(false)
  const isLoadingMessages = useRef(false)
  const lastSelectedConversation = useRef<string | null>(null)

  // Détecter la taille d'écran mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fermer le menu mobile quand une conversation est sélectionnée sur mobile
  useEffect(() => {
    if (isMobile && conversationManager.selectedConversationId) {
      setIsMobileMenuOpen(false)
    }
  }, [conversationManager.selectedConversationId, isMobile])

  // Scroll optimisé
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

  // Génération du nom de canal
  const generateChannelName = useCallback((convId: string) => {
    const timestamp = Date.now()
    return `call_${convId}_${timestamp}`
  }, [])

  // 🔥 DÉMARRAGE APPEL VIDÉO
  const handleStartVideoCall = useCallback(() => {
    console.log("🎥 Démarrage appel vidéo...")
    
    if (!conversationManager.selectedConversationId) {
      toast.error("Aucune conversation sélectionnée")
      return
    }

    if (isCallLoading) {
      toast.info("Un appel est déjà en cours de traitement")
      return
    }

    const selectedConv = conversationManager.getConversation(
      conversationManager.selectedConversationId
    )
    
    if (!selectedConv) {
      toast.error("Conversation introuvable")
      return
    }

    const recipient = selectedConv.participants?.find(
      p => p._id !== (session?.user as any)?.id
    )

    if (!recipient) {
      toast.error("Aucun destinataire trouvé")
      return
    }

    setOutgoingCallData({
      recipientName: recipient.name || 'Utilisateur',
      recipientAvatar: recipient.avatar,
      isVideoCall: true
    })

    setShowOutgoingCall(true)
    setCallStatus("ringing")
    setIsCallLoading(true)

    const channelName = generateChannelName(conversationManager.selectedConversationId)
    setVideoCallChannel(channelName)
    
    console.log("📞 Canal d'appel créé:", channelName)

    // Envoyer la notification WebSocket
    try {
      const ws = (window as any).wsRef?.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'VIDEO_CALL_STARTED',
          data: {
            conversationId: conversationManager.selectedConversationId,
            channelName: channelName,
            callerId: (session?.user as any)?.id,
            callerName: session?.user?.name || 'Utilisateur',
            callerAvatar: (session?.user as any)?.image,
            isVideoCall: true,
            timestamp: Date.now()
          },
          messageId: `call-start-${Date.now()}`
        }))
        console.log("📢 Notification d'appel envoyée")
      } else {
        console.warn("WebSocket non connecté, impossible d'envoyer la notification")
        toast.warning("Connexion instable - Tentative de notification...")
      }
    } catch (error) {
      console.error("Erreur envoi notification appel:", error)
      toast.error("Erreur lors de l'envoi de la notification")
    }
    
    // Définir un timeout pour l'appel
    setTimeout(() => {
      if (callStatus === "ringing" && showOutgoingCall) {
        console.log("⏰ Timeout d'appel atteint")
        toast.error("L'appel n'a pas été répondu")
        handleCancelOutgoingCall()
      }
    }, 45000)
  }, [conversationManager, session, generateChannelName, isCallLoading, callStatus, showOutgoingCall])

  // 🔥 ANNULATION APPEL SORTANT
  const handleCancelOutgoingCall = useCallback(() => {
    console.log("❌ Annulation de l'appel sortant")
    
    setShowOutgoingCall(false)
    setCallStatus("idle")
    setIsCallLoading(false)
    
    toast.info("Appel annulé")
    
    try {
      const ws = (window as any).wsRef?.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'VIDEO_CALL_CANCELLED',
          data: {
            conversationId: conversationManager.selectedConversationId,
            channelName: videoCallChannel
          },
          messageId: `call-cancel-${Date.now()}`
        }))
      }
    } catch (error) {
      console.error("Erreur notification annulation:", error)
    }
    
    setOutgoingCallData(null)
    setVideoCallChannel("")
  }, [conversationManager.selectedConversationId, videoCallChannel])

  // 🔥 FIN D'APPEL
  const handleEndCall = useCallback(async () => {
    console.log("📴 [PAGE] Début de la fin d'appel...")
    
    if (isCallLoading) {
      console.log("⚠️ [PAGE] Fin d'appel déjà en cours, skip...")
      return
    }
    
    if (!isVideoCallOpen && !showOutgoingCall && !showIncomingCall) {
      console.log("ℹ️ [PAGE] Aucun appel actif, skip cleanup")
      return
    }
    
    setIsCallLoading(true)
    
    try {
      if (isVideoCallOpen && videoCallRef.current) {
        console.log("🔄 [PAGE] Fermeture du modal Agora...")
        await videoCallRef.current.close()
        console.log("✅ [PAGE] Modal Agora fermé")
      }
      
      if (videoCallChannel && conversationManager.selectedConversationId) {
        try {
          const ws = (window as any).wsRef?.current
          if (ws && ws.readyState === WebSocket.OPEN) {
            console.log("📡 [PAGE] Envoi notification fin d'appel...")
            ws.send(JSON.stringify({
              type: 'VIDEO_CALL_ENDED',
              data: {
                conversationId: conversationManager.selectedConversationId,
                channelName: videoCallChannel,
                userId: (session?.user as any)?.id
              },
              messageId: `call-end-${Date.now()}`
            }))
            console.log("✅ [PAGE] Notification envoyée")
          }
        } catch (wsError) {
          console.warn("⚠️ [PAGE] Erreur notification WebSocket (non bloquant):", wsError)
        }
      }
    } catch (error) {
      console.error("❌ [PAGE] Erreur lors de la fin d'appel:", error)
    } finally {
      await new Promise(resolve => setTimeout(resolve, 800))
      
      console.log("🔄 [PAGE] Réinitialisation des états...")
      setIsVideoCallOpen(false)
      setCallStatus("idle")
      setRemoteUsers([])
      setIsCallLoading(false)
      setShowOutgoingCall(false)
      setShowIncomingCall(false)
      setOutgoingCallData(null)
      setIncomingCallData(null)
      setVideoCallChannel("")
      
      console.log("✅ [PAGE] Appel terminé avec succès")
      toast.success("Appel terminé")
    }
  }, [
    conversationManager.selectedConversationId, 
    videoCallChannel, 
    session, 
    isCallLoading,
    isVideoCallOpen,
    showOutgoingCall,
    showIncomingCall
  ])

  const handleCallStatusChange = useCallback((status: "idle" | "ringing" | "connecting" | "connected") => {
    console.log("📊 Statut appel:", status)
    setCallStatus(status)
    
    if (status === "connected") {
      toast.success("Appel connecté !")
      setIsCallLoading(false)
    } else if (status === "connecting") {
      toast.info("Connexion en cours...")
    }
  }, [])

  const handleRemoteUsersChange = useCallback((users: number[]) => {
    console.log("👥 Utilisateurs distants:", users.length)
    setRemoteUsers(users)
    
    if (users.length > 0 && (callStatus === "connecting" || callStatus === "ringing")) {
      setCallStatus("connected")
      setIsCallLoading(false)
      toast.success(`${users.length} participant(s) dans l'appel`)
    }
  }, [callStatus])

  // 🔥 REFUS APPEL ENTRANT
  const handleDeclineIncomingCall = useCallback(() => {
    console.log("❌ Refus de l'appel")
    
    if (!incomingCallData) return
    
    setShowIncomingCall(false)
    
    toast.info("Appel refusé")
    
    try {
      const ws = (window as any).wsRef?.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'VIDEO_CALL_DECLINED',
          data: {
            conversationId: incomingCallData.conversationId,
            channelName: incomingCallData.channelName,
            userId: (session?.user as any)?.id
          },
          messageId: `call-decline-${Date.now()}`
        }))
      }
    } catch (error) {
      console.error("Erreur notification refus:", error)
    }
    
    setIncomingCallData(null)
  }, [incomingCallData, session])

  // 🔥 ACCEPTATION APPEL ENTRANT
 

  // Chargement des conversations
  const fetchConversations = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return
    
    try {
      console.log('🔄 Chargement conversations...')
      const response = await fetch("/api/conversations", {
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const data = await response.json()
      const conversations = data.conversations || []
      console.log('✅ Conversations chargées:', conversations.length)
      
      conversationManager.setConversations(conversations)
      conversationManager.setIsLoading(false)
      
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
  }, [sessionStatus, conversationId, conversationManager])

  // Chargement des messages
  const fetchMessages = useCallback(async (convId: string) => {
    if (!convId || sessionStatus !== 'authenticated') return
    if (isLoadingMessages.current) return

    isLoadingMessages.current = true
    console.log('🔄 Chargement messages pour:', convId)
    
    try {
      const response = await fetch(`/api/messages?conversationId=${convId}`, {
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const data = await response.json()
      const messages = data.messages || []
      console.log('✅ Messages chargés:', messages.length)
      
      conversationManager.updateMessages(convId, messages)
      setTimeout(() => scrollToBottom(true), 100)
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error)
      toast.error('Erreur lors du chargement des messages')
    } finally {
      isLoadingMessages.current = false
    }
  }, [sessionStatus, conversationManager, scrollToBottom])

  // Handlers de typing
  const handleTypingStart = useCallback(() => {
    if (!conversationManager.selectedConversationId || !session?.user) return
    
    try {
      const ws = (window as any).wsRef?.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return

      ws.send(JSON.stringify({
        type: 'TYPING_START',
        data: { 
          conversationId: conversationManager.selectedConversationId,
          userId: (session.user as any).id,
          userName: session.user.name
        },
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
        data: { 
          conversationId: conversationManager.selectedConversationId,
          userId: (session.user as any).id
        },
        messageId: `typing-stop-${Date.now()}`
      }))
    } catch (error) {
      console.log('Typing stop error (non-critical):', error)
    }
  }, [conversationManager.selectedConversationId, session])

  // Handler WebSocket
  const handleWebSocketMessage = useCallback((message: any) => {
    if (!message?.type) return
    
    console.log('📨 WebSocket message:', message.type)
    
    try {
      switch (message.type) {
        case 'AUTH_SUCCESS':
          console.log('✅ Auth WebSocket OK')
          break
          
        case 'CONVERSATIONS_FETCHED':
          const conversations = message.data?.conversations || []
          conversationManager.setConversations(conversations)
          conversationManager.setIsLoading(false)
          break

        case 'MESSAGES_FETCHED':
          const msgs = message.data?.messages || []
          const cId = message.data?.conversationId
          if (!cId) break
          conversationManager.updateMessages(cId, msgs)
          scrollToBottom(true)
          break

        case 'VIDEO_CALL_TIMEOUT':
          console.log("⏰ Appel timeout - pas de réponse")
          
          if (showOutgoingCall) {
            setShowOutgoingCall(false)
            setOutgoingCallData(null)
          }
          
          setCallStatus("idle")
          setIsCallLoading(false)
          setVideoCallChannel("")
          
          toast.error("L'appel n'a pas été répondu")
          break

        case 'VIDEO_CALL_USER_DISCONNECTED':
          console.log("📡 Un participant s'est déconnecté:", message.data)
          
          if (message.data?.channelName === videoCallChannel) {
            toast.warning("Un participant s'est déconnecté")
            
            if (remoteUsers.length <= 1) {
              toast.info("L'autre participant a quitté l'appel", {
                duration: 5000,
                action: {
                  label: "Terminer",
                  onClick: () => handleEndCall()
                }
              })
            }
          }
          break

        case 'VIDEO_CALL_INITIATED':
          console.log("✅ Appel initié avec succès:", message.data)
          toast.success("Appel en cours...")
          break

        case 'VIDEO_CALL_CONNECTED':
          console.log("🔗 Appel connecté:", message.data)
          setCallStatus("connected")
          setIsCallLoading(false)
          break

        case 'VIDEO_CALL_END_CONFIRMED':
          console.log("✅ Fin d'appel confirmée par le serveur")
          break

        case 'SERVER_SHUTDOWN':
          console.log("⚠️ Le serveur va s'arrêter")
          toast.warning("Le serveur de messagerie redémarre. Reconnexion automatique...")
          
          if (isVideoCallOpen || showOutgoingCall || showIncomingCall) {
            handleEndCall()
          }
          break

        case 'SESSION_REPLACED':
          console.log("🔄 Session remplacée par une nouvelle connexion")
          toast.info("Vous vous êtes connecté depuis un autre appareil")
          
          if (isVideoCallOpen || showOutgoingCall || showIncomingCall) {
            handleEndCall()
          }
          break

        case 'VIDEO_CALL_INCOMING':
          console.log("📞 Appel entrant reçu:", message.data)
          
          if (isVideoCallOpen || showOutgoingCall || showIncomingCall) {
            console.log("⚠️ Appel en cours, ignorer l'appel entrant")
            return
          }
          
          setIncomingCallData({
            callerName: message.data.callerName || 'Utilisateur',
            callerAvatar: message.data.callerAvatar,
            channelName: message.data.channelName,
            conversationId: message.data.conversationId,
            isVideoCall: message.data.isVideoCall !== false
          })
          
          setShowIncomingCall(true)
          
          try {
            const audio = new Audio('/sounds/incoming-call.mp3')
            audio.loop = true
            audio.play().catch(err => console.log('Audio error:', err))
            
            setTimeout(() => {
              audio.pause()
              audio.currentTime = 0
            }, 30000)
          } catch (error) {
            console.log('Audio error (non-critical):', error)
          }
          break

        case 'VIDEO_CALL_ACCEPTED':
          console.log("✅ Appel accepté par l'autre utilisateur")
          
          setShowOutgoingCall(false)
          setIsVideoCallOpen(true)
          setCallStatus("connected")
          setIsCallLoading(false)
          
          toast.success("Appel accepté !")
          break

        case 'VIDEO_CALL_DECLINED':
          console.log("❌ Appel refusé par l'autre utilisateur")
          
          setShowOutgoingCall(false)
          setCallStatus("idle")
          setOutgoingCallData(null)
          setIsCallLoading(false)
          
          toast.error("Appel refusé")
          break

        case 'VIDEO_CALL_CANCELLED':
          console.log("🚫 Appel annulé par l'appelant")
          
          if (showIncomingCall) {
            setShowIncomingCall(false)
            setIncomingCallData(null)
            toast.info("L'appel a été annulé")
            
            try {
              const audios = document.querySelectorAll('audio')
              audios.forEach(audio => {
                audio.pause()
                audio.currentTime = 0
              })
            } catch (e) {
              console.log('Error stopping audio:', e)
            }
          }
          break

        case 'VIDEO_CALL_ENDED':
          console.log("📞 Appel terminé par l'autre utilisateur")
          
          if (message.data?.channelName === videoCallChannel) {
            handleEndCall()
            toast.info("L'autre participant a quitté l'appel")
          }
          break

        case 'VIDEO_CALL_MISSED':
          console.log("📵 Appel manqué")
          toast.info("Vous avez manqué un appel")
          break

        case 'NEW_MESSAGE':
          const newMsg = message.data
          if (!newMsg?.conversationId || !newMsg._id) break
          
          conversationManager.addMessage(newMsg)
          
          if (newMsg.conversationId === conversationManager.selectedConversationId) {
            scrollToBottom()
            conversationManager.updateConversation(newMsg.conversationId, {
              unreadCount: 0,
              lastMessage: newMsg.content,
              updatedAt: new Date().toISOString()
            })
          } else {
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
          
          const currentMsgs = conversationManager.getCachedMessages(sentMsg.conversationId)
          const updatedMsgs = currentMsgs.map(msg => 
            msg._id === sentMsg.tempId
              ? { ...msg, _id: sentMsg.messageId, createdAt: sentMsg.createdAt || msg.createdAt }
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
          if (!message.data?.conversationId || !message.data?.userId) break
          typingManager.stopTyping(message.data.conversationId)
          break

        case 'ERROR':
          console.error('❌ Erreur WebSocket:', message.data)
          toast.error(message.data?.message || 'Erreur de connexion')
          break
          
        default:
          console.log('📨 Message WebSocket non traité:', message.type)
      }
    } catch (error) {
      console.error('❌ Erreur traitement message WS:', error)
    }
  }, [conversationManager, scrollToBottom, typingManager, videoCallChannel, handleEndCall, isVideoCallOpen, showOutgoingCall, showIncomingCall, remoteUsers.length])

  const wsManager = useWebSocketManager(handleWebSocketMessage)

  // Sélection de conversation
  const handleSelectConversation = useCallback((convId: string) => {
    if (!convId || lastSelectedConversation.current === convId) return
    
    console.log('🎯 Sélection conversation:', convId)
    lastSelectedConversation.current = convId
    
    typingManager.cleanup()
    conversationManager.selectConversation(convId)
    
    try {
      window.history.pushState({}, '', `/messages/${convId}`)
    } catch (error) {
      console.log('History push error:', error)
    }
    
    setTimeout(() => fetchMessages(convId), 50)
  }, [conversationManager, typingManager, fetchMessages])

  // Envoi message
  const handleSendMessage = useCallback(async (content: string, convId: string) => {
    if (!content.trim() || !session?.user) {
      throw new Error("Message vide ou utilisateur non connecté")
    }

    const conversation = conversationManager.getConversation(convId)
    if (!conversation) throw new Error("Conversation non trouvée")

    const receiver = conversation.participants.find(p => p._id !== (session.user as any).id)
    if (!receiver) throw new Error("Destinataire non trouvé")

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
          tempId: tempId,
          senderName: session.user.name,
          senderAvatar: (session.user as any).image
        },
        messageId: `send-${Date.now()}`
      }))
    } catch (error: any) {
      console.error("❌ Erreur envoi message:", error)
      conversationManager.removeMessage(convId, tempId)
      toast.error("Erreur envoi message")
      throw error
    }
  }, [conversationManager, session, scrollToBottom])

  // Envoi message AI
  const handleSendAIMessage = useCallback(async (content: string, convId: string) => {
    if (!content.trim() || !session?.user) {
      throw new Error("Message vide")
    }

    const conversation = conversationManager.getConversation(convId)
    if (!conversation) throw new Error("Conversation non trouvée")

    const otherParticipant = conversation.participants.find(p => p._id !== (session.user as any).id)
    const tempId = `temp-ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
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
      conversationManager.removeMessage(convId, tempId)

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
      toast.error("Erreur avec l'assistant AI")
      throw error
    }
  }, [conversationManager, session, scrollToBottom])

  // Création conversation AI
  const createAIConversation = useCallback(async () => {
    if (sessionStatus !== 'authenticated') {
      toast.error('Veuillez vous connecter')
      return
    }

    try {
      const existingAIConv = conversationManager.conversations.find(conv => 
        conv.isAIConversation || conv.participants?.some(p => p.role === "ai_assistant")
      )

      if (existingAIConv) {
        handleSelectConversation(existingAIConv._id)
        toast.success("Conversation AI rouverte !")
        return
      }

      const response = await fetch('/api/ai/chat-assistant', { method: 'PUT' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()
      if (!data.conversation?._id) throw new Error('Réponse API invalide')
      
      await fetchConversations()
      handleSelectConversation(data.conversation._id)
      toast.success("Conversation AI créée !")
      
      setTimeout(() => {
        const welcomeMessage: Message = {
          _id: `ai-welcome-${Date.now()}`,
          conversationId: data.conversation._id,
          senderId: data.aiUser?._id || 'ai-assistant',
          receiverId: (session.user as any).id,
          content: "👋 Bonjour ! Je suis votre assistant AI. Comment puis-je vous aider ?",
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
 const handleAcceptIncomingCall = useCallback(() => {
    console.log("✅ [PAGE] Acceptation de l'appel")
    
    if (!incomingCallData) {
      console.error("❌ [PAGE] Pas de données d'appel entrant")
      toast.error("Erreur: données d'appel manquantes")
      return
    }
    
    console.log("📞 [PAGE] Données d'appel:", {
      channelName: incomingCallData.channelName,
      conversationId: incomingCallData.conversationId,
      callerName: incomingCallData.callerName
    })
    
    setShowIncomingCall(false)
    
    try {
      const audios = document.querySelectorAll('audio')
      audios.forEach(audio => {
        audio.pause()
        audio.currentTime = 0
      })
    } catch (e) {
      console.log('⚠️ [PAGE] Error stopping audio:', e)
    }
    
    const channelToUse = incomingCallData.channelName
    console.log("📞 [PAGE] Canal d'appel configuré:", channelToUse)
    setVideoCallChannel(channelToUse)
    
    if (incomingCallData.conversationId !== conversationManager.selectedConversationId) {
      console.log("📂 [PAGE] Ouverture de la conversation:", incomingCallData.conversationId)
      handleSelectConversation(incomingCallData.conversationId)
    }
    
    console.log("📡 [PAGE] Envoi notification d'acceptation...")
    try {
      const ws = (window as any).wsRef?.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'VIDEO_CALL_ACCEPTED',
          data: {
            conversationId: incomingCallData.conversationId,
            channelName: channelToUse,
            userId: (session?.user as any)?.id,
            userName: session?.user?.name
          },
          messageId: `call-accept-${Date.now()}`
        }))
        console.log("✅ [PAGE] Notification d'acceptation envoyée")
      } else {
        console.error("❌ [PAGE] WebSocket non connecté!")
        toast.error("Erreur de connexion au serveur")
        setIncomingCallData(null)
        return
      }
    } catch (error) {
      console.error("❌ [PAGE] Erreur notification acceptation:", error)
      toast.error("Erreur lors de l'acceptation de l'appel")
      setIncomingCallData(null)
      return
    }
    
    console.log("⏳ [PAGE] Attente de 500ms avant ouverture modal...")
    setTimeout(() => {
      console.log("🎬 [PAGE] Ouverture du modal vidéo...")
      setIsVideoCallOpen(true)
      setCallStatus("connecting")
      setIsCallLoading(false)
      
      toast.success("Connexion à l'appel...")
    }, 500)
    
    setIncomingCallData(null)
  }, [incomingCallData, conversationManager.selectedConversationId, session, handleSelectConversation])
  // Création conversation normale
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

  // Effects
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      wsManager.connect()
    } else if (sessionStatus === 'unauthenticated') {
      wsManager.cleanup()
      conversationManager.clearAll()
      typingManager.cleanup()
    }
  }, [sessionStatus, wsManager, conversationManager, typingManager])

  useEffect(() => {
    if (sessionStatus === 'authenticated' && !hasLoadedInitialConversations.current) {
      hasLoadedInitialConversations.current = true
      fetchConversations()
    }
  }, [sessionStatus, fetchConversations])

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

  // Gestion des touches ESC pour annuler les appels
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showOutgoingCall) {
          handleCancelOutgoingCall()
        } else if (showIncomingCall) {
          handleDeclineIncomingCall()
        } else if (isVideoCallOpen) {
          handleEndCall()
        }
      }
    }
    
    document.addEventListener('keydown', handleEscKey)
    return () => document.removeEventListener('keydown', handleEscKey)
  }, [showOutgoingCall, showIncomingCall, isVideoCallOpen, handleCancelOutgoingCall, handleDeclineIncomingCall, handleEndCall])

  // Nettoyer les appels en quittant la page
  useEffect(() => {
    return () => {
      if (isVideoCallOpen || showOutgoingCall || showIncomingCall) {
        handleEndCall()
      }
    }
  }, [isVideoCallOpen, showOutgoingCall, showIncomingCall, handleEndCall])

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

  // DEBUG effect
  useEffect(() => {
    console.log("📊 [DEBUG] État appel changé:", {
      isVideoCallOpen,
      callStatus,
      videoCallChannel,
      showOutgoingCall,
      showIncomingCall,
      isCallLoading,
      remoteUsers: remoteUsers.length
    })
  }, [isVideoCallOpen, callStatus, videoCallChannel, showOutgoingCall, showIncomingCall, isCallLoading, remoteUsers])

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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">

      {/* 🔥 debug panel */}
      {process.env.NODE_ENV === 'development' && (
        <CallDebugPanel
          isVideoCallOpen={isVideoCallOpen}
          callStatus={callStatus}
          videoCallChannel={videoCallChannel}
          showOutgoingCall={showOutgoingCall}
          showIncomingCall={showIncomingCall}
          isCallLoading={isCallLoading}
          remoteUsers={remoteUsers}
          incomingCallData={incomingCallData}
          outgoingCallData={outgoingCallData}
        />
      )}

      {/* 🔥 POP-UP D'APPEL ENTRANT */}
      <IncomingCallPopup
        isOpen={showIncomingCall}
        callerName={incomingCallData?.callerName || 'Utilisateur'}
        callerAvatar={incomingCallData?.callerAvatar}
        isVideoCall={incomingCallData?.isVideoCall || true}
        onAccept={handleAcceptIncomingCall}
        onDecline={handleDeclineIncomingCall}
      />
      
      {/* 🔥 POP-UP D'APPEL SORTANT */}
      <OutgoingCallPopup
        isOpen={showOutgoingCall}
        recipientName={outgoingCallData?.recipientName || 'Utilisateur'}
        recipientAvatar={outgoingCallData?.recipientAvatar}
        isVideoCall={outgoingCallData?.isVideoCall || true}
        callStatus={callStatus === "idle" ? "ringing" : callStatus}
        onCancel={handleCancelOutgoingCall}
        isLoading={isCallLoading}
      />

      <ConnectionStatus 
        connectionStatus={wsManager.connectionStatus}
        reconnectAttempt={wsManager.reconnectAttempt}
        onReconnect={wsManager.reconnect}
      />
      
      {session && <MeetButtonFloating lang={"fr"} />}

      {/* Sidebar - Mobile: overlay drawer, Desktop: fixed */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out",
        isMobile ? (isMobileMenuOpen ? "translate-x-0" : "-translate-x-full") : "relative translate-x-0",
        isMobile ? "w-80 max-w-[85vw]" : "w-80 flex-shrink-0"
      )}>
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
      </div>

      {/* Overlay pour mobile */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col h-full transition-all duration-300",
        isMobile && isMobileMenuOpen && "opacity-50 pointer-events-none"
      )}>
        {selectedConversation ? (
          <div className="flex flex-1 flex-col relative h-full">
            {/* Chat Header avec bouton menu mobile */}
            <div className="relative">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
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
                onStartVideoCall={handleStartVideoCall}
                onStartVoiceCall={() => toast.info("Appel vocal - À implémenter")}
                onEndCall={handleEndCall}
                callStatus={callStatus}
                callRemoteCount={remoteUsers.length}
                isCallActive={isVideoCallOpen || showOutgoingCall || showIncomingCall}
              />
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden">
              {conversationManager.messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-6 md:p-8">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mb-4 md:mb-6">
                    <div className="text-2xl md:text-3xl">💬</div>
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Aucun message
                  </h3>
                  <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-sm">
                    {conversationContext?.isAIConversation 
                      ? "Demandez-moi de l'aide pour vos projets ou posez-moi vos questions !"
                      : "Envoyez le premier message pour commencer la conversation"
                    }
                  </p>
                  {!conversationContext?.isAIConversation && !isVideoCallOpen && (
                    <div className="mt-4 md:mt-6">
                      <button
                        onClick={handleStartVideoCall}
                        disabled={isCallLoading || showOutgoingCall || showIncomingCall}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-full hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                      >
                        <span className="text-lg md:text-xl">📹</span>
                        <span className="font-semibold">
                          {isCallLoading ? "Appel en cours..." : "Commencer un appel vidéo"}
                        </span>
                      </button>
                      <p className="text-xs md:text-sm text-gray-500 mt-2">
                        Appuyez sur l'icône 📹 en haut pour lancer un appel
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
                  <div className="p-3 md:p-6 space-y-3 md:space-y-4">
                    {renderMessages()}
                    
                    <TypingIndicator 
                      text={typingManager.getTypingText(conversationManager.selectedConversationId!)} 
                    />
                    
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              onSendAIMessage={handleSendAIMessage}
              selectedConversation={conversationManager.selectedConversationId}
              disabled={!wsManager.isConnected && !conversationContext?.isAIConversation || isVideoCallOpen}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              conversationContext={conversationContext}
              isConnected={wsManager.isConnected}
            />
          </div>
        ) : (
          // Empty State - No conversation selected
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center p-6 md:p-8">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <div className="text-4xl md:text-5xl">👋</div>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3">
                {conversationManager.conversations.length === 0 ? "Bienvenue dans la messagerie" : "Sélectionnez une conversation"}
              </h3>
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mb-4 md:mb-6 max-w-md">
                {conversationManager.conversations.length === 0 
                  ? "Commencez par créer une nouvelle conversation pour discuter avec vos contacts ou avec notre assistant AI"
                  : "Choisissez une conversation dans la liste pour afficher les messages"
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <button
                  onClick={() => setShowNewConversation(true)}
                  disabled={!wsManager.isConnected || isCallLoading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white px-4 py-2 md:px-6 md:py-3 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm md:text-base"
                >
                  Nouvelle conversation
                </button>
                
                <button
                  onClick={createAIConversation}
                  disabled={isCallLoading}
                  className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <span>🤖</span>
                  Discuter avec l'AI
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🔥 MODAL D'APPEL VIDÉO */}
      <VideoCallModal
        ref={videoCallRef}
        isOpen={isVideoCallOpen}
        onClose={handleEndCall}
        channelName={videoCallChannel}
        onStatusChange={handleCallStatusChange}
        onRemoteUsersChange={handleRemoteUsersChange}
        otherParticipant={otherParticipant}
      />

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