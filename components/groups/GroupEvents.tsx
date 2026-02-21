// /components/groups/GroupEvents.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Users, Plus, MoreVertical, CalendarDays } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format, isPast, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'

interface GroupEventsProps {
  groupId: string
  isMember: boolean
}

interface Event {
  _id: string
  title: string
  description: string
  date: string
  startTime: string
  endTime?: string
  location: string
  type: 'in-person' | 'online' | 'hybrid'
  maxAttendees?: number
  currentAttendees: number
  isFeatured: boolean
  status: 'upcoming' | 'ongoing' | 'past' | 'cancelled'
  coverImage?: string
  tags: string[]
  createdAt: string
  author: {
    _id: string
    name: string
    avatar?: string
  }
  isAttending?: boolean
}

export function GroupEvents({ groupId, isMember }: GroupEventsProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    fetchEvents()
  }, [groupId, viewMode])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/events?view=${viewMode}`)
      const data = await response.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAttendEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/events/${eventId}/attend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        fetchEvents() // Refresh events
      }
    } catch (error) {
      console.error('Error attending event:', error)
    }
  }

  const getEventStatus = (date: string, startTime: string): Event['status'] => {
    const eventDateTime = new Date(`${date}T${startTime}`)
    
    if (isPast(eventDateTime)) {
      return 'past'
    }
    
    if (isToday(eventDateTime)) {
      return 'ongoing'
    }
    
    return 'upcoming'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
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
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <CalendarDays className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {viewMode === 'upcoming' ? 'Aucun événement à venir' : 'Aucun événement passé'}
        </h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          {isMember 
            ? 'Soyez le premier à organiser un événement pour le groupe !'
            : 'Rejoignez le groupe pour voir les événements et y participer.'}
        </p>
        {isMember && viewMode === 'upcoming' && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Organiser un événement
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'upcoming' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('upcoming')}
          >
            À venir
          </Button>
          <Button
            variant={viewMode === 'past' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('past')}
          >
            Passés
          </Button>
        </div>
        
        {isMember && viewMode === 'upcoming' && (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Créer
          </Button>
        )}
      </div>

      {/* Liste des événements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event) => {
          const eventDate = new Date(event.date)
          const eventStatus = getEventStatus(event.date, event.startTime)
          const isFull = event.maxAttendees && event.currentAttendees >= event.maxAttendees

          return (
            <Card key={event._id} className="hover:shadow-lg transition-shadow">
              {event.coverImage && (
                <div className="h-40 relative overflow-hidden rounded-t-lg">
                  <img 
                    src={event.coverImage} 
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  {event.isFeatured && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-yellow-500 hover:bg-yellow-600">
                        À la une
                      </Badge>
                    </div>
                  )}
                </div>
              )}
              
              <CardContent className={`p-6 ${!event.coverImage ? 'pt-6' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(eventDate, 'dd MMMM yyyy', { locale: fr })}
                      </span>
                      <Clock className="h-3 w-3 ml-2" />
                      <span>{event.startTime}</span>
                      {event.endTime && <span>- {event.endTime}</span>}
                    </div>
                  </div>
                  
                  <Badge variant={
                    eventStatus === 'upcoming' ? 'default' :
                    eventStatus === 'ongoing' ? 'secondary' :
                    'outline'
                  }>
                    {eventStatus === 'upcoming' ? 'À venir' :
                     eventStatus === 'ongoing' ? 'En cours' : 'Terminé'}
                  </Badge>
                </div>

                <p className="text-slate-700 mb-4 line-clamp-2">
                  {event.description}
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <span className={event.type === 'online' ? 'text-blue-600' : 'text-slate-700'}>
                      {event.type === 'online' ? 'En ligne' : event.location}
                    </span>
                    <Badge variant="outline" className="ml-2">
                      {event.type === 'online' ? '🌐 En ligne' :
                       event.type === 'hybrid' ? '🔀 Hybride' : '📍 Présentiel'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-slate-500" />
                    <span>{event.currentAttendees} participants</span>
                    {event.maxAttendees && (
                      <span className="text-slate-500">
                        / {event.maxAttendees} max
                      </span>
                    )}
                    {isFull && (
                      <Badge variant="destructive" className="ml-2">
                        Complet
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {event.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={event.author.avatar} />
                      <AvatarFallback>{event.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-slate-600">
                      Organisé par {event.author.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {eventStatus === 'upcoming' && !isFull && (
                      <Button
                        size="sm"
                        variant={event.isAttending ? 'outline' : 'default'}
                        onClick={() => handleAttendEvent(event._id)}
                        disabled={!isMember}
                      >
                        {event.isAttending ? '✓ Inscrit' : 'Participer'}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}