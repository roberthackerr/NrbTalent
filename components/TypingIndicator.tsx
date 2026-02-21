// components/TypingIndicator.tsx
"use client"

import { useEffect, useState } from "react"

interface TypingIndicatorProps {
  text: string | null
}

export const TypingIndicator = ({ text }: TypingIndicatorProps) => {
  const [dots, setDots] = useState("")

  useEffect(() => {
    if (!text) return

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return ""
        return prev + "."
      })
    }, 500)

    return () => clearInterval(interval)
  }, [text])

  if (!text) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 animate-pulse">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span>{text}{dots}</span>
    </div>
  )
}