"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Kanban,
  Calendar,
  BarChart3,
  Users,
  FileText,
  MessageSquare,
  Clock,
  Plus,
  Download,
  Share2,
  Settings,
  AlertTriangle,
  Video,
  Monitor,
  FileCode,
  PenTool,
  MessageCircle,
  Upload,
  Zap,
  Users as UsersIcon,
  FileEdit
} from 'lucide-react'
import { Project, Task, ProjectStats, TaskStatus } from '@/lib/tracking/types'
import { KanbanBoard } from '@/components/tracking/kanban-board'
import { ProjectTimeline } from '@/components/tracking/project-timeline'
import { TimeTracker } from '@/components/tracking/time-tracker'
import { ProjectAnalytics } from '@/components/tracking/project-analytics'
import { TeamMembers } from '@/components/tracking/team-members'
import { WorkspaceChat } from '@/components/workspace/workspace-chat'
import { FileCollaborator } from '@/components/workspace/file-collaborator'
import { Whiteboard } from '@/components/workspace/whiteboard'
import { ProfessionalVSCode } from "@/components/ide/professional-vscode"
import { useWorkspace } from '@/hooks/useWorkspace'

// New workspace tool types
type WorkspaceTool = 'kanban' | 'timeline' | 'time' | 'analytics' | 'team' | 'chat' | 'files' | 'whiteboard' | 'code' | 'video'

