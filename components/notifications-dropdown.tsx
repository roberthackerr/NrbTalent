"use client"

import { Bell, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"
import type { Notification } from "@/lib/models/user"

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    try {
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        // S'assurer que data est toujours un tableau
        const notificationsArray = Array.isArray(data) ? data : []
        setNotifications(notificationsArray)
        // S'assurer que filter est appelé sur un tableau
        setUnreadCount(notificationsArray.filter((n: Notification) => !n.read).length)
      } else {
        // En cas d'erreur HTTP, initialiser avec des tableaux vides
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      // En cas d'erreur réseau, initialiser avec des tableaux vides
      setNotifications([])
      setUnreadCount(0)
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      })
      
      if (response.ok) {
        // Mettre à jour localement sans refetch
        setNotifications(prev => 
          prev.map(n => 
            n._id?.toString() === notificationId ? { ...n, read: true } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  async function markAllAsRead() {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      })
      
      if (response.ok) {
        // Mettre à jour localement sans refetch
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  // Fonction utilitaire pour obtenir l'ID de notification de manière sécurisée
  const getNotificationId = (notification: Notification): string => {
    if (typeof notification._id === 'string') return notification._id
    if (notification._id && typeof notification._id.toString === 'function') return notification._id.toString()
    return Math.random().toString(36).substr(2, 9) // Fallback ID
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead} 
              className="h-auto p-0 text-xs flex items-center gap-1"
            >
              <CheckCircle className="h-3 w-3" />
              Tout marquer comme lu
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {!notifications || notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            notifications.map((notification) => {
              const notificationId = getNotificationId(notification)
              const isUnread = !notification.read
              
              return (
                <DropdownMenuItem
                  key={notificationId}
                  className={`cursor-pointer p-4 ${isUnread ? 'bg-blue-50/50' : ''}`}
                  onClick={() => isUnread && markAsRead(notificationId)}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm leading-tight">
                        {notification.title || "Sans titre"}
                      </p>
                      {isUnread && (
                        <div className="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-tight">
                      {notification.message || "Aucun message"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {notification.createdAt 
                        ? new Date(notification.createdAt).toLocaleDateString('fr-FR')
                        : "Date inconnue"
                      }
                    </p>
                  </div>
                </DropdownMenuItem>
              )
            })
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}