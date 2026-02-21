"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor } from "lucide-react"
import { toast } from "sonner"

export default function VideoCallPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    startLocalStream()

    return () => {
      stopLocalStream()
    }
  }, [])

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      localStreamRef.current = stream

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      toast.success("Connected to video call")
    } catch (error) {
      console.error("Error accessing media devices:", error)
      toast.error("Failed to access camera/microphone")
    }
  }

  const stopLocalStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
    }
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOff(!videoTrack.enabled)
      }
    }
  }

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        })

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream
        }

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
          startLocalStream()
        }

        setIsScreenSharing(true)
        toast.success("Screen sharing started")
      } else {
        startLocalStream()
        setIsScreenSharing(false)
        toast.success("Screen sharing stopped")
      }
    } catch (error) {
      console.error("Error sharing screen:", error)
      toast.error("Failed to share screen")
    }
  }

  const endCall = () => {
    stopLocalStream()
    toast.success("Call ended")
    router.push("/dashboard/messages")
  }

  return (
    <div className="relative flex h-screen flex-col bg-black">
      {/* Remote Video (Main) */}
      <div className="relative flex-1">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
          poster="/waiting-for-participant.jpg"
        />

        {/* Waiting message */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-16 w-16 animate-pulse rounded-full bg-primary/20 mx-auto" />
            <p className="text-lg font-semibold text-white">Waiting for participant to join...</p>
            <p className="text-sm text-white/70">Room ID: {roomId}</p>
          </div>
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute bottom-4 right-4 h-48 w-64 overflow-hidden rounded-lg border-2 border-white/20 bg-black shadow-xl">
          <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <VideoOff className="h-8 w-8 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full bg-black/80 px-6 py-4 backdrop-blur-sm">
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={toggleMute}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        <Button
          variant={isVideoOff ? "destructive" : "secondary"}
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={toggleVideo}
        >
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </Button>

        <Button
          variant={isScreenSharing ? "default" : "secondary"}
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={toggleScreenShare}
        >
          <Monitor className="h-5 w-5" />
        </Button>

        <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full" onClick={endCall}>
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
