// app/messages/[id]/page.tsx - MINIMAL VERSION
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"

export default function ConversationPage() {
  const { data: session, status: sessionStatus } = useSession()
  const params = useParams()
  const conversationId = params?.id as string | undefined
  
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("Page mounted with ID:", conversationId)
    setIsLoading(false)
  }, [conversationId])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">
        Conversation: {conversationId || "No ID"}
      </h1>
      <p>Session status: {sessionStatus}</p>
      <p>Session user: {session?.user?.name || "Not logged in"}</p>
    </div>
  )
}