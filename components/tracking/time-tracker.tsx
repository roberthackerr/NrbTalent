// components/tracking/time-tracker.tsx
"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Project, Task, TimeEntry } from '@/lib/tracking/types'
import { usePersistentTimer } from '@/hooks/usePersistentTimer'
import { 
  Play, 
  StopCircle, 
  Clock, 
  Calendar, 
  Trash2, 
  RefreshCw,
  TrendingUp,
  Award,
  Target,
  Zap,
  BarChart3,
  PieChart,
  Timer,
  Loader2,
  Sparkles,
  CloudOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface TimeTrackerProps {
  project: Project
  tasks: Task[]
}

interface TaskWithTime extends Task {
  totalSeconds: number
  formattedTime: string
  percentage: number
  recentEntries: TimeEntry[]
}

export function TimeTracker({ project, tasks }: TimeTrackerProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [selectedTask, setSelectedTask] = useState<string>('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [timeFormat, setTimeFormat] = useState<'hours' | 'compact' | 'decimal'>('hours')
  
  const { activeTimer, elapsedTime, startTimer, stopTimer } = usePersistentTimer()

  const getProjectId = (): string | null => {
    return project?.id || (project as any)?._id || null
  }

  const projectId = getProjectId()

  // ✅ CORRECTION: Définir getWeeklyHours AVANT de l'utiliser
  const getWeeklyHours = useCallback(() => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const weeklySeconds = timeEntries
      .filter(entry => new Date(entry.startTime) > oneWeekAgo)
      .reduce((total, entry) => total + (entry.duration || 0), 0)
    return weeklySeconds / 3600
  }, [timeEntries])

  // Vérifier l'état de la connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      toast.success('Connexion rétablie', { description: 'Synchronisation des données...' })
      syncTimerWithServer()
      loadTimeEntries()
    }
    const handleOffline = () => {
      setIsOffline(true)
      toast.warning('Connexion perdue', { description: 'Les données seront synchronisées automatiquement' })
    }
    
    setIsOffline(!navigator.onLine)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Synchroniser le timer avec le serveur au chargement
  const syncTimerWithServer = useCallback(async () => {
    if (isOffline) return
    
    try {
      setIsSyncing(true)
      const response = await fetch('/api/time-entries/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.hasActiveTimer && !activeTimer) {
          startTimer(
            data.timer.taskId,
            data.timer.description,
            data.timer.entryId
          )
          toast.info('Timer restauré', { description: 'Votre session de travail a été rechargée' })
        }
      }
    } catch (error) {
      console.error('Error syncing timer:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [activeTimer, startTimer, isOffline])

  // Charger les time entries
  const loadTimeEntries = useCallback(async () => {
    if (!projectId) return
    if (isOffline) {
      const cached = localStorage.getItem(`timeEntries_${projectId}`)
      if (cached) {
        setTimeEntries(JSON.parse(cached))
      }
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${projectId}/time-entries`)
      if (response.ok) {
        const entries = await response.json()
        setTimeEntries(entries)
        localStorage.setItem(`timeEntries_${projectId}`, JSON.stringify(entries))
      }
    } catch (error) {
      console.error('Error loading time entries:', error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, isOffline])

  useEffect(() => {
    syncTimerWithServer()
    loadTimeEntries()
  }, [syncTimerWithServer, loadTimeEntries])

  // Démarrer le timer
  const handleStartTimer = async () => {
    if (!selectedTask) {
      toast.error('Erreur', { description: 'Veuillez sélectionner une tâche' })
      return
    }

    if (isOffline) {
      startTimer(selectedTask, description || 'Travail en cours')
      toast.success('Timer démarré (mode hors ligne)', { 
        description: 'Le temps sera synchronisé à la reconnexion' 
      })
      return
    }

    try {
      const response = await fetch('/api/time-entries/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          taskId: selectedTask,
          startTime: new Date().toISOString(),
          description: description || 'Travail en cours'
        })
      })

      if (response.ok) {
        const data = await response.json()
        startTimer(selectedTask, description || 'Travail en cours', data.entryId)
        toast.success('Timer démarré', { description: 'Bon travail !' })
      } else if (response.status === 409) {
        const data = await response.json()
        toast.warning('Timer déjà actif', { 
          description: 'Un timer est déjà en cours sur une autre tâche' 
        })
        if (data.activeTimer) {
          startTimer(
            data.activeTimer.taskId.toString(),
            data.activeTimer.description,
            data.activeTimer._id.toString()
          )
        }
      } else {
        throw new Error('Failed to start timer')
      }
    } catch (error) {
      console.error('Error starting timer:', error)
      startTimer(selectedTask, description || 'Travail en cours')
      toast.warning('Mode dégradé', { 
        description: 'Timer démarré localement, synchronisation à la reconnexion' 
      })
    }
  }

  // Arrêter le timer
  const handleStopTimer = async () => {
    if (!activeTimer) return

    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - activeTimer.startTime.getTime()) / 1000)

    if (isOffline) {
      const offlineEntry = {
        id: `offline_${Date.now()}`,
        taskId: activeTimer.taskId,
        startTime: activeTimer.startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        description: activeTimer.description,
        billable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const cached = localStorage.getItem(`offlineEntries_${projectId}`)
      const offlineEntries = cached ? JSON.parse(cached) : []
      offlineEntries.push(offlineEntry)
      localStorage.setItem(`offlineEntries_${projectId}`, JSON.stringify(offlineEntries))
      
      stopTimer()
      toast.success('Timer arrêté (mode hors ligne)', { 
        description: 'Les données seront synchronisées à la reconnexion' 
      })
      return
    }

    try {
      const response = await fetch('/api/time-entries/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stop',
          entryId: activeTimer.entryId,
          endTime: endTime.toISOString(),
          duration,
          description: activeTimer.description
        })
      })

      if (response.ok) {
        stopTimer()
        const hours = Math.floor(duration / 3600)
        const minutes = Math.floor((duration % 3600) / 60)
        toast.success('Timer arrêté', { 
          description: `${hours}h ${minutes}m enregistrés` 
        })
        loadTimeEntries()
      } else {
        throw new Error('Failed to stop timer')
      }
    } catch (error) {
      console.error('Error stopping timer:', error)
      stopTimer()
      toast.warning('Mode dégradé', { 
        description: 'Timer arrêté localement, synchronisation à la reconnexion' 
      })
    }
  }

  // Synchroniser les entrées hors ligne
  const syncOfflineEntries = useCallback(async () => {
    if (isOffline) return
    
    const offlineEntriesKey = `offlineEntries_${projectId}`
    const offlineEntries = localStorage.getItem(offlineEntriesKey)
    
    if (offlineEntries) {
      const entries = JSON.parse(offlineEntries)
      for (const entry of entries) {
        try {
          await fetch('/api/time-entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              taskId: entry.taskId,
              startTime: entry.startTime,
              endTime: entry.endTime,
              duration: entry.duration,
              description: entry.description
            })
          })
        } catch (error) {
          console.error('Error syncing offline entry:', error)
        }
      }
      localStorage.removeItem(offlineEntriesKey)
      toast.success('Synchronisation terminée', { 
        description: 'Les données hors ligne ont été synchronisées' 
      })
      loadTimeEntries()
    }
  }, [projectId, isOffline, loadTimeEntries])

  useEffect(() => {
    if (!isOffline) {
      syncOfflineEntries()
    }
  }, [isOffline, syncOfflineEntries])

  const deleteTimeEntry = async (entryId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée de temps ?')) return
    
    try {
      const response = await fetch(`/api/time-entries/${entryId}`, { method: 'DELETE' })
      if (response.ok) {
        loadTimeEntries()
        toast.success('Entrée supprimée')
      }
    } catch (error) {
      console.error('Error deleting time entry:', error)
      toast.error('Erreur', { description: 'Impossible de supprimer l\'entrée' })
    }
  }

  // Formater la durée comme Clockify
  const formatDuration = (seconds: number, format: 'hours' | 'compact' | 'decimal' = 'hours') => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    switch (format) {
      case 'compact':
        if (hours > 0) return `${hours}h ${minutes}m`
        if (minutes > 0) return `${minutes}m ${secs}s`
        return `${secs}s`
      case 'decimal':
        return (seconds / 3600).toFixed(2).replace('.', ',') + 'h'
      default:
        if (hours > 0) return `${hours}h ${minutes.toString().padStart(2, '0')}m`
        if (minutes > 0) return `${minutes}m ${secs.toString().padStart(2, '0')}s`
        return `${secs}s`
    }
  }

  // Calculer le temps total par tâche
  const getTasksWithTime = useCallback((): TaskWithTime[] => {
    const totalSeconds = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    
    return tasks.map(task => {
      const taskSeconds = timeEntries
        .filter(entry => entry.taskId === task.id)
        .reduce((sum, entry) => sum + (entry.duration || 0), 0)
      
      const recentEntries = timeEntries
        .filter(entry => entry.taskId === task.id)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, 5)
      
      return {
        ...task,
        totalSeconds: taskSeconds,
        formattedTime: formatDuration(taskSeconds, timeFormat),
        percentage: totalSeconds > 0 ? (taskSeconds / totalSeconds) * 100 : 0,
        recentEntries
      }
    }).sort((a, b) => b.totalSeconds - a.totalSeconds)
  }, [tasks, timeEntries, timeFormat])

  const tasksWithTime = getTasksWithTime()
  const totalProjectSeconds = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
  const totalFormatted = formatDuration(totalProjectSeconds, timeFormat)
  const weeklyHours = getWeeklyHours()
  const weeklyFormatted = formatDuration(weeklyHours * 3600, timeFormat)

  const toggleTaskExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  const activeTask = activeTimer ? tasks.find(t => t.id === activeTimer.taskId) : null
  const availableTasks = tasks.filter(task => task.status !== 'done')

  return (
    <div className="space-y-6">
      {/* Offline Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <CloudOff className="h-5 w-5" />
              <span className="font-medium">Mode hors ligne</span>
            </div>
            <p className="text-amber-700 dark:text-amber-500 text-sm mt-1">
              Les modifications seront synchronisées automatiquement à la reconnexion.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer Section - Style Clockify */}
      <Card className="border-purple-200 dark:border-purple-800 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Timer className="h-5 w-5" />
              Suivi du temps
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={timeFormat} onValueChange={(v: any) => setTimeFormat(v)}>
                <SelectTrigger className="w-[110px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">HH:MM</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="decimal">Décimal</SelectItem>
                </SelectContent>
              </Select>
              {isSyncing && <Loader2 className="h-4 w-4 animate-spin text-purple-500" />}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Sélectionner une tâche
                </label>
                <Select 
                  value={selectedTask} 
                  onValueChange={setSelectedTask}
                  disabled={!!activeTimer}
                >
                  <SelectTrigger className="border-purple-200 dark:border-purple-800">
                    <SelectValue placeholder="Choisir une tâche..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTasks.map(task => (
                      <SelectItem key={task.id} value={task.id}>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            task.priority === 'urgent' ? 'bg-red-500' :
                            task.priority === 'high' ? 'bg-orange-500' :
                            task.priority === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                          )} />
                          <span className="truncate">{task.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Description (optionnelle)
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ajouter une note sur ce que vous faites..."
                  rows={2}
                  disabled={!!activeTimer}
                  className="border-purple-200 dark:border-purple-800"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 justify-center">
              {!activeTimer ? (
                <Button
                  onClick={handleStartTimer}
                  disabled={!selectedTask}
                  className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 min-w-[160px] h-12 text-base"
                >
                  <Play className="h-5 w-5" />
                  Démarrer le timer
                </Button>
              ) : (
                <Button
                  onClick={handleStopTimer}
                  className="gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 min-w-[160px] h-12 text-base"
                >
                  <StopCircle className="h-5 w-5" />
                  Arrêter
                </Button>
              )}
            </div>
          </div>

          {/* Active Timer Display */}
          <AnimatePresence>
            {activeTimer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-2 border-purple-200 dark:border-purple-800 rounded-xl"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="relative">
                        <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-75"></div>
                        <div className="relative w-3 h-3 bg-red-500 rounded-full"></div>
                      </div>
                      <p className="font-semibold text-purple-900 dark:text-purple-300">
                        En cours : {activeTask?.title}
                      </p>
                      {isOffline && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                          Hors ligne
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-400">
                      {activeTimer.description && activeTimer.description !== 'Travail en cours' 
                        ? activeTimer.description 
                        : 'Aucune description'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-mono font-bold text-purple-900 dark:text-purple-300 bg-white/50 dark:bg-gray-900/50 px-6 py-3 rounded-xl border-2 border-purple-300 dark:border-purple-700 shadow-lg">
                      {formatDuration(elapsedTime, 'compact')}
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                      temps écoulé
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total</p>
                <p className="text-2xl font-bold">{totalFormatted}</p>
              </div>
              <TrendingUp className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Cette semaine</p>
                <p className="text-2xl font-bold">{weeklyFormatted}</p>
              </div>
              <Calendar className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Sessions</p>
                <p className="text-2xl font-bold">{timeEntries.length}</p>
              </div>
              <Sparkles className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Jours</p>
                <p className="text-2xl font-bold">{new Set(timeEntries.map(e => new Date(e.startTime).toDateString())).size}</p>
              </div>
              <Award className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Time List - Style Clockify */}
      <Card className="border-purple-200 dark:border-purple-800 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Clock className="h-5 w-5" />
            Temps par tâche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasksWithTime.map((task) => (
              <div key={task.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Task Header */}
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => toggleTaskExpand(task.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      task.status === 'done' ? 'bg-green-500' : 
                      task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                    )} />
                    <span className="font-medium text-gray-900 dark:text-white">{task.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {task.status === 'done' ? 'Terminée' : 
                       task.status === 'in_progress' ? 'En cours' : 'À faire'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-mono font-semibold text-gray-900 dark:text-white">
                        {task.formattedTime}
                      </div>
                      <div className="text-xs text-gray-500">
                        {task.percentage.toFixed(1)}% du total
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      {expandedTasks.has(task.id) ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="px-4 pb-2">
                  <Progress value={task.percentage} className="h-1.5" />
                </div>

                {/* Expanded Content - Recent Entries */}
                <AnimatePresence>
                  {expandedTasks.has(task.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30"
                    >
                      <div className="p-4 space-y-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Dernières entrées
                        </h4>
                        {task.recentEntries.length > 0 ? (
                          <div className="space-y-2">
                            {task.recentEntries.map((entry) => (
                              <div key={entry.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {new Date(entry.startTime).toLocaleDateString('fr-FR')}
                                  </span>
                                  <span className="text-gray-500">
                                    {new Date(entry.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <span className="text-gray-500">→</span>
                                  <span className="text-gray-500">
                                    {entry.endTime ? new Date(entry.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'En cours'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge variant="secondary" className="text-xs font-mono">
                                    {formatDuration(entry.duration || 0, 'compact')}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteTimeEntry(entry.id)
                                    }}
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Aucune entrée récente</p>
                        )}
                        
                        {task.estimatedHours && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Estimation</span>
                              <span className="font-mono text-gray-900 dark:text-white">
                                {formatDuration(task.estimatedHours * 3600, timeFormat)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                              <span className="text-gray-600 dark:text-gray-400">Écart</span>
                              <span className={cn(
                                "font-mono",
                                task.totalSeconds > task.estimatedHours * 3600 
                                  ? "text-red-600" 
                                  : "text-green-600"
                              )}>
                                {task.totalSeconds > task.estimatedHours * 3600 ? '+' : '-'}
                                {formatDuration(Math.abs(task.totalSeconds - (task.estimatedHours * 3600)), 'compact')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {tasksWithTime.length === 0 && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Aucune donnée de temps</p>
                <p className="text-sm text-gray-400 mt-1">
                  Commencez à tracker votre temps pour voir les statistiques
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Time Entries History */}
      <Card className="border-purple-200 dark:border-purple-800 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <BarChart3 className="h-5 w-5" />
              Historique complet
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {timeEntries.length} entrée(s) enregistrée(s)
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadTimeEntries}
            disabled={isLoading}
            className="gap-2 border-purple-300 dark:border-purple-700"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-purple-200 dark:border-purple-800">
                  <TableHead>Date</TableHead>
                  <TableHead>Tâche</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.slice(0, 20).map(entry => {
                  const task = tasks.find(t => t.id === entry.taskId)
                  const startDate = new Date(entry.startTime)
                  
                  return (
                    <TableRow key={entry.id} className="hover:bg-purple-50/30 dark:hover:bg-purple-950/20">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {startDate.toLocaleDateString('fr-FR')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {task?.title || 'Tâche inconnue'}
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <div className="truncate" title={entry.description}>
                          {entry.description || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono bg-purple-100 dark:bg-purple-950/30">
                          {formatDuration(entry.duration || 0, timeFormat)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTimeEntry(entry.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                
                {timeEntries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <Timer className="h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-gray-500">Aucun temps enregistré</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Cliquez sur "Démarrer le timer" pour commencer
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}