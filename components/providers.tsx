"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/contexts/NotificationContext"
import { SessionProvider } from "./providers/SessionProvider";
import { LanguageProvider } from "@/context/language-context";
import { StripeProvider } from "@/app/providers/stripe-provider";
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
        <LanguageProvider>
          <NotificationProvider session={session}>
                <StripeProvider>
      {children}
    </StripeProvider>
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
