"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Video, 
  Users, 
  Building, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Filter,
  Download,
  Share,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock4,
  Loader2,
  MapPin,
  Briefcase,
  User,
  MoreVertical
} from "lucide-react"
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  parseISO
} from "date-fns"
import { fr } from "date-fns/locale"
import { eventsApi } from "@/lib/api"
import { CalendarEvent, CreateEventRequest } from "@/lib/models/event"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getSession, useSession } from "next-auth/react"
import Router from "next/router"

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [view, setView] = useState<'month' | 'week'>('month')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
const session=getSession()
if(!session){
    Router.push("")
}
  // Charger les événements
  const loadEvents = async () => {
    try {
      setIsLoading(true)
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      
      const eventsData = await eventsApi.getEvents({
        startDate: monthStart,
        endDate: monthEnd
      })
      setEvents(eventsData)
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error)
      toast.error('Erreur lors du chargement des événements')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [currentDate])

  // Réinitialiser la date sélectionnée quand le mois change
  useEffect(() => {
    setSelectedDate(null)
  }, [currentDate])

  // Filtrage des événements
  const filteredEvents = events.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === 'all' || event.type === filterType
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const getEventsForDate = (date: Date) => {
    if (!date) return []
    return filteredEvents.filter(event => isSameDay(event.start, date))
  }

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    const iconClass = "h-3 w-3"
    switch (type) {
      case 'meeting': return <Users className={iconClass} />
      case 'call': return <Video className={iconClass} />
      case 'project': return <Building className={iconClass} />
      case 'delivery': return <CheckCircle className={iconClass} />
      case 'workshop': return <Briefcase className={iconClass} />
      case 'training': return <User className={iconClass} />
      default: return <CalendarIcon className={iconClass} />
    }
  }

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return 'bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-800'
      case 'call': return 'bg-green-500/10 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-800'
      case 'project': return 'bg-purple-500/10 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-800'
      case 'delivery': return 'bg-orange-500/10 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-800'
      case 'workshop': return 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-800'
      case 'training': return 'bg-cyan-500/10 text-cyan-700 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-800'
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-800'
    }
  }

  const getStatusIcon = (status: CalendarEvent['status']) => {
    const iconClass = "h-3 w-3"
    switch (status) {
      case 'confirmed': return <CheckCircle className={`${iconClass} text-green-500`} />
      case 'pending': return <Clock4 className={`${iconClass} text-yellow-500`} />
      case 'cancelled': return <XCircle className={`${iconClass} text-red-500`} />
      case 'completed': return <CheckCircle className={`${iconClass} text-blue-500`} />
      default: return <Clock4 className={`${iconClass} text-gray-500`} />
    }
  }

  const getStatusColor = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  // Gestion des événements
  const handleCreateEvent = async (eventData: CreateEventRequest) => {
    try {
      setIsSubmitting(true)
      const newEvent = await eventsApi.createEvent(eventData)
      setEvents(prev => [...prev, newEvent])
      setIsAddEventOpen(false)
      toast.success('Événement créé avec succès')
    } catch (error) {
      console.error('Erreur création:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateEvent = async (id: string, eventData: Partial<CreateEventRequest>) => {
    try {
      const updatedEvent = await eventsApi.updateEvent(id, eventData)
      setEvents(prev => prev.map(event => 
        event._id === id ? updatedEvent : event
      ))
      setSelectedEvent(null)
      toast.success('Événement modifié avec succès')
    } catch (error) {
      console.error('Erreur modification:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la modification')
    }
  }

  const handleDeleteEvent = async (id: string) => {
    try {
      await eventsApi.deleteEvent(id)
      setEvents(prev => prev.filter(event => event._id !== id))
      setSelectedEvent(null)
      toast.success('Événement supprimé avec succès')
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    }
  }

  // Vues du calendrier
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Statistiques
  const stats = {
    total: events.length,
    confirmed: events.filter(e => e.status === 'confirmed').length,
    pending: events.filter(e => e.status === 'pending').length,
    completed: events.filter(e => e.status === 'completed').length,
    thisWeek: events.filter(e => {
      const eventStart = new Date(e.start)
      return eventStart >= startOfWeek(new Date(), { weekStartsOn: 1 }) && 
             eventStart <= endOfWeek(new Date(), { weekStartsOn: 1 })
    }).length
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Calendrier</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Gérez vos rendez-vous clients, deadlines et réunions
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <Button 
                variant={view === 'month' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setView('month')}
                className="rounded-md"
              >
                Mois
              </Button>
              <Button 
                variant={view === 'week' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setView('week')}
                className="rounded-md"
              >
                Semaine
              </Button>
            </div>
            
            <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  Nouvel événement
                </Button>
              </DialogTrigger>
              <AddEventForm 
                onSubmit={handleCreateEvent}
                onClose={() => setIsAddEventOpen(false)}
                isSubmitting={isSubmitting}
              />
            </Dialog>
          </div>
        </div>

        {/* Barre d'outils */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex-1 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Rechercher un événement, client, description..."
                    className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[140px] bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="meeting">Réunions</SelectItem>
                      <SelectItem value="call">Appels</SelectItem>
                      <SelectItem value="project">Projets</SelectItem>
                      <SelectItem value="delivery">Livraisons</SelectItem>
                      <SelectItem value="workshop">Ateliers</SelectItem>
                      <SelectItem value="training">Formations</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px] bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="confirmed">Confirmé</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadEvents}
                  disabled={isLoading}
                  className="border-slate-200 dark:border-slate-600"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualiser'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation et période */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <CardTitle className="flex items-center gap-2 text-xl text-slate-900 dark:text-white">
                  <CalendarIcon className="h-5 w-5 text-blue-500" />
                  {view === 'month' && format(currentDate, 'MMMM yyyy', { locale: fr })}
                  {view === 'week' && `Semaine du ${format(weekStart, 'd MMMM yyyy', { locale: fr })}`}
                </CardTitle>
                <Badge variant="secondary" className="text-sm">
                  {filteredEvents.length} événement(s)
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentDate(view === 'month' ? subMonths(currentDate, 1) : subDays(currentDate, 7))}
                  className="border-slate-200 dark:border-slate-600"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  className="border-slate-200 dark:border-slate-600"
                >
                  Aujourd'hui
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentDate(view === 'month' ? addMonths(currentDate, 1) : addDays(currentDate, 7))}
                  className="border-slate-200 dark:border-slate-600"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendrier principal */}
          <div className="lg:col-span-3">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-slate-600 dark:text-slate-400">Chargement...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* En-tête des jours */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                      {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                        <div key={day} className="text-center text-sm font-semibold text-slate-600 dark:text-slate-400 p-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Grille des jours */}
                    <div className="grid grid-cols-7 gap-1">
                      {monthDays.map(day => {
                        const dayEvents = getEventsForDate(day)
                        const isCurrentDay = isToday(day)
                        const isSelected = selectedDate && isSameDay(day, selectedDate)
                        const isCurrentMonth = isSameMonth(day, currentDate)

                        return (
                          <div
                            key={day.toISOString()}
                            className={cn(
                              "min-h-[120px] p-2 border rounded-lg cursor-pointer transition-all",
                              isCurrentDay && "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
                              isSelected && "border-blue-500 ring-2 ring-blue-500/20",
                              !isCurrentMonth && "opacity-40 bg-slate-50 dark:bg-slate-800/50",
                              !isSelected && !isCurrentDay && "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            )}
                            onClick={() => setSelectedDate(day)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className={cn(
                                "text-sm font-medium",
                                isCurrentDay ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-slate-100",
                                !isCurrentMonth && "text-slate-400 dark:text-slate-600"
                              )}>
                                {format(day, 'd')}
                              </span>
                              {dayEvents.length > 0 && (
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                  {dayEvents.length}
                                </Badge>
                              )}
                            </div>

                            {/* Événements du jour */}
                            <div className="space-y-1">
                              {dayEvents.slice(0, 3).map(event => (
                                <div
                                  key={event._id || event.id}
                                  className={cn(
                                    "text-xs p-1.5 rounded border cursor-pointer group hover:shadow-sm transition-all",
                                    getEventTypeColor(event.type)
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedEvent(event)
                                  }}
                                >
                                  <div className="flex items-center gap-1.5">
                                    {getEventTypeIcon(event.type)}
                                    <span className="font-semibold truncate flex-1 group-hover:text-opacity-80">
                                      {event.title}
                                    </span>
                                    {getStatusIcon(event.status)}
                                  </div>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs opacity-75 flex items-center gap-1">
                                      <Clock className="h-2.5 w-2.5" />
                                      {format(new Date(event.start), 'HH:mm')}
                                    </span>
                                    <span className="text-xs opacity-75 truncate max-w-[60px]">
                                      {event.client}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {dayEvents.length > 3 && (
                                <div className="text-xs text-slate-500 text-center pt-1">
                                  +{dayEvents.length - 3} autre(s)
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Événements du jour sélectionné */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-900 dark:text-white">
                  {selectedDate ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr }) : "Aujourd'hui"}
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  {getEventsForDate(selectedDate || new Date()).length} événement(s) planifié(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {getEventsForDate(selectedDate || new Date()).length > 0 ? (
                  getEventsForDate(selectedDate || new Date()).map(event => (
                    <div 
                      key={event._id || event.id} 
                      className="p-3 border border-slate-200 dark:border-slate-600 rounded-lg space-y-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getEventTypeIcon(event.type)}
                          <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
                            {event.title}
                          </span>
                        </div>
                        <Badge className={cn("text-xs", getStatusColor(event.status))}>
                          {event.status === 'confirmed' ? 'Confirmé' : 
                           event.status === 'pending' ? 'En attente' : 
                           event.status === 'completed' ? 'Terminé' : 'Annulé'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {event.description || 'Aucune description'}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Clock className="h-3 w-3" />
                          {format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}
                        </div>
                        <span className="font-medium text-xs text-slate-700 dark:text-slate-300 truncate max-w-[80px]">
                          {event.client}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-500 py-8">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucun événement prévu</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setIsAddEventOpen(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Ajouter un événement
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistiques */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-900 dark:text-white">Aperçu du mois</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Total</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">{stats.confirmed}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Confirmés</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
                    <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">En attente</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.thisWeek}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Cette semaine</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog de détail d'événement */}
      {selectedEvent && (
        <EventDetailDialog 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)}
          onEdit={(updatedData) => handleUpdateEvent(selectedEvent._id!, updatedData)}
          onDelete={() => handleDeleteEvent(selectedEvent._id!)}
        />
      )}
    </div>
  )
}

// Composant pour le formulaire d'ajout d'événement
function AddEventForm({ 
  onSubmit, 
  onClose, 
  isSubmitting 
}: { 
  onSubmit: (data: CreateEventRequest) => void
  onClose: () => void
  isSubmitting: boolean
}) {
  const [formData, setFormData] = useState<CreateEventRequest>({
    title: '',
    description: '',
    start: '',
    end: '',
    client: '',
    type: 'meeting',
    status: 'pending',
    location: '',
    project: '',
    isAllDay: false
  })

  // Formater la date pour l'input datetime-local
  const formatForDateTimeLocal = (date: Date) => {
    return date.toISOString().slice(0, 16)
  }

  // Définir les dates par défaut
  useEffect(() => {
    const now = new Date()
    const defaultStart = new Date(now)
    defaultStart.setHours(9, 0, 0, 0) // 9h00 par défaut
    
    const defaultEnd = new Date(now)
    defaultEnd.setHours(10, 0, 0, 0) // 10h00 par défaut

    setFormData(prev => ({
      ...prev,
      start: formatForDateTimeLocal(defaultStart),
      end: formatForDateTimeLocal(defaultEnd)
    }))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation des champs requis
    if (!formData.title.trim() || !formData.client.trim() || !formData.start || !formData.end) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    // Validation des dates
    const startDate = new Date(formData.start)
    const endDate = new Date(formData.end)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast.error('Dates invalides')
      return
    }

    if (endDate <= startDate) {
      toast.error('La date de fin doit être après la date de début')
      return
    }

    // S'assurer que les dates sont au format ISO
    const submitData: CreateEventRequest = {
      ...formData,
      start: startDate.toISOString(),
      end: endDate.toISOString()
    }

    onSubmit(submitData)

    // Reset form
    setFormData({
      title: '',
      description: '',
      start: formatForDateTimeLocal(new Date()),
      end: formatForDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)), // +1 heure
      client: '',
      type: 'meeting',
      status: 'pending',
      location: '',
      project: '',
      isAllDay: false
    })
  }

  return (
    <DialogContent className="max-w-2xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <DialogHeader>
        <DialogTitle className="text-slate-900 dark:text-white">Nouvel événement</DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-700 dark:text-slate-300">Titre *</Label>
              <Input 
                id="title" 
                placeholder="Réunion client..." 
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
                className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-700 dark:text-slate-300">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Détails de l'événement..." 
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client" className="text-slate-700 dark:text-slate-300">Client *</Label>
              <Input 
                id="client" 
                placeholder="Nom du client" 
                value={formData.client}
                onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                required
                className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project" className="text-slate-700 dark:text-slate-300">Projet</Label>
              <Input 
                id="project" 
                placeholder="Nom du projet" 
                value={formData.project}
                onChange={(e) => setFormData(prev => ({ ...prev, project: e.target.value }))}
                className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start" className="text-slate-700 dark:text-slate-300">Date et heure de début *</Label>
              <Input 
                id="start"
                type="datetime-local" 
                value={formData.start}
                onChange={(e) => setFormData(prev => ({ ...prev, start: e.target.value }))}
                required
                className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end" className="text-slate-700 dark:text-slate-300">Date et heure de fin *</Label>
              <Input 
                id="end"
                type="datetime-local" 
                value={formData.end}
                onChange={(e) => setFormData(prev => ({ ...prev, end: e.target.value }))}
                required
                className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Type d'événement *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectItem value="meeting">Réunion</SelectItem>
                  <SelectItem value="call">Appel</SelectItem>
                  <SelectItem value="project">Projet</SelectItem>
                  <SelectItem value="delivery">Livraison</SelectItem>
                  <SelectItem value="workshop">Atelier</SelectItem>
                  <SelectItem value="training">Formation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Statut *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmé</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-slate-700 dark:text-slate-300">Lieu/Lien</Label>
              <Input 
                id="location" 
                placeholder="Google Meet, Zoom, Adresse..." 
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Création...
              </>
            ) : (
              'Créer l\'événement'
            )}
          </Button>
          <Button type="button" variant="outline" className="flex-1 border-slate-200 dark:border-slate-600" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}

// Composant pour les détails de l'événement
function EventDetailDialog({ 
  event, 
  onClose, 
  onEdit, 
  onDelete 
}: { 
  event: CalendarEvent
  onClose: () => void
  onEdit: (data: Partial<CreateEventRequest>) => void
  onDelete: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<CreateEventRequest>>({
    title: event.title,
    description: event.description,
    client: event.client,
    project: event.project,
    location: event.location,
    type: event.type,
    status: event.status
  })

  const handleSave = () => {
    onEdit(editData)
    setIsEditing(false)
  }

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    const iconClass = "h-4 w-4"
    switch (type) {
      case 'meeting': return <Users className={iconClass} />
      case 'call': return <Video className={iconClass} />
      case 'project': return <Building className={iconClass} />
      case 'delivery': return <CheckCircle className={iconClass} />
      case 'workshop': return <Briefcase className={iconClass} />
      case 'training': return <User className={iconClass} />
      default: return <CalendarIcon className={iconClass} />
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            {getEventTypeIcon(event.type)}
            {isEditing ? (
              <Input
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
              />
            ) : (
              event.title
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isEditing ? (
            <>
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</Label>
                <Textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Client</Label>
                  <Input
                    value={editData.client}
                    onChange={(e) => setEditData(prev => ({ ...prev, client: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Projet</Label>
                  <Input
                    value={editData.project}
                    onChange={(e) => setEditData(prev => ({ ...prev, project: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Lieu</Label>
                <Input
                  value={editData.location}
                  onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                  className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 mt-1"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {event.description || 'Aucune description'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Client</Label>
                  <p className="text-sm text-slate-900 dark:text-slate-100 mt-1">
                    {event.client}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Projet</Label>
                  <p className="text-sm text-slate-900 dark:text-slate-100 mt-1">
                    {event.project || 'Non spécifié'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date</Label>
                  <p className="text-sm text-slate-900 dark:text-slate-100 mt-1">
                    {format(new Date(event.start), 'dd/MM/yyyy')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Heure</Label>
                  <p className="text-sm text-slate-900 dark:text-slate-100 mt-1">
                    {format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}
                  </p>
                </div>
              </div>

              {event.location && (
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Lieu</Label>
                  <p className="text-sm text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.location}
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Statut:</Label>
            {isEditing ? (
              <Select 
                value={editData.status} 
                onValueChange={(value: any) => setEditData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-32 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmé</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge className={cn("text-xs", 
                event.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                event.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                event.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              )}>
                {event.status === 'confirmed' ? 'Confirmé' : 
                 event.status === 'pending' ? 'En attente' : 
                 event.status === 'completed' ? 'Terminé' : 'Annulé'}
              </Badge>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            {isEditing ? (
              <>
                <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1 border-slate-200 dark:border-slate-600">
                  Annuler
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)} className="flex-1 border-slate-200 dark:border-slate-600">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button variant="outline" onClick={onDelete} className="flex-1 border-slate-200 dark:border-slate-600 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}