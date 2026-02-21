// Ajoutez ce composant à votre layout principal
// components/SessionMonitor.tsx
"use client"

import { useSessionMonitor } from "@/hooks/useSessionMonitor"

export function SessionMonitor() {
  useSessionMonitor()
  return null
}