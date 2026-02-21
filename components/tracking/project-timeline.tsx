// components/tracking/project-timeline.tsx
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select'
import { CalendarEvent, CreateEventRequest } from '@/lib/models/event'
import { eventsApi } from '@/lib/api'
import { format, isSameDay, parseISO, addDays, addHours } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Flag, 
  Loader2, 
  Plus, 
  Dot, 
  Link, 
  Unlink, 
  Trash2, 
  X,
  MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

// Types locaux pour les tâches et projets
interface Task {
  id: string
  title: string
  description?: string
  dueDate?: string
  estimatedHours?: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in_progress' | 'done'
  projectId: string
  createdAt: string
  updatedAt: string
}

interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'completed' | 'on_hold'
  client?: string
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

interface ProjectTimelineProps {
  project: Project
  tasks: Task[]
  onRefresh?: () => void
}

// API pour les tâches
const tasksApi = {
  async getTasks(filters?: { projectId?: string }): Promise<Task[]> {
    try {
      const params = new URLSearchParams()
      if (filters?.projectId) {
        params.append('projectId', filters.projectId)
      }

      const response = await fetch(`/api/tasks?${params}`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des tâches')
      }
      
      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Error fetching tasks:', error)
      return []
    }
  },

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    })

    if (!response.ok) {
      throw new Error('Erreur lors de la création de la tâche')
    }

    const result = await response.json()
    return result.data
  }
}

