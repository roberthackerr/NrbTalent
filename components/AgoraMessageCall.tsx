"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"

type Status = "idle" | "connecting" | "connected"
type PermissionState = "unknown" | "granted" | "denied" | "prompt"

export type AgoraMessageCallHandle = {
  startCall: () => Promise<void>
  endCall: () => Promise<void>
}

type Props = {
  channelName: string
  autoStart?: boolean
  showStartButton?: boolean
  onClose?: () => void
  onStatusChange?: (status: Status) => void
  onRemoteUsersChange?: (users: number[]) => void
}

export const AgoraMessageCall = forwardRef<AgoraMessageCallHandle, Props>(function AgoraMessageCall(
  { channelName, autoStart = false, showStartButton = true, onClose, onStatusChange, onRemoteUsersChange },
  ref
) {
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState("")
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>("unknown")
  const [remoteUsers, setRemoteUsers] = useState<number[]>([])
  const [isPublished, setIsPublished] = useState(false)
  const [hasAudio, setHasAudio] = useState(true)
  const [hasVideo, setHasVideo] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")

  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<any>(null)
  const localTracksRef = useRef<any[]>([])

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || ""

  useEffect(() => {
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    setIsMobile(mobileCheck)

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Your browser does not support camera/microphone access")
      setHasAudio(false)
      setHasVideo(false)
      return
    }

    checkDevicesAndPermissions()
    return () => {
      cleanup()
    }
  }, [])

  const checkDevicesAndPermissions = async () => {
    try {
      if (navigator.permissions) {
        try {
          const cameraPermission = await navigator.permissions.query({ name: "camera" as PermissionName })
          setPermissionStatus(cameraPermission.state as PermissionState)
        } catch (permErr) {
          console.warn("Could not query permissions:", permErr)
        }
      }

      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioDevices = devices.filter(d => d.kind === "audioinput")
      const videoDevices = devices.filter(d => d.kind === "videoinput")

      if (audioDevices.length === 0) setHasAudio(false)
      if (videoDevices.length === 0) setHasVideo(false)
    } catch (err) {
      console.warn("Could not check devices:", err)
    }
  }

  const requestPermissions = async () => {
    setError("")
    try {
      const constraints: MediaStreamConstraints = {}
      if (hasAudio) {
        constraints.audio = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      }
      if (hasVideo) {
        constraints.video = isMobile
          ? {
              facingMode: facingMode,
              width: { ideal: 640, max: 1280 },
              height: { ideal: 480, max: 720 },
              frameRate: { ideal: 30, max: 30 },
            }
          : {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setPermissionStatus("granted")
      stream.getTracks().forEach(track => track.stop())
      await checkDevicesAndPermissions()
    } catch (err: any) {
      console.error("Permission request failed:", err)
      setPermissionStatus("denied")
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Camera/microphone access denied. Please allow access in your browser settings.")
      } else if (err.name === "NotFoundError") {
        setError("No camera or microphone found on your device.")
      } else if (err.name === "NotReadableError") {
        setError("Camera/microphone is already in use by another application.")
      } else {
        setError(`Permission error: ${err.message}`)
      }
    }
  }

  const getToken = async () => {
    const response = await fetch(`/api/agora/token?channel=${channelName}`)
    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || "Failed to generate token")
    }
    return data
  }

  const playLocalPreview = async (videoTrack: any) => {
    try {
      const container = localVideoRef.current
      if (!container) {
        console.warn("Local container not ready for preview")
        return
      }

      container.innerHTML = ""
      await new Promise(requestAnimationFrame)
      await videoTrack.setEnabled(true)

      const mediaTrack = videoTrack.getMediaStreamTrack?.()
      if (!mediaTrack) {
        console.warn("No media track available for preview")
        setError("Unable to render local preview. Please retry or refresh.")
        return
      }

      const stream = new MediaStream([mediaTrack])
      const videoEl = document.createElement("video")
      videoEl.autoplay = true
      videoEl.muted = true
      videoEl.playsInline = true
      videoEl.style.width = "100%"
      videoEl.style.height = "100%"
      videoEl.style.objectFit = "cover"
      videoEl.srcObject = stream
      container.appendChild(videoEl)
      await videoEl.play().catch(e => console.warn("HTML video play warning:", e))
      console.log("✅ Local video playing via direct element")
    } catch (err) {
      console.warn("❌ Local preview error:", err)
      setError("Unable to render local preview. Please retry or refresh.")
    }
  }

  const playRemoteVideo = async (user: any) => {
    const container = remoteVideoRef.current
    if (!container) {
      console.warn("Remote container not ready")
      return
    }

    let playerDiv = document.getElementById(`remote-player-${user.uid}`)
    if (!playerDiv) {
      playerDiv = document.createElement("div")
      playerDiv.id = `remote-player-${user.uid}`
      playerDiv.className = "w-full h-full"
      playerDiv.style.objectFit = "cover"
      container.appendChild(playerDiv)
    } else {
      playerDiv.innerHTML = ""
    }

    try {
      await user.videoTrack.play(playerDiv)
      console.log("🎬 Remote video playing:", user.uid)
    } catch (playErr: any) {
      console.warn("Remote video play failed, using fallback element:", playErr)
      const mediaTrack = user.videoTrack?.getMediaStreamTrack?.()
      if (mediaTrack) {
        const stream = new MediaStream([mediaTrack])
        const videoEl = document.createElement("video")
        videoEl.autoplay = true
        videoEl.muted = false
        videoEl.playsInline = true
        videoEl.style.width = "100%"
        videoEl.style.height = "100%"
        videoEl.style.objectFit = "cover"
        videoEl.srcObject = stream
        playerDiv.appendChild(videoEl)
        await videoEl.play().catch(e => console.warn("Remote HTML video play warning:", e))
      } else {
        console.warn("No media track available for remote user:", user.uid)
      }
    }
  }

  const subscribeToUserMedia = async (user: any) => {
    try {
      if (user.hasVideo) {
        await clientRef.current.subscribe(user, "video")
        await playRemoteVideo(user)
        setRemoteUsers(prev => (prev.includes(user.uid) ? prev : [...prev, user.uid]))
      }
      if (user.hasAudio) {
        await clientRef.current.subscribe(user, "audio")
        user.audioTrack.play()
        console.log("🔊 Playing remote audio:", user.uid)
      }
    } catch (err: any) {
      console.error("❌ Subscribe media error for user", user.uid, err)
    }
  }

  const setupRemoteUserHandlers = () => {
    clientRef.current.on("user-published", async (user: any, mediaType: string) => {
      console.log("👤 Remote user published:", user.uid, mediaType)
      try {
        await clientRef.current.subscribe(user, mediaType)
        if (mediaType === "video") {
          await playRemoteVideo(user)
          setRemoteUsers(prev => (prev.includes(user.uid) ? prev : [...prev, user.uid]))
        }
        if (mediaType === "audio") {
          user.audioTrack.play()
          console.log("🔊 Playing remote audio:", user.uid)
        }
      } catch (err: any) {
        console.error("❌ Subscribe error:", err)
      }
    })

    clientRef.current.on("user-unpublished", (user: any) => {
      console.log("👤 User unpublished:", user.uid)
      const playerDiv = document.getElementById(`remote-player-${user.uid}`)
      if (playerDiv) playerDiv.remove()
      setRemoteUsers(prev => prev.filter(id => id !== user.uid))
    })

    clientRef.current.on("user-joined", async (user: any) => {
      console.log("👋 User joined:", user.uid)
      await subscribeToUserMedia(user)
    })

    clientRef.current.on("user-left", (user: any) => {
      console.log("👋 User left:", user.uid)
      const playerDiv = document.getElementById(`remote-player-${user.uid}`)
      if (playerDiv) playerDiv.remove()
      setRemoteUsers(prev => prev.filter(id => id !== user.uid))
    })

    clientRef.current.on("connection-state-change", (curState: string, prevState: string) => {
      console.log("🔌 Connection:", prevState, "→", curState)
    })
  }

 // 1. Dans AgoraMessageCall.tsx - Améliorer le démarrage de l'appel

