// app/notifications/page.tsx
"use client"

import { useState, useEffect, useMemo } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
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
  ChevronRight
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
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import type { Notifications, NotificationCategory } from '@/types/notifications'

// Type for notification filter
type NotificationType = 'all' | 'unread' | 'projects' | 'messages' | 'payments' | 'system'

// Category mapping
const CATEGORY_CONFIG: Record<NotificationCategory, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  MESSAGE: {
    label: 'Messages',
    icon: <MessageSquare className="h-4 w-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900'
  },
  ORDER: {
    label: 'Commandes',
    icon: <DollarSign className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900'
  },
  REVIEW: {
    label: 'Avis',
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900'
  },
  SYSTEM: {
    label: 'Système',
    icon: <Bell className="h-4 w-4" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800'
  },
  PROMOTION: {
    label: 'Promotions',
    icon: <Megaphone className="h-4 w-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900'
  },
  SECURITY: {
    label: 'Sécurité',
    icon: <Shield className="h-4 w-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900'
  },
  COMMUNITY: {
    label: 'Communauté',
    icon: <Users className="h-4 w-4" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900'
  },
  ACHIEVEMENT: {
    label: 'Réussites',
    icon: <Trophy className="h-4 w-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900'
  }
}

export default function NotificationsPage() {
  const { state, actions } = useNotifications()
  const { notifications, unreadCount, isLoading, preferences } = state
  const { markAsRead, markAllAsRead, deleteNotification, refreshNotifications } = actions
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<NotificationType>('all')
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'all'>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  
  // Filter and sort notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications.filter(notification => {
      // Filter by archived status
      if (!showArchived && notification.status === 'ARCHIVED') return false
      
      // Filter by type
      if (filterType === 'unread' && notification.status !== 'UNREAD') return false
      if (filterType === 'projects' && notification.category !== 'ORDER') return false
      if (filterType === 'messages' && notification.category !== 'MESSAGE') return false
      if (filterType === 'payments' && notification.category !== 'ORDER') return false
      if (filterType === 'system' && notification.category !== 'SYSTEM') return false
      
      // Filter by category
      if (selectedCategory !== 'all' && notification.category !== selectedCategory) return false
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          notification.title.toLowerCase().includes(query) ||
          notification.message.toLowerCase().includes(query)
        )
      }
      
      return true
    })
    
    // Sort
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
    
    return { total, unread, archived, byCategory }
  }, [notifications])
  
  // Format date
  const formatDate = (date: Date) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffInHours = (now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return formatDistanceToNow(notificationDate, { addSuffix: true, locale: fr })
    } else if (diffInHours < 48) {
      return 'Hier'
    } else if (diffInHours < 168) { // 7 days
      return format(notificationDate, 'EEEE', { locale: fr })
    } else {
      return format(notificationDate, 'dd/MM/yyyy')
    }
  }
  
  // Handle notification actions
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
  
  // Refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshNotifications()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [refreshNotifications])
  
  if (isLoading && notifications.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Gérez toutes vos notifications en un seul endroit
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshNotifications}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Actions groupées
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions pour {selectedNotifications.length} notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleBulkAction('read')}
                disabled={selectedNotifications.length === 0}
              >
                <Check className="h-4 w-4 mr-2" />
                Marquer comme lu
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleBulkAction('delete')}
                disabled={selectedNotifications.length === 0}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || isLoading}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total des notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Non lues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.unread}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Archivées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.archived}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Filters */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Rechercher</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Statut</Label>
                <div className="flex flex-col gap-2">
                  <Button
                    variant={filterType === 'all' ? 'default' : 'ghost'}
                    className="justify-start"
                    onClick={() => setFilterType('all')}
                  >
                    Toutes ({stats.total})
                  </Button>
                  <Button
                    variant={filterType === 'unread' ? 'default' : 'ghost'}
                    className="justify-start"
                    onClick={() => setFilterType('unread')}
                  >
                    <div className="flex items-center gap-2">
                      Non lues ({stats.unread})
                      {stats.unread > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {stats.unread}
                        </Badge>
                      )}
                    </div>
                  </Button>
                </div>
              </div>
              
              {/* Category Filter */}
              <div className="space-y-2">
                <Label>Catégories</Label>
                <div className="flex flex-col gap-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                    className="justify-start"
                    onClick={() => setSelectedCategory('all')}
                  >
                    Toutes les catégories
                  </Button>
                  {Object.entries(CATEGORY_CONFIG).map(([category, config]) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'ghost'}
                      className="justify-start"
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
              <div className="space-y-2">
                <Label>Préférences</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Afficher les archivées</span>
                  <Switch
                    checked={showArchived}
                    onCheckedChange={setShowArchived}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Trier du plus récent</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="space-y-2">
                <Label>Statistiques rapides</Label>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total aujourd'hui:</span>
                    <span className="font-medium">
                      {notifications.filter(n => {
                        const today = new Date()
                        const notifDate = new Date(n.createdAt)
                        return notifDate.toDateString() === today.toDateString()
                      }).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cette semaine:</span>
                    <span className="font-medium">
                      {notifications.filter(n => {
                        const weekAgo = new Date()
                        weekAgo.setDate(weekAgo.getDate() - 7)
                        return new Date(n.createdAt) > weekAgo
                      }).length}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Settings Link */}
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/notifications/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Paramètres des notifications
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Notifications List */}
        <div className="lg:col-span-3">
          {/* List Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                {filterType === 'unread' ? 'Notifications non lues' : 'Toutes les notifications'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''} trouvée{filteredNotifications.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredNotifications.length === 0}
              >
                {selectedNotifications.length === filteredNotifications.length ? 'Désélectionner tout' : 'Sélectionner tout'}
              </Button>
            </div>
          </div>
          
          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune notification</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchQuery || selectedCategory !== 'all' || filterType !== 'all' 
                    ? "Aucune notification ne correspond à vos filtres."
                    : "Vous n'avez pas encore de notifications."}
                </p>
                {(searchQuery || selectedCategory !== 'all' || filterType !== 'all') && (
                  <Button variant="outline" onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('all')
                    setFilterType('all')
                  }}>
                    Réinitialiser les filtres
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const categoryConfig = CATEGORY_CONFIG[notification.category]
                const isSelected = selectedNotifications.includes(notification._id)
                
                return (
                  <Card 
                    key={notification._id} 
                    className={`transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-blue-500' : ''
                    } ${
                      notification.status === 'UNREAD' 
                        ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800' 
                        : ''
                    }`}
                    onClick={() => {
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl
                      }
                      if (notification.status === 'UNREAD') {
                        handleMarkAsRead(notification._id)
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Checkbox for selection */}
                        <div className="flex-shrink-0">
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
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                        
                        {/* Category Icon */}
                        <div className={`p-2 rounded-full ${categoryConfig.bgColor} flex-shrink-0`}>
                          <div className={categoryConfig.color}>
                            {categoryConfig.icon}
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className={`font-semibold ${
                                  notification.status === 'UNREAD' ? 'text-blue-700 dark:text-blue-300' : ''
                                }`}>
                                  {notification.title}
                                </h3>
                                {notification.priority === 'URGENT' && (
                                  <Badge variant="destructive" className="text-xs">
                                    URGENT
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              
                              {/* Metadata */}
                              {notification.data?.metadata && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {Object.entries(notification.data.metadata).map(([key, value]) => (
                                    <Badge key={key} variant="outline" className="text-xs">
                                      {key}: {String(value)}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Time and Actions */}
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(notification.createdAt)}
                                </span>
                                {notification.status === 'UNREAD' && (
                                  <Badge variant="secondary" className="text-xs">
                                    Non lu
                                  </Badge>
                                )}
                                {notification.status === 'ARCHIVED' && (
                                  <Archive className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleMarkAsRead(notification._id)
                                        }}
                                      >
                                        {notification.status === 'UNREAD' ? (
                                          <Eye className="h-4 w-4" />
                                        ) : (
                                          <EyeOff className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {notification.status === 'UNREAD' ? 'Marquer comme lu' : 'Marquer comme non lu'}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDelete(notification._id)
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Supprimer
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
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
                                      Aller à la page
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        navigator.clipboard.writeText(JSON.stringify(notification, null, 2))
                                      }}
                                    >
                                      Copier les détails
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
                                      Supprimer définitivement
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
                )
              })}
            </div>
          )}
          
          {/* Pagination Stats */}
          {filteredNotifications.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  Affichage de {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                  {selectedNotifications.length > 0 && ` (${selectedNotifications.length} sélectionnée${selectedNotifications.length !== 1 ? 's' : ''})`}
                </div>
                <div className="flex items-center gap-4">
                  <span>
                    {unreadCount > 0 ? `${unreadCount} non lue${unreadCount !== 1 ? 's' : ''}` : 'Tout est lu'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Dernière mise à jour: {state.lastUpdated ? format(state.lastUpdated, 'HH:mm') : '--:--'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}