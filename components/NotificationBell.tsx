// components/NotificationBell.tsx - VERSION FINALE MULTILINGUE ET RESPONSIVE
"use client"

import { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  Check, 
  Settings, 
  X, 
  Search, 
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
  RefreshCw,
  ChevronRight,
  Command,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/contexts/NotificationContext';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { getDictionarySafe } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

// Messages multilingues par défaut (fallback)
const getMessages = (lang: Locale) => {
  const messages = {
    fr: {
      notifications: "Notifications",
      unread: "non lu",
      unreadPlural: "non lus",
      refresh: "Actualiser",
      settings: "Paramètres",
      search: "Rechercher des notifications...",
      all: "Toutes",
      unreadOnly: "Non lues",
      markAllRead: "Tout lire",
      quickAccess: "Accès rapide",
      messages: "Messages",
      orders: "Commandes",
      projects: "Projets",
      reviews: "Évaluations",
      noResults: "Aucun résultat",
      noNotifications: "Aucune notification",
      noResultsDesc: "Aucune notification ne correspond à votre recherche.",
      allCaughtUp: "Toutes vos notifications sont à jour.",
      clearSearch: "Effacer la recherche",
      urgent: "URGENT",
      markAsRead: "Marquer comme lu",
      markAsUnread: "Marquer comme non lu",
      view: "Voir",
      shortcuts: "Raccourcis:",
      allRead: "Tout lire",
      open: "Ouvrir",
      notificationCenter: "Centre de notifications",
      others: "autres",
      justNow: "À l'instant",
      minAgo: "min",
      hourAgo: "h",
      dayAgo: "j"
    },
    en: {
      notifications: "Notifications",
      unread: "unread",
      unreadPlural: "unread",
      refresh: "Refresh",
      settings: "Settings",
      search: "Search notifications...",
      all: "All",
      unreadOnly: "Unread",
      markAllRead: "Mark all as read",
      quickAccess: "Quick access",
      messages: "Messages",
      orders: "Orders",
      projects: "Projects",
      reviews: "Reviews",
      noResults: "No results",
      noNotifications: "No notifications",
      noResultsDesc: "No notifications match your search.",
      allCaughtUp: "All caught up!",
      clearSearch: "Clear search",
      urgent: "URGENT",
      markAsRead: "Mark as read",
      markAsUnread: "Mark as unread",
      view: "View",
      shortcuts: "Shortcuts:",
      allRead: "Mark all read",
      open: "Open",
      notificationCenter: "Notification center",
      others: "more",
      justNow: "Just now",
      minAgo: "min ago",
      hourAgo: "h ago",
      dayAgo: "d ago"
    },
    mg: {
      notifications: "Fampandrenesana",
      unread: "tsy novakiana",
      unreadPlural: "tsy novakiana",
      refresh: "Havaozina",
      settings: "Fandrindrana",
      search: "Mitady fampandrenesana...",
      all: "Rehetra",
      unreadOnly: "Tsy novakiana",
      markAllRead: "Vakio daholo",
      quickAccess: "Fidirana haingana",
      messages: "Hafatra",
      orders: "Baiko",
      projects: "Tetikasa",
      reviews: "Hevitra",
      noResults: "Tsy misy valiny",
      noNotifications: "Tsy misy fampandrenesana",
      noResultsDesc: "Tsy misy fampandrenesana mifanentana amin'ny fikarohanao.",
      allCaughtUp: "Voavakiana daholo ny fampandrenesanao!",
      clearSearch: "Esory ny fikarohana",
      urgent: "MAIKA",
      markAsRead: "Asio ho voavakiana",
      markAsUnread: "Asio ho tsy voavakiana",
      view: "Jereo",
      shortcuts: "Fanafohezana:",
      allRead: "Vakio daholo",
      open: "Sokafy",
      notificationCenter: "Foibe fampandrenesana",
      others: "hafa",
      justNow: "Vao izao",
      minAgo: "mn lasa",
      hourAgo: "ora lasa",
      dayAgo: "and lasa"
    }
  };
  return messages[lang] || messages.fr;
};

// Icônes par catégorie
const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  MESSAGE: <MessageSquare className="h-4 w-4" />,
  ORDER: <DollarSign className="h-4 w-4" />,
  REVIEW: <Star className="h-4 w-4" />,
  SYSTEM: <Bell className="h-4 w-4" />,
  PROMOTION: <Zap className="h-4 w-4" />,
  SECURITY: <Shield className="h-4 w-4" />,
  COMMUNITY: <Users className="h-4 w-4" />,
  ACHIEVEMENT: <Star className="h-4 w-4" />
};

