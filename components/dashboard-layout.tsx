// components/dashboard-layout.tsx
"use client"

import { ReactNode } from 'react'
import { DashboardSidebar } from './dashboard/sidebar'

interface DashboardLayoutProps {
  children: ReactNode
  role: "freelance" | "client"
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50/30">
      <DashboardSidebar role={role} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}