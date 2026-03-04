// app/[lang]/page.tsx
'use client'

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PostView } from "@/components/groups/GroupPosts/PostView"
import {
  Search,
  Sparkles,
  Briefcase,
  MessageSquare,
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
  ArrowLeft,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getDictionarySafe } from "@/lib/i18n/dictionaries"
import type { Locale } from "@/lib/i18n/config"

interface UnifiedPost {
  id: string
  type: "group_post" | "project" | "gig" | "ai_match"
  createdAt: string
  title?: string
  description?: string
  content?: string
  author?: {
    id: string
    name: string
    avatar?: string
    title?: string
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
  images?: string[]
  matchScore?: number
  matchReason?: string
  groupId?: string // 👈 Ajouté pour les posts de groupe
  groupName?: string
  groupAvatar?: string
  reactionCounts?: {
    like: number
    love: number
    insightful: number
  }
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
  
  // 👇 État pour la vue détaillée du post de groupe
  const [selectedGroupPost, setSelectedGroupPost] = useState<{
    postId: string
    groupId: string
  } | null>(null)

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
          
          // Construction du feed unifié
          const unifiedPosts: UnifiedPost[] = [
            // Posts de groupe
            ...(data.groupPosts?.map((post: any) => ({
              id: post._id,
              type: "group_post" as const,
              createdAt: post.createdAt,
              title: post.title,
              content: post.content,
              groupId: post.group?._id,
              groupName: post.group?.name,
              groupAvatar: post.group?.avatar,
              author: post.author ? {
                id: post.author._id || post.group?._id,
                name: post.author.name || post.group?.name || 'Membre',
                avatar: post.author.avatar || post.group?.avatar,
                title: post.author.title,
              } : {
                id: post.group?._id || 'unknown',
                name: post.group?.name || 'Membre',
                avatar: post.group?.avatar,
              },
              reactionCounts: post.reactionCounts || { like: 0, love: 0, insightful: 0 },
              comments: post.commentCount || 0,
              shares: post.shareCount || 0,
              views: post.viewCount || 0,
              images: post.images || [],
            })) || []),
            
            // Projets
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
              },
              budget: project.budget,
              skills: project.skills,
              deadline: project.deadline,
              location: project.location?.city || project.location?.country,
              remote: project.location?.type === "remote",
              views: project.views,
              comments: project.applicationCount,
            })) || []),
            
            // Gigs
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
              skills: gig.tags,
              images: gig.images,
              likes: gig.likes,
              views: gig.views,
            })) || []),
            
            // Matchs IA
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
                  author: match.client ? {
                    id: match.client._id,
                    name: match.client.name,
                    avatar: match.client.avatar,
                    rating: match.client.rating,
                  } : undefined,
                }))
              : []),
          ]
          
          // Tri par date
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

  // 👇 Retour au feed
  const handleBackToFeed = () => {
    setSelectedGroupPost(null)
  }

  // 👇 Si un post de groupe est sélectionné, afficher PostView
  if (selectedGroupPost) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f]">
        <Navigation />
        <main className="pt-16">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Button
              variant="ghost"
              onClick={handleBackToFeed}
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
              onBack={handleBackToFeed}
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
            <div className="min-w-0">
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
                    index={i}
                    onGroupPostClick={(postId, groupId) => 
                      setSelectedGroupPost({ postId, groupId })
                    }
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

            {/* ── Right: Sidebar ── */}
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

// ─── Feed Card simplifiée ─────────────────────────────────────
function FeedCard({ 
  post, 
  index, 
  onGroupPostClick 
}: { 
  post: UnifiedPost
  index: number
  onGroupPostClick: (postId: string, groupId: string) => void
}) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes || post.reactionCounts?.like || 0)

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

  const handleCardClick = () => {
    if (post.type === 'group_post' && post.groupId) {
      onGroupPostClick(post.id, post.groupId)
    }
  }

  // Style selon le type
  const getTypeStyle = () => {
    switch(post.type) {
      case 'group_post':
        return 'border-violet-200 hover:border-violet-300 dark:border-violet-800/40 dark:hover:border-violet-700 cursor-pointer'
      case 'project':
        return 'border-blue-200 dark:border-blue-800/40'
      case 'gig':
        return 'border-amber-200 dark:border-amber-800/40'
      case 'ai_match':
        return 'border-emerald-200 dark:border-emerald-800/40'
      default:
        return ''
    }
  }

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900/80 rounded-2xl border shadow-sm p-5",
        "hover:shadow-lg transition-all duration-300",
        getTypeStyle()
      )}
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-slate-800">
          <AvatarImage src={post.author?.avatar || post.groupAvatar} />
          <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-600 text-white">
            {(post.author?.name || post.groupName || 'U').charAt(0)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
              {post.author?.name || post.groupName}
            </span>
            {post.author?.rating && (
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-xs text-slate-500">{post.author.rating}</span>
              </div>
            )}
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(post.createdAt)}
            </span>
          </div>
          
          {/* Type badge */}
          <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {post.type === 'group_post' && '📝 Publication'}
            {post.type === 'project' && '💼 Projet'}
            {post.type === 'gig' && '⚡ Service'}
            {post.type === 'ai_match' && '🤖 Match IA'}
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

      {/* Group name pour les posts de groupe */}
      {post.type === 'group_post' && post.groupName && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2.5 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            {post.groupName}
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
      {(post.content || post.description) && (
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-3">
          {post.content || post.description}
        </p>
      )}

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className="grid grid-cols-3 gap-1 mb-3 rounded-lg overflow-hidden">
          {post.images.slice(0, 3).map((img, idx) => (
            <div key={idx} className="aspect-square bg-slate-100 dark:bg-slate-800">
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Meta chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {post.type === "project" && post.budget && (
          <>
            <Chip color="emerald">
              <DollarSign className="w-3 h-3" />
              {post.budget.min}–{post.budget.max} {post.budget.currency}
            </Chip>
            {post.remote && (
              <Chip color="violet">
                <Zap className="w-3 h-3" />
                Remote
              </Chip>
            )}
          </>
        )}

        {post.type === "gig" && post.price && (
          <Chip color="emerald">
            <DollarSign className="w-3 h-3" />
            {post.price} €
          </Chip>
        )}

        {post.type === "ai_match" && post.matchScore && (
          <Chip color="emerald">
            <Sparkles className="w-3 h-3" />
            {post.matchScore}% match
          </Chip>
        )}

        {post.skills && post.skills.slice(0, 3).map((skill, idx) => (
          <Chip key={idx} color="blue">
            {skill}
          </Chip>
        ))}
      </div>

      {/* AI match reason */}
      {post.type === "ai_match" && post.matchReason && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-xs text-emerald-700 dark:text-emerald-300">
          <Sparkles className="w-3 h-3 inline mr-1" />
          {post.matchReason}
        </div>
      )}

      {/* Action bar */}
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
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs">{post.comments || 0}</span>
          </button>

          {post.views !== undefined && (
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <Ey className="w-4 h-4" />
              <span className="text-xs">{post.views}</span>
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

// ─── Chip helper ─────────────────────────────────────────────
function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  }
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", colors[color as keyof typeof colors])}>
      {children}
    </span>
  )
}