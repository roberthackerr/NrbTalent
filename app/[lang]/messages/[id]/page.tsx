// app/messages/[id]/page.tsx - VERSION FINALE SANS LOGIQUE SIDEBAR SUPPLÉMENTAIRE
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

export default function ConversationPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const params = useParams()
  const conversationId = params?.id as string | undefined

  const conversationManager = useConversationManager()
  const typingManager = useTypingManager()
  const messagePreferences = useMessagePreferences()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // ── Call states ───────────────────────────────────────────────────────────
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

  // Control refs
  const hasLoadedInitialConversations = useRef(false)
  const hasOpenedUrlConversation = useRef(false)
  const isLoadingMessages = useRef(false)
  const lastSelectedConversation = useRef<string | null>(null)

  // ── Scroll optimisé pour mobile ───────────────────────────────────────────
  const scrollToBottom = useCallback((force: boolean = false) => {
    if (!messagesEndRef.current) return
    
    requestAnimationFrame(() => {
      try {
        if (force) {
          messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" })
        } else {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
        }
      } catch (error) {
        console.log("Scroll error (non-critical):", error)
      }
    })
  }, [])

  const generateChannelName = useCallback((convId: string) => {
    return `call_${convId}_${Date.now()}`
  }, [])

  // ── Video call handlers ───────────────────────────────────────────────────
  const handleStartVideoCall = useCallback(() => {
    if (!conversationManager.selectedConversationId) {
      toast.error("Aucune conversation sélectionnée")
      return
    }
    if (isCallLoading) {
      toast.info("Un appel est déjà en cours de traitement")
      return
    }

    const selectedConv = conversationManager.getConversation(conversationManager.selectedConversationId)
    if (!selectedConv) { toast.error("Conversation introuvable"); return }

    const recipient = selectedConv.participants?.find(p => p._id !== (session?.user as any)?.id)
    if (!recipient) { toast.error("Aucun destinataire trouvé"); return }

    setOutgoingCallData({ recipientName: recipient.name || "Utilisateur", recipientAvatar: recipient.avatar, isVideoCall: true })
    setShowOutgoingCall(true)
    setCallStatus("ringing")
    setIsCallLoading(true)

    const channelName = generateChannelName(conversationManager.selectedConversationId)
    setVideoCallChannel(channelName)

    try {
      const ws = (window as any).wsRef?.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "VIDEO_CALL_STARTED",
          data: { conversationId: conversationManager.selectedConversationId, channelName, callerId: (session?.user as any)?.id, callerName: session?.user?.name || "Utilisateur", callerAvatar: (session?.user as any)?.image, isVideoCall: true, timestamp: Date.now() },
          messageId: `call-start-${Date.now()}`
        }))
      } else {
        toast.warning("Connexion instable - Tentative de notification...")
      }
    } catch (error) {
      console.error("Erreur envoi notification appel:", error)
      toast.error("Erreur lors de l'envoi de la notification")
    }

    setTimeout(() => {
      if (callStatus === "ringing" && showOutgoingCall) {
        toast.error("L'appel n'a pas été répondu")
        handleCancelOutgoingCall()
      }
    }, 45000)
  }, [conversationManager, session, generateChannelName, isCallLoading, callStatus, showOutgoingCall])

  const handleCancelOutgoingCall = useCallback(() => {
    setShowOutgoingCall(false)
    setCallStatus("idle")
    setIsCallLoading(false)
    toast.info("Appel annulé")
    try {
      const ws = (window as any).wsRef?.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "VIDEO_CALL_CANCELLED", data: { conversationId: conversationManager.selectedConversationId, channelName: videoCallChannel }, messageId: `call-cancel-${Date.now()}` }))
      }
    } catch (error) { console.error("Erreur notification annulation:", error) }
    setOutgoingCallData(null)
    setVideoCallChannel("")
  }, [conversationManager.selectedConversationId, videoCallChannel])

  const handleEndCall = useCallback(async () => {
    if (isCallLoading) return
    if (!isVideoCallOpen && !showOutgoingCall && !showIncomingCall) return

    setIsCallLoading(true)
    try {
      if (isVideoCallOpen && videoCallRef.current) await videoCallRef.current.close()
      if (videoCallChannel && conversationManager.selectedConversationId) {
        try {
          const ws = (window as any).wsRef?.current
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "VIDEO_CALL_ENDED", data: { conversationId: conversationManager.selectedConversationId, channelName: videoCallChannel, userId: (session?.user as any)?.id }, messageId: `call-end-${Date.now()}` }))
          }
        } catch (wsError) { console.warn("⚠️ Erreur WS (non bloquant):", wsError) }
      }
    } catch (error) { console.error("Erreur fin d'appel:", error) } finally {
      await new Promise(resolve => setTimeout(resolve, 800))
      setIsVideoCallOpen(false)
      setCallStatus("idle")
      setRemoteUsers([])
      setIsCallLoading(false)
      setShowOutgoingCall(false)
      setShowIncomingCall(false)
      setOutgoingCallData(null)
      setIncomingCallData(null)
      setVideoCallChannel("")
      toast.success("Appel terminé")
    }
  }, [conversationManager.selectedConversationId, videoCallChannel, session, isCallLoading, isVideoCallOpen, showOutgoingCall, showIncomingCall])

  const handleCallStatusChange = useCallback((status: "idle" | "ringing" | "connecting" | "connected") => {
    setCallStatus(status)
    if (status === "connected") { toast.success("Appel connecté !"); setIsCallLoading(false) }
    else if (status === "connecting") toast.info("Connexion en cours...")
  }, [])

  const handleRemoteUsersChange = useCallback((users: number[]) => {
    setRemoteUsers(users)
    if (users.length > 0 && (callStatus === "connecting" || callStatus === "ringing")) {
      setCallStatus("connected")
      setIsCallLoading(false)
      toast.success(`${users.length} participant(s) dans l'appel`)
    }
  }, [callStatus])

  const handleDeclineIncomingCall = useCallback(() => {
    if (!incomingCallData) return
    setShowIncomingCall(false)
    toast.info("Appel refusé")
    try {
      const ws = (window as any).wsRef?.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "VIDEO_CALL_DECLINED", data: { conversationId: incomingCallData.conversationId, channelName: incomingCallData.channelName, userId: (session?.user as any)?.id }, messageId: `call-decline-${Date.now()}` }))
      }
    } catch (error) { console.error("Erreur notification refus:", error) }
    setIncomingCallData(null)
  }, [incomingCallData, session])

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    if (sessionStatus !== "authenticated") return
    try {
      const response = await fetch("/api/conversations", { headers: { "Cache-Control": "no-cache" } })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      const conversations = data.conversations || []
      conversationManager.setConversations(conversations)
      conversationManager.setIsLoading(false)
      if (conversationId && conversations.length > 0 && !hasOpenedUrlConversation.current) {
        const targetConversation = conversations.find((conv: Conversation) => conv._id === conversationId)
        if (targetConversation) {
          hasOpenedUrlConversation.current = true
          conversationManager.selectConversation(conversationId)
          setTimeout(() => fetchMessages(conversationId), 200)
        }
      }
    } catch (error) {
      console.error("Erreur chargement conversations:", error)
      toast.error("Impossible de charger les conversations")
      conversationManager.setIsLoading(false)
    }
  }, [sessionStatus, conversationId, conversationManager])

  const fetchMessages = useCallback(async (convId: string) => {
    if (!convId || sessionStatus !== "authenticated") return
    if (isLoadingMessages.current) return
    isLoadingMessages.current = true
    try {
      const response = await fetch(`/api/messages?conversationId=${convId}`, { headers: { "Cache-Control": "no-cache" } })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      conversationManager.updateMessages(convId, data.messages || [])
      setTimeout(() => scrollToBottom(true), 100)
    } catch (error) {
      console.error("Erreur chargement messages:", error)
      toast.error("Erreur lors du chargement des messages")
    } finally { isLoadingMessages.current = false }
  }, [sessionStatus, conversationManager, scrollToBottom])

  // ── Typing handlers ───────────────────────────────────────────────────────
  const handleTypingStart = useCallback(() => {
    if (!conversationManager.selectedConversationId || !session?.user) return
    try {
      const ws = (window as any).wsRef?.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return
      ws.send(JSON.stringify({ type: "TYPING_START", data: { conversationId: conversationManager.selectedConversationId, userId: (session.user as any).id, userName: session.user.name }, messageId: `typing-${Date.now()}` }))
    } catch (error) { console.log("Typing start error:", error) }
  }, [conversationManager.selectedConversationId, session])

  const handleTypingStop = useCallback(() => {
    if (!conversationManager.selectedConversationId || !session?.user) return
    try {
      const ws = (window as any).wsRef?.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return
      ws.send(JSON.stringify({ type: "TYPING_STOP", data: { conversationId: conversationManager.selectedConversationId, userId: (session.user as any).id }, messageId: `typing-stop-${Date.now()}` }))
    } catch (error) { console.log("Typing stop error:", error) }
  }, [conversationManager.selectedConversationId, session])

  // ── WebSocket handler ─────────────────────────────────────────────────────
  const handleWebSocketMessage = useCallback((message: any) => {
    if (!message?.type) return
    try {
      switch (message.type) {
        case "AUTH_SUCCESS": break
        case "CONVERSATIONS_FETCHED":
          conversationManager.setConversations(message.data?.conversations || [])
          conversationManager.setIsLoading(false)
          break
        case "MESSAGES_FETCHED": {
          const cId = message.data?.conversationId
          if (!cId) break
          conversationManager.updateMessages(cId, message.data?.messages || [])
          scrollToBottom(true)
          break
        }
        case "VIDEO_CALL_TIMEOUT":
          if (showOutgoingCall) { setShowOutgoingCall(false); setOutgoingCallData(null) }
          setCallStatus("idle"); setIsCallLoading(false); setVideoCallChannel("")
          toast.error("L'appel n'a pas été répondu")
          break
        case "VIDEO_CALL_USER_DISCONNECTED":
          if (message.data?.channelName === videoCallChannel) {
            toast.warning("Un participant s'est déconnecté")
            if (remoteUsers.length <= 1) toast.info("L'autre participant a quitté l'appel", { duration: 5000, action: { label: "Terminer", onClick: () => handleEndCall() } })
          }
          break
        case "VIDEO_CALL_CONNECTED": setCallStatus("connected"); setIsCallLoading(false); break
        case "SERVER_SHUTDOWN":
          toast.warning("Le serveur de messagerie redémarre...")
          if (isVideoCallOpen || showOutgoingCall || showIncomingCall) handleEndCall()
          break
        case "SESSION_REPLACED":
          toast.info("Vous vous êtes connecté depuis un autre appareil")
          if (isVideoCallOpen || showOutgoingCall || showIncomingCall) handleEndCall()
          break
        case "VIDEO_CALL_INCOMING":
          if (isVideoCallOpen || showOutgoingCall || showIncomingCall) return
          setIncomingCallData({ callerName: message.data.callerName || "Utilisateur", callerAvatar: message.data.callerAvatar, channelName: message.data.channelName, conversationId: message.data.conversationId, isVideoCall: message.data.isVideoCall !== false })
          setShowIncomingCall(true)
          try {
            const audio = new Audio("/sounds/incoming-call.mp3")
            audio.loop = true
            audio.play().catch(err => console.log("Audio error:", err))
            setTimeout(() => { audio.pause(); audio.currentTime = 0 }, 30000)
          } catch (error) { console.log("Audio error:", error) }
          break
        case "VIDEO_CALL_ACCEPTED":
          setShowOutgoingCall(false); setIsVideoCallOpen(true); setCallStatus("connected"); setIsCallLoading(false)
          toast.success("Appel accepté !")
          break
        case "VIDEO_CALL_DECLINED":
          setShowOutgoingCall(false); setCallStatus("idle"); setOutgoingCallData(null); setIsCallLoading(false)
          toast.error("Appel refusé")
          break
        case "VIDEO_CALL_CANCELLED":
          if (showIncomingCall) {
            setShowIncomingCall(false); setIncomingCallData(null)
            toast.info("L'appel a été annulé")
            document.querySelectorAll("audio").forEach(a => { a.pause(); a.currentTime = 0 })
          }
          break
        case "VIDEO_CALL_ENDED":
          if (message.data?.channelName === videoCallChannel) { handleEndCall(); toast.info("L'autre participant a quitté l'appel") }
          break
        case "VIDEO_CALL_MISSED": toast.info("Vous avez manqué un appel"); break
        case "NEW_MESSAGE": {
          const newMsg = message.data
          if (!newMsg?.conversationId || !newMsg._id) break
          conversationManager.addMessage(newMsg)
          if (newMsg.conversationId === conversationManager.selectedConversationId) {
            scrollToBottom()
            conversationManager.updateConversation(newMsg.conversationId, { unreadCount: 0, lastMessage: newMsg.content, updatedAt: new Date().toISOString() })
          } else {
            const conv = conversationManager.getConversation(newMsg.conversationId)
            if (conv) conversationManager.updateConversation(newMsg.conversationId, { unreadCount: (conv.unreadCount || 0) + 1, lastMessage: newMsg.content, updatedAt: new Date().toISOString() })
          }
          break
        }
        case "MESSAGE_SENT": {
          const sentMsg = message.data
          if (!sentMsg?.conversationId || !sentMsg?.tempId) break
          const currentMsgs = conversationManager.getCachedMessages(sentMsg.conversationId)
          conversationManager.updateMessages(sentMsg.conversationId, currentMsgs.map(msg => msg._id === sentMsg.tempId ? { ...msg, _id: sentMsg.messageId, createdAt: sentMsg.createdAt || msg.createdAt } : msg))
          break
        }
        case "USER_TYPING":
          if (!message.data?.conversationId || !message.data?.userId) break
          typingManager.startTyping(message.data.conversationId, message.data.userId, message.data.userName || "Utilisateur")
          break
        case "USER_STOPPED_TYPING":
          if (!message.data?.conversationId || !message.data?.userId) break
          typingManager.stopTyping(message.data.conversationId)
          break
        case "ERROR":
          toast.error(message.data?.message || "Erreur de connexion")
          break
        default: break
      }
    } catch (error) { console.error("Erreur traitement message WS:", error) }
  }, [conversationManager, scrollToBottom, typingManager, videoCallChannel, handleEndCall, isVideoCallOpen, showOutgoingCall, showIncomingCall, remoteUsers])

  const wsManager = useWebSocketManager(handleWebSocketMessage)

  // ── Conversation selection ────────────────────────────────────────────────
  const handleSelectConversation = useCallback((convId: string) => {
    if (!convId || lastSelectedConversation.current === convId) return
    lastSelectedConversation.current = convId
    typingManager.cleanup()
    conversationManager.selectConversation(convId)
    try { window.history.pushState({}, "", `/messages/${convId}`) } catch (error) { console.log("History push error:", error) }
    setTimeout(() => fetchMessages(convId), 50)
  }, [conversationManager, typingManager, fetchMessages])

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(async (content: string, convId: string) => {
    if (!content.trim() || !session?.user) throw new Error("Message vide ou utilisateur non connecté")
    const conversation = conversationManager.getConversation(convId)
    if (!conversation) throw new Error("Conversation non trouvée")
    const receiver = conversation.participants.find(p => p._id !== (session.user as any).id)
    if (!receiver) throw new Error("Destinataire non trouvé")

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const tempMessage: Message = { _id: tempId, conversationId: convId, senderId: (session.user as any).id, receiverId: receiver._id, content: content.trim(), read: false, createdAt: new Date().toISOString(), isAIMessage: false }
    conversationManager.addMessage(tempMessage)
    scrollToBottom()

    try {
      const ws = (window as any).wsRef?.current
      if (!ws || ws.readyState !== WebSocket.OPEN) throw new Error("WebSocket non connecté")
      ws.send(JSON.stringify({ type: "SEND_MESSAGE", data: { conversationId: convId, receiverId: receiver._id, content: content.trim(), tempId, senderName: session.user.name, senderAvatar: (session.user as any).image }, messageId: `send-${Date.now()}` }))
    } catch (error: any) {
      conversationManager.removeMessage(convId, tempId)
      toast.error("Erreur envoi message")
      throw error
    }
  }, [conversationManager, session, scrollToBottom])

  // ── Send AI message ───────────────────────────────────────────────────────
  const handleSendAIMessage = useCallback(async (content: string, convId: string) => {
    if (!content.trim() || !session?.user) throw new Error("Message vide")
    const conversation = conversationManager.getConversation(convId)
    if (!conversation) throw new Error("Conversation non trouvée")
    const otherParticipant = conversation.participants.find(p => p._id !== (session.user as any).id)
    const tempId = `temp-ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const tempUserMessage: Message = { _id: tempId, conversationId: convId, senderId: (session.user as any).id, receiverId: otherParticipant?._id || "ai-assistant", content: content.trim(), read: false, createdAt: new Date().toISOString(), isAIMessage: false }
    conversationManager.addMessage(tempUserMessage)
    scrollToBottom()

    try {
      const response = await fetch("/api/ai/chat-assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: content.trim(), conversationId: convId, conversationType: "general" }) })
      if (!response.ok) { const errorData = await response.json().catch(() => ({ error: "Unknown error" })); throw new Error(errorData.error || "AI API call failed") }
      const data = await response.json()
      conversationManager.removeMessage(convId, tempId)
      conversationManager.addMessage({ _id: data.userMessage?.messageId || `user-${Date.now()}`, conversationId: convId, senderId: (session.user as any).id, receiverId: otherParticipant?._id || "ai-assistant", content: content.trim(), read: false, createdAt: data.userMessage?.createdAt || new Date().toISOString(), isAIMessage: false })
      conversationManager.addMessage({ _id: data.response?.messageId || `ai-${Date.now()}`, conversationId: convId, senderId: data.response?.aiUser?._id || "ai-assistant", receiverId: (session.user as any).id, content: data.response?.content || "Désolé, je n'ai pas pu générer de réponse.", read: false, createdAt: data.response?.createdAt || new Date().toISOString(), isAIMessage: true, aiUser: data.response?.aiUser })
      scrollToBottom()
      return data
    } catch (error: any) {
      conversationManager.removeMessage(convId, tempId)
      toast.error("Erreur avec l'assistant AI")
      throw error
    }
  }, [conversationManager, session, scrollToBottom])

  // ── Create AI conversation ─────────────────────────────────────────────────
  const createAIConversation = useCallback(async () => {
    if (sessionStatus !== "authenticated") { toast.error("Veuillez vous connecter"); return }
    try {
      const existingAIConv = conversationManager.conversations.find(conv => conv.isAIConversation || conv.participants?.some((p: any) => p.role === "ai_assistant"))
      if (existingAIConv) { handleSelectConversation(existingAIConv._id); toast.success("Conversation AI rouverte !"); return }
      const response = await fetch("/api/ai/chat-assistant", { method: "PUT" })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      if (!data.conversation?._id) throw new Error("Réponse API invalide")
      await fetchConversations()
      handleSelectConversation(data.conversation._id)
      toast.success("Conversation AI créée !")
      setTimeout(() => { conversationManager.addMessage({ _id: `ai-welcome-${Date.now()}`, conversationId: data.conversation._id, senderId: data.aiUser?._id || "ai-assistant", receiverId: (session?.user as any)?.id, content: "👋 Bonjour ! Je suis votre assistant AI. Comment puis-je vous aider ?", read: false, createdAt: new Date().toISOString(), isAIMessage: true, aiUser: data.aiUser }); scrollToBottom() }, 500)
    } catch (error) { console.error("Erreur création conversation AI:", error); toast.error("Erreur lors de la création de la conversation AI") }
  }, [conversationManager, handleSelectConversation, fetchConversations, scrollToBottom, sessionStatus, session])

  // ── Create normal conversation ─────────────────────────────────────────────
  const createConversation = useCallback(async (user: User) => {
    if (!user?._id || sessionStatus !== "authenticated") { toast.error("Données utilisateur invalides"); return }
    try {
      const existingConv = conversationManager.conversations.find(conv => conv.participants?.some((p: any) => p._id === user._id))
      if (existingConv) { router.push(`/messages/${existingConv._id}`); setShowNewConversation(false); setSearchQuery(""); setSearchResults([]); return }
      const response = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ participantIds: [user._id] }) })
      if (response.ok) {
        const data = await response.json()
        setShowNewConversation(false); setSearchQuery(""); setSearchResults([])
        await fetchConversations()
        router.push(`/messages/${data.conversation._id}`)
        toast.success("Conversation créée !")
      } else throw new Error("Erreur création conversation")
    } catch (error) { console.error("Erreur création conversation:", error); toast.error("Erreur lors de la création de la conversation") }
  }, [conversationManager, router, fetchConversations, sessionStatus])

  // ── Delete conversation ────────────────────────────────────────────────────
  const deleteConversation = async (convId: string) => {
    if (!convId || sessionStatus !== "authenticated") { toast.error("ID de conversation invalide"); return }
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/conversations?conversationId=${convId}`, { method: "DELETE" })
      if (response.ok) {
        conversationManager.removeConversation(convId)
        if (conversationManager.selectedConversationId === convId) {
          conversationManager.selectConversation(null)
          lastSelectedConversation.current = null
          router.push("/messages")
        }
        toast.success("Conversation supprimée")
        setShowDeleteModal(false)
        setConversationToDelete(null)
      } else throw new Error("Erreur lors de la suppression")
    } catch (error: any) {
      console.error("Erreur suppression:", error)
      toast.error(error.message || "Erreur lors de la suppression")
    } finally { setIsDeleting(false) }
  }

  // ── Accept incoming call ───────────────────────────────────────────────────
  const handleAcceptIncomingCall = useCallback(() => {
    if (!incomingCallData) { toast.error("Erreur: données d'appel manquantes"); return }
    setShowIncomingCall(false)
    document.querySelectorAll("audio").forEach(a => { a.pause(); a.currentTime = 0 })
    const channelToUse = incomingCallData.channelName
    setVideoCallChannel(channelToUse)
    if (incomingCallData.conversationId !== conversationManager.selectedConversationId) handleSelectConversation(incomingCallData.conversationId)
    try {
      const ws = (window as any).wsRef?.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "VIDEO_CALL_ACCEPTED", data: { conversationId: incomingCallData.conversationId, channelName: channelToUse, userId: (session?.user as any)?.id, userName: session?.user?.name }, messageId: `call-accept-${Date.now()}` }))
      } else { toast.error("Erreur de connexion au serveur"); setIncomingCallData(null); return }
    } catch (error) { toast.error("Erreur lors de l'acceptation de l'appel"); setIncomingCallData(null); return }
    setTimeout(() => { setIsVideoCallOpen(true); setCallStatus("connecting"); setIsCallLoading(false); toast.success("Connexion à l'appel...") }, 500)
    setIncomingCallData(null)
  }, [incomingCallData, conversationManager.selectedConversationId, session, handleSelectConversation])

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStatus === "authenticated") wsManager.connect()
    else if (sessionStatus === "unauthenticated") { wsManager.cleanup(); conversationManager.clearAll(); typingManager.cleanup() }
  }, [sessionStatus, wsManager, conversationManager, typingManager])

  useEffect(() => {
    if (sessionStatus === "authenticated" && !hasLoadedInitialConversations.current) {
      hasLoadedInitialConversations.current = true
      fetchConversations()
    }
  }, [sessionStatus, fetchConversations])

  useEffect(() => {
    const searchUsers = async (query: string) => {
      if (!query.trim() || sessionStatus !== "authenticated") { setSearchResults([]); return }
      setIsSearching(true)
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data.users?.filter((user: User) => user._id !== (session?.user as any)?.id) || [])
        }
      } catch (error) { console.error("Erreur recherche:", error) } finally { setIsSearching(false) }
    }
    const timeoutId = setTimeout(() => searchUsers(searchQuery), 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, session, sessionStatus])

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showOutgoingCall) handleCancelOutgoingCall()
        else if (showIncomingCall) handleDeclineIncomingCall()
        else if (isVideoCallOpen) handleEndCall()
      }
    }
    document.addEventListener("keydown", handleEscKey)
    return () => document.removeEventListener("keydown", handleEscKey)
  }, [showOutgoingCall, showIncomingCall, isVideoCallOpen, handleCancelOutgoingCall, handleDeclineIncomingCall, handleEndCall])

  useEffect(() => {
    return () => { if (isVideoCallOpen || showOutgoingCall || showIncomingCall) handleEndCall() }
  }, [isVideoCallOpen, showOutgoingCall, showIncomingCall, handleEndCall])

  // ── Derived state ─────────────────────────────────────────────────────────
  const selectedConversation = conversationManager.getConversation(conversationManager.selectedConversationId || "")
  const otherParticipant = selectedConversation?.participants?.find(p => p._id !== (session?.user as any)?.id)
  const conversationContext = selectedConversation ? {
    conversationId: selectedConversation._id,
    participants: selectedConversation.participants || [],
    isAIConversation: selectedConversation.isAIConversation || otherParticipant?.role === "ai_assistant",
    userId: (session?.user as any)?.id,
    userName: session?.user?.name,
    userEmail: session?.user?.email
  } : null

  const isCallActive = isVideoCallOpen || showOutgoingCall || showIncomingCall

  // ── Message render ────────────────────────────────────────────────────────
  const renderMessages = () => {
    if (!conversationManager.messages.length) return null
    return conversationManager.messages.map((msg, index) => {
      const isMe = msg.senderId === (session?.user as any)?.id
      const isAI = msg.isAIMessage || (otherParticipant?.role === "ai_assistant" && !isMe)
      const showAvatar = index === 0 || conversationManager.messages[index - 1]?.senderId !== msg.senderId
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

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 relative">

      {/* Debug panel — dev only */}
      {process.env.NODE_ENV === "development" && (
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

      {/* Call popups */}
      <IncomingCallPopup
        isOpen={showIncomingCall}
        callerName={incomingCallData?.callerName || "Utilisateur"}
        callerAvatar={incomingCallData?.callerAvatar}
        isVideoCall={incomingCallData?.isVideoCall || true}
        onAccept={handleAcceptIncomingCall}
        onDecline={handleDeclineIncomingCall}
      />
      <OutgoingCallPopup
        isOpen={showOutgoingCall}
        recipientName={outgoingCallData?.recipientName || "Utilisateur"}
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

      {/* ConversationsSidebar - gère sa propre responsivité */}
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

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative bg-white/50 dark:bg-gray-900/50">
        {selectedConversation ? (
          <>
            <ChatHeader
              onOpenSettings={() => setShowSettings(true)}
              conversation={selectedConversation}
              otherParticipant={otherParticipant}
              onRefresh={() => {
                if (conversationManager.selectedConversationId) fetchMessages(conversationManager.selectedConversationId)
              }}
              isConnected={wsManager.isConnected}
              onStartVideoCall={handleStartVideoCall}
              onStartVoiceCall={() => toast.info("Appel vocal - À implémenter")}
              onEndCall={handleEndCall}
              callStatus={callStatus}
              callRemoteCount={remoteUsers.length}
              isCallActive={isCallActive}
            />

            {/* Messages area - scrollable */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
              style={{ 
                WebkitOverflowScrolling: "touch",
                scrollBehavior: "smooth"
              }}
            >
              {conversationManager.messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-6 sm:p-8">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                    <span className="text-3xl">💬</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Aucun message
                  </h3>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-sm">
                    {conversationContext?.isAIConversation
                      ? "Demandez-moi de l'aide pour vos projets ou posez-moi vos questions !"
                      : "Envoyez le premier message pour commencer la conversation"}
                  </p>
                  {!conversationContext?.isAIConversation && !isVideoCallOpen && (
                    <div className="mt-5 sm:mt-6">
                      <button
                        onClick={handleStartVideoCall}
                        disabled={isCallLoading || showOutgoingCall || showIncomingCall}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-full hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                      >
                        <span className="text-xl">📹</span>
                        <span className="font-semibold">
                          {isCallLoading ? "Appel en cours..." : "Commencer un appel vidéo"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
                  {renderMessages()}
                  <TypingIndicator text={typingManager.getTypingText(conversationManager.selectedConversationId!)} />
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <MessageInput
              onSendMessage={handleSendMessage}
              onSendAIMessage={handleSendAIMessage}
              selectedConversation={conversationManager.selectedConversationId}
              disabled={(!wsManager.isConnected && !conversationContext?.isAIConversation) || isVideoCallOpen}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              conversationContext={conversationContext}
              isConnected={wsManager.isConnected}
            />
          </>
        ) : (
          /* Empty state — no conversation selected */
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="text-center">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-4xl sm:text-5xl">👋</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                {conversationManager.conversations.length === 0 ? "Bienvenue dans la messagerie" : "Sélectionnez une conversation"}
              </h3>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-5 sm:mb-6 max-w-md">
                {conversationManager.conversations.length === 0
                  ? "Commencez par créer une nouvelle conversation pour discuter avec vos contacts ou avec notre assistant AI"
                  : "Choisissez une conversation dans la liste pour afficher les messages"}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setShowNewConversation(true)}
                  disabled={!wsManager.isConnected || isCallLoading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                >
                  Nouvelle conversation
                </button>
                <button
                  onClick={createAIConversation}
                  disabled={isCallLoading}
                  className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <span>🤖</span>
                  Discuter avec l'AI
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ───────────────────────────────────────────────────────── */}
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
        onClose={() => { setShowNewConversation(false); setSearchQuery(""); setSearchResults([]) }}
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
        onClose={() => { setShowDeleteModal(false); setConversationToDelete(null) }}
        conversation={conversationToDelete}
        onDelete={deleteConversation}
        isDeleting={isDeleting}
        session={session}
      />
    </div>
  )
}