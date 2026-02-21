// /components/groups/GroupJobs.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Search,
  Filter,
  Bookmark,
  Share2,
  Eye,
  TrendingUp,
  Building,
  Plus,
  MoreVertical
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface GroupJobsProps {
  groupId: string
  isMember: boolean
}

interface Job {
  _id: string
  title: string
  company: string
  location: string
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance'
  remote: boolean
  salary?: {
    min?: number
    max?: number
    currency: string
    period: 'year' | 'month' | 'hour'
  }
  description: string
  requirements: string[]
  benefits?: string[]
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive'
  status: 'open' | 'closed' | 'filled'
  viewCount: number
  applicationCount: number
  tags: string[]
  createdAt: string
  postedBy: {
    _id: string
    name: string
    avatar?: string
    title?: string
  }
  isBookmarked?: boolean
  hasApplied?: boolean
}

export function GroupJobs({ groupId, isMember }: GroupJobsProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    type: 'all',
    remote: 'all',
    experience: 'all'
  })

  useEffect(() => {
    fetchJobs()
  }, [groupId])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/jobs`)
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookmark = async (jobId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/jobs/${jobId}/bookmark`, {
        method: 'POST'
      })

      if (response.ok) {
        // Update local state
        setJobs(jobs.map(job => 
          job._id === jobId 
            ? { ...job, isBookmarked: !job.isBookmarked }
            : job
        ))
      }
    } catch (error) {
      console.error('Error bookmarking job:', error)
    }
  }

  const handleApply = (jobId: string) => {
    // Redirect to application page or open modal
    console.log('Apply to job:', jobId)
  }

  const getTypeBadge = (type: Job['type']) => {
    const types = {
      'full-time': { label: 'CDI', color: 'bg-blue-100 text-blue-800' },
      'part-time': { label: 'CDD', color: 'bg-green-100 text-green-800' },
      'contract': { label: 'Contrat', color: 'bg-purple-100 text-purple-800' },
      'internship': { label: 'Stage', color: 'bg-yellow-100 text-yellow-800' },
      'freelance': { label: 'Freelance', color: 'bg-pink-100 text-pink-800' }
    }
    return (
      <Badge className={types[type].color}>
        {types[type].label}
      </Badge>
    )
  }

  const getExperienceBadge = (level: Job['experienceLevel']) => {
    const levels = {
      'entry': { label: 'Junior', color: 'bg-green-100 text-green-800' },
      'mid': { label: 'Confirmé', color: 'bg-blue-100 text-blue-800' },
      'senior': { label: 'Senior', color: 'bg-purple-100 text-purple-800' },
      'executive': { label: 'Direction', color: 'bg-red-100 text-red-800' }
    }
    return (
      <Badge variant="outline" className={levels[level].color}>
        {levels[level].label}
      </Badge>
    )
  }

  const formatSalary = (salary?: Job['salary']) => {
    if (!salary) return 'Salaire non spécifié'
    
    const period = salary.period === 'year' ? 'an' : 
                  salary.period === 'month' ? 'mois' : 'heure'
    
    if (salary.min && salary.max) {
      return `${salary.min.toLocaleString()} - ${salary.max.toLocaleString()} ${salary.currency}/${period}`
    } else if (salary.min) {
      return `À partir de ${salary.min.toLocaleString()} ${salary.currency}/${period}`
    } else if (salary.max) {
      return `Jusqu'à ${salary.max.toLocaleString()} ${salary.currency}/${period}`
    }
    return 'Salaire non spécifié'
  }

  // Filtrage des offres
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchQuery === '' || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesType = filters.type === 'all' || job.type === filters.type
    const matchesRemote = filters.remote === 'all' || 
      (filters.remote === 'remote' && job.remote) ||
      (filters.remote === 'on-site' && !job.remote)
    const matchesExperience = filters.experience === 'all' || job.experienceLevel === filters.experience
    
    return matchesSearch && matchesType && matchesRemote && matchesExperience
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 animate-pulse">
          <div className="h-10 flex-1 bg-slate-200 rounded-lg"></div>
          <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
          <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-slate-200 rounded-lg"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-4 bg-slate-200 rounded"></div>
                    <div className="h-4 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Briefcase className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Aucune offre d'emploi</h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          {isMember 
            ? 'Soyez le premier à poster une offre d\'emploi dans ce groupe !'
            : 'Rejoignez le groupe pour voir les offres d\'emploi.'}
        </p>
        {isMember && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Poster une offre
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec recherche et filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Rechercher des offres d'emploi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-3">
          <Select
            value={filters.type}
            onValueChange={(value) => setFilters({...filters, type: value})}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="full-time">CDI</SelectItem>
              <SelectItem value="part-time">CDD</SelectItem>
              <SelectItem value="contract">Contrat</SelectItem>
              <SelectItem value="internship">Stage</SelectItem>
              <SelectItem value="freelance">Freelance</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={filters.remote}
            onValueChange={(value) => setFilters({...filters, remote: value})}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Lieu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les lieux</SelectItem>
              <SelectItem value="remote">Télétravail</SelectItem>
              <SelectItem value="on-site">Sur site</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={filters.experience}
            onValueChange={(value) => setFilters({...filters, experience: value})}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Expérience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous niveaux</SelectItem>
              <SelectItem value="entry">Junior</SelectItem>
              <SelectItem value="mid">Confirmé</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {jobs.filter(j => j.status === 'open').length}
            </div>
            <div className="text-sm text-slate-600">Offres actives</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {jobs.reduce((sum, job) => sum + job.applicationCount, 0)}
            </div>
            <div className="text-sm text-slate-600">Candidatures</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {jobs.filter(j => j.remote).length}
            </div>
            <div className="text-sm text-slate-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Offres en télétravail
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {[...new Set(jobs.map(j => j.company))].length}
            </div>
            <div className="text-sm text-slate-600">Entreprises</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des offres */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune offre trouvée</h3>
          <p className="text-slate-600">
            Aucune offre ne correspond à vos critères de recherche
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <Card key={job._id} className="hover:shadow-lg transition-shadow group">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Informations principales */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Building className="h-7 w-7 text-slate-600" />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg">{job.title}</h3>
                            {job.status === 'closed' && (
                              <Badge variant="destructive">Fermée</Badge>
                            )}
                            {job.status === 'filled' && (
                              <Badge variant="outline">Pourvue</Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                            <span className="font-medium">{job.company}</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.remote ? '🌐 Télétravail' : job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(job.createdAt), { 
                                addSuffix: true,
                                locale: fr 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBookmark(job._id)}
                        >
                          <Bookmark className={`h-4 w-4 ${job.isBookmarked ? 'fill-current' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {getTypeBadge(job.type)}
                      {getExperienceBadge(job.experienceLevel)}
                      {job.remote && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          🌐 Télétravail
                        </Badge>
                      )}
                      {job.salary && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {formatSalary(job.salary)}
                        </Badge>
                      )}
                    </div>

                    <p className="text-slate-700 mb-4 line-clamp-2">
                      {job.description}
                    </p>

                    {/* Tags */}
                    {job.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Statistiques */}
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {job.viewCount} vues
                      </span>
                      <span>
                        {job.applicationCount} candidatures
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="lg:w-48 flex flex-col gap-3">
                    {job.status === 'open' ? (
                      <>
                        <Button 
                          onClick={() => handleApply(job._id)}
                          disabled={!isMember || job.hasApplied}
                        >
                          {job.hasApplied ? '✓ Candidature envoyée' : 'Postuler'}
                        </Button>
                        <Button variant="outline">
                          Voir détails
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" disabled>
                        Offre {job.status === 'closed' ? 'fermée' : 'pourvue'}
                      </Button>
                    )}
                    
                    <div className="flex items-center gap-3 text-sm">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={job.postedBy.avatar} />
                        <AvatarFallback>{job.postedBy.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{job.postedBy.name}</div>
                        <div className="text-slate-500 text-xs">
                          {job.postedBy.title || 'Recruteur'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}