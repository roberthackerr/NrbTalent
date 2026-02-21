// components/NotificationBell.tsx - UPDATED WITH SHORTCUTS
"use client"

import { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  Check, 
  Settings, 
  X, 
  Search, 
  Filter, 
  Zap, 
  Keyboard, 
  Inbox, 
  Star, 
  Clock,
  MessageSquare,
  DollarSign,
  Shield,
  Users,
  Mail,
  Eye,
  EyeOff,
  Archive,
  RefreshCw,
  ChevronRight,
  Command,
  ArrowRight,
  Bookmark,
  Pin,
  BellOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/contexts/NotificationContext';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  const { state, actions } = useNotifications();
  const { markAsRead, markAllAsRead, deleteNotification, refreshNotifications } = actions;
  
  const { data: session } = useSession();
  const router = useRouter();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + N to open notifications
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        setIsOpen(true);
      }
      
      // Esc to close notifications
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
      
      // Number keys to mark as read (1-9)
      if (isOpen && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (state.notifications && state.notifications[index]) {
          e.preventDefault();
          handleNotificationClick(state.notifications[index]);
        }
      }
      
      // A to mark all as read
      if (isOpen && e.key === 'a') {
        e.preventDefault();
        markAllAsRead();
      }
      
      // R to refresh
      if (isOpen && e.key === 'r') {
        e.preventDefault();
        refreshNotifications();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, state.notifications, markAllAsRead, refreshNotifications]);

  // Filter notifications
  const filteredNotifications = state.notifications?.filter(notification => {
    if (filter === 'unread' && notification.status !== 'UNREAD') return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query) ||
        notification.category.toLowerCase().includes(query)
      );
    }
    
    return true;
  }) || [];

  const getNotificationIcon = (category: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      MESSAGE: <MessageSquare className="h-4 w-4" />,
      ORDER: <DollarSign className="h-4 w-4" />,
      REVIEW: <Star className="h-4 w-4" />,
      SYSTEM: <Bell className="h-4 w-4" />,
      PROMOTION: <Zap className="h-4 w-4" />,
      SECURITY: <Shield className="h-4 w-4" />,
      COMMUNITY: <Users className="h-4 w-4" />,
      ACHIEVEMENT: <Star className="h-4 w-4" />
    };
    return icons[category] || <Bell className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      MESSAGE: 'text-blue-600 bg-blue-100 dark:bg-blue-900',
      ORDER: 'text-green-600 bg-green-100 dark:bg-green-900',
      REVIEW: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900',
      SYSTEM: 'text-gray-600 bg-gray-100 dark:bg-gray-800',
      PROMOTION: 'text-purple-600 bg-purple-100 dark:bg-purple-900',
      SECURITY: 'text-red-600 bg-red-100 dark:bg-red-900',
      COMMUNITY: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900',
      ACHIEVEMENT: 'text-amber-600 bg-amber-100 dark:bg-amber-900'
    };
    return colors[category] || 'text-gray-600 bg-gray-100 dark:bg-gray-800';
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

  const handleNotificationClick = useCallback((notification: any) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
    if (notification.status === 'UNREAD') {
      markAsRead(notification._id);
    }
    setIsOpen(false);
  }, [router, markAsRead]);

  // Quick actions
  const quickActions = [
    { label: 'Messages', icon: MessageSquare, href: '/messages', shortcut: 'M' },
    { label: 'Commandes', icon: DollarSign, href: '/orders', shortcut: 'O' },
    { label: 'Projets', icon: Inbox, href: '/projects', shortcut: 'P' },
    { label: 'Évaluations', icon: Star, href: '/reviews', shortcut: 'R' },
    { label: 'Paramètres', icon: Settings, href: '/notifications/settings', shortcut: 'S' },
  ];

  // Si pas de session, ne pas afficher la cloche
  if (!session) {
    return null;
  }

  return (
    <TooltipProvider>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="flex items-center gap-2">
              <Command className="h-3 w-3" />
              <span>Shift</span>
              <span>+</span>
              <span>N</span>
            </div>
          </TooltipContent>
        </Tooltip>
        
        <DropdownMenuContent 
          align="end" 
          className="w-[420px] p-0"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <h3 className="font-semibold text-lg">Notifications</h3>
                {state.unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {state.unreadCount} non lu{state.unreadCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={refreshNotifications}
                      disabled={state.isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${state.isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Actualiser (R)
                  </TooltipContent>
                </Tooltip>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  asChild
                >
                  <Link href="/notifications/settings">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Search and Filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="all">Toutes</TabsTrigger>
                    <TabsTrigger value="unread">Non lues</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {state.unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-8 text-xs"
                    disabled={state.isLoading}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Tout lire (A)
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="px-4 py-2 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Accès rapide</span>
              <div className="flex items-center gap-1">
                {quickActions.slice(0, 3).map((action) => (
                  <Tooltip key={action.label}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                      >
                        <Link href={action.href}>
                          <action.icon className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {action.label} ({action.shortcut})
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-[400px]">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h4 className="font-medium mb-2">
                  {searchQuery ? 'Aucun résultat' : 'Aucune notification'}
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery 
                    ? 'Aucune notification ne correspond à votre recherche.' 
                    : 'Toutes vos notifications sont à jour.'}
                </p>
                {searchQuery && (
                  <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                    Effacer la recherche
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-2">
                {filteredNotifications.slice(0, 20).map((notification, index) => (
                  <DropdownMenuItem
                    key={notification._id}
                    className={`p-3 mb-1 rounded-lg cursor-pointer flex flex-col items-start ${
                      notification.status === 'UNREAD' 
                        ? 'bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800' 
                        : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className={`p-2 rounded-full ${getCategoryColor(notification.category)} flex-shrink-0`}>
                        {getNotificationIcon(notification.category)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">
                                {notification.title}
                              </p>
                              {notification.priority === 'URGENT' && (
                                <Badge variant="destructive" className="text-xs px-1 py-0">
                                  URGENT
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatTime(notification.createdAt)}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                                {notification.category?.toLowerCase()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {notification.status === 'UNREAD' && (
                              <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification._id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex items-center gap-2 mt-3">
                          {notification.status === 'UNREAD' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification._id);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Marquer comme lu
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Mark as unread functionality would need to be added to context
                              }}
                            >
                              <EyeOff className="h-3 w-3 mr-1" />
                              Marquer comme non lu
                            </Button>
                          )}
                          
                          {notification.actionUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link href={notification.actionUrl}>
                                <ChevronRight className="h-3 w-3 mr-1" />
                                Voir
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Keyboard shortcut hint */}
                    {index < 9 && (
                      <div className="absolute right-2 top-2">
                        <kbd className="px-1.5 py-0.5 text-xs border rounded bg-muted">
                          {index + 1}
                        </kbd>
                      </div>
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer with shortcuts and actions */}
          <div className="p-3 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Keyboard className="h-3 w-3" />
                  <span>Raccourcis:</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 border rounded text-xs">A</kbd>
                  <span>Tout lire</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 border rounded text-xs">1-9</kbd>
                  <span>Ouvrir</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8"
                  asChild
                >
                  <Link href="/notifications">
                    <Inbox className="h-3 w-3 mr-1" />
                    Centre de notifications
                  </Link>
                </Button>
                
                {state.notifications && state.notifications.length > 20 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    asChild
                  >
                    <Link href="/notifications">
                      +{state.notifications.length - 20} autres
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}