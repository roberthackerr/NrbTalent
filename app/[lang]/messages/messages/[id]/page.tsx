// app/messages/[id]/page.tsx - SIMPLIFIED VERSION
"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { useSimpleMessaging } from "@/hooks/useSimpleMessaging"

export default function SimpleMessagePage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const conversationId = params?.id as string
  
  const {
    conversations,
    messages,
    selectedConversation,
    isConnected,
    sendMessage,
    selectConversation,
    createConversation
  } = useSimpleMessaging()
  
  const [newMessage, setNewMessage] = useState("")
  const [showNewChat, setShowNewChat] = useState(false)
  const [searchUsers, setSearchUsers] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentConversation = conversations.find(c => c._id === selectedConversation)
  const otherUser = currentConversation?.participants?.find((p: any) => p._id !== (session?.user as any).id)

  // Auto-select conversation from URL
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const exists = conversations.find(c => c._id === conversationId)
      if (exists) {
        selectConversation(conversationId)
      }
    }
  }, [conversationId, conversations, selectConversation])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Search users
  useEffect(() => {
    const search = async () => {
      if (!searchUsers.trim()) {
        setSearchResults([])
        return
      }

      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchUsers)}`)
        const data = await response.json()
        const filtered = data.users?.filter((user: any) => user._id !== (session?.user as any).id) || []
        setSearchResults(filtered)
      } catch (error) {
        console.error("Search error:", error)
      }
    }

    const timeout = setTimeout(search, 300)
    return () => clearTimeout(timeout)
  }, [searchUsers, session])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    await sendMessage(newMessage)
    setNewMessage("")
  }

  const handleCreateChat = async (user: any) => {
    const conversation = await createConversation(user._id)
    if (conversation) {
      setShowNewChat(false)
      setSearchUsers("")
      setSearchResults([])
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Connectez-vous</h2>
          <p className="text-gray-600">Veuillez vous connecter pour accéder aux messages</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Messages</h1>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => {
            const otherUser = conversation.participants.find((p: any) => p._id !== (session.user as any).id)
            return (
              <div
                key={conversation._id}
                onClick={() => selectConversation(conversation._id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation === conversation._id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    {otherUser?.avatar ? (
                      <img src={otherUser.avatar} alt="" className="w-12 h-12 rounded-full" />
                    ) : (
                      <span className="text-lg">👤</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {otherUser?.name || 'Utilisateur'}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.lastMessage || 'Aucun message'}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Connection Status */}
        <div className="p-4 border-t border-gray-200">
          <div className={`flex items-center space-x-2 text-sm ${
            isConnected ? 'text-green-600' : 'text-red-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span>{isConnected ? 'Connecté' : 'Déconnecté'}</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  {otherUser?.avatar ? (
                    <img src={otherUser.avatar} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <span className="text-sm">👤</span>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold">{otherUser?.name || 'Utilisateur'}</h2>
                  <p className="text-sm text-gray-500">
                    {otherUser?.isOnline ? 'En ligne' : `Dernière connexion ${otherUser?.lastSeen}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
              {messages.map((message) => {
                const isMe = message.senderId === (session.user as any).id
                return (
                  <div
                    key={message._id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isMe
                          ? 'bg-green-500 text-white rounded-br-none'
                          : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        isMe ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-green-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || !isConnected}
                  className="bg-green-500 text-white rounded-full p-2 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Aucune conversation sélectionnée</h3>
              <p className="text-gray-600 mb-4">Sélectionnez une conversation ou créez-en une nouvelle</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600"
              >
                Nouvelle conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 max-w-full mx-4">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Nouvelle conversation</h3>
                <button
                  onClick={() => {
                    setShowNewChat(false)
                    setSearchUsers("")
                    setSearchResults([])
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <input
                type="text"
                value={searchUsers}
                onChange={(e) => setSearchUsers(e.target.value)}
                placeholder="Rechercher un utilisateur..."
                className="w-full border border-gray-300 rounded-full px-4 py-2 mt-2 focus:outline-none focus:border-green-500"
              />
            </div>
            <div className="max-h-96 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleCreateChat(user)}
                  className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <span className="text-sm">👤</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{user.name}</h4>
                      <p className="text-sm text-gray-500">{user.title || 'Utilisateur'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}