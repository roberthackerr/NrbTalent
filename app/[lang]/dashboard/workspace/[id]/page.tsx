"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Plus,
  Upload,
  Video,
  CalendarIcon,
  MessageSquare,
  Download,
  LinkIcon,
} from "lucide-react"
import { toast } from "sonner"

export default function WorkspacePage() {
  const { data: session } = useSession()
  const params = useParams()
  const projectId = params.id as string

  const [workspace, setWorkspace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignedTo: "",
    dueDate: "",
  })
  const [newMilestone, setNewMilestone] = useState({ title: "", description: "", amount: 0, dueDate: "" })
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [newComment, setNewComment] = useState("")
  const [newEvent, setNewEvent] = useState({ title: "", description: "", startDate: "", endDate: "", type: "meeting" })
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  useEffect(() => {
    fetchWorkspace()
  }, [projectId])

  const fetchWorkspace = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/workspace`)
      const data = await res.json()
      setWorkspace(data)
    } catch (error) {
      console.error("Failed to fetch workspace:", error)
    } finally {
      setLoading(false)
    }
  }

  const addTask = async () => {
    if (!newTask.title) {
      toast.error("Le titre est requis")
      return
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_task", data: newTask }),
      })

      if (res.ok) {
        setNewTask({ title: "", description: "", priority: "medium", assignedTo: "", dueDate: "" })
        fetchWorkspace()
        toast.success("Tâche créée avec succès")
      }
    } catch (error) {
      console.error("Failed to add task:", error)
      toast.error("Erreur lors de la création de la tâche")
    }
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await fetch(`/api/projects/${projectId}/workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_task", data: { taskId, updates: { status } } }),
      })
      fetchWorkspace()
      toast.success("Statut mis à jour")
    } catch (error) {
      console.error("Failed to update task:", error)
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const addMilestone = async () => {
    if (!newMilestone.title || !newMilestone.amount) {
      toast.error("Titre et montant requis")
      return
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_milestone", data: newMilestone }),
      })

      if (res.ok) {
        setNewMilestone({ title: "", description: "", amount: 0, dueDate: "" })
        fetchWorkspace()
        toast.success("Jalon créé avec succès")
      }
    } catch (error) {
      console.error("Failed to add milestone:", error)
      toast.error("Erreur lors de la création du jalon")
    }
  }

  const addComment = async () => {
    if (!newComment.trim() || !selectedTask) return

    try {
      const res = await fetch(`/api/projects/${projectId}/workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_comment",
          data: { taskId: selectedTask.id, content: newComment },
        }),
      })

      if (res.ok) {
        setNewComment("")
        fetchWorkspace()
        toast.success("Commentaire ajouté")
      }
    } catch (error) {
      console.error("Failed to add comment:", error)
      toast.error("Erreur lors de l'ajout du commentaire")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // In production, upload to cloud storage (S3, Cloudinary, etc.)
    // For now, we'll simulate the upload
    const fileData = {
      name: file.name,
      url: URL.createObjectURL(file), // In production, this would be the cloud URL
      size: file.size,
      type: file.type,
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upload_file", data: fileData }),
      })

      if (res.ok) {
        fetchWorkspace()
        toast.success("Fichier uploadé avec succès")
      }
    } catch (error) {
      console.error("Failed to upload file:", error)
      toast.error("Erreur lors de l'upload")
    }
  }

  const addEvent = async () => {
    if (!newEvent.title || !newEvent.startDate) {
      toast.error("Titre et date de début requis")
      return
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_event", data: newEvent }),
      })

      if (res.ok) {
        setNewEvent({ title: "", description: "", startDate: "", endDate: "", type: "meeting" })
        fetchWorkspace()
        toast.success("Événement créé avec succès")
      }
    } catch (error) {
      console.error("Failed to add event:", error)
      toast.error("Erreur lors de la création de l'événement")
    }
  }

  const syncGoogleCalendar = async () => {
    try {
      const res = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", events: workspace?.calendarEvents || [] }),
      })
      const data = await res.json()
      toast.success(data.message)
      if (data.note) toast.info(data.note)
    } catch (error) {
      toast.error("Erreur lors de la synchronisation")
    }
  }

  const syncOutlook = async () => {
    try {
      const res = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "outlook", events: workspace?.calendarEvents || [] }),
      })
      const data = await res.json()
      toast.success(data.message)
      if (data.note) toast.info(data.note)
    } catch (error) {
      toast.error("Erreur lors de la synchronisation")
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>
  }

  const statusColors = {
    todo: "bg-gray-500",
    in_progress: "bg-blue-500",
    review: "bg-yellow-500",
    done: "bg-green-500",
  }

  const priorityColors = {
    low: "text-green-500",
    medium: "text-yellow-500",
    high: "text-red-500",
  }

  const eventsForSelectedDate =
    workspace?.calendarEvents?.filter((event: any) => {
      const eventDate = new Date(event.startDate)
      return (
        selectedDate &&
        eventDate.getDate() === selectedDate.getDate() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getFullYear() === selectedDate.getFullYear()
      )
    }) || []

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Espace de travail collaboratif</h1>
          <Button variant="outline">
            <Video className="w-4 h-4 mr-2" />
            Démarrer un appel vidéo
          </Button>
        </div>

        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tasks">Tâches</TabsTrigger>
            <TabsTrigger value="milestones">Jalons</TabsTrigger>
            <TabsTrigger value="files">Fichiers</TabsTrigger>
            <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Gestion des tâches</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle tâche
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer une nouvelle tâche</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Titre de la tâche"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    />
                    <Textarea
                      placeholder="Description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                    <Select
                      value={newTask.priority}
                      onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Basse</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                    <Button onClick={addTask} className="w-full">
                      Créer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {["todo", "in_progress", "review", "done"].map((status) => (
                <div key={status} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${statusColors[status as keyof typeof statusColors]}`} />
                    <h3 className="font-semibold capitalize">
                      {status === "todo"
                        ? "À faire"
                        : status === "in_progress"
                          ? "En cours"
                          : status === "review"
                            ? "En révision"
                            : "Terminé"}
                    </h3>
                    <Badge variant="secondary">
                      {workspace?.tasks?.filter((t: any) => t.status === status).length || 0}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {workspace?.tasks
                      ?.filter((t: any) => t.status === status)
                      .map((task: any) => (
                        <Dialog key={task.id}>
                          <DialogTrigger asChild>
                            <Card
                              className="p-4 space-y-2 cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => setSelectedTask(task)}
                            >
                              <div className="flex items-start justify-between">
                                <h4 className="font-medium">{task.title}</h4>
                                <span
                                  className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors]}`}
                                >
                                  {task.priority === "high" ? "🔴" : task.priority === "medium" ? "🟡" : "🟢"}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                              <div className="flex items-center justify-between">
                                {task.dueDate && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </div>
                                )}
                                {task.comments && task.comments.length > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MessageSquare className="w-3 h-3" />
                                    {task.comments.length}
                                  </div>
                                )}
                              </div>
                              <Select value={task.status} onValueChange={(value) => updateTaskStatus(task.id, value)}>
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="todo">À faire</SelectItem>
                                  <SelectItem value="in_progress">En cours</SelectItem>
                                  <SelectItem value="review">En révision</SelectItem>
                                  <SelectItem value="done">Terminé</SelectItem>
                                </SelectContent>
                              </Select>
                            </Card>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{task.title}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-muted-foreground">{task.description}</p>

                              <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <MessageSquare className="w-4 h-4" />
                                  Commentaires ({task.comments?.length || 0})
                                </h4>
                                <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                                  {task.comments?.map((comment: any) => (
                                    <div key={comment.id} className="bg-muted p-3 rounded-lg">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-sm">{comment.userName}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(comment.createdAt).toLocaleString()}
                                        </span>
                                      </div>
                                      <p className="text-sm">{comment.content}</p>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <Textarea
                                    placeholder="Ajouter un commentaire..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="flex-1"
                                  />
                                  <Button onClick={addComment}>Envoyer</Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="milestones" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Jalons de paiement</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau jalon
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un nouveau jalon</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Titre du jalon"
                      value={newMilestone.title}
                      onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                    />
                    <Textarea
                      placeholder="Description"
                      value={newMilestone.description}
                      onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Montant (€)"
                      value={newMilestone.amount}
                      onChange={(e) => setNewMilestone({ ...newMilestone, amount: Number(e.target.value) })}
                    />
                    <Input
                      type="date"
                      value={newMilestone.dueDate}
                      onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                    />
                    <Button onClick={addMilestone} className="w-full">
                      Créer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {workspace?.milestones?.map((milestone: any, index: number) => (
                <Card key={index} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        {milestone.status === "completed" || milestone.status === "paid" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                        <h3 className="font-semibold text-lg">{milestone.title}</h3>
                        <Badge variant={milestone.status === "paid" ? "default" : "secondary"}>
                          {milestone.status === "pending"
                            ? "En attente"
                            : milestone.status === "in_progress"
                              ? "En cours"
                              : milestone.status === "completed"
                                ? "Complété"
                                : "Payé"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground ml-8">{milestone.description}</p>
                      <div className="flex items-center gap-4 ml-8 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {new Date(milestone.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{milestone.amount}€</div>
                      {milestone.status === "completed" && (
                        <Button size="sm" className="mt-2">
                          Payer
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Fichiers partagés</h2>
              <label htmlFor="file-upload">
                <Button asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Uploader un fichier
                  </span>
                </Button>
                <input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {workspace?.files?.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  Aucun fichier partagé pour le moment
                </div>
              ) : (
                workspace?.files?.map((file: any) => (
                  <Card key={file.id} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </div>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <Download className="w-3 h-3 mr-2" />
                      Télécharger
                    </Button>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Calendrier du projet</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={syncGoogleCalendar}>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Sync Google
                </Button>
                <Button variant="outline" size="sm" onClick={syncOutlook}>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Sync Outlook
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvel événement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Créer un événement</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Titre de l'événement"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      />
                      <Textarea
                        placeholder="Description"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      />
                      <Select
                        value={newEvent.type}
                        onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meeting">Réunion</SelectItem>
                          <SelectItem value="deadline">Deadline</SelectItem>
                          <SelectItem value="milestone">Jalon</SelectItem>
                          <SelectItem value="reminder">Rappel</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="datetime-local"
                        value={newEvent.startDate}
                        onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                      />
                      <Input
                        type="datetime-local"
                        value={newEvent.endDate}
                        onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                      />
                      <Button onClick={addEvent} className="w-full">
                        Créer
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Événements du {selectedDate?.toLocaleDateString()}</h3>
                <div className="space-y-3">
                  {eventsForSelectedDate.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Aucun événement pour cette date</p>
                  ) : (
                    eventsForSelectedDate.map((event: any) => (
                      <Card key={event.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">{event.title}</h4>
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(event.startDate).toLocaleTimeString()} -{" "}
                              {new Date(event.endDate).toLocaleTimeString()}
                            </div>
                          </div>
                          <Badge variant="outline">{event.type}</Badge>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Tous les événements à venir</h3>
              <div className="space-y-2">
                {workspace?.calendarEvents
                  ?.filter((event: any) => new Date(event.startDate) >= new Date())
                  ?.sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  ?.map((event: any) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">{new Date(event.startDate).toLocaleString()}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{event.type}</Badge>
                    </div>
                  ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
