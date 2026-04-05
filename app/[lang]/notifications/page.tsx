"use client"

import { useState, useEffect, useMemo, useRef } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { useParams, useRouter } from 'next/navigation'
import {
  Bell, Check, CheckCheck, Trash2, Search, Settings,
  MessageCircle, Wallet, Star, Gift, Lock, Users, Award,
  Eye, ArrowLeft, RefreshCw, ChevronRight, SlidersHorizontal,
  X, Filter, MoreHorizontal, AlertTriangle, TrendingUp,
  Archive, Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow, format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import type { NotificationCategory } from '@/types/notifications'

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'unread' | 'MESSAGE' | 'ORDER' | 'REVIEW' | 'SYSTEM' | 'PROMOTION' | 'SECURITY' | 'COMMUNITY' | 'ACHIEVEMENT'

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<NotificationCategory, {
  label: string
  icon: React.ReactNode
  pill: string
  dot: string
  border: string
  bg: string
}> = {
  MESSAGE:     { label: 'Messages',     icon: <MessageCircle className="h-4 w-4" />, pill: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',     dot: 'bg-blue-500',    border: 'border-l-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950/30' },
  ORDER:       { label: 'Orders',       icon: <Wallet        className="h-4 w-4" />, pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', dot: 'bg-emerald-500', border: 'border-l-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  REVIEW:      { label: 'Reviews',      icon: <Star          className="h-4 w-4" />, pill: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',  dot: 'bg-yellow-500',  border: 'border-l-yellow-500',  bg: 'bg-yellow-50 dark:bg-yellow-950/30' },
  SYSTEM:      { label: 'System',       icon: <Settings      className="h-4 w-4" />, pill: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',       dot: 'bg-slate-400',   border: 'border-l-slate-400',   bg: 'bg-slate-50 dark:bg-slate-800/30' },
  PROMOTION:   { label: 'Promotions',   icon: <Gift          className="h-4 w-4" />, pill: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',   dot: 'bg-purple-500',  border: 'border-l-purple-500',  bg: 'bg-purple-50 dark:bg-purple-950/30' },
  SECURITY:    { label: 'Security',     icon: <Lock          className="h-4 w-4" />, pill: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',               dot: 'bg-red-500',     border: 'border-l-red-500',     bg: 'bg-red-50 dark:bg-red-950/30' },
  COMMUNITY:   { label: 'Community',    icon: <Users         className="h-4 w-4" />, pill: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',   dot: 'bg-indigo-500',  border: 'border-l-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  ACHIEVEMENT: { label: 'Achievements', icon: <Award         className="h-4 w-4" />, pill: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',       dot: 'bg-amber-500',   border: 'border-l-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950/30' },
}

const FILTER_CHIPS: { id: FilterType; label: string }[] = [
  { id: 'all',         label: 'All' },
  { id: 'unread',      label: 'Unread' },
  { id: 'MESSAGE',     label: 'Messages' },
  { id: 'ORDER',       label: 'Orders' },
  { id: 'REVIEW',      label: 'Reviews' },
  { id: 'SYSTEM',      label: 'System' },
  { id: 'PROMOTION',   label: 'Promotions' },
  { id: 'SECURITY',    label: 'Security' },
  { id: 'COMMUNITY',   label: 'Community' },
  { id: 'ACHIEVEMENT', label: 'Achievements' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useFormatDate(lang: string) {
  const locale = lang === 'fr' || lang === 'mg' ? fr : enUS
  return (date: Date) => {
    const now = new Date()
    const d = new Date(date)
    const diffH = (now.getTime() - d.getTime()) / 3_600_000
    if (diffH < 24)  return formatDistanceToNow(d, { addSuffix: true, locale })
    if (diffH < 48)  return lang === 'fr' ? 'Hier' : lang === 'mg' ? 'Omaly' : 'Yesterday'
    if (diffH < 168) return format(d, 'EEEE', { locale })
    return format(d, 'dd/MM/yyyy')
  }
}

function groupByDate(notifications: any[]) {
  const today   = new Date(); today.setHours(0,0,0,0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1)
  const weekAgo   = new Date(today); weekAgo.setDate(weekAgo.getDate()-7)

  const groups: { label: string; items: any[] }[] = [
    { label: 'Today',     items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'This week', items: [] },
    { label: 'Earlier',   items: [] },
  ]
  for (const n of notifications) {
    const d = new Date(n.createdAt); d.setHours(0,0,0,0)
    if (d >= today)          groups[0].items.push(n)
    else if (d >= yesterday) groups[1].items.push(n)
    else if (d >= weekAgo)   groups[2].items.push(n)
    else                     groups[3].items.push(n)
  }
  return groups.filter(g => g.items.length > 0)
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatPill({ value, label, accent }: { value: number; label: string; accent?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 px-3 py-2 min-w-[60px]">
      <span className={cn("text-xl font-semibold tabular-nums", accent ?? "text-slate-800 dark:text-white")}>
        {value}
      </span>
      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">{label}</span>
    </div>
  )
}

function CategoryIcon({ category, size = 'md' }: { category: NotificationCategory; size?: 'sm' | 'md' }) {
  const cfg = CATEGORY_CONFIG[category]
  return (
    <div className={cn(
      "flex items-center justify-center rounded-xl flex-shrink-0",
      cfg.bg,
      size === 'sm' ? "w-8 h-8" : "w-10 h-10"
    )}>
      <span className={cn(
        "text-current",
        size === 'sm' ? "[&>svg]:h-3.5 [&>svg]:w-3.5" : "[&>svg]:h-4 [&>svg]:w-4"
      )}>
        {cfg.icon}
      </span>
    </div>
  )
}

function NotifCard({
  notification,
  selected,
  onSelect,
  onMarkRead,
  onDelete,
  formatDate,
}: {
  notification: any
  selected: boolean
  onSelect: () => void
  onMarkRead: () => void
  onDelete: () => void
  formatDate: (d: Date) => string
}) {
  const cfg = CATEGORY_CONFIG[notification.category as NotificationCategory]
  const isUnread = notification.status === 'UNREAD'
  const isUrgent = notification.priority === 'URGENT'

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 px-4 py-4 transition-colors cursor-pointer",
        "border-b border-slate-100 dark:border-gray-800/60",
        "active:bg-slate-50 dark:active:bg-gray-800/50",
        isUnread && "bg-white dark:bg-gray-900",
        !isUnread && "bg-slate-50/50 dark:bg-gray-900/30",
        selected && "bg-purple-50/60 dark:bg-purple-950/20",
      )}
      onClick={() => { if (isUnread) onMarkRead() }}
    >
      {/* Unread accent bar */}
      {isUnread && (
        <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full", cfg.dot.replace('bg-', 'bg-'))} />
      )}

      {/* Select checkbox */}
      <button
        className={cn(
          "mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors",
          selected
            ? "bg-purple-600 border-purple-600"
            : "border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900"
        )}
        onClick={(e) => { e.stopPropagation(); onSelect() }}
      >
        {selected && <Check className="h-3 w-3 text-white" />}
      </button>

      {/* Icon */}
      <CategoryIcon category={notification.category} />

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className={cn(
                "text-sm leading-snug",
                isUnread ? "font-semibold text-slate-900 dark:text-white" : "font-medium text-slate-600 dark:text-slate-400"
              )}>
                {notification.title}
              </p>
              {isUrgent && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 px-1.5 py-0.5 rounded-md">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  URGENT
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {notification.message}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", cfg.pill)}>
                {cfg.label}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {formatDate(notification.createdAt)}
              </span>
              {isUnread && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-0.5 flex-shrink-0 -mr-1">
            <button
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
              onClick={(e) => { e.stopPropagation(); onMarkRead() }}
              title={isUnread ? "Mark as read" : "Already read"}
            >
              <Eye className={cn("h-3.5 w-3.5", isUnread ? "text-purple-500" : "text-slate-300 dark:text-gray-600")} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
                  <MoreHorizontal className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-sm">
                {notification.actionUrl && (
                  <>
                    <DropdownMenuItem onClick={() => { window.location.href = notification.actionUrl }}>
                      <ChevronRight className="h-3.5 w-3.5 mr-2" />
                      Go to page
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMarkRead() }}>
                  <Eye className="h-3.5 w-3.5 mr-2" />
                  {isUnread ? 'Mark as read' : 'Mark as unread'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={(e) => { e.stopPropagation(); onDelete() }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Filter Bottom Sheet ──────────────────────────────────────────────────────

function FilterSheet({
  open,
  onOpenChange,
  showArchived,
  onShowArchivedChange,
  sortBy,
  onSortByChange,
  stats,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  showArchived: boolean
  onShowArchivedChange: (v: boolean) => void
  sortBy: 'newest' | 'oldest'
  onSortByChange: (v: 'newest' | 'oldest') => void
  stats: { byCategory: Record<NotificationCategory, number>; today: number; thisWeek: number }
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto px-0 pb-safe">
        <SheetHeader className="px-4 pb-4 border-b border-slate-100 dark:border-gray-800">
          <SheetTitle className="text-base font-semibold">Filters & Settings</SheetTitle>
        </SheetHeader>

        <div className="px-4 py-4 space-y-6">
          {/* Sort */}
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Sort by</p>
            <div className="grid grid-cols-2 gap-2">
              {(['newest', 'oldest'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => onSortByChange(s)}
                  className={cn(
                    "py-2.5 px-4 rounded-xl text-sm font-medium border transition-colors",
                    sortBy === s
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-300"
                  )}
                >
                  {s === 'newest' ? 'Newest first' : 'Oldest first'}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Options</p>
            <div className="flex items-center justify-between py-3 px-4 bg-slate-50 dark:bg-gray-800/50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">Show archived</p>
                <p className="text-xs text-slate-400 mt-0.5">Include archived notifications</p>
              </div>
              <Switch checked={showArchived} onCheckedChange={onShowArchivedChange} />
            </div>
          </div>

          {/* Category breakdown */}
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Category breakdown</p>
            <div className="space-y-1">
              {(Object.entries(CATEGORY_CONFIG) as [NotificationCategory, typeof CATEGORY_CONFIG[NotificationCategory]][]).map(([cat, cfg]) => (
                <div key={cat} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800/50">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("p-1.5 rounded-lg", cfg.bg)}>
                      <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{cfg.icon}</span>
                    </div>
                    <span className="text-sm text-slate-700 dark:text-slate-300">{cfg.label}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                    {stats.byCategory[cat] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Activity</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3">
                <p className="text-2xl font-semibold text-purple-700 dark:text-purple-300 tabular-nums">{stats.today}</p>
                <p className="text-xs text-purple-500 mt-0.5">Today</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3">
                <p className="text-2xl font-semibold text-blue-700 dark:text-blue-300 tabular-nums">{stats.thisWeek}</p>
                <p className="text-xs text-blue-500 mt-0.5">This week</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-6">
          <Button asChild variant="outline" className="w-full rounded-xl border-slate-200 dark:border-gray-700">
            <Link href="notifications/settings">
              <Settings className="h-4 w-4 mr-2" />
              Notification settings
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const params  = useParams()
  const router  = useRouter()
  const lang    = (params?.lang as Locale) || 'fr'

  const [dict, setDict] = useState<any>(null)
  const { state, actions } = useNotifications()
  const { notifications, unreadCount, isLoading } = state
  const { markAsRead, markAllAsRead, deleteNotification, refreshNotifications } = actions

  const [search,          setSearch]          = useState('')
  const [filter,          setFilter]          = useState<FilterType>('all')
  const [showArchived,    setShowArchived]    = useState(false)
  const [sortBy,          setSortBy]          = useState<'newest' | 'oldest'>('newest')
  const [selected,        setSelected]        = useState<string[]>([])
  const [filterOpen,      setFilterOpen]      = useState(false)
  const [searchFocused,   setSearchFocused]   = useState(false)

  const chipScrollRef = useRef<HTMLDivElement>(null)
  const formatDate    = useFormatDate(lang)

  useEffect(() => { getDictionarySafe(lang).then(setDict) }, [lang])

  // Auto-refresh
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') refreshNotifications()
    }, 30_000)
    return () => clearInterval(id)
  }, [refreshNotifications])

  const filtered = useMemo(() => {
    let list = notifications.filter(n => {
      if (!showArchived && n.status === 'ARCHIVED') return false
      if (filter === 'unread'  && n.status !== 'UNREAD') return false
      if (filter !== 'all' && filter !== 'unread' && n.category !== filter) return false
      if (search) {
        const q = search.toLowerCase()
        return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)
      }
      return true
    })
    list.sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return sortBy === 'newest' ? diff : -diff
    })
    return list
  }, [notifications, filter, search, showArchived, sortBy])

  const stats = useMemo(() => {
    const byCategory = {} as Record<NotificationCategory, number>
    for (const cat of Object.keys(CATEGORY_CONFIG) as NotificationCategory[]) {
      byCategory[cat] = notifications.filter(n => n.category === cat).length
    }
    const today = new Date(); today.setHours(0,0,0,0)
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate()-7)
    return {
      total:    notifications.length,
      unread:   notifications.filter(n => n.status === 'UNREAD').length,
      archived: notifications.filter(n => n.status === 'ARCHIVED').length,
      today:    notifications.filter(n => new Date(n.createdAt) >= today).length,
      thisWeek: notifications.filter(n => new Date(n.createdAt) >= weekAgo).length,
      byCategory,
    }
  }, [notifications])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  const toggleSelect = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const selectAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map(n => n._id))

  const bulkRead   = () => { selected.forEach(markAsRead);          setSelected([]) }
  const bulkDelete = () => { selected.forEach(deleteNotification);  setSelected([]) }

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (!dict || (isLoading && notifications.length === 0)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-slate-100 dark:border-gray-800 px-4 py-4">
          <Skeleton className="h-7 w-40 mb-3" />
          <div className="flex gap-2">
            {[...Array(4)].map((_,i) => <Skeleton key={i} className="h-16 flex-1 rounded-xl" />)}
          </div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-gray-800">
          {[...Array(6)].map((_,i) => (
            <div key={i} className="flex gap-3 px-4 py-4">
              <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 pb-safe">

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-slate-100 dark:border-gray-800">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white leading-none">
                  Notifications
                </h1>
                {stats.unread > 0 && (
                  <span className="text-xs font-semibold bg-purple-600 text-white px-2 py-0.5 rounded-full">
                    {stats.unread}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {stats.total} total · {stats.unread} unread
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshNotifications()}
              disabled={isLoading}
              className="p-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </button>
            <button
              onClick={() => setFilterOpen(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors relative"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {(showArchived || sortBy === 'oldest') && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-purple-500" />
              )}
            </button>
          </div>
        </div>

        {/* Stats pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
          <StatPill value={stats.total}    label="Total"     />
          <StatPill value={stats.unread}   label="Unread"    accent="text-purple-600 dark:text-purple-400" />
          <StatPill value={stats.archived} label="Archived"  />
          <StatPill value={stats.thisWeek} label="This week" accent="text-emerald-600 dark:text-emerald-400" />
        </div>

        {/* Search bar */}
        <div className="px-4 pb-3">
          <div className={cn(
            "flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors",
            searchFocused
              ? "border-purple-400 dark:border-purple-600 bg-white dark:bg-gray-900"
              : "border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50"
          )}>
            <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <input
              type="search"
              placeholder="Search notifications…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="flex-1 bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter chips */}
        <div
          ref={chipScrollRef}
          className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none"
        >
          {FILTER_CHIPS.map(chip => (
            <button
              key={chip.id}
              onClick={() => setFilter(chip.id)}
              className={cn(
                "flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors",
                filter === chip.id
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-400 hover:border-purple-300 dark:hover:border-purple-700"
              )}
            >
              {chip.label}
              {chip.id === 'unread' && stats.unread > 0 && (
                <span className="ml-1.5 bg-white/20 px-1 py-0.5 rounded-full text-[10px]">
                  {stats.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bulk action bar ────────────────────────────────────────────────── */}
      {selected.length > 0 && (
        <div className="sticky top-[calc(var(--header-h,220px))] z-10 flex items-center justify-between px-4 py-2.5 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-100 dark:border-purple-900">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelected([])}
              className="p-1 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
            >
              <X className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </button>
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              {selected.length} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={bulkRead}
              className="flex items-center gap-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 px-3 py-1.5 rounded-lg"
            >
              <Eye className="h-3.5 w-3.5" /> Mark read
            </button>
            <button
              onClick={bulkDelete}
              className="flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900 px-3 py-1.5 rounded-lg"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>
      )}

      {/* ── List header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <button
              onClick={selectAll}
              className="text-xs font-medium text-purple-600 dark:text-purple-400"
            >
              {selected.length === filtered.length ? 'Deselect all' : 'Select all'}
            </button>
          )}
          {stats.unread > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* ── Notification groups ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Bell className="h-7 w-7 text-slate-300 dark:text-gray-600" />
          </div>
          <p className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">No notifications</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">
            {search || filter !== 'all'
              ? 'No notifications match your current filters.'
              : "You're all caught up!"}
          </p>
          {(search || filter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setFilter('all') }}
              className="text-sm font-medium text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 px-4 py-2 rounded-xl"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border-t border-slate-100 dark:border-gray-800 divide-y-0">
          {grouped.map(group => (
            <div key={group.label}>
              {/* Date group label */}
              <div className="px-4 py-2 bg-slate-50 dark:bg-gray-950 border-y border-slate-100 dark:border-gray-800">
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {group.label}
                </p>
              </div>
              {group.items.map(n => (
                <NotifCard
                  key={n._id}
                  notification={n}
                  selected={selected.includes(n._id)}
                  onSelect={() => toggleSelect(n._id)}
                  onMarkRead={() => markAsRead(n._id)}
                  onDelete={() => deleteNotification(n._id)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between px-4 py-4 text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Updated {state.lastUpdated ? format(new Date(state.lastUpdated), 'HH:mm') : '--:--'}
            </span>
          </div>
          {stats.unread === 0 ? (
            <span className="flex items-center gap-1 text-emerald-500">
              <CheckCheck className="h-3.5 w-3.5" /> All caught up
            </span>
          ) : (
            <span className="text-amber-500">{stats.unread} unread</span>
          )}
        </div>
      )}

      {/* ── Filter sheet ──────────────────────────────────────────────────── */}
      <FilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        stats={stats}
      />
    </div>
  )
}