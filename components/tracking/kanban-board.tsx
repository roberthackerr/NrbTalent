"use client"

import { useState, forwardRef, useImperativeHandle } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus,
  MoreVertical,
  Clock,
  Flag,
  MessageSquare,
  Paperclip,
  Calendar,
  Edit,
  Trash2,
  GripVertical
} from 'lucide-react'
import { Project, Task, TaskStatus, TaskPriority } from '@/lib/tracking/types'
import { cn } from '@/lib/utils'

interface KanbanBoardProps {
  project: Project
  tasks: Task[]
  onTasksUpdate: (tasks: Task[]) => void
}

export interface KanbanBoardRef {
  openNewTaskDialog: () => void
}

const statusColumns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog', color: 'bg-slate-100 border-slate-300' },
  { id: 'todo', title: 'À faire', color: 'bg-blue-100 border-blue-300' },
  { id: 'in_progress', title: 'En cours', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'review', title: 'En revue', color: 'bg-purple-100 border-purple-300' },
  { id: 'done', title: 'Terminé', color: 'bg-green-100 border-green-300' },
]

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

const priorityIcons = {
  low: <Flag className="h-3 w-3 text-green-600" />,
  medium: <Flag className="h-3 w-3 text-blue-600" />,
  high: <Flag className="h-3 w-3 text-orange-600" />,
  urgent: <Flag className="h-3 w-3 text-red-600" />
}

