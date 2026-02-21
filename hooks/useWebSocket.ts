// hooks/useWebSocket.ts - VERSION CORRIGÉE - BOUCLES INFINIES RÉSOLUES
import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

interface WebSocketManager {
  isConnected: boolean
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
  connect: () => void
  reconnect: () => void
  cleanup: () => void
  reconnectAttempt: number
  sendMessage: (type: string, data?: any) => boolean
  messageQueue: any[]
  wsRef: React.RefObject<WebSocket | null>
}

interface WebSocketMessage {
  type: string
  data?: any
  messageId?: string
  timestamp?: number
}

export const useWebSocketManager = (onMessage: (message: WebSocketMessage) => void): WebSocketManager => {
  const { data: session, status: sessionStatus } = useSession()
  
  // 🔥 FIX: Référence stable pour onMessage
  const onMessageRef = useRef(onMessage)
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])
  
  // Références
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptRef = useRef(0)
  const lastMessageTimeRef = useRef<number>(Date.now())
  const isIntentionalCloseRef = useRef(false)
  const hasConnectedOnceRef = useRef(false) // 🔥 NEW: Empêcher les connexions multiples
  
  // Timeouts et intervalles
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // État
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'>('disconnected')
  const [messageQueue, setMessageQueue] = useState<any[]>([])

  // Configuration
  const MAX_RECONNECT_ATTEMPTS = 10
  const RECONNECT_DELAYS = [1000, 2000, 3000, 5000, 8000, 13000, 21000, 34000, 55000, 89000]
  const HEARTBEAT_INTERVAL = 25000
  const CONNECTION_TIMEOUT = 10000
  const HEALTH_CHECK_INTERVAL = 30000

  // 🔥 FIX: Gestion sécurisée de la référence globale
  const setGlobalWsRef = useCallback((websocket: WebSocket | null) => {
    try {
      if (websocket) {
        (window as any).wsRef = { current: websocket }
      } else {
        delete (window as any).wsRef
      }
    } catch (error) {
      console.log('⚠️ Global wsRef management (non-critical):', error)
    }
  }, [])

  // 🔥 FIX: Cleanup robuste
  const cleanup = useCallback((intentional: boolean = false) => {
    console.log('🧹 Nettoyage WebSocket:', { intentional })
    
    isIntentionalCloseRef.current = intentional

    // Clear tous les timeouts et intervalles
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
      connectionTimeoutRef.current = null
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current)
      healthCheckIntervalRef.current = null
    }

    // Fermer la connexion WebSocket
    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close(1000, intentional ? "Intentional close" : "Cleanup")
        }
        wsRef.current.onopen = null
        wsRef.current.onmessage = null
        wsRef.current.onclose = null
        wsRef.current.onerror = null
      } catch (error) {
        console.error('❌ Erreur lors de la fermeture WebSocket:', error)
      }
      wsRef.current = null
    }

    setGlobalWsRef(null)

    setIsConnected(false)
    if (intentional) {
      setConnectionStatus('disconnected')
      hasConnectedOnceRef.current = false // 🔥 Reset pour permettre une nouvelle connexion
    }
  }, [setGlobalWsRef])

  // 🔥 FIX: Traitement de la queue SANS dépendances dangereuses
  const processMessageQueue = useCallback(() => {
    const currentQueue = messageQueue
    if (currentQueue.length === 0 || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    console.log(`🔄 Traitement de ${currentQueue.length} message(s) en queue...`)
    
    const failedMessages: any[] = []

    currentQueue.forEach(message => {
      try {
        wsRef.current!.send(JSON.stringify(message))
        lastMessageTimeRef.current = Date.now()
      } catch (error) {
        console.error('❌ Erreur envoi message depuis queue:', error)
        failedMessages.push(message)
      }
    })

    setMessageQueue(failedMessages)

    if (currentQueue.length - failedMessages.length > 0) {
      console.log(`✅ ${currentQueue.length - failedMessages.length} message(s) de la queue envoyés`)
    }
  }, [messageQueue])

  // 🔥 FIX: Envoi de message simplifié
  const sendMessage = useCallback((type: string, data?: any): boolean => {
    const message: WebSocketMessage = {
      type,
      data,
      messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('📦 Message mis en queue (WebSocket non disponible):', type)
      setMessageQueue(prev => [...prev.slice(-49), message]) // Garder max 50
      return false
    }

    try {
      wsRef.current.send(JSON.stringify(message))
      lastMessageTimeRef.current = Date.now()
      console.log('📤 Message envoyé:', type)
      return true
    } catch (error) {
      console.error('❌ Erreur envoi message:', error)
      setMessageQueue(prev => [...prev, message])
      return false
    }
  }, [])

  // 🔥 FIX: Vérification de santé
  const checkConnectionHealth = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false
    }

    const timeSinceLastMessage = Date.now() - lastMessageTimeRef.current
    
    if (timeSinceLastMessage > HEARTBEAT_INTERVAL * 2.5) {
      console.warn('⚠️ Connexion potentiellement morte, reconnexion...')
      cleanup(false)
      return false
    }

    return true
  }, [cleanup])

  // 🔥 FIX: Connexion WebSocket SANS boucles infinies
  const connect = useCallback(() => {
    // 🔥 CRITICAL: Empêcher les connexions multiples
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('⚠️ WebSocket déjà connecté/en cours de connexion')
      return
    }

    if (!session?.user) {
      console.log('❌ Session utilisateur manquante')
      return
    }

    // Marquer qu'on a déjà tenté une connexion
    if (hasConnectedOnceRef.current && connectionStatus === 'connected') {
      console.log('⚠️ Connexion déjà établie, skip')
      return
    }

    cleanup(false)
    isIntentionalCloseRef.current = false
    
    setConnectionStatus('connecting')
    console.log('🔄 Tentative de connexion WebSocket...')

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://nrbtalentsws.onrender.com/api/ws'

    try {
      const websocket = new WebSocket(wsUrl)
      wsRef.current = websocket
      setGlobalWsRef(websocket)

      // Timeout de connexion
      connectionTimeoutRef.current = setTimeout(() => {
        if (websocket.readyState !== WebSocket.OPEN) {
          console.error('⏰ Timeout de connexion WebSocket')
          websocket.close()
          setConnectionStatus('reconnecting')
          
          if (reconnectAttemptRef.current === 0) {
            toast.warning("Connexion au serveur en cours...")
          }
        }
      }, CONNECTION_TIMEOUT)

      // Gestionnaire d'ouverture
      websocket.onopen = () => {
        console.log('✅ WebSocket connecté avec succès')
        
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current)
        }
        
        setIsConnected(true)
        setConnectionStatus('connected')
        reconnectAttemptRef.current = 0
        lastMessageTimeRef.current = Date.now()
        hasConnectedOnceRef.current = true // 🔥 Marquer comme connecté

        // Authentification
        const authMessage = {
          type: 'AUTH',
          data: {
            userId: (session.user as any).id,
            userName: session.user.name,
            userEmail: session.user.email,
            userAvatar: session.user.image
          },
          messageId: `auth-${Date.now()}`,
          timestamp: Date.now()
        }

        try {
          websocket.send(JSON.stringify(authMessage))
          console.log('🔐 Authentification envoyée')
        } catch (error) {
          console.error('❌ Erreur envoi auth:', error)
        }

        // Heartbeat régulier
        heartbeatIntervalRef.current = setInterval(() => {
          if (websocket.readyState === WebSocket.OPEN) {
            try {
              websocket.send(JSON.stringify({ type: 'PING', messageId: `ping-${Date.now()}` }))
            } catch (error) {
              console.error('❌ Erreur envoi ping:', error)
            }
          }
        }, HEARTBEAT_INTERVAL)

        // Vérification de santé
        healthCheckIntervalRef.current = setInterval(() => {
          checkConnectionHealth()
        }, HEALTH_CHECK_INTERVAL)

        // Traiter les messages en attente
        setTimeout(() => {
          processMessageQueue()
        }, 1000)

        // 🔥 FIX: Toast seulement sur première connexion ou reconnexion
        if (reconnectAttemptRef.current > 0) {
          toast.success("Reconnecté au serveur")
        }
      }

      // Gestionnaire de messages
      websocket.onmessage = (event) => {
        try {
          lastMessageTimeRef.current = Date.now()
          
          const message = JSON.parse(event.data)
          
          // Gérer les pongs silencieusement
          if (message.type === 'PONG') {
            return
          }
          
          console.log('📨 Message reçu:', message.type)
          onMessageRef.current(message)
        } catch (error) {
          console.error('❌ Erreur parsing message WebSocket:', error, event.data)
        }
      }

      // Gestionnaire de fermeture
      websocket.onclose = (event) => {
        console.log('🔌 WebSocket fermé:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          intentional: isIntentionalCloseRef.current
        })

        setIsConnected(false)
        setConnectionStatus('disconnected')

        // Clear les intervals
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
          heartbeatIntervalRef.current = null
        }
        if (healthCheckIntervalRef.current) {
          clearInterval(healthCheckIntervalRef.current)
          healthCheckIntervalRef.current = null
        }

        if (!isIntentionalCloseRef.current) {
          const attempt = reconnectAttemptRef.current
          
          if (attempt < MAX_RECONNECT_ATTEMPTS) {
            const delay = RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)]
            reconnectAttemptRef.current = attempt + 1
            setConnectionStatus('reconnecting')
            
            console.log(`🔄 Reconnexion dans ${delay}ms (tentative ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS})`)
            
            reconnectTimeoutRef.current = setTimeout(() => {
              hasConnectedOnceRef.current = false // 🔥 Permettre la reconnexion
              connect()
            }, delay)

            if (attempt === 0) {
              toast.warning("Connexion perdue, reconnexion...")
            }
          } else {
            setConnectionStatus('error')
            toast.error("Connexion perdue - Veuillez actualiser la page")
            console.error('🚨 Nombre maximum de tentatives de reconnexion atteint')
          }
        }
      }

      // Gestionnaire d'erreurs
      websocket.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error)
        setIsConnected(false)
        
        if (!isIntentionalCloseRef.current) {
          setConnectionStatus('reconnecting')
        }
      }

    } catch (error) {
      console.error('❌ Erreur création WebSocket:', error)
      setIsConnected(false)
      setConnectionStatus('error')
      toast.error("Erreur de connexion au serveur")
    }
  }, [session, cleanup, checkConnectionHealth, processMessageQueue, setGlobalWsRef, connectionStatus])

  // 🔥 FIX: Reconnexion manuelle
  const reconnect = useCallback(() => {
    console.log('🔄 Reconnexion manuelle déclenchée')
    reconnectAttemptRef.current = 0
    hasConnectedOnceRef.current = false
    setMessageQueue([])
    cleanup(false)
    setTimeout(() => connect(), 100)
  }, [connect, cleanup])

  // 🔥 FIX: Effect SANS boucles infinies
  useEffect(() => {
    // 🔥 CRITICAL: Connexion seulement si pas déjà connecté
    if (sessionStatus === 'authenticated' && 
        !isConnected && 
        !hasConnectedOnceRef.current &&
        connectionStatus === 'disconnected') {
      console.log('🎯 Session authentifiée, initialisation connexion WebSocket...')
      connect()
    }

    // Nettoyage à la déconnexion
    if (sessionStatus === 'unauthenticated' && isConnected) {
      console.log('👋 Utilisateur déconnecté, nettoyage WebSocket...')
      cleanup(true)
    }
  }, [sessionStatus, isConnected, connectionStatus]) // 🔥 NE PAS inclure connect

  // 🔥 Cleanup au unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Unmount component, nettoyage WebSocket...')
      cleanup(true)
    }
  }, []) // 🔥 Empty deps - seulement au unmount

  return {
    isConnected,
    connectionStatus,
    connect,
    reconnect,
    cleanup: () => cleanup(true),
    reconnectAttempt: reconnectAttemptRef.current,
    sendMessage,
    messageQueue,
    wsRef
  }
}