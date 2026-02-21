// components/MessageBubble.tsx - FIXED VERSION
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Check, CheckCheck, AlertCircle, Bot } from "lucide-react"
import { Message } from "@/types/chat"
import { FC, JSX } from "react"

interface MessageBubbleProps {
  message: Message
  isMe: boolean
  isAI?: boolean
  showAvatar: boolean
  userAvatar?: string
  userName?: string
  aiUser?: { // 🔥 ADDED: AI user prop
    _id: string
    name: string
    avatar?: string
  }
}

export const MessageBubble= ({ 
  message, 
  isMe, 
  isAI = false,
  showAvatar, 
  userAvatar, 
  userName,
  aiUser // 🔥 ADDED: AI user prop
}: MessageBubbleProps) => {
  const isTemp = (message._id || '').startsWith('temp-')
  const isError = message.status === 'error'
  
  const getStatusIcon = () => {
    if (isError) {
      return <AlertCircle className="h-3 w-3 text-red-400" />
    }
    
    switch (message.status) {
      case 'sending':
        return <Clock className="h-3 w-3 animate-pulse" />
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-400" />
      default:
        return !isTemp ? <Check className="h-3 w-3 text-gray-400" /> : null
    }
  }

  const getStatusText = () => {
    if (isError) return "Erreur"
    if (isTemp) return "Envoi..."
    
    switch (message.status) {
      case 'sending': return "Envoi..."
      case 'sent': return "Envoyé"
      case 'delivered': return "Délivré"
      case 'read': return "Lu"
      default: return !isTemp ? "Envoyé" : "Envoi..."
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // 🔥 IMPROVED: Better AI detection
  const isAIMessage = isAI || message.isAIMessage || aiUser !== undefined
  
  const getBubbleStyle = () => {
    if (isAIMessage) {
      return "bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border border-green-200 dark:border-green-800 rounded-bl-md shadow-sm"
    }
    
    if (isMe) {
      return isError
        ? "bg-gradient-to-br from-red-500 to-orange-600 text-white rounded-br-md shadow-lg"
        : "bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-br-md shadow-lg"
    }
    
    return "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-md shadow-sm"
  }

  // 🔥 IMPROVED: Better avatar handling with AI user data
  const getAvatarContent = () => {
    if (isAIMessage) {
      return (
        <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-green-500 to-teal-600 rounded-full">
          {aiUser?.avatar ? (
            <img 
              src={aiUser.avatar} 
              alt={aiUser.name} 
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <Bot className="h-4 w-4 text-white" />
          )}
        </div>
      )
    }
    
    return (
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={userAvatar} />
        <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600">
          {userName?.charAt(0)?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
    )
  }

  // 🔥 IMPROVED: Better AI name handling
  const getAIName = () => {
    return aiUser?.name || "Assistant AI"
  }

  return (
    <div className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"} group`}>
      {/* AVATAR WITH AI SUPPORT */}
      {showAvatar && !isMe && (
        getAvatarContent()
      )}
      
      {showAvatar && isMe && <div className="w-8 flex-shrink-0" />}
      
      <div className={`max-w-[70%] rounded-2xl px-4 py-3 transition-all duration-200 ${getBubbleStyle()} ${
        isTemp ? 'opacity-70' : ''
      } ${isError ? 'animate-pulse' : ''}`}>
        
        {/* AI INDICATOR */}
        {isAIMessage && !isMe && (
          <div className="flex items-center gap-2 mb-2 text-xs text-green-600 dark:text-green-400">
            <Bot className="h-3 w-3" />
            <span className="font-medium">{getAIName()}</span>
          </div>
        )}
        
        <p className={`text-sm leading-relaxed break-words ${isError ? 'line-through' : ''} ${
          isAIMessage ? 'text-gray-800 dark:text-gray-200' : ''
        }`}>
          {message.content}
        </p>
        
        <div className={`mt-2 flex items-center gap-2 text-xs ${
          isMe ? "text-blue-100" : isAIMessage ? "text-green-600" : "text-gray-500"
        }`}>
          <span>{formatTime(message.createdAt)}</span>
          
          {isMe && !message.read && (
            <>
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </>
          )}
          
          {isMe && message.read && (
            <div className="flex items-center gap-1 text-blue-400">
              <CheckCheck className="h-3 w-3" />
              <span>Vu</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}