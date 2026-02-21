// components/tracking/time-tracker.tsx
"use client"

import { useState, useEffect, useRef } from 'react'
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
import { Play, Pause, StopCircle, Clock, Calendar, Trash2, AlertTriangle, RefreshCw } from 'lucide-react'

interface TimeTrackerProps {
  project: Project
  tasks: Task[]
}

export function TimeTracker({ project, tasks }: TimeTrackerProps) {
  // États principaux
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
  
  // Références
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Récupération robuste de l'ID du projet
  const getProjectId = (): string | null => {
    return project?.id || (project as any)?._id || null
  }

  const projectId = getProjectId()

  // Chargement des time entries
  useEffect(() => {
    if (projectId) {
      loadTimeEntries()
    }
  }, [projectId])

  // Gestion du timer en temps réel
  useEffect(() => {
    if (activeTimer) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - activeTimer.startTime.getTime()) / 1000))
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setElapsedTime(0)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [activeTimer])

  // Chargement des entrées de temps
  const loadTimeEntries = async () => {
    if (!projectId) {
      console.error('❌ Cannot load time entries: projectId is undefined')
      return
    }

    try {
      setIsLoading(true)
      console.log('🔍 Loading time entries for project:', projectId)
      
      const response = await fetch(`/api/projects/${projectId}/time-entries`)
      
      if (response.ok) {
        const entries = await response.json()
        console.log('✅ Time entries loaded:', entries.length)
        setTimeEntries(entries)
      } else {
        console.error('❌ Failed to load project time entries, using fallback')
        await loadAllUserTimeEntries()
      }
    } catch (error) {
      console.error('💥 Error loading time entries:', error)
      await loadAllUserTimeEntries()
    } finally {
      setIsLoading(false)
    }
  }

  // Fallback: charger tous les time entries de l'utilisateur
  const loadAllUserTimeEntries = async () => {
    try {
      console.log('🔄 Fallback: loading all user time entries')
      const response = await fetch('/api/time-entries')
      if (response.ok) {
        const allEntries = await response.json()
        console.log('✅ All user time entries loaded:', allEntries.length)
        
        // Filtrer pour n'avoir que les entrées des tâches de ce projet
        const projectTaskIds = tasks.map(task => task.id)
        const projectEntries = allEntries.filter((entry: TimeEntry) => 
          projectTaskIds.includes(entry.taskId)
        )
        console.log('📋 Filtered project entries:', projectEntries.length)
        setTimeEntries(projectEntries)
      }
    } catch (error) {
      console.error('Error loading all user time entries:', error)
    }
  }

  // Démarrer le timer
  const startTimer = async () => {
    if (!selectedTask) {
      alert('Veuillez sélectionner une tâche')
      return
    }

    const startTime = new Date()
    
    try {
      console.log('🚀 Starting timer for task:', selectedTask)
      
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
        console.log('✅ Timer started, entry created:', newEntry.id)
        
        setActiveTimer({
          taskId: selectedTask,
          startTime,
          description: description || 'Travail en cours',
          entryId: newEntry.id
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start timer')
      }
    } catch (error) {
      console.error('💥 Error starting timer:', error)
      setActiveTimer(null)
      alert('Erreur lors du démarrage du timer: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // Arrêter le timer
  const stopTimer = async () => {
    if (!activeTimer) return

    const endTime = new Date()
    const duration = Math.round((endTime.getTime() - activeTimer.startTime.getTime()) / 1000) // secondes

    try {
      console.log('🛑 Stopping timer, duration:', duration, 'seconds')
      
      if (activeTimer.entryId) {
        const response = await fetch(`/api/time-entries/${activeTimer.entryId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endTime: endTime.toISOString(),
            duration: duration,
            description: activeTimer.description
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update time entry')
        }

        console.log('✅ Timer stopped successfully')
      }

      setActiveTimer(null)
      setDescription('')
      setSelectedTask('')
      
      // Recharger les time entries
      if (projectId) {
        loadTimeEntries()
      } else {
        loadAllUserTimeEntries()
      }
    } catch (error) {
      console.error('💥 Error stopping timer:', error)
      alert('Erreur lors de l\'arrêt du timer: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // Mettre en pause le timer (arrêt simple pour l'instant)
  const pauseTimer = () => {
    if (activeTimer) {
      stopTimer()
    }
  }

  // Formater la durée en texte lisible
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs.toString().padStart(2, '0')}s`
    } else {
      return `${secs}s`
    }
  }

  // Formater les heures décimales
  const formatHours = (seconds: number) => {
    const hours = seconds / 3600
    return hours.toFixed(1)
  }

  // Calculer le total des heures travaillées
  const getTotalHours = () => {
    const totalSeconds = timeEntries.reduce((total, entry) => total + (entry.duration || 0), 0)
    return totalSeconds / 3600
  }

  // Calculer les heures par tâche
  const getTaskHours = (taskId: string) => {
    const taskSeconds = timeEntries
      .filter(entry => entry.taskId === taskId)
      .reduce((total, entry) => total + (entry.duration || 0), 0)
    return taskSeconds / 3600
  }

  // Calculer les heures de la semaine
  const getWeeklyHours = () => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const weeklySeconds = timeEntries
      .filter(entry => new Date(entry.startTime) > oneWeekAgo)
      .reduce((total, entry) => total + (entry.duration || 0), 0)
    return weeklySeconds / 3600
  }

  // Calculer les heures du mois
  const getMonthlyHours = () => {
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    const monthlySeconds = timeEntries
      .filter(entry => new Date(entry.startTime) > oneMonthAgo)
      .reduce((total, entry) => total + (entry.duration || 0), 0)
    return monthlySeconds / 3600
  }

  // Supprimer une entrée de temps
  const deleteTimeEntry = async (entryId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée de temps ?')) return

    try {
      const response = await fetch(`/api/time-entries/${entryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        if (projectId) {
          loadTimeEntries()
        } else {
          loadAllUserTimeEntries()
        }
      } else {
        throw new Error('Failed to delete time entry')
      }
    } catch (error) {
      console.error('Error deleting time entry:', error)
      alert('Erreur lors de la suppression')
    }
  }

  // Obtenir la tâche active
  const activeTask = activeTimer ? tasks.find(t => t.id === activeTimer.taskId) : null

  // Tâches disponibles pour le timer (exclure les tâches terminées)
  const availableTasks = tasks.filter(task => task.status !== 'done')

  return (
    <div className="space-y-6">
      {/* Avertissement si projectId manquant */}
      {!projectId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Attention</span>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            L'identifiant du projet n'est pas disponible. Le chargement des temps peut être limité.
          </p>
        </div>
      )}

      {/* Timer actif */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timer de travail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Formulaire de configuration du timer */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Tâche *
                </label>
                <Select 
                  value={selectedTask} 
                  onValueChange={setSelectedTask}
                  disabled={!!activeTimer}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une tâche" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTasks.map(task => (
                      <SelectItem key={task.id} value={task.id}>
                        <div className="flex items-center gap-2">
                          <span className="truncate">{task.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {task.status === 'in_progress' ? 'En cours' : 
                             task.status === 'review' ? 'En revue' : 
                             task.status === 'todo' ? 'À faire' : task.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                    {availableTasks.length === 0 && (
                      <div className="px-3 py-2 text-sm text-slate-500">
                        Aucune tâche disponible
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Description du travail
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez le travail effectué..."
                  rows={2}
                  disabled={!!activeTimer}
                />
              </div>
            </div>

            {/* Contrôles du timer */}
            <div className="flex flex-col gap-3 justify-center">
              {!activeTimer ? (
                <Button
                  onClick={startTimer}
                  disabled={!selectedTask || availableTasks.length === 0}
                  className="gap-2 bg-green-600 hover:bg-green-700 min-w-[120px]"
                >
                  <Play className="h-4 w-4" />
                  Démarrer
                </Button>
              ) : (
                <>
                  <Button
                    onClick={stopTimer}
                    className="gap-2 bg-red-600 hover:bg-red-700 min-w-[120px]"
                  >
                    <StopCircle className="h-4 w-4" />
                    Arrêter
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={pauseTimer}
                    className="gap-2 min-w-[120px]"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Affichage du timer actif */}
          {activeTimer && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <p className="font-semibold text-blue-900 text-lg">
                      ⏱️ Timer en cours
                    </p>
                  </div>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p><strong>📋 Tâche:</strong> {activeTask?.title || 'Tâche inconnue'}</p>
                    <p><strong>🕐 Débuté à:</strong> {activeTimer.startTime.toLocaleTimeString('fr-FR')}</p>
                    <p><strong>📅 Date:</strong> {activeTimer.startTime.toLocaleDateString('fr-FR')}</p>
                    {activeTimer.description && activeTimer.description !== 'Travail en cours' && (
                      <p><strong>📝 Description:</strong> {activeTimer.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 bg-white px-6 py-3 rounded-lg border-2 border-blue-300 shadow-sm">
                  {formatDuration(elapsedTime)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{getTotalHours().toFixed(1)}h</div>
              <p className="text-sm text-slate-600">Total projet</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">{getWeeklyHours().toFixed(1)}h</div>
              <p className="text-sm text-blue-600">Cette semaine</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-900">
                {timeEntries.filter(e => e.billable).length}
              </div>
              <p className="text-sm text-green-600">Sessions</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-900">
                {new Set(timeEntries.map(e => new Date(e.startTime).toDateString())).size}
              </div>
              <p className="text-sm text-purple-600">Jours travaillés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Temps par tâche */}
      {tasks.filter(task => getTaskHours(task.id) > 0).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Répartition du temps par tâche</CardTitle>
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
                    <div key={task.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{task.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {taskHours.toFixed(1)}h
                          </Badge>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>{percentage.toFixed(1)}% du temps total</span>
                          <span>{task.status === 'done' ? '✅ Terminée' : '🟡 En cours'}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              }
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historique des temps */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Historique du temps</CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              {timeEntries.length} entrée(s) de temps enregistrée(s)
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadTimeEntries}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Chargement...' : 'Actualiser'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date et heure</TableHead>
                <TableHead>Tâche</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Facturable</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeEntries.map(entry => {
                const task = tasks.find(t => t.id === entry.taskId)
                const durationHours = (entry.duration || 0) / 3600
                const startDate = new Date(entry.startTime)
                
                return (
                  <TableRow key={entry.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {startDate.toLocaleDateString('fr-FR')}
                        </span>
                        <span className="text-xs text-slate-500">
                          {startDate.toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {task?.title || 'Tâche inconnue'}
                        {task && (
                          <Badge variant="outline" className="text-xs">
                            {task.status}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="truncate" title={entry.description}>
                        {entry.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
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
                        title="Supprimer cette entrée"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              
              {timeEntries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    <Clock className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">Aucun temps enregistré</p>
                    <p className="text-sm mb-4">Commencez par démarrer un timer pour tracker votre temps de travail.</p>
                    <Button 
                      onClick={loadTimeEntries} 
                      variant="outline"
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Recharger
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}