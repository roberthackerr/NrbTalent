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
  TrendingUp, X, MapPin, Calendar, Tag, Award,
  ExternalLink, Building2,
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
  viewCount?:    number
  views?:        number
  images?:       string[]
  budget?:  { min: number; max: number; currency: string; type: "fixed" | "hourly" }
  skills?:  string[]
  deadline?: string
  location?: { city?: string; country?: string; type?: string }
  applicationCount?: number
  client?:  { _id: string; name: string; avatar?: string; rating?: number; company?: string }
  price?:        number
  currency?:     string
  deliveryTime?: number
  revisions?:    number
  tags?:         string[]
  rating?:       number
  reviewsCount?: number
  ordersCount?:  number
  seller?: { _id: string; name: string; avatar?: string; title?: string }
  matchScore?:   number
  matchedSkills?: string[]
  reason?:       string
  featured?:     boolean
  urgency?:      string
}

// ─── Type palette ─────────────────────────────────────────────
const PALETTE = {
  group_post: {
    label: "Publication", emoji: "📝",
    avatarBg:  "bg-violet-500",
    border:    "border-l-violet-400",
    badge:     "text-violet-700 bg-violet-100 dark:text-violet-300 dark:bg-violet-900/40",
    dot:       "bg-violet-400",
    pill:      "bg-violet-600 hover:bg-violet-700",
  },
  project: {
    label: "Projet", emoji: "💼",
    avatarBg:  "bg-blue-500",
    border:    "border-l-blue-400",
    badge:     "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/40",
    dot:       "bg-blue-400",
    pill:      "bg-blue-600 hover:bg-blue-700",
  },
  gig: {
    label: "Service", emoji: "⚡",
    avatarBg:  "bg-amber-500",
    border:    "border-l-amber-400",
    badge:     "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40",
    dot:       "bg-amber-400",
    pill:      "bg-amber-500 hover:bg-amber-600",
  },
  ai_match: {
    label: "Match IA", emoji: "🤖",
    avatarBg:  "bg-emerald-500",
    border:    "border-l-emerald-400",
    badge:     "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/40",
    dot:       "bg-emerald-400",
    pill:      "bg-emerald-600 hover:bg-emerald-700",
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
  return `${b.min.toLocaleString()}–${b.max.toLocaleString()} ${b.currency}${b.type === "hourly" ? "/h" : ""}`
}

function fmtDeadline(d?: string) {
  if (!d) return null
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  if (days < 0)  return "Expiré"
  if (days === 0) return "Aujourd'hui"
  if (days < 7)  return `${days} jour${days > 1 ? "s" : ""}`
  if (days < 30) return `${Math.ceil(days / 7)} sem.`
  return `${Math.ceil(days / 30)} mois`
}

function mergeAndSort(data: any): FeedItem[] {
  const norm = (arr: any[], type: ItemType, extra?: (x: any) => Partial<FeedItem>) =>
    (arr || []).map(x => ({
      ...x, type,
      createdAt: x.createdAt || new Date().toISOString(),
      ...(extra?.(x) ?? {}),
    }))
  return [
    ...norm(data.groupPosts, "group_post"),
    ...norm(data.projects,   "project"),
    ...norm(data.gigs, "gig", g => ({
      images: (g.images || [])
        .map((i: any) => (typeof i === "string" ? i : i?.url))
        .filter(Boolean),
    })),
    ...norm(data.aiMatches, "ai_match", m => ({
      skills: m.matchedSkills,
      matchScore: m.matchScore ?? m.score,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// ══════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════
export default function HomePage() {
  const params = useParams()
  const lang   = params.lang as Locale
  const { data: session } = useSession()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState("")
  const [debSearch,   setDebSearch]   = useState("")
  const [selectedCat, setSelectedCat] = useState("all")
  const [activeTab,   setActiveTab]   = useState<FeedTab>("all")
  const [feed,        setFeed]        = useState<FeedItem[]>([])
  const [loading,     setLoading]     = useState(true)
  const [hasMore,     setHasMore]     = useState(true)
  const [page,        setPage]        = useState(1)
  const [dict,        setDict]        = useState<any>(null)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [showCalendar,setShowCalendar]= useState(false)
  const [showIDE,     setShowIDE]     = useState(false)
  const [selectedPost,setSelectedPost]= useState<{ postId: string; groupId: string } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(searchQuery), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    let ok = true
    getDictionarySafe(lang).then(d => { if (ok) setDict(d) })
    return () => { ok = false }
  }, [lang])

  useEffect(() => {
    if (!session?.user) return
    const t1 = setTimeout(() => {
      if (!localStorage.getItem("hasSeenCalendarPopup")) {
        setShowCalendar(true); localStorage.setItem("hasSeenCalendarPopup", "true")
      }
    }, 5000)
    const t2 = setTimeout(() => {
      if (!localStorage.getItem("hasSeenIDEPopup")) {
        setShowIDE(true); localStorage.setItem("hasSeenIDEPopup", "true")
      }
    }, 10000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [session])

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

  const userSkills: string[] = (session?.user as any)?.skills || []
  const canApply = session?.user?.role === "freelance" || session?.user?.role === "freelancer"

  // ── PostView ──
  if (selectedPost) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f]">
        <Navigation />
        <main className="pt-16">
          <div className="mx-auto px-4 py-6 max-w-3xl">
            <button
              onClick={() => setSelectedPost(null)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              Retour au fil
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
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-[#0d0d12]">
      <Navigation />
      <main className="pt-16">

        <HeroSection user={session?.user} onSearch={setSearchQuery}
          onCalendarClick={() => setShowCalendar(true)} onIDEClick={() => setShowIDE(true)}
          dict={dict} lang={lang} />
        <StatsOverview dict={dict} />
        <QuickActions user={session?.user} onIDEClick={() => setShowIDE(true)} dict={dict} />

        {/* ══ FEED SECTION ══ */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-6 lg:gap-8 items-start">

            {/* ── LEFT SIDEBAR (desktop only) ── */}
            <aside className="hidden xl:flex flex-col gap-4 w-64 shrink-0 sticky top-24">
              <FeedSidebar counts={counts} activeTab={activeTab} onTabChange={setActiveTab} />
            </aside>

            {/* ── MAIN FEED ── */}
            <div className="flex-1 min-w-0">

              {/* Sticky controls bar */}
              <div className="sticky top-16 z-30 -mx-4 sm:mx-0 px-4 sm:px-0 pt-2 pb-3
                              bg-[#f4f5f7]/95 dark:bg-[#0d0d12]/95 backdrop-blur-md
                              sm:rounded-t-2xl mb-1">

                {/* Title row */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600
                                    flex items-center justify-center shadow-sm shrink-0">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white leading-none">
                        Actualités
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {counts.all} publications
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => setSearchOpen(v => !v)}
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                        searchOpen
                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600"
                          : "bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                      )}>
                      {searchOpen ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => { setPage(1); loadFeed(true); toast.success("Actualisé") }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center
                                 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700
                                 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all">
                      <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className={cn("overflow-hidden transition-all duration-300", searchOpen ? "max-h-12 mb-3" : "max-h-0")}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <Input autoFocus={searchOpen} placeholder="Rechercher projets, services, posts…"
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-sm rounded-xl bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700" />
                  </div>
                </div>

                {/* Categories */}
                <div className="mb-3">
                  <CategoryFilters
                    selectedCategory={selectedCat}
                    onCategoryChange={c => { setSelectedCat(c); setPage(1) }}
                    dict={dict} />
                </div>

                {/* Tabs (mobile / tablet only — desktop uses sidebar) */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide xl:hidden">
                  {TABS.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all",
                        activeTab === tab.key
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                          : "bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500"
                      )}>
                      {tab.emoji} {tab.label}
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full",
                        activeTab === tab.key ? "bg-white/20 dark:bg-black/20" : "bg-slate-100 dark:bg-slate-700"
                      )}>
                        {counts[tab.key]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Cards ── */}
              <div className="space-y-4">
                {filtered.map((item, i) => (
                  <FeedCard
                    key={`${item.type}-${item._id}-${i}`}
                    item={item} index={i}
                    onGroupPostClick={(p, g) => setSelectedPost({ postId: p, groupId: g })}
                    onProjectClick={id => router.push(`/projects/${id}`)}
                    onGigClick={id => router.push(`/gigs/${id}`)}
                    session={session}
                    userSkills={userSkills}
                    canApply={canApply}
                  />
                ))}

                {loading && (
                  <div className="flex justify-center py-10">
                    <div className="flex gap-1.5">
                      {[0,1,2].map(i => (
                        <span key={i}
                          className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                          style={{ animationDelay: `${i * 0.12}s` }} />
                      ))}
                    </div>
                  </div>
                )}

                {!hasMore && filtered.length > 0 && !loading && (
                  <div className="flex justify-center py-10">
                    <span className="flex items-center gap-2 text-xs text-slate-400
                                     bg-white dark:bg-slate-900 px-5 py-2.5 rounded-full
                                     border border-slate-200 dark:border-slate-800 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Vous êtes à jour !
                    </span>
                  </div>
                )}

                {!loading && filtered.length === 0 && (
                  <div className="flex flex-col items-center py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                                    flex items-center justify-center mb-4 shadow-sm">
                      <MessageSquare className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Aucune publication
                    </p>
                    <p className="text-sm text-slate-400 max-w-[240px]">
                      Modifiez vos filtres ou explorez d'autres catégories
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT SIDEBAR (desktop) ── */}
            <aside className="hidden lg:flex flex-col gap-4 w-72 shrink-0 sticky top-24">
              <RightSidebar feed={feed} />
            </aside>

          </div>
        </section>

        <Testimonials dict={dict} />
      </main>

      <Footer dict={dict} lang={lang} />
      <CalendarPopup isOpen={showCalendar} onClose={() => setShowCalendar(false)} dict={dict} />
      <IDEPopup isOpen={showIDE} onClose={() => setShowIDE(false)} dict={dict} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// LEFT SIDEBAR
// ══════════════════════════════════════════════════════════════
function FeedSidebar({ counts, activeTab, onTabChange }: {
  counts: Record<string, number>
  activeTab: FeedTab
  onTabChange: (t: FeedTab) => void
}) {
  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
        Filtrer par type
      </p>
      <div className="flex flex-col gap-1">
        {TABS.map(tab => {
          const p = PALETTE[tab.key as keyof typeof PALETTE] ?? PALETTE.group_post
          return (
            <button key={tab.key} onClick={() => onTabChange(tab.key)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full",
                activeTab === tab.key
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              )}>
              <span className="text-base w-5 text-center">{tab.emoji}</span>
              <span className="flex-1">{tab.label}</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-semibold",
                activeTab === tab.key
                  ? "bg-white/20 dark:bg-black/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              )}>
                {counts[tab.key]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// RIGHT SIDEBAR — Stats snapshot
// ══════════════════════════════════════════════════════════════
function RightSidebar({ feed }: { feed: FeedItem[] }) {
  const projects = feed.filter(i => i.type === "project")
  const gigs     = feed.filter(i => i.type === "gig")
  const posts    = feed.filter(i => i.type === "group_post")

  const topSkills = Object.entries(
    feed.flatMap(i => i.skills || i.tags || [])
      .reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 8)

  return (
    <>
      {/* Quick stats */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Aperçu du fil
        </p>
        <div className="space-y-3">
          {[
            { label: "Projets ouverts",   count: projects.length, icon: "💼", color: "text-blue-600" },
            { label: "Services actifs",   count: gigs.length,     icon: "⚡", color: "text-amber-600" },
            { label: "Publications",      count: posts.length,    icon: "📝", color: "text-violet-600" },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span>{s.icon}</span> {s.label}
              </span>
              <span className={cn("font-bold text-sm", s.color)}>{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top skills */}
      {topSkills.length > 0 && (
        <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Compétences demandées
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topSkills.map(([skill, count]) => (
              <span key={skill}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800
                           text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                {skill}
                <span className="text-[10px] text-slate-400">×{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent gigs highlight */}
      {gigs.slice(0, 2).map(g => (
        <div key={g._id}
          className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20
                     rounded-2xl border border-amber-200/60 dark:border-amber-800/30 p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Service récent</span>
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 mb-2">
            {g.title}
          </p>
          {g.price && (
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
              Dès {g.price} {g.currency || "€"}
            </p>
          )}
        </div>
      ))}
    </>
  )
}

// ══════════════════════════════════════════════════════════════
// FEED CARD DISPATCHER
// ══════════════════════════════════════════════════════════════
function FeedCard({ item, index, onGroupPostClick, onProjectClick, onGigClick, session, userSkills, canApply }: {
  item: FeedItem; index: number
  onGroupPostClick: (p: string, g: string) => void
  onProjectClick: (id: string) => void
  onGigClick: (id: string) => void
  session: any; userSkills: string[]; canApply: boolean
}) {
  const pal = PALETTE[item.type]
  const base = cn(
    "group relative bg-white dark:bg-slate-900/90 rounded-2xl overflow-hidden",
    "border border-slate-200/80 dark:border-slate-800 border-l-[3px]", pal.border,
    "shadow-[0_1px_4px_rgba(0,0,0,0.05)] dark:shadow-none",
    "hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_6px_24px_rgba(0,0,0,0.4)]",
    "transition-all duration-200"
  )

  if (item.type === "group_post") return (
    <GroupPostCard item={item} pal={pal} base={base} index={index}
      onClick={() => item.group?._id && onGroupPostClick(item._id, item.group._id)} />
  )
  if (item.type === "project") return (
    <ProjectCard item={item} pal={pal} base={base} index={index}
      onClick={() => onProjectClick(item._id)}
      canApply={canApply} userSkills={userSkills} />
  )
  if (item.type === "gig") return (
    <GigCard item={item} pal={pal} base={base} index={index}
      onClick={() => onGigClick(item._id)} />
  )
  if (item.type === "ai_match") return (
    <AIMatchCard item={item} pal={pal} base={base} index={index}
      onClick={() => onProjectClick(item._id)} />
  )
  return null
}

// ─── Shared: Avatar + meta header ────────────────────────────
function CHeader({ avatar, name, sub, time, pal, extra }: {
  avatar?: string; name: string; sub?: string; time: string
  pal: typeof PALETTE[ItemType]; extra?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="relative shrink-0">
        <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
          <AvatarImage src={avatar} />
          <AvatarFallback className={cn("text-white text-sm font-bold", pal.avatarBg)}>
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className={cn(
          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900",
          pal.dot
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{name}</span>
          {extra}
        </div>
        {sub && <p className="text-xs text-slate-400 truncate mt-0.5">{sub}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-slate-400 hidden sm:block">{fmtTime(time)}</span>
        <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap", pal.badge)}>
          {pal.emoji} {pal.label}
        </span>
      </div>
    </div>
  )
}

// ─── Chip ─────────────────────────────────────────────────────
function Chip({ icon, label, variant = "default" }: {
  icon?: React.ReactNode; label: string; variant?: "default" | "green" | "amber" | "blue" | "violet"
}) {
  const styles = {
    default: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
    green:   "bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400 font-semibold",
    amber:   "bg-amber-50  dark:bg-amber-900/25  text-amber-700  dark:text-amber-400",
    blue:    "bg-blue-50   dark:bg-blue-900/25   text-blue-700   dark:text-blue-400",
    violet:  "bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-400",
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg", styles[variant])}>
      {icon}{label}
    </span>
  )
}

// ══════════════════════════════════════════════════════════════
// GROUP POST CARD  (with likes + comments)
// ══════════════════════════════════════════════════════════════
function GroupPostCard({ item, pal, base, index, onClick }: {
  item: FeedItem; pal: any; base: string; index: number; onClick: () => void
}) {
  const [liked, setLiked]   = useState(false)
  const [saved, setSaved]   = useState(false)
  const [likes, setLikes]   = useState(item.reactionCounts?.like || 0)

  return (
    <div className={cn(base, "cursor-pointer active:scale-[0.995]")}
      style={{ animationDelay: `${index * 25}ms` }}
      onClick={onClick}>
      <div className="p-4 sm:p-5">
        <CHeader
          avatar={item.author?.avatar || item.group?.avatar}
          name={item.author?.name || item.group?.name || "Membre"}
          sub={item.group?.name ? `Groupe · ${item.group.name}` : undefined}
          time={item.createdAt} pal={pal} />

        {item.title && (
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base mb-2 line-clamp-2">
            {item.title}
          </h3>
        )}
        {item.content && (
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-3">
            {item.content}
          </p>
        )}

        {/* Images */}
        {item.images && item.images.length > 0 && (
          <div className={cn(
            "gap-1.5 mb-3 rounded-xl overflow-hidden",
            item.images.length === 1 ? "flex" : "grid grid-cols-2"
          )}>
            {item.images.slice(0, 4).map((src, i) => (
              <div key={i} className={cn(
                "bg-slate-100 dark:bg-slate-800 overflow-hidden",
                item.images!.length === 1 ? "w-full aspect-[16/9] rounded-xl" : "aspect-square",
                item.images!.length === 3 && i === 0 ? "col-span-2" : ""
              )}>
                <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-violet-400 flex items-center gap-1 mb-2">
          <MessageSquare className="w-3 h-3" />
          Voir les commentaires et réactions
        </p>

        {/* Action bar — only for group posts */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1">
            <button onClick={e => { e.stopPropagation(); setLiked(v => !v); setLikes(c => liked ? c-1 : c+1) }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Heart className={cn("w-4 h-4", liked ? "fill-rose-500 text-rose-500" : "text-slate-400")} />
              <span className="text-xs text-slate-500">{likes}</span>
            </button>
            <button onClick={e => { e.stopPropagation(); onClick() }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">{item.commentCount || 0}</span>
            </button>
            {item.viewCount !== undefined && (
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-400">
                <Eye className="w-4 h-4" />
                <span className="text-xs">{item.viewCount}</span>
              </span>
            )}
          </div>
          <button onClick={e => { e.stopPropagation(); setSaved(v => !v) }}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Bookmark className={cn("w-4 h-4", saved ? "fill-blue-500 text-blue-500" : "text-slate-400")} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// PROJECT CARD  (no likes/comments — only meta + CTA)
// ══════════════════════════════════════════════════════════════
function ProjectCard({ item, pal, base, index, onClick, canApply, userSkills }: {
  item: FeedItem; pal: any; base: string; index: number
  onClick: () => void; canApply: boolean; userSkills: string[]
}) {
  const budget   = fmtBudget(item.budget)
  const deadline = fmtDeadline(item.deadline)

  const matchCount = (item.skills || []).filter(s =>
    userSkills.some(u =>
      u.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(u.toLowerCase())
    )
  ).length
  const matchPct = item.skills?.length
    ? Math.round((matchCount / item.skills.length) * 100)
    : 0

  return (
    <div className={cn(base, "cursor-pointer active:scale-[0.995]")}
      style={{ animationDelay: `${index * 25}ms` }}
      onClick={onClick}>

      {/* Desktop: side-by-side layout */}
      <div className="p-4 sm:p-5">
        <CHeader
          avatar={item.client?.avatar}
          name={item.client?.name || "Client"}
          sub={item.client?.company || (item.client?.rating ? `⭐ ${item.client.rating.toFixed(1)}` : undefined)}
          time={item.createdAt} pal={pal}
          extra={matchPct >= 50 ? (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400
                             bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
              {matchPct}% match
            </span>
          ) : undefined} />

        <div className="sm:flex sm:gap-5">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base line-clamp-2 flex-1">
                {item.title}
              </h3>
              {item.featured && (
                <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold
                                 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400
                                 px-2 py-0.5 rounded-full">
                  <Star className="w-2.5 h-2.5 fill-current" /> Featured
                </span>
              )}
              {item.urgency === "urgent" && (
                <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold
                                 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400
                                 px-2 py-0.5 rounded-full">
                  <Zap className="w-2.5 h-2.5" /> Urgent
                </span>
              )}
            </div>
            {item.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                {item.description}
              </p>
            )}

            {/* Meta chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {budget && (
                <Chip icon={<DollarSign className="w-3 h-3" />} label={budget} variant="green" />
              )}
              {deadline && (
                <Chip icon={<Clock className="w-3 h-3" />} label={deadline} />
              )}
              {item.applicationCount !== undefined && (
                <Chip icon={<Users className="w-3 h-3" />}
                  label={`${item.applicationCount} candidature${item.applicationCount !== 1 ? "s" : ""}`} />
              )}
              {item.location?.city && (
                <Chip icon={<MapPin className="w-3 h-3" />} label={item.location.city} />
              )}
              {item.budget?.type && (
                <Chip icon={<Tag className="w-3 h-3" />}
                  label={item.budget.type === "hourly" ? "Horaire" : "Forfait"} variant="blue" />
              )}
            </div>

            {/* Skills */}
            {item.skills && item.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.skills.slice(0, 6).map((s, i) => {
                  const matched = userSkills.some(u =>
                    u.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(u.toLowerCase())
                  )
                  return (
                    <span key={i} className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      matched
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    )}>
                      {matched && <CheckCircle2 className="w-2.5 h-2.5 inline mr-0.5" />}
                      {s}
                    </span>
                  )
                })}
                {item.skills.length > 6 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                    +{item.skills.length - 6}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* CTA column (desktop) */}
          <div className="hidden sm:flex flex-col items-end justify-between gap-3 ml-4 shrink-0 w-36">
            <div className="text-right">
              {item.views !== undefined && (
                <span className="flex items-center gap-1 text-xs text-slate-400 justify-end">
                  <Eye className="w-3 h-3" /> {item.views} vues
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={e => { e.stopPropagation(); onClick() }}
                disabled={!canApply}
                className={cn(
                  "w-full flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all",
                  canApply
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-blue-500/25"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                )}>
                Postuler
                {canApply && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={e => { e.stopPropagation(); onClick() }}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl
                           border border-slate-200 dark:border-slate-700
                           text-slate-600 dark:text-slate-400
                           hover:border-blue-300 hover:text-blue-600 transition-all">
                Détails
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* CTA row (mobile) */}
        <div className="flex gap-2 mt-4 sm:hidden">
          <button
            onClick={e => { e.stopPropagation(); onClick() }}
            disabled={!canApply}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl transition-all",
              canApply
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
            )}>
            Postuler {canApply && <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          <button onClick={e => { e.stopPropagation(); onClick() }}
            className="px-4 flex items-center gap-1.5 text-xs font-medium py-2.5 rounded-xl
                       border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400
                       hover:border-blue-300 hover:text-blue-600 transition-all">
            Voir <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// GIG CARD  (no likes/comments — image + meta + CTA)
// ══════════════════════════════════════════════════════════════
function GigCard({ item, pal, base, index, onClick }: {
  item: FeedItem; pal: any; base: string; index: number; onClick: () => void
}) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const firstImg = item.images?.[0]

  return (
    <div className={cn(base, "cursor-pointer active:scale-[0.995]")}
      style={{ animationDelay: `${index * 25}ms` }}
      onClick={onClick}>

      {/* Image */}
      {firstImg && (
        <div className="relative h-40 sm:h-52 bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <img src={firstImg} alt={item.title} loading="lazy"
            className={cn("w-full h-full object-cover transition-all duration-500",
              imgLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
            )}
            onLoad={() => setImgLoaded(true)} />
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
              <Zap className="w-8 h-8 text-slate-300 dark:text-slate-600 animate-pulse" />
            </div>
          )}
          {/* Price overlay */}
          {item.price && (
            <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm text-white
                            text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg">
              Dès {item.price} {item.currency || "€"}
            </div>
          )}
          {/* Multiple images indicator */}
          {item.images && item.images.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white
                            text-[10px] font-bold px-2 py-1 rounded-lg">
              1 / {item.images.length}
            </div>
          )}
        </div>
      )}

      <div className="p-4 sm:p-5">
        <CHeader
          avatar={item.seller?.avatar}
          name={item.seller?.name || "Freelance"}
          sub={item.seller?.title}
          time={item.createdAt} pal={pal}
          extra={item.rating ? (
            <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-600">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {item.rating}
              {item.reviewsCount ? (
                <span className="text-slate-400 font-normal">({item.reviewsCount})</span>
              ) : null}
            </span>
          ) : undefined} />

        <div className="sm:flex sm:gap-5">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base mb-2 line-clamp-2">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                {item.description}
              </p>
            )}

            {/* Meta chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {!firstImg && item.price && (
                <Chip icon={<DollarSign className="w-3 h-3" />}
                  label={`${item.price} ${item.currency || "€"}`} variant="green" />
              )}
              {item.deliveryTime && (
                <Chip icon={<Clock className="w-3 h-3" />}
                  label={`${item.deliveryTime} jour${item.deliveryTime > 1 ? "s" : ""}`} />
              )}
              {item.revisions !== undefined && item.revisions > 0 && (
                <Chip icon={<RefreshCw className="w-3 h-3" />}
                  label={`${item.revisions} révision${item.revisions > 1 ? "s" : ""}`} variant="blue" />
              )}
              {item.ordersCount !== undefined && item.ordersCount > 0 && (
                <Chip icon={<CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  label={`${item.ordersCount} commande${item.ordersCount > 1 ? "s" : ""}`} variant="green" />
              )}
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.tags.slice(0, 5).map((t, i) => (
                  <span key={i}
                    className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700
                               dark:bg-amber-900/20 dark:text-amber-400">
                    {t}
                  </span>
                ))}
                {item.tags.length > 5 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                    +{item.tags.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* CTA (desktop) */}
          <div className="hidden sm:flex flex-col items-end justify-between gap-3 ml-4 shrink-0 w-36">
            <div className="text-right">
              {item.views !== undefined && (
                <span className="flex items-center gap-1 text-xs text-slate-400 justify-end">
                  <Eye className="w-3 h-3" /> {item.views}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button onClick={e => { e.stopPropagation(); onClick() }}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl
                           bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow-amber-500/25 transition-all">
                Commander <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button onClick={e => { e.stopPropagation(); onClick() }}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl
                           border border-slate-200 dark:border-slate-700
                           text-slate-600 dark:text-slate-400
                           hover:border-amber-300 hover:text-amber-600 transition-all">
                Voir <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* CTA (mobile) */}
        <div className="flex gap-2 mt-4 sm:hidden">
          <button onClick={e => { e.stopPropagation(); onClick() }}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl
                       bg-amber-500 hover:bg-amber-600 text-white transition-all">
            Commander <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button onClick={e => { e.stopPropagation(); onClick() }}
            className="px-4 flex items-center gap-1.5 text-xs font-medium py-2.5 rounded-xl
                       border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400
                       hover:border-amber-300 hover:text-amber-600 transition-all">
            Voir <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// AI MATCH CARD
// ══════════════════════════════════════════════════════════════
function AIMatchCard({ item, pal, base, index, onClick }: {
  item: FeedItem; pal: any; base: string; index: number; onClick: () => void
}) {
  const budget = fmtBudget(item.budget)

  return (
    <div className={cn(base, "cursor-pointer active:scale-[0.995]")}
      style={{ animationDelay: `${index * 25}ms` }}
      onClick={onClick}>
      <div className="p-4 sm:p-5">
        {/* Score banner */}
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl
                        bg-emerald-50 dark:bg-emerald-900/20
                        border border-emerald-100 dark:border-emerald-800/40">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Match IA — {item.matchScore}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-emerald-200 dark:bg-emerald-800/60">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                style={{ width: `${item.matchScore}%` }} />
            </div>
          </div>
        </div>

        <div className="sm:flex sm:gap-5">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base mb-2 line-clamp-2">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                {item.description}
              </p>
            )}
            {item.reason && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 italic mb-3">
                "{item.reason}"
              </p>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              {budget && (
                <Chip icon={<DollarSign className="w-3 h-3" />} label={budget} variant="green" />
              )}
            </div>

            {item.skills && item.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.skills.slice(0, 5).map((s, i) => (
                  <span key={i}
                    className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700
                               dark:bg-emerald-900/30 dark:text-emerald-400">
                    ✓ {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* CTA (desktop) */}
          <div className="hidden sm:flex flex-col items-end justify-end gap-2 ml-4 shrink-0 w-36">
            <button onClick={e => { e.stopPropagation(); onClick() }}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl
                         bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all">
              Postuler <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={e => { e.stopPropagation(); onClick() }}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl
                         border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400
                         hover:border-emerald-300 hover:text-emerald-600 transition-all">
              Détails <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* CTA (mobile) */}
        <div className="flex gap-2 mt-4 sm:hidden">
          <button onClick={e => { e.stopPropagation(); onClick() }}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl
                       bg-emerald-600 hover:bg-emerald-700 text-white transition-all">
            Postuler <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button onClick={e => { e.stopPropagation(); onClick() }}
            className="px-4 flex items-center gap-1.5 text-xs font-medium py-2.5 rounded-xl
                       border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 transition-all">
            Voir
          </button>
        </div>
      </div>
    </div>
  )
}