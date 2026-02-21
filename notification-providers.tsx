// app/providers.tsx
"use client"

import { SessionProvider } from "next-auth/react"
import { NotificationProvider } from '@/contexts/NotificationContext'

interface AppProvidersProps {
  children: React.ReactNode;
  session?: any;
}

export function AppProviders({ 
  children,
  session 
}: AppProvidersProps) {
  return (
    <SessionProvider session={session}>
      <NotificationProvider session={session}>
        {children}
      </NotificationProvider>
    </SessionProvider>
  )
}