// components/NotificationBell.tsx
"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
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
      search: "Rechercher...",
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
      clearSearch: "Effacer",
      urgent: "URGENT",
      markAsRead: "Lire",
      markAsUnread: "Non lu",
      view: "Voir",
      shortcuts: "Raccourcis:",
      allRead: "Tout lire",
      open: "Ouvrir",
      notificationCenter: "Centre",
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
      search: "Search...",
      all: "All",
      unreadOnly: "Unread",
      markAllRead: "Mark all read",
      quickAccess: "Quick access",
      messages: "Messages",
      orders: "Orders",
      projects: "Projects",
      reviews: "Reviews",
      noResults: "No results",
      noNotifications: "No notifications",
      noResultsDesc: "No notifications match your search.",
      allCaughtUp: "All caught up!",
      clearSearch: "Clear",
      urgent: "URGENT",
      markAsRead: "Read",
      markAsUnread: "Unread",
      view: "View",
      shortcuts: "Shortcuts:",
      allRead: "Mark all read",
      open: "Open",
      notificationCenter: "Center",
      others: "more",
      justNow: "Just now",
      minAgo: "min ago",
      hourAgo: "h ago",
      dayAgo: "d ago"
    },
    mg: {
      notifications: "Fampandre",
      unread: "tsy novakiana",
      unreadPlural: "tsy novakiana",
      refresh: "Havaozina",
      settings: "Fandrindrana",
      search: "Hikaroka...",
      all: "Rehetra",
      unreadOnly: "Tsy novakiana",
      markAllRead: "Vakio daholo",
      quickAccess: "Fidirana",
      messages: "Hafatra",
      orders: "Baiko",
      projects: "Tetikasa",
      reviews: "Hevitra",
      noResults: "Tsy misy",
      noNotifications: "Tsy misy",
      noResultsDesc: "Tsy misy fampandrenesana.",
      allCaughtUp: "Voavakiana daholo!",
      clearSearch: "Esory",
      urgent: "MAIKA",
      markAsRead: "Vakio",
      markAsUnread: "Tsy vakiana",
      view: "Jereo",
      shortcuts: "Fanafohezana:",
      allRead: "Vakio daholo",
      open: "Sokafy",
      notificationCenter: "Foibe",
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
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { state, actions } = useNotifications();
  const { markAsRead, markAllAsRead, deleteNotification, refreshNotifications } = actions;
  
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filter notifications
  const filteredNotifications = state.notifications?.filter(notification => {
    if (filter === 'unread' && notification.status !== 'UNREAD') return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
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
    return new Date(date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US');
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

  // Quick actions simplifiées pour mobile
  const quickActions = [
    { label: t('messages', 'Messages'), icon: MessageSquare, href: `/${lang}/messages` },
    { label: t('orders', 'Commandes'), icon: DollarSign, href: `/${lang}/orders` },
    { label: t('settings', 'Paramètres'), icon: Settings, href: `/${lang}/notifications/settings` },
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
                className="relative h-9 w-9 rounded-lg hover:bg-accent/50 transition-colors"
                disabled={state.isLoading}
                aria-label={t('notifications', 'Notifications')}
              >
                <Bell className="h-4 w-4" />
                {state.unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] font-bold rounded-full"
                  >
                    {state.unreadCount > 9 ? '9+' : state.unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs hidden sm:block">
            <div className="flex items-center gap-2">
              <Command className="h-3 w-3" />
              <span>Shift + N</span>
            </div>
          </TooltipContent>
        </Tooltip>
        
        <DropdownMenuContent 
          align="end" 
          className={cn(
            "p-0 overflow-hidden rounded-xl border-0 shadow-2xl",
            isMobile ? "w-[calc(100vw-2rem)] max-w-[95vw]" : "w-96 md:w-[28rem]",
            "max-h-[85vh]"
          )} 
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header - Sticky */}
          <div className="sticky top-0 z-20 p-3 sm:p-4 border-b bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                <h3 className="font-bold text-sm sm:text-base">{t('notifications', 'Notifications')}</h3>
                {state.unreadCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5">
                    {state.unreadCount} {!isMobile && unreadText}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-0.5 sm:gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  onClick={refreshNotifications}
                  disabled={state.isLoading}
                >
                  <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${state.isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            
            {/* Search and Filter - Simplifié sur mobile */}
            <div className="space-y-2 sm:space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder={t('search', 'Rechercher...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="flex-1">
                  <TabsList className="grid w-full grid-cols-2 h-8 sm:h-9">
                    <TabsTrigger value="all" className="text-xs sm:text-sm">{t('all', 'Toutes')}</TabsTrigger>
                    <TabsTrigger value="unread" className="text-xs sm:text-sm">{t('unreadOnly', 'Non lues')}</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {state.unreadCount > 0 && !isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-8 sm:h-9 text-xs px-2 sm:px-3 whitespace-nowrap"
                    disabled={state.isLoading}
                  >
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                    {t('markAllRead', 'Tout lire')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Bar - Simplifié sur mobile */}
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 border-b bg-gray-50 dark:bg-gray-800/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                {!isMobile && t('quickAccess', 'Accès rapide')}
              </span>
              <div className="flex items-center gap-0.5 sm:gap-1">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    asChild
                  >
                    <Link href={action.href}>
                      <action.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Notifications List - Scrollable Area */}
          <ScrollArea className="max-h-[350px] sm:max-h-[400px] md:max-h-[500px] overflow-y-auto">
            <div ref={scrollRef} className="p-1 sm:p-2">
              {filteredNotifications.length === 0 ? (
                <div className="py-8 sm:py-12 text-center">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                    <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  </div>
                  <h4 className="font-medium text-sm sm:text-base mb-1 sm:mb-2">
                    {searchQuery ? t('noResults', 'Aucun résultat') : t('noNotifications', 'Aucune notification')}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground px-4">
                    {searchQuery 
                      ? t('noResultsDesc', 'Aucune notification ne correspond à votre recherche.') 
                      : t('allCaughtUp', 'Toutes vos notifications sont à jour.')}
                  </p>
                  {searchQuery && (
                    <Button variant="ghost" size="sm" className="mt-3 h-7 text-xs" onClick={() => setSearchQuery('')}>
                      {t('clearSearch', 'Effacer')}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={cn(
                        "p-2 sm:p-3 rounded-lg cursor-pointer transition-all duration-200",
                        notification.status === 'UNREAD' 
                          ? 'bg-blue-50/50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className={cn("p-1.5 sm:p-2 rounded-full flex-shrink-0", getCategoryColor(notification.category))}>
                          {getNotificationIcon(notification.category)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1 sm:gap-2">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-1 mb-0.5">
                                <p className="font-semibold text-xs sm:text-sm line-clamp-2">
                                  {notification.title}
                                </p>
                                {notification.priority === 'URGENT' && (
                                  <Badge variant="destructive" className="text-[8px] sm:text-[10px] px-1 py-0">
                                    {t('urgent', 'URGENT')}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                                <span className="text-[10px] sm:text-xs text-muted-foreground">
                                  {formatTime(notification.createdAt)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              {notification.status === 'UNREAD' && (
                                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification._id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Action buttons - Simplifiés sur mobile */}
                          <div className="flex items-center gap-1 sm:gap-2 mt-1.5 sm:mt-2">
                            {notification.status === 'UNREAD' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] sm:text-xs px-1.5 sm:px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification._id);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-0.5 sm:mr-1" />
                                {!isMobile && t('markAsRead', 'Lire')}
                              </Button>
                            )}
                            
                            {notification.actionUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] sm:text-xs px-1.5 sm:px-2"
                                asChild
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Link href={notification.actionUrl}>
                                  <ChevronRight className="h-3 w-3 mr-0.5 sm:mr-1" />
                                  {!isMobile && t('view', 'Voir')}
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer - Sticky Bottom, simplifié sur mobile */}
          <div className="sticky bottom-0 z-20 p-2 sm:p-3 border-t bg-gray-50 dark:bg-gray-800/30 rounded-b-xl">
            <div className="flex items-center justify-between gap-2">
              {!isMobile && state.unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-7 text-xs"
                  disabled={state.isLoading}
                >
                  <Check className="h-3 w-3 mr-1" />
                  {t('allRead', 'Tout lire')}
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs ml-auto"
                asChild
              >
                <Link href={`/${lang}/notifications`}>
                  <Inbox className="h-3 w-3 mr-1" />
                  {isMobile ? t('notificationCenter', 'Centre') : t('notificationCenter', 'Centre de notifications')}
                </Link>
              </Button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}