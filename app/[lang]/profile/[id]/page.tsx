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
  languages: string[]
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

// Composant Skeleton optimisé
function ProfileSkeleton({ dict }: { dict: any }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20 pt-16">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8 overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 relative">
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
            <div className="p-6 -mt-16">
              <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
                <div className="flex items-end gap-6">
                  <div className="h-32 w-32 rounded-full bg-slate-300 dark:bg-slate-700 border-4 border-white dark:border-slate-900 shadow-xl"></div>
                  <div className="space-y-3 pb-2">
                    <div className="h-8 w-64 bg-slate-300 dark:bg-slate-700 rounded"></div>
                    <div className="h-4 w-48 bg-slate-300 dark:bg-slate-700 rounded"></div>
                    <div className="h-4 w-36 bg-slate-300 dark:bg-slate-700 rounded"></div>
                  </div>
                </div>
                <div className="h-10 w-32 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                  <div className="h-6 w-32 bg-slate-300 dark:bg-slate-700 rounded mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-4 bg-slate-300 dark:bg-slate-700 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="h-8 w-48 bg-slate-300 dark:bg-slate-700 rounded mb-6"></div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
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
          <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="h-10 w-10 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{dict?.publicProfile?.notFound || "Profil non trouvé"}</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {dict?.publicProfile?.notFoundDesc || "Ce profil n'existe pas ou a été supprimé"}
          </p>
          <Button asChild>
            <Link href={`/${lang}/projects`}>{dict?.publicProfile?.viewProjects || "Voir les projets"}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20 pt-16">
      {/* Header avec image de couverture améliorée */}
      <div className="relative">
        <div className="h-56 lg:h-64 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
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
                <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
              </div>
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 -mt-20 relative z-10 max-w-7xl">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
                <div className="flex items-end gap-6">
                  {/* Avatar */}
                  <div className="relative group">
                    <Avatar className="h-28 w-28 lg:h-32 lg:w-32 border-4 border-white dark:border-slate-900 shadow-2xl">
                      <AvatarImage src={profile.avatar} alt={profile.name} />
                      <AvatarFallback className="text-3xl lg:text-4xl bg-gradient-to-br from-blue-500 to-purple-600 font-semibold">
                        {profile.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Informations principales améliorées */}
                  <div className="space-y-3 pb-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                        {profile.name}
                      </h1>
                      {profile.isVerified && (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 px-3 py-1 text-xs lg:text-sm">
                          <Shield className="h-3 w-3 mr-1" />
                          {dict?.publicProfile?.verified || "Vérifié"}
                        </Badge>
                      )}
                      {profile.badges?.map((badge, index) => (
                        <Badge 
                          key={index} 
                          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-3 py-1 text-xs lg:text-sm"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {badge.type.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Briefcase className="h-4 w-4" />
                        <span className="font-medium text-sm lg:text-base">
                          {profile.title || (profile.role === 'freelance' ? dict?.publicProfile?.freelance : dict?.publicProfile?.client)}
                        </span>
                      </div>

                      {profile.role === 'freelance' && profile.hourlyRate && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold text-sm lg:text-base">{profile.hourlyRate}/h</span>
                        </div>
                      )}

                      {profile.location && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm lg:text-base">{profile.location}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm lg:text-base">
                          {dict?.publicProfile?.memberSince || "Membre depuis"} {new Date(profile.joinDate).getFullYear()}
                        </span>
                      </div>
                    </div>

                    {profileStats && profileStats.totalReviews > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.round(profileStats.averageRating)
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-slate-300 dark:text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {profileStats.averageRating.toFixed(1)} ({profileStats.totalReviews} {dict?.publicProfile?.reviews || "avis"})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions améliorées */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg",
                    profile.availability === 'available' 
                      ? "bg-green-500 text-white shadow-green-500/25" 
                      : profile.availability === 'busy'
                      ? "bg-orange-500 text-white"
                      : "bg-slate-400 text-white"
                  )}>
                    {profile.availability === 'available' ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        {dict?.publicProfile?.available || "Disponible"}
                      </>
                    ) : profile.availability === 'busy' ? (
                      <>
                        <Clock className="h-4 w-4" />
                        {dict?.publicProfile?.busy || "Occupé"}
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4" />
                        {dict?.publicProfile?.unavailable || "Indisponible"}
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
                    <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? 'fill-current' : ''}`} />
                    {isSaved 
                      ? (dict?.publicProfile?.saved || "Sauvegardé")
                      : (dict?.publicProfile?.save || "Sauvegarder")}
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleContact}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {dict?.publicProfile?.contact || "Contacter"}
                  </Button>

                  <Button size="sm" variant="outline" className="shadow-sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    {dict?.publicProfile?.share || "Partager"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar améliorée */}
          <div className="space-y-6">
            {/* Score de complétion */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-blue-500" />
                  {dict?.publicProfile?.completion || "Profil complété à"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {profile.completionScore}%
                    </span>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <Progress value={profile.completionScore} className="h-2 bg-slate-200 dark:bg-slate-800" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  {dict?.publicProfile?.completionTip?.replace('{percent}', '40') || 
                    "Complétez votre profil pour augmenter votre visibilité"}
                </p>
              </CardContent>
            </Card>

            {/* Statistiques rapides améliorées */}
            {profile.role === 'freelance' && profile.statistics && (
              <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                  <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    {dict?.publicProfile?.performance || "Performance"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {profile.statistics.completedProjects}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        {dict?.publicProfile?.projects || "Projets"}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {profile.statistics.successRate}%
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        {dict?.publicProfile?.success || "Réussite"}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {profile.statistics.responseRate}%
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        {dict?.publicProfile?.response || "Réponse"}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {profile.statistics.repeatClientRate}%
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        {dict?.publicProfile?.repeat || "Fidélité"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informations de contact améliorées */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  {dict?.publicProfile?.contactInfo || "Contact"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm truncate">{profile.email}</span>
                </div>
                
                {profile.phone && (
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm">{profile.phone}</span>
                  </div>
                )}

                {/* Réseaux sociaux améliorés */}
                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  {profile.socialLinks?.website && (
                    <Button variant="outline" size="icon" asChild className="h-9 w-9 rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 transition-all">
                      <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {profile.socialLinks?.linkedin && (
                    <Button variant="outline" size="icon" asChild className="h-9 w-9 rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 transition-all">
                      <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {profile.socialLinks?.github && (
                    <Button variant="outline" size="icon" asChild className="h-9 w-9 rounded-full hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white transition-all">
                      <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {profile.socialLinks?.twitter && (
                    <Button variant="outline" size="icon" asChild className="h-9 w-9 rounded-full hover:bg-sky-50 hover:text-sky-500 dark:hover:bg-sky-950/50 transition-all">
                      <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {profile.socialLinks?.instagram && (
                    <Button variant="outline" size="icon" asChild className="h-9 w-9 rounded-full hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-950/50 transition-all">
                      <a href={profile.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                        <Instagram className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Compétences améliorées */}
            {profile.skills?.length > 0 && (
              <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      {dict?.publicProfile?.skills || "Compétences"}
                      <Badge variant="outline" className="ml-2 bg-slate-100 dark:bg-slate-800">
                        {profile.skills.length}
                      </Badge>
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {profile.skills.filter(skill => skill.featured).length} {dict?.publicProfile?.featured || "en vedette"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {/* Compétences en vedette */}
                  {profile.skills.filter(skill => skill.featured).length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                          {dict?.publicProfile?.featuredSkills || "Compétences en vedette"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
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
                  <div className="space-y-4">
                    {Array.from(new Set(profile.skills.map(skill => skill.category))).map((category) => {
                      const categorySkills = profile.skills.filter(skill => 
                        skill.category === category && !skill.featured
                      ).slice(0, 8)
                      
                      if (categorySkills.length === 0) return null

                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                              {category}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                              {categorySkills.length}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {categorySkills.map((skill) => (
                              <SkillBadge key={skill.id} skill={skill} />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Statistiques rapides */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {Math.round(profile.skills.reduce((acc, skill) => acc + skill.yearsOfExperience, 0) / profile.skills.length * 10) / 10}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-500">
                          {dict?.publicProfile?.avgYears || "Ans moy."}
                        </div>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {profile.skills.filter(skill => skill.level === 'expert' || skill.level === 'advanced').length}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-500">
                          {dict?.publicProfile?.advanced || "Avancées"}
                        </div>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {new Set(profile.skills.map(skill => skill.category)).size}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-500">
                          {dict?.publicProfile?.categories || "Catégories"}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Langues */}
            {profile.languages?.length > 0 && (
              <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-4 bg-gradient-to-r from-green-500/10 to-teal-500/10">
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <Languages className="h-5 w-5 text-green-500" />
                    {dict?.publicProfile?.languages || "Langues"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {profile.languages.map((lang, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <span className="font-medium text-sm">{lang}</span>
                        <Badge variant="outline" className="text-xs">Natif</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contenu principal amélioré */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner">
                <TabsTrigger 
                  value="about" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg dark:data-[state=active]:bg-slate-900 transition-all"
                >
                  {dict?.publicProfile?.tabs?.about || "À propos"}
                </TabsTrigger>
                <TabsTrigger 
                  value="portfolio" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg dark:data-[state=active]:bg-slate-900 transition-all"
                >
                  {dict?.publicProfile?.tabs?.portfolio || "Portfolio"}
                </TabsTrigger>
                <TabsTrigger 
                  value="experience" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg dark:data-[state=active]:bg-slate-900 transition-all"
                >
                  {dict?.publicProfile?.tabs?.experience || "Expérience"}
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg dark:data-[state=active]:bg-slate-900 transition-all"
                >
                  {dict?.publicProfile?.tabs?.reviews || "Avis"} {profile.reviews?.length > 0 && `(${profile.reviews.length})`}
                </TabsTrigger>
              </TabsList>

              {/* À propos amélioré */}
              <TabsContent value="about" className="space-y-6 animate-in fade-in-50 duration-300">
                <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      {dict?.publicProfile?.bio || "Bio"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base lg:text-lg">
                        {profile.bio || (
                          <span className="text-slate-400 dark:text-slate-600 italic">
                            {dict?.publicProfile?.noBio || "Aucune bio disponible."}
                          </span>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Éducation améliorée */}
                {profile.education?.length > 0 && (
                  <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-blue-500" />
                        {dict?.publicProfile?.education || "Formation"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {profile.education.map((edu, index) => (
                        <div 
                          key={edu.id} 
                          className="flex gap-4 group p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
                        >
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <GraduationCap className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1">
                              {edu.school}
                            </h4>
                            <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">
                              {edu.degree} {dict?.publicProfile?.in || "en"} {edu.field}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(edu.startDate).getFullYear()} - {edu.current ? dict?.publicProfile?.present || 'Présent' : new Date(edu.endDate!).getFullYear()}
                              </span>
                            </div>
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
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-purple-500" />
                        {dict?.publicProfile?.portfolio || "Portfolio"}
                      </CardTitle>
                      <CardDescription>
                        {(profile.portfolio?.length || 0)} {dict?.publicProfile?.projects || "projet"}
                        {(profile.portfolio?.length || 0) !== 1 ? 's' : ''} {dict?.publicProfile?.realized || "réalisé"}
                        {(profile.portfolio?.length || 0) !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(profile.portfolio?.length || 0) > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <Badge className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 shadow-lg">
                                  <Star className="h-3 w-3 mr-1 fill-current" />
                                  {dict?.publicProfile?.featured || "Vedette"}
                                </Badge>
                              )}
                              {item.url && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="absolute bottom-3 right-3 bg-white/90 hover:bg-white border-0 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                  asChild
                                >
                                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-3 w-3 mr-1" />
                                    {dict?.publicProfile?.viewProject || "Voir"}
                                  </a>
                                </Button>
                              )}
                            </div>
                            <div className="p-4">
                              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-1">
                                {item.title}
                              </h4>
                              <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 line-clamp-2">
                                {item.description}
                              </p>
                              <div className="flex flex-wrap gap-1 mb-4">
                                {item.technologies.slice(0, 3).map((tech, index) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800">
                                    {tech}
                                  </Badge>
                                ))}
                                {item.technologies.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{item.technologies.length - 3}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 dark:text-slate-500 uppercase font-semibold tracking-wider">
                                  {item.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Palette className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          {dict?.publicProfile?.noPortfolio || "Aucun projet portfolio"}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
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
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-green-500" />
                        {dict?.publicProfile?.experience || "Expérience professionnelle"}
                      </CardTitle>
                      <CardDescription>
                        {(profile.experience?.length || 0)} {dict?.publicProfile?.position || "poste"}
                        {(profile.experience?.length || 0) !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {profile.experience && profile.experience.length > 0 ? (
                      <div className="space-y-6">
                        {profile.experience.map((exp) => (
                          <div 
                            key={exp.id} 
                            className="flex gap-4 group p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md transition-all"
                          >
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                              <Briefcase className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
                                    {exp.position}
                                  </h4>
                                  <p className="text-slate-600 dark:text-slate-400 font-medium">
                                    {exp.company}
                                  </p>
                                </div>
                                <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800">
                                  {exp.current ? dict?.publicProfile?.current || 'Actuel' : dict?.publicProfile?.past || 'Passé'}
                                </Badge>
                              </div>
                              <p className="text-slate-500 dark:text-slate-500 text-sm mb-3">
                                {new Date(exp.startDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'en' ? 'en-US' : 'fr-FR', { month: 'long', year: 'numeric' })} - {exp.current ? dict?.publicProfile?.present || 'Présent' : new Date(exp.endDate!).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'en' ? 'en-US' : 'fr-FR', { month: 'long', year: 'numeric' })}
                              </p>
                              <p className="text-slate-700 dark:text-slate-300 mb-3">
                                {exp.description}
                              </p>
                              {exp.achievement && (
                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                                  <span className="font-semibold">{dict?.publicProfile?.achievements || "Réalisations"}:</span> {exp.achievement}
                                </p>
                              )}
                              {exp.technologies.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {exp.technologies.map((tech, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                                      {tech}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Briefcase className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          {dict?.publicProfile?.noExperience || "Aucune expérience"}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
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
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2 mb-2">
                          <Star className="h-5 w-5 text-amber-500 fill-current" />
                          {dict?.publicProfile?.reviews || "Avis clients"}
                        </CardTitle>
                        {profileStats && profileStats.totalReviews > 0 ? (
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Star className="h-6 w-6 text-yellow-500 fill-current" />
                                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                  {profileStats.averageRating.toFixed(1)}
                                </span>
                              </div>
                              <span className="text-slate-500 dark:text-slate-500">
                                {dict?.publicProfile?.outOf || "sur"} 5 • {profileStats.totalReviews} {dict?.publicProfile?.reviewsCount || "avis"}
                              </span>
                            </div>
                            {profileStats.recommendationRate > 0 && (
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 px-3 py-1">
                                <Heart className="h-3 w-3 mr-1 fill-current" />
                                {profileStats.recommendationRate}% {dict?.publicProfile?.recommend || "recommandent"}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <CardDescription>
                            {dict?.publicProfile?.noReviews || "Aucun avis pour le moment"}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(profile.reviews && profile.reviews.length) > 0 ? (
                      <div className="space-y-6">
                        {profile.reviews.map((review) => (
                          <div 
                            key={review.id} 
                            className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all"
                          >
                            <div className="flex items-start gap-4">
                              <Avatar className="h-12 w-12 border-2 border-slate-200 dark:border-slate-700">
                                <AvatarImage src={review.clientAvatar} />
                                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white font-semibold">
                                  {review.clientName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                  <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                      {review.clientName}
                                    </h4>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                                      {review.project}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < review.rating
                                            ? 'text-yellow-500 fill-current'
                                            : 'text-slate-300 dark:text-slate-600'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">
                                  {review.comment}
                                </p>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-500">
                                    <span>
                                      {new Date(review.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'en' ? 'en-US' : 'fr-FR', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      })}
                                    </span>
                                    {review.wouldRecommend && (
                                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 text-xs">
                                        <CheckCircle className="h-3 w-3 mr-1" />
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
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Star className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          {dict?.publicProfile?.noReviews || "Aucun avis"}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                          {dict?.publicProfile?.noReviewsDesc || 
                            "Ce freelance n'a pas encore reçu d'avis."}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <div className="mt-6">
          <ReviewSystem 
            userId={profile._id}
            userRole={profile.role === 'freelance' ? 'freelancer' : 'client'}
            isOwnProfile={session?.user?.id === profile._id}
          />
        </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}