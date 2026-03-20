"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

// Components UI
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Send, 
  Search, 
  Video, 
  Phone, 
  MoreVertical, 
  Plus,
  Users,
  X,
  RefreshCw,
  Trash2, // Nouvelle icône
  AlertTriangle 
} from "lucide-react"

// Types
interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  title?: string
  skills?: string[]
}

interface Conversation {
  _id: string
  participants: Array<{
    _id: string
    name: string
    email: string
    avatar?: string
  }>
  lastMessage?: string
  updatedAt: string
  unreadCount: number
}

interface Message {
  _id: string
  conversationId: string
  senderId: string
  receiverId: string
  content: string
  read: boolean
  createdAt: string
}

export default function MessagesPages() {
  // 🔥 SERVICE DE POLLING INTELLIGENT
const useMessagePoller = () => {
  const pollingRef = useRef<{
    interval: NodeJS.Timeout | null;
    isPolling: boolean;
    currentConversation: string | null;
  }>({
    interval: null,
    isPolling: false,
    currentConversation: null
  });

  const startPolling = useCallback((conversationId: string, fetchFunction: (id: string) => Promise<void>) => {
    // Arrêter le polling précédent
    if (pollingRef.current.interval) {
      clearInterval(pollingRef.current.interval);
    }

    console.log(`🔄 [POLLER] Démarrage polling pour: ${conversationId}`);
    pollingRef.current.isPolling = true;
    pollingRef.current.currentConversation = conversationId;

    // Premier appel IMMÉDIAT
    console.log('🚀 [POLLER] Premier appel immédiat');
    fetchFunction(conversationId);

    // Polling toutes les 2 secondes
    pollingRef.current.interval = setInterval(() => {
      if (pollingRef.current.isPolling && pollingRef.current.currentConversation === conversationId) {
        console.log('🔄 [POLLER] Rappel automatique');
        fetchFunction(conversationId);
      }
    }, 2000);

  }, []);

  const stopPolling = useCallback(() => {
    console.log('🛑 [POLLER] Arrêt du polling');
    pollingRef.current.isPolling = false;
    pollingRef.current.currentConversation = null;
    
    if (pollingRef.current.interval) {
      clearInterval(pollingRef.current.interval);
      pollingRef.current.interval = null;
    }
  }, []);

  const isPolling = useCallback(() => pollingRef.current.isPolling, []);

  return { startPolling, stopPolling, isPolling };
};
  console.log('🎬 MessagesPage rendu');
 // Dans votre composant MessagesPage, ajoutez :
const { startPolling, stopPolling, isPolling } = useMessagePoller();

// État pour suivre si les messages sont chargés
const [messagesLoaded, setMessagesLoaded] = useState(false); 
  const { data: session } = useSession()
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // 🔧 ÉTAT WEBSOCKET SIMPLIFIÉ
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const pendingRequestsRef = useRef<Map<string, (data: any) => void>>(new Map())
  const reconnectAttemptRef = useRef(0)
  const isManualReconnectRef = useRef(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Ajoutez ces imports

// Ajoutez ces états
const [showDeleteModal, setShowDeleteModal] = useState(false)
const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null)
const [isDeleting, setIsDeleting] = useState(false)

// 🔥 Fonction pour supprimer une conversation
const deleteConversation = async (conversationId: string) => {
  if (!conversationId) return

  setIsDeleting(true)
  try {
    const response = await fetch(`/api/conversations?conversationId=${conversationId}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      const data = await response.json()
      
      // Mettre à jour l'état local
      setConversations(prev => prev.filter(conv => conv._id !== conversationId))
      
      // Si la conversation supprimée était sélectionnée, la désélectionner
      if (selectedConversation === conversationId) {
        setSelectedConversation(null)
        setMessages([])
      }
      
      toast.success("Conversation supprimée avec succès")
      setShowDeleteModal(false)
      setConversationToDelete(null)
    } else {
      const error = await response.json()
      throw new Error(error.error || "Erreur lors de la suppression")
    }
  } catch (error: any) {
    console.error("❌ Erreur suppression conversation:", error)
    toast.error(error.message || "Erreur lors de la suppression")
  } finally {
    setIsDeleting(false)
  }
}

// 🔥 Ouvrir la modal de confirmation
const openDeleteModal = (conversation: Conversation, e: React.MouseEvent) => {
  e.stopPropagation() // Empêcher la sélection de la conversation
  setConversationToDelete(conversation)
  setShowDeleteModal(true)
}

// 🔥 Fermer la modal
const closeDeleteModal = () => {
  setShowDeleteModal(false)
  setConversationToDelete(null)
}
  // 📨 Gérer TOUS les messages WebSocket - CORRIGÉ
  const handleWebSocketMessage = useCallback((message: any) => {
    console.log('📨 [FRONT] Traitement message:', message.type);
    
    // Gérer les réponses aux requêtes
    if (message.messageId && pendingRequestsRef.current.has(message.messageId)) {
      const resolver = pendingRequestsRef.current.get(message.messageId)!;
      resolver(message);
      pendingRequestsRef.current.delete(message.messageId);
    }

    switch (message.type) {
      case 'AUTH_SUCCESS':
        console.log('🔐 Authentifié avec succès');
        break;
        
      case 'CONVERSATIONS_FETCHED':
        console.log('📋 Conversations reçues:', message.data.conversations?.length);
        
        // ⭐ CORRECTION: Fusion intelligente au lieu de remplacement complet
        setConversations(prev => {
          const newConvs = message.data.conversations || [];
          
          // Si c'est le premier chargement
          if (prev.length === 0 || isLoading) {
            return newConvs;
          }
          
          // Fusionner intelligemment
          const merged = [...prev];
          
          newConvs.forEach((newConv: Conversation) => {
            const existingIndex = merged.findIndex(c => c._id === newConv._id);
            if (existingIndex >= 0) {
              // Mettre à jour seulement les champs nécessaires
              merged[existingIndex] = {
                ...merged[existingIndex],
                lastMessage: newConv.lastMessage,
                updatedAt: newConv.updatedAt,
                unreadCount: newConv.unreadCount
              };
            } else {
              // Ajouter nouvelle conversation
              merged.push(newConv);
            }
          });
          
          // Trier par date de mise à jour
          return merged.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        });
        
        setIsLoading(false);
        break;
        
      case 'MESSAGES_FETCHED':
        console.log('📨 Messages reçus:', message.data.messages?.length);
        if (message.data.conversationId === selectedConversation) {
          setMessages(message.data.messages || []);
          scrollToBottom();
        }
        break;
        
      case 'NEW_MESSAGE':
        console.log('💬 Nouveau message reçu');
        const newMessage = message.data;
        
        if (newMessage.conversationId === selectedConversation) {
          setMessages(prev => [...(prev || []), newMessage]);
          scrollToBottom();
        }
        
        // ⭐ CORRECTION: Mise à jour précise des conversations
        setConversations(prev => {
          return prev.map(conv => {
            if (conv._id === newMessage.conversationId) {
              return {
                ...conv,
                lastMessage: newMessage.content,
                updatedAt: new Date().toISOString(),
                unreadCount: conv._id === selectedConversation ? 0 : (conv.unreadCount || 0) + 1
              };
            }
            return conv;
          }).sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        });
        break;
        
      case 'MESSAGE_SENT':
        console.log('✅ Message sauvegardé:', message.data.messageId);
        setMessages(prev => 
          prev?.map(msg => 
            msg._id === message.data.tempId 
              ? { 
                  ...msg, 
                  _id: message.data.messageId,
                  createdAt: message.data.createdAt
                }
              : msg
          ) || []
        );
        break;
        
      case 'MESSAGES_READ_CONFIRMATION':
        console.log('📖 Messages marqués comme lus:', message.data.readCount);
        setConversations(prev => 
          prev.map(conv => 
            conv._id === message.data.conversationId 
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
        break;
        
      default:
        // Ignorer les autres types de messages
        break;
    }
  }, [selectedConversation, isLoading]);

  // 🔄 Auto-scroll vers le bas
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  // 🔄 Envoyer un message WebSocket
  const sendWebSocketMessage = useCallback((type: string, data: any, messageId?: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket non connecté'));
        return;
      }

      const msgId = messageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const message = {
        type,
        data,
        messageId: msgId
      };

      console.log(`📤 [FRONT] Envoi WebSocket: ${type}`);

      pendingRequestsRef.current.set(msgId, resolve);

      const timeout = setTimeout(() => {
        if (pendingRequestsRef.current.has(msgId)) {
          console.log(`⏰ Timeout requête: ${msgId}`);
          pendingRequestsRef.current.delete(msgId);
          reject(new Error(`Timeout WebSocket: ${type}`));
        }
      }, 10000);

      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('❌ Erreur envoi WebSocket:', error);
        clearTimeout(timeout);
        pendingRequestsRef.current.delete(msgId);
        reject(new Error('Erreur envoi message'));
      }
    });
  }, []);

  // 🔄 Charger les conversations
  const fetchConversations = useCallback(async () => {
    // ⭐ CORRECTION: Éviter les appels inutiles
    if (isLoading) {
      console.log('🔄 fetchConversations déjà en cours, ignoré');
      return;
    }
    
    console.log('🔄 [FRONT] fetchConversations appelé');
    
    try {
      await sendWebSocketMessage('GET_MESSAGES', {}, `fetch-conversations-${Date.now()}`);
    } catch (error: any) {
      console.error('❌ [FRONT] Erreur WebSocket:', error.message);
      try {
        const response = await fetch("/api/conversations");
        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations || []);
          toast.success('Conversations chargées (mode dégradé)');
        }
      } catch (restError) {
        console.error('❌ [FRONT] REST aussi en échec:', restError);
        toast.error('Impossible de charger les conversations');
      }
    } finally {
      setIsLoading(false);
    }
  }, [sendWebSocketMessage, isLoading]);

  // 🔄 Charger les messages d'une conversation
// 🔄 fetchMessages avec gestion d'état
// 🔄 CORRECTION COMPLÈTE du fetchMessages
const fetchMessages = useCallback(async (conversationId: string) => {
  console.log(`🚀 [FETCH] Appel pour: ${conversationId}`);
  
  try {
    const ws = wsRef.current;
    
    // Stratégie: WebSocket d'abord, REST en fallback
    if (ws && isConnected && ws.readyState === WebSocket.OPEN) {
      console.log('📡 Tentative WebSocket...');
      
      try {
        await sendWebSocketMessage('GET_MESSAGES', { conversationId }, `get-messages-${Date.now()}`);
        console.log('✅ Succès WebSocket');
        // NE PAS arrêter le polling ici - seulement quand on a des messages stables
        return;
      } catch (error) {
        console.log('❌ WebSocket échoué, fallback REST...');
      }
    }

    // Fallback REST
    console.log('🌐 Chargement via REST...');
    const response = await fetch(`/api/messages?conversationId=${conversationId}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${data.messages?.length} messages chargés via REST`);
      
      setMessages(data.messages || []);
      scrollToBottom();
      
      // Marquer comme lus
      fetch(`/api/messages/read`, {
        method: 'POST',
        body: JSON.stringify({ conversationId })
      }).catch(console.error);
      
    } else {
      throw new Error('REST failed');
    }
    
  } catch (error) {
    console.error('❌ Échec chargement:', error);
    // Le polling continuera à réessayer
  }
}, [isConnected, sendWebSocketMessage, scrollToBottom]);

  // 🔌 Nettoyer la connexion WebSocket
  const cleanupWebSocket = useCallback(() => {
    console.log('🧹 Nettoyage WebSocket');
    
    // Nettoyer tous les timeouts
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Fermer la connexion WebSocket
    if (wsRef.current) {
      wsRef.current.close(1000, "Cleanup");
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  // 🔌 Créer une connexion WebSocket
  const createWebSocketConnection = useCallback(() => {
    if (!session?.user) {
      console.log('🚨 Pas de session utilisateur');
      return;
    }

    // Nettoyer toute connexion existante
    cleanupWebSocket();

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://nrbtalentsws.onrender.com/api/ws';
    console.log(`🔌 Tentative de connexion WebSocket: ${wsUrl}`);
    
    try {
      const websocket = new WebSocket(wsUrl);
      wsRef.current = websocket;

      // Timeout de connexion
      connectionTimeoutRef.current = setTimeout(() => {
        if (websocket.readyState !== WebSocket.OPEN) {
          console.log('⏰ Timeout connexion WebSocket');
          websocket.close();
          setIsConnected(false);
          if (!isManualReconnectRef.current) {
            toast.error("Timeout de connexion au serveur");
          }
        }
      }, 8000);

      websocket.onopen = () => {
        console.log('✅ WebSocket connecté');
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        setIsConnected(true);
        reconnectAttemptRef.current = 0;
        isManualReconnectRef.current = false;

        // Authentification
        websocket.send(JSON.stringify({
          type: 'AUTH',
          data: { userId: (session.user as any).id }
        }));

        // Heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({ type: 'PING' }));
          }
        }, 25000);
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('❌ Erreur parsing message:', error);
        }
      };

      websocket.onclose = (event) => {
        console.log(`🔴 WebSocket déconnecté: ${event.code} - ${event.reason}`);
        cleanupWebSocket();

        // Reconnexion automatique (sauf si fermeture normale)
        if (event.code !== 1000 && !isManualReconnectRef.current) {
          const attempt = reconnectAttemptRef.current + 1;
          reconnectAttemptRef.current = attempt;
          const timeout = Math.min(1000 * Math.pow(2, attempt), 10000);
          
          console.log(`🔄 Reconnexion dans ${timeout}ms (tentative ${attempt})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            createWebSocketConnection();
          }, timeout);
        }
      };

      websocket.onerror = (error) => {
        console.error('💥 Erreur WebSocket:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('❌ Erreur création WebSocket:', error);
      setIsConnected(false);
    }
  }, [session, handleWebSocketMessage, cleanupWebSocket]);

  // 🔌 Reconnexion manuelle
  const reconnectWebSocket = useCallback(() => {
    console.log('🔄 Reconnexion manuelle');
    isManualReconnectRef.current = true;
    createWebSocketConnection();
  }, [createWebSocketConnection]);

  // 🌐 Gestion de la session et connexion WebSocket
  useEffect(() => {
    if (session?.user) {
      console.log('👤 Session utilisateur détectée, connexion WebSocket...');
      createWebSocketConnection();
    } else {
      console.log('👤 Pas de session utilisateur, nettoyage WebSocket...');
      cleanupWebSocket();
      setConversations([]);
      setMessages([]);
      setIsLoading(false);
    }

    return () => {
      console.log('🧹 Nettoyage composant MessagesPage');
      cleanupWebSocket();
    };
  }, [session, createWebSocketConnection, cleanupWebSocket]);

  // 📥 Charger les messages quand une conversation est sélectionnée
  // 📥 EFFET CORRIGÉ - Démarrage automatique du polling
