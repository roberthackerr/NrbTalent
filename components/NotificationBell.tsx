// components/NotificationBell.tsx
"use client"

import { useState } from 'react';
import { Bell, Check, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/contexts/NotificationContext';
import { useSession } from 'next-auth/react';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  
  // CORRECTED: Destructure properly from the context
  const { state, actions } = useNotifications();
  const { markAsRead, markAllAsRead, deleteNotification } = actions;
  
  const { data: session } = useSession();

  // Si pas de session, ne pas afficher la cloche
  if (!session) {
    return null;
  }

  const getNotificationIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      MESSAGE: '💬',
      ORDER: '🛒', 
      REVIEW: '⭐',
      SYSTEM: '🔔',
      PROMOTION: '💰',
      SECURITY: '🚨',
      COMMUNITY: '👥',
      ACHIEVEMENT: '🏆'
    };
    return icons[category] || '🔔';
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    if (days < 7) return `Il y a ${days} j`;
    return new Date(date).toLocaleDateString('fr-FR');
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          disabled={state.isLoading}
        >
          <Bell className="h-5 w-5" />
          {state.unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {state.unreadCount > 9 ? '9+' : state.unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex gap-2">
            {state.unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-8 text-xs"
                disabled={state.isLoading}
              >
                <Check className="h-3 w-3 mr-1" />
                Tout lire
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8"
              asChild
            >
              <a href="/notifications/settings">
                <Settings className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>

        <ScrollArea className="h-80">
          {state.notifications && state.notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune notification</p>
              <p className="text-xs mt-1">
                {state.isConnected ? 'Prêt à recevoir des notifications' : 'Connexion...'}
              </p>
            </div>
          ) : (
            <div className="p-2">
              {state.notifications && state.notifications.slice(0, 10).map((notification) => (
                <DropdownMenuItem
                  key={notification._id}
                  className={`p-3 mb-1 rounded-lg cursor-pointer ${
                    notification.status === 'UNREAD' 
                      ? 'bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-800' 
                      : 'bg-transparent'
                  }`}
                  onClick={() => {
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl;
                    }
                    if (notification.status === 'UNREAD') {
                      markAsRead(notification._id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3 w-full">
                    <span className="text-lg mt-0.5 flex-shrink-0">
                      {getNotificationIcon(notification.category)}
                    </span>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>

        {state.notifications && state.notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="justify-center text-sm text-muted-foreground cursor-pointer"
              onClick={() => window.location.href = '/notifications'}
            >
              Voir toutes les notifications ({state.notifications.length})
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}