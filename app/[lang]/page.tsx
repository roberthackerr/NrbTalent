'use client'

import { useState, useEffect, useCallback, useRef } from "react"
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
import { PostView } from "@/components/groups/GroupPosts/PostView"
import { GigsShowcase } from "@/components/home/gigs-showcase"
import { ProjectsGrid } from "@/components/home/projects-grid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  Sparkles,
  MessageSquare,
  Clock,
  ArrowLeft,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Eye,
  Heart,
  Bookmark,
  MoreVertical,
  Zap,
  DollarSign,
  Star,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getDictionarySafe } from "@/lib/i18n/dictionaries"
import type { Locale } from "@/lib/i18n/config"

// ─── Types ────────────────────────────────────────────────────
type FeedTab = "all" | "posts" | "projects" | "gigs"

interface FeedData {
  groupPosts: any[]
  projects: any[]
  gigs: any[]
  aiMatches: any[]
  hasMore: boolean
}

// ─── Main Page ─────────────────────────────────────────────────
export default function HomePage() {
  const params = useParams()
  const lang = params.lang as Locale
  const { data: session } = useSession()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [activeTab, setActiveTab] = useState<FeedTab>("all")
  const [feedData, setFeedData] = useState<FeedData>({
    groupPosts: [],
    projects: [],
    gigs: [],
    aiMatches: [],
    hasMore: true,
  })
  const [loading, setLoading] = useState(true)
  const [showCalendarPopup, setShowCalendarPopup] = useState(false)
  const [showIDEPopup, setShowIDEPopup] = useState(false)
  const [dict, setDict] = useState<any>(null)
  const [page, setPage] = useState(1)

  // Vue détaillée d'un post de groupe
  const [selectedGroupPost, setSelectedGroupPost] = useState<{
    postId: string
    groupId: string
  } | null>(null)

  // ── Dictionnaire i18n ──
  useEffect(() => {
    let mounted = true
    getDictionarySafe(lang).then((data) => {
      if (mounted) setDict(data)
    })
    return () => { mounted = false }
  }, [lang])

  // ── Popups ──
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
    return () => { clearTimeout(timer1); clearTimeout(timer2) }
  }, [session])

  // ── Chargement du feed ──
  const loadFeed = useCallback(
    async (reset = false) => {
      if (!dict) return
      setLoading(true)
      try {
        const currentPage = reset ? 1 : page
        const urlParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: "20",
          category: selectedCategory !== "all" ? selectedCategory : "",
          search: searchQuery,
        })
        const response = await fetch(`/api/feed/unified?${urlParams}`)
        if (response.ok) {
          const data = await response.json()
          setFeedData((prev) => ({
            groupPosts: reset
              ? (data.groupPosts || [])
              : [...prev.groupPosts, ...(data.groupPosts || [])],
            projects: reset
              ? (data.projects || [])
              : [...prev.projects, ...(data.projects || [])],
            gigs: reset
              ? (data.gigs || [])
              : [...prev.gigs, ...(data.gigs || [])],
            aiMatches: reset
              ? (data.aiMatches || [])
              : [...prev.aiMatches, ...(data.aiMatches || [])],
            hasMore: data.hasMore,
          }))
          if (!reset) setPage((p) => p + 1)
          else setPage(2)
        }
      } catch (error) {
        console.error("Error loading feed:", error)
        toast.error(dict?.common?.error || "Erreur de chargement")
      } finally {
        setLoading(false)
      }
    },
    [page, selectedCategory, searchQuery, dict]
  )

  // Reload quand filtres changent
  useEffect(() => {
    if (dict) loadFeed(true)
  }, [selectedCategory, searchQuery, dict])

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 600 &&
        !loading &&
        feedData.hasMore
      ) {
        loadFeed()
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [loading, feedData.hasMore, loadFeed])

  const handleRefresh = () => {
    setPage(1)
    loadFeed(true)
    toast.success(dict?.common?.refreshed || "Feed actualisé")
  }

  // ── Vue détaillée d'un post de groupe ──
  if (selectedGroupPost) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f]">
        <Navigation />
        <main className="pt-16">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Button
              variant="ghost"
              onClick={() => setSelectedGroupPost(null)}
              className="mb-6 gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au fil d'actualité
            </Button>
            <PostView
              postId={selectedGroupPost.postId}
              groupId={selectedGroupPost.groupId}
              isMember={true}
              userRole={session?.user?.role as string}
              onBack={() => setSelectedGroupPost(null)}
            />
          </div>
        </main>
        <Footer dict={dict} lang={lang} />
      </div>
    )
  }

  // ── Loading initial ──
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

  // Compteurs par onglet
  const totalPosts =
    feedData.groupPosts.length + feedData.projects.length + feedData.gigs.length

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

            {/* ── Colonne principale ── */}
            <div className="min-w-0">

              {/* En-tête du feed */}
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </span>
                    {dict?.feed?.title || "Fil d'actualité"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-10">
                    {totalPosts} {dict?.feed?.posts || "publications"}
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

              {/* Filtres de catégorie */}
              <div className="mb-4">
                <CategoryFilters
                  selectedCategory={selectedCategory}
                  onCategoryChange={(cat) => {
                    setSelectedCategory(cat)
                    setPage(1)
                  }}
                  dict={dict}
                />
              </div>

              {/* ── Onglets de type de contenu ── */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
                {(
                  [
                    { key: "all", label: "Tout", count: totalPosts, icon: "🌐" },
                    { key: "posts", label: "Publications", count: feedData.groupPosts.length, icon: "📝" },
                    { key: "projects", label: "Projets", count: feedData.projects.length, icon: "💼" },
                    { key: "gigs", label: "Services", count: feedData.gigs.length, icon: "⚡" },
                  ] as { key: FeedTab; label: string; count: number; icon: string }[]
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200",
                      activeTab === tab.key
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    )}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                    <span
                      className={cn(
                        "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs",
                        activeTab === tab.key
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* ── Contenu selon l'onglet actif ── */}

              {/* Publications de groupe */}
              {(activeTab === "all" || activeTab === "posts") && feedData.groupPosts.length > 0 && (
                <section className="mb-10">
                  {activeTab === "all" && (
                    <SectionHeader
                      icon="📝"
                      title="Publications de groupe"
                      count={feedData.groupPosts.length}
                    />
                  )}
                  <div className="space-y-4">
                    {feedData.groupPosts.map((post, i) => (
                      <GroupPostCard
                        key={post._id}
                        post={post}
                        index={i}
                        onClick={() =>
                          setSelectedGroupPost({
                            postId: post._id,
                            groupId: post.group?._id || post.groupId,
                          })
                        }
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Projets — composant ProjectsGrid existant */}
              {(activeTab === "all" || activeTab === "projects") && (
                <section className="mb-10">
                  {activeTab === "all" && feedData.projects.length > 0 && (
                    <SectionHeader
                      icon="💼"
                      title="Projets ouverts"
                      count={feedData.projects.length}
                    />
                  )}
                  <ProjectsGrid
                    projects={feedData.projects}
                    loading={loading && feedData.projects.length === 0}
                    searchQuery={searchQuery}
                    onRefresh={handleRefresh}
                  />
                </section>
              )}

              {/* Gigs — composant GigsShowcase existant */}
              {(activeTab === "all" || activeTab === "gigs") && (
                <section className="mb-10">
                  {activeTab === "all" && feedData.gigs.length > 0 && (
                    <SectionHeader
                      icon="⚡"
                      title="Services disponibles"
                      count={feedData.gigs.length}
                    />
                  )}
                  <GigsShowcase
                    gigs={feedData.gigs}
                    loading={loading && feedData.gigs.length === 0}
                    searchQuery={searchQuery}
                    showCreateButton={false}
                  />
                </section>
              )}

              {/* Loader infini */}
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

              {/* Fin du feed */}
              {!feedData.hasMore && totalPosts > 0 && (
                <div className="text-center py-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800/60 text-sm text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {dict?.feed?.noMorePosts || "Vous avez tout vu"}
                  </div>
                </div>
              )}

              {/* Aucun contenu */}
              {!loading && totalPosts === 0 && (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800/60 mb-5">
                    <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {dict?.feed?.noPosts || "Aucune publication"}
                  </h3>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto">
                    {dict?.feed?.noPostsDesc || "Modifiez vos filtres ou explorez d'autres catégories"}
                  </p>
                </div>
              )}
            </div>

            {/* ── Sidebar droite ── */}
            <aside className="hidden lg:flex flex-col gap-5">
              <TrendingSkills dict={dict} />
            </aside>
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

// ─── Section Header ───────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: string
  title: string
  count: number
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xl">{icon}</span>
      <h3 className="font-bold text-slate-900 dark:text-white text-lg">{title}</h3>
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
        {count}
      </span>
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 ml-2" />
    </div>
  )
}

// ─── Group Post Card ──────────────────────────────────────────
// Card légère pour les posts de groupe dans le feed.
// Au clic → PostView (composant existant) avec likes/commentaires.
function GroupPostCard({
  post,
  index,
  onClick,
}: {
  post: any
  index: number
  onClick: () => void
}) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likeCount, setLikeCount] = useState(
    post.reactionCounts?.like || 0
  )

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

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLiked(!liked)
    setLikeCount((c: number) => (liked ? c - 1 : c + 1))
  }

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSaved(!saved)
  }

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900/80 rounded-2xl border shadow-sm p-5 cursor-pointer",
        "border-violet-200 hover:border-violet-300 dark:border-violet-800/40 dark:hover:border-violet-700",
        "hover:shadow-lg transition-all duration-300"
      )}
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-slate-800">
          <AvatarImage src={post.author?.avatar || post.group?.avatar} />
          <AvatarFallback className="bg-gradient-to-br from-violet-400 to-violet-600 text-white">
            {(post.author?.name || post.group?.name || "U").charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
              {post.author?.name || post.group?.name}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(post.createdAt)}
            </span>
          </div>
          <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
            📝 Publication
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-slate-400"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Groupe */}
      {post.group?.name && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2.5 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            {post.group.name}
          </span>
        </div>
      )}

      {/* Titre */}
      {post.title && (
        <h3 className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">
          {post.title}
        </h3>
      )}

      {/* Contenu */}
      {post.content && (
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-3">
          {post.content}
        </p>
      )}

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className="grid grid-cols-3 gap-1 mb-3 rounded-lg overflow-hidden">
          {post.images.slice(0, 3).map((img: string, idx: number) => (
            <div key={idx} className="aspect-square bg-slate-100 dark:bg-slate-800">
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Hint : cliquer pour voir les commentaires */}
      <p className="text-xs text-violet-500 dark:text-violet-400 mb-3 flex items-center gap-1">
        <MessageSquare className="w-3 h-3" />
        Cliquer pour voir les commentaires et réactions
      </p>

      {/* Barre d'actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <Heart className={cn("w-4 h-4", liked && "fill-rose-500 text-rose-500")} />
            <span className="text-xs">{likeCount}</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onClick() }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs">{post.commentCount || 0}</span>
          </button>

          {post.viewCount !== undefined && (
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <Eye className="w-4 h-4" />
              <span className="text-xs">{post.viewCount}</span>
            </button>
          )}
        </div>

        <button
          onClick={handleSave}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
        >
          <Bookmark className={cn("w-4 h-4", saved && "fill-blue-500 text-blue-500")} />
        </button>
      </div>
    </div>
  )
}