"use client"

import { useState, useEffect, useCallback } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'

interface WorkspaceUser {
  id: string
  name: string
  role: string
  isOnline: boolean
  lastActive: Date
}

export function useWorkspace() {
  const [activeUsers, setActiveUsers] = useState<WorkspaceUser[]>([])
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  const { sendMessage, lastMessage, readyState } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
  )

  const joinWorkspace = useCallback((projectId: string, userId: string) => {
    setWorkspaceId(projectId)
    sendMessage({
      type: 'JOIN_WORKSPACE',
      data: { projectId, userId }
    })
    setIsConnected(true)
  }, [sendMessage])

  const leaveWorkspace = useCallback(() => {
    if (workspaceId) {
      sendMessage({
        type: 'LEAVE_WORKSPACE',
        data: { workspaceId }
      })
    }
    setWorkspaceId(null)
    setIsConnected(false)
    setActiveUsers([])
  }, [workspaceId, sendMessage])

  const sendMessageToWorkspace = useCallback((content: string, type: 'chat' | 'system' = 'chat') => {
    if (workspaceId) {
      sendMessage({
        type: 'WORKSPACE_MESSAGE',
        data: { workspaceId, content, messageType: type }
      })
    }
  }, [workspaceId, sendMessage])

  const updateTaskStatus = useCallback((taskId: string, status: string) => {
    if (workspaceId) {
      sendMessage({
        type: 'TASK_UPDATE',
        data: { workspaceId, taskId, status }
      })
    }
  }, [workspaceId, sendMessage])

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage.data)
      
      switch (message.type) {
        case 'USER_JOINED':
          setActiveUsers(prev => {
            const exists = prev.find(u => u.id === message.data.userId)
            if (!exists) {
              return [...prev, {
                id: message.data.userId,
                name: message.data.userName,
                role: message.data.userRole || 'member',
                isOnline: true,
                lastActive: new Date()
              }]
            }
            return prev
          })
          break
          
        case 'USER_LEFT':
          setActiveUsers(prev => 
            prev.filter(u => u.id !== message.data.userId)
          )
          break
          
        case 'ACTIVE_USERS':
          setActiveUsers(message.data.users)
          break
          
        case 'TASK_UPDATED':
          // Broadcast task updates to all connected users
          // This would trigger a refresh in your Kanban board
          console.log('Task updated by another user:', message.data)
          break
      }
    }
  }, [lastMessage])

  return {
    joinWorkspace,
    leaveWorkspace,
    sendMessage: sendMessageToWorkspace,
    updateTaskStatus,
    activeUsers,
    isConnected,
    workspaceId
  }
}