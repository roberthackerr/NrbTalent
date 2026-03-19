"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
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
  ExternalLink
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Skills } from "@/lib/models/skills"
import { Experience } from "@/lib/models/user"
import { SkillBadge } from "@/components/SkillBadge"

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
  isVerified: boolean
  joinDate: string
  completionScore: number
  hourlyRate?: number
  totalEarnings?: number
  languages: string[]
  skills: Skills[]
  education: Education[]
  experience: Experience[]
  portfolio: PortfolioItem[]
  reviews: Review[]
  availability: "available" | "busy" | "unavailable"
  badges: Badge[]
  statistics: UserStatistics
  socialLinks: SocialLinks
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
}

// Composant Skeleton optimisé
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
            <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-t-2xl"></div>
            <div className="p-6 -mt-16">
              <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
                <div className="flex items-end gap-6">
                  <div className="h-32 w-32 rounded-full bg-slate-300 dark:bg-slate-700 border-4 border-white dark:border-slate-900"></div>
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

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [newBio, setNewBio] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState("about")

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        console.log(data)
        setNewBio(data.bio || "")
      } else {
        throw new Error('Failed to fetch profile')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error("Erreur lors du chargement du profil")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image valide")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image doit faire moins de 5MB")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(prev => prev ? { ...prev, avatar: data.avatarUrl } : null)
        
        await update({
          ...session,
          user: {
            ...session?.user,
            image: data.avatarUrl
          }
        })
        
        toast.success("Photo de profil mise à jour avec succès")
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error("Erreur lors du téléchargement de l'image")
    } finally {
      setIsUploading(false)
    }
  }

  const updateBio = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          section: 'basic',
          data: { bio: newBio }
        }),
      })

      if (response.ok) {
        setProfile(prev => prev ? { ...prev, bio: newBio } : null)
        setIsEditingBio(false)
        toast.success("Bio mise à jour avec succès")
      }
    } catch (error) {
      console.error('Error updating bio:', error)
      toast.error("Erreur lors de la mise à jour de la bio")
    }
  }

  const toggleAvailability = async () => {
    if (!profile) return

    const newAvailability = profile.availability === 'available' ? 'busy' : 'available'
    
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          section: 'professional',
          data: { availability: newAvailability }
        }),
      })

      if (response.ok) {
        setProfile(prev => prev ? { ...prev, availability: newAvailability } : null)
        toast.success(`Statut mis à jour: ${newAvailability === 'available' ? 'Disponible' : 'Occupé'}`)
      }
    } catch (error) {
      console.error('Error updating availability:', error)
      toast.error("Erreur lors de la mise à jour du statut")
    }
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
      totalReviews: profile.reviews?.length | 0,
      recommendationRate: profile.reviews?.length > 0 ? (recommendedReviews / profile.reviews?.length) * 100 : 0
    }
  }, [profile])

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20 pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="h-10 w-10 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Profil non trouvé</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Nous n'avons pas pu charger votre profil</p>
          <Button asChild>
            <Link href="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20 pt-16">
      {/* Header avec image de couverture */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
          {profile.coverImage ? (
            <Image
              src={profile.coverImage}
              alt="Cover"
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90"></div>
          )}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        <div className="container mx-auto px-4 -mt-16 relative z-10">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800">
            <div className="p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
                <div className="flex items-end gap-6">
                  {/* Avatar avec upload */}
                  <div className="relative group">
                    <Avatar className="h-32 w-32 border-4 border-white dark:border-slate-900 shadow-xl">
                      <AvatarImage src={profile.avatar} alt={profile.name} />
                      <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 font-semibold">
                        {profile.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <label 
                      htmlFor="avatar-upload"
                      className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm"
                    >
                      <Edit className="h-6 w-6 text-white" />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={isUploading}
                      />
                    </label>
                    
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                      </div>
                    )}
                  </div>

                  {/* Informations principales */}
                  <div className="space-y-3 pb-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                        {profile.name}
                      </h1>
                      {profile.isVerified && (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 px-3 py-1">
                          <Shield className="h-3 w-3 mr-1" />
                          Vérifié
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Briefcase className="h-4 w-4" />
                        <span className="font-medium">{profile.title || (profile.role === 'freelance' ? 'Freelance' : 'Client')}</span>
                        {profile.role === 'freelance' && profile.hourlyRate && (
                          <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">
                            ${profile.hourlyRate}/h
                          </span>
                        )}
                      </div>

                      {profile.location && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <MapPin className="h-4 w-4" />
                          <span>{profile.location}</span>
                        </div>
                      )}

                      {profileStats && profileStats.totalReviews > 0 && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="font-semibold">{profileStats.averageRating.toFixed(1)}</span>
                          <span>({profileStats.totalReviews})</span>
                        </div>
                      )}
                    </div>

                    {/* Badges */}
                    {profile.badges && profile.badges.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {profile.badges.slice(0, 3).map((badge, index) => (
                          <Badge key={index} variant="outline" className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                            <Medal className="h-3 w-3 mr-1" />
                            {badge.type.replace('_', ' ')}
                          </Badge>
                        ))}
                        {profile.badges.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{profile.badges.length - 3} autres
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Button 
                    variant={profile.availability === 'available' ? "default" : "outline"}
                    size="sm"
                    onClick={toggleAvailability}
                    className={cn(
                      "transition-all",
                      profile.availability === 'available' 
                        ? "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/25" 
                        : "border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/50"
                    )}
                  >
                    {profile.availability === 'available' ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Disponible
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Occupé
                      </>
                    )}
                  </Button>

                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Modifier
                    </Link>
                  </Button>
                  
                  {profile.role === 'client' && (
                    <Button size="sm" asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25">
                      <Link href="/projects/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau projet
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Score de complétion */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Profil complété à
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Progress value={profile.completionScore} className="h-2 bg-slate-200 dark:bg-slate-800" />
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {profile.completionScore}%
                    </span>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Complétez votre profil pour augmenter votre visibilité de 40%
                </p>
              </CardContent>
            </Card>

            {/* Statistiques rapides */}
            {profile.role === 'freelance' && profile.statistics && (
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {profile.statistics.completedProjects}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">Projets</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {profile.statistics.successRate}%
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">Réussite</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {profile.statistics.responseRate}%
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">Réponse</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {profile.statistics.repeatClientRate}%
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">Fidélité</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informations de contact */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">{profile.email}</span>
                </div>
                
                {profile.phone && (
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">{profile.phone}</span>
                  </div>
                )}

                {/* Réseaux sociaux */}
                <div className="flex items-center gap-3 pt-2">
                  {profile.socialLinks?.website && (
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                      <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {profile.socialLinks?.linkedin && (
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                      <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {profile.socialLinks?.github && (
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                      <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {profile.socialLinks?.twitter && (
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                      <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Compétences */}
   {profile.skills?.length > 0 && (
  <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="pb-4">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Zap className="h-5 w-5 text-yellow-500" />
          Mes Compétences
          <Badge variant="outline" className="ml-2 bg-slate-100 dark:bg-slate-800">
            {profile.skills.length}
          </Badge>
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/settings?tab=skills">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <CardDescription>
        {profile.skills.filter(skill => skill.featured).length} compétences en vedette
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Compétences en vedette */}
      {profile.skills.filter(skill => skill.featured).length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Compétences en vedette
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
                <span className="text-xs text-slate-500 dark:text-slate-500">
                  {categorySkills.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
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
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {Math.round(profile.skills.reduce((acc, skill) => acc + skill.yearsOfExperience, 0) / profile.skills.length * 10) / 10}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500">Ans moy.</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {profile.skills.filter(skill => skill.level === 'expert' || skill.level === 'advanced').length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500">Avancées</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {new Set(profile.skills.map(skill => skill.category)).size}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500">Catégories</div>
          </div>
        </div>
      </div>

      {/* Action */}
      {profile.skills.length > 8 && (
        <div className="pt-2">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/dashboard/settings?tab=skills">
              Voir toutes les compétences ({profile.skills.length})
            </Link>
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
)}
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <TabsTrigger 
                  value="about" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
                >
                  À propos
                </TabsTrigger>
                <TabsTrigger 
                  value="portfolio" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
                >
                  Portfolio
                </TabsTrigger>
                <TabsTrigger 
                  value="experience" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
                >
                  Expérience
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
                >
                  Avis {profile.reviews?.length > 0 && `(${profile.reviews.length})`}
                </TabsTrigger>
              </TabsList>

              {/* À propos */}
              <TabsContent value="about" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle>Bio</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingBio(!isEditingBio)}
                      className="h-8"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {isEditingBio ? 'Annuler' : 'Modifier'}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isEditingBio ? (
                      <div className="space-y-4">
                        <Textarea
                          value={newBio}
                          onChange={(e) => setNewBio(e.target.value)}
                          placeholder="Décrivez-vous, vos compétences, votre expérience..."
                          className="min-h-[120px] resize-none border-slate-200 dark:border-slate-700 focus:border-blue-500"
                        />
                        <div className="flex gap-2">
                          <Button onClick={updateBio} size="sm" className="bg-blue-600 hover:bg-blue-700">
                            Enregistrer
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsEditingBio(false)
                              setNewBio(profile.bio || "")
                            }}
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                        {profile.bio || (
                          <span className="text-slate-400 dark:text-slate-600 italic">
                            Aucune bio renseignée. Décrivez-vous pour attirer plus de clients.
                          </span>
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Éducation */}
                {profile.education?.length > 0 && (
                  <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-500" />
                        Formation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {profile.education.map((edu) => (
                        <div key={edu.id} className="flex gap-4 group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-4 rounded-lg transition-colors">
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                            <Award className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1">
                              {edu.school}
                            </h4>
                            <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">
                              {edu.degree} en {edu.field}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(edu.startDate).getFullYear()} - {edu.current ? 'Présent' : new Date(edu.endDate!).getFullYear()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
                
              {/* Portfolio */}
              <TabsContent value="portfolio" className="animate-in fade-in duration-300">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Portfolio</CardTitle>
                      <CardDescription>
                        {(profile.portfolio?.length! | 0)} projet{(profile.portfolio && profile.portfolio.length ) !== 1 ? 's' : ''} réalisé{(profile.portfolio && profile.portfolio.length ) !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700">
                      <Link href="/dashboard/portfolio">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un projet
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {(profile.portfolio?.length! | 0) > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {profile.portfolio.map((item) => (
                          <div 
                            key={item.id} 
                            className="group border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                          >
                            <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                              <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                              {item.featured && (
                                <Badge className="absolute top-3 left-3 bg-yellow-500 hover:bg-yellow-600 text-white border-0">
                                  <Star className="h-3 w-3 mr-1" />
                                  Vedette
                                </Badge>
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
                                <span className="text-xs text-slate-500 dark:text-slate-500 uppercase font-semibold">
                                  {item.category}
                                </span>
                                {item.url && (
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                      <Eye className="h-3 w-3" />
                                      <span className="text-xs">Voir</span>
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Target className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          Aucun projet portfolio
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                          Montrez votre travail pour impressionner les clients et augmentez vos chances d'être embauché
                        </p>
                        <Button asChild className="bg-blue-600 hover:bg-blue-700">
                          <Link href="/dashboard/settings">
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter votre premier projet
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Expérience professionnelle */}
              <TabsContent value="experience" className="animate-in fade-in duration-300">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Expérience professionnelle</CardTitle>
                      <CardDescription>
                        {(profile.experience && profile.experience.length)} poste{(profile.experience && profile.experience.length) !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700">
                      <Link href="/dashboard/settings">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {profile.experience &&  profile.experience.length > 0 ? (
                      <div className="space-y-6">
                        {profile.experience.map((exp) => (
                          <div 
                            key={exp.id} 
                            className="flex gap-4 group p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                          >
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
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
                                  {exp.current ? 'Actuel' : 'Passé'}
                                </Badge>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                                {new Date(exp.startDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} - {exp.current ? 'Présent' : new Date(exp.endDate!).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                              </p>
                              <p className="text-slate-700 dark:text-slate-300 mb-3">
                                {exp.description}
                              </p>
                                                      <p className="text-slate-700 dark:text-slate-300 mb-3">
                          
                                réalisations: {exp.achievement}
                              </p>
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
                          Aucune expérience ajoutée
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                          Ajoutez votre expérience professionnelle pour renforcer votre crédibilité et montrer votre expertise
                        </p>
                        <Button asChild className="bg-blue-600 hover:bg-blue-700">
                          <Link href="/dashboard/experience">
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter une expérience
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Avis et recommandations */}
              <TabsContent value="reviews" className="animate-in fade-in duration-300">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Avis clients</CardTitle>
                        <CardDescription>
                          {profileStats && profileStats.totalReviews > 0 ? (
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Star className="h-6 w-6 text-yellow-500 fill-current" />
                                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {profileStats.averageRating.toFixed(1)}
                                  </span>
                                </div>
                                <span className="text-slate-500 dark:text-slate-500">
                                  sur 5 • {profileStats.totalReviews} avis
                                </span>
                              </div>
                              {profileStats.recommendationRate > 0 && (
                                <Badge variant="outline" className="bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                                  <Heart className="h-3 w-3 mr-1" />
                                  {profileStats.recommendationRate}% recommandent
                                </Badge>
                              )}
                            </div>
                          ) : (
                            "Aucun avis pour le moment"
                          )}
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Partager
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(profile.reviews && profile.reviews.length) > 0 ? (
                      <div className="space-y-6">
                        {profile.reviews.map((review) => (
                          <div 
                            key={review.id} 
                            className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-start gap-4">
                              <Avatar className="h-12 w-12 border-2 border-slate-200 dark:border-slate-700">
                                <AvatarImage src={review.clientAvatar} />
                                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white font-semibold">
                                  {review.clientName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
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
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-500">
                                    <span>
                                      {new Date(review.date).toLocaleDateString('fr-FR', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      })}
                                    </span>
                                    {review.wouldRecommend && (
                                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 text-xs">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Recommande
                                      </Badge>
                                    )}
                                  </div>
                                  <Button variant="ghost" size="sm" className="h-8">
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Répondre
                                  </Button>
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
                          Aucun avis pour le moment
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                          Les avis de vos clients apparaîtront ici une fois vos projets terminés.
                          Commencez par compléter vos premiers projets !
                        </p>
                        <Button asChild className="bg-blue-600 hover:bg-blue-700">
                          <Link href="/projects">
                            <Briefcase className="h-4 w-4 mr-2" />
                            Parcourir les projets
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}