"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  User,
  Settings,
  LogOut,
  FileText,
  Plus,
  Users,
  TrendingUp,
  GraduationCap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { NotificationsDropdown } from "@/components/notifications-dropdown"

interface SidebarProps {
  role: "freelance" | "client"
}

export function DashboardSidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const freelanceLinks = [
    { href: "/dashboard/freelance", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/freelance/projects", label: "Browse Projects", icon: Briefcase },
    { href: "/dashboard/freelance/applications", label: "My Applications", icon: FileText },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/academy", label: "Academy", icon: GraduationCap },
    { href: "/dashboard/analytics", label: "Analytics", icon: TrendingUp },
    { href: "/dashboard/freelance/profile", label: "Profile", icon: User },
  ]

  const clientLinks = [
    { href: "/dashboard/client", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/client/projects", label: "My Projects", icon: Briefcase },
    { href: "/dashboard/client/post-project", label: "Post Project", icon: Plus },
    { href: "/talents", label: "Find Talents", icon: Users },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/academy", label: "Academy", icon: GraduationCap },
    { href: "/dashboard/analytics", label: "Analytics", icon: TrendingUp },
    { href: "/dashboard/client/profile", label: "Profile", icon: User },
  ]

  const links = role === "freelance" ? freelanceLinks : clientLinks

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-background">
      <div className="border-b border-border p-6">
        <Link href="/" className="text-2xl font-bold">
          NRB<span className="text-primary">Talents</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || pathname?.startsWith(link.href + "/")

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <NotificationsDropdown />
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