export default function ProjectTrackingPage() {
  const params = useParams()
  const { data: session } = useSession()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<ProjectStats>({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    totalHours: 0,
    progress: 0,
    teamMembers: 0
  })
  const [activeTab, setActiveTab] = useState<WorkspaceTool>('kanban')
  const [isLoading, setIsLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [unreadMessages, setUnreadMessages] = useState(0)
  
  // Workspace hooks
  const { 
    joinWorkspace, 
    leaveWorkspace, 
    isConnected,
    activeUsers,
    sendMessage 
  } = useWorkspace()

  // Refs
  const kanbanBoardRef = useRef<{ openNewTaskDialog: () => void }>()

  const projectId = params.id as string

  // Join workspace on component mount
  useEffect(() => {
    if (projectId && session?.user?.id) {
      joinWorkspace(projectId, session.user.id)
      
      return () => {
        leaveWorkspace()
      }
    }
  }, [projectId, session?.user?.id])

  // Update online users list
  useEffect(() => {
    setOnlineUsers(activeUsers.map(user => user.name))
  }, [activeUsers])

  useEffect(() => {
    loadProjectData()
  }, [projectId])

  const loadProjectData = async () => {
    try {
      setIsLoading(true)
      
      const [projectRes, tasksRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/tasks`)
      ])

      if (projectRes.ok && tasksRes.ok) {
        const projectData = await projectRes.json()
        const tasksData = await tasksRes.json()
        
        setProject(projectData)
        setTasks(tasksData)
        calculateStats(tasksData)
      }
    } catch (error) {
      console.error('Error loading project data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (tasks: Task[]) => {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(task => task.status === 'done').length
    const overdueTasks = tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
    ).length
    const totalHours = tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0)
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    setStats({
      totalTasks,
      completedTasks,
      overdueTasks,
      totalHours,
      progress,
      teamMembers: new Set(tasks.map(task => task.assigneeId)).size
    })
  }

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'on_hold': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: ProjectStatus) => {
    switch (status) {
      case 'planning': return 'En planification'
      case 'active': return 'En cours'
      case 'on_hold': return 'En pause'
      case 'completed': return 'Terminé'
      case 'cancelled': return 'Annulé'
      default: return 'Inconnu'
    }
  }

  const handleNewTask = () => {
    if (activeTab === 'kanban' && kanbanBoardRef.current) {
      kanbanBoardRef.current.openNewTaskDialog()
    } else {
      setActiveTab('kanban')
      setTimeout(() => {
        if (kanbanBoardRef.current) {
          kanbanBoardRef.current.openNewTaskDialog()
        }
      }, 100)
    }
  }

  const handleTasksUpdate = (updatedTasks: Task[]) => {
    setTasks(updatedTasks)
    calculateStats(updatedTasks)
  }

  const handleStartVideoCall = () => {
    // Integrate with your Agora video call
    window.open(`/projects/${projectId}/video-call`, '_blank')
  }

  const handleUploadFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        const formData = new FormData()
        Array.from(files).forEach(file => {
          formData.append('files', file)
        })
        
        try {
          const response = await fetch(`/api/projects/${projectId}/files`, {
            method: 'POST',
            body: formData
          })
          
          if (response.ok) {
            alert('Fichiers uploadés avec succès!')
            // Refresh file list if in files tab
            if (activeTab === 'files') {
              // Trigger file list refresh
            }
          }
        } catch (error) {
          console.error('Error uploading files:', error)
        }
      }
    }
    input.click()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement de l'espace de travail...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Projet non trouvé</h2>
          <p className="text-slate-600">Le projet que vous recherchez n'existe pas ou vous n'y avez pas accès.</p>
          <Button onClick={loadProjectData} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Enhanced Workspace Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`}></div>
                  <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
                </div>
                <Badge className={getStatusColor(project.status)}>
                  {getStatusText(project.status)}
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">
                    {onlineUsers.length > 0 ? (
                      <>
                        <span className="font-medium">{onlineUsers.length} en ligne</span>
                        <span className="text-slate-500 ml-1">
                          ({onlineUsers.slice(0, 3).join(', ')} {onlineUsers.length > 3 ? `+${onlineUsers.length - 3}` : ''})
                        </span>
                      </>
                    ) : (
                      'Aucun utilisateur en ligne'
                    )}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>Échéance: {new Date(project.deadline).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span>{stats.totalTasks} tâches • {stats.completedTasks} terminées</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Workspace Action Bar */}
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleStartVideoCall}
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <Video className="h-4 w-4" />
                Appel vidéo
              </Button>
              
              <Button 
                onClick={handleUploadFile}
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
              
              <Button 
                onClick={handleNewTask}
                variant="default" 
                size="sm"
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Nouvelle tâche
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Progression globale</span>
              <span className="text-sm font-medium text-slate-900">{Math.round(stats.progress)}%</span>
            </div>
            <Progress value={stats.progress} className="h-2" />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>{stats.completedTasks}/{stats.totalTasks} tâches</span>
              {stats.overdueTasks > 0 && (
                <span className="text-red-600">{stats.overdueTasks} en retard</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Workspace Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as WorkspaceTool)} className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <TabsList className="inline-flex flex-wrap h-auto bg-slate-100 p-1 rounded-lg">
              <TabsTrigger value="kanban" className="flex items-center gap-2">
                <Kanban className="h-4 w-4" />
                Tableau
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Planning
              </TabsTrigger>
              <TabsTrigger value="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Temps
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Équipe
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Chat {unreadMessages > 0 && (
                  <Badge className="h-5 w-5 p-0 bg-red-500 text-white">
                    {unreadMessages}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-2">
                <FileEdit className="h-4 w-4" />
                Fichiers
              </TabsTrigger>
              <TabsTrigger value="whiteboard" className="flex items-center gap-2">
                <PenTool className="h-4 w-4" />
                Whiteboard
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                Code
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Zap className="h-4 w-4" />
              <span>Espace de travail collaboratif en temps réel</span>
            </div>
          </div>

          {/* Kanban Tab */}
          <TabsContent value="kanban" className="space-y-6">
            <KanbanBoard 
              ref={kanbanBoardRef}
              project={project}
              tasks={tasks}
              onTasksUpdate={handleTasksUpdate}
            />
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <ProjectTimeline 
              project={project}
              tasks={tasks}
            />
          </TabsContent>

          {/* Time Tracking Tab */}
          <TabsContent value="time" className="space-y-6">
            <TimeTracker 
              project={project}
              tasks={tasks}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <ProjectAnalytics 
              project={project}
              tasks={tasks}
              stats={stats}
            />
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <TeamMembers 
              project={project}
              tasks={tasks}
            />
          </TabsContent>

          {/* NEW: Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <WorkspaceChat 
              projectId={projectId}
              userId={session?.user?.id || ''}
              userName={session?.user?.name || 'Utilisateur'}
              onUnreadCountChange={setUnreadMessages}
            />
          </TabsContent>

          {/* NEW: Files Tab */}
          <TabsContent value="files" className="space-y-6">
            <FileCollaborator 
              projectId={projectId}
              userId={session?.user?.id || ''}
            />
          </TabsContent>

          {/* NEW: Whiteboard Tab */}
          <TabsContent value="whiteboard" className="space-y-6">
            <Whiteboard 
              projectId={projectId}
              userId={session?.user?.id || ''}
              userName={session?.user?.name || 'Utilisateur'}
            />
          </TabsContent>

          {/* NEW: Code Editor Tab */}
          <TabsContent value="code" className="space-y-6">
            <ProfessionalVSCode 
            //  projectId={projectId}
              // userId={session?.user?.id || ''}
              // userName={session?.user?.name || 'Utilisateur'}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Button for quick video call */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={handleStartVideoCall}
          className="rounded-full p-4 shadow-lg bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          <Video className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}