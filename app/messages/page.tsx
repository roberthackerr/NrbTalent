// app/messages/page.tsx - CLIENT COMPONENT VERSION
'use client'

import { useEffect } from 'react'
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from 'next/navigation'

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  useEffect(() => {
    const handleRedirect = async () => {
      // Wait for session to load
      if (status === 'loading') return
      
      if (!session) {
        router.push("/auth/signin")
        return
      }

      console.log('🔍 Starting messages redirector...')
      console.log('🔍 Order ID:', orderId)

      try {
        // CASE 1: If orderId is provided, find or create conversation for that order
        if (orderId) {
          console.log(`🔄 Processing orderId: ${orderId}`)

          // First, check if conversation already exists for this order
          const checkResponse = await fetch(`/api/conversations?orderId=${orderId}`)

          console.log('🔍 Check response status:', checkResponse.status)

          if (checkResponse.ok) {
            const data = await checkResponse.json()
            console.log('🔍 Check response data:', data)
            
            if (data.conversation) {
              // Conversation exists - redirect to it
              console.log(`✅ Found existing conversation: ${data.conversation._id}`)
              router.push(`/messages/${data.conversation._id}`)
              return
            }
          }

          // No existing conversation - create a new one
          console.log(`🔄 Creating new conversation for order: ${orderId}`)
          const createResponse = await fetch('/api/conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderId }),
          })

          console.log('🔍 Create response status:', createResponse.status)

          if (createResponse.ok) {
            const data = await createResponse.json()
            const conversationId = data.conversation._id
            console.log(`✅ Created new order conversation: ${conversationId}`)
            router.push(`/messages/${conversationId}`)
            return
          } else {
            const errorData = await createResponse.json().catch(() => ({}))
            console.error('❌ Failed to create conversation for order:', errorData)
            router.push("/messages/new")
            return
          }
        }

        // CASE 2: No orderId - get user's conversations and redirect to first one
        console.log('🔄 Fetching user conversations...')
        const conversationsResponse = await fetch('/api/conversations')

        console.log('🔍 Conversations response status:', conversationsResponse.status)

        if (conversationsResponse.ok) {
          const data = await conversationsResponse.json()
          const conversations = data.conversations || []
          console.log(`🔍 Found ${conversations.length} conversations`)

          if (conversations.length > 0) {
            // Redirect to the first conversation (most recent)
            const firstConversation = conversations[0]
            console.log(`✅ Redirecting to first conversation: ${firstConversation._id}`)
            router.push(`/messages/${firstConversation._id}`)
            return
          } else {
            // No conversations found - redirect to empty state
            console.log('📭 No conversations found, redirecting to new conversation page')
            router.push("/messages/0")
            return
          }
        } else {
          console.error('❌ Failed to fetch conversations')
          router.push("/messages/0")
          return
        }

      } catch (error) {
        console.error("❌ Error in messages redirector:", error)
        router.push("/messages/0")
        return
      }
    }

    handleRedirect()
  }, [session, status, orderId, router])

  // Show loading state while redirecting
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirection en cours...</p>
      </div>
    </div>
  )
}