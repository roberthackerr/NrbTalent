"use client"

import type React from "react"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Search, Video, Phone } from "lucide-react"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

export default function MessagesPage() {
  const { data: session } = useSession()
  const [selectedConversation, setSelectedConversation] = useState<string | null>("1")
  const [messageInput, setMessageInput] = useState("")

  const conversations = [
    {
      id: "1",
      name: "John Doe",
      lastMessage: "Thanks for accepting my proposal!",
      timestamp: "2 min ago",
      unread: 2,
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "2",
      name: "Sarah Smith",
      lastMessage: "When can we start the project?",
      timestamp: "1 hour ago",
      unread: 0,
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "3",
      name: "Mike Johnson",
      lastMessage: "I've completed the first milestone",
      timestamp: "3 hours ago",
      unread: 1,
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  const messages = [
    {
      id: "1",
      senderId: "other",
      content: "Hi! I'm interested in your project.",
      timestamp: "10:30 AM",
    },
    {
      id: "2",
      senderId: "me",
      content: "Great! I'd love to discuss the details with you.",
      timestamp: "10:32 AM",
    },
    {
      id: "3",
      senderId: "other",
      content: "I have 5 years of experience in React and Node.js. I can deliver this in 2 weeks.",
      timestamp: "10:35 AM",
    },
    {
      id: "4",
      senderId: "me",
      content: "That sounds perfect! I've accepted your proposal. Let's get started.",
      timestamp: "10:40 AM",
    },
    {
      id: "5",
      senderId: "other",
      content: "Thanks for accepting my proposal!",
      timestamp: "10:42 AM",
    },
  ]

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (messageInput.trim()) {
      console.log("Sending message:", messageInput)
      setMessageInput("")
    }
  }

  const handleStartVideoCall = async () => {
    try {
      const response = await fetch("/api/video/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: selectedConversation,
        }),
      })

      const data = await response.json()
      if (data.success) {
        window.open(data.roomUrl, "_blank")
        toast.success("Video call started!")
      }
    } catch (error) {
      toast.error("Failed to start video call")
    }
  }

  const selectedConv = conversations.find((c) => c.id === selectedConversation)

  return (
    <div className="flex h-screen">
      <DashboardSidebar role={(session?.user as any)?.role || "freelance"} />

      <main className="flex flex-1 overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r border-border bg-background">
          <div className="border-b border-border p-4">
            <h2 className="mb-3 text-xl font-bold">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search conversations..." className="pl-9" />
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="p-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full rounded-lg p-3 text-left transition-colors hover:bg-accent ${
                    selectedConversation === conv.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>{conv.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{conv.name}</h3>
                        <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm text-muted-foreground">{conv.lastMessage}</p>
                        {conv.unread > 0 && (
                          <Badge variant="default" className="ml-2 h-5 min-w-5 rounded-full px-1.5 text-xs">
                            {conv.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        {selectedConv ? (
          <div className="flex flex-1 flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{selectedConv.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedConv.name}</h3>
                  <p className="text-sm text-muted-foreground">Active now</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                
                <Button variant="outline" size="icon" onClick={handleStartVideoCall}>
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderId === "me" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        msg.senderId === "me" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <span
                        className={`mt-1 block text-xs ${msg.senderId === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="border-t border-border p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Select a conversation to start messaging</p>
          </div>
        )}
      </main>
    </div>
  )
}
