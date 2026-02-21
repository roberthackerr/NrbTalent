"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Send, Users, Paperclip, Smile } from 'lucide-react'
import { useWebSocketManager } from '@/hooks/useWebSocket'
import { date } from 'zod'

interface ChatMessage {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: Date
  type: 'message' | 'system'
}

interface WorkspaceChatProps {
  projectId: string
  userId: string
  userName: string
  onUnreadCountChange?: (count: number) => void
}

export function WorkspaceChat({ projectId, userId, userName, onUnreadCountChange }: WorkspaceChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { sendMessage, lastMessage, readyState } = { sendMessage:({})=>{}, lastMessage:{data:""}, readyState:null }

  // Join chat on component mount
  useEffect(() => {
    sendMessage({
      type: 'JOIN_CHAT',
      data: { projectId, userId, userName }
    })

    // Load previous messages
    fetch(`/api/projects/${projectId}/chat-messages`)
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(console.error)
  }, [projectId, userId, userName, sendMessage])

  // Handle incoming messages
  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage.data)
      
      if (message.type === 'CHAT_MESSAGE') {
        setMessages(prev => [...prev, {
          id: message.data.id,
          userId: message.data.userId,
          userName: message.data.userName,
          content: message.data.content,
          timestamp: new Date(message.data.timestamp),
          type: 'message'
        }])
        
        // Scroll to bottom
        scrollToBottom()
      } else if (message.type === 'USER_TYPING') {
        setIsTyping(message.data.isTyping)
      }
    }
  }, [lastMessage])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const messageData = {
      type: 'CHAT_MESSAGE',
      data: {
        projectId,
        userId,
        userName,
        content: newMessage,
        timestamp: new Date().toISOString()
      }
    }

    sendMessage(messageData)
    setNewMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
      {/* Chat Messages */}
      <Card className="lg:col-span-3">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Chat du projet</CardTitle>
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {messages.length} messages
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="h-[500px] flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.userId === userId ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col ${message.userId === userId ? 'items-end' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{message.userName}</span>
                      <span className="text-xs text-slate-500">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.userId === userId 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-100 text-slate-900'
                    }`}>
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>...</AvatarFallback>
                  </Avatar>
                  <div className="bg-slate-100 rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="pt-4 border-t">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message..."
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Envoyer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Online Users Sidebar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">En ligne maintenant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* This would be populated with actual online users */}
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <Avatar className="h-8 w-8">
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Jean Dupont</p>
                <p className="text-xs text-slate-500">Développeur</p>
              </div>
            </div>
            {/* Add more users as needed */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}