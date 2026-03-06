'use client'

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/home/hero-section"
import { StatsOverview } from "@/components/home/stats-overview"
import { QuickActions } from "@/components/home/quick-actions"
import { CategoryFilters } from "@/components/home/category-filters"
import { Testimonials } from "@/components/home/testimonials"
import { Footer } from "@/components/footer"
import { CalendarPopup } from "@/components/home/calendar-popup"
import { IDEPopup } from "@/components/home/ide-popup"
import { PostView } from "@/components/groups/GroupPosts/PostView"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search, Sparkles, MessageSquare, Clock, ArrowLeft,
  RefreshCw, CheckCircle2, Eye, Heart, Bookmark,
  DollarSign, Star, Zap, Users, ChevronRight,
  TrendingUp, X,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getDictionarySafe } from "@/lib/i18n/dictionaries"
import type { Locale } from "@/lib/i18n/config"

// ─── Types ─────────────────────────────────────────────────────
type ItemType = "group_post" | "project" | "gig" | "ai_match"
type FeedTab  = "all" | "group_post" | "project" | "gig"

interface FeedItem {
  _id: string
  type: ItemType
  createdAt: string
  title?: string
  content?: string
  description?: string
  author?:  { _id: string; name: string; avatar?: string; title?: string }
  group?:   { _id: string; name: string; avatar?: string; slug?: string }
  reactionCounts?: { like: number; love: number; insightful: number }
  commentCount?: number
  shareCount?:   number
  viewCount?:    number
  views?:        number
  images?:       string[]
  budget?:  { min: number; max: number; currency: string; type: "fixed" | "hourly" }
  skills?:  string[]
  deadline?: string
  location?: { city?: string; country?: string; type?: string }
  applicationCount?: number
  client?:  { _id: string; name: string; avatar?: string; rating?: number }
  price?:        number
  currency?:     string
  deliveryTime?: number
  tags?:         string[]
  rating?:       number
  ordersCount?:  number
  seller?: { _id: string; name: string; avatar?: string; title?: string }
  matchScore?:   number
  matchedSkills?: string[]
  reason?:       string
}

// ─── Type config (couleurs par type) ─────────────────────────
const T = {
  group_post: {
    label: "Publication", emoji: "📝",
    bg: "bg-violet-500", lightBg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-l-violet-400",
    badge: "text-violet-700 bg-violet-100 dark:text-violet-300 dark:bg-violet-900/40",
    dot: "bg-violet-400",
  },
  project: {
    label: "Projet", emoji: "💼",
    bg: "bg-blue-500", lightBg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-l-blue-400",
    badge: "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/40",
    dot: "bg-blue-400",
  },
  gig: {
    label: "Service", emoji: "⚡",
    bg: "bg-amber-500", lightBg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-l-amber-400",
    badge: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40",
    dot: "bg-amber-400",
  },
  ai_match: {
    label: "Match IA", emoji: "🤖",
    bg: "bg-emerald-500", lightBg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-l-emerald-400",
    badge: "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/40",
    dot: "bg-emerald-400",
  },
} as const

const TABS: { key: FeedTab; label: string; emoji: string }[] = [
  { key: "all",        label: "Tout",        emoji: "🌐" },
  { key: "group_post", label: "Publications", emoji: "📝" },
  { key: "project",    label: "Projets",      emoji: "💼" },
  { key: "gig",        label: "Services",     emoji: "⚡" },
]

// ─── Helpers ──────────────────────────────────────────────────
function fmtTime(date: string) {
  const ms = Date.now() - new Date(date).getTime()
  const m = Math.floor(ms / 60000)
  const h = Math.floor(ms / 3600000)
  const d = Math.floor(ms / 86400000)
  if (m < 1) return "À l'instant"
  if (m < 60) return `${m}m`
  if (h < 24) return `${h}h`
  if (d === 1) return "Hier"
  return `${d}j`
}

function fmtBudget(b?: FeedItem["budget"]) {
  if (!b) return null
  return `${b.min}–${b.max} ${b.currency}${b.type === "hourly" ? "/h" : ""}`
}

