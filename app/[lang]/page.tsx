"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/home/hero-section"
import { StatsOverview } from "@/components/home/stats-overview"
import { QuickActions } from "@/components/home/quick-actions"
import { CategoryFilters } from "@/components/home/category-filters"
import { TrendingSkills } from "@/components/home/trending-skills"
import { Testimonials } from "@/components/home/testimonials"
import { Footer } from "@/components/footer"
import { CalendarPopup } from "@/components/home/calendar-popup"
import { IDEPopup } from "@/components/home/ide-popup"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  Filter,
  Sparkles,
  Briefcase,
  Code2,
  MessageSquare,
  ThumbsUp,
  Share2,
  Eye,
  Clock,
  Calendar,
  MapPin,
  Star,
  Zap,
  DollarSign,
  Heart,
  Bookmark,
  MoreVertical,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getDictionarySafe } from "@/lib/i18n/dictionaries"
import type { Locale } from "@/lib/i18n/config"

interface UnifiedPost {
  id: string
  type: "group_post" | "project" | "gig" | "ai_match" | "talent_spotlight"
  createdAt: string
  title?: string
  description?: string
  content?: string
  author?: {
    id: string
    name: string
    avatar?: string
    title?: string
    company?: string
    rating?: number
  }
  likes?: number
  comments?: number
  shares?: number
  views?: number
  budget?: {
    min: number
    max: number
    currency: string
    type: "fixed" | "hourly"
  }
  skills?: string[]
  deadline?: string
  location?: string
  remote?: boolean
  price?: number
  deliveryTime?: number
  revisions?: number
  category?: string
  tags?: string[]
  images?: string[]
  matchScore?: number
  matchReason?: string
  hourlyRate?: number
  completedProjects?: number
  availability?: "available" | "busy" | "unavailable"
  verified?: boolean
  groupName?: string
  groupAvatar?: string
  reactionCounts?: {
    like: number
    love: number
    insightful: number
  }
}

// ─── Type config ──────────────────────────────────────────────
const TYPE_CONFIG = {
  group_post: {
    icon: MessageSquare,
    label: "Publication",
    pill: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    accent: "from-violet-500 to-purple-600",
    border: "border-violet-200/60 dark:border-violet-800/40",
    glow: "shadow-violet-100 dark:shadow-violet-900/20",
  },
  project: {
    icon: Briefcase,
    label: "Projet",
    pill: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    accent: "from-blue-500 to-cyan-600",
    border: "border-blue-200/60 dark:border-blue-800/40",
    glow: "shadow-blue-100 dark:shadow-blue-900/20",
  },
  gig: {
    icon: Zap,
    label: "Service",
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    accent: "from-amber-500 to-orange-500",
    border: "border-amber-200/60 dark:border-amber-800/40",
    glow: "shadow-amber-100 dark:shadow-amber-900/20",
  },
  ai_match: {
    icon: Sparkles,
    label: "Match IA",
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    accent: "from-emerald-500 to-teal-500",
    border: "border-emerald-200/60 dark:border-emerald-800/40",
    glow: "shadow-emerald-100 dark:shadow-emerald-900/20",
  },
  talent_spotlight: {
    icon: Star,
    label: "Talent",
    pill: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    accent: "from-rose-500 to-pink-500",
    border: "border-rose-200/60 dark:border-rose-800/40",
    glow: "shadow-rose-100 dark:shadow-rose-900/20",
  },
}

