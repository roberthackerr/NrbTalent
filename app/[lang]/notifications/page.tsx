// app/notifications/page.tsx
"use client"

import { useState, useEffect, useMemo } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { useParams } from 'next/navigation'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Filter, 
  Search, 
  Settings, 
  AlertCircle, 
  MessageSquare, 
  DollarSign, 
  User, 
  Calendar,
  Archive,
  RefreshCw,
  Eye,
  EyeOff,
  MoreVertical,
  ArrowUpDown,
  Mail,
  Shield,
  Trophy,
  Users,
  Megaphone,
  Clock,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Award,
  Gift,
  Heart,
  Zap,
  Star,
  Briefcase,
  MessageCircle,
  Wallet,
  Lock,
  PartyPopper,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDistanceToNow, format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import type { Notifications, NotificationCategory } from '@/types/notifications'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

// Type for notification filter
type NotificationType = 'all' | 'unread' | 'projects' | 'messages' | 'payments' | 'system'

// Category mapping with icons and colors
const getCategoryConfig = (t: any) => ({
  MESSAGE: {
    label: t?.messages || 'Messages',
    icon: <MessageCircle className="h-4 w-4" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  ORDER: {
    label: t?.orders || 'Commandes',
    icon: <Wallet className="h-4 w-4" />,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  REVIEW: {
    label: t?.reviews || 'Avis',
    icon: <Star className="h-4 w-4" />,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800'
  },
  SYSTEM: {
    label: t?.system || 'Système',
    icon: <Settings className="h-4 w-4" />,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700'
  },
  PROMOTION: {
    label: t?.promotions || 'Promotions',
    icon: <Gift className="h-4 w-4" />,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  SECURITY: {
    label: t?.security || 'Sécurité',
    icon: <Lock className="h-4 w-4" />,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800'
  },
  COMMUNITY: {
    label: t?.community || 'Communauté',
    icon: <Users className="h-4 w-4" />,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-950/30',
    borderColor: 'border-indigo-200 dark:border-indigo-800'
  },
  ACHIEVEMENT: {
    label: t?.achievements || 'Réussites',
    icon: <Award className="h-4 w-4" />,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800'
  }
})

export default function NotificationsPage() {
  const params = useParams()
  const lang = (params?.lang as Locale) || 'fr'
  
  const [dict, setDict] = useState<any>(null)
  const { state, actions } = useNotifications()
  const { notifications, unreadCount, isLoading, preferences } = state
  const { markAsRead, markAllAsRead, deleteNotification, refreshNotifications } = actions
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<NotificationType>('all')
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'all'>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  
  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  const t = dict?.notifications || {
    title: 'Notifications',
    subtitle: 'Gérez toutes vos notifications en un seul endroit',
    total: 'Total des notifications',
    unread: 'Non lues',
    archived: 'Archivées',
    filters: 'Filtres',
    search: 'Rechercher',
    status: 'Statut',
    all: 'Toutes',
    categories: 'Catégories',
    allCategories: 'Toutes les catégories',
    preferences: 'Préférences',
    showArchived: 'Afficher les archivées',
    sortNewest: 'Trier du plus récent',
    quickStats: 'Statistiques rapides',
    today: 'Aujourd\'hui',
    thisWeek: 'Cette semaine',
    settings: 'Paramètres des notifications',
    noNotifications: 'Aucune notification',
    noNotificationsMatch: 'Aucune notification ne correspond à vos filtres.',
    resetFilters: 'Réinitialiser les filtres',
    markAsRead: 'Marquer comme lu',
    markAsUnread: 'Marquer comme non lu',
    delete: 'Supprimer',
    goToPage: 'Aller à la page',
    copyDetails: 'Copier les détails',
    deletePermanently: 'Supprimer définitivement',
    showing: 'Affichage de',
    notificationsFound: 'notification(s) trouvée(s)',
    selected: 'sélectionnée(s)',
    allRead: 'Tout est lu',
    lastUpdate: 'Dernière mise à jour',
    urgent: 'URGENT',
    unreadBadge: 'Non lu',
    refresh: 'Actualiser',
    bulkActions: 'Actions groupées',
    selectAll: 'Sélectionner tout',
    deselectAll: 'Désélectionner tout',
    markSelectedAsRead: 'Marquer comme lu',
    deleteSelected: 'Supprimer'
  }

  const categoryConfig = getCategoryConfig(t)
  const dateLocale = lang === 'fr' ? fr : lang === 'mg' ? fr : enUS

  // Filter and sort notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications.filter(notification => {
      if (!showArchived && notification.status === 'ARCHIVED') return false
      if (filterType === 'unread' && notification.status !== 'UNREAD') return false
      if (filterType === 'projects' && notification.category !== 'ORDER') return false
      if (filterType === 'messages' && notification.category !== 'MESSAGE') return false
      if (filterType === 'payments' && notification.category !== 'ORDER') return false
      if (filterType === 'system' && notification.category !== 'SYSTEM') return false
      if (selectedCategory !== 'all' && notification.category !== selectedCategory) return false
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          notification.title.toLowerCase().includes(query) ||
          notification.message.toLowerCase().includes(query)
        )
      }
      
      return true
    })
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB
    })
    
    return filtered
  }, [notifications, filterType, selectedCategory, searchQuery, showArchived, sortBy])
  
  // Stats
  const stats = useMemo(() => {
    const total = notifications.length
    const unread = notifications.filter(n => n.status === 'UNREAD').length
    const archived = notifications.filter(n => n.status === 'ARCHIVED').length
    
    const byCategory: Record<NotificationCategory, number> = {
      MESSAGE: notifications.filter(n => n.category === 'MESSAGE').length,
      ORDER: notifications.filter(n => n.category === 'ORDER').length,
      REVIEW: notifications.filter(n => n.category === 'REVIEW').length,
      SYSTEM: notifications.filter(n => n.category === 'SYSTEM').length,
      PROMOTION: notifications.filter(n => n.category === 'PROMOTION').length,
      SECURITY: notifications.filter(n => n.category === 'SECURITY').length,
      COMMUNITY: notifications.filter(n => n.category === 'COMMUNITY').length,
      ACHIEVEMENT: notifications.filter(n => n.category === 'ACHIEVEMENT').length
    }
    
    const today = notifications.filter(n => {
      const todayDate = new Date()
      const notifDate = new Date(n.createdAt)
      return notifDate.toDateString() === todayDate.toDateString()
    }).length
    
    const thisWeek = notifications.filter(n => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(n.createdAt) > weekAgo
    }).length
    
    return { total, unread, archived, byCategory, today, thisWeek }
  }, [notifications])
  
  // Format date
  const formatDate = (date: Date) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffInHours = (now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return formatDistanceToNow(notificationDate, { addSuffix: true, locale: dateLocale })
    } else if (diffInHours < 48) {
      return lang === 'fr' ? 'Hier' : lang === 'mg' ? 'Omaly' : 'Yesterday'
    } else if (diffInHours < 168) {
      return format(notificationDate, 'EEEE', { locale: dateLocale })
    } else {
      return format(notificationDate, 'dd/MM/yyyy')
    }
  }
  
  const handleMarkAsRead = (id: string) => {
    actions.markAsRead(id)
    setSelectedNotifications(prev => prev.filter(nId => nId !== id))
  }
  
  const handleDelete = (id: string) => {
    actions.deleteNotification(id)
    setSelectedNotifications(prev => prev.filter(nId => nId !== id))
  }
  
  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([])
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n._id))
    }
  }
  
  const handleBulkAction = (action: 'read' | 'delete') => {
    selectedNotifications.forEach(id => {
      if (action === 'read') {
        actions.markAsRead(id)
      } else {
        actions.deleteNotification(id)
      }
    })
    setSelectedNotifications([])
  }
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshNotifications()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [refreshNotifications])
  
  if (!dict || (isLoading && notifications.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/25">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                {t.title}
              </h1>
            </div>
            <p className="text-muted-foreground ml-11">{t.subtitle}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshNotifications}
              disabled={isLoading}
              className="border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {t.refresh}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-purple-200 dark:border-purple-800">
                  <Filter className="h-4 w-4 mr-2" />
                  {t.bulkActions}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white dark:bg-gray-900">
                <DropdownMenuLabel>{t.bulkActions} ({selectedNotifications.length})</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleBulkAction('read')}
                  disabled={selectedNotifications.length === 0}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {t.markSelectedAsRead}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleBulkAction('delete')}
                  disabled={selectedNotifications.length === 0}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t.deleteSelected}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              onClick={markAllAsRead}
              disabled={unreadCount === 0 || isLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              {t.markAllAsRead}
            </Button>
          </div>
        </motion.div>
        
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{t.total}</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-200">{stats.total}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-600 dark:text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">{t.unread}</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-200">{stats.unread}</p>
                </div>
                <Eye className="h-8 w-8 text-purple-600 dark:text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.archived}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.archived}</p>
                </div>
                <Archive className="h-8 w-8 text-gray-500 dark:text-gray-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">{t.thisWeek}</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-200">{stats.thisWeek}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card className="sticky top-24 border-purple-200 dark:border-purple-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Filter className="h-4 w-4" />
                  {t.filters}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div className="space-y-2">
                  <Label htmlFor="search">{t.search}</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                    <Input
                      id="search"
                      placeholder={t.search}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-purple-200 dark:border-purple-800 focus:border-purple-500"
                    />
                  </div>
                </div>
                
                {/* Status Filter */}
                <div className="space-y-2">
                  <Label>{t.status}</Label>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant={filterType === 'all' ? 'default' : 'ghost'}
                      className={`justify-start ${filterType === 'all' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : ''}`}
                      onClick={() => setFilterType('all')}
                    >
                      {t.all} ({stats.total})
                    </Button>
                    <Button
                      variant={filterType === 'unread' ? 'default' : 'ghost'}
                      className={`justify-start ${filterType === 'unread' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : ''}`}
                      onClick={() => setFilterType('unread')}
                    >
                      <div className="flex items-center gap-2">
                        {t.unread} ({stats.unread})
                        {stats.unread > 0 && (
                          <Badge variant="secondary" className="ml-auto bg-purple-100 dark:bg-purple-900">
                            {stats.unread}
                          </Badge>
                        )}
                      </div>
                    </Button>
                  </div>
                </div>
                
                {/* Category Filter */}
                <div className="space-y-2">
                  <Label>{t.categories}</Label>
                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2">
                    <Button
                      variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                      className={`justify-start ${selectedCategory === 'all' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : ''}`}
                      onClick={() => setSelectedCategory('all')}
                    >
                      {t.allCategories}
                    </Button>
                    {Object.entries(categoryConfig).map(([category, config]) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'ghost'}
                        className={`justify-start ${selectedCategory === category ? 'bg-gradient-to-r from-purple-600 to-pink-600' : ''}`}
                        onClick={() => setSelectedCategory(category as NotificationCategory)}
                      >
                        <div className="flex items-center gap-2">
                          {config.icon}
                          {config.label} ({stats.byCategory[category as NotificationCategory]})
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Preferences */}
                <div className="space-y-2 pt-4 border-t border-purple-200 dark:border-purple-800">
                  <Label>{t.preferences}</Label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t.showArchived}</span>
                    <Switch
                      checked={showArchived}
                      onCheckedChange={setShowArchived}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t.sortNewest}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="space-y-2 pt-4 border-t border-purple-200 dark:border-purple-800">
                  <Label>{t.quickStats}</Label>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between items-center p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                      <span className="text-muted-foreground">{t.today}:</span>
                      <span className="font-medium text-purple-700 dark:text-purple-300">{stats.today}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                      <span className="text-muted-foreground">{t.thisWeek}:</span>
                      <span className="font-medium text-purple-700 dark:text-purple-300">{stats.thisWeek}</span>
                    </div>
                  </div>
                </div>
                
                {/* Settings Link */}
                <div className="pt-4">
                  <Button variant="outline" className="w-full border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30" asChild>
                    <Link href={`/${lang}/notifications/settings`}>
                      <Settings className="h-4 w-4 mr-2" />
                      {t.settings}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Main Notifications List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
          >
            {/* List Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {filterType === 'unread' ? t.unread : t.all}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {t.showing} {filteredNotifications.length} {t.notificationsFound}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={filteredNotifications.length === 0}
                  className="border-purple-200 dark:border-purple-800"
                >
                  {selectedNotifications.length === filteredNotifications.length ? t.deselectAll : t.selectAll}
                </Button>
              </div>
            </div>
            
            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
              <Card className="border-purple-200 dark:border-purple-800">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mb-4">
                    <Bell className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t.noNotifications}</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    {searchQuery || selectedCategory !== 'all' || filterType !== 'all' 
                      ? t.noNotificationsMatch
                      : t.noNotifications}
                  </p>
                  {(searchQuery || selectedCategory !== 'all' || filterType !== 'all') && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchQuery('')
                        setSelectedCategory('all')
                        setFilterType('all')
                      }}
                      className="border-purple-200 dark:border-purple-800"
                    >
                      {t.resetFilters}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                <div className="space-y-3">
                  {filteredNotifications.map((notification, index) => {
                    const config = categoryConfig[notification.category]
                    const isSelected = selectedNotifications.includes(notification._id)
                    
                    return (
                      <motion.div
                        key={notification._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card 
                          className={`transition-all duration-300 hover:shadow-lg cursor-pointer ${
                            isSelected ? 'ring-2 ring-purple-500' : ''
                          } ${
                            notification.status === 'UNREAD' 
                              ? `border-l-4 border-l-purple-500 bg-purple-50/30 dark:bg-purple-950/20`
                              : 'border-purple-200 dark:border-purple-800'
                          } bg-white dark:bg-gray-900`}
                          onClick={() => {
                            if (notification.actionUrl) {
                              window.location.href = notification.actionUrl
                            }
                            if (notification.status === 'UNREAD') {
                              handleMarkAsRead(notification._id)
                            }
                          }}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                              {/* Checkbox */}
                              <div className="flex-shrink-0 pt-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    setSelectedNotifications(prev =>
                                      prev.includes(notification._id)
                                        ? prev.filter(id => id !== notification._id)
                                        : [...prev, notification._id]
                                    )
                                  }}
                                  className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                                />
                              </div>
                              
                              {/* Icon */}
                              <div className={`p-2.5 rounded-xl ${config.bgColor} flex-shrink-0`}>
                                <div className={config.color}>
                                  {config.icon}
                                </div>
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h3 className={`font-semibold ${
                                        notification.status === 'UNREAD' 
                                          ? 'text-purple-700 dark:text-purple-300' 
                                          : 'text-gray-900 dark:text-white'
                                      }`}>
                                        {notification.title}
                                      </h3>
                                      {notification.priority === 'URGENT' && (
                                        <Badge variant="destructive" className="text-xs animate-pulse">
                                          {t.urgent}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1.5">
                                      {notification.message}
                                    </p>
                                    
                                    {notification.data?.metadata && (
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {Object.entries(notification.data.metadata).slice(0, 3).map(([key, value]) => (
                                          <Badge key={key} variant="outline" className="text-xs border-purple-200 dark:border-purple-800">
                                            {key}: {String(value)}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Actions */}
                                  <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">
                                        {formatDate(notification.createdAt)}
                                      </span>
                                      {notification.status === 'UNREAD' && (
                                        <Badge variant="secondary" className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                                          {t.unreadBadge}
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleMarkAsRead(notification._id)
                                              }}
                                            >
                                              {notification.status === 'UNREAD' ? (
                                                <Eye className="h-4 w-4 text-purple-600" />
                                              ) : (
                                                <EyeOff className="h-4 w-4" />
                                              )}
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            {notification.status === 'UNREAD' ? t.markAsRead : t.markAsUnread}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleDelete(notification._id)
                                              }}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            {t.delete}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                          <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-white dark:bg-gray-900">
                                          <DropdownMenuItem 
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              if (notification.actionUrl) {
                                                window.location.href = notification.actionUrl
                                              }
                                            }}
                                            disabled={!notification.actionUrl}
                                          >
                                            <ChevronRight className="h-4 w-4 mr-2" />
                                            {t.goToPage}
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem 
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              navigator.clipboard.writeText(JSON.stringify(notification, null, 2))
                                            }}
                                          >
                                            {t.copyDetails}
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem 
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleDelete(notification._id)
                                            }}
                                            className="text-red-600"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            {t.deletePermanently}
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </AnimatePresence>
            )}
            
            {/* Footer Stats */}
            {filteredNotifications.length > 0 && (
              <div className="mt-6 pt-6 border-t border-purple-200 dark:border-purple-800">
                <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span>
                      {t.showing} {filteredNotifications.length} {t.notificationsFound}
                      {selectedNotifications.length > 0 && ` (${selectedNotifications.length} ${t.selected})`}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      {unreadCount > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400">{unreadCount} {t.unread}</span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">{t.allRead}</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t.lastUpdate}: {state.lastUpdated ? format(new Date(state.lastUpdated), 'HH:mm') : '--:--'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}