const testConnection = async () => {
  console.log("🔌 [AGORA] Début testConnection...")
  setStatus("connecting")
  setError("")
  setRemoteUsers([])
  setIsPublished(false)

  try {
    // 1. Obtenir le token
    console.log("🎫 [AGORA] Récupération token pour canal:", channelName)
    const tokenData = await getToken()
    console.log("✅ [AGORA] Token reçu:", { 
      appId: tokenData.appId?.substring(0, 10) + '...', 
      uid: tokenData.uid,
      channelName: tokenData.channelName 
    })

    // 2. Importer Agora SDK
    const AgoraRTC = (await import("agora-rtc-sdk-ng")).default
    AgoraRTC.setLogLevel(0) // 0 = DEBUG, 4 = NONE

    // 3. Créer le client
    console.log("👤 [AGORA] Création client RTC...")
    clientRef.current = AgoraRTC.createClient({
      mode: "rtc",
      codec: "vp8",
    })
    console.log("✅ [AGORA] Client créé")

    // 4. Rejoindre le canal
    console.log("🚪 [AGORA] Joining channel:", tokenData.channelName)
    try {
      await clientRef.current.join(
        tokenData.appId, 
        tokenData.channelName, 
        tokenData.token, 
        tokenData.uid
      )
      console.log("✅ [AGORA] Channel joined successfully!")
    } catch (joinError: any) {
      console.error("❌ [AGORA] Join failed:", joinError)
      throw new Error(`Failed to join channel: ${joinError.message}`)
    }

    // 5. Créer les tracks
    const tracks = []
    let microphoneTrack = null
    let cameraTrack = null

    if (hasAudio && micEnabled) {
      try {
        console.log("🎤 [AGORA] Creating microphone track...")
        microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: {
            sampleRate: 48000,
            stereo: false,
            bitrate: 48,
          },
        })
        tracks.push(microphoneTrack)
        console.log("✅ [AGORA] Microphone track created")
      } catch (audioErr: any) {
        console.error("❌ [AGORA] Microphone error:", audioErr.message)
        setHasAudio(false)
      }
    }

    if (hasVideo && cameraEnabled) {
      try {
        console.log("📹 [AGORA] Creating camera track...")
        const videoConfig: any = isMobile
          ? {
              facingMode: facingMode,
              encoderConfig: {
                width: { ideal: 640, max: 1280 },
                height: { ideal: 480, max: 720 },
                frameRate: { ideal: 30, max: 30 },
                bitrateMin: 400,
                bitrateMax: 1000,
              },
            }
          : {
              encoderConfig: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 },
                bitrateMin: 600,
                bitrateMax: 1500,
              },
            }

        cameraTrack = await AgoraRTC.createCameraVideoTrack(videoConfig)
        tracks.push(cameraTrack)
        console.log("✅ [AGORA] Camera track created")
      } catch (videoErr: any) {
        console.error("❌ [AGORA] Camera error:", videoErr.message, videoErr.code)
        setHasVideo(false)
      }
    }

    // 6. Publier les tracks
    if (tracks.length > 0) {
      try {
        console.log(`📤 [AGORA] Publishing ${tracks.length} tracks...`)
        await clientRef.current.publish(tracks)
        setIsPublished(true)
        console.log("✅ [AGORA] Tracks published successfully!")
      } catch (publishErr: any) {
        console.error("❌ [AGORA] Publish failed:", publishErr)
        // Ne pas bloquer si la publication échoue
      }
    } else {
      console.warn("⚠️ [AGORA] No tracks to publish")
    }

    localTracksRef.current = tracks
    setStatus("connected")
    console.log("🎉 [AGORA] Connection établie avec succès!")

    // 7. Afficher la vidéo locale
    if (cameraTrack) {
      console.log("📺 [AGORA] Playing local preview...")
      await playLocalPreview(cameraTrack)
    }

    // 8. Setup des event handlers
    setupRemoteUserHandlers()

    // 9. Souscrire aux utilisateurs déjà présents
    if (clientRef.current?.remoteUsers?.length) {
      console.log(`👥 [AGORA] ${clientRef.current.remoteUsers.length} utilisateurs déjà présents`)
      for (const user of clientRef.current.remoteUsers) {
        await subscribeToUserMedia(user)
      }
    } else {
      console.log("👤 [AGORA] Aucun utilisateur distant pour le moment")
    }

  } catch (error: any) {
    console.error("❌ [AGORA] Connection error:", error)
    
    // Messages d'erreur détaillés
    if (error.message?.includes("AGORA_APP_ID")) {
      setError(`Configuration Error: AGORA_APP_ID is missing`)
    } else if (error.message?.includes("token")) {
      setError(`Token Error: ${error.message}`)
    } else if (error.code === "PERMISSION_DENIED") {
      setError("Permission denied. Please allow camera/microphone access.")
    } else if (error.message?.includes("join")) {
      setError(`Failed to join video call: ${error.message}`)
    } else {
      setError(`Connection Error: ${error.message || "Unknown error"}`)
    }
    
    // Nettoyer en cas d'erreur
    await cleanup()
    setStatus("idle")
    
    // ⚠️ NE PAS APPELER onClose() en cas d'erreur de connexion
    // car cela enverrait VIDEO_CALL_ENDED au serveur
    console.log("⚠️ [AGORA] Connection failed but NOT calling onClose to avoid ending call")
  }
}

