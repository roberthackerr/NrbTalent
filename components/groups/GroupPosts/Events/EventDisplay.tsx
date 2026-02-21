'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, MapPin, Users, Globe, ExternalLink, Clock, Award } from 'lucide-react'
import { EventData } from '../utils/types'
import { toast } from 'sonner'

interface EventDisplayProps {
  eventData: EventData
  postId?: string
  groupId?: string
  isMember?: boolean
}

export function EventDisplay({ eventData, postId, groupId, isMember }: EventDisplayProps) {
  const [attending, setAttending] = useState(false)
  const [loading, setLoading] = useState(false)

  const isUpcoming = new Date(eventData.startDate) > new Date()
  const isOnline = eventData.isOnline
  const registrationPercentage = eventData.maxAttendees 
    ? (eventData.attendees / eventData.maxAttendees) * 100 
    : 0

  const handleAttend = async () => {
    if (!postId || !groupId || !isMember || loading) return

    setLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/events/${postId}/attend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        setAttending(data.attending)
        toast.success(data.attending ? 'Inscription confirmée !' : 'Inscription annulée')
      }
    } catch (error) {
      console.error('Error attending event:', error)
      toast.error('Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      full: date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const dateInfo = formatEventDate(eventData.startDate)

  return (
    <Card className="mt-4 p-6 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-100 rounded-lg">
          <Calendar className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h4 className="font-semibold text-green-900">Événement</h4>
          {isUpcoming ? (
            <Badge className="bg-green-100 text-green-800 border-green-200 mt-1">
              À venir
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 mt-1">
              Terminé
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Date et heure</div>
                <div className="font-medium text-gray-900">
                  {dateInfo.full}
                </div>
                <div className="text-sm text-gray-700">
                  {dateInfo.time}
                  {eventData.endDate && (
                    <>
                      {' - '}
                      {new Date(eventData.endDate).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                {isOnline ? (
                  <Globe className="h-4 w-4 text-blue-500" />
                ) : (
                  <MapPin className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">
                  {isOnline ? 'Mode' : 'Lieu'}
                </div>
                <div className="font-medium text-gray-900">
                  {isOnline ? 'Événement en ligne' : eventData.location}
                </div>
                {eventData.venue && (
                  <div className="text-sm text-gray-700">
                    {eventData.venue}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">Participants</span>
              </div>
              <div className="text-lg font-bold text-green-700">
                {eventData.attendees}
                {eventData.maxAttendees && `/${eventData.maxAttendees}`}
              </div>
            </div>
            
            {eventData.maxAttendees && (
              <>
                <Progress 
                  value={registrationPercentage} 
                  className="h-2 mb-2 bg-gray-100"
                  indicatorClassName="bg-green-500"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>
                    {registrationPercentage >= 80 ? 'Presque complet' : 
                     registrationPercentage >= 50 ? 'Places limitées' : 'Places disponibles'}
                  </span>
                  <span>{Math.round(registrationPercentage)}% rempli</span>
                </div>
              </>
            )}
          </div>

          {eventData.maxAttendees && eventData.attendees >= eventData.maxAttendees && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <Award className="h-4 w-4" />
                <span className="text-sm font-medium">Événement complet !</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Toutes les places ont été réservées. Rejoignez la liste d'attente.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-green-200">
        {isUpcoming ? (
          <>
            <Button 
              onClick={handleAttend}
              disabled={loading || (eventData.maxAttendees && eventData.attendees >= eventData.maxAttendees)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 flex-1"
            >
              {loading ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : attending ? (
                <>
                  ✓ Inscrit
                </>
              ) : (
                <>
                  S'inscrire
                  {eventData.maxAttendees && eventData.attendees < eventData.maxAttendees && (
                    <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {eventData.maxAttendees - eventData.attendees} places
                    </span>
                  )}
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                // Ajouter à Google Calendar
                const eventTitle = encodeURIComponent('Événement du groupe')
                const eventDates = `${eventData.startDate.replace(/-/g, '')}/${eventData.endDate?.replace(/-/g, '') || eventData.startDate.replace(/-/g, '')}`
                const eventLocation = encodeURIComponent(eventData.location)
                const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${eventDates}&location=${eventLocation}&details=${encodeURIComponent('Événement partagé depuis NrbTalents')}`
                window.open(gCalUrl, '_blank')
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Ajouter au calendrier
            </Button>
          </>
        ) : (
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => {
              // Voir les photos/revue de l'événement
              toast.info('Revue de l\'événement à venir')
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Voir les photos
          </Button>
        )}
        
        <Button variant="ghost" className="sm:w-auto">
          <Users className="h-4 w-4 mr-2" />
          Partager
        </Button>
      </div>
    </Card>
  )
}