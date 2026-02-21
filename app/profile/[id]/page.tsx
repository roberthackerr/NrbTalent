// app/profile/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  MapPin, 
  Calendar, 
  Award, 
  Star, 
  CheckCircle, 
  Clock, 
  Mail, 
  Globe, 
  Linkedin,
  Github,
  Twitter,
  FileText,
  Briefcase,
  DollarSign,
  BookOpen,
  Eye,
  Users,
  Zap,
  TrendingUp,
  Medal,
  Shield,
  Heart,
  MessageCircle,
  ExternalLink,
  Bookmark,
  Share2
} from 'lucide-react'

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
  skills: Skill[]
  education: Education[]
  experience: Experience[]
  portfolio: PortfolioItem[]
  reviews: Review[]
  availability: "available" | "busy" | "unavailable"
  badges: Badge[]
  statistics: UserStatistics
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

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('about')
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [id])

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
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    }
  }

  const handleContact = () => {
    // Ouvrir le formulaire de contact ou rediriger vers la messagerie
    router.push(`/messages/new?user=${id}`)
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('fr-FR')

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            {/* Header Skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
              <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-t-2xl"></div>
              <div className="p-6 -mt-16">
                <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
                  <div className="flex items-end gap-6">
                    <div className="h-32 w-32 rounded-full bg-slate-300 dark:bg-slate-600 border-4 border-white dark:border-slate-800"></div>
                    <div className="space-y-3 pb-2">
                      <div className="h-8 w-64 bg-slate-300 dark:bg-slate-600 rounded"></div>
                      <div className="h-4 w-48 bg-slate-300 dark:bg-slate-600 rounded"></div>
                    </div>
                  </div>
                  <div className="h-10 w-32 bg-slate-300 dark:bg-slate-600 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="h-10 w-10 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Profil non trouvé</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Ce profil n'existe pas ou a été supprimé</p>
          <Link 
            href="/projects"
            className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700 transition-colors font-medium inline-block"
          >
            Voir les projets
          </Link>
        </div>
      </div>
    )
  }

  // Calcul des statistiques
  const averageRating = profile.reviews?.length > 0 
    ? profile.reviews.reduce((acc, review) => acc + review.rating, 0) / profile.reviews.length 
    : 0

  const recommendedReviews = profile.reviews?.filter(review => review.wouldRecommend).length
  const recommendationRate = profile.reviews?.length > 0 ? (recommendedReviews / profile.reviews.length) * 100 : 0

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 pt-16">
      {/* Header avec image de couverture */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-sky-600 to-purple-600 relative overflow-hidden">
          {profile.coverImage ? (
            <Image
              src={profile.coverImage}
              alt="Cover"
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-sky-600/90 to-purple-600/90"></div>
          )}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        <div className="container mx-auto px-4 -mt-16 relative z-10">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
                <div className="flex items-end gap-6">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="h-32 w-32 rounded-full border-4 border-white dark:border-slate-800 shadow-xl bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                      {profile.avatar ? (
                        <Image
                          src={profile.avatar}
                          alt={profile.name}
                          width={128}
                          height={128}
                          className="rounded-full"
                        />
                      ) : (
                        profile.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>

                  {/* Informations principales */}
                  <div className="space-y-3 pb-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
                        {profile.name}
                      </h1>
                      {profile.isVerified && (
                        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Vérifié
                        </div>
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

                      {profile.reviews?.length > 0 && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="font-semibold">{averageRating.toFixed(1)}</span>
                          <span>({profile.reviews.length})</span>
                        </div>
                      )}
                    </div>

                    {/* Badges */}
                    {profile.badges && profile.badges.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {profile.badges.slice(0, 3).map((badge, index) => (
                          <div key={index} className="bg-sky-50 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                            <Medal className="h-3 w-3" />
                            {badge.type.replace('_', ' ')}
                          </div>
                        ))}
                        {profile.badges.length > 3 && (
                          <div className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded text-xs">
                            +{profile.badges.length - 3} autres
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    profile.availability === 'available' 
                      ? "bg-green-500 text-white shadow-lg shadow-green-500/25" 
                      : "bg-orange-500 text-white"
                  }`}>
                    {profile.availability === 'available' ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Disponible
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4" />
                        Occupé
                      </>
                    )}
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    className={`p-2 rounded-lg border transition-colors ${
                      isSaved 
                        ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' 
                        : 'text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={handleContact}
                    className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contacter
                  </button>
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
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">
                Profil complété à
              </h3>
              <div className="space-y-4">
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-sky-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${profile.completionScore}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {profile.completionScore}%
                  </span>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </div>

            {/* Statistiques pour les freelances */}
            {profile.role === 'freelance' && profile.statistics && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Performance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
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
                    <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
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
              </div>
            )}

            {/* Informations de contact */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">
                Contact
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">{profile.email}</span>
                </div>
                
                {/* Réseaux sociaux */}
                <div className="flex items-center gap-3 pt-2">
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      <Globe className="h-4 w-4" />
                    </a>
                  )}
                  {profile.linkedin && (
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                  {profile.github && (
                    <a href={profile.github} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      <Github className="h-4 w-4" />
                    </a>
                  )}
                  {profile.twitter && (
                    <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      <Twitter className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Compétences */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">
                  Compétences
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.slice(0, 10).map((skill, index) => (
                    <div
                      key={index}
                      className="bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 px-3 py-1 rounded-full text-sm font-medium border border-sky-200 dark:border-sky-800"
                    >
                      {skill.name}
                    </div>
                  ))}
                  {profile.skills.length > 10 && (
                    <div className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full text-sm">
                      +{profile.skills.length - 10}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            {/* Navigation par onglets */}
            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-6">
              <div className="flex space-x-1">
                {['about', 'portfolio', 'experience', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab === 'about' && 'À propos'}
                    {tab === 'portfolio' && 'Portfolio'}
                    {tab === 'experience' && 'Expérience'}
                    {tab === 'reviews' && `Avis (${profile.reviews?.length || 0})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Contenu des onglets */}
            <div className="space-y-6">
              {/* À propos */}
              {activeTab === 'about' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Bio</h2>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                    {profile.bio || 'Aucune bio disponible.'}
                  </p>

                  {/* Éducation */}
                  {profile.education && profile.education.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-sky-500" />
                        Formation
                      </h3>
                      <div className="space-y-4">
                        {profile.education.map((edu) => (
                          <div key={edu.id} className="flex gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-sky-500 to-purple-600 rounded-full flex items-center justify-center">
                              <Award className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900 dark:text-white text-lg">
                                {edu.school}
                              </h4>
                              <p className="text-slate-600 dark:text-slate-400 font-medium">
                                {edu.degree} en {edu.field}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500 mt-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {new Date(edu.startDate).getFullYear()} - {edu.current ? 'Présent' : new Date(edu.endDate!).getFullYear()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Portfolio */}
              {activeTab === 'portfolio' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                    Portfolio ({profile.portfolio?.length || 0})
                  </h2>
                  
                  {profile.portfolio && profile.portfolio.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {profile.portfolio.map((item) => (
                        <div key={item.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                          <div className="aspect-video bg-slate-100 dark:bg-slate-700 relative">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileText className="h-12 w-12 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                              {item.title}
                            </h4>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 line-clamp-2">
                              {item.description}
                            </p>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {item.technologies.slice(0, 3).map((tech, index) => (
                                <span key={index} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded text-xs">
                                  {tech}
                                </span>
                              ))}
                            </div>
                            {item.url && (
                              <a 
                                href={item.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 text-sm font-medium"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Voir le projet
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">
                        Aucun projet portfolio pour le moment.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Expérience */}
              {activeTab === 'experience' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                    Expérience professionnelle
                  </h2>
                  
                  {profile.experience && profile.experience.length > 0 ? (
                    <div className="space-y-6">
                      {profile.experience.map((exp) => (
                        <div key={exp.id} className="flex gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                            <Briefcase className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white text-lg">
                                  {exp.position}
                                </h4>
                                <p className="text-slate-600 dark:text-slate-400 font-medium">
                                  {exp.company}
                                </p>
                              </div>
                              <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded text-sm">
                                {exp.current ? 'Actuel' : 'Passé'}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                              {new Date(exp.startDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} - {exp.current ? 'Présent' : new Date(exp.endDate!).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-slate-700 dark:text-slate-300 mb-3">
                              {exp.description}
                            </p>
                            {exp.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {exp.technologies.map((tech, index) => (
                                  <span key={index} className="bg-sky-50 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 px-2 py-1 rounded text-xs">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Briefcase className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">
                        Aucune expérience professionnelle renseignée.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Avis */}
              {activeTab === 'reviews' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Avis clients</h2>
                      {profile.reviews && profile.reviews.length > 0 && (
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-6 w-6 text-yellow-500 fill-current" />
                              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                {averageRating.toFixed(1)}
                              </span>
                            </div>
                            <span className="text-slate-500 dark:text-slate-500">
                              sur 5 • {profile.reviews.length} avis
                            </span>
                          </div>
                          {recommendationRate > 0 && (
                            <div className="bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {recommendationRate}% recommandent
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {profile.reviews && profile.reviews.length > 0 ? (
                    <div className="space-y-6">
                      {profile.reviews.map((review) => (
                        <div key={review.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-semibold text-lg">
                              {review.clientName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold text-slate-900 dark:text-white">
                                    {review.clientName}
                                  </h4>
                                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                                    {review.project}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
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
                              <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-500">
                                <span>
                                  {new Date(review.date).toLocaleDateString('fr-FR', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </span>
                                {review.wouldRecommend && (
                                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <CheckCircle className="h-4 w-4" />
                                    Recommande
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Star className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">
                        Aucun avis pour le moment.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}