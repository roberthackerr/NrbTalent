"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
  FileEdit,
  Sparkles,
  Crown,
  Activity,
  CheckCircle2,
  Circle,
  Loader2,
  Sun,
  Moon,
  LayoutGrid,
  ListTodo,
  Timer,
  LineChart,
  UserPlus,
  MessageSquare as MessageSquareIcon,
  FolderOpen,
  Palette,
  Terminal,
  Github,
  Twitter,
  Linkedin,
  Globe,
  Mail,
  Phone,
  MapPin,
  Star,
  Award,
  TrendingUp,
  Shield,
  Heart,
  Bell,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
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

type WorkspaceTool = 'kanban' | 'timeline' | 'time' | 'analytics' | 'team' | 'chat' | 'files' | 'whiteboard' | 'code' | 'video'

interface ToolConfig {
  id: WorkspaceTool
  label: string
  icon: any
  description: string
  color: string
  gradient: string
}

const tools: ToolConfig[] = [
  { id: 'kanban', label: 'Tableau', icon: Kanban, description: 'Gestion visuelle des tâches', color: 'text-blue-500', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'timeline', label: 'Planning', icon: Calendar, description: 'Calendrier et échéances', color: 'text-purple-500', gradient: 'from-purple-500 to-pink-500' },
  { id: 'time', label: 'Temps', icon: Clock, description: 'Suivi du temps', color: 'text-green-500', gradient: 'from-green-500 to-emerald-500' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Statistiques avancées', color: 'text-orange-500', gradient: 'from-orange-500 to-red-500' },
  { id: 'team', label: 'Équipe', icon: Users, description: 'Collaborateurs', color: 'text-indigo-500', gradient: 'from-indigo-500 to-purple-500' },
  { id: 'chat', label: 'Chat', icon: MessageCircle, description: 'Communication en temps réel', color: 'text-pink-500', gradient: 'from-pink-500 to-rose-500' },
  { id: 'files', label: 'Fichiers', icon: FolderOpen, description: 'Documents partagés', color: 'text-amber-500', gradient: 'from-amber-500 to-orange-500' },
  { id: 'whiteboard', label: 'Tableau blanc', icon: Palette, description: 'Brainstorming visuel', color: 'text-teal-500', gradient: 'from-teal-500 to-cyan-500' },
  { id: 'code', label: 'Code', icon: Terminal, description: 'IDE collaboratif', color: 'text-gray-500', gradient: 'from-gray-500 to-slate-500' }
]

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const { 
    joinWorkspace, 
    leaveWorkspace, 
    isConnected,
    activeUsers,
    sendMessage 
  } = useWorkspace()

  const kanbanBoardRef = useRef<{ openNewTaskDialog: () => void }>()
  const projectId = params.id as string

  useEffect(() => {
    if (projectId && session?.user?.id) {
      joinWorkspace(projectId, session.user.id)
      return () => leaveWorkspace()
    }
  }, [projectId, session?.user?.id])

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

  const handleTasksUpdate = (updatedTasks: Task[]) => {
    setTasks(updatedTasks)
    calculateStats(updatedTasks)
  }

  const handleNewTask = () => {
    if (activeTab === 'kanban' && kanbanBoardRef.current) {
      kanbanBoardRef.current.openNewTaskDialog()
    } else {
      setActiveTab('kanban')
      setTimeout(() => kanbanBoardRef.current?.openNewTaskDialog(), 100)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 blur-2xl opacity-20 animate-pulse rounded-full"></div>
            <Loader2 className="h-16 w-16 text-purple-600 dark:text-purple-400 animate-spin relative z-10" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chargement de l'espace de travail</h3>
          <p className="text-gray-600 dark:text-gray-400">Préparation de votre environnement collaboratif...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 text-center border-purple-200 dark:border-gray-700 shadow-xl">
          <CardContent className="pt-6">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Projet non trouvé</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Le projet que vous recherchez n'existe pas ou vous n'y avez pas accès.</p>
            <Button onClick={loadProjectData} className="bg-gradient-to-r from-purple-600 to-pink-600">
              <Loader2 className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentTool = tools.find(t => t.id === activeTab) || tools[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20">
      {/* Header Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-900 dark:via-pink-900 dark:to-blue-900">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent"></div>
        
        <div className="relative container mx-auto px-4 py-8 lg:py-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse shadow-lg shadow-green-500/50' : 'bg-gray-400'}`}></div>
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                    {isConnected ? 'Connecté' : 'Hors ligne'}
                  </Badge>
                </div>
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 capitalize">
                  {project.status}
                </Badge>
              </div>
              
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">{project.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4" />
                  <span>
                    {onlineUsers.length > 0 ? (
                      <>
                        <span className="font-medium text-white">{onlineUsers.length} en ligne</span>
                        <span className="ml-1">
                          ({onlineUsers.slice(0, 3).join(', ')} {onlineUsers.length > 3 ? `+${onlineUsers.length - 3}` : ''})
                        </span>
                      </>
                    ) : 'Aucun utilisateur en ligne'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Échéance: {new Date(project.deadline).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{stats.totalTasks} tâches • {stats.completedTasks} terminées</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={toggleFullscreen}
                      variant="outline" 
                      size="sm"
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                    >
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Plein écran</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button 
                onClick={handleNewTask}
                size="sm"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle tâche
              </Button>
            </div>
          </div>

          {/* Progress Section */}
          <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">Progression globale</span>
              <span className="text-sm font-medium text-white">{Math.round(stats.progress)}%</span>
            </div>
            <Progress value={stats.progress} className="h-2 bg-white/20" />
            <div className="flex justify-between text-xs text-white/70 mt-2">
              <span>{stats.completedTasks}/{stats.totalTasks} tâches</span>
              {stats.overdueTasks > 0 && (
                <span className="text-amber-300">{stats.overdueTasks} en retard</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-8 text-white dark:text-gray-950">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="currentColor"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="currentColor"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="currentColor"></path>
          </svg>
        </div>
      </div>

      {/* Workspace Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <motion.div 
            initial={{ width: isSidebarCollapsed ? 80 : 280 }}
            animate={{ width: isSidebarCollapsed ? 80 : 280 }}
            className="flex-shrink-0 transition-all duration-300"
          >
            <Card className="sticky top-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-purple-200 dark:border-gray-700 shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  {!isSidebarCollapsed && (
                    <h3 className="font-semibold text-gray-900 dark:text-white">Outils</h3>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="h-8 w-8 p-0"
                  >
                    {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {tools.map((tool) => {
                    const Icon = tool.icon
                    const isActive = activeTab === tool.id
                    return (
                      <motion.button
                        key={tool.id}
                        onClick={() => setActiveTab(tool.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                          isActive 
                            ? `bg-gradient-to-r ${tool.gradient} text-white shadow-md` 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className={`h-5 w-5 ${isActive ? 'text-white' : tool.color}`} />
                        {!isSidebarCollapsed && (
                          <div className="flex-1 text-left">
                            <span className="text-sm font-medium">{tool.label}</span>
                            {!isSidebarCollapsed && (
                              <p className="text-xs opacity-75">{tool.description}</p>
                            )}
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                {!isSidebarCollapsed && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 ring-2 ring-purple-500">
                        <AvatarImage src={session?.user?.image || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                          {session?.user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {session?.user?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {session?.user?.role === 'freelance' ? 'Freelance' : 'Client'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Tool Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 bg-gradient-to-r ${currentTool.gradient} rounded-xl shadow-lg`}>
                      {(() => {
                        const Icon = currentTool.icon
                        return <Icon className="h-5 w-5 text-white" />
                      })()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                        {currentTool.label}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">{currentTool.description}</p>
                    </div>
                  </div>
                </div>

                {/* Tool Content */}
                {activeTab === 'kanban' && (
                  <KanbanBoard 
                    ref={kanbanBoardRef}
                    project={project}
                    tasks={tasks}
                    onTasksUpdate={handleTasksUpdate}
                  />
                )}
                {activeTab === 'timeline' && (
                  <ProjectTimeline project={project} tasks={tasks} />
                )}
                {activeTab === 'time' && (
                  <TimeTracker project={project} tasks={tasks} />
                )}
                {activeTab === 'analytics' && (
                  <ProjectAnalytics project={project} tasks={tasks} stats={stats} />
                )}
                {activeTab === 'team' && (
                  <TeamMembers project={project} tasks={tasks} />
                )}
                {activeTab === 'chat' && (
                  <WorkspaceChat 
                    projectId={projectId}
                    userId={session?.user?.id || ''}
                    userName={session?.user?.name || 'Utilisateur'}
                    onUnreadCountChange={setUnreadMessages}
                  />
                )}
                {activeTab === 'files' && (
                  <FileCollaborator 
                    projectId={projectId}
                    userId={session?.user?.id || ''}
                  />
                )}
                {activeTab === 'whiteboard' && (
                  <Whiteboard 
                    projectId={projectId}
                    userId={session?.user?.id || ''}
                    userName={session?.user?.name || 'Utilisateur'}
                  />
                )}
                {activeTab === 'code' && (
                  <ProfessionalVSCode />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="rounded-full p-4 shadow-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="lg"
              >
                <Video className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Démarrer un appel vidéo</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}