// ─── Main Page ─────────────────────────────────────────────────
export default function HomePage() {
  const params = useParams()
  const lang = params.lang as Locale
  const { data: session } = useSession()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [feed, setFeed] = useState<UnifiedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showCalendarPopup, setShowCalendarPopup] = useState(false)
  const [showIDEPopup, setShowIDEPopup] = useState(false)
  const [dict, setDict] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    let mounted = true
    getDictionarySafe(lang).then((data) => {
      if (mounted) setDict(data)
    })
    return () => {
      mounted = false
    }
  }, [lang])

  useEffect(() => {
    if (!session?.user) return
    const timer1 = setTimeout(() => {
      if (!localStorage.getItem("hasSeenCalendarPopup")) {
        setShowCalendarPopup(true)
        localStorage.setItem("hasSeenCalendarPopup", "true")
      }
    }, 5000)
    const timer2 = setTimeout(() => {
      if (!localStorage.getItem("hasSeenIDEPopup")) {
        setShowIDEPopup(true)
        localStorage.setItem("hasSeenIDEPopup", "true")
      }
    }, 10000)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [session])

  const loadFeed = useCallback(
    async (reset = false) => {
      if (!dict) return
      setLoading(true)
      try {
        const urlParams = new URLSearchParams({
          page: reset ? "1" : page.toString(),
          limit: "20",
          category: selectedCategory !== "all" ? selectedCategory : "",
          search: searchQuery,
        })
        const response = await fetch(`/api/feed/unified?${urlParams}`)
        if (response.ok) {
          const data = await response.json()
          const unifiedPosts: UnifiedPost[] = [
            ...(data.groupPosts?.map((post: any) => ({
              id: post._id,
              type: "group_post" as const,
              createdAt: post.createdAt,
              title: post.title,
              content: post.content,
              author: {
                id: post.author._id,
                name: post.author.name,
                avatar: post.author.avatar,
                title: post.author.title,
                company: post.author.company,
              },
              groupName: post.group.name,
              groupAvatar: post.group.avatar,
              reactionCounts: post.reactionCounts,
              comments: post.commentCount,
              shares: post.shareCount,
              views: post.viewCount,
              tags: post.tags,
              images: post.images,
            })) || []),
            ...(data.projects?.map((project: any) => ({
              id: project._id,
              type: "project" as const,
              createdAt: project.createdAt,
              title: project.title,
              description: project.description,
              author: {
                id: project.client?._id,
                name: project.client?.name || "Client",
                avatar: project.client?.avatar,
                rating: project.client?.rating,
                company: project.client?.company,
              },
              budget: project.budget,
              skills: project.skills,
              deadline: project.deadline,
              location: project.location?.city || project.location?.country,
              remote: project.location?.type === "remote",
              views: project.views,
              comments: project.applicationCount,
            })) || []),
            ...(data.gigs?.map((gig: any) => ({
              id: gig._id,
              type: "gig" as const,
              createdAt: gig.createdAt,
              title: gig.title,
              description: gig.description,
              author: {
                id: gig.seller?._id || gig.createdBy?._id,
                name: gig.seller?.name || gig.createdBy?.name || "Freelance",
                avatar: gig.seller?.avatar || gig.createdBy?.avatar,
                rating: gig.rating,
                title: gig.seller?.title,
              },
              price: gig.price,
              deliveryTime: gig.deliveryTime,
              revisions: gig.revisions,
              category: gig.category,
              tags: gig.tags,
              images: gig.images,
              likes: gig.likes,
              views: gig.views,
            })) || []),
            ...(session?.user && data.aiMatches
              ? data.aiMatches.map((match: any) => ({
                  id: match._id,
                  type: "ai_match" as const,
                  createdAt: match.createdAt || new Date().toISOString(),
                  title: match.project?.title || match.gig?.title,
                  description: match.project?.description || match.gig?.description,
                  matchScore: match.score,
                  matchReason: match.reason,
                  budget: match.project?.budget,
                  price: match.gig?.price,
                  skills: match.matchedSkills,
                  author: match.client
                    ? {
                        name: match.client.name,
                        avatar: match.client.avatar,
                        rating: match.client.rating,
                      }
                    : undefined,
                }))
              : []),
          ]
          unifiedPosts.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          setFeed((prev) => (reset ? unifiedPosts : [...prev, ...unifiedPosts]))
          setHasMore(data.hasMore)
          if (!reset) setPage((prev) => prev + 1)
        }
      } catch (error) {
        console.error("Error loading feed:", error)
        toast.error(dict?.common?.error || "Erreur de chargement")
      } finally {
        setLoading(false)
      }
    },
    [page, selectedCategory, searchQuery, session, dict]
  )

  useEffect(() => {
    if (dict) {
      setPage(1)
      loadFeed(true)
    }
  }, [selectedCategory, searchQuery, dict])

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        if (!loading && hasMore) loadFeed()
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [loading, hasMore, loadFeed])

  const handleRefresh = () => {
    setPage(1)
    loadFeed(true)
    toast.success(dict?.common?.refreshed || "Feed actualisé")
  }

  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 animate-pulse" />
            <div className="absolute inset-1 rounded-xl bg-white dark:bg-slate-950 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide">
            Chargement…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f]">
      <Navigation />

      <main className="pt-16">
        <HeroSection
          user={session?.user}
          onSearch={setSearchQuery}
          onCalendarClick={() => setShowCalendarPopup(true)}
          onIDEClick={() => setShowIDEPopup(true)}
          dict={dict}
          lang={lang}
        />
        <StatsOverview dict={dict} />
        <QuickActions
          user={session?.user}
          onIDEClick={() => setShowIDEPopup(true)}
          dict={dict}
        />

        {/* ── Feed Layout ── */}
        <div className="container mx-auto px-4 py-10 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
            {/* ── Left: Feed ── */}
            <div classN ame="min-w-0">
              {/* Feed Header */}
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </span>
                    {dict?.feed?.title || "Fil d'actualité"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-10">
                    {feed.length} {dict?.feed?.posts || "publications"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder={dict?.home?.searchPlaceholder || "Rechercher…"}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 w-52 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm rounded-xl focus-visible:ring-blue-500"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                  </Button>
                </div>
              </div>

              {/* Category filters */}
              <div className="mb-6">
                <CategoryFilters
                  selectedCategory={selectedCategory}
                  onCategoryChange={(cat) => {
                    setSelectedCategory(cat)
                    setPage(1)
                  }}
                  dict={dict}
                />
              </div>

              {/* Cards */}
              <div className="space-y-4">
                {feed.map((post, i) => (
                  <FeedCard
                    key={post.id}
                    post={post}
                    dict={dict}
                    session={session}
                    index={i}
                  />
                ))}

                {loading && (
                  <div className="flex items-center justify-center py-10">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {!hasMore && feed.length > 0 && (
                  <div className="text-center py-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800/60 text-sm text-slate-500 dark:text-slate-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {dict?.feed?.noMorePosts || "Vous avez tout vu"}
                    </div>
                  </div>
                )}

                {!loading && feed.length === 0 && (
                  <div className="text-center py-20">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800/60 mb-5">
                      <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      {dict?.feed?.noPosts || "Aucune publication"}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-500 max-w-xs mx-auto">
                      {dict?.feed?.noPostsDesc || "Modifiez vos filtres ou explorez d'autres catégories"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: Sidebar 
 <aside className="hidden lg:flex flex-col gap-5">
              <TrendingSkills dict={dict} />
            </aside>            ── */}
                     </div>
        </div>

        <Testimonials dict={dict} />
      </main>

      <Footer dict={dict} lang={lang} />

      <CalendarPopup
        isOpen={showCalendarPopup}
        onClose={() => setShowCalendarPopup(false)}
        dict={dict}
      />
      <IDEPopup
        isOpen={showIDEPopup}
        onClose={() => setShowIDEPopup(false)}
        dict={dict}
      />
    </div>
  )
}

// ─── Feed Card ─────────────────────────────────────────────────
function FeedCard({
  post,
  dict,
  session,
  index,
}: {
  post: UnifiedPost
  dict: any
  session: any
  index: number
}) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes || post.reactionCounts?.like || 0)

  const cfg = TYPE_CONFIG[post.type] ?? TYPE_CONFIG.group_post
  const Icon = cfg.icon

  const formatTime = (date: string) => {
    const diffMs = Date.now() - new Date(date).getTime()
    const m = Math.floor(diffMs / 60000)
    const h = Math.floor(diffMs / 3600000)
    const d = Math.floor(diffMs / 86400000)
    if (m < 1) return "À l'instant"
    if (m < 60) return `${m} min`
    if (h < 24) return `${h} h`
    if (d === 1) return "Hier"
    return `${d} j`
  }

  const handleLike = () => {
    setLiked(!liked)
    setLikeCount((c: number) => (liked ? c - 1 : c + 1))
  }

  const authorInitial = (post.author?.name || post.groupName || "U").charAt(0).toUpperCase()

  return (
    <div
      className={cn(
        "group relative bg-white dark:bg-slate-900/80 rounded-2xl border shadow-sm",
        "hover:shadow-lg transition-all duration-300",
        "dark:backdrop-blur-sm",
        cfg.border,
        cfg.glow
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Accent bar */}
      <div
        className={cn(
          "absolute top-0 left-0 w-full h-0.5 rounded-t-2xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          cfg.accent
        )}
      />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-11 w-11 ring-2 ring-white dark:ring-slate-800 shadow-sm">
                <AvatarImage src={post.author?.avatar || post.groupAvatar} />
                <AvatarFallback
                  className={cn(
                    "text-white text-sm font-bold bg-gradient-to-br",
                    cfg.accent
                  )}
                >
                  {authorInitial}
                </AvatarFallback>
              </Avatar>
              {/* Online dot for available talents */}
              {post.availability === "available" && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </div>

            {/* Author info */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-sm text-slate-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
                  {post.author?.name || post.groupName}
                </span>
                {post.verified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {post.author?.title && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {post.author.title}
                  </span>
                )}
                {post.author?.title && <span className="text-slate-300 dark:text-slate-700 text-xs">·</span>}
                <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(post.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Type pill */}
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                cfg.pill
              )}
            >
              <Icon className="w-3 h-3" />
              {cfg.label}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Group name badge */}
        {post.groupName && post.type === "group_post" && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              {post.groupName}
            </span>
          </div>
        )}

        {/* Title */}
        {post.title && (
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2 leading-snug cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2">
            {post.title}
          </h3>
        )}

        {/* Content */}
        {(post.content || post.description) && (
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 mb-3">
            {post.content || post.description}
          </p>
        )}

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div
            className={cn(
              "grid gap-2 mb-4 rounded-xl overflow-hidden",
              post.images.length === 1 ? "grid-cols-1" :
              post.images.length === 2 ? "grid-cols-2" :
              "grid-cols-3"
            )}
          >
            {post.images.slice(0, 3).map((img, idx) => (
              <div
                key={idx}
                className="aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden"
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        )}

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Project budget */}
          {post.type === "project" && post.budget && (
            <>
              <Chip color="emerald">
                <DollarSign className="w-3 h-3" />
                {post.budget.min}–{post.budget.max} {post.budget.currency}
                {post.budget.type === "hourly" && "/h"}
              </Chip>
              {post.deadline && (
                <Chip color="amber">
                  <Calendar className="w-3 h-3" />
                  {new Date(post.deadline).toLocaleDateString()}
                </Chip>
              )}
              {post.location && (
                <Chip color="blue">
                  <MapPin className="w-3 h-3" />
                  {post.location}
                </Chip>
              )}
              {post.remote && (
                <Chip color="violet">
                  <Zap className="w-3 h-3" />
                  Remote
                </Chip>
              )}
            </>
          )}

          {/* Gig price */}
          {post.type === "gig" && post.price !== undefined && (
            <>
              <Chip color="emerald">
                <DollarSign className="w-3 h-3" />
                {post.price} dès
              </Chip>
              {post.deliveryTime && (
                <Chip color="blue">
                  <Clock className="w-3 h-3" />
                  {post.deliveryTime} j
                </Chip>
              )}
            </>
          )}

          {/* AI match score */}
          {post.type === "ai_match" && post.matchScore && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30">
              <Sparkles className="w-3 h-3" />
              {post.matchScore}% match
            </span>
          )}
        </div>

        {/* Skills */}
        {post.skills && post.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.skills.slice(0, 6).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                {skill}
              </span>
            ))}
            {post.skills.length > 6 && (
              <span className="px-2 py-0.5 rounded-md text-xs text-slate-400 dark:text-slate-500">
                +{post.skills.length - 6}
              </span>
            )}
          </div>
        )}

        {/* AI match reason */}
        {post.type === "ai_match" && post.matchReason && (
          <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
              {post.matchReason}
            </p>
          </div>
        )}

        {/* Author rating */}
        {post.author?.rating && (
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-3.5 h-3.5",
                  i < Math.floor(post.author!.rating!)
                    ? "text-amber-400 fill-amber-400"
                    : "text-slate-200 dark:text-slate-700"
                )}
              />
            ))}
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
              {post.author.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* ── Action bar ── */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1">
            <ActionBtn
              active={liked}
              activeClass="text-rose-500"
              onClick={handleLike}
            >
              <Heart className={cn("w-4 h-4", liked && "fill-current")} />
              <span className="text-xs tabular-nums">{likeCount}</span>
            </ActionBtn>

            <ActionBtn>
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs tabular-nums">{post.comments || 0}</span>
            </ActionBtn>

            <ActionBtn>
              <Share2 className="w-4 h-4" />
              <span className="text-xs tabular-nums">{post.shares || 0}</span>
            </ActionBtn>

            {post.views !== undefined && (
              <ActionBtn>
                <Eye className="w-4 h-4" />
                <span className="text-xs tabular-nums">{post.views}</span>
              </ActionBtn>
            )}
          </div>

          <div className="flex items-center gap-1">
            <ActionBtn
              active={saved}
              activeClass="text-blue-600"
              onClick={() => setSaved(!saved)}
            >
              <Bookmark className={cn("w-4 h-4", saved && "fill-current")} />
            </ActionBtn>

            {/* CTA for project/gig */}
            {(post.type === "project" || post.type === "gig" || post.type === "ai_match") && (
              <Button
                size="sm"
                className={cn(
                  "h-8 px-3 rounded-xl text-xs font-semibold gap-1 bg-gradient-to-r text-white shadow-sm",
                  post.type === "project" || post.type === "ai_match"
                    ? "from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 shadow-blue-200 dark:shadow-blue-900/30"
                    : "from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-200 dark:shadow-amber-900/30"
                )}
              >
                {post.type === "project" || post.type === "ai_match" ? "Postuler" : "Commander"}
                <ArrowRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Small helpers ─────────────────────────────────────────────
function ActionBtn({
  children,
  active,
  activeClass,
  onClick,
}: {
  children: React.ReactNode
  active?: boolean
  activeClass?: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-500 dark:text-slate-400",
        "hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150",
        active && activeClass
      )}
    >
      {children}
    </button>
  )
}

function Chip({
  children,
  color,
}: {
  children: React.ReactNode
  color: "emerald" | "amber" | "blue" | "violet" | "rose"
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
        colors[color]
      )}
    >
      {children}
    </span>
  )
}