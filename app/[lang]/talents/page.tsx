'use client'
import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, MapPin, DollarSign, Briefcase, Award, Clock, Search, Filter } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

// Types pour les données réelles de votre API
interface Talent {
  _id: string
  name: string
  email: string
  title?: string
  avatar?: string
  rating?: number
  skills: string[]
  bio?: string
  experience?: any[]
  statistics?: {
    completedProjects?: number
    successRate?: number
    onTimeDelivery?: number
  }
  matchScore?: number
  matchGrade?: 'excellent' | 'good' | 'potential' | 'low'
  reasoning?: string[]
  hourlyRate?: number
  location?: string
  verified?: boolean
  available?: boolean
  currentWorkload?: number
}

interface ApiResponse {
  success: boolean
  recommendations: Array<{
    freelancer: Talent
    match: {
      matchScore: number
      matchGrade: 'excellent' | 'good' | 'potential' | 'low'
      skillGapAnalysis: {
        strong: string[]
        missing: string[]
      }
      reasoning: string[]
    }
    reasoning?: string[]
  }>
  clientProfile?: {
    previousProjects: number
    preferredCategories: string[]
    averageBudget: { min: number; max: number }
  }
  matchingEngine: string
  timestamp: string
}

export default function TalentsPage() {
  const [talents, setTalents] = useState<Talent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [skillFilter, setSkillFilter] = useState("")
  const [rateFilter, setRateFilter] = useState<number | null>(null)
  const [availabilityFilter, setAvailabilityFilter] = useState<boolean | null>(null)

  // Récupérer les talents depuis l'API de matching
  useEffect(() => {
    async function fetchTalents() {
      try {
        setLoading(true)
        const response = await fetch('/api/ai/matching?limit=20')
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`)
        }
        
        const data: ApiResponse = await response.json()
        
        if (data.success && data.recommendations) {
          // Transformer les recommandations en format Talent
          const transformedTalents: Talent[] = data.recommendations.map(rec => ({
            ...rec.freelancer,
            // Données enrichies depuis le matching
            rating: rec.freelancer.rating || 4.0 + Math.random() * 1.0,
            matchScore: rec.match.matchScore,
            matchGrade: rec.match.matchGrade,
            reasoning: rec.reasoning || rec.match.reasoning
          }))
          
          setTalents(transformedTalents)
        } else {
          throw new Error('Format de réponse invalide')
        }
      } catch (err) {
        console.error('Erreur lors du chargement des talents:', err)
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
        
        // Données de fallback basées sur votre structure de données
        setTalents(getFallbackTalents())
      } finally {
        setLoading(false)
      }
    }

    fetchTalents()
  }, [])

  // Fonction de fallback améliorée
  function getFallbackTalents(): Talent[] {
    return [
      {
        _id: "1",
        name: "Sophie Martin",
        title: "Développeuse Full-Stack Senior",
        email: "sophie.martin@example.com",
        avatar: "/placeholder.svg?height=100&width=100",
        rating: 4.9,
        skills: ["React", "Node.js", "TypeScript", "MongoDB", "AWS", "Docker"],
        bio: "Développeuse full-stack avec 8+ ans d'expérience dans la création d'applications web évolutives et performantes.",
        hourlyRate: 85,
        location: "Paris, France",
        verified: true,
        available: true,
        currentWorkload: 30,
        statistics: {
          completedProjects: 67,
          successRate: 98,
          onTimeDelivery: 95
        },
        matchScore: 95,
        matchGrade: 'excellent'
      },
      {
        _id: "2",
        name: "Thomas Bernard",
        title: "Expert React/Next.js",
        email: "thomas.bernard@example.com",
        avatar: "/placeholder.svg?height=100&width=100",
        rating: 4.8,
        skills: ["React", "Next.js", "JavaScript", "Tailwind CSS", "GraphQL"],
        bio: "Spécialiste Frontend passionné par React et Next.js, avec une forte attention aux détails UX/UI.",
        hourlyRate: 75,
        location: "Lyon, France",
        verified: true,
        available: true,
        currentWorkload: 60,
        statistics: {
          completedProjects: 45,
          successRate: 96,
          onTimeDelivery: 92
        },
        matchScore: 88,
        matchGrade: 'good'
      },
      {
        _id: "3",
        name: "Marie Laurent",
        title: "Ingénieure DevOps & Cloud",
        email: "marie.laurent@example.com",
        avatar: "/placeholder.svg?height=100&width=100",
        rating: 5.0,
        skills: ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux"],
        bio: "Ingénieure DevOps expérimentée dans l'automatisation et l'optimisation des infrastructures cloud.",
        hourlyRate: 110,
        location: "Toulouse, France",
        verified: true,
        available: false,
        currentWorkload: 85,
        statistics: {
          completedProjects: 52,
          successRate: 99,
          onTimeDelivery: 97
        },
        matchScore: 92,
        matchGrade: 'excellent'
      },
      {
        _id: "4",
        name: "Alexandre Petit",
        title: "Développeur Mobile",
        email: "alex.petit@example.com",
        avatar: "/placeholder.svg?height=100&width=100",
        rating: 4.7,
        skills: ["React Native", "iOS", "Android", "TypeScript", "Firebase"],
        bio: "Développeur mobile spécialisé dans les applications cross-platform avec React Native.",
        hourlyRate: 65,
        location: "Bordeaux, France",
        verified: false,
        available: true,
        currentWorkload: 25,
        statistics: {
          completedProjects: 28,
          successRate: 94,
          onTimeDelivery: 90
        },
        matchScore: 82,
        matchGrade: 'good'
      },
      {
        _id: "5",
        name: "Julie Moreau",
        title: "Data Scientist",
        email: "julie.moreau@example.com",
        avatar: "/placeholder.svg?height=100&width=100",
        rating: 4.9,
        skills: ["Python", "Machine Learning", "TensorFlow", "SQL", "Data Analysis"],
        bio: "Data scientist passionnée par l'IA et le machine learning, avec une solide expérience en analyse de données.",
        hourlyRate: 95,
        location: "Lille, France",
        verified: true,
        available: true,
        currentWorkload: 45,
        statistics: {
          completedProjects: 36,
          successRate: 97,
          onTimeDelivery: 94
        },
        matchScore: 89,
        matchGrade: 'good'
      }
    ]
  }

  // Filtrage des talents
  const filteredTalents = talents.filter(talent => {
    const matchesSearch = talent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         talent.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         talent.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         talent.skills.some(skill => 
                           skill.toLowerCase().includes(searchTerm.toLowerCase())
                         )
    
    const matchesSkill = !skillFilter || talent.skills.some(skill => 
      skill.toLowerCase().includes(skillFilter.toLowerCase())
    )
    
    const matchesRate = !rateFilter || (talent.hourlyRate && talent.hourlyRate <= rateFilter)
    
    const matchesAvailability = availabilityFilter === null || 
                              (availabilityFilter === true && talent.available) ||
                              (availabilityFilter === false && !talent.available)
    
    return matchesSearch && matchesSkill && matchesRate && matchesAvailability
  })

  // Statistiques pour les filtres
  const allSkills = Array.from(new Set(talents.flatMap(t => t.skills))).sort()

  // Fonction pour obtenir la couleur du badge selon le match grade (dark mode compatible)
  const getMatchGradeColor = (grade: string) => {
    switch (grade) {
      case 'excellent': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800'
      case 'good': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      case 'potential': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
      case 'low': return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
    }
  }

  // Fonction pour obtenir le libellé du match grade
  const getMatchGradeLabel = (grade: string) => {
    switch (grade) {
      case 'excellent': return 'Match Exceptionnel'
      case 'good': return 'Bon Match'
      case 'potential': return 'Potentiel'
      case 'low': return 'Basique'
      default: return 'Standard'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* En-tête amélioré avec dark mode */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-4 border border-blue-200 dark:border-blue-800">
              <Award className="h-4 w-4" />
              Propulsé par l'IA - Matching Intelligent
            </div>
            <h1 className="text-4xl font-bold sm:text-5xl bg-gradient-to-r from-foreground to-blue-600 dark:to-blue-400 bg-clip-text text-transparent">
              Découvrez nos experts tech
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Des talents vérifiés et matchés intelligemment avec vos besoins
            </p>
          </div>

          {/* Filtres et recherche avec dark mode */}
          <div className="mb-8 p-6 bg-card rounded-lg border shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Nom, compétence, spécialité..."
                  className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select 
                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
              >
                <option value="">Toutes les compétences</option>
                {allSkills.map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
              
              <select 
                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                value={rateFilter || ''}
                onChange={(e) => setRateFilter(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Tous les tarifs</option>
                <option value="50">≤ $50/h</option>
                <option value="75">≤ $75/h</option>
                <option value="100">≤ $100/h</option>
                <option value="150">≤ $150/h</option>
              </select>

              <select 
                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                value={availabilityFilter === null ? '' : availabilityFilter.toString()}
                onChange={(e) => setAvailabilityFilter(e.target.value === '' ? null : e.target.value === 'true')}
              >
                <option value="">Tous les statuts</option>
                <option value="true">Disponible</option>
                <option value="false">Indisponible</option>
              </select>
              
              <Button 
                onClick={() => {
                  setSearchTerm("")
                  setSkillFilter("")
                  setRateFilter(null)
                  setAvailabilityFilter(null)
                }}
                variant="outline"
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>

          {/* Statistiques avec dark mode */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-card p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{talents.length}</div>
              <div className="text-sm text-muted-foreground">Talents matchés</div>
            </div>
            <div className="bg-card p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {talents.filter(t => t.available).length}
              </div>
              <div className="text-sm text-muted-foreground">Disponibles maintenant</div>
            </div>
            <div className="bg-card p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {talents.filter(t => t.verified).length}
              </div>
              <div className="text-sm text-muted-foreground">Vérifiés</div>
            </div>
            <div className="bg-card p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {Math.round(talents.reduce((acc, t) => acc + (t.rating || 0), 0) / talents.length * 10) / 10 || 0}/5
              </div>
              <div className="text-sm text-muted-foreground">Note moyenne</div>
            </div>
            <div className="bg-card p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {talents.filter(t => t.matchGrade === 'excellent').length}
              </div>
              <div className="text-sm text-muted-foreground">Matches excellents</div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-300">
              <div className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                <div>
                  <strong>Mode démonstration:</strong> {error}
                </div>
              </div>
            </div>
          )}

          {/* Grille des talents avec dark mode */}
          {filteredTalents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-foreground">Aucun talent trouvé</h3>
              <p className="text-muted-foreground mt-2">Essayez de modifier vos critères de recherche</p>
              <Button 
                onClick={() => {
                  setSearchTerm("")
                  setSkillFilter("")
                  setRateFilter(null)
                  setAvailabilityFilter(null)
                }}
                className="mt-4"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTalents.map((talent) => (
                <Card 
                  key={talent._id} 
                  className="overflow-hidden transition-all hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xl border-2 group relative"
                >
                  {/* Badge de match grade */}
                  {(talent as any).matchGrade && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className={`${getMatchGradeColor((talent as any).matchGrade)} border`}>
                        {getMatchGradeLabel((talent as any).matchGrade)}
                      </Badge>
                    </div>
                  )}

                  <div className="p-6">
                    {/* En-tête avec badge de statut */}
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 border-2 border-border group-hover:border-blue-300 dark:group-hover:border-blue-700 transition-colors">
                        <AvatarImage src={talent.avatar} />
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold">
                          {talent.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg truncate text-foreground">{talent.name}</h3>
                          {talent.verified && (
                            <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 text-xs border border-green-200 dark:border-green-800">
                              ✓ Vérifié
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{talent.title}</p>
                        <div className="mt-2 flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium text-foreground">{talent.rating?.toFixed(1)}</span>
                          <span className="text-muted-foreground">
                            ({talent.statistics?.completedProjects || 0} projets)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="mt-4 text-sm text-muted-foreground line-clamp-2">{talent.bio}</p>

                    {/* Compétences */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {talent.skills.slice(0, 4).map((skill) => (
                        <Badge 
                          key={skill} 
                          variant="secondary" 
                          className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/50 border-blue-200 dark:border-blue-800"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {talent.skills.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{talent.skills.length - 4}
                        </Badge>
                      )}
                    </div>

                    {/* Statistiques */}
                    {talent.statistics && (
                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-center">
                        <div className="bg-muted/50 rounded p-2">
                          <Briefcase className="h-3 w-3 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                          <div className="font-semibold text-foreground">{talent.statistics.completedProjects}+</div>
                          <div className="text-muted-foreground">Projets</div>
                        </div>
                        <div className="bg-muted/50 rounded p-2">
                          <Clock className="h-3 w-3 mx-auto mb-1 text-green-600 dark:text-green-400" />
                          <div className="font-semibold text-foreground">{talent.statistics.onTimeDelivery}%</div>
                          <div className="text-muted-foreground">À temps</div>
                        </div>
                        <div className="bg-muted/50 rounded p-2">
                          <Star className="h-3 w-3 mx-auto mb-1 text-yellow-600 dark:text-yellow-400" />
                          <div className="font-semibold text-foreground">{talent.statistics.successRate}%</div>
                          <div className="text-muted-foreground">Réussite</div>
                        </div>
                      </div>
                    )}

                    {/* Indicateur de charge de travail */}
                    {talent.currentWorkload !== undefined && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Disponibilité</span>
                          <span>{100 - talent.currentWorkload}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              talent.currentWorkload < 40 ? 'bg-green-500 dark:bg-green-400' :
                              talent.currentWorkload < 70 ? 'bg-yellow-500 dark:bg-yellow-400' : 'bg-red-500 dark:bg-red-400'
                            }`}
                            style={{ width: `${100 - talent.currentWorkload}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Pied de carte */}
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{talent.location || 'Remote'}</span>
                        </div>
                        <div className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>${talent.hourlyRate}/h</span>
                        </div>
                      </div>
                      <Button asChild size="sm" disabled={!talent.available}>
                        <Link href={`/talents/${talent._id}`}>
                          {talent.available ? "Contacter" : "Indisponible"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}