// 2. Améliorer la fonction cleanup pour éviter les appels multiples

const cleanup = async () => {
  // Éviter les appels multiples
  if (isCleaningUp.current) {
    console.log("⚠️ [AGORA] Cleanup already in progress, skipping...")
    return
  }
  
  isCleaningUp.current = true
  console.log("🧹 [AGORA] Début du cleanup...")
  
  try {
    // 1. Arrêter et fermer les tracks locaux
    console.log("📹 [AGORA] Arrêt des tracks locaux...")
    for (const track of localTracksRef.current) {
      if (track) {
        try {
          if (track.isPlaying) {
            track.stop()
          }
          track.close()
          console.log(`✅ [AGORA] Track ${track.trackMediaType} fermé`)
        } catch (e) {
          console.warn(`⚠️ [AGORA] Erreur fermeture track:`, e)
        }
      }
    }

    // 2. Unpublish et leave du client
    if (clientRef.current) {
      try {
        // Unpublish les tracks si publiés
        if (localTracksRef.current.length > 0 && isPublished) {
          console.log("📤 [AGORA] Unpublishing tracks...")
          await clientRef.current.unpublish(localTracksRef.current)
          console.log("✅ [AGORA] Tracks unpublished")
        }
      } catch (e) {
        console.warn("⚠️ [AGORA] Erreur unpublish (non bloquant):", e)
      }

      try {
        // Quitter le canal
        console.log("🚪 [AGORA] Leaving channel...")
        await clientRef.current.leave()
        console.log("✅ [AGORA] Channel left")
      } catch (e) {
        console.warn("⚠️ [AGORA] Erreur leave (non bloquant):", e)
      }

      // Nettoyer les event listeners
      try {
        clientRef.current.removeAllListeners()
        console.log("✅ [AGORA] Event listeners nettoyés")
      } catch (e) {
        console.warn("⚠️ [AGORA] Erreur remove listeners:", e)
      }
    }

    // 3. Nettoyer les conteneurs vidéo
    if (localVideoRef.current) {
      localVideoRef.current.innerHTML = ""
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.innerHTML = ""
    }

    // 4. Réinitialiser les états
    localTracksRef.current = []
    clientRef.current = null
    setRemoteUsers([])
    setIsPublished(false)
    
    console.log("✅ [AGORA] Cleanup terminé avec succès")
    
  } catch (err) {
    console.error("❌ [AGORA] Erreur lors du cleanup:", err)
  } finally {
    // Toujours réinitialiser le statut
    setStatus("idle")
    isCleaningUp.current = false
    
    // ⚠️ Appeler onClose SEULEMENT si le cleanup est intentionnel
    // (pas en cas d'erreur de connexion)
    if (status === "connected") {
      console.log("📞 [AGORA] Calling onClose (cleanup from connected state)")
      // Petit délai avant d'appeler onClose
      setTimeout(() => {
        onClose?.()
      }, 300)
    } else {
      console.log("⚠️ [AGORA] NOT calling onClose (cleanup from non-connected state)")
    }
  }
}

