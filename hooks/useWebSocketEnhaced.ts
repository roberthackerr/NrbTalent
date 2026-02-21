import { useCallback, useRef } from 'react'

// Hook utilitaire pour une gestion plus facile des messages
export const useWebSocketEnhanced = (wsManager: any) => {
  const messageHandlersRef = useRef<Map<string, (data: any) => void>>(new Map())
  const pendingRequestsRef = useRef<Map<string, { resolve: (value: any) => void; reject: (error: any) => void; timeout: NodeJS.Timeout }>>(new Map())

  // 🔥 Envoi de message avec réponse attendue
  const sendWithResponse = useCallback((type: string, data?: any, timeout: number = 10000): Promise<any> => {
    return new Promise((resolve, reject) => {
      const messageId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const timeoutId = setTimeout(() => {
        pendingRequestsRef.current.delete(messageId)
        reject(new Error(`Timeout après ${timeout}ms pour ${type}`))
      }, timeout)

      pendingRequestsRef.current.set(messageId, { resolve, reject, timeout: timeoutId })

      const success = wsManager.sendMessage(type, { ...data, _requestId: messageId })
      
      if (!success) {
        clearTimeout(timeoutId)
        pendingRequestsRef.current.delete(messageId)
        reject(new Error('WebSocket non disponible'))
      }
    })
  }, [wsManager])

  // 🔥 Enregistrement de handler de message
  const onMessage = useCallback((messageType: string, handler: (data: any) => void) => {
    messageHandlersRef.current.set(messageType, handler)
  }, [])

  // 🔥 Gestionnaire de messages global (à passer au WebSocketManager)
  const handleMessage = useCallback((message: any) => {
    const { type, data, messageId } = message

    // Gérer les réponses aux requêtes
    if (data?._responseTo) {
      const request = pendingRequestsRef.current.get(data._responseTo)
      if (request) {
        clearTimeout(request.timeout)
        pendingRequestsRef.current.delete(data._responseTo)
        
        if (data.success) {
          request.resolve(data)
        } else {
          request.reject(new Error(data.error || 'Erreur inconnue'))
        }
        return
      }
    }

    // Appeler les handlers enregistrés
    const handler = messageHandlersRef.current.get(type)
    if (handler) {
      handler(data)
    }
  }, [])

  // 🔥 Envoi batch de messages
  const sendBatch = useCallback((messages: Array<{ type: string; data?: any }>) => {
    return messages.map(msg => wsManager.sendMessage(msg.type, msg.data))
  }, [wsManager])

  return {
    sendWithResponse,
    onMessage,
    handleMessage,
    sendBatch,
    hasPendingRequests: pendingRequestsRef.current.size > 0
  }
}