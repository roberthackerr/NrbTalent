"use client"

import { useState, useRef, useEffect } from 'react'

export default function AgoraVideoTestPage() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle')
  const [error, setError] = useState('')
  const [channelName, setChannelName] = useState(`test-room-${Math.floor(Math.random() * 1000)}`)
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
  
  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<any>(null)
  const localTracksRef = useRef<any[]>([])
  
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || ''

  useEffect(() => {
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    setIsMobile(mobileCheck)
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Your browser does not support camera/microphone access')
      setHasAudio(false)
      setHasVideo(false)
      return
    }
    
    checkDevicesAndPermissions()
  }, [])

  const checkDevicesAndPermissions = async () => {
    try {
      // Check current permission state
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
      
      // Enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioDevices = devices.filter(device => device.kind === 'audioinput')
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      console.log('Audio devices found:', audioDevices.length)
      console.log('Video devices found:', videoDevices.length)
      
      if (audioDevices.length === 0) {
        console.warn('No audio input devices found')
        setHasAudio(false)
      }
      
      if (videoDevices.length === 0) {
        console.warn('No video input devices found')
        setHasVideo(false)
      }
      
      // Log device details for debugging
      videoDevices.forEach((device, idx) => {
        console.log(`Video device ${idx}:`, {
          label: device.label,
          deviceId: device.deviceId,
          groupId: device.groupId
        })
      })
      
    } catch (err) {
      console.warn('Could not check devices:', err)
    }
  }

  const requestPermissions = async () => {
    setError('')
    try {
      console.log('Requesting media permissions...')
      
      // Request both audio and video permissions upfront
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
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 30, max: 30 }
        } : {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      }
      
      console.log('Requesting with constraints:', constraints)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      console.log('✅ Permissions granted!')
      setPermissionStatus('granted')
      
      // Stop the test stream
      stream.getTracks().forEach(track => {
        console.log('Stopping test track:', track.kind, track.label)
        track.stop()
      })
      
      // Re-enumerate devices to get labels
      await checkDevicesAndPermissions()
      
      alert('✅ Permissions granted! You can now connect to the video call.')
      
    } catch (err: any) {
      console.error('❌ Permission request failed:', err)
      setPermissionStatus('denied')
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera/microphone access denied. Please allow access in your browser settings.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone found on your device.')
      } else if (err.name === 'NotReadableError') {
        setError('Camera/microphone is already in use by another application.')
      } else {
        setError(`Permission error: ${err.message}`)
      }
    }
  }

  const getToken = async () => {
    try {
      const response = await fetch(`/api/agora/token?channel=${channelName}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate token')
      }
      
      return data
    } catch (err: any) {
      throw new Error(`Token error: ${err.message}`)
    }
  }

  const playLocalPreview = async (videoTrack: any) => {
    try {
      const container = localVideoRef.current
      if (!container) {
        console.warn('Local container not ready for preview')
        return
      }
      
      container.innerHTML = ''
      await new Promise(requestAnimationFrame)
      await videoTrack.setEnabled(true)
      
      // Direct HTMLVideo rendering to avoid Agora DOM issues
      const mediaTrack = videoTrack.getMediaStreamTrack?.()
      if (!mediaTrack) {
        console.warn('No media track available for preview')
        setError('Unable to render local preview. Please retry or refresh.')
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
      await videoEl.play().catch((e) => console.warn('HTML video play warning:', e))
      console.log('✅ Local video playing via direct element')
    } catch (err) {
      console.warn('❌ Local preview error:', err)
      setError('Unable to render local preview. Please retry or refresh.')
    }
  }

  const playRemoteVideo = async (user: any) => {
    const container = remoteVideoRef.current
    if (!container) {
      console.warn('Remote container not ready')
      return
    }
    
    let playerDiv = document.getElementById(`remote-player-${user.uid}`)
    if (!playerDiv) {
      playerDiv = document.createElement('div')
      playerDiv.id = `remote-player-${user.uid}`
      playerDiv.className = 'w-full h-full'
      playerDiv.style.objectFit = 'cover'
      container.appendChild(playerDiv)
    } else {
      playerDiv.innerHTML = ''
    }
    
    try {
      await user.videoTrack.play(playerDiv)
      console.log('🎬 Remote video playing:', user.uid)
    } catch (playErr: any) {
      console.warn('Remote video play failed, using fallback element:', playErr)
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
        await videoEl.play().catch((e) => console.warn('Remote HTML video play warning:', e))
      } else {
        console.warn('No media track available for remote user:', user.uid)
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
        console.log('🔊 Playing remote audio:', user.uid)
      }
    } catch (err: any) {
      console.error('❌ Subscribe media error for user', user.uid, err)
    }
  }

  // Re-assert local preview whenever we are connected and have a video track.
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
      
      // Enable debug logging
      AgoraRTC.setLogLevel(0)
      
      clientRef.current = AgoraRTC.createClient({ 
        mode: 'rtc', 
        codec: 'vp8' 
      })
      
      console.log('Joining channel:', {
        appId: tokenData.appId?.substring(0, 8) + '...',
        channelName: tokenData.channelName,
        uid: tokenData.uid
      })
      
      await clientRef.current.join(
        tokenData.appId,
        tokenData.channelName,
        tokenData.token,
        tokenData.uid
      )
      
      console.log('✅ Joined channel successfully')
      
      const tracks = []
      let microphoneTrack = null
      let cameraTrack = null
      
      // Create audio track
      if (hasAudio && micEnabled) {
        try {
          console.log('Creating microphone track...')
          const audioConfig = {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            encoderConfig: {
              sampleRate: 48000,
              stereo: false,
              bitrate: 48
            }
          }
          
          microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack(audioConfig)
          console.log('✅ Microphone track created:', microphoneTrack.getTrackId())
          tracks.push(microphoneTrack)
        } catch (audioErr: any) {
          console.warn('❌ Microphone error:', audioErr.message)
          setHasAudio(false)
        }
      }
      
      // Create video track with better mobile support
      if (hasVideo && cameraEnabled) {
        try {
          console.log('Creating camera track with facing mode:', facingMode)
          
          const videoConfig: any = isMobile ? {
            facingMode: facingMode,
            encoderConfig: {
              width: { ideal: 640, max: 1280 },
              height: { ideal: 480, max: 720 },
              frameRate: { ideal: 30, max: 30 },
              bitrateMin: 400,
              bitrateMax: 1000
            }
          } : {
            encoderConfig: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
              bitrateMin: 600,
              bitrateMax: 1500
            }
          }
          
          cameraTrack = await AgoraRTC.createCameraVideoTrack(videoConfig)
          console.log('✅ Camera track created:', cameraTrack.getTrackId())
          tracks.push(cameraTrack)
          
        } catch (videoErr: any) {
          console.warn('❌ Camera error:', videoErr.message, videoErr.code)
          
          // Fallback: try with minimal constraints
          if (videoErr.code !== 'PERMISSION_DENIED') {
            try {
              console.log('🔄 Trying fallback camera constraints...')
              cameraTrack = await AgoraRTC.createCameraVideoTrack({
                facingMode: isMobile ? facingMode : undefined
              })
              console.log('✅ Camera track created with fallback')
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
      
      console.log('Publishing', tracks.length, 'tracks...')
      
      if (tracks.length > 0) {
        try {
          await clientRef.current.publish(tracks)
          console.log('✅ Tracks published successfully')
          setIsPublished(true)
        } catch (publishErr: any) {
          console.error('❌ Publish failed:', publishErr)
        }
      }
      
      localTracksRef.current = tracks
      
      // Mark as connected before trying to render preview so the DOM exists
      setStatus('connected')
      setConnectionInfo({
        channelName: tokenData.channelName,
        uid: tokenData.uid,
        appId: tokenData.appId
      })
      
      // Play local video (wait a tick for DOM to render connected layout)
      if (cameraTrack) {
        await playLocalPreview(cameraTrack)
      }
      
      setupRemoteUserHandlers()
      
      // If any users were already in the channel, subscribe to their media
      if (clientRef.current?.remoteUsers?.length) {
        for (const user of clientRef.current.remoteUsers) {
          await subscribeToUserMedia(user)
        }
      }
      
    } catch (error: any) {
      console.error('❌ Connection error:', error)
      
      if (error.message.includes('AGORA_APP_ID')) {
        setError(`Config Error: ${error.message}`)
      } else if (error.message.includes('token')) {
        setError(`Token Error: ${error.message}`)
      } else if (error.code === 'PERMISSION_DENIED') {
        setError('Permission denied. Please allow camera/microphone access.')
      } else {
        setError(`Error: ${error.message || 'Unknown error'}`)
      }
      
      setStatus('idle')
    }
  }

  const setupRemoteUserHandlers = () => {
    clientRef.current.on('user-published', async (user: any, mediaType: string) => {
      console.log('👤 Remote user published:', user.uid, mediaType)
      
      try {
        await clientRef.current.subscribe(user, mediaType)
        console.log('✅ Subscribed to:', user.uid)
        
        if (mediaType === 'video' && remoteVideoRef.current) {
          await playRemoteVideo(user)
          setRemoteUsers(prev => prev.includes(user.uid) ? prev : [...prev, user.uid])
        }
        
        if (mediaType === 'audio') {
          user.audioTrack.play()
          console.log('🔊 Playing remote audio:', user.uid)
        }
      } catch (err: any) {
        console.error('❌ Subscribe error:', err)
      }
    })

    clientRef.current.on('user-unpublished', (user: any) => {
      console.log('👤 User unpublished:', user.uid)
      const playerDiv = document.getElementById(`remote-player-${user.uid}`)
      if (playerDiv) playerDiv.remove()
      setRemoteUsers(prev => prev.filter(id => id !== user.uid))
    })
    
    clientRef.current.on('user-joined', async (user: any) => {
      console.log('👋 User joined:', user.uid)
      await subscribeToUserMedia(user)
    })
    
    clientRef.current.on('user-left', (user: any) => {
      console.log('👋 User left:', user.uid)
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
      console.log('🧹 Cleaning up...')
      
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
      console.log('Camera:', newState ? 'ON' : 'OFF')
    }
  }

  const toggleMic = async () => {
    const track = localTracksRef.current.find(t => t?.trackMediaType === 'audio')
    if (track) {
      const newState = !track.enabled
      await track.setEnabled(newState)
      setMicEnabled(newState)
      console.log('Microphone:', newState ? 'ON' : 'OFF')
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
          
          console.log('✅ Camera switched to:', newFacing)
        } catch (err) {
          console.error('Switch camera error:', err)
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
         NRBMeet {isMobile && '📱'}
          </h1>
          <p className="text-slate-600">
            {isMobile ? 'Mobile mode active' : 'Desktop video testing'}
          </p>
          
          <div className="flex justify-center gap-3 mt-4 flex-wrap">
            <div className={`px-3 py-1 rounded-full text-sm ${
              hasAudio ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              🎤 {hasAudio ? 'Available' : 'Unavailable'}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${
              hasVideo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              📹 {hasVideo ? 'Available' : 'Unavailable'}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${
              permissionStatus === 'granted' ? 'bg-green-100 text-green-800' :
              permissionStatus === 'denied' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              🔐 {permissionStatus === 'granted' ? 'Granted' : 
                   permissionStatus === 'denied' ? 'Denied' : 'Not Requested'}
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <span className="text-red-500 text-xl mr-2">⚠️</span>
              <div>
                <div className="font-medium text-red-800 mb-1">Error</div>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {permissionStatus !== 'granted' && status === 'idle' && (
          <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Camera & Microphone Access Required
            </h3>
            <p className="text-blue-700 mb-4">
              Please grant permission to use your camera and microphone for video calls.
            </p>
            <button
              onClick={requestPermissions}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Grant Permissions
            </button>
          </div>
        )}
        
        {status === 'connected' && !isPublished && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-yellow-800 font-medium">
                ⚠️ Not broadcasting - others can't see you
              </span>
              <button
                onClick={async () => {
                  if (clientRef.current && localTracksRef.current.length > 0) {
                    await clientRef.current.publish(localTracksRef.current)
                    setIsPublished(true)
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Start Broadcasting
              </button>
            </div>
          </div>
        )}
        
        {status === 'connected' ? (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-slate-800 text-white p-3 flex items-center justify-between">
                <h3 className="font-semibold">📹 Your Camera</h3>
                <div className={`w-2 h-2 rounded-full ${cameraEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
              <div className="h-64 bg-slate-900 relative">
                <div id="local-player" ref={localVideoRef} className="w-full h-full" />
              </div>
              <div className="p-3 bg-slate-50 flex gap-2">
                {hasVideo && (
                  <>
                    <button onClick={toggleCamera} className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium">
                      {cameraEnabled ? '📹 On' : '📹 Off'}
                    </button>
                    {isMobile && (
                      <button onClick={switchCamera} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-medium">
                        🔄
                      </button>
                    )}
                  </>
                )}
                {hasAudio && (
                  <button onClick={toggleMic} className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium">
                    {micEnabled ? '🎤 On' : '🎤 Off'}
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-slate-800 text-white p-3">
                <h3 className="font-semibold">👥 Remote ({remoteUsers.length})</h3>
              </div>
              <div ref={remoteVideoRef} className="h-64 bg-slate-900 flex items-center justify-center">
                {remoteUsers.length === 0 && (
                  <div className="text-center text-slate-400">
                    <div className="text-4xl mb-2">⏳</div>
                    <p>Waiting for others...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📹</div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Ready to Connect</h3>
            <p className="text-slate-600">Configure your settings below and click Connect</p>
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Channel Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Enter channel name"
                  disabled={status === 'connected'}
                />
                <button
                  onClick={() => setChannelName(`room-${Math.floor(Math.random() * 10000)}`)}
                  disabled={status === 'connected'}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50"
                >
                  🎲 Random
                </button>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center mb-2">
                    <span className="font-medium text-slate-700 mr-3">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      status === 'idle' ? 'bg-slate-200 text-slate-800' :
                      status === 'connecting' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-green-200 text-green-800'
                    }`}>
                      {status === 'idle' ? '⚪ Ready' : 
                       status === 'connecting' ? '🟡 Connecting' : '🟢 Connected'}
                    </span>
                  </div>
                  {connectionInfo && (
                    <div className="text-sm text-slate-600">
                      <div>Channel: <code className="bg-slate-200 px-2 py-1 rounded">{connectionInfo.channelName}</code></div>
                      <div className="mt-1">ID: <code className="bg-slate-200 px-2 py-1 rounded">{connectionInfo.uid}</code></div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {status === 'connected' ? (
                    <>
                      <button
                        onClick={() => window.open(window.location.href, '_blank')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      >
                        🪟 New Tab
                      </button>
                      <button
                        onClick={cleanup}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                      >
                        ❌ Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={testConnection}
                      disabled={status === 'connecting' || permissionStatus !== 'granted'}
                      className={`px-6 py-3 rounded-lg font-medium ${
                        status === 'connecting' || permissionStatus !== 'granted'
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {status === 'connecting' ? '⏳ Connecting...' : '🚀 Connect'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}