export function ProjectTimeline({ project, tasks, onRefresh }: ProjectTimelineProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>(tasks)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [linkingTask, setLinkingTask] = useState<string | null>(null)
  const [creatingEvent, setCreatingEvent] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    type: 'meeting' as 'meeting' | 'deadline' | 'milestone' | 'task',
    location: '',
    startTime: '09:00',
    endTime: '10:00'
  })
  const { toast } = useToast()

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('Chargement des données pour le projet:', project.id)

        // Charger les tâches du projet
        const projectTasks = await tasksApi.getTasks({ projectId: project.id })
        setAllTasks(projectTasks)
        console.log('Tâches chargées:', projectTasks.length)

        // Charger les événements du projet
        try {
          const projectEvents = await eventsApi.getEvents({
            projectId: project.id,
            startDate: new Date(new Date().getFullYear(), 0, 1),
            endDate: new Date(new Date().getFullYear(), 11, 31)
          })
          console.log('Événements chargés:', projectEvents.length)
          setEvents(projectEvents)
        } catch (eventsError) {
          console.error('Erreur eventsApi:', eventsError)
          setEvents([])
        }

      } catch (err) {
        console.error('Erreur lors du chargement des données:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [project.id])

  // Réinitialiser le formulaire
  const resetEventForm = () => {
    setEventFormData({
      title: '',
      description: '',
      type: 'meeting',
      location: '',
      startTime: '09:00',
      endTime: '10:00'
    })
    setShowEventForm(false)
  }

  // Créer un événement avec le formulaire
  const createEventWithForm = async () => {
    try {
      if (!eventFormData.title.trim()) {
        toast({
          title: "Erreur",
          description: "Le titre est obligatoire",
          variant: "destructive"
        })
        return
      }

      setCreatingEvent(true)

      // Combiner la date sélectionnée avec l'heure
      const startDateTime = new Date(selectedDate)
      const [startHours, startMinutes] = eventFormData.startTime.split(':').map(Number)
      startDateTime.setHours(startHours, startMinutes)

      const endDateTime = new Date(selectedDate)
      const [endHours, endMinutes] = eventFormData.endTime.split(':').map(Number)
      endDateTime.setHours(endHours, endMinutes)

      // Si l'heure de fin est avant l'heure de début, ajouter un jour
      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1)
      }

      const eventData: CreateEventRequest = {
        title: eventFormData.title,
        description: eventFormData.description,
        start: startDateTime,
        end: endDateTime,
        type: eventFormData.type,
        status: 'scheduled',
        location: eventFormData.location,
        projectId: project.id,
        recurring: undefined
      }

      console.log('Création événement avec données:', eventData)
      
      const newEvent = await eventsApi.createEvent(eventData)
      console.log('Événement créé:', newEvent)
      
      setEvents(prev => [...prev, newEvent])
      resetEventForm()
      
      toast({
        title: "Événement créé",
        description: "Le nouvel événement a été ajouté au calendrier",
      })

      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Erreur création événement:', err)
      toast({
        title: "Erreur",
        description: "Impossible de créer l'événement",
        variant: "destructive"
      })
    } finally {
      setCreatingEvent(false)
    }
  }

  // Lier une tâche à un événement calendrier (AMÉLIORÉ)
  const linkTaskToCalendar = async (task: Task) => {
    try {
      setLinkingTask(task.id)
      
      // Utiliser la date de la tâche ou la date sélectionnée
      const taskDueDate = task.dueDate ? parseISO(task.dueDate) : selectedDate
      
      const eventData: CreateEventRequest = {
        title: `📋 ${task.title}`,
        description: task.description || `Tâche: ${task.title}\nPriorité: ${task.priority}\nStatut: ${task.status}`,
        start: taskDueDate,
        end: addHours(taskDueDate, task.estimatedHours || 1),
        type: 'task',
        status: 'scheduled',
        location: `Projet: ${project.name}`,
        projectId: project.id,
        taskId: task.id,
        recurring: undefined
      }

      console.log('Liaison tâche -> événement:', eventData)
      
      const newEvent = await eventsApi.createEvent(eventData)
      setEvents(prev => [...prev, newEvent])
      
      toast({
        title: "Tâche liée au calendrier",
        description: "La tâche a été ajoutée au calendrier avec succès",
      })

      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Erreur liaison tâche:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      toast({
        title: "Erreur de liaison",
        description: `Impossible de lier la tâche: ${errorMessage}`,
        variant: "destructive"
      })
    } finally {
      setLinkingTask(null)
    }
  }

  // Supprimer un événement
  const deleteEvent = async (eventId: string) => {
    try {
      await eventsApi.deleteEvent(eventId)
      setEvents(prev => prev.filter(event => event.id !== eventId))
      
      toast({
        title: "Événement supprimé",
        description: "L'événement a été supprimé du calendrier",
      })

      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Erreur suppression événement:', err)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'événement",
        variant: "destructive"
      })
    }
  }

  // Convertir un événement en tâche
  const convertEventToTask = async (event: CalendarEvent) => {
    try {
      const taskData = {
        title: event.title.replace('📋 ', ''),
        description: event.description || `Créé depuis l'événement: ${event.title}`,
        projectId: project.id,
        dueDate: event.start.toISOString(),
        estimatedHours: Math.ceil((event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60)), // Calcul basé sur la durée
        priority: 'medium' as const,
        status: 'todo' as const
      }

      await tasksApi.createTask(taskData)
      
      toast({
        title: "Événement converti",
        description: "L'événement a été converti en tâche avec succès",
      })

      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Erreur conversion événement:', err)
      toast({
        title: "Erreur",
        description: "Impossible de convertir l'événement en tâche",
        variant: "destructive"
      })
    }
  }

  // Fonctions utilitaires pour le calendrier
  const dateHasEvents = (date: Date) => {
    return events.some(event => isSameDay(event.start, date))
  }

  const dateHasTasks = (date: Date) => {
    return allTasks.some(task => 
      task.dueDate && isSameDay(parseISO(task.dueDate), date)
    )
  }

  const getEventTypeColor = (event: CalendarEvent) => {
    switch (event.type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'deadline':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'milestone':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'task':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'meeting': return 'Réunion'
      case 'deadline': return 'Échéance'
      case 'milestone': return 'Jalon'
      case 'task': return 'Tâche'
      default: return type
    }
  }

  // Composant personnalisé pour le rendu des jours du calendrier
  const DayContent = ({ date }: { date: Date }) => {
    const hasEvents = dateHasEvents(date)
    const hasTasks = dateHasTasks(date)

    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <span>{format(date, 'd')}</span>
        
        {(hasEvents || hasTasks) && (
          <div className="absolute bottom-1 flex justify-center gap-1">
            {hasEvents && <Dot className="h-3 w-3 text-blue-500" />}
            {hasTasks && <Dot className="h-3 w-3 text-green-500" />}
          </div>
        )}
      </div>
    )
  }

  // Données filtrées pour la date sélectionnée
  const eventsForSelectedDate = events.filter(event => 
    isSameDay(event.start, selectedDate)
  )
  
  const tasksForSelectedDate = allTasks.filter(task => 
    task.dueDate && isSameDay(parseISO(task.dueDate), selectedDate)
  )

  // Données pour les statistiques
  const tasksWithoutCalendarEvent = allTasks.filter(task => 
    task.dueDate && !events.some(event => event.taskId === task.id)
  )

  const eventsWithoutTasks = events.filter(event => !event.taskId)

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-slate-600">Chargement des données...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{events.length}</div>
              <div className="text-sm text-slate-600">Événements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{allTasks.length}</div>
              <div className="text-sm text-slate-600">Tâches total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {allTasks.filter(task => events.some(event => event.taskId === task.id)).length}
              </div>
              <div className="text-sm text-slate-600">Tâches liées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {events.filter(event => event.taskId).length}
              </div>
              <div className="text-sm text-slate-600">Événements liés</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendrier et Formulaire */}
        <div className="lg:col-span-1 space-y-6">
          {/* Calendrier */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Calendrier du projet
                </CardTitle>
                <Button 
                  onClick={() => setShowEventForm(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Événement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
                modifiers={{
                  hasEvents: (date) => dateHasEvents(date),
                  hasTasks: (date) => dateHasTasks(date),
                }}
                modifiersStyles={{
                  hasEvents: {
                    backgroundColor: '#dbeafe',
                    border: '1px solid #93c5fd',
                  },
                  hasTasks: {
                    backgroundColor: '#dcfce7',
                    border: '1px solid #86efac',
                  },
                }}
                components={{
                  DayContent: (props) => <DayContent {...props} />
                }}
              />
              
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-3">Légende</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Dot className="h-4 w-4 text-blue-500" />
                    <span>Événements ({events.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dot className="h-4 w-4 text-green-500" />
                    <span>Tâches ({allTasks.length})</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulaire de création d'événement */}
          {showEventForm && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Nouvel Événement</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetEventForm}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    placeholder="Titre de l'événement"
                    value={eventFormData.title}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Description de l'événement"
                    value={eventFormData.description}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={eventFormData.type}
                      onValueChange={(value: any) => setEventFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meeting">Réunion</SelectItem>
                        <SelectItem value="deadline">Échéance</SelectItem>
                        <SelectItem value="milestone">Jalon</SelectItem>
                        <SelectItem value="task">Tâche</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Lieu
                    </Label>
                    <Input
                      id="location"
                      placeholder="Lieu"
                      value={eventFormData.location}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Heure de début</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={eventFormData.startTime}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">Heure de fin</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={eventFormData.endTime}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-sm text-slate-500 mb-2">
                    Date: {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={createEventWithForm}
                      disabled={creatingEvent || !eventFormData.title.trim()}
                      className="flex-1"
                    >
                      {creatingEvent ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Créer l'événement
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetEventForm}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne centrale - Activités du jour */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Activités pour le {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Événements */}
            {eventsForSelectedDate.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Événements ({eventsForSelectedDate.length})
                </h3>
                <div className="space-y-3">
                  {eventsForSelectedDate.map(event => {
                    const linkedTask = event.taskId ? allTasks.find(t => t.id === event.taskId) : null
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "p-4 border rounded-lg transition-colors",
                          getEventTypeColor(event)
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium">{event.title}</h4>
                            {linkedTask && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                <Link className="h-3 w-3 mr-1" />
                                Lié à: {linkedTask.title}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {getEventTypeLabel(event.type)}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteEvent(event.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {event.description && (
                          <p className="text-sm mb-3 opacity-80 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs opacity-80">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </div>
                          )}
                        </div>

                        {!linkedTask && event.type !== 'task' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => convertEventToTask(event)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Convertir en tâche
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tâches */}
            {tasksForSelectedDate.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  Tâches ({tasksForSelectedDate.length})
                </h3>
                <div className="space-y-3">
                  {tasksForSelectedDate.map(task => {
                    const hasCalendarEvent = events.some(event => event.taskId === task.id)
                    return (
                      <div
                        key={task.id}
                        className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-slate-900">{task.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge className={cn(
                              "text-xs",
                              task.status === 'done' ? 'bg-green-100 text-green-800' :
                              task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            )}>
                              {task.status === 'done' ? 'Terminé' :
                              task.status === 'in_progress' ? 'En cours' : 'À faire'}
                            </Badge>
                            {!hasCalendarEvent && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => linkTaskToCalendar(task)}
                                disabled={linkingTask === task.id}
                                title="Convertir en événement calendrier"
                              >
                                {linkingTask === task.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CalendarIcon className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                            {hasCalendarEvent && (
                              <Badge variant="secondary" className="text-xs">
                                <Link className="h-3 w-3 mr-1" />
                                Lié
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Flag className="h-3 w-3" />
                            {task.priority}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {task.estimatedHours}h estimées
                          </div>
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              {format(parseISO(task.dueDate), 'dd/MM/yyyy')}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Aucune activité */}
            {eventsForSelectedDate.length === 0 && tasksForSelectedDate.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune activité planifiée pour cette date</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowEventForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un événement
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section de gestion des liens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tâches sans événement calendrier */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Unlink className="h-5 w-5 text-orange-500" />
              Tâches sans calendrier ({tasksWithoutCalendarEvent.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksWithoutCalendarEvent.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {tasksWithoutCalendarEvent.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>Priorité: {task.priority}</span>
                        <span>Statut: {task.status}</span>
                        {task.dueDate && (
                          <span>Échéance: {format(parseISO(task.dueDate), 'dd/MM/yyyy')}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => linkTaskToCalendar(task)}
                      disabled={linkingTask === task.id}
                      title="Convertir en événement calendrier"
                    >
                      {linkingTask === task.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CalendarIcon className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Link className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Toutes les tâches sont liées au calendrier</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Événements sans tâche liée */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-500" />
              Événements indépendants ({eventsWithoutTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventsWithoutTasks.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {eventsWithoutTasks.map(event => (
                  <div key={event.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {getEventTypeLabel(event.type)}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">
                      {format(event.start, 'dd/MM/yyyy HH:mm')}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => convertEventToTask(event)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Convertir en tâche
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteEvent(event.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Tous les événements sont liés à des tâches</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 font-medium">Erreur de chargement</p>
                <p className="text-red-500 text-sm mt-1">{error}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
              >
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}