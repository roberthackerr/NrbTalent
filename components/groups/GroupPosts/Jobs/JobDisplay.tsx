'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  Award, 
  Building, 
  ExternalLink,
  Bookmark,
  Share2,
  Users
} from 'lucide-react'
import { JobData } from '../utils/types'
import { toast } from 'sonner'

interface JobDisplayProps {
  jobData: JobData
  postId?: string
  groupId?: string
  isMember?: boolean
}

export function JobDisplay({ jobData, postId, groupId, isMember }: JobDisplayProps) {
  const [saved, setSaved] = useState(false)
  const [applied, setApplied] = useState(false)
  const [loading, setLoading] = useState(false)

  const getJobTypeLabel = (type: JobData['type']) => {
    const labels = {
      'full-time': 'CDI',
      'part-time': 'Temps partiel',
      'contract': 'Contrat',
      'internship': 'Stage'
    }
    return labels[type]
  }

  const getJobTypeColor = (type: JobData['type']) => {
    const colors = {
      'full-time': 'bg-blue-100 text-blue-800 border-blue-200',
      'part-time': 'bg-green-100 text-green-800 border-green-200',
      'contract': 'bg-purple-100 text-purple-800 border-purple-200',
      'internship': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
    return colors[type]
  }

  const handleSave = async () => {
    if (!postId || !groupId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/posts/${postId}/jobs/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        setSaved(data.saved)
        toast.success(data.saved ? 'Offre sauvegardée !' : 'Offre retirée des sauvegardes')
      }
    } catch (error) {
      console.error('Error saving job:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (jobData.applyLink) {
      window.open(jobData.applyLink, '_blank')
      setApplied(true)
      toast.success('Redirection vers la page de candidature')
    }
  }

  return (
    <Card className="mt-4 p-6 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Briefcase className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900">Offre d'emploi</h4>
            <Badge className={`${getJobTypeColor(jobData.type)} mt-1`}>
              {getJobTypeLabel(jobData.type)}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={loading}
          >
            <Bookmark className={`h-4 w-4 ${saved ? 'fill-current text-blue-500' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          {/* Entreprise */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg border border-gray-200">
              <Building className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Entreprise</div>
              <div className="font-bold text-lg text-gray-900">{jobData.company}</div>
            </div>
          </div>

          {/* Localisation */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg border border-gray-200">
              <MapPin className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Localisation</div>
              <div className="font-medium text-gray-900">
                {jobData.location}
                {jobData.remote && (
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                    🌐 Remote possible
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Salaire */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg border border-gray-200">
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Rémunération</div>
              <div className="font-medium text-gray-900">{jobData.salary}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Expérience */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg border border-gray-200">
              <Award className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Expérience requise</div>
              <div className="font-medium text-gray-900">{jobData.experience}</div>
            </div>
          </div>

          {/* Type de contrat */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg border border-gray-200">
              <Clock className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Type de contrat</div>
              <div className="font-medium text-gray-900">
                {getJobTypeLabel(jobData.type)}
                {jobData.remote && ' • Télétravail possible'}
              </div>
            </div>
          </div>

          {/* Avantages */}
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-gray-900">Pourquoi postuler ?</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                <span>Opportunité de croissance professionnelle</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                <span>Environnement de travail dynamique</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                <span>Partagé par la communauté du groupe</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-blue-200">
        <Button
          onClick={handleApply}
          disabled={applied}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 flex-1"
        >
          {applied ? (
            <>
              ✓ Candidature envoyée
            </>
          ) : (
            <>
              Postuler maintenant
              <ExternalLink className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => {
            // Voir plus de détails
            toast.info('Plus de détails sur l\'offre')
          }}
          className="flex-1"
        >
          <Briefcase className="h-4 w-4 mr-2" />
          Voir détails
        </Button>
        
        <Button 
          variant="ghost"
          onClick={handleSave}
          disabled={loading}
          className="sm:w-auto"
        >
          <Bookmark className={`h-4 w-4 mr-2 ${saved ? 'fill-current' : ''}`} />
          {saved ? 'Sauvegardé' : 'Sauvegarder'}
        </Button>
      </div>
    </Card>
  )
}