useEffect(() => {
  if (selectedConversation && isConnected) {
    console.log(`🎯 [EFFET] Conversation sélectionnée: ${selectedConversation}`);
    
    // Reset état
    setMessages([]);
    setMessagesLoaded(false);
    if(!messagesLoaded){
    // Démarrer le polling IMMÉDIATEMENT
    startPolling(selectedConversation, fetchMessages);
    }
    // Arrêter le polling quand la conversation change ou composant unmount
    return () => {
      console.log('🧹 [EFFET] Nettoyage polling');
      stopPolling();
    };
  }
}, [selectedConversation, isConnected, fetchMessages, startPolling, stopPolling]);
// 🛑 Arrêter le polling quand les messages sont chargés
useEffect(() => {
  if (messagesLoaded && isPolling()) {
    console.log('🎉 [SUCCÈS] Messages chargés, arrêt du polling');
    stopPolling();
  }
}, [messagesLoaded, isPolling, stopPolling]);
  // 🔍 Recherche d'utilisateurs
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        const filteredUsers = data.users?.filter((user: User) => 
          user._id !== (session?.user as any)?.id
        ) || [];
        setSearchResults(filteredUsers);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  }, [session]);

  // 💬 Créer une conversation
  const createConversation = useCallback(async (user: User) => {
    try {
      const existingConv = conversations.find(conv => 
        conv.participants.some(p => p._id === user._id)
      );

      if (existingConv) {
        setSelectedConversation(existingConv._id);
        setShowNewConversation(false);
        setSearchQuery("");
        setSearchResults([]);
        return;
      }

      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantIds: [user._id] }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowNewConversation(false);
        setSearchQuery("");
        setSearchResults([]);
        await fetchConversations();
        setSelectedConversation(data.conversation._id);
        toast.success("Conversation créée !");
      } else {
        throw new Error("Erreur création conversation");
      }
    } catch (error) {
      console.error("Erreur création conversation:", error);
      toast.error("Erreur création conversation");
    }
  }, [conversations, fetchConversations]);

  // 💬 Gérer le clic sur un utilisateur
  const handleUserClick = useCallback(async (user: User) => {
    try {
      const existingConversation = conversations.find(conv => 
        conv.participants.some(p => p._id === user._id)
      );

      if (existingConversation) {
        setSelectedConversation(existingConversation._id);
        setShowNewConversation(false);
        setSearchQuery("");
        setSearchResults([]);
      } else {
        await createConversation(user);
      }
    } catch (error) {
      console.error("Erreur sélection utilisateur:", error);
      toast.error("Erreur lors de la sélection");
    }
  }, [conversations, createConversation]);

  // 📤 Envoyer un message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!messageInput.trim() || !selectedConversation || !session?.user) return

    setIsSending(true)
    
    const tempId = `temp-${Date.now()}`
    const originalMessage = messageInput;
    
    try {
      const selectedConv = conversations.find(c => c._id === selectedConversation)
      const receiver = selectedConv?.participants.find(p => p._id !== (session.user as any).id)

      if (!receiver) throw new Error("Destinataire non trouvé")
      
      const optimisticMessage: Message = {
        _id: tempId,
        conversationId: selectedConversation,
        senderId: (session.user as any).id,
        receiverId: receiver._id,
        content: messageInput.trim(),
        read: false,
        createdAt: new Date().toISOString(),
      }
      
      setMessages(prev => [...(prev || []), optimisticMessage])
      setMessageInput("")
      scrollToBottom()

      await sendWebSocketMessage('SEND_MESSAGE', {
        conversationId: selectedConversation,
        receiverId: receiver._id,
        content: originalMessage.trim(),
        tempId: tempId
      })

    } catch (error: any) {
      console.error("❌ Erreur envoi message:", error)
      toast.error("Erreur envoi message - Réessayez")
      setMessages(prev => prev?.filter(msg => msg._id !== tempId) || [])
      setMessageInput(originalMessage);
    } finally {
      setIsSending(false)
    }
  }

  // 🎥 Appel vidéo
  const handleStartVideoCall = async () => {
    if (!selectedConversation) return

    try {
      const selectedConv = conversations.find(c => c._id === selectedConversation)
      const participant = selectedConv?.participants.find(p => p._id !== (session?.user as any)?.id)

      const response = await fetch("/api/video/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: participant?._id,
          conversationId: selectedConversation,
        }),
      })

      const data = await response.json()
      if (data.success) {
        window.open(data.roomUrl, "_blank", "width=1200,height=800")
        toast.success("Appel vidéo démarré !")
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Erreur démarrage appel vidéo:", error)
      toast.error("Erreur démarrage appel vidéo")
    }
  }

  // 🔍 Recherche avec debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchUsers]);

  const selectedConv = conversations.find(c => c._id === selectedConversation)
  const otherParticipant = selectedConv?.participants.find(p => p._id !== (session?.user as any)?.id)

  return (
    <div className="flex h-screen bg-background">
      {/* Status WebSocket */}
      <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
        isConnected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      }`}>
        <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-white' : 'bg-white'}`} />
        {isConnected ? 'Connecté' : 'Déconnecté'}
        
        {!isConnected && reconnectAttemptRef.current > 0 && (
          <span className="ml-1">({reconnectAttemptRef.current})</span>
        )}
        
        {!isConnected && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-4 px-2 text-xs bg-white/20"
            onClick={reconnectWebSocket}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Conversations List - CORRIGÉ : Supprimé le bloc "Connexion en cours" */}
      <div className="w-80 border-r border-border bg-card">
        <div className="border-b border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold">Messages</h2>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setShowNewConversation(true)}
              disabled={!isConnected}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Rechercher des conversations..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!isConnected}
            />
          </div>
        </div>
{/* Modal de confirmation de suppression */}
{showDeleteModal && conversationToDelete && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-full bg-destructive/10 p-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Supprimer la conversation</h3>
          <p className="text-sm text-muted-foreground">
            Cette action est irréversible
          </p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm">
          Êtes-vous sûr de vouloir supprimer la conversation avec{" "}
          <strong>
            {conversationToDelete.participants
              .find(p => p._id !== (session?.user as any)?.id)
              ?.name || "l'utilisateur"}
          </strong>
          ?
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Tous les messages seront définitivement supprimés.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={closeDeleteModal}
          disabled={isDeleting}
        >
          Annuler
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onClick={() => deleteConversation(conversationToDelete._id)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Suppression...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </>
          )}
        </Button>
      </div>
    </div>
  </div>
)}
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-2">
            {/* ⭐ CORRECTION : Supprimé le bloc !isConnected qui causait le problème */}
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg p-3">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Users className="mx-auto mb-2 h-8 w-8" />
                <p>Aucune conversation</p>
                {!isConnected && (
                  <p className="text-xs mt-1">Connexion perdue</p>
                )}
              </div>
            ) : (
              <>
                {conversations.map((conv) => {
  const otherUser = conv.participants.find(p => p._id !== (session?.user as any)?.id)
  return (
    <div
      key={conv._id}
      className={`relative group rounded-lg transition-colors hover:bg-accent ${
        selectedConversation === conv._id ? "bg-accent" : ""
      }`}
    >
      <button
        onClick={() => setSelectedConversation(conv._id)}
        className="w-full rounded-lg p-3 text-left"
      >
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarImage src={otherUser?.avatar} />
            <AvatarFallback>{otherUser?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold truncate">{otherUser?.name || "Utilisateur inconnu"}</h3>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                {new Date(conv.updatedAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="truncate text-sm text-muted-foreground flex-1">
                {conv.lastMessage || "Aucun message"}
              </p>
              {conv.unreadCount > 0 && (
                <Badge variant="default" className="ml-2 h-5 min-w-5 rounded-full px-1.5 text-xs shrink-0">
                  {conv.unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </button>
      
      {/* 🔥 Bouton de suppression */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={(e) => openDeleteModal(conv, e)}
        title="Supprimer la conversation"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
})}

                {searchQuery && searchResults.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">Résultats de recherche</h4>
                    {searchResults.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => handleUserClick(user)}
                        className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <h3 className="font-semibold truncate">{user.name}</h3>
                          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          Nouveau
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Le reste du code reste identique */}
      {/* Modal Nouvelle Conversation */}
      {showNewConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Nouvelle conversation</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowNewConversation(false)
                  setSearchQuery("")
                  setSearchResults([])
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-4">
              <Input
                placeholder="Rechercher des utilisateurs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-2"
              />
              
              {isSearching && (
                <div className="text-sm text-muted-foreground">Recherche en cours...</div>
              )}
              
              {searchResults.length > 0 && (
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleUserClick(user)}
                      className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-accent"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{user.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery && !isSearching && searchResults.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Aucun utilisateur trouvé
                </div>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowNewConversation(false)
                setSearchQuery("")
                setSearchResults([])
              }}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Chat Area */}
      {selectedConv ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={otherParticipant?.avatar} />
                <AvatarFallback>{otherParticipant?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{otherParticipant?.name || "Utilisateur inconnu"}</h3>
                <p className="text-sm text-muted-foreground">
                  {otherParticipant?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
    variant="outline" 
    size="icon" 
    onClick={() => fetchMessages(selectedConversation!)}
    title="Recharger les messages"
  >
    <RefreshCw className="h-4 w-4" />
  </Button>
              <Button variant="outline" size="icon" onClick={handleStartVideoCall} disabled={!isConnected}>
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" disabled={!isConnected}>
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Users className="h-8 w-8 text-muted-foreground mb-4" />
                  <h3 className="mb-2 text-lg font-semibold">Aucun message</h3>
                  <p className="text-muted-foreground">
                    Commencez la conversation
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isMe = msg.senderId === (session?.user as any)?.id
                    const isTemp = msg._id.startsWith('temp-')
                    
                    return (
                      <div 
                        key={msg._id} 
                        className={`flex ${isMe ? "justify-end" : "justify-start"} ${isTemp ? 'opacity-70' : ''}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <p className="text-sm break-words">{msg.content}</p>
                          <span
                            className={`mt-1 block text-xs ${
                              isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                            {isTemp && ' • Envoi en cours...'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="border-t border-border bg-card p-4">
            <div className="flex gap-2">
              <Input
                placeholder={isConnected ? "Tapez votre message..." : "Connexion perdue..."}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1"
                disabled={isSending || !isConnected}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={isSending || !messageInput.trim() || !isConnected}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Users className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Aucune conversation sélectionnée</h3>
            <Button 
              onClick={() => setShowNewConversation(true)}
              disabled={!isConnected}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle conversation
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}