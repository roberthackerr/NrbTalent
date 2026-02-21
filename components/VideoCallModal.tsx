// components/VideoCallModal.tsx - VERSION ENTIÈREMENT CORRIGÉE
"use client"

import { AgoraMessageCall, AgoraMessageCallHandle } from "@/components/AgoraMessageCall"
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"

export type VideoCallModalHandle = {
  open: () => void
  close: () => Promise<void>
}

type Props = {
  isOpen: boolean
  onClose: () => void
  channelName: string
  onStatusChange?: (status: "idle" | "connecting" | "connected") => void
  onRemoteUsersChange?: (users: number[]) => void
}

export const VideoCallModal = forwardRef<VideoCallModalHandle, Props>(function VideoCallModal(
  { isOpen, onClose, channelName, onStatusChange, onRemoteUsersChange },
  ref
) {
  const agoraCallRef = useRef<AgoraMessageCallHandle>(null)
  const [isClosing, setIsClosing] = useState(false)
  const hasStartedCall = useRef(false)
  const isUnmounting = useRef(false)

  // 🔥 FIX: Démarrer l'appel quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && channelName && !hasStartedCall.current && !isUnmounting.current) {
      console.log("🎬 VideoCallModal opened, starting call in 300ms...")
      hasStartedCall.current = true
      
      const timer = setTimeout(() => {
        if (agoraCallRef.current && !isUnmounting.current) {
          console.log("📞 Calling startCall()...")
          agoraCallRef.current.startCall()
            .then(() => console.log("✅ Call started successfully"))
            .catch(error => {
              console.error("❌ Error starting call:", error)
              hasStartedCall.current = false
            })
        }
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [isOpen, channelName])

  // 🔥 FIX: Cleanup proper quand le composant se démonte
  useEffect(() => {
    return () => {
      console.log("🧹 VideoCallModal unmounting...")
      isUnmounting.current = true
    }
  }, [])

  useImperativeHandle(ref, () => ({
    open: () => {
      console.log("🎬 VideoCallModal.open() called")
      isUnmounting.current = false
      hasStartedCall.current = false
    },
    close: async () => {
      console.log("🎬 VideoCallModal.close() called")
      if (isClosing || isUnmounting.current) {
        console.log("⚠️ Already closing or unmounting, skipping...")
        return
      }
      
      setIsClosing(true)
      isUnmounting.current = true
      
      try {
        if (agoraCallRef.current) {
          console.log("📴 Ending Agora call...")
          await agoraCallRef.current.endCall()
          console.log("✅ Agora call ended")
        }
      } catch (error) {
        console.error("❌ Error closing call:", error)
      } finally {
        // Petit délai avant de vraiment fermer pour éviter les race conditions
        await new Promise(resolve => setTimeout(resolve, 500))
        setIsClosing(false)
        hasStartedCall.current = false
      }
    }
  }))

  if (!isOpen) {
    return null
  }

  console.log("🎬 VideoCallModal rendering with channel:", channelName)

  const handleEndCall = async () => {
    if (isClosing || isUnmounting.current) {
      console.log("⚠️ Already handling end call, skipping...")
      return
    }
    
    setIsClosing(true)
    isUnmounting.current = true
    
    try {
      console.log("🔄 Ending call from modal...")
      if (agoraCallRef.current) {
        await agoraCallRef.current.endCall()
        console.log("✅ Agora call ended successfully")
      }
    } catch (error) {
      console.error("❌ Error ending call:", error)
    } finally {
      console.log("🔄 Calling onClose and resetting states...")
      // Attendre un peu avant de fermer complètement
      await new Promise(resolve => setTimeout(resolve, 500))
      hasStartedCall.current = false
      setIsClosing(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
      />
      
      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-6xl max-h-[90vh] bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-xl font-semibold text-white">
                Appel vidéo en cours
              </h2>
            </div>
            <div className="hidden md:flex items-center gap-2 ml-4">
              <div className="px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-300">
                Canal: {channelName.length > 30 ? channelName.substring(0, 27) + '...' : channelName}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleEndCall}
              disabled={isClosing}
              className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Terminer l'appel"
            >
              {isClosing ? (
                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Video Call Component - 🔥 TOUJOURS VISIBLE */}
        <div className="p-4 bg-gray-800">
          <AgoraMessageCall
            ref={agoraCallRef}
            channelName={channelName}
            autoStart={false}
            showStartButton={false}
            onClose={handleEndCall}
            onStatusChange={onStatusChange}
            onRemoteUsersChange={onRemoteUsersChange}
          />
        </div>
      </div>
    </div>
  )
})