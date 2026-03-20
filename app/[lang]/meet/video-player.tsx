"use client"

import { useEffect, useRef } from "react"

export function VideoPlayer({ track }: { track: any }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current && track) {
      track.play(containerRef.current)
    }

    return () => {
      if (track) {
        track.stop()
      }
    }
  }, [track])

  return <div ref={containerRef} className="w-full h-full" />
}