// app/[lang]/profile/[id]/page.tsx
'use client'

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Edit, 
  MapPin, 
  Calendar, 
  Award, 
  Star, 
  CheckCircle, 
  Clock, 
  Mail, 
  Phone, 
  Globe, 
  Linkedin,
  Github,
  Twitter,
  FileText,
  Download,
  Share2,
  Plus,
  Settings,
  Briefcase,
  DollarSign,
  Languages,
  BookOpen,
  Target,
  Eye,
  Users,
  Zap,
  TrendingUp,
  Medal,
  Shield,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  ExternalLink,
  GraduationCap,
  Code,
  Sparkles,
  Rocket,
  Coffee,
  Headphones,
  Camera,
  Palette,
  Music,
  Video,
  Newspaper,
  Megaphone,
  BarChart,
  PieChart,
  LineChart,
  Dribbble,
  Figma,
  Github as GithubIcon,
  Linkedin as LinkedinIcon,
  Twitter as TwitterIcon,
  Instagram,
  Youtube,
  Twitch,
  Slack
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { SkillBadge } from "@/components/SkillBadge"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { ReviewSystem } from "@/components/reviews/ReviewSystem"
import { CVViewerModal } from "@/components/CVViewerModal"

interface UserProfile {
  _id: string
  name: string
  email: string
  role: "freelance" | "client"
  avatar?: string
  coverImage?: string
  bio?: string
  title?: string
  location?: string
  phone?: string
  website?: string
  linkedin?: string
  github?: string
  twitter?: string
  instagram?: string
  isVerified: boolean
  joinDate: string
  completionScore: number
  hourlyRate?: number
  totalEarnings?: number
  languages: Language[]
  skills: Skill[]
  education: Education[]
  experience: Experience[]
  portfolio: PortfolioItem[]
  reviews: Review[]
  availability: "available" | "busy" | "unavailable"
  badges: Badge[]
  statistics: UserStatistics
  socialLinks: SocialLinks
}

interface Language {
  id: string
  name: string
  level: 'native' | 'fluent' | 'advanced' | 'intermediate' | 'beginner'
}

interface Skill {
  id: string
  name: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  yearsOfExperience: number
  featured: boolean
}

interface Education {
  id: string
  school: string
  degree: string
  field: string
  startDate: string
  endDate?: string
  current: boolean
  description?: string
}

interface Experience {
  id: string
  company: string
  position: string
  startDate: string
  endDate?: string
  current: boolean
  description: string
  achievement?: string
  technologies: string[]
}

interface PortfolioItem {
  id: string
  title: string
  description: string
  image: string
  url?: string
  technologies: string[]
  category: string
  featured: boolean
}

interface Review {
  id: string
  clientName: string
  clientAvatar: string
  rating: number
  comment: string
  date: string
  project: string
  wouldRecommend: boolean
}

interface Badge {
  type: "top_rated" | "rising_talent" | "expert" | "mentor" | "team_player" | "fast_delivery"
  earnedAt: string
  level?: number
}

interface UserStatistics {
  completedProjects: number
  successRate: number
  onTimeDelivery: number
  clientSatisfaction: number
  responseRate: number
  totalHoursWorked: number
  repeatClientRate: number
}

interface SocialLinks {
  website?: string
  linkedin?: string
  github?: string
  twitter?: string
  instagram?: string
}

// Fonction pour obtenir le niveau de langue
const getLanguageLevelLabel = (level: string, dict: any) => {
  const levels: Record<string, string> = {
    native: dict?.publicProfile?.languageLevels?.native || "Natif",
    fluent: dict?.publicProfile?.languageLevels?.fluent || "Courant",
    advanced: dict?.publicProfile?.languageLevels?.advanced || "Avancé",
    intermediate: dict?.publicProfile?.languageLevels?.intermediate || "Intermédiaire",
    beginner: dict?.publicProfile?.languageLevels?.beginner || "Débutant"
  }
  return levels[level] || level
}