// Ajouter cette ref au début du composant
const isCleaningUp = useRef(false)
  const toggleCamera = async () => {
    const track = localTracksRef.current.find(t => t?.trackMediaType === "video")
    if (track) {
      const newState = !track.enabled
      await track.setEnabled(newState)
      setCameraEnabled(newState)
      console.log("Camera:", newState ? "ON" : "OFF")
    }
  }

  const toggleMic = async () => {
    const track = localTracksRef.current.find(t => t?.trackMediaType === "audio")
    if (track) {
      const newState = !track.enabled
      await track.setEnabled(newState)
      setMicEnabled(newState)
      console.log("Microphone:", newState ? "ON" : "OFF")
    }
  }

  const switchCamera = async () => {
    if (!isMobile) return

    const newFacing = facingMode === "user" ? "environment" : "user"
    setFacingMode(newFacing)

    if (status === "connected") {
      const videoTrack = localTracksRef.current.find(t => t?.trackMediaType === "video")
      if (videoTrack) {
        try {
          await videoTrack.stop()
          await videoTrack.close()

          const AgoraRTC = (await import("agora-rtc-sdk-ng")).default
          const newTrack = await AgoraRTC.createCameraVideoTrack({
            facingMode: newFacing,
            encoderConfig: {
              width: { ideal: 640, max: 1280 },
              height: { ideal: 480, max: 720 },
              frameRate: { ideal: 30, max: 30 },
            },
          })

          const trackIndex = localTracksRef.current.indexOf(videoTrack)
          localTracksRef.current[trackIndex] = newTrack

          await clientRef.current.unpublish(videoTrack)
          await clientRef.current.publish(newTrack)

          if (localVideoRef.current) {
            await playLocalPreview(newTrack)
          }
        } catch (err) {
          console.error("Switch camera error:", err)
        }
      }
    }
  }

  useEffect(() => {
    if (status !== "connected") return
    const videoTrack = localTracksRef.current.find((t: any) => t?.trackMediaType === "video")
    if (videoTrack) {
      playLocalPreview(videoTrack)
    }
  }, [status, cameraEnabled, facingMode])

  useEffect(() => {
    onStatusChange?.(status)
  }, [status, onStatusChange])

  useEffect(() => {
    onRemoteUsersChange?.(remoteUsers)
  }, [remoteUsers, onRemoteUsersChange])

  useImperativeHandle(ref, () => ({
    startCall: async () => {
      if (status === "connected" || status === "connecting") return
      await requestPermissions()
      await testConnection()
    },
    endCall: async () => {
      await cleanup()
    },
  }))

  useEffect(() => {
    if (autoStart) {
      requestPermissions().then(testConnection).catch(console.warn)
    }
  }, [autoStart])

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div>
          <div className="text-sm font-semibold text-slate-900">Video call</div>
          <div className="text-xs text-slate-500">Channel: {channelName}</div>
        </div>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            status === "idle"
              ? "bg-slate-100 text-slate-700"
              : status === "connecting"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-green-100 text-green-700"
          }`}
        >
          {status === "idle" ? "Ready" : status === "connecting" ? "Connecting" : "Connected"}
        </span>
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-3 px-4 py-3 md:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between bg-slate-800 px-3 py-2 text-white text-sm">
            <span>📹 You</span>
            <div className={`h-2 w-2 rounded-full ${cameraEnabled ? "bg-green-400" : "bg-red-400"}`} />
          </div>
          <div ref={localVideoRef} className="h-56 w-full" />
          <div className="flex gap-2 bg-slate-50 px-3 py-2">
            {hasVideo && (
              <>
                <button
                  onClick={toggleCamera}
                  className="flex-1 rounded bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
                >
                  {cameraEnabled ? "📹 On" : "📹 Off"}
                </button>
                {isMobile && (
                  <button
                    onClick={switchCamera}
                    className="rounded bg-purple-100 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-200"
                  >
                    🔄
                  </button>
                )}
              </>
            )}
            {hasAudio && (
              <button
                onClick={toggleMic}
                className="flex-1 rounded bg-green-100 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-200"
              >
                {micEnabled ? "🎤 On" : "🎤 Off"}
              </button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between bg-slate-800 px-3 py-2 text-white text-sm">
            <span>👥 Remote ({remoteUsers.length})</span>
          </div>
          <div ref={remoteVideoRef} className="flex h-56 w-full items-center justify-center">
            {remoteUsers.length === 0 && (
              <div className="text-center text-slate-400">
                <div className="text-3xl mb-1">⏳</div>
                <p className="text-sm">Waiting for others…</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3">
        {permissionStatus !== "granted" && status === "idle" && (
          <button
            onClick={requestPermissions}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Grant permissions
          </button>
        )}
        {status === "connected" ? (
          <>
            {!isPublished && (
              <div className="rounded bg-yellow-100 px-3 py-2 text-xs font-medium text-yellow-800">
                Not broadcasting
              </div>
            )}
            <button
              onClick={cleanup}
              className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Disconnect
            </button>
          </>
        ) : (
          showStartButton && (
            <button
              onClick={testConnection}
              disabled={status === "connecting" || permissionStatus !== "granted"}
              className={`rounded px-4 py-2 text-sm font-medium ${
                status === "connecting" || permissionStatus !== "granted"
                  ? "cursor-not-allowed bg-slate-300 text-slate-500"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {status === "connecting" ? "Connecting…" : "Start call"}
            </button>
          )
        )}

        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <span>🎤 {hasAudio ? "Audio" : "No mic"}</span>
          <span>📹 {hasVideo ? "Video" : "No camera"}</span>
          <span>
            🔐 {permissionStatus === "granted" ? "Granted" : permissionStatus === "denied" ? "Denied" : "Not requested"}
          </span>
        </div>
      </div>
    </div>
  )
})