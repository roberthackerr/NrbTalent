"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/contexts/NotificationContext"
interface AppProvidersProps {
  children: React.ReactNode;
  session?: any;
}
export function Providers({ 
  children,
  session 
}: AppProvidersProps) {

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <NotificationProvider session={session}>
          {children}
        </NotificationProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
