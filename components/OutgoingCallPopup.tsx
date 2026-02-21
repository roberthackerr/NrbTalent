"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Video, Phone, X, User, Camera, CameraOff, Volume2, VolumeX, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface OutgoingCallPopupProps {
  isOpen: boolean
  recipientName: string
  recipientAvatar?: string
  recipientInfo?: string
  onCancel: () => void
  callStatus: "connecting" | "ringing" | "connected"
  isVideoCall?: boolean
  ringtoneEnabled?: boolean
  isLoading?: boolean
}

export const OutgoingCallPopup = ({
  isOpen,
  recipientName,
  recipientAvatar,
  recipientInfo,
  onCancel,
  callStatus,
  isVideoCall = true,
  ringtoneEnabled = true,
  isLoading = false
}: OutgoingCallPopupProps) => {
  const [timer, setTimer] = useState(0)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [hasCameraPermission, setHasCameraPermission] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [debugInfo, setDebugInfo] = useState("")
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)

  // Check if mobile
  useEffect(() => {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    setIsMobile(mobile)
    setDebugInfo(`Mobile: ${mobile}, VideoCall: ${isVideoCall}, IsOpen: ${isOpen}`)
  }, [isOpen, isVideoCall])

  // Initialize webcam - SIMPLIFIED AND RELIABLE
  const initWebcam = useCallback(async () => {
    console.log("🎥 initWebcam called:", { isOpen, isVideoCall, isVideoEnabled })
    
    if (!isOpen || !isVideoCall || !isVideoEnabled) {
      console.log("❌ Skipping webcam init")
      return
    }
    
    try {
      console.log("🎥 Requesting webcam permission...")
      
      // Simple constraints that work everywhere
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: isMobile ? facingMode : 'user'
        },
        audio: false
      }
      
      setDebugInfo("Requesting camera access...")
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      console.log("✅ Webcam access granted, tracks:", stream.getTracks().length)
      setDebugInfo(`Camera connected: ${stream.getTracks().length} tracks`)
      
      setLocalStream(stream)
      setHasCameraPermission(true)
      
      if (localVideoRef.current) {
        console.log("📹 Setting video srcObject")
        localVideoRef.current.srcObject = stream
        
        // Make sure video is visible
        localVideoRef.current.style.display = "block"
        localVideoRef.current.style.opacity = "1"
        localVideoRef.current.style.filter = "blur(20px) brightness(0.7)"
        localVideoRef.current.style.transform = "scale(1.2)" // Zoom in for better blur effect
        
        // Try to play
        localVideoRef.current.play().then(() => {
          console.log("✅ Video playing")
          setDebugInfo("Video playing with blur effect")
        }).catch(err => {
          console.warn("Video play warning:", err)
          setDebugInfo(`Play warning: ${err.message}`)
        })
      }
      
    } catch (error: any) {
      console.error("❌ Webcam error:", error)
      setDebugInfo(`Camera error: ${error.name} - ${error.message}`)
      setHasCameraPermission(false)
      setIsVideoEnabled(false)
    }
  }, [isOpen, isVideoCall, isVideoEnabled, isMobile, facingMode])

  // Timer et animation
  useEffect(() => {
    if (!isOpen) {
      setTimer(0)
      setConnectionAttempts(0)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      return
    }

    const interval = setInterval(() => {
      setTimer(prev => prev + 1)
      
      // Animation de connexion
      if (callStatus === "connecting" && timer % 2 === 0) {
        setConnectionAttempts(prev => (prev + 1) % 3)
      }
    }, 1000)

    // Auto-cancel après 60 secondes sans réponse
    if (callStatus === "ringing" && timer >= 60) {
      onCancel()
    }

    return () => clearInterval(interval)
  }, [isOpen, callStatus, timer, onCancel])

  // Gestion audio
  useEffect(() => {
    if (audioRef.current) {
      if (isOpen && ringtoneEnabled && callStatus === "ringing") {
        audioRef.current.volume = 0.3
        audioRef.current.play().catch(err => 
          console.warn("Audio play error:", err)
        )
      } else {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [isOpen, callStatus, ringtoneEnabled])

  // Initialize webcam when popup opens
  useEffect(() => {
    if (isOpen && isVideoCall) {
      console.log("🔄 Effect: Initializing webcam")
      const initTimeout = setTimeout(() => {
        initWebcam()
      }, 500) // Small delay to ensure DOM is ready
      
      return () => clearTimeout(initTimeout)
    }
  }, [isOpen, isVideoCall, initWebcam])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Component unmounting, cleaning up")
      if (localStream) {
        localStream.getTracks().forEach(track => {
          console.log("Stopping track:", track.kind)
          track.stop()
        })
        setLocalStream(null)
      }
    }
  }, [])

  const toggleVideo = async () => {
    const newState = !isVideoEnabled
    setIsVideoEnabled(newState)
    
    // Stop current stream if disabling
    if (!newState && localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null
      }
    }
    
    // Start new stream if enabling
    if (newState) {
      setTimeout(() => initWebcam(), 100)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const switchCamera = () => {
    if (!isMobile) return
    
    const newFacing = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newFacing)
    setDebugInfo(`Switching camera to: ${newFacing}`)
    
    // Stop current and restart
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    
    setTimeout(() => initWebcam(), 300)
  }

  const retryCamera = () => {
    setDebugInfo("Retrying camera...")
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    setTimeout(() => initWebcam(), 100)
  }

  const getStatusConfig = () => {
    switch (callStatus) {
      case "connecting":
        return {
          text: "Connexion en cours...",
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/20",
          iconColor: "text-yellow-400",
          animation: "animate-pulse",
          gradient: "from-yellow-900/40 via-yellow-800/30 to-yellow-900/40"
        }
      case "ringing":
        return {
          text: "Sonnerie...",
          color: "text-blue-400",
          bgColor: "bg-blue-500/20",
          iconColor: "text-blue-400",
          animation: "animate-pulse",
          gradient: "from-blue-900/40 via-blue-800/30 to-blue-900/40"
        }
      case "connected":
        return {
          text: "Connecté !",
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          iconColor: "text-green-400",
          animation: "",
          gradient: "from-green-900/40 via-green-800/30 to-green-900/40"
        }
      default:
        return {
          text: "En attente...",
          color: "text-gray-400",
          bgColor: "bg-gray-500/20",
          iconColor: "text-gray-400",
          animation: "",
          gradient: "from-gray-900/40 via-gray-800/30 to-gray-900/40"
        }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const statusConfig = getStatusConfig()

  if (!isOpen) return null

  return (
    <>
      {/* DEBUG INFO - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 left-4 z-[10001] bg-black/80 text-white text-xs p-2 rounded max-w-xs">
          <div className="font-mono">
            <div>Debug: {debugInfo}</div>
            <div>Video: {isVideoEnabled ? "ON" : "OFF"}</div>
            <div>Stream: {localStream ? "ACTIVE" : "INACTIVE"}</div>
            <div>Permission: {hasCameraPermission ? "GRANTED" : "DENIED"}</div>
          </div>
        </div>
      )}

      {/* Backdrop avec webcam blur effect */}
      <div className="fixed inset-0 z-[9998] overflow-hidden bg-black">
        {/* Webcam video with blur effect - ABSOLUTELY VISIBLE */}
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: "blur(20px) brightness(0.7)",
            transform: "scale(1.2)",
            opacity: isVideoEnabled && localStream ? 1 : 0,
            transition: "opacity 0.3s ease"
          }}
        />
        
        {/* Fallback gradient if no webcam */}
        {(!isVideoEnabled || !localStream) && (
          <div className={`absolute inset-0 bg-gradient-to-br ${statusConfig.gradient} 
            backdrop-blur-sm transition-all duration-1000`} />
        )}
        
        {/* Overlay for better contrast */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40`} />
      </div>

      {/* Overlay sombre */}
      <div className={`fixed inset-0 z-[9999] transition-all duration-500 
        ${callStatus === "connected" ? 'bg-black/40' : 'bg-black/70'}
        ${isOpen ? 'animate-in fade-in' : 'animate-out fade-out'}`} />
      
      {/* Pop-up centrale */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-6">
        <div className={cn(
          "bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80",
          "backdrop-blur-xl rounded-3xl md:rounded-4xl shadow-2xl w-full max-w-md md:max-w-lg overflow-hidden",
          "border border-white/10",
          isOpen ? 'animate-in zoom-in slide-in-from-bottom-4 duration-500' : 'animate-out zoom-out'
        )}
          style={{
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Header élégant */}
          <div className="relative p-6 md:p-8 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("relative p-2 rounded-lg", statusConfig.bgColor, "backdrop-blur-sm")}>
                  {isVideoCall ? (
                    <Video className={cn("w-5 h-5", statusConfig.iconColor)} />
                  ) : (
                    <Phone className={cn("w-5 h-5", statusConfig.iconColor)} />
                  )}
                  {callStatus === "ringing" && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                  )}
                </div>
                <span className={cn("text-sm font-medium", statusConfig.color, "backdrop-blur-sm")}>
                  {statusConfig.text}
                </span>
              </div>
              
              {/* Contrôles rapides */}
              <div className="flex items-center gap-2">
                {isVideoCall && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleVideo}
                      className="text-gray-400 hover:text-white hover:bg-white/10 
                        transition-all active:scale-95 px-2 py-1"
                    >
                      {isVideoEnabled ? (
                        <Camera className="w-4 h-4" />
                      ) : (
                        <CameraOff className="w-4 h-4" />
                      )}
                    </Button>
                    
                    {isMobile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={switchCamera}
                        className="text-gray-400 hover:text-white hover:bg-white/10 
                          transition-all active:scale-95 px-2 py-1"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {!hasCameraPermission && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={retryCamera}
                        className="text-red-400 hover:text-white hover:bg-red-500/20 
                          transition-all active:scale-95 px-2 py-1"
                      >
                        🔄
                      </Button>
                    )}
                  </>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-gray-400 hover:text-white hover:bg-white/10 
                    transition-all active:scale-95 px-2 py-1"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                
                {callStatus !== "connected" && (
                  <Button
                    onClick={onCancel}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-white/10 
                      transition-all active:scale-95 px-3 py-2"
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex flex-col items-center px-6 md:px-8 pb-8 relative z-10">
            
            {/* Avatar avec effets */}
            <div className="relative mb-8">
              {/* Animation de connexion */}
              {callStatus === "connecting" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full border-2 border-yellow-500/30"
                      style={{
                        width: `${120 + i * 40}px`,
                        height: `${120 + i * 40}px`,
                        animation: `connecting-ring 2s infinite ${i * 0.3}s`,
                        opacity: 0.6 - i * 0.2
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Avatar principal avec halo lumineux */}
              <div className="relative group">
                {/* Halo effect */}
                <div className={cn(
                  "absolute inset-0 rounded-full blur-2xl transition-all duration-500",
                  callStatus === "connected" 
                    ? "bg-gradient-to-br from-green-500/40 to-emerald-600/30" 
                    : callStatus === "ringing"
                    ? "bg-gradient-to-br from-blue-500/40 to-purple-600/30 animate-pulse"
                    : "bg-gradient-to-br from-yellow-500/40 to-orange-600/30"
                )} />
                
                <Avatar className={cn(
                  "h-36 w-36 border-4 shadow-2xl relative z-10 transition-all duration-300 group-hover:scale-105",
                  callStatus === "connected" 
                    ? 'border-green-500/50 shadow-green-500/20' 
                    : callStatus === "ringing"
                    ? 'border-blue-500/50 shadow-blue-500/20 animate-pulse'
                    : 'border-yellow-500/50 shadow-yellow-500/20'
                )}>
                  <AvatarImage 
                    src={recipientAvatar} 
                    alt={recipientName}
                    className={cn(
                      callStatus === "connecting" && "grayscale"
                    )}
                  />
                  <AvatarFallback className={cn(
                    "text-4xl font-bold transition-all duration-300 text-white",
                    callStatus === "connected"
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                      : callStatus === "ringing"
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                      : 'bg-gradient-to-br from-yellow-500 to-orange-600'
                  )}>
                    {recipientName?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                
                {/* Badge statut interactif */}
                <div className={cn(
                  "absolute -bottom-3 -right-3 rounded-full p-3 shadow-2xl",
                  "border-4 border-gray-900/50 z-20 transition-all duration-300 hover:scale-110 active:scale-95",
                  callStatus === "connected"
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                    : callStatus === "ringing"
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 animate-pulse'
                    : 'bg-gradient-to-br from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700'
                )}>
                  {callStatus === "connected" ? (
                    <User className="w-6 h-6 text-white" />
                  ) : isVideoCall ? (
                    <Video className="w-6 h-6 text-white" />
                  ) : (
                    <Phone className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
              
              {/* Indicateur webcam */}
              {isVideoCall && (
                <div className={cn(
                  "absolute -top-2 left-1/2 transform -translate-x-1/2",
                  "px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1",
                  isVideoEnabled && localStream
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                    : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                )}>
                  {isVideoEnabled && localStream ? (
                    <>
                      <Camera className="w-3 h-3" />
                      <span>Caméra activée</span>
                    </>
                  ) : (
                    <>
                      <CameraOff className="w-3 h-3" />
                      <span>Caméra désactivée</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Informations */}
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {recipientName}
              </h2>
              {recipientInfo && (
                <p className="text-gray-300 text-sm mb-4">
                  {recipientInfo}
                </p>
              )}
              
              {/* Indicateur de statut détaillé */}
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gray-800/50 backdrop-blur-sm border border-white/10">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  statusConfig.animation,
                  callStatus === "connected" 
                    ? 'bg-green-500' 
                    : callStatus === "ringing"
                    ? 'bg-blue-500'
                    : 'bg-yellow-500'
                )} />
                <span className={cn("text-sm font-medium", statusConfig.color)}>
                  {callStatus === "connecting" && (
                    <>
                      {["Connexion", "En cours", "..."][connectionAttempts]}
                    </>
                  )}
                  {callStatus === "ringing" && "Sonnerie en cours"}
                  {callStatus === "connected" && "Appel connecté"}
                </span>
              </div>
            </div>

            {/* Indicateur visuel */}
            <div className="mb-8 w-full max-w-xs">
              {callStatus === "connecting" && (
                <div className="flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-8 bg-gradient-to-t from-yellow-500 to-orange-500 rounded-full backdrop-blur-sm"
                      style={{
                        height: `${8 + Math.sin(timer + i) * 12}px`
                      }}
                    />
                  ))}
                </div>
              )}
              {callStatus === "ringing" && (
                <div className="flex justify-center gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-blue-500 rounded-full animate-pulse backdrop-blur-sm"
                      style={{
                        animationDelay: `${i * 0.2}s`
                      }}
                    />
                  ))}
                </div>
              )}
              {callStatus === "connected" && (
                <div className="flex items-center justify-center gap-2">
                  <div className="relative">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-ping backdrop-blur-sm" />
                    <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full backdrop-blur-sm" />
                  </div>
                  <span className="text-green-300 text-sm font-medium">
                    {isVideoEnabled ? "Vidéo active" : "Prêt à discuter"}
                  </span>
                </div>
              )}
            </div>

            {/* Timer et actions */}
            <div className="flex flex-col items-center gap-6 w-full">
              {/* Timer élégant */}
              <div className={cn(
                "px-6 py-3 rounded-2xl backdrop-blur-lg transition-all duration-300 border",
                callStatus === "connected"
                  ? 'bg-green-500/10 border-green-500/20'
                  : callStatus === "ringing"
                  ? 'bg-blue-500/10 border-blue-500/20'
                  : 'bg-yellow-500/10 border-yellow-500/20'
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    callStatus === "connected"
                      ? 'bg-green-500'
                      : callStatus === "ringing"
                      ? 'bg-blue-500'
                      : 'bg-yellow-500'
                  )} />
                  <span className={cn(
                    "text-lg font-mono font-medium",
                    callStatus === "connected"
                      ? 'text-green-300'
                      : callStatus === "ringing"
                      ? 'text-blue-300'
                      : 'text-yellow-300'
                  )}>
                    {formatTime(timer)}
                  </span>
                </div>
              </div>

              {/* Bouton principal */}
              <div className="flex flex-col items-center">
                <Button
                  onClick={onCancel}
                  disabled={isLoading}
                  className={cn(
                    "group relative h-20 w-20 rounded-full shadow-2xl",
                    "hover:shadow-3xl transition-all duration-300 hover:scale-110",
                    "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm",
                    callStatus === "connected"
                      ? 'bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 border border-red-500/30'
                      : 'bg-gradient-to-br from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 border border-red-500/30'
                  )}
                >
                  <div className="absolute inset-0 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 
                    transition-opacity duration-300" />
                  <X className="w-10 h-10 text-white relative z-10 group-hover:rotate-90 transition-transform duration-300" strokeWidth={3} />
                  <div className="absolute -inset-4 bg-red-500/20 blur-xl opacity-0 group-hover:opacity-100 
                    transition-opacity duration-300" />
                </Button>
                <span className={cn(
                  "mt-3 text-sm font-medium tracking-wide backdrop-blur-sm px-3 py-1 rounded-full",
                  callStatus === "connected" 
                    ? 'text-red-300 bg-red-500/10 border border-red-500/20' 
                    : 'text-red-300 bg-red-500/10 border border-red-500/20'
                )}>
                  {callStatus === "connected" ? "Terminer l'appel" : "Annuler l'appel"}
                </span>
              </div>

              {/* Message info */}
              <div className="text-center max-w-sm">
                <p className="text-xs text-gray-300 backdrop-blur-sm px-3 py-2 rounded-full bg-gray-800/30">
                  {callStatus === "ringing" && 
                    `En attente de réponse... (${60 - timer}s restants)`}
                  {callStatus === "connecting" && 
                    "Établissement de la connexion..."}
                  {callStatus === "connected" && 
                    `Appel établi - ${timer > 30 ? "Discussion en cours" : "Prêt à communiquer"}`}
                </p>
              </div>
            </div>
          </div>

          {/* Effets spéciaux */}
          {callStatus === "ringing" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-pulse" />
          )}
          
          {callStatus === "connected" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500/50 via-emerald-500/50 to-green-500/50 animate-pulse" />
          )}
        </div>
      </div>

      {/* Audio de sonnerie sortante */}
      {ringtoneEnabled && (
        <audio
          ref={audioRef}
          className="hidden"
          src="/sounds/outgoing-ringtone.mp3"
          loop
          preload="auto"
        />
      )}
    </>
  )
}