const getLanguageLevelColor = (level: string) => {
  const colors: Record<string, string> = {
    native: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    fluent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    advanced: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    beginner: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
  }
  return colors[level] || colors.intermediate
}

// Composant Skeleton optimisé
function ProfileSkeleton({ dict }: { dict: any }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20 pt-16">
      <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 sm:mb-8 overflow-hidden">
            <div className="h-32 sm:h-40 md:h-48 bg-gradient-to-r from-blue-600 to-purple-600 relative">
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
            <div className="p-4 sm:p-6 -mt-12 sm:-mt-16">
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 sm:gap-6">
                <div className="flex items-end gap-3 sm:gap-6">
                  <div className="h-20 w-20 sm:h-28 sm:w-28 md:h-32 md:w-32 rounded-full bg-slate-300 dark:bg-slate-700 border-4 border-white dark:border-slate-900 shadow-xl"></div>
                  <div className="space-y-2 pb-2">
                    <div className="h-6 sm:h-8 w-40 sm:w-64 bg-slate-300 dark:bg-slate-700 rounded"></div>
                    <div className="h-3 sm:h-4 w-32 sm:w-48 bg-slate-300 dark:bg-slate-700 rounded"></div>
                    <div className="h-3 sm:h-4 w-28 sm:w-36 bg-slate-300 dark:bg-slate-700 rounded"></div>
                  </div>
                </div>
                <div className="h-9 sm:h-10 w-28 sm:w-32 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                  <div className="h-5 sm:h-6 w-24 sm:w-32 bg-slate-300 dark:bg-slate-700 rounded mb-3 sm:mb-4"></div>
                  <div className="space-y-2 sm:space-y-3">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-3 sm:h-4 bg-slate-300 dark:bg-slate-700 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="h-6 sm:h-8 w-32 sm:w-48 bg-slate-300 dark:bg-slate-700 rounded mb-4 sm:mb-6"></div>
                <div className="space-y-3 sm:space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 sm:h-20 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PublicProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const lang = params.lang as Locale
  
  const [dict, setDict] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("about")
  const [isSaved, setIsSaved] = useState(false)
  const [showCVModal, setShowCVModal] = useState(false)

  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  useEffect(() => {
    if (dict) {
      fetchProfile()
    }
  }, [id, dict])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${id}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      } else {
        throw new Error('Failed to fetch profile')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error(dict?.publicProfile?.errors?.load || "Erreur lors du chargement du profil")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/users/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: id }),
      })

      if (response.ok) {
        setIsSaved(!isSaved)
        toast.success(isSaved 
          ? (dict?.publicProfile?.unsaved || "Profil retiré des sauvegardes")
          : (dict?.publicProfile?.saved || "Profil sauvegardé"))
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error(dict?.publicProfile?.errors?.save || "Erreur lors de la sauvegarde")
    }
  }

  const handleContact = () => {
    router.push(`/${lang}/messages/new?user=${id}`)
  }

  // Calculs mémoïsés pour la performance
  const profileStats = useMemo(() => {
    if (!profile) return null

    const averageRating = profile.reviews?.length > 0 
      ? profile.reviews.reduce((acc, review) => acc + review.rating, 0) / profile.reviews.length 
      : 0

    const recommendedReviews = profile.reviews?.filter(review => review.wouldRecommend).length

    return {
      averageRating,
      recommendedReviews,
      totalReviews: profile.reviews?.length || 0,
      recommendationRate: profile.reviews?.length > 0 ? (recommendedReviews / profile.reviews?.length) * 100 : 0
    }
  }, [profile])

  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (loading) {
    return <ProfileSkeleton dict={dict} />
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20 pt-16 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Users className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">{dict?.publicProfile?.notFound || "Profil non trouvé"}</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 text-sm sm:text-base">
            {dict?.publicProfile?.notFoundDesc || "Ce profil n'existe pas ou a été supprimé"}
          </p>
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/${lang}/projects`}>{dict?.publicProfile?.viewProjects || "Voir les projets"}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20 pt-14 sm:pt-16">
      {/* Header avec image de couverture améliorée */}
      <div className="relative">
        <div className="h-40 sm:h-48 md:h-56 lg:h-64 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
          {profile.coverImage ? (
            <Image
              src={profile.coverImage}
              alt="Cover"
              fill
              className="object-cover"
              priority
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-pink-600/90"></div>
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
              </div>
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 -mt-12 sm:-mt-16 md:-mt-20 relative z-10 max-w-7xl">
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start lg:items-end justify-between gap-4 sm:gap-6">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 lg:gap-6">
                  {/* Avatar */}
                  <div className="relative group self-start">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 xl:h-32 xl:w-32 border-4 border-white dark:border-slate-900 shadow-2xl">
                      <AvatarImage src={profile.avatar} alt={profile.name} />
                      <AvatarFallback className="text-2xl sm:text-3xl lg:text-4xl bg-gradient-to-br from-blue-500 to-purple-600 font-semibold">
                        {profile.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Informations principales améliorées */}
                  <div className="space-y-2 pb-1 sm:pb-2">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent break-words">
                        {profile.name}
                      </h1>
                      {profile.isVerified && (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 px-2 sm:px-3 py-1 text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          <span className="hidden xs:inline">{dict?.publicProfile?.verified || "Vérifié"}</span>
                          <span className="xs:hidden">✓</span>
                        </Badge>
                      )}
                      {profile.badges?.slice(0, 2).map((badge, index) => (
                        <Badge 
                          key={index} 
                          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-2 sm:px-3 py-1 text-xs"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          <span className="hidden xs:inline">{badge?.type?.replace('_', ' ')}</span>
                          <span className="xs:hidden">⭐</span>
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
                      <div className="flex items-center gap-1 sm:gap-2 text-slate-600 dark:text-slate-400">
                        <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm lg:text-base break-words max-w-[150px] sm:max-w-none">
                          {profile.title || (profile.role === 'freelance' ? dict?.publicProfile?.freelance : dict?.publicProfile?.client)}
                        </span>
                      </div>

                      {profile.role === 'freelance' && profile.hourlyRate && (
                        <div className="flex items-center gap-1 sm:gap-2 text-green-600 dark:text-green-400">
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="font-semibold text-xs sm:text-sm lg:text-base">{profile.hourlyRate}/h</span>
                        </div>
                      )}

                      {profile.location && (
                        <div className="flex items-center gap-1 sm:gap-2 text-slate-600 dark:text-slate-400">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm lg:text-base truncate max-w-[120px] sm:max-w-none">{profile.location}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 sm:gap-2 text-slate-600 dark:text-slate-400">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm lg:text-base">
                          {dict?.publicProfile?.memberSince || "Membre depuis"} {new Date(profile.joinDate).getFullYear()}
                        </span>
                      </div>
                    </div>

                    {profileStats && profileStats.totalReviews > 0 && (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                i < Math.round(profileStats.averageRating)
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-slate-300 dark:text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          {profileStats.averageRating.toFixed(1)} ({profileStats.totalReviews} {dict?.publicProfile?.reviews || "avis"})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions améliorées */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-start sm:justify-end">
                  <div className={cn(
                    "px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 shadow-lg",
                    profile.availability === 'available' 
                      ? "bg-green-500 text-white shadow-green-500/25" 
                      : profile.availability === 'busy'
                      ? "bg-orange-500 text-white"
                      : "bg-slate-400 text-white"
                  )}>
                    {profile.availability === 'available' ? (
                      <>
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">{dict?.publicProfile?.available || "Disponible"}</span>
                        <span className="xs:hidden">✓</span>
                      </>
                    ) : profile.availability === 'busy' ? (
                      <>
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">{dict?.publicProfile?.busy || "Occupé"}</span>
                        <span className="xs:hidden">⏰</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">{dict?.publicProfile?.unavailable || "Indisponible"}</span>
                        <span className="xs:hidden">❌</span>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveProfile}
                    className={cn(
                      "shadow-sm",
                      isSaved && "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                    )}
                  >
                    <Bookmark className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isSaved ? 'fill-current' : ''}`} />
                    <span className="hidden xs:inline">
                      {isSaved 
                        ? (dict?.publicProfile?.saved || "Sauvegardé")
                        : (dict?.publicProfile?.save || "Sauvegarder")}
                    </span>
                    <span className="xs:hidden">{isSaved ? "✓" : "★"}</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleContact}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25"
                  >
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">{dict?.publicProfile?.contact || "Contacter"}</span>
                    <span className="xs:hidden">💬</span>
                  </Button>
                  {profile.role === 'freelance' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCVModal(true)}
                      className="shadow-sm"
                    >
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden xs:inline">{dict?.publicProfile?.viewCV || "Voir CV"}</span>
                      <span className="xs:hidden">📄</span>
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="shadow-sm hidden sm:flex">
                    <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    {dict?.publicProfile?.share || "Partager"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {/* Sidebar améliorée */}
          <div className="space-y-4 sm:space-y-6">
            {/* Score de complétion */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <CardTitle className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Rocket className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                  {dict?.publicProfile?.completion || "Profil complété à"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 pt-3 sm:pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {profile.completionScore}%
                    </span>
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  </div>
                  <Progress value={profile.completionScore} className="h-1.5 sm:h-2 bg-slate-200 dark:bg-slate-800" />
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500">
                  {dict?.publicProfile?.completionTip?.replace('{percent}', '40') || 
                    "Complétez votre profil pour augmenter votre visibilité"}
                </p>
              </CardContent>
            </Card>

            {/* Statistiques rapides améliorées */}
            {profile.role === 'freelance' && profile.statistics && (
              <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                    {dict?.publicProfile?.performance || "Performance"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 pt-3 sm:pt-4">
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="text-center p-2 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {profile.statistics.completedProjects}
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500">
                        {dict?.publicProfile?.projects || "Projets"}
                      </div>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                        {profile.statistics.successRate}%
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500">
                        {dict?.publicProfile?.success || "Réussite"}
                      </div>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {profile.statistics.responseRate}%
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500">
                        {dict?.publicProfile?.response || "Réponse"}
                      </div>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {profile.statistics.repeatClientRate}%
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500">
                        {dict?.publicProfile?.repeat || "Fidélité"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informations de contact améliorées */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
                <CardTitle className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                  {dict?.publicProfile?.contactInfo || "Contact"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 pt-3 sm:pt-4">
                <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs sm:text-sm truncate flex-1 min-w-0">{profile.email}</span>
                </div>
                
                {profile.phone && (
                  <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-xs sm:text-sm truncate flex-1 min-w-0">{profile.phone}</span>
                  </div>
                )}

                {/* Réseaux sociaux améliorés */}
                <div className="flex items-center gap-1.5 sm:gap-2 pt-2 flex-wrap">
                  {profile.socialLinks?.website && (
                    <Button variant="outline" size="icon" asChild className="h-7 w-7 sm:h-8 sm:w-9 rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 transition-all">
                      <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                      </a>
                    </Button>
                  )}
                  {profile.socialLinks?.linkedin && (
                    <Button variant="outline" size="icon" asChild className="h-7 w-7 sm:h-8 sm:w-9 rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 transition-all">
                      <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-3 w-3 sm:h-4 sm:w-4" />
                      </a>
                    </Button>
                  )}
                  {profile.socialLinks?.github && (
                    <Button variant="outline" size="icon" asChild className="h-7 w-7 sm:h-8 sm:w-9 rounded-full hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white transition-all">
                      <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer">
                        <Github className="h-3 w-3 sm:h-4 sm:w-4" />
                      </a>
                    </Button>
                  )}
                  {profile.socialLinks?.twitter && (
                    <Button variant="outline" size="icon" asChild className="h-7 w-7 sm:h-8 sm:w-9 rounded-full hover:bg-sky-50 hover:text-sky-500 dark:hover:bg-sky-950/50 transition-all">
                      <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-3 w-3 sm:h-4 sm:w-4" />
                      </a>
                    </Button>
                  )}
                  {profile.socialLinks?.instagram && (
                    <Button variant="outline" size="icon" asChild className="h-7 w-7 sm:h-8 sm:w-9 rounded-full hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-950/50 transition-all">
                      <a href={profile.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                        <Instagram className="h-3 w-3 sm:h-4 sm:w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Langues - MISE À JOUR */}
            {profile.languages && profile.languages.length > 0 && (
              <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-green-500/10 to-teal-500/10">
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    <Languages className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    {dict?.publicProfile?.languages || "Langues"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5 sm:space-y-2">
                    {profile.languages.map((lang, index) => (
                      <div key={lang.id || index} className="flex items-center justify-between p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <span className="font-medium text-xs sm:text-sm">{typeof lang === 'string' ? lang : lang.name}</span>
                        <Badge className={cn("text-[10px] sm:text-xs", getLanguageLevelColor(typeof lang === 'string' ? 'intermediate' : lang.level))}>
                          {getLanguageLevelLabel(typeof lang === 'string' ? 'intermediate' : lang.level, dict)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Compétences améliorées */}
            {profile.skills?.length > 0 && (
              <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                      {dict?.publicProfile?.skills || "Compétences"}
                      <Badge variant="outline" className="ml-1 sm:ml-2 bg-slate-100 dark:bg-slate-800 text-[10px] sm:text-xs">
                        {profile.skills.length}
                      </Badge>
                    </CardTitle>
                  </div>
                  <CardDescription className="text-[10px] sm:text-xs">
                    {profile.skills.filter(skill => skill.featured).length} {dict?.publicProfile?.featured || "en vedette"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 pt-3 sm:pt-4">
                  {/* Compétences en vedette */}
                  {profile.skills.filter(skill => skill.featured).length > 0 && (
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current" />
                        <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                          {dict?.publicProfile?.featuredSkills || "Compétences en vedette"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {profile.skills
                          .filter(skill => skill.featured)
                          .slice(0, 6)
                          .map((skill) => (
                            <SkillBadge key={skill.id} skill={skill} featured />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Toutes les compétences avec catégories */}
                  <div className="space-y-3 sm:space-y-4">
                    {Array.from(new Set(profile.skills.map(skill => skill.category))).slice(0, 3).map((category) => {
                      const categorySkills = profile.skills.filter(skill => 
                        skill.category === category && !skill.featured
                      ).slice(0, 6)
                      
                      if (categorySkills.length === 0) return null

                      return (
                        <div key={category} className="space-y-1.5 sm:space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide truncate max-w-[120px] sm:max-w-none">
                              {category}
                            </span>
                            <Badge variant="outline" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5">
                              {categorySkills.length}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1 sm:gap-1.5">
                            {categorySkills.map((skill) => (
                              <SkillBadge key={skill.id} skill={skill} />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Statistiques rapides */}
                  <div className="pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                      <div className="p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                          {Math.round(profile.skills.reduce((acc, skill) => acc + skill.yearsOfExperience, 0) / profile.skills.length * 10) / 10}
                        </div>
                        <div className="text-[8px] sm:text-[10px] text-slate-500 dark:text-slate-500">
                          {dict?.publicProfile?.avgYears || "Ans moy."}
                        </div>
                      </div>
                      <div className="p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                          {profile.skills.filter(skill => skill.level === 'expert' || skill.level === 'advanced').length}
                        </div>
                        <div className="text-[8px] sm:text-[10px] text-slate-500 dark:text-slate-500">
                          {dict?.publicProfile?.advanced || "Avancées"}
                        </div>
                      </div>
                      <div className="p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                          {new Set(profile.skills.map(skill => skill.category)).size}
                        </div>
                        <div className="text-[8px] sm:text-[10px] text-slate-500 dark:text-slate-500">
                          {dict?.publicProfile?.categories || "Catégories"}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contenu principal amélioré */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner h-auto min-h-[42px]">
                <TabsTrigger 
                  value="about" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg dark:data-[state=active]:bg-slate-900 transition-all text-xs sm:text-sm py-1.5 sm:py-2"
                >
                  <span className="hidden xs:inline">{dict?.publicProfile?.tabs?.about || "À propos"}</span>
                  <span className="xs:hidden">📝</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="portfolio" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg dark:data-[state=active]:bg-slate-900 transition-all text-xs sm:text-sm py-1.5 sm:py-2"
                >
                  <span className="hidden xs:inline">{dict?.publicProfile?.tabs?.portfolio || "Portfolio"}</span>
                  <span className="xs:hidden">🎨</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="experience" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg dark:data-[state=active]:bg-slate-900 transition-all text-xs sm:text-sm py-1.5 sm:py-2"
                >
                  <span className="hidden xs:inline">{dict?.publicProfile?.tabs?.experience || "Expérience"}</span>
                  <span className="xs:hidden">💼</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg dark:data-[state=active]:bg-slate-900 transition-all text-xs sm:text-sm py-1.5 sm:py-2"
                >
                  <span className="hidden xs:inline">{dict?.publicProfile?.tabs?.reviews || "Avis"} {profile.reviews?.length > 0 && `(${profile.reviews.length})`}</span>
                  <span className="xs:hidden">⭐</span>
                </TabsTrigger>
              </TabsList>

              {/* À propos amélioré */}
              <TabsContent value="about" className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-300">
                <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      {dict?.publicProfile?.bio || "Bio"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base lg:text-lg">
                        {profile.bio || (
                          <span className="text-slate-400 dark:text-slate-600 italic">
                            {dict?.publicProfile?.noBio || "Aucune bio disponible."}
                          </span>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Éducation améliorée - MISE À JOUR */}
                {profile.education && profile.education.length > 0 && (
                  <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                        {dict?.publicProfile?.education || "Formation"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6">
                      {profile.education.map((edu) => (
                        <div 
                          key={edu.id} 
                          className="flex flex-col sm:flex-row gap-3 sm:gap-4 group p-3 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
                        >
                          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-base sm:text-lg mb-1 break-words">
                              {edu.school}
                            </h4>
                            <p className="text-slate-600 dark:text-slate-400 font-medium text-sm sm:text-base mb-1 sm:mb-2">
                              {edu.degree} {dict?.publicProfile?.in || "en"} {edu.field}
                            </p>
                            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-500">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>
                                {new Date(edu.startDate).getFullYear()} - {edu.current ? dict?.publicProfile?.present || 'Présent' : new Date(edu.endDate!).getFullYear()}
                              </span>
                            </div>
                            {edu.description && (
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
                                {edu.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
                
              {/* Portfolio amélioré */}
              <TabsContent value="portfolio" className="animate-in fade-in-50 duration-300">
                <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Palette className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                        {dict?.publicProfile?.portfolio || "Portfolio"}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {(profile.portfolio?.length || 0)} {dict?.publicProfile?.projects || "projet"}
                        {(profile.portfolio?.length || 0) !== 1 ? 's' : ''} {dict?.publicProfile?.realized || "réalisé"}
                        {(profile.portfolio?.length || 0) !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(profile.portfolio?.length || 0) > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {profile.portfolio.map((item) => (
                          <div 
                            key={item.id} 
                            className="group border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                          >
                            <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                              <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              {item.featured && (
                                <Badge className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 shadow-lg text-[10px] sm:text-xs">
                                  <Star className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 fill-current" />
                                  <span className="hidden xs:inline">{dict?.publicProfile?.featured || "Vedette"}</span>
                                  <span className="xs:hidden">★</span>
                                </Badge>
                              )}
                              {item.url && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 bg-white/90 hover:bg-white border-0 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity h-7 sm:h-8 text-xs"
                                  asChild
                                >
                                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                    <span className="hidden xs:inline">{dict?.publicProfile?.viewProject || "Voir"}</span>
                                    <span className="xs:hidden">👁️</span>
                                  </a>
                                </Button>
                              )}
                            </div>
                            <div className="p-3 sm:p-4">
                              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 sm:mb-2 line-clamp-1 text-sm sm:text-base">
                                {item.title}
                              </h4>
                              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">
                                {item.description}
                              </p>
                              <div className="flex flex-wrap gap-1 mb-2 sm:mb-4">
                                {item.technologies.slice(0, 3).map((tech, index) => (
                                  <Badge key={index} variant="outline" className="text-[9px] sm:text-xs bg-slate-50 dark:bg-slate-800">
                                    {tech}
                                  </Badge>
                                ))}
                                {item.technologies.length > 3 && (
                                  <Badge variant="secondary" className="text-[9px] sm:text-xs">
                                    +{item.technologies.length - 3}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 uppercase font-semibold tracking-wider">
                                  {item.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 sm:py-12">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <Palette className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 sm:mb-2 text-sm sm:text-base">
                          {dict?.publicProfile?.noPortfolio || "Aucun projet portfolio"}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 max-w-sm mx-auto text-xs sm:text-sm">
                          {dict?.publicProfile?.noPortfolioDesc || 
                            "Ce freelance n'a pas encore ajouté de projets à son portfolio."}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Expérience professionnelle améliorée */}
              <TabsContent value="experience" className="animate-in fade-in-50 duration-300">
                <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                        {dict?.publicProfile?.experience || "Expérience professionnelle"}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {(profile.experience?.length || 0)} {dict?.publicProfile?.position || "poste"}
                        {(profile.experience?.length || 0) !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {profile.experience && profile.experience.length > 0 ? (
                      <div className="space-y-4 sm:space-y-6">
                        {profile.experience.map((exp) => (
                          <div 
                            key={exp.id} 
                            className="flex flex-col sm:flex-row gap-3 sm:gap-4 group p-3 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md transition-all"
                          >
                            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                              <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                                <div>
                                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-base sm:text-lg break-words">
                                    {exp.position}
                                  </h4>
                                  <p className="text-slate-600 dark:text-slate-400 font-medium text-sm sm:text-base">
                                    {exp.company}
                                  </p>
                                </div>
                                <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 w-fit text-xs">
                                  {exp.current ? dict?.publicProfile?.current || 'Actuel' : dict?.publicProfile?.past || 'Passé'}
                                </Badge>
                              </div>
                              <p className="text-slate-500 dark:text-slate-500 text-xs sm:text-sm mb-2 sm:mb-3">
                                {new Date(exp.startDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'en' ? 'en-US' : 'fr-FR', { month: 'long', year: 'numeric' })} - {exp.current ? dict?.publicProfile?.present || 'Présent' : new Date(exp.endDate!).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'en' ? 'en-US' : 'fr-FR', { month: 'long', year: 'numeric' })}
                              </p>
                              <p className="text-slate-700 dark:text-slate-300 mb-2 sm:mb-3 text-sm sm:text-base">
                                {exp.description}
                              </p>
                              {exp.achievement && (
                                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mb-2 sm:mb-3">
                                  <span className="font-semibold">{dict?.publicProfile?.achievements || "Réalisations"}:</span> {exp.achievement}
                                </p>
                              )}
                              {exp.technologies.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {exp.technologies.slice(0, 4).map((tech, index) => (
                                    <Badge key={index} variant="secondary" className="text-[9px] sm:text-xs bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                                      {tech}
                                    </Badge>
                                  ))}
                                  {exp.technologies.length > 4 && (
                                    <Badge variant="secondary" className="text-[9px] sm:text-xs">
                                      +{exp.technologies.length - 4}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 sm:py-12">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <Briefcase className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 sm:mb-2 text-sm sm:text-base">
                          {dict?.publicProfile?.noExperience || "Aucune expérience"}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 max-w-sm mx-auto text-xs sm:text-sm">
                          {dict?.publicProfile?.noExperienceDesc || 
                            "Ce freelance n'a pas encore ajouté d'expérience professionnelle."}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Avis et recommandations améliorés */}
              <TabsContent value="reviews" className="animate-in fade-in-50 duration-300">
                <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2 mb-1 sm:mb-2 text-sm sm:text-base">
                          <Star className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 fill-current" />
                          {dict?.publicProfile?.reviews || "Avis clients"}
                        </CardTitle>
                        {profileStats && profileStats.totalReviews > 0 ? (
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <div className="flex items-center gap-0.5 sm:gap-1">
                                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current" />
                                <span className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                                  {profileStats.averageRating.toFixed(1)}
                                </span>
                              </div>
                              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-500">
                                {dict?.publicProfile?.outOf || "sur"} 5 • {profileStats.totalReviews} {dict?.publicProfile?.reviewsCount || "avis"}
                              </span>
                            </div>
                            {profileStats.recommendationRate > 0 && (
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs">
                                <Heart className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 fill-current" />
                                {profileStats.recommendationRate}% {dict?.publicProfile?.recommend || "recommandent"}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <CardDescription className="text-xs sm:text-sm">
                            {dict?.publicProfile?.noReviews || "Aucun avis pour le moment"}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(profile.reviews && profile.reviews.length) > 0 ? (
                      <div className="space-y-4 sm:space-y-6">
                        {profile.reviews.map((review) => (
                          <div 
                            key={review.id} 
                            className="p-3 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-slate-200 dark:border-slate-700 flex-shrink-0">
                                <AvatarImage src={review.clientAvatar} />
                                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white font-semibold">
                                  {review.clientName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                                  <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                                      {review.clientName}
                                    </h4>
                                    <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                                      {review.project}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                          i < review.rating
                                            ? 'text-yellow-500 fill-current'
                                            : 'text-slate-300 dark:text-slate-600'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 mb-2 sm:mb-3 leading-relaxed text-sm sm:text-base">
                                  {review.comment}
                                </p>
                                <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2">
                                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-500">
                                    <span>
                                      {new Date(review.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'en' ? 'en-US' : 'fr-FR', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      })}
                                    </span>
                                    {review.wouldRecommend && (
                                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 text-[10px] sm:text-xs">
                                        <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                        {dict?.publicProfile?.recommends || "Recommande"}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 sm:py-12">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <Star className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 sm:mb-2 text-sm sm:text-base">
                          {dict?.publicProfile?.noReviews || "Aucun avis"}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 max-w-sm mx-auto text-xs sm:text-sm">
                          {dict?.publicProfile?.noReviewsDesc || 
                            "Ce freelance n'a pas encore reçu d'avis."}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Review System */}
              <div className="mt-4 sm:mt-6">
                <ReviewSystem 
                  userId={profile._id}
                  userRole={profile.role === 'freelance' ? 'freelancer' : 'client'}
                  isOwnProfile={session?.user?.id === profile._id}
                  dict={dict}
                  lang={lang}
                />
              </div>
            </Tabs>
          </div>
        </div>
      </div>
      {/* CV Modal */}
      {profile.role === 'freelance' && (
        <CVViewerModal
          isOpen={showCVModal}
          onClose={() => setShowCVModal(false)}
          userId={profile._id}
          userName={profile.name}
          dict={dict}
        />
      )}
    </div>
  )
}