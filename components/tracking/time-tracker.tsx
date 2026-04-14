// components/tracking/time-tracker.tsx
"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { 
  Play, 
  Pause, 
  StopCircle, 
  Clock, 
  Calendar, 
  Trash2, 
  AlertTriangle, 
  RefreshCw,
  TrendingUp,
  Award,
  Target,
  Zap,
  ChevronRight,
  BarChart3,
  PieChart,
  Timer,
  User,
  Briefcase,
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimeTrackerProps {
  project: Project
  tasks: Task[]
}

export function TimeTracker({ project, tasks }: TimeTrackerProps) {
  const [activeTimer, setActiveTimer] = useState<{ 
    taskId: string; 
    startTime: Date;
    description: string;
    entryId?: string;
  } | null>(null)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [selectedTask, setSelectedTask] = useState<string>('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isExpanded, setIsExpanded] = useState(true)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const getProjectId = (): string | null => {
    return project?.id || (project as any)?._id || null
  }

  const projectId = getProjectId()

  useEffect(() => {
    if (projectId) loadTimeEntries()
  }, [projectId])

  useEffect(() => {
    if (activeTimer) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - activeTimer.startTime.getTime()) / 1000))
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setElapsedTime(0)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [activeTimer])

  const loadTimeEntries = async () => {
    if (!projectId) return
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${projectId}/time-entries`)
      if (response.ok) {
        const entries = await response.json()
        setTimeEntries(entries)
      } else {
        await loadAllUserTimeEntries()
      }
    } catch (error) {
      console.error('Error loading time entries:', error)
      await loadAllUserTimeEntries()
    } finally {
      setIsLoading(false)
    }
  }

  const loadAllUserTimeEntries = async () => {
    try {
      const response = await fetch('/api/time-entries')
      if (response.ok) {
        const allEntries = await response.json()
        const projectTaskIds = tasks.map(task => task.id)
        const projectEntries = allEntries.filter((entry: TimeEntry) => 
          projectTaskIds.includes(entry.taskId)
        )
        setTimeEntries(projectEntries)
      }
    } catch (error) {
      console.error('Error loading all user time entries:', error)
    }
  }

  const startTimer = async () => {
    if (!selectedTask) {
      alert('Veuillez sélectionner une tâche')
      return
    }

    const startTime = new Date()
    
    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: selectedTask,
          startTime: startTime.toISOString(),
          description: description || 'Travail en cours',
          billable: true
        })
      })

      if (response.ok) {
        const newEntry = await response.json()
        setActiveTimer({
          taskId: selectedTask,
          startTime,
          description: description || 'Travail en cours',
          entryId: newEntry.id
        })
      } else {
        throw new Error('Failed to start timer')
      }
    } catch (error) {
      console.error('Error starting timer:', error)
      alert('Erreur lors du démarrage du timer')
    }
  }

  const stopTimer = async () => {
    if (!activeTimer) return

    const endTime = new Date()
    const duration = Math.round((endTime.getTime() - activeTimer.startTime.getTime()) / 1000)

    try {
      if (activeTimer.entryId) {
        await fetch(`/api/time-entries/${activeTimer.entryId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endTime: endTime.toISOString(),
            duration: duration,
            description: activeTimer.description
          })
        })
      }

      setActiveTimer(null)
      setDescription('')
      setSelectedTask('')
      if (projectId) loadTimeEntries()
      else loadAllUserTimeEntries()
    } catch (error) {
      console.error('Error stopping timer:', error)
      alert('Erreur lors de l\'arrêt du timer')
    }
  }

  const deleteTimeEntry = async (entryId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée de temps ?')) return
    try {
      const response = await fetch(`/api/time-entries/${entryId}`, { method: 'DELETE' })
      if (response.ok) {
        if (projectId) loadTimeEntries()
        else loadAllUserTimeEntries()
      }
    } catch (error) {
      console.error('Error deleting time entry:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}h ${minutes.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`
    if (minutes > 0) return `${minutes}m ${secs.toString().padStart(2, '0')}s`
    return `${secs}s`
  }

  const getTotalHours = () => timeEntries.reduce((total, entry) => total + (entry.duration || 0), 0) / 3600
  const getTaskHours = (taskId: string) => timeEntries.filter(e => e.taskId === taskId).reduce((t, e) => t + (e.duration || 0), 0) / 3600
  const getWeeklyHours = () => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    return timeEntries.filter(e => new Date(e.startTime) > oneWeekAgo).reduce((t, e) => t + (e.duration || 0), 0) / 3600
  }
  const getMonthlyHours = () => {
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    return timeEntries.filter(e => new Date(e.startTime) > oneMonthAgo).reduce((t, e) => t + (e.duration || 0), 0) / 3600
  }

  const activeTask = activeTimer ? tasks.find(t => t.id === activeTimer.taskId) : null
  const availableTasks = tasks.filter(task => task.status !== 'done')
  const ongoingTasks = tasks.filter(task => task.status === 'in_progress' && getTaskHours(task.id) > 0)

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total projet</p>
                <p className="text-2xl font-bold">{getTotalHours().toFixed(1)}h</p>
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
                <p className="text-2xl font-bold">{getWeeklyHours().toFixed(1)}h</p>
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
                <p className="text-2xl font-bold">{timeEntries.filter(e => e.billable).length}</p>
              </div>
              <Timer className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Jours travaillés</p>
                <p className="text-2xl font-bold">{new Set(timeEntries.map(e => new Date(e.startTime).toDateString())).size}</p>
              </div>
              <Award className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timer Section */}
      <Card className="border-purple-200 dark:border-purple-800 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Timer className="h-5 w-5" />
            Timer de travail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Tâche *
                </label>
                <Select 
                  value={selectedTask} 
                  onValueChange={setSelectedTask}
                  disabled={!!activeTimer}
                >
                  <SelectTrigger className="border-purple-200 dark:border-purple-800">
                    <SelectValue placeholder="Sélectionner une tâche" />
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
                          <Badge variant="outline" className="text-xs">
                            {task.status === 'in_progress' ? 'En cours' : 
                             task.status === 'review' ? 'En revue' : 
                             task.status === 'todo' ? 'À faire' : task.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Description du travail
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez le travail effectué..."
                  rows={2}
                  disabled={!!activeTimer}
                  className="border-purple-200 dark:border-purple-800 focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 justify-center">
              {!activeTimer ? (
                <Button
                  onClick={startTimer}
                  disabled={!selectedTask}
                  className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 min-w-[140px]"
                >
                  <Play className="h-4 w-4" />
                  Démarrer
                </Button>
              ) : (
                <>
                  <Button
                    onClick={stopTimer}
                    className="gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 min-w-[140px]"
                  >
                    <StopCircle className="h-4 w-4" />
                    Arrêter
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={stopTimer}
                    className="gap-2 min-w-[140px] border-purple-300 dark:border-purple-700"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                </>
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
                    <div className="flex items-center gap-2 mb-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-75"></div>
                        <div className="relative w-3 h-3 bg-red-500 rounded-full"></div>
                      </div>
                      <p className="font-semibold text-purple-900 dark:text-purple-300 text-lg">
                        ⏱️ Timer en cours
                      </p>
                    </div>
                    <div className="space-y-2 text-sm text-purple-800 dark:text-purple-400">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <strong>Tâche:</strong> {activeTask?.title || 'Tâche inconnue'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <strong>Débuté à:</strong> {activeTimer.startTime.toLocaleTimeString('fr-FR')}
                      </div>
                      {activeTimer.description && activeTimer.description !== 'Travail en cours' && (
                        <div className="flex items-start gap-2">
                          <Zap className="h-4 w-4 mt-0.5" />
                          <strong>Description:</strong> {activeTimer.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-900 dark:text-purple-300 bg-white/50 dark:bg-gray-900/50 px-6 py-3 rounded-xl border-2 border-purple-300 dark:border-purple-700 shadow-lg">
                      {formatDuration(elapsedTime)}
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                      Temps écoulé
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Ongoing Tasks Section */}
      {ongoingTasks.length > 0 && (
        <Card className="border-purple-200 dark:border-purple-800 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Zap className="h-5 w-5" />
              Tâches en cours ({ongoingTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ongoingTasks.map(task => {
                const taskHours = getTaskHours(task.id)
                const taskProgress = task.estimatedHours ? (taskHours / task.estimatedHours) * 100 : 0
                return (
                  <div
                    key={task.id}
                    className="p-4 border border-purple-200 dark:border-purple-800 rounded-xl hover:shadow-md transition-all bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-950/20"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={cn(
                            "text-xs",
                            task.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400' :
                            task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400' :
                            task.priority === 'medium' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400' :
                            'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400'
                          )}>
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                      {taskHours > 0 && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {taskHours.toFixed(1)}h
                          </p>
                          <p className="text-xs text-gray-500">travaillées</p>
                        </div>
                      )}
                    </div>
                    {task.estimatedHours && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                          <span>Progression</span>
                          <span>{Math.min(taskProgress, 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={Math.min(taskProgress, 100)} className="h-1.5" />
                        <p className="text-xs text-gray-500 mt-2">
                          Objectif: {task.estimatedHours}h
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Distribution Chart */}
      {tasks.filter(task => getTaskHours(task.id) > 0).length > 0 && (
        <Card className="border-purple-200 dark:border-purple-800 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <PieChart className="h-5 w-5" />
              Répartition du temps par tâche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks
                .filter(task => getTaskHours(task.id) > 0)
                .sort((a, b) => getTaskHours(b.id) - getTaskHours(a.id))
                .map(task => {
                  const taskHours = getTaskHours(task.id)
                  const percentage = (taskHours / Math.max(getTotalHours(), 1)) * 100
                  
                  return (
                    <div key={task.id} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            task.status === 'done' ? 'bg-green-500' : 'bg-purple-500'
                          )} />
                          <span className="font-medium text-sm text-gray-900 dark:text-white">
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-xs">
                            {taskHours.toFixed(1)}h
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{task.status === 'done' ? '✅ Terminée' : '🟡 En cours'}</span>
                        {task.estimatedHours && (
                          <span>Prévu: {task.estimatedHours}h</span>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Entries History */}
      <Card className="border-purple-200 dark:border-purple-800 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <BarChart3 className="h-5 w-5" />
              Historique du temps
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {timeEntries.length} entrée(s) de temps enregistrée(s)
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
            {isLoading ? 'Chargement...' : 'Actualiser'}
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
                  <TableHead>Facturable</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map(entry => {
                  const task = tasks.find(t => t.id === entry.taskId)
                  const durationHours = (entry.duration || 0) / 3600
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {task?.title || 'Tâche inconnue'}
                          {task && (
                            <Badge variant="outline" className="text-xs">
                              {task.status}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <div className="truncate" title={entry.description}>
                          {entry.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono bg-purple-100 dark:bg-purple-950/30">
                          {durationHours.toFixed(1)}h
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.billable ? "default" : "secondary"}>
                          {entry.billable ? '💰 Oui' : '❌ Non'}
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
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-950/30 rounded-full flex items-center justify-center mb-4">
                          <Timer className="h-8 w-8 text-purple-500" />
                        </div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Aucun temps enregistré
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          Commencez par démarrer un timer pour tracker votre temps de travail.
                        </p>
                        <Button 
                          onClick={loadTimeEntries} 
                          variant="outline"
                          className="gap-2 border-purple-300 dark:border-purple-700"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Recharger
                        </Button>
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