export const KanbanBoard = forwardRef<KanbanBoardRef, KanbanBoardProps>(
  ({ project, tasks, onTasksUpdate }, ref) => {
    const [activeTask, setActiveTask] = useState<Task | null>(null)
    const [newTaskDialog, setNewTaskDialog] = useState(false)
    const [editTaskDialog, setEditTaskDialog] = useState(false)
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)

    useImperativeHandle(ref, () => ({
      openNewTaskDialog: () => {
        setNewTaskDialog(true)
      }
    }))

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 8, // Commence le drag après 8px de mouvement
        }
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    )

    const handleDragStart = (event: DragStartEvent) => {
      const task = tasks.find(t => t.id === event.active.id)
      if (task) {
        setActiveTask(task)
      }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
      const { active, over } = event
      
      setActiveTask(null)

      if (!over) {
        console.log('No drop target')
        return
      }

      const taskId = active.id as string
      const newStatus = over.id as TaskStatus

      // Vérifier si c'est un changement de statut valide
      if (!statusColumns.find(col => col.id === newStatus)) {
        console.log('Invalid drop target:', newStatus)
        return
      }

      const taskToMove = tasks.find(t => t.id === taskId)
      
      if (!taskToMove) {
        console.log('Task not found:', taskId)
        return
      }

      if (taskToMove.status === newStatus) {
        console.log('Same status, no change needed')
        return
      }

      console.log(`Moving task ${taskId} from ${taskToMove.status} to ${newStatus}`)

      // Mise à jour optimiste
      const updatedTasks = tasks.map(task =>
        task.id === taskId 
          ? { ...task, status: newStatus }
          : task
      )
      
      onTasksUpdate(updatedTasks)

      // Mise à jour sur le serveur
      try {
        await updateTaskStatus(taskId, newStatus)
      } catch (error) {
        console.error('Error updating task status:', error)
        // Revenir à l'état précédent en cas d'erreur
        onTasksUpdate(tasks)
        alert('Erreur lors de la mise à jour du statut')
      }
    }

    const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task status')
      }

      return response.json()
    }

    const getTasksByStatus = (status: TaskStatus) => {
      return tasks
        .filter(task => task.status === status)
        .sort((a, b) => (a.position || 0) - (b.position || 0))
    }

    const createNewTask = async (taskData: Partial<Task>) => {
      try {
        const projectId = project.id || (project as any)._id
        
        if (!projectId) {
          throw new Error('Project ID is not available')
        }

        const requestBody = {
          title: taskData.title || '',
          description: taskData.description || '',
          status: taskData.status || 'todo',
          priority: taskData.priority || 'medium',
          estimatedHours: taskData.estimatedHours || 0,
          dueDate: taskData.dueDate || null,
          projectId: projectId
        }

        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        const responseData = await response.json()

        if (response.ok) {
          onTasksUpdate([...tasks, responseData])
          setNewTaskDialog(false)
        } else {
          throw new Error(responseData.error || 'Failed to create task')
        }
      } catch (error) {
        console.error('Error creating task:', error)
        alert('Erreur lors de la création de la tâche: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
    }

    const updateTask = async (taskData: Partial<Task>) => {
      if (!taskToEdit) return

      try {
        const response = await fetch(`/api/tasks/${taskToEdit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData)
        })

        const responseData = await response.json()

        if (response.ok) {
          const updatedTasks = tasks.map(t => 
            t.id === taskToEdit.id ? { ...t, ...responseData } : t
          )
          onTasksUpdate(updatedTasks)
          setEditTaskDialog(false)
          setTaskToEdit(null)
        } else {
          throw new Error(responseData.error || 'Failed to update task')
        }
      } catch (error) {
        console.error('Error updating task:', error)
        alert('Erreur lors de la mise à jour de la tâche')
      }
    }

    const handleEdit = (task: Task) => {
      setTaskToEdit(task)
      setEditTaskDialog(true)
    }

    const handleDelete = async (taskId: string) => {
      if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return

      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          onTasksUpdate(tasks.filter(t => t.id !== taskId))
        } else {
          throw new Error('Failed to delete task')
        }
      } catch (error) {
        console.error('Error deleting task:', error)
        alert('Erreur lors de la suppression de la tâche')
      }
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Tableau Kanban</h2>
            <p className="text-slate-600">Glissez-déposez les tâches entre les colonnes</p>
          </div>
          
          <Dialog open={newTaskDialog} onOpenChange={setNewTaskDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Nouvelle tâche
              </Button>
            </DialogTrigger>
            <TaskFormDialog 
              onSubmit={createNewTask}
              projectId={project.id || (project as any)._id}
              isOpen={newTaskDialog}
              onClose={() => setNewTaskDialog(false)}
            />
          </Dialog>

          <Dialog open={editTaskDialog} onOpenChange={setEditTaskDialog}>
            {taskToEdit && (
              <TaskFormDialog 
                onSubmit={updateTask}
                projectId={project.id || (project as any)._id}
                isOpen={editTaskDialog}
                onClose={() => {
                  setEditTaskDialog(false)
                  setTaskToEdit(null)
                }}
                initialData={taskToEdit}
                isEdit
              />
            )}
          </Dialog>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {statusColumns.map(column => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={getTasksByStatus(column.id)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <TaskCard task={activeTask} isDragging onEdit={() => {}} onDelete={() => {}} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    )
  }
)

KanbanBoard.displayName = 'KanbanBoard'

// CORRECTION MAJEURE : KanbanColumn avec useDroppable
function KanbanColumn({ 
  column, 
  tasks,
  onEdit,
  onDelete 
}: { 
  column: any
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}) {
  // IMPORTANT : Rendre la colonne "droppable"
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  const taskIds = tasks.map(task => task.id).filter(Boolean)

  return (
    <Card 
      ref={setNodeRef}
      className={cn(
        "min-h-[600px] transition-colors",
        column.color,
        isOver && "ring-2 ring-blue-400 ring-offset-2"
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span>{column.title}</span>
          <Badge variant="secondary" className="bg-white/50">
            {tasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            task.id ? (
              <SortableTaskCard 
                key={task.id} 
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ) : null
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">Aucune tâche</p>
            <p className="text-xs mt-1">Glissez une tâche ici</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SortableTaskCard({ 
  task,
  onEdit,
  onDelete
}: { 
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  if (!task.id) return null

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard 
        task={task} 
        isDragging={isDragging}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}

function TaskCard({ 
  task, 
  isDragging,
  onEdit,
  onDelete
}: { 
  task: Task
  isDragging?: boolean
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}) {
  return (
    <Card className={cn(
      "cursor-grab active:cursor-grabbing bg-white shadow-sm hover:shadow-md transition-all",
      isDragging && "shadow-xl scale-105"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <GripVertical className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <Badge className={cn("text-xs", priorityColors[task.priority])}>
              {priorityIcons[task.priority]}
              {task.priority === 'low' ? 'Basse' : 
               task.priority === 'medium' ? 'Moyenne' :
               task.priority === 'high' ? 'Haute' : 'Urgente'}
            </Badge>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onEdit(task)
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600" 
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(task.id)
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h4 className="font-medium text-slate-900 mb-2 line-clamp-2">{task.title}</h4>
        {task.description && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{task.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString('fr-FR')}
              </div>
            )}
            
            {task.estimatedHours > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {task.estimatedHours}h
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {task.attachments && task.attachments.length > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                {task.attachments.length}
              </div>
            )}
            
            {task.comments && task.comments.length > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {task.comments.length}
              </div>
            )}
          </div>
        </div>

        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.labels.slice(0, 3).map((label, index) => (
              <Badge key={index} variant="outline" className="text-xs bg-slate-100">
                {label}
              </Badge>
            ))}
            {task.labels.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{task.labels.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TaskFormDialog({ 
  onSubmit, 
  projectId,
  isOpen,
  onClose,
  initialData,
  isEdit = false
}: { 
  onSubmit: (task: Partial<Task>) => void
  projectId: string
  isOpen: boolean
  onClose: () => void
  initialData?: Task
  isEdit?: boolean
}) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: (initialData?.priority || 'medium') as TaskPriority,
    status: (initialData?.status || 'todo') as TaskStatus,
    estimatedHours: initialData?.estimatedHours || 0,
    dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert('Le titre est requis')
      return
    }
    
    onSubmit({
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined
    })
    
    if (!isEdit) {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        estimatedHours: 0,
        dueDate: ''
      })
    }
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Modifier la tâche' : 'Nouvelle tâche'}</DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Titre *</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Titre de la tâche..."
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Description</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Description détaillée de la tâche..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Statut</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as TaskStatus }))}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="backlog">Backlog</option>
              <option value="todo">À faire</option>
              <option value="in_progress">En cours</option>
              <option value="review">En revue</option>
              <option value="done">Terminé</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Priorité</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Heures estimées</label>
            <Input
              type="number"
              value={formData.estimatedHours}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 0 }))}
              min="0"
              step="0.5"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Date d'échéance</label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            {isEdit ? 'Mettre à jour' : 'Créer la tâche'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}