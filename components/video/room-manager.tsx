"use client"

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { VideoCall } from './video-call'

interface RoomData {
  channelName: string
  token: string
  uid: number
  appId: string
}

export function RoomManager({ projectId, freelancerId, clientId }: {
  projectId: string
  freelancerId: string
  clientId: string
}) {
  const [roomData, setRoomData] = useState<RoomData | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const { toast } = useToast()

  // Create a new video room
  const createRoom = async () => {
    setIsCreating(true)
    
    try {
      const response = await fetch('/api/agora/create-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: freelancerId, // or clientId, depending on who's initiating
          projectId,
          freelancerId,
          clientId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create room')
      }

      setRoomData(data)
      
      toast({
        title: "Video Room Created",
        description: "Share the invitation link with the other participant",
      })

    } catch (error: any) {
      console.error('Error creating room:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create video room",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Join an existing room
  const joinRoom = async (channelName: string) => {
    setIsJoining(true)
    
    try {
      // In production, you might want to fetch a fresh token for the joiner
      const response = await fetch('/api/agora/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName,
          userId: clientId // or freelancerId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join room')
      }

      setRoomData({
        ...data,
        channelName
      })

    } catch (error: any) {
      console.error('Error joining room:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to join video room",
        variant: "destructive"
      })
    } finally {
      setIsJoining(false)
    }
  }

  // Generate shareable invitation link
  const generateInvitationLink = () => {
    if (!roomData) return ''
    
    // This would be your platform's meeting page
    return `${window.location.origin}/meeting/${roomData.channelName}?token=${roomData.token}`
  }

  return (
    <div className="space-y-6">
      {/* Room Creation Section */}
      {!roomData ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Schedule Video Call</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Project ID
                </label>
                <div className="px-3 py-2 bg-slate-50 rounded border text-slate-600">
                  {projectId}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Meeting Type
                </label>
                <div className="px-3 py-2 bg-slate-50 rounded border text-slate-600">
                  Client-Freelancer
                </div>
              </div>
            </div>

            <button
              onClick={createRoom}
              disabled={isCreating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Video Room...
                </span>
              ) : (
                'Create Video Meeting Room'
              )}
            </button>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Or join existing room:</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter channel name"
                  className="flex-1 px-3 py-2 border rounded"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      joinRoom(e.currentTarget.value)
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input')?.value
                    if (input) joinRoom(input)
                  }}
                  disabled={isJoining}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Video Call Section */
        <div className="space-y-4">
          {/* Invitation Section */}
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Room Created Successfully!</h4>
                <p className="text-sm text-slate-600">
                  Channel: <code className="bg-slate-100 px-2 py-1 rounded">{roomData.channelName}</code>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateInvitationLink())
                    toast({
                      title: "Copied!",
                      description: "Invitation link copied to clipboard"
                    })
                  }}
                  className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium"
                >
                  Copy Invite Link
                </button>
                <button
                  onClick={() => setRoomData(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Video Call Component */}
          <VideoCall
            channelName={roomData.channelName}
            token={roomData.token}
            uid={roomData.uid}
            appId={roomData.appId}
            onLeave={() => setRoomData(null)}
          />
        </div>
      )}
    </div>
  )
}