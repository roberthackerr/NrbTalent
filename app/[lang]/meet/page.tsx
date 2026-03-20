// app/[lang]/meet/page.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Phone,
  Users,
  Settings,
  Share2,
  Copy,
  Check,
  RefreshCw,
  Camera,
  CameraOff,
  Wifi,
  WifiOff,
  Loader2,
  Sparkles,
  Shield,
  Info,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Link as LinkIcon,
  X
} from 'lucide-react'
import Link from 'next/link'

export default function AgoraVideoMeetPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const lang = params.lang as Locale
  
  const roomParam = searchParams.get('room')
  
  // État pour le dictionnaire
  const [dict, setDict] = useState<any>(null)
  
  // État de la connexion
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle')
  const [error, setError] = useState('')
  const [channelName, setChannelName] = useState(roomParam || `meet-${Math.floor(Math.random() * 10000)}`)
  const [connectionInfo, setConnectionInfo] = useState<any>(null)
  const [remoteUsers, setRemoteUsers] = useState<number[]>([])
  
  // État des périphériques
  const [isMobile, setIsMobile] = useState(false)
  const [hasAudio, setHasAudio] = useState(true)
  const [hasVideo, setHasVideo] = useState(true)
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown')
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(true)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  
  // État des appareils sélectionnés
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('')
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('')
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  
  // État UI
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [autoConnect, setAutoConnect] = useState(false)
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  
  // Refs
  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoContainerRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<any>(null)
  const localTracksRef = useRef<any[]>([])
  const remotePlayersRef = useRef<Map<number, HTMLDivElement>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)

  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
    return () => {
      mountedRef.current = false
    }
  }, [lang])

  // Auto-connect if room parameter exists
  useEffect(() => {
    if (roomParam && dict && permissionStatus === 'granted' && !autoConnect && status === 'idle' && !isConnecting) {
      setAutoConnect(true)
      setTimeout(() => {
        testConnection()
      }, 500)
    }
  }, [roomParam, dict, permissionStatus, status, autoConnect, isConnecting])

  useEffect(() => {
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    setIsMobile(mobileCheck)
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(dict?.meet?.errors?.browserSupport || 'Your browser does not support camera/microphone access')
      setHasAudio(false)
      setHasVideo(false)
      return
    }
    
    if (dict) {
      checkDevicesAndPermissions()
    }
  }, [dict])

  const checkDevicesAndPermissions = async () => {
    try {
      if (navigator.permissions) {
        try {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName })
          const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          setPermissionStatus(cameraPermission.state as any)
        } catch (permErr) {
          console.warn('Could not query permissions:', permErr)
        }
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter(device => device.kind === 'audioinput')
      const videoInputs = devices.filter(device => device.kind === 'videoinput')
      
      setAudioDevices(audioInputs)
      setVideoDevices(videoInputs)
      
      if (audioInputs.length === 0) setHasAudio(false)
      if (videoInputs.length === 0) setHasVideo(false)
      
      // Définir les appareils par défaut
      if (videoInputs.length > 0 && !selectedVideoDevice) {
        setSelectedVideoDevice(videoInputs[0].deviceId)
      }
      if (audioInputs.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(audioInputs[0].deviceId)
      }
      
    } catch (err) {
      console.warn('Could not check devices:', err)
    }
  }

  const requestPermissions = async () => {
    setError('')
    try {
      const constraints: MediaStreamConstraints = {}
      
      if (hasAudio) {
        constraints.audio = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      }
      
      if (hasVideo) {
        constraints.video = isMobile ? {
          facingMode: facingMode,
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 }
        } : {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setPermissionStatus('granted')
      stream.getTracks().forEach(track => track.stop())
      await checkDevicesAndPermissions()
      
    } catch (err: any) {
      console.error('❌ Permission request failed:', err)
      setPermissionStatus('denied')
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError(dict?.meet?.errors?.permissionDenied || 'Camera/microphone access denied.')
      } else if (err.name === 'NotFoundError') {
        setError(dict?.meet?.errors?.noDevice || 'No camera or microphone found.')
      } else if (err.name === 'NotReadableError') {
        setError(dict?.meet?.errors?.deviceInUse || 'Camera/microphone is already in use.')
      } else {
        setError(`${dict?.meet?.errors?.permission || 'Permission error'}: ${err.message}`)
      }
    }
  }

  const getToken = async () => {
    try {
      const response = await fetch(`/api/agora/token?channel=${encodeURIComponent(channelName)}`)
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || dict?.meet?.errors?.token || 'Failed to generate token')
      }
      return data
    } catch (err: any) {
      throw new Error(`${dict?.meet?.errors?.token || 'Token error'}: ${err.message}`)
    }
  }

  const playLocalPreview = useCallback(async (videoTrack: any) => {
    const container = localVideoRef.current
    if (!container || !mountedRef.current) return
    
    // Nettoyer proprement l'ancien contenu
    while (container.firstChild && container.contains(container.firstChild)) {
      container.removeChild(container.firstChild)
    }
    
    try {
      await videoTrack.setEnabled(cameraEnabled)
      const mediaTrack = videoTrack.getMediaStreamTrack?.()
      if (!mediaTrack) {
        setError(dict?.meet?.errors?.preview || 'Unable to render local preview')
        return
      }
      
      const stream = new MediaStream([mediaTrack])
      const videoEl = document.createElement('video')
      videoEl.autoplay = true
      videoEl.muted = true
      videoEl.playsInline = true
      videoEl.style.width = '100%'
      videoEl.style.height = '100%'
      videoEl.style.objectFit = 'cover'
      videoEl.srcObject = stream
      container.appendChild(videoEl)
      await videoEl.play().catch(() => {})
    } catch (err) {
      console.warn('❌ Local preview error:', err)
    }
  }, [cameraEnabled, dict])

  const playRemoteVideo = useCallback(async (user: any) => {
    const container = remoteVideoContainerRef.current
    if (!container || !mountedRef.current) return
    
    let playerDiv = remotePlayersRef.current.get(user.uid)
    if (!playerDiv) {
      playerDiv = document.createElement('div')
      playerDiv.id = `remote-player-${user.uid}`
      playerDiv.className = 'absolute inset-0'
      container.appendChild(playerDiv)
      remotePlayersRef.current.set(user.uid, playerDiv)
    } else {
      // Nettoyer le contenu sans supprimer le div parent
      while (playerDiv.firstChild && playerDiv.contains(playerDiv.firstChild)) {
        playerDiv.removeChild(playerDiv.firstChild)
      }
    }
    
    try {
      await user.videoTrack.play(playerDiv)
    } catch (playErr: any) {
      const mediaTrack = user.videoTrack?.getMediaStreamTrack?.()
      if (mediaTrack) {
        const stream = new MediaStream([mediaTrack])
        const videoEl = document.createElement('video')
        videoEl.autoplay = true
        videoEl.muted = false
        videoEl.playsInline = true
        videoEl.style.width = '100%'
        videoEl.style.height = '100%'
        videoEl.style.objectFit = 'cover'
        videoEl.srcObject = stream
        playerDiv.appendChild(videoEl)
        await videoEl.play().catch(() => {})
      }
    }
  }, [])

  const subscribeToUserMedia = useCallback(async (user: any) => {
    if (!clientRef.current || !mountedRef.current) return
    
    try {
      if (user.hasVideo) {
        await clientRef.current.subscribe(user, 'video')
        await playRemoteVideo(user)
        setRemoteUsers(prev => prev.includes(user.uid) ? prev : [...prev, user.uid])
      }
      if (user.hasAudio) {
        await clientRef.current.subscribe(user, 'audio')
        user.audioTrack.play()
      }
    } catch (err: any) {
      console.error('❌ Subscribe media error for user', user.uid, err)
    }
  }, [playRemoteVideo])

  useEffect(() => {
    if (status !== 'connected') return
    const videoTrack = localTracksRef.current.find((t: any) => t?.trackMediaType === 'video')
    if (videoTrack) {
      playLocalPreview(videoTrack)
    }
  }, [status, cameraEnabled, playLocalPreview])
  
  const setupRemoteUserHandlers = useCallback(() => {
    if (!clientRef.current) return
    
    clientRef.current.on('user-published', async (user: any, mediaType: string) => {
      console.log('👤 Remote user published:', user.uid, mediaType)
      if (!mountedRef.current) return
      try {
        await clientRef.current.subscribe(user, mediaType)
        
        if (mediaType === 'video') {
          await playRemoteVideo(user)
          setRemoteUsers(prev => prev.includes(user.uid) ? prev : [...prev, user.uid])
        }
        if (mediaType === 'audio') {
          user.audioTrack.play()
        }
      } catch (err: any) {
        console.error('❌ Subscribe error:', err)
      }
    })

    clientRef.current.on('user-unpublished', (user: any) => {
      console.log('👤 User unpublished:', user.uid)
      const playerDiv = remotePlayersRef.current.get(user.uid)
      if (playerDiv && remoteVideoContainerRef.current && remoteVideoContainerRef.current.contains(playerDiv)) {
        remoteVideoContainerRef.current.removeChild(playerDiv)
      }
      remotePlayersRef.current.delete(user.uid)
      setRemoteUsers(prev => prev.filter(id => id !== user.uid))
    })
    
    clientRef.current.on('user-joined', async (user: any) => {
      console.log('👋 User joined:', user.uid)
      await subscribeToUserMedia(user)
    })
    
    clientRef.current.on('user-left', (user: any) => {
      console.log('👋 User left:', user.uid)
      const playerDiv = remotePlayersRef.current.get(user.uid)
      if (playerDiv && remoteVideoContainerRef.current && remoteVideoContainerRef.current.contains(playerDiv)) {
        remoteVideoContainerRef.current.removeChild(playerDiv)
      }
      remotePlayersRef.current.delete(user.uid)
      setRemoteUsers(prev => prev.filter(id => id !== user.uid))
    })

    clientRef.current.on('connection-state-change', (curState: string, prevState: string) => {
      console.log('🔌 Connection:', prevState, '→', curState)
    })
  }, [playRemoteVideo, subscribeToUserMedia])

  const testConnection = async () => {
    if (status !== 'idle' || isConnecting) return
    
    setIsConnecting(true)
    setStatus('connecting')
    setError('')
    setConnectionInfo(null)
    setRemoteUsers([])
    
    try {
      const tokenData = await getToken()
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
      
      AgoraRTC.setLogLevel(0)
      
      clientRef.current = AgoraRTC.createClient({ 
        mode: 'rtc', 
        codec: 'vp8' 
      })
      
      await clientRef.current.join(
        tokenData.appId,
        tokenData.channelName,
        tokenData.token,
        tokenData.uid
      )
      
      const tracks = []
      let microphoneTrack = null
      let cameraTrack = null
      
      if (hasAudio && micEnabled) {
        try {
          microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack({
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            encoderConfig: {
              sampleRate: 48000,
              stereo: false,
              bitrate: 48
            }
          })
          tracks.push(microphoneTrack)
        } catch (audioErr: any) {
          console.warn('❌ Microphone error:', audioErr.message)
          setHasAudio(false)
        }
      }
      
      if (hasVideo && cameraEnabled) {
        try {
          const videoConfig: any = isMobile ? {
            facingMode: facingMode,
            encoderConfig: {
              width: { ideal: 640, max: 1280 },
              height: { ideal: 480, max: 720 },
              frameRate: { ideal: 30, max: 30 }
            }
          } : {
            encoderConfig: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 }
            }
          }
          
          cameraTrack = await AgoraRTC.createCameraVideoTrack(videoConfig)
          tracks.push(cameraTrack)
          
        } catch (videoErr: any) {
          console.warn('❌ Camera error:', videoErr.message)
          if (videoErr.code !== 'PERMISSION_DENIED') {
            try {
              cameraTrack = await AgoraRTC.createCameraVideoTrack({
                facingMode: isMobile ? facingMode : undefined
              })
              tracks.push(cameraTrack)
            } catch (fallbackErr: any) {
              console.error('❌ Fallback camera failed:', fallbackErr.message)
              setHasVideo(false)
            }
          } else {
            setHasVideo(false)
          }
        }
      }
      
      if (tracks.length > 0) {
        try {
          await clientRef.current.publish(tracks)
        } catch (publishErr: any) {
          console.error('❌ Publish failed:', publishErr)
        }
      }
      
      localTracksRef.current = tracks
      
      if (mountedRef.current) {
        setStatus('connected')
        setConnectionInfo({
          channelName: tokenData.channelName,
          uid: tokenData.uid,
          appId: tokenData.appId
        })
      }
      
      if (cameraTrack) {
        await playLocalPreview(cameraTrack)
      }
      
      setupRemoteUserHandlers()
      
      if (clientRef.current?.remoteUsers?.length) {
        for (const user of clientRef.current.remoteUsers) {
          await subscribeToUserMedia(user)
        }
      }
      
    } catch (error: any) {
      console.error('❌ Connection error:', error)
      
      if (mountedRef.current) {
        if (error.message.includes('AGORA_APP_ID')) {
          setError(`${dict?.meet?.errors?.config || 'Config Error'}: ${error.message}`)
        } else if (error.message.includes('token')) {
          setError(`${dict?.meet?.errors?.token || 'Token Error'}: ${error.message}`)
        } else if (error.code === 'PERMISSION_DENIED') {
          setError(dict?.meet?.errors?.permissionDenied || 'Permission denied')
        } else {
          setError(`${dict?.meet?.errors?.connection || 'Error'}: ${error.message || 'Unknown error'}`)
        }
        
        setStatus('idle')
      }
    } finally {
      setIsConnecting(false)
    }
  }
  
  const cleanup = async () => {
    if (!mountedRef.current) return
    
    try {
      // Arrêter toutes les pistes locales
      localTracksRef.current.forEach(track => {
        if (track) {
          track.stop()
          track.close()
        }
      })
      
      if (clientRef.current) {
        await clientRef.current.leave()
        clientRef.current = null
      }
      
      // Nettoyer le conteneur local
      if (localVideoRef.current) {
        const container = localVideoRef.current
        while (container.firstChild && container.contains(container.firstChild)) {
          container.removeChild(container.firstChild)
        }
      }
      
      // Nettoyer le conteneur distant
      if (remoteVideoContainerRef.current) {
        const container = remoteVideoContainerRef.current
        while (container.firstChild && container.contains(container.firstChild)) {
          container.removeChild(container.firstChild)
        }
      }
      
      // Nettoyer la Map des lecteurs distants
      remotePlayersRef.current.clear()
      localTracksRef.current = []
      setRemoteUsers([])
      setConnectionInfo(null)
      setStatus('idle')
      setShowSettings(false)
      
    } catch (err) {
      console.error('Cleanup error:', err)
    }
  }

  const toggleCamera = async () => {
    const track = localTracksRef.current.find(t => t?.trackMediaType === 'video')
    if (track) {
      const newState = !track.enabled
      await track.setEnabled(newState)
      setCameraEnabled(newState)
    }
  }

  const toggleMic = async () => {
    const track = localTracksRef.current.find(t => t?.trackMediaType === 'audio')
    if (track) {
      const newState = !track.enabled
      await track.setEnabled(newState)
      setMicEnabled(newState)
    }
  }

  const switchCamera = async () => {
    if (!isMobile || isSwitchingCamera || status !== 'connected') {
      console.log('Cannot switch camera:', { isMobile, isSwitchingCamera, status })
      return
    }
    
    setIsSwitchingCamera(true)
    const newFacing = facingMode === 'user' ? 'environment' : 'user'
    
    try {
      const currentVideoTrack = localTracksRef.current.find(t => t?.trackMediaType === 'video')
      
      if (currentVideoTrack && clientRef.current) {
        // Sauvegarder l'état de la caméra
        const wasEnabled = currentVideoTrack.enabled
        
        // Arrêter et fermer l'ancienne piste
        await currentVideoTrack.stop()
        await currentVideoTrack.close()
        
        // Créer une nouvelle piste avec le nouveau mode
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
        const newVideoTrack = await AgoraRTC.createCameraVideoTrack({
          facingMode: newFacing,
          encoderConfig: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            frameRate: { ideal: 30, max: 30 }
          }
        })
        
        // Restaurer l'état
        await newVideoTrack.setEnabled(wasEnabled)
        
        // Remplacer dans le tableau des pistes
        const index = localTracksRef.current.findIndex(t => t?.trackMediaType === 'video')
        if (index !== -1) {
          localTracksRef.current[index] = newVideoTrack
        }
        
        // Publier la nouvelle piste
        await clientRef.current.unpublish(currentVideoTrack)
        await clientRef.current.publish(newVideoTrack)
        
        // Mettre à jour l'affichage local
        await playLocalPreview(newVideoTrack)
        
        setFacingMode(newFacing)
        console.log('✅ Camera switched to:', newFacing)
      } else {
        // Si pas encore connecté, juste changer le mode
        setFacingMode(newFacing)
      }
    } catch (err) {
      console.error('Switch camera error:', err)
      setError(dict?.meet?.errors?.cameraSwitch || 'Failed to switch camera')
    } finally {
      setIsSwitchingCamera(false)
    }
  }

  const copyInviteLink = () => {
    const url = `${window.location.origin}/${lang}/meet?room=${channelName}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const createNewRoom = () => {
    const newRoom = `meet-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString().slice(-6)}`
    router.push(`/${lang}/meet?room=${newRoom}`)
  }

  if (!dict) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <Sparkles className="w-8 h-8 text-purple-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-purple-300 font-medium">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/${lang}`} className="p-2 hover:bg-white/10 rounded-lg transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                NRBMeet
              </h1>
              <p className="text-xs text-purple-300/70">Video calls reimagined</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status === 'idle' && (
              <button
                onClick={createNewRoom}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all flex items-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">New Room</span>
              </button>
            )}
            {status === 'connected' && (
              <>
                <button
                  onClick={copyInviteLink}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-all"
                  title="Copy invite link"
                >
                  {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-all"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-all"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 pt-20 max-w-7xl">
        {/* Room Info Banner */}
        {roomParam && status === 'idle' && (
          <div className="mb-6 p-4 bg-purple-500/20 border border-purple-500/30 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <LinkIcon className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-sm text-purple-300">
                  Joining room: <span className="font-mono text-purple-200">{roomParam}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 backdrop-blur-sm ${
              status === 'connected' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
              status === 'connecting' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
              'bg-slate-500/20 text-slate-300 border border-slate-500/30'
            }`}>
              {status === 'connected' ? <Wifi className="w-4 h-4" /> : 
               status === 'connecting' ? <Loader2 className="w-4 h-4 animate-spin" /> : 
               <WifiOff className="w-4 h-4" />}
              <span>
                {status === 'connected' ? 'Connected' :
                 status === 'connecting' ? 'Connecting...' :
                 'Disconnected'}
              </span>
            </div>
            {remoteUsers.length > 0 && (
              <div className="px-3 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-sm font-medium flex items-center gap-2 backdrop-blur-sm">
                <Users className="w-4 h-4" />
                <span>{remoteUsers.length} {remoteUsers.length > 1 ? 'participants' : 'participant'}</span>
              </div>
            )}
          </div>

          {permissionStatus !== 'granted' && status === 'idle' && (
            <button
              onClick={requestPermissions}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg shadow-purple-500/25"
            >
              <Shield className="w-4 h-4" />
              Grant Permissions
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm animate-in fade-in slide-in-from-top">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-300 mb-1">Error</h3>
                <p className="text-red-200/80 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Video Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Local Video */}
          <div className="relative group">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="aspect-video bg-slate-900 relative">
                <div ref={localVideoRef} className="absolute inset-0" />
                {status !== 'connected' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Camera className="w-16 h-16 text-slate-700 mb-3" />
                    <p className="text-slate-500 font-medium">Camera Preview</p>
                  </div>
                )}
                {status === 'connected' && !cameraEnabled && (
                  <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                    <CameraOff className="w-16 h-16 text-slate-700" />
                  </div>
                )}
              </div>
              <div className="absolute top-3 left-3">
                <span className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-xs text-white/80">
                  You
                </span>
              </div>
              <div className="absolute bottom-3 right-3 flex gap-2">
                {hasVideo && (
                  <button
                    onClick={toggleCamera}
                    className={`p-2 rounded-lg backdrop-blur-sm transition-all ${
                      cameraEnabled 
                        ? 'bg-white/20 hover:bg-white/30 text-white' 
                        : 'bg-red-500/80 hover:bg-red-600 text-white'
                    }`}
                  >
                    {cameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </button>
                )}
                {hasAudio && (
                  <button
                    onClick={toggleMic}
                    className={`p-2 rounded-lg backdrop-blur-sm transition-all ${
                      micEnabled 
                        ? 'bg-white/20 hover:bg-white/30 text-white' 
                        : 'bg-red-500/80 hover:bg-red-600 text-white'
                    }`}
                  >
                    {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>
                )}
                {isMobile && hasVideo && (
                  <button
                    onClick={switchCamera}
                    disabled={isSwitchingCamera}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSwitchingCamera ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Remote Video */}
          <div className="relative group">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="aspect-video bg-slate-900 relative">
                <div ref={remoteVideoContainerRef} className="absolute inset-0">
                  {remoteUsers.length === 0 && status === 'connected' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Users className="w-16 h-16 text-slate-700 mb-3" />
                      <p className="text-slate-500 font-medium text-center px-4">
                        Waiting for others to join...
                      </p>
                    </div>
                  )}
                  {status !== 'connected' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Sparkles className="w-16 h-16 text-purple-700 mb-3" />
                      <p className="text-slate-500 font-medium text-center px-4">
                        Click Start Call to begin
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute top-3 left-3">
                <span className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-xs text-white/80">
                  {remoteUsers.length > 0 
                    ? `${remoteUsers.length} ${remoteUsers.length > 1 ? 'participants' : 'participant'}`
                    : 'Waiting'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Room Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`}></div>
                <span className="text-sm text-white/60 uppercase tracking-wider">ROOM</span>
              </div>
              <div className="flex items-center gap-3">
                <code className="px-4 py-2 bg-black/30 rounded-lg text-purple-300 font-mono text-sm break-all">
                  {channelName}
                </code>
                <button
                  onClick={copyInviteLink}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all flex-shrink-0"
                  title="Copy invite link"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Main Actions */}
            <div className="flex items-center gap-3">
              {status === 'connected' ? (
                <button
                  onClick={cleanup}
                  className="px-8 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-500/25"
                >
                  <PhoneOff className="w-5 h-5" />
                  End Call
                </button>
              ) : (
                <button
                  onClick={testConnection}
                  disabled={status === 'connecting' || permissionStatus !== 'granted' || isConnecting}
                  className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${
                    status === 'connecting' || permissionStatus !== 'granted' || isConnecting
                      ? 'bg-slate-600 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-green-500/25'
                  }`}
                >
                  {status === 'connecting' || isConnecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Phone className="w-5 h-5" />
                      Start Call
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Device Info */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                hasVideo ? 'bg-white/5' : 'bg-red-500/10'
              }`}>
                {hasVideo ? <Video className="w-4 h-4 text-green-400" /> : <VideoOff className="w-4 h-4 text-red-400" />}
                <span className="text-sm hidden sm:inline">
                  {hasVideo ? 'Camera OK' : 'No Camera'}
                </span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                hasAudio ? 'bg-white/5' : 'bg-red-500/10'
              }`}>
                {hasAudio ? <Mic className="w-4 h-4 text-green-400" /> : <MicOff className="w-4 h-4 text-red-400" />}
                <span className="text-sm hidden sm:inline">
                  {hasAudio ? 'Mic OK' : 'No Mic'}
                </span>
              </div>
            </div>
          </div>

          {/* Channel Input (when idle) */}
          {status === 'idle' && !roomParam && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <label className="block text-sm font-medium text-white/60 mb-2">
                Channel Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-white/30"
                  placeholder="Enter channel name"
                />
                <button
                  onClick={() => setChannelName(`meet-${Math.floor(Math.random() * 10000)}`)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                  title="Random"
                >
                  🎲
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings Panel - MODAL style */}
        {showSettings && status === 'connected' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-white/20">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  Settings
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {videoDevices.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Camera</label>
                    <select
                      value={selectedVideoDevice}
                      onChange={(e) => setSelectedVideoDevice(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    >
                      {videoDevices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {audioDevices.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Microphone</label>
                    <select
                      value={selectedAudioDevice}
                      onChange={(e) => setSelectedAudioDevice(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    >
                      {audioDevices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Mic ${audioDevices.indexOf(device) + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="pt-4">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg font-medium transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}