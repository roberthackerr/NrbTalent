// components/tracking/project-timeline.tsx
"use client"

import { useState, useEffect, useCallback } from 'react'
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
import { format, isSameDay, parseISO, addHours, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Flag, 
  Loader2, 
  Plus, 
  Dot, 
  Link, 
  Unlink, 
  Trash2, 
  X,
  MapPin,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { motion, AnimatePresence } from 'framer-motion'

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
  _id: any
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

const tasksApi = {
  async getTasks(filters?: { projectId?: string }): Promise<Task[]> {
    try {
      const params = new URLSearchParams()
      if (filters?.projectId) params.append('projectId', filters.projectId)
      const response = await fetch(`/api/tasks?${params}`)
      if (!response.ok) throw new Error('Erreur lors de la récupération des tâches')
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    })

    if (!response.ok) throw new Error('Erreur lors de la création de la tâche', taskData.projectId)
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
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    type: 'meeting' as 'meeting' | 'deadline' | 'milestone' | 'task',
    location: '',
    startTime: '09:00',
    endTime: '10:00'
  })
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [projectTasks, projectEvents] = await Promise.all([
        tasksApi.getTasks({ projectId: project.id }),
        eventsApi.getEvents({
          projectId: project.id,
          startDate: startOfMonth(selectedDate),
          endDate: endOfMonth(selectedDate)
        })
      ])
      
      setAllTasks(projectTasks)
      setEvents(projectEvents)
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [project.id, selectedDate])

  useEffect(() => {
    loadData()
  }, [loadData])

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

  const createEventWithForm = async () => {
    if (!eventFormData.title.trim()) {
      toast({ title: "Erreur", description: "Le titre est obligatoire", variant: "destructive" })
      return
    }

    setCreatingEvent(true)
    try {
      const startDateTime = new Date(selectedDate)
      const [startHours, startMinutes] = eventFormData.startTime.split(':').map(Number)
      startDateTime.setHours(startHours, startMinutes)

      const endDateTime = new Date(selectedDate)
      const [endHours, endMinutes] = eventFormData.endTime.split(':').map(Number)
      endDateTime.setHours(endHours, endMinutes)
      if (endDateTime <= startDateTime) endDateTime.setDate(endDateTime.getDate() + 1)

      const eventData: CreateEventRequest = {
        title: eventFormData.title,
        description: eventFormData.description,
        start: startDateTime,
        end: endDateTime,
        type: eventFormData.type,
        status: 'scheduled',
        location: eventFormData.location,
        projectId: project.id,
      }

      const newEvent = await eventsApi.createEvent(eventData)
      setEvents(prev => [...prev, newEvent])
      resetEventForm()
      toast({ title: "Événement créé", description: "Le nouvel événement a été ajouté au calendrier" })
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Error creating event:', err)
      toast({ title: "Erreur", description: "Impossible de créer l'événement", variant: "destructive" })
    } finally {
      setCreatingEvent(false)
    }
  }

  const linkTaskToCalendar = async (task: Task) => {
    setLinkingTask(task.id)
    try {
      const taskDueDate = task.dueDate ? parseISO(task.dueDate) : selectedDate
      const eventData: CreateEventRequest = {
        title: `📋 ${task.title}`,
        description: task.description || `Tâche: ${task.title}\nPriorité: ${task.priority}`,
        start: taskDueDate,
        end: addHours(taskDueDate, task.estimatedHours || 1),
        type: 'task',
        status: 'scheduled',
        location: `Projet: ${project.name}`,
        projectId: project.id,
        taskId: task.id,
      }
      const newEvent = await eventsApi.createEvent(eventData)
      setEvents(prev => [...prev, newEvent])
      toast({ title: "Tâche liée", description: "La tâche a été ajoutée au calendrier" })
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Error linking task:', err)
      toast({ title: "Erreur", description: "Impossible de lier la tâche", variant: "destructive" })
    } finally {
      setLinkingTask(null)
    }
  }

  const deleteEvent = async (eventId: string) => {
    try {
      await eventsApi.deleteEvent(eventId)
      setEvents(prev => prev.filter(event => event.id !== eventId))
      toast({ title: "Événement supprimé", description: "L'événement a été supprimé du calendrier" })
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Error deleting event:', err)
      toast({ title: "Erreur", description: "Impossible de supprimer l'événement", variant: "destructive" })
    }
  }

  const convertEventToTask = async (event: CalendarEvent) => {
    try {
      const taskData = {
        title: event.title.replace('📋 ', ''),
        description: event.description || `Créé depuis l'événement: ${event.title}`,
        projectId: project._id,
        dueDate: event.start.toISOString(),
        estimatedHours: Math.ceil((event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60)),
        priority: 'medium' as const,
        status: 'todo' as const
      }
      console.log(taskData);
      await tasksApi.createTask(taskData)
      toast({ title: "Événement converti", description: "L'événement a été converti en tâche" })
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Error converting event:', err)
      toast({ title: "Erreur", description: "Impossible de convertir l'événement", variant: "destructive" })
    }
  }

  const dateHasEvents = (date: Date) => events.some(event => isSameDay(event.start, date))
  const dateHasTasks = (date: Date) => allTasks.some(task => task.dueDate && isSameDay(parseISO(task.dueDate), date))

  const getEventTypeColor = (event: CalendarEvent) => {
    const colors = {
      meeting: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800',
      deadline: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800',
      milestone: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800',
      task: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800'
    }
    return colors[event.type] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getEventTypeLabel = (type: string) => {
    const labels = { meeting: 'Réunion', deadline: 'Échéance', milestone: 'Jalon', task: 'Tâche' }
    return labels[type as keyof typeof labels] || type
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300',
      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300'
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }

  const getStatusLabel = (status: string) => {
    const labels = { todo: 'À faire', in_progress: 'En cours', done: 'Terminé' }
    return labels[status as keyof typeof labels] || status
  }

  const eventsForSelectedDate = events.filter(event => isSameDay(event.start, selectedDate))
  const tasksForSelectedDate = allTasks.filter(task => task.dueDate && isSameDay(parseISO(task.dueDate), selectedDate))
  const tasksWithoutCalendarEvent = allTasks.filter(task => task.dueDate && !events.some(event => event.taskId === task.id))
  const eventsWithoutTasks = events.filter(event => !event.taskId)

  const stats = {
    events: events.length,
    tasks: allTasks.length,
    linkedTasks: allTasks.filter(task => events.some(event => event.taskId === task.id)).length,
    linkedEvents: events.filter(event => event.taskId).length,
    completionRate: allTasks.length > 0 ? Math.round((allTasks.filter(t => t.status === 'done').length / allTasks.length) * 100) : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 blur-2xl opacity-20 animate-pulse rounded-full"></div>
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 relative z-10" />
        </div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Chargement du planning...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Événements', value: stats.events, icon: CalendarIcon, color: 'from-purple-500 to-pink-500' },
          { label: 'Tâches', value: stats.tasks, icon: CheckCircle2, color: 'from-green-500 to-emerald-500' },
          { label: 'Tâches liées', value: stats.linkedTasks, icon: Link, color: 'from-blue-500 to-cyan-500' },
          { label: 'Événements liés', value: stats.linkedEvents, icon: Link, color: 'from-indigo-500 to-purple-500' },
          { label: 'Progression', value: `${stats.completionRate}%`, icon: TrendingUp, color: 'from-orange-500 to-red-500' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-gray-200 dark:border-gray-800 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                  <div className={`p-2 bg-gradient-to-br ${stat.color} rounded-xl`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-gray-200 dark:border-gray-800 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <CalendarIcon className="h-5 w-5 text-purple-500" />
                  Calendrier
                </CardTitle>
                <Button 
                  onClick={() => setShowEventForm(true)}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
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
                  hasEvents: { backgroundColor: '#f3e8ff', border: '1px solid #d8b4fe' },
                  hasTasks: { backgroundColor: '#dcfce7', border: '1px solid #86efac' },
                }}
              />
              
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Légende</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Dot className="h-4 w-4 text-purple-500" />
                    <span className="text-gray-600 dark:text-gray-400">Événements ({stats.events})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dot className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600 dark:text-gray-400">Tâches ({stats.tasks})</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Form */}
          <AnimatePresence>
            {showEventForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="border-gray-200 dark:border-gray-800 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-gray-900 dark:text-white">Nouvel Événement</CardTitle>
                      <Button variant="ghost" size="sm" onClick={resetEventForm}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Titre *</Label>
                      <Input
                        id="title"
                        placeholder="Titre de l'événement"
                        value={eventFormData.title}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Description..."
                        value={eventFormData.description}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">Type</Label>
                        <Select value={eventFormData.type} onValueChange={(value: any) => setEventFormData(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger className="mt-1">
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
                      <div>
                        <Label htmlFor="location">Lieu</Label>
                        <Input
                          id="location"
                          placeholder="Lieu"
                          value={eventFormData.location}
                          onChange={(e) => setEventFormData(prev => ({ ...prev, location: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startTime">Début</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={eventFormData.startTime}
                          onChange={(e) => setEventFormData(prev => ({ ...prev, startTime: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="endTime">Fin</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={eventFormData.endTime}
                          onChange={(e) => setEventFormData(prev => ({ ...prev, endTime: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <p className="text-sm text-gray-500 mb-2">
                        Date: {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={createEventWithForm}
                          disabled={creatingEvent || !eventFormData.title.trim()}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                          {creatingEvent ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                          Créer
                        </Button>
                        <Button variant="outline" onClick={resetEventForm}>Annuler</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Activities */}
        <Card className="lg:col-span-2 border-gray-200 dark:border-gray-800 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Activités du {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {eventsForSelectedDate.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-purple-500" />
                  Événements ({eventsForSelectedDate.length})
                </h3>
                <div className="space-y-3">
                  {eventsForSelectedDate.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn("p-4 border rounded-lg transition-all hover:shadow-md", getEventTypeColor(event))}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{event.title}</h4>
                          {event.taskId && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              <Link className="h-3 w-3 mr-1" /> Lié à une tâche
                            </Badge>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteEvent(event.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {event.description && <p className="text-sm mt-2 opacity-80">{event.description}</p>}
                      <div className="flex items-center gap-4 text-xs mt-3 opacity-80">
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
                      {!event.taskId && event.type !== 'task' && (
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => convertEventToTask(event)}>
                          <Plus className="h-3 w-3 mr-1" /> Convertir en tâche
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {tasksForSelectedDate.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Tâches ({tasksForSelectedDate.length})
                </h3>
                <div className="space-y-3">
                  {tasksForSelectedDate.map((task, index) => {
                    const hasCalendarEvent = events.some(event => event.taskId === task.id)
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                              <Badge variant="outline">{getStatusLabel(task.status)}</Badge>
                              {hasCalendarEvent && <Badge variant="secondary"><Link className="h-3 w-3 mr-1" /> Lié</Badge>}
                            </div>
                          </div>
                          {!hasCalendarEvent && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => linkTaskToCalendar(task)}
                              disabled={linkingTask === task.id}
                            >
                              {linkingTask === task.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CalendarIcon className="h-3 w-3" />}
                            </Button>
                          )}
                        </div>
                        {task.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{task.description}</p>}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                          {task.estimatedHours && <span>⏱️ {task.estimatedHours}h estimées</span>}
                          {task.dueDate && <span>📅 {format(parseISO(task.dueDate), 'dd/MM/yyyy')}</span>}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}

            {eventsForSelectedDate.length === 0 && tasksForSelectedDate.length === 0 && (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune activité planifiée pour cette date</p>
                <Button variant="outline" className="mt-4" onClick={() => setShowEventForm(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Créer un événement
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unlinked Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200 dark:border-gray-800 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Unlink className="h-5 w-5 text-orange-500" />
              Tâches sans calendrier ({tasksWithoutCalendarEvent.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksWithoutCalendarEvent.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {tasksWithoutCalendarEvent.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge className={getPriorityColor(task.priority)} className="text-xs">{task.priority}</Badge>
                        {task.dueDate && <span className="text-xs text-gray-500">📅 {format(parseISO(task.dueDate), 'dd/MM/yyyy')}</span>}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => linkTaskToCalendar(task)} disabled={linkingTask === task.id}>
                      {linkingTask === task.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CalendarIcon className="h-3 w-3" />}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Link className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Toutes les tâches sont liées</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-800 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <CalendarIcon className="h-5 w-5 text-blue-500" />
              Événements indépendants ({eventsWithoutTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventsWithoutTasks.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {eventsWithoutTasks.map(event => (
                  <div key={event.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <Badge variant="secondary" className="text-xs">{getEventTypeLabel(event.type)}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{format(event.start, 'dd/MM/yyyy HH:mm')}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => convertEventToTask(event)}>
                        <Plus className="h-3 w-3 mr-1" /> Convertir
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteEvent(event.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Tous les événements sont liés</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-600 font-medium">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={loadData}>Réessayer</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}