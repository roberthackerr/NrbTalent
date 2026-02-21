"use client"

import { useEffect, useRef, useState, useCallback } from 'react'

interface VideoCallProps {
  channelName: string
  token: string | null
  uid: number
  appId: string
  onLeave: () => void
}

export function VideoCall({ channelName, token, uid, appId, onLeave }: VideoCallProps) {
  const [joined, setJoined] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState<number[]>([])
  const [localTracks, setLocalTracks] = useState<any[]>([])
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  
  const clientRef = useRef<any>(null)
  const localVideoRef = useRef<HTMLDivElement>(null)
  const isJoiningRef = useRef(false)
  const hasJoinedRef = useRef(false) // Track if we've already joined

  // Create stable cleanup function
  const cleanupConnection = useCallback(async () => {
    if (isJoiningRef.current) {
      console.log('Cleanup: Still joining, waiting...')
      return
    }

    try {
      // Get current local tracks from state
      const currentTracks = localTracks
      
      // Stop and close local tracks
      currentTracks.forEach(track => {
        if (track) {
          track.stop()
          track.close()
        }
      })
      
      // Leave the channel if connected
      if (clientRef.current && clientRef.current.connectionState === 'CONNECTED') {
        await clientRef.current.leave()
        console.log('Successfully left channel')
      }
      
      // Clear all remote video elements
      const remoteContainer = document.getElementById('remote-video-container')
      if (remoteContainer) {
        remoteContainer.innerHTML = ''
      }
      
    } catch (error) {
      console.error('Error during cleanup:', error)
    } finally {
      setLocalTracks([])
      setJoined(false)
      setRemoteUsers([])
      setConnectionState('disconnected')
      isJoiningRef.current = false
      hasJoinedRef.current = false
    }
  }, []) // Empty dependency array - this function doesn't depend on state

  // Create stable join function
  const joinChannel = useCallback(async () => {
    // Prevent multiple join attempts
    if (isJoiningRef.current || hasJoinedRef.current) {
      console.log('Already joining or joined, skipping...')
      return
    }

    if (!clientRef.current) {
      console.error('Agora client not initialized')
      return
    }
    
    setIsLoading(true)
    setConnectionState('connecting')
    isJoiningRef.current = true

    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
      
      // First check if we're already in a channel
      if (clientRef.current.connectionState === 'CONNECTED' || 
          clientRef.current.connectionState === 'CONNECTING') {
        console.log('Already in connection state:', clientRef.current.connectionState)
        await cleanupConnection()
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      console.log('Joining channel:', channelName, 'with UID:', uid)
      
      // Join the channel
      await clientRef.current.join(appId, channelName, token, uid)
      console.log('Channel joined successfully')

      // Create local tracks
      const microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack().catch(err => {
        console.warn('Could not create microphone track:', err)
        return null
      })
      
      const cameraTrack = await AgoraRTC.createCameraVideoTrack().catch(err => {
        console.warn('Could not create camera track:', err)
        return null
      })
      
      const tracks = [microphoneTrack, cameraTrack].filter(Boolean)
      
      // Publish local tracks
      if (tracks.length > 0) {
        await clientRef.current.publish(tracks)
      }
      
      // Play local video if camera track exists
      if (cameraTrack && localVideoRef.current) {
        cameraTrack.play(localVideoRef.current)
      }
      
      setLocalTracks(tracks)
      setJoined(true)
      setConnectionState('connected')
      hasJoinedRef.current = true
      
      // Subscribe to remote users
      const handleUserPublished = async (user: any, mediaType: string) => {
        console.log('User published:', user.uid, mediaType)
        
        await clientRef.current.subscribe(user, mediaType)
        
        if (mediaType === 'video') {
          const remoteContainer = document.getElementById('remote-video-container')
          if (remoteContainer) {
            const existingPlayer = document.getElementById(`player-${user.uid}`)
            if (!existingPlayer) {
              const playerContainer = document.createElement('div')
              playerContainer.id = `player-${user.uid}`
              playerContainer.dataset.uid = String(user.uid)
              playerContainer.style.width = '100%'
              playerContainer.style.height = '100%'
              remoteContainer.appendChild(playerContainer)
              user.videoTrack.play(playerContainer)
            }
          }
          
          setRemoteUsers(prev => {
            if (!prev.includes(user.uid)) {
              return [...prev, user.uid]
            }
            return prev
          })
        }
        
        if (mediaType === 'audio') {
          user.audioTrack.play()
        }
      }

      const handleUserUnpublished = (user: any) => {
        console.log('User unpublished:', user.uid)
        
        const playerContainer = document.getElementById(`player-${user.uid}`)
        if (playerContainer) {
          playerContainer.remove()
        }
        
        setRemoteUsers(prev => prev.filter(id => id !== user.uid))
      }

      // Store handlers as refs to avoid recreating them
      clientRef.current.on('user-published', handleUserPublished)
      clientRef.current.on('user-unpublished', handleUserUnpublished)

      // Store handlers for cleanup
      clientRef.current._handlers = {
        published: handleUserPublished,
        unpublished: handleUserUnpublished
      }

    } catch (error: any) {
      console.error('Failed to join channel:', error)
      
      if (error.code === 'INVALID_OPERATION' || error.message?.includes('already in')) {
        console.log('Connection already exists, cleaning up...')
        await cleanupConnection()
        return
      }
      
      alert(`Error joining video call: ${error.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
      isJoiningRef.current = false
    }
  }, [appId, channelName, token, uid, cleanupConnection]) // Add cleanupConnection to deps

  // Create stable leave function
  const leaveChannel = useCallback(async () => {
    await cleanupConnection()
    onLeave()
  }, [cleanupConnection, onLeave]) // Add onLeave to deps

  // Initialize Agora client
  useEffect(() => {
    const initAgora = async () => {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
      clientRef.current = AgoraRTC.createClient({ 
        mode: 'rtc', 
        codec: 'vp8' 
      })
      
      console.log('Agora client initialized')
      
      // Join after initialization
      setTimeout(() => {
        if (!hasJoinedRef.current) {
          joinChannel()
        }
      }, 1000)
    }
    
    initAgora()

    return () => {
      // Cleanup on unmount
      if (clientRef.current && clientRef.current._handlers) {
        clientRef.current.off('user-published', clientRef.current._handlers.published)
        clientRef.current.off('user-unpublished', clientRef.current._handlers.unpublished)
      }
      cleanupConnection()
    }
  }, []) // Empty array - runs once on mount

  // Control functions
  const toggleCamera = useCallback(async () => {
    if (localTracks[1]) {
      await localTracks[1].setEnabled(!localTracks[1].enabled)
    }
  }, [localTracks])

  const toggleMicrophone = useCallback(async () => {
    if (localTracks[0]) {
      await localTracks[0].setEnabled(!localTracks[0].enabled)
    }
  }, [localTracks])

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Call Header */}
      <div className="bg-slate-800 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Video Call - {channelName}</h3>
            <p className="text-slate-300 text-sm">
              {remoteUsers.length} participant{remoteUsers.length !== 1 ? 's' : ''} connected
              {connectionState === 'connecting' && ' • Connecting...'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionState === 'connected' ? 'bg-green-500' :
              connectionState === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm">
              {connectionState === 'connected' ? 'Live' : 
               connectionState === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Video Display Area */}
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Local Video */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 p-2 text-sm font-medium text-slate-700">
              You {localTracks[1]?.enabled === false && '(Camera Off)'}
            </div>
            <div className="h-64 bg-slate-900 relative">
              <div 
                ref={localVideoRef}
                className="w-full h-full"
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="text-white text-center">
                    <svg className="animate-spin h-8 w-8 mx-auto mb-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Joining call...
                  </div>
                </div>
              )}
              {!localTracks[1]?.enabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                  <div className="text-white text-center">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    <p className="text-sm">Camera is off</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Remote Videos */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 p-2 text-sm font-medium text-slate-700">
              Participants
            </div>
            <div 
              id="remote-video-container"
              className="h-64 bg-slate-900 flex items-center justify-center"
            >
              {remoteUsers.length === 0 && !isLoading && (
                <div className="text-center p-4">
                  <div className="text-slate-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Waiting for others to join...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {connectionState === 'connecting' && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <svg className="animate-spin h-5 w-5 text-yellow-600 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-yellow-800 font-medium">Connecting to video call...</span>
            </div>
          </div>
        )}

        {/* Call Controls */}
        <div className="flex justify-center gap-4 p-4 bg-slate-50 rounded-lg">
          <button
            onClick={toggleCamera}
            disabled={isLoading || !localTracks[1]}
            className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
              localTracks[1]?.enabled === false ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              <svg className={`w-5 h-5 ${localTracks[1]?.enabled === false ? 'text-red-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {localTracks[1]?.enabled === false ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                )}
              </svg>
            </div>
            <span className="text-xs text-slate-600">
              {localTracks[1]?.enabled === false ? 'Camera Off' : 'Camera'}
            </span>
          </button>

          <button
            onClick={toggleMicrophone}
            disabled={isLoading || !localTracks[0]}
            className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
              localTracks[0]?.enabled === false ? 'bg-red-100' : 'bg-green-100'
            }`}>
              <svg className={`w-5 h-5 ${localTracks[0]?.enabled === false ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {localTracks[0]?.enabled === false ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                )}
              </svg>
            </div>
            <span className="text-xs text-slate-600">
              {localTracks[0]?.enabled === false ? 'Mic Off' : 'Microphone'}
            </span>
          </button>

          <button
            onClick={leaveChannel}
            disabled={isLoading}
            className="flex flex-col items-center p-3 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-1">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <span className="text-xs text-slate-600">Leave</span>
          </button>
        </div>
      </div>
    </div>
  )
}