// Couleurs par catégorie
const CATEGORY_COLORS: Record<string, string> = {
  MESSAGE: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  ORDER: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  REVIEW: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
  SYSTEM: 'text-gray-600 bg-gray-100 dark:bg-gray-800/50 dark:text-gray-400',
  PROMOTION: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
  SECURITY: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
  COMMUNITY: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400',
  ACHIEVEMENT: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400'
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [dict, setDict] = useState<any>(null);
  const [lang, setLang] = useState<Locale>('fr');
  
  const { state, actions } = useNotifications();
  const { markAsRead, markAllAsRead, deleteNotification, refreshNotifications } = actions;
  
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();

  // Charger le dictionnaire
  useEffect(() => {
    const currentLang = (params.lang as Locale) || 'fr';
    setLang(currentLang);
    getDictionarySafe(currentLang).then(setDict);
  }, [params.lang]);

  const t = useCallback((key: string, fallback: string = key): string => {
    if (dict?.notifications?.[key]) return dict.notifications[key];
    const messages = getMessages(lang);
    return messages[key as keyof typeof messages] || fallback;
  }, [dict, lang]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
      if (isOpen && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (state.notifications?.[index]) {
          e.preventDefault();
          handleNotificationClick(state.notifications[index]);
        }
      }
      if (isOpen && e.key === 'a') {
        e.preventDefault();
        markAllAsRead();
      }
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
    return NOTIFICATION_ICONS[category] || <Bell className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || 'text-gray-600 bg-gray-100 dark:bg-gray-800/50 dark:text-gray-400';
  };

  const formatTime = useCallback((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('justNow', 'À l\'instant');
    if (minutes < 60) return `${minutes} ${t('minAgo', 'min')}`;
    if (hours < 24) return `${hours} ${t('hourAgo', 'h')}`;
    if (days < 7) return `${days} ${t('dayAgo', 'j')}`;
    return new Date(date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'mg' ? 'fr-FR' : 'en-US');
  }, [t, lang]);

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
    { label: t('messages', 'Messages'), icon: MessageSquare, href: `/${lang}/messages`, shortcut: 'M' },
    { label: t('orders', 'Commandes'), icon: DollarSign, href: `/${lang}/orders`, shortcut: 'O' },
    { label: t('projects', 'Projets'), icon: Inbox, href: `/${lang}/projects`, shortcut: 'P' },
    { label: t('reviews', 'Évaluations'), icon: Star, href: `/${lang}/reviews`, shortcut: 'R' },
    { label: t('settings', 'Paramètres'), icon: Settings, href: `/${lang}/notifications/settings`, shortcut: 'S' },
  ];

  if (!session) {
    return null;
  }

  const unreadText = state.unreadCount === 1 ? t('unread', 'non lu') : t('unreadPlural', 'non lus');

  return (
    <TooltipProvider>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative h-8 w-8 rounded-lg hover:bg-accent/50 transition-colors"
                disabled={state.isLoading}
                aria-label={t('notifications', 'Notifications')}
              >
                <Bell className="h-4 w-4" />
                {state.unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 text-[10px] font-bold"
                  >
                    {state.unreadCount > 9 ? '9+' : state.unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <div className="flex items-center gap-2">
              <Command className="h-3 w-3" />
              <span>Shift + N</span>
            </div>
          </TooltipContent>
        </Tooltip>
        
        <DropdownMenuContent 
          align="end" 
          className="w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-h-[85vh] p-0 overflow-hidden rounded-xl border-0 shadow-2xl" 
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 p-3 sm:p-4 border-b bg-gradient-to-r from-background/95 to-background/95 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                <h3 className="font-bold text-sm sm:text-base">{t('notifications', 'Notifications')}</h3>
                {state.unreadCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">
                    {state.unreadCount} {unreadText}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={refreshNotifications}
                      disabled={state.isLoading}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${state.isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('refresh', 'Actualiser')} (R)</TooltipContent>
                </Tooltip>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  asChild
                >
                  <Link href={`/${lang}/notifications/settings`}>
                    <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Search and Filter */}
            <div className="space-y-2 sm:space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder={t('search', 'Rechercher des notifications...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 sm:pl-10 h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-8 sm:h-9">
                    <TabsTrigger value="all" className="text-xs">{t('all', 'Toutes')}</TabsTrigger>
                    <TabsTrigger value="unread" className="text-xs">{t('unreadOnly', 'Non lues')}</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {state.unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-7 sm:h-8 text-xs px-2 sm:px-3 whitespace-nowrap"
                    disabled={state.isLoading}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    <span className="hidden xs:inline">{t('markAllRead', 'Tout lire')}</span>
                    <span className="xs:hidden">(A)</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">{t('quickAccess', 'Accès rapide')}</span>
              <div className="flex items-center gap-1">
                {quickActions.slice(0, 3).map((action) => (
                  <Tooltip key={action.label}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 sm:h-7 sm:w-7"
                        asChild
                      >
                        <Link href={action.href}>
                          <action.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {action.label} ({action.shortcut})
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="max-h-[300px] sm:max-h-[400px]">
            {filteredNotifications.length === 0 ? (
              <div className="p-6 sm:p-8 text-center">
                <div className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-muted/30 to-muted/50 flex items-center justify-center">
                  <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/50" />
                </div>
                <h4 className="font-medium text-sm sm:text-base mb-1 sm:mb-2">
                  {searchQuery ? t('noResults', 'Aucun résultat') : t('noNotifications', 'Aucune notification')}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  {searchQuery 
                    ? t('noResultsDesc', 'Aucune notification ne correspond à votre recherche.') 
                    : t('allCaughtUp', 'Toutes vos notifications sont à jour.')}
                </p>
                {searchQuery && (
                  <Button variant="outline" size="sm" className="h-7 sm:h-8 text-xs" onClick={() => setSearchQuery('')}>
                    {t('clearSearch', 'Effacer la recherche')}
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-1.5 sm:p-2">
                {filteredNotifications.slice(0, 20).map((notification, index) => (
                  <div
                    key={notification._id}
                    className={cn(
                      "p-2 sm:p-3 mb-1 rounded-lg cursor-pointer transition-all duration-200 group",
                      notification.status === 'UNREAD' 
                        ? 'bg-blue-50/50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800' 
                        : 'hover:bg-accent/50'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-2 sm:gap-3 w-full">
                      <div className={cn("p-1.5 sm:p-2 rounded-full flex-shrink-0", getCategoryColor(notification.category))}>
                        {getNotificationIcon(notification.category)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1 sm:gap-2">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                              <p className="font-semibold text-xs sm:text-sm">
                                {notification.title}
                              </p>
                              {notification.priority === 'URGENT' && (
                                <Badge variant="destructive" className="text-[8px] sm:text-[10px] px-1 py-0">
                                  {t('urgent', 'URGENT')}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 sm:mt-2">
                              <span className="text-[10px] sm:text-xs text-muted-foreground">
                                {formatTime(notification.createdAt)}
                              </span>
                              <span className="text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-muted">
                                {notification.category?.toLowerCase()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {notification.status === 'UNREAD' && (
                              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 sm:h-6 sm:w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification._id);
                              }}
                            >
                              <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex items-center gap-1 sm:gap-2 mt-2 sm:mt-3">
                          {notification.status === 'UNREAD' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 sm:h-7 text-[10px] sm:text-xs px-1.5 sm:px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification._id);
                              }}
                            >
                              <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                              <span className="hidden xs:inline">{t('markAsRead', 'Marquer comme lu')}</span>
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 sm:h-7 text-[10px] sm:text-xs px-1.5 sm:px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Mark as unread functionality would need to be added to context
                              }}
                            >
                              <EyeOff className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                              <span className="hidden xs:inline">{t('markAsUnread', 'Marquer comme non lu')}</span>
                            </Button>
                          )}
                          
                          {notification.actionUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 sm:h-7 text-[10px] sm:text-xs px-1.5 sm:px-2"
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link href={notification.actionUrl}>
                                <ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                <span className="hidden xs:inline">{t('view', 'Voir')}</span>
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Keyboard shortcut hint */}
                    {index < 9 && (
                      <div className="absolute right-1 sm:right-2 top-1 sm:top-2">
                        <kbd className="px-1 py-0.5 text-[8px] sm:text-xs border rounded bg-muted/80 font-mono">
                          {index + 1}
                        </kbd>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="sticky bottom-0 p-2 sm:p-3 border-t bg-muted/30 rounded-b-xl">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Keyboard className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span>{t('shortcuts', 'Raccourcis:')}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <kbd className="px-1 py-0.5 border rounded text-[9px] sm:text-xs bg-muted/50 font-mono">A</kbd>
                  <span className="hidden xs:inline">{t('allRead', 'Tout lire')}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <kbd className="px-1 py-0.5 border rounded text-[9px] sm:text-xs bg-muted/50 font-mono">1-9</kbd>
                  <span className="hidden xs:inline">{t('open', 'Ouvrir')}</span>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] sm:text-xs px-2 sm:px-3"
                asChild
              >
                <Link href={`/${lang}/notifications`}>
                  <Inbox className="h-3 w-3 mr-1" />
                  {t('notificationCenter', 'Centre de notifications')}
                </Link>
              </Button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}