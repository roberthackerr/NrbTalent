// app/messages/new/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, User, AlertCircle } from 'lucide-react'

export default function NewMessagePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error' | 'creating'>('loading')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const createConversation = async () => {
      try {
        const userId = searchParams.get('user')
        
        if (!userId) {
          setError('User ID is required')
          setStatus('error')
          return
        }

        // Use the existing conversations API
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            participantIds: [userId]
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create conversation')
        }

        // Redirect to the conversation page
        router.push(`/messages/${data.conversation._id}`)
        
      } catch (err) {
        console.error('Error creating conversation:', err)
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setStatus('error')
      }
    }

    createConversation()
  }, [searchParams, router])

  if (status === 'loading' || status === 'creating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-lg text-gray-600">
            {status === 'loading' ? 'Starting conversation...' : 'Creating chat...'}
          </p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <AlertCircle className="h-12 w-12 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Start Conversation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => router.push('/messages')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Messages
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}