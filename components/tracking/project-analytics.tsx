// components/tracking/project-analytics.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Project, Task, ProjectStats } from '@/lib/tracking/types'
import { TrendingUp, Users, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface ProjectAnalyticsProps {
  project: Project
  tasks: Task[]
  stats: ProjectStats
}

export function ProjectAnalytics({ project, tasks, stats }: ProjectAnalyticsProps) {
  // Données pour le graphique des tâches par statut
  const statusData = [
    { name: 'Backlog', value: tasks.filter(t => t.status === 'backlog').length, color: '#64748b' },
    { name: 'À faire', value: tasks.filter(t => t.status === 'todo').length, color: '#3b82f6' },
    { name: 'En cours', value: tasks.filter(t => t.status === 'in_progress').length, color: '#f59e0b' },
    { name: 'En revue', value: tasks.filter(t => t.status === 'review').length, color: '#8b5cf6' },
    { name: 'Terminé', value: tasks.filter(t => t.status === 'done').length, color: '#10b981' },
  ]

  // Données pour le graphique des priorités
  const priorityData = [
    { name: 'Basse', value: tasks.filter(t => t.priority === 'low').length, color: '#10b981' },
    { name: 'Moyenne', value: tasks.filter(t => t.priority === 'medium').length, color: '#3b82f6' },
    { name: 'Haute', value: tasks.filter(t => t.priority === 'high').length, color: '#f59e0b' },
    { name: 'Urgente', value: tasks.filter(t => t.priority === 'urgent').length, color: '#ef4444' },
  ]

  // Tâches en retard
  const overdueTasks = tasks.filter(task => 
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
  )

  // Charge de travail par assigné
  const workloadData = tasks.reduce((acc, task) => {
    if (!acc[task.assigneeId]) {
      acc[task.assigneeId] = { assigned: 0, completed: 0 }
    }
    acc[task.assigneeId].assigned++
    if (task.status === 'done') {
      acc[task.assigneeId].completed++
    }
    return acc
  }, {} as Record<string, { assigned: number; completed: number }>)

  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Progression</p>
                <p className="text-2xl font-bold text-slate-900">{Math.round(stats.progress)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <Progress value={stats.progress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Tâches terminées</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.completedTasks}/{stats.totalTasks}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Tâches en retard</p>
                <p className="text-2xl font-bold text-slate-900">{stats.overdueTasks}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.totalTasks > 0 ? Math.round((stats.overdueTasks / stats.totalTasks) * 100) : 0}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Heures totales</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalHours}h</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Temps passé sur le projet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tâches par statut */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tâches par priorité */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par priorité</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tâches en retard */}
      {overdueTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Tâches en retard ({overdueTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-red-900">{task.title}</p>
                    <p className="text-sm text-red-700">
                      Échéance: {new Date(task.dueDate!).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {task.priority === 'urgent' ? 'Urgent' : 'En retard'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}