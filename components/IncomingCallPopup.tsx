// components/IncomingCallPopup.tsx - Pop-up appel entrant style WhatsApp
"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Video, Phone, X } from "lucide-react"

interface IncomingCallPopupProps {
  isOpen: boolean
  callerName: string
  callerAvatar?: string
  onAccept: () => void
  onDecline: () => void
  isVideoCall?: boolean
}

export const IncomingCallPopup = ({
  isOpen,
  callerName,
  callerAvatar,
  onAccept,
  onDecline,
  isVideoCall = true
}: IncomingCallPopupProps) => {
  const [rings, setRings] = useState(0)

  // Animation de sonnerie
  useEffect(() => {
    if (!isOpen) {
      setRings(0)
      return
    }

    const interval = setInterval(() => {
      setRings(prev => prev + 1)
    }, 1000)

    // Auto-decline après 30 secondes
    const timeout = setTimeout(() => {
      onDecline()
    }, 30000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [isOpen, onDecline])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop sombre */}
      <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" />
      
      {/* Pop-up centrale */}
      <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-500">
          
          {/* Header avec icône de fermeture */}
          <div className="relative p-6 pb-4">
            <button
              onClick={onDecline}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenu principal */}
          <div className="flex flex-col items-center px-8 pb-8">
            
            {/* Avatar avec animation de pulsation */}
            <div className="relative mb-6">
              <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 ${rings % 2 === 0 ? 'scale-100' : 'scale-110'} transition-transform duration-1000`} />
              <Avatar className="relative h-32 w-32 border-4 border-white/20 shadow-2xl">
                <AvatarImage src={callerAvatar} alt={callerName} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl font-bold">
                  {callerName?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              
              {/* Icône du type d'appel */}
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-green-500 to-green-600 rounded-full p-3 shadow-lg border-4 border-gray-900">
                {isVideoCall ? (
                  <Video className="w-5 h-5 text-white" />
                ) : (
                  <Phone className="w-5 h-5 text-white" />
                )}
              </div>
            </div>

            {/* Informations de l'appelant */}
            <h2 className="text-3xl font-bold text-white mb-2 text-center">
              {callerName}
            </h2>
            <p className="text-lg text-gray-300 mb-1">
              {isVideoCall ? "Appel vidéo entrant..." : "Appel vocal entrant..."}
            </p>
            <p className="text-sm text-gray-400 mb-8 animate-pulse">
              Sonnerie...
            </p>

            {/* Boutons d'action */}
            <div className="flex items-center justify-center gap-6 w-full">
              
              {/* Bouton Refuser */}
              <button
                onClick={onDecline}
                className="group relative"
                aria-label="Refuser l'appel"
              >
                <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full p-6 shadow-2xl transform transition-all duration-200 hover:scale-110 active:scale-95">
                  <X className="w-8 h-8 text-white" strokeWidth={3} />
                </div>
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-red-400 font-medium whitespace-nowrap">
                  Refuser
                </span>
              </button>

              {/* Bouton Accepter */}
              <button
                onClick={onAccept}
                className="group relative"
                aria-label="Accepter l'appel"
              >
                <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full p-6 shadow-2xl transform transition-all duration-200 hover:scale-110 active:scale-95 animate-pulse">
                  {isVideoCall ? (
                    <Video className="w-8 h-8 text-white" strokeWidth={3} />
                  ) : (
                    <Phone className="w-8 h-8 text-white" strokeWidth={3} />
                  )}
                </div>
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-green-400 font-medium whitespace-nowrap">
                  Accepter
                </span>
              </button>
            </div>

            {/* Timer */}
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-400">
                  {Math.floor(rings / 60)}:{(rings % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Son de sonnerie (optionnel) */}
      <audio 
        autoPlay 
        loop 
        className="hidden"
        src="/sounds/ringtone.mp3" 
      />
    </>
  )
}