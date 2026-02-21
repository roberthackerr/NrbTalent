// components/contracts/ContractChat.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Paperclip, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"

interface Message {
  _id: string
  senderId: string
  senderName: string
  content: string
  type: string
  createdAt: string
  attachment?: {
    url: string
    name: string
    type: string
  }
}

interface ContractChatProps {
  contractId: string
}

export function ContractChat({ contractId }: ContractChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userId = (session?.user as any)?.id

  useEffect(() => {
    fetchMessages()
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [contractId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Erreur récupération messages:", error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/contracts/${contractId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage })
      })

      if (response.ok) {
        setNewMessage("")
        fetchMessages() // Refresh messages
      }
    } catch (error) {
      console.error("Erreur envoi message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="text-lg">Messages du Contrat</CardTitle>
      </CardHeader>
      
      {/* Messages Container */}
      <CardContent className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Aucun message pour le moment.</p>
            <p className="text-sm mt-1">Envoyez le premier message !</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.senderId === userId
              
              return (
                <div
                  key={message._id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwnMessage ? 'order-1' : 'order-2'}`}>
                    <div className={`rounded-lg px-4 py-2 ${
                      isOwnMessage 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {!isOwnMessage && (
                        <p className="text-xs font-medium mb-1 opacity-80">
                          {message.senderName}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.attachment && (
                        <div className="mt-2">
                          <a
                            href={message.attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-sm flex items-center gap-1 ${
                              isOwnMessage ? 'text-blue-200' : 'text-blue-600'
                            }`}
                          >
                            <Paperclip className="h-3 w-3" />
                            {message.attachment.name}
                          </a>
                        </div>
                      )}
                      <p className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-end px-2 ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {message.senderName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message ici..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            className="self-end"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}