function fmtDeadline(d?: string) {
  if (!d) return null
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  if (days < 0)  return "Expiré"
  if (days === 0) return "Aujourd'hui"
  if (days < 7)  return `${days}j`
  if (days < 30) return `${Math.ceil(days / 7)}sem`
  return `${Math.ceil(days / 30)}mois`
}

function mergeAndSort(data: any): FeedItem[] {
  const norm = (arr: any[], type: ItemType, extra?: (x: any) => Partial<FeedItem>) =>
    (arr || []).map(x => ({ ...x, type, createdAt: x.createdAt || new Date().toISOString(), ...(extra?.(x) ?? {}) }))

  return [
    ...norm(data.groupPosts, "group_post"),
    ...norm(data.projects,   "project"),
    ...norm(data.gigs,       "gig", g => ({
      images: (g.images || []).map((i: any) => (typeof i === "string" ? i : i?.url)).filter(Boolean),
    })),
    ...norm(data.aiMatches,  "ai_match", m => ({
      skills: m.matchedSkills,
      matchScore: m.matchScore || m.score,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// ══════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════
export default function HomePage() {
  const params  = useParams()
  const lang    = params.lang as Locale
  const { data: session } = useSession()
  const router  = useRouter()

  const [searchQuery,    setSearchQuery]    = useState("")
  const [debSearch,      setDebSearch]      = useState("")
  const [selectedCat,    setSelectedCat]    = useState("all")
  const [activeTab,      setActiveTab]      = useState<FeedTab>("all")
  const [feed,           setFeed]           = useState<FeedItem[]>([])
  const [loading,        setLoading]        = useState(true)
  const [hasMore,        setHasMore]        = useState(true)
  const [page,           setPage]           = useState(1)
  const [dict,           setDict]           = useState<any>(null)
  const [searchOpen,     setSearchOpen]     = useState(false)
  const [showCalendar,   setShowCalendar]   = useState(false)
  const [showIDE,        setShowIDE]        = useState(false)
  const [selectedPost,   setSelectedPost]   = useState<{ postId: string; groupId: string } | null>(null)

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setDebSearch(searchQuery), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  // dict
  useEffect(() => {
    let ok = true
    getDictionarySafe(lang).then(d => { if (ok) setDict(d) })
    return () => { ok = false }
  }, [lang])

  // popups
  useEffect(() => {
    if (!session?.user) return
    const t1 = setTimeout(() => {
      if (!localStorage.getItem("hasSeenCalendarPopup")) { setShowCalendar(true); localStorage.setItem("hasSeenCalendarPopup","true") }
    }, 5000)
    const t2 = setTimeout(() => {
      if (!localStorage.getItem("hasSeenIDEPopup")) { setShowIDE(true); localStorage.setItem("hasSeenIDEPopup","true") }
    }, 10000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [session])

  // load
  const loadFeed = useCallback(async (reset = false) => {
    if (!dict) return
    setLoading(true)
    try {
      const p = reset ? 1 : page
      const qs = new URLSearchParams({
        page: p.toString(), limit: "20",
        category: selectedCat !== "all" ? selectedCat : "",
        search: debSearch,
      })
      const res = await fetch(`/api/feed/unified?${qs}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const items = mergeAndSort(data)
      setFeed(prev => reset ? items : [...prev, ...items])
      setHasMore(data.hasMore)
      if (reset) setPage(2); else setPage(p + 1)
    } catch {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [page, selectedCat, debSearch, dict])

  useEffect(() => { if (dict) { setPage(1); loadFeed(true) } }, [selectedCat, debSearch, dict])

  // infinite scroll
  useEffect(() => {
    const fn = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 800 && !loading && hasMore)
        loadFeed()
    }
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [loading, hasMore, loadFeed])

  const filtered = activeTab === "all" ? feed : feed.filter(i => i.type === activeTab)
  const counts = {
    all:        feed.length,
    group_post: feed.filter(i => i.type === "group_post").length,
    project:    feed.filter(i => i.type === "project").length,
    gig:        feed.filter(i => i.type === "gig").length,
  }

  // ── PostView ──
  if (selectedPost) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f]">
        <Navigation />
        <main className="pt-16">
          <div className="mx-auto px-4 py-6 max-w-2xl">
            <button
              onClick={() => setSelectedPost(null)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Retour au fil
            </button>
            <PostView
              postId={selectedPost.postId}
              groupId={selectedPost.groupId}
              isMember={true}
              userRole={session?.user?.role as string}
              onBack={() => setSelectedPost(null)}
            />
          </div>
        </main>
        <Footer dict={dict} lang={lang} />
      </div>
    )
  }

  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0c0c11]">
      <Navigation />
      <main className="pt-16">

        <HeroSection user={session?.user} onSearch={setSearchQuery}
          onCalendarClick={() => setShowCalendar(true)} onIDEClick={() => setShowIDE(true)}
          dict={dict} lang={lang} />
        <StatsOverview dict={dict} />
        <QuickActions user={session?.user} onIDEClick={() => setShowIDE(true)} dict={dict} />

        {/* ── Feed ── */}
        <div className="mx-auto max-w-2xl px-3 sm:px-4 py-6">

          {/* Sticky controls */}
          <div className="sticky top-16 z-30 -mx-3 sm:-mx-4 px-3 sm:px-4 pt-2 pb-3
                          bg-[#f8f9fc]/95 dark:bg-[#0c0c11]/95 backdrop-blur-md
                          border-b border-slate-200/60 dark:border-slate-800/60">

            {/* Row 1: title + actions */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 shrink-0">
                <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3 h-3 text-white" />
                </span>
                Actualités
                <span className="text-xs font-normal text-slate-400 ml-0.5">{counts.all}</span>
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSearchOpen(v => !v)}
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                    searchOpen
                      ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500"
                  )}
                >
                  {searchOpen ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => { setPage(1); loadFeed(true); toast.success("Actualisé") }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900
                             border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 transition-colors"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                </button>
              </div>
            </div>

            {/* Search bar */}
            <div className={cn("overflow-hidden transition-all duration-300", searchOpen ? "max-h-12 mb-2" : "max-h-0")}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <Input
                  autoFocus={searchOpen}
                  placeholder="Rechercher projets, services, posts…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            {/* Category filters */}
            <div className="mb-2">
              <CategoryFilters
                selectedCategory={selectedCat}
                onCategoryChange={c => { setSelectedCat(c); setPage(1) }}
                dict={dict}
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-200",
                    activeTab === tab.key
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500"
                  )}
                >
                  {tab.emoji} {tab.label}
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full ml-0.5",
                    activeTab === tab.key ? "bg-white/20 dark:bg-black/20" : "bg-slate-100 dark:bg-slate-800"
                  )}>
                    {counts[tab.key]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-3 pt-4">
            {filtered.map((item, i) => (
              <FeedCard
                key={`${item.type}-${item._id}-${i}`}
                item={item}
                index={i}
                onGroupPostClick={(postId, groupId) => setSelectedPost({ postId, groupId })}
                onProjectClick={id => router.push(`/projects/${id}`)}
                onGigClick={id => router.push(`/gigs/${id}`)}
                session={session}
              />
            ))}

            {/* Loader */}
            {loading && (
              <div className="flex justify-center py-8">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.12}s` }} />
                  ))}
                </div>
              </div>
            )}

            {/* End */}
            {!hasMore && filtered.length > 0 && !loading && (
              <div className="flex justify-center py-8">
                <span className="flex items-center gap-2 text-xs text-slate-400
                                 bg-white dark:bg-slate-900 px-4 py-2 rounded-full
                                 border border-slate-200 dark:border-slate-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Vous avez tout vu
                </span>
              </div>
            )}

            {/* Empty */}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Aucune publication</p>
                <p className="text-xs text-slate-400 max-w-[200px]">Modifiez vos filtres ou explorez d'autres catégories</p>
              </div>
            )}
          </div>
        </div>

        <Testimonials dict={dict} />
      </main>

      <Footer dict={dict} lang={lang} />
      <CalendarPopup isOpen={showCalendar} onClose={() => setShowCalendar(false)} dict={dict} />
      <IDEPopup isOpen={showIDE} onClose={() => setShowIDE(false)} dict={dict} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// FEED CARD DISPATCHER
// ══════════════════════════════════════════════════════════════
function FeedCard({ item, index, onGroupPostClick, onProjectClick, onGigClick, session }: {
  item: FeedItem; index: number
  onGroupPostClick: (p: string, g: string) => void
  onProjectClick: (id: string) => void
  onGigClick: (id: string) => void
  session: any
}) {
  const cfg = T[item.type]
  const base = cn(
    "relative bg-white dark:bg-slate-900/90 rounded-2xl overflow-hidden",
    "border border-slate-200/80 dark:border-slate-800/80 border-l-[3px]", cfg.border,
    "shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
    "hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.35)]",
    "transition-all duration-200 active:scale-[0.99]"
  )

  const userSkills: string[] = (session?.user as any)?.skills || []
  const canApply = session?.user?.role === "freelance" || session?.user?.role === "freelancer"

  if (item.type === "group_post") return (
    <GroupPostCard item={item} cfg={cfg} base={base} index={index}
      onClick={() => item.group?._id && onGroupPostClick(item._id, item.group._id)} />
  )
  if (item.type === "project") return (
    <ProjectCard item={item} cfg={cfg} base={base} index={index}
      onClick={() => onProjectClick(item._id)} canApply={canApply} userSkills={userSkills} />
  )
  if (item.type === "gig") return (
    <GigCard item={item} cfg={cfg} base={base} index={index}
      onClick={() => onGigClick(item._id)} />
  )
  if (item.type === "ai_match") return (
    <AIMatchCard item={item} cfg={cfg} base={base} index={index}
      onClick={() => onProjectClick(item._id)} />
  )
  return null
}

// ─── Shared card header ────────────────────────────────────────
function CHeader({ avatar, name, sub, time, cfg, extra }: {
  avatar?: string; name: string; sub?: string; time: string
  cfg: typeof T[ItemType]; extra?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="relative shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatar} />
          <AvatarFallback className={cn("text-white text-xs font-bold", cfg.bg)}>
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900", cfg.dot)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{name}</span>
          {extra}
        </div>
        {sub && <p className="text-[11px] text-slate-400 truncate">{sub}</p>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[11px] text-slate-400">{fmtTime(time)}</span>
        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", cfg.badge)}>
          {cfg.emoji} {cfg.label}
        </span>
      </div>
    </div>
  )
}

// ─── Shared action bar ─────────────────────────────────────────
function ABar({ likes=0, comments=0, views, liked, saved, onLike, onSave, cta }: {
  likes?: number; comments?: number; views?: number
  liked: boolean; saved: boolean
  onLike: (e: React.MouseEvent) => void
  onSave: (e: React.MouseEvent) => void
  cta?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-0.5">
        <button onClick={onLike}
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Heart className={cn("w-3.5 h-3.5", liked ? "fill-rose-500 text-rose-500" : "text-slate-400")} />
          <span className="text-[11px] text-slate-500">{likes}</span>
        </button>
        <button onClick={e => e.stopPropagation()}
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-500">{comments}</span>
        </button>
        {views !== undefined && (
          <span className="flex items-center gap-1 px-2 py-1 text-slate-400">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[11px]">{views}</span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {cta}
        <button onClick={onSave}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Bookmark className={cn("w-3.5 h-3.5", saved ? "fill-blue-500 text-blue-500" : "text-slate-400")} />
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// GROUP POST CARD
// ──────────────────────────────────────────────────────────────
function GroupPostCard({ item, cfg, base, index, onClick }: {
  item: FeedItem; cfg: any; base: string; index: number; onClick: () => void
}) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likes, setLikes] = useState(item.reactionCounts?.like || 0)

  return (
    <div className={cn(base, "cursor-pointer")} style={{ animationDelay: `${index*30}ms` }} onClick={onClick}>
      <div className="p-4">
        <CHeader avatar={item.author?.avatar || item.group?.avatar}
          name={item.author?.name || item.group?.name || "Membre"}
          sub={item.group?.name ? `Groupe · ${item.group.name}` : undefined}
          time={item.createdAt} cfg={cfg} />

        {item.title && (
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1.5 line-clamp-2">
            {item.title}
          </h3>
        )}
        {item.content && (
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-3">
            {item.content}
          </p>
        )}

        {item.images && item.images.length > 0 && (
          <div className={cn(
            "gap-1 mb-3 rounded-xl overflow-hidden",
            item.images.length === 1 ? "flex" : "grid grid-cols-2"
          )}>
            {item.images.slice(0, 4).map((src, i) => (
              <div key={i} className={cn(
                "bg-slate-100 dark:bg-slate-800 overflow-hidden",
                item.images!.length === 1 ? "w-full aspect-[16/9] rounded-xl" : "aspect-square",
                item.images!.length === 3 && i === 0 ? "col-span-2 aspect-video" : ""
              )}>
                <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-violet-400 flex items-center gap-1 mb-1">
          <MessageSquare className="w-3 h-3" />
          Voir commentaires et réactions
        </p>

        <ABar likes={likes} comments={item.commentCount} views={item.viewCount}
          liked={liked} saved={saved}
          onLike={e => { e.stopPropagation(); setLiked(v => !v); setLikes(c => liked ? c-1 : c+1) }}
          onSave={e => { e.stopPropagation(); setSaved(v => !v) }} />
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// PROJECT CARD
// ──────────────────────────────────────────────────────────────
function ProjectCard({ item, cfg, base, index, onClick, canApply, userSkills }: {
  item: FeedItem; cfg: any; base: string; index: number
  onClick: () => void; canApply: boolean; userSkills: string[]
}) {
  const [saved, setSaved] = useState(false)
  const budget   = fmtBudget(item.budget)
  const deadline = fmtDeadline(item.deadline)

  const matchCount = (item.skills || []).filter(s =>
    userSkills.some(u => u.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(u.toLowerCase()))
  ).length
  const matchPct = item.skills?.length ? Math.round((matchCount / item.skills.length) * 100) : 0

  return (
    <div className={cn(base, "cursor-pointer")} style={{ animationDelay: `${index*30}ms` }} onClick={onClick}>
      <div className="p-4">
        <CHeader avatar={item.client?.avatar} name={item.client?.name || "Client"}
          sub={item.client?.rating ? `⭐ ${item.client.rating.toFixed(1)}` : undefined}
          time={item.createdAt} cfg={cfg}
          extra={matchPct >= 50 ? (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
              {matchPct}% match
            </span>
          ) : undefined} />

        <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1.5 line-clamp-2">
          {item.title}
        </h3>
        {item.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {item.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {budget && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-lg">
              <DollarSign className="w-3 h-3" />{budget}
            </span>
          )}
          {deadline && (
            <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
              <Clock className="w-3 h-3" />{deadline}
            </span>
          )}
          {item.applicationCount !== undefined && (
            <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
              <Users className="w-3 h-3" />{item.applicationCount}
            </span>
          )}
        </div>

        {item.skills && item.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.skills.slice(0, 5).map((s, i) => {
              const matched = userSkills.some(u => u.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(u.toLowerCase()))
              return (
                <span key={i} className={cn(
                  "text-[11px] px-2 py-0.5 rounded-full font-medium",
                  matched
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                )}>
                  {matched && <CheckCircle2 className="w-2.5 h-2.5 inline mr-0.5" />}
                  {s}
                </span>
              )
            })}
            {(item.skills.length > 5) && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                +{item.skills.length - 5}
              </span>
            )}
          </div>
        )}

        <ABar views={item.views} comments={item.applicationCount}
          liked={false} saved={saved}
          onLike={e => e.stopPropagation()}
          onSave={e => { e.stopPropagation(); setSaved(v => !v) }}
          cta={
            <button
              onClick={e => { e.stopPropagation(); onClick() }}
              disabled={!canApply}
              className={cn(
                "flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors",
                canApply
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              )}
            >
              Postuler <ChevronRight className="w-3 h-3" />
            </button>
          } />
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// GIG CARD
// ──────────────────────────────────────────────────────────────
function GigCard({ item, cfg, base, index, onClick }: {
  item: FeedItem; cfg: any; base: string; index: number; onClick: () => void
}) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likes, setLikes] = useState(0)
  const [imgLoaded, setImgLoaded] = useState(false)
  const firstImg = item.images?.[0]

  return (
    <div className={cn(base, "cursor-pointer")} style={{ animationDelay: `${index*30}ms` }} onClick={onClick}>
      {firstImg && (
        <div className="relative h-36 sm:h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <img src={firstImg} alt={item.title} loading="lazy"
            className={cn("w-full h-full object-cover transition-opacity duration-300", imgLoaded ? "opacity-100" : "opacity-0")}
            onLoad={() => setImgLoaded(true)} />
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-7 h-7 text-slate-300 dark:text-slate-600 animate-pulse" />
            </div>
          )}
          {item.price && (
            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded-lg">
              Dès {item.price} {item.currency || "€"}
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        <CHeader avatar={item.seller?.avatar} name={item.seller?.name || "Freelance"}
          sub={item.seller?.title} time={item.createdAt} cfg={cfg}
          extra={item.rating ? (
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-600">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{item.rating}
            </span>
          ) : undefined} />

        <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1.5 line-clamp-2">
          {item.title}
        </h3>
        {item.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {item.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {!firstImg && item.price && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-lg">
              <DollarSign className="w-3 h-3" />{item.price} {item.currency || "€"}
            </span>
          )}
          {item.deliveryTime && (
            <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
              <Clock className="w-3 h-3" />{item.deliveryTime}j livraison
            </span>
          )}
          {!!item.ordersCount && (
            <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />{item.ordersCount} commandes
            </span>
          )}
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.slice(0, 4).map((t, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                {t}
              </span>
            ))}
          </div>
        )}

        <ABar likes={likes} views={item.views}
          liked={liked} saved={saved}
          onLike={e => { e.stopPropagation(); setLiked(v => !v); setLikes(c => liked ? c-1 : c+1) }}
          onSave={e => { e.stopPropagation(); setSaved(v => !v) }}
          cta={
            <button onClick={e => { e.stopPropagation(); onClick() }}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors">
              Voir <ChevronRight className="w-3 h-3" />
            </button>
          } />
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// AI MATCH CARD
// ──────────────────────────────────────────────────────────────
function AIMatchCard({ item, cfg, base, index, onClick }: {
  item: FeedItem; cfg: any; base: string; index: number; onClick: () => void
}) {
  const [saved, setSaved] = useState(false)
  const budget = fmtBudget(item.budget)

  return (
    <div className={cn(base, "cursor-pointer")} style={{ animationDelay: `${index*30}ms` }} onClick={onClick}>
      <div className="p-4">
        {/* Match banner */}
        <div className="flex items-center gap-2 mb-3 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
            Match {item.matchScore}%
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-emerald-200 dark:bg-emerald-800/60">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${item.matchScore}%` }} />
          </div>
        </div>

        <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1.5 line-clamp-2">
          {item.title}
        </h3>
        {item.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
            {item.description}
          </p>
        )}
        {item.reason && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 italic mb-3">"{item.reason}"</p>
        )}

        {budget && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-lg mb-3">
            <DollarSign className="w-3 h-3" />{budget}
          </span>
        )}

        {item.skills && item.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.skills.slice(0, 4).map((s, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                ✓ {s}
              </span>
            ))}
          </div>
        )}

        <ABar liked={false} saved={saved}
          onLike={e => e.stopPropagation()}
          onSave={e => { e.stopPropagation(); setSaved(v => !v) }}
          cta={
            <button onClick={e => { e.stopPropagation(); onClick() }}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
              Postuler <ChevronRight className="w-3 h-3" />
            </button>
          } />
      </div>
    </div>
  )
}
