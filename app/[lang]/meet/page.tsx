// app/[lang]/meet/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
  ChevronDown,
  Maximize2,
  Minimize2
} from 'lucide-react'

export default function AgoraVideoMeetPage() {
  const params = useParams()
  const lang = params.lang as Locale
  
  const [dict, setDict] = useState<any>(null)
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle')
  const [error, setError] = useState('')
  const [channelName, setChannelName] = useState(`meet-${Math.floor(Math.random() * 10000)}`)
  const [connectionInfo, setConnectionInfo] = useState<any>(null)
  const [remoteUsers, setRemoteUsers] = useState<number[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [hasAudio, setHasAudio] = useState(true)
  const [hasVideo, setHasVideo] = useState(true)
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown')
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(true)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('')
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('')
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  
  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<any>(null)
  const localTracksRef = useRef<any[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || ''

  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

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
          
          console.log('Camera permission:', cameraPermission.state)
          console.log('Microphone permission:', micPermission.state)
          
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
      
      console.log('Audio devices found:', audioInputs.length)
      console.log('Video devices found:', videoInputs.length)
      
      if (audioInputs.length === 0) {
        console.warn('No audio input devices found')
        setHasAudio(false)
      }
      
      if (videoInputs.length === 0) {
        console.warn('No video input devices found')
        setHasVideo(false)
      }
      
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
      console.log('Requesting media permissions...')
      
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
        setError(dict?.meet?.errors?.permissionDenied || 'Camera/microphone access denied. Please allow access in your browser settings.')
      } else if (err.name === 'NotFoundError') {
        setError(dict?.meet?.errors?.noDevice || 'No camera or microphone found on your device.')
      } else if (err.name === 'NotReadableError') {
        setError(dict?.meet?.errors?.deviceInUse || 'Camera/microphone is already in use by another application.')
      } else {
        setError(`${dict?.meet?.errors?.permission || 'Permission error'}: ${err.message}`)
      }
    }
  }

  const getToken = async () => {
    try {
      const response = await fetch(`/api/agora/token?channel=${channelName}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || dict?.meet?.errors?.token || 'Failed to generate token')
      }
      
      return data
    } catch (err: any) {
      throw new Error(`${dict?.meet?.errors?.token || 'Token error'}: ${err.message}`)
    }
  }

  const playLocalPreview = async (videoTrack: any) => {
    try {
      const container = localVideoRef.current
      if (!container) return
      
      container.innerHTML = ''
      await new Promise(requestAnimationFrame)
      await videoTrack.setEnabled(true)
      
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
  }

  const playRemoteVideo = async (user: any) => {
    const container = remoteVideoRef.current
    if (!container) return
    
    let playerDiv = document.getElementById(`remote-player-${user.uid}`)
    if (!playerDiv) {
      playerDiv = document.createElement('div')
      playerDiv.id = `remote-player-${user.uid}`
      playerDiv.className = 'absolute inset-0'
      container.appendChild(playerDiv)
    } else {
      playerDiv.innerHTML = ''
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
  }

  const subscribeToUserMedia = async (user: any) => {
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
  }

  useEffect(() => {
    if (status !== 'connected') return
    const videoTrack = localTracksRef.current.find((t: any) => t?.trackMediaType === 'video')
    if (videoTrack) {
      playLocalPreview(videoTrack)
    }
  }, [status, cameraEnabled, facingMode])
  
  const testConnection = async () => {
    setStatus('connecting')
    setError('')
    setConnectionInfo(null)
    setRemoteUsers([])
    setIsPublished(false)
    
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
          setIsPublished(true)
        } catch (publishErr: any) {
          console.error('❌ Publish failed:', publishErr)
        }
      }
      
      localTracksRef.current = tracks
      
      setStatus('connected')
      setConnectionInfo({
        channelName: tokenData.channelName,
        uid: tokenData.uid,
        appId: tokenData.appId
      })
      
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
  }

  const setupRemoteUserHandlers = () => {
    clientRef.current.on('user-published', async (user: any, mediaType: string) => {
      console.log('👤 Remote user published:', user.uid, mediaType)
      
      try {
        await clientRef.current.subscribe(user, mediaType)
        
        if (mediaType === 'video' && remoteVideoRef.current) {
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
      const playerDiv = document.getElementById(`remote-player-${user.uid}`)
      if (playerDiv) playerDiv.remove()
      setRemoteUsers(prev => prev.filter(id => id !== user.uid))
    })
    
    clientRef.current.on('user-joined', async (user: any) => {
      await subscribeToUserMedia(user)
    })
    
    clientRef.current.on('user-left', (user: any) => {
      const playerDiv = document.getElementById(`remote-player-${user.uid}`)
      if (playerDiv) playerDiv.remove()
      setRemoteUsers(prev => prev.filter(id => id !== user.uid))
    })

    clientRef.current.on('connection-state-change', (curState: string, prevState: string) => {
      console.log('🔌 Connection:', prevState, '→', curState)
    })
  }
  
  const cleanup = async () => {
    try {
      localTracksRef.current.forEach(track => {
        if (track) {
          track.stop()
          track.close()
        }
      })
      
      if (clientRef.current) {
        if (localTracksRef.current.length > 0) {
          try {
            await clientRef.current.unpublish(localTracksRef.current)
          } catch (e) {
            console.warn('Unpublish error:', e)
          }
        }
        await clientRef.current.leave()
      }
      
      if (localVideoRef.current) localVideoRef.current.innerHTML = ''
      if (remoteVideoRef.current) remoteVideoRef.current.innerHTML = ''
      
      localTracksRef.current = []
      setRemoteUsers([])
      setIsPublished(false)
      
    } catch (err) {
      console.error('Cleanup error:', err)
    } finally {
      setStatus('idle')
      setConnectionInfo(null)
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
    if (!isMobile) return
    
    const newFacing = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newFacing)
    
    if (status === 'connected') {
      const videoTrack = localTracksRef.current.find(t => t?.trackMediaType === 'video')
      if (videoTrack) {
        try {
          await videoTrack.stop()
          await videoTrack.close()
          
          const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
          const newTrack = await AgoraRTC.createCameraVideoTrack({
            facingMode: newFacing,
            encoderConfig: {
              width: { ideal: 640, max: 1280 },
              height: { ideal: 480, max: 720 },
              frameRate: { ideal: 30, max: 30 }
            }
          })
          
          const trackIndex = localTracksRef.current.indexOf(videoTrack)
          localTracksRef.current[trackIndex] = newTrack
          
          await clientRef.current.unpublish(videoTrack)
          await clientRef.current.publish(newTrack)
          
          if (localVideoRef.current) {
            await playLocalPreview(newTrack)
          }
          
        } catch (err) {
          console.error('Switch camera error:', err)
        }
      }
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

  if (!dict) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <Sparkles className="w-8 h-8 text-purple-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-purple-300 font-medium">{dict?.common?.loading || 'Chargement...'}</p>
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
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                NRBMeet
              </h1>
              <p className="text-xs text-purple-300/70">{dict?.meet?.tagline || 'Video calls reimagined'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status === 'connected' && (
              <>
                <button
                  onClick={copyInviteLink}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-all"
                  title={dict?.meet?.copyInvite || 'Copy invite link'}
                >
                  {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-all"
                  title={dict?.common?.settings || 'Settings'}
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
                {status === 'connected' ? dict?.meet?.connected || 'Connected' :
                 status === 'connecting' ? dict?.meet?.connecting || 'Connecting' :
                 dict?.meet?.disconnected || 'Disconnected'}
              </span>
            </div>
            {remoteUsers.length > 0 && (
              <div className="px-3 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-sm font-medium flex items-center gap-2 backdrop-blur-sm">
                <Users className="w-4 h-4" />
                <span>{remoteUsers.length} {remoteUsers.length > 1 ? dict?.meet?.participants : dict?.meet?.participant}</span>
              </div>
            )}
          </div>

          {permissionStatus !== 'granted' && status === 'idle' && (
            <button
              onClick={requestPermissions}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg shadow-purple-500/25"
            >
              <Shield className="w-4 h-4" />
              {dict?.meet?.grantPermissions || 'Grant Permissions'}
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm animate-in fade-in slide-in-from-top">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-300 mb-1">{dict?.common?.error || 'Error'}</h3>
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
                    <p className="text-slate-500 font-medium">{dict?.meet?.cameraPreview || 'Camera Preview'}</p>
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
                  {dict?.meet?.you || 'You'}
                </span>
              </div>
              <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Remote Video */}
          <div className="relative group">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="aspect-video bg-slate-900 relative">
                <div ref={remoteVideoRef} className="absolute inset-0">
                  {remoteUsers.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Users className="w-16 h-16 text-slate-700 mb-3" />
                      <p className="text-slate-500 font-medium text-center px-4">
                        {dict?.meet?.waitingForOthers || 'Waiting for others to join...'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute top-3 left-3">
                <span className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-xs text-white/80">
                  {remoteUsers.length > 0 
                    ? `${remoteUsers.length} ${remoteUsers.length > 1 ? dict?.meet?.participants : dict?.meet?.participant}`
                    : dict?.meet?.waiting || 'Waiting'}
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
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-sm text-white/60 uppercase tracking-wider">
                  {dict?.meet?.room || 'ROOM'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <code className="px-4 py-2 bg-black/30 rounded-lg text-purple-300 font-mono text-sm">
                  {channelName}
                </code>
                <button
                  onClick={copyInviteLink}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                  title={dict?.meet?.copyInvite || 'Copy invite link'}
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
                  {dict?.meet?.endCall || 'End Call'}
                </button>
              ) : (
                <button
                  onClick={testConnection}
                  disabled={status === 'connecting' || permissionStatus !== 'granted'}
                  className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${
                    status === 'connecting' || permissionStatus !== 'granted'
                      ? 'bg-slate-600 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-green-500/25'
                  }`}
                >
                  {status === 'connecting' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {dict?.meet?.connecting || 'Connecting...'}
                    </>
                  ) : (
                    <>
                      <Phone className="w-5 h-5" />
                      {dict?.meet?.startCall || 'Start Call'}
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
                  {hasVideo ? dict?.meet?.cameraAvailable || 'Camera OK' : dict?.meet?.noCamera || 'No Camera'}
                </span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                hasAudio ? 'bg-white/5' : 'bg-red-500/10'
              }`}>
                {hasAudio ? <Mic className="w-4 h-4 text-green-400" /> : <MicOff className="w-4 h-4 text-red-400" />}
                <span className="text-sm hidden sm:inline">
                  {hasAudio ? dict?.meet?.micAvailable || 'Mic OK' : dict?.meet?.noMic || 'No Mic'}
                </span>
              </div>
            </div>
          </div>

          {/* Channel Input (when idle) */}
          {status === 'idle' && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <label className="block text-sm font-medium text-white/60 mb-2">
                {dict?.meet?.channelName || 'Channel Name'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-white/30"
                  placeholder={dict?.meet?.enterChannel || 'Enter channel name'}
                />
                <button
                  onClick={() => setChannelName(`meet-${Math.floor(Math.random() * 10000)}`)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                  title={dict?.meet?.random || 'Random'}
                >
                  🎲
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && status === 'connected' && (
          <div className="mt-4 p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 animate-in slide-in-from-bottom">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {dict?.common?.settings || 'Settings'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videoDevices.length > 0 && (
                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    {dict?.meet?.camera || 'Camera'}
                  </label>
                  <select
                    value={selectedVideoDevice}
                    onChange={(e) => setSelectedVideoDevice(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  >
                    {videoDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `${dict?.meet?.camera || 'Camera'} ${videoDevices.indexOf(device) + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {audioDevices.length > 0 && (
                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    {dict?.meet?.microphone || 'Microphone'}
                  </label>
                  <select
                    value={selectedAudioDevice}
                    onChange={(e) => setSelectedAudioDevice(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  >
                    {audioDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `${dict?.meet?.microphone || 'Mic'} ${audioDevices.indexOf(device) + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}