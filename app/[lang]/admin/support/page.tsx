// app/[lang]/admin/support/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Flag,
  MessageSquare,
  Users,
  FileText,
  Loader2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Tag,
  Star,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react'
import { Locale } from '@/lib/i18n'

// Types
interface FAQ {
  _id: string
  question: string
  answer: string
  category: string
  order: number
  helpful: number
  notHelpful: number
  active: boolean
  createdAt: string
  updatedAt: string
}

interface ProblemReport {
  _id: string
  userId: string
  user: {
    name: string
    email: string
    role: string
  }
  type: 'bug' | 'feature' | 'performance' | 'security' | 'usability' | 'other'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  steps?: string
  expectedBehavior?: string
  actualBehavior?: string
  browser?: string
  os?: string
  screenshots: string[]
  status: 'pending' | 'reviewing' | 'in_progress' | 'resolved' | 'rejected'
  assignedTo?: string
  resolvedAt?: string
  resolution?: string
  createdAt: string
  updatedAt: string
}

interface SupportTicket {
  _id: string
  ticketId: string
  userId: string
  user: {
    name: string
    email: string
    role: string
  }
  subject: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  description: string
  messages: any[]
  createdAt: string
  updatedAt: string
}

// Composant de formulaire FAQ
function FAQForm({ faq, onSave, onCancel }: { 
  faq?: FAQ, 
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    question: faq?.question || '',
    answer: faq?.answer || '',
    category: faq?.category || 'account',
    order: faq?.order || 0,
    active: faq?.active !== false
  })

  const categories = [
    { value: 'account', label: 'Compte' },
    { value: 'payment', label: 'Paiement' },
    { value: 'project', label: 'Projet' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'client', label: 'Client' },
    { value: 'technical', label: 'Technique' },
    { value: 'billing', label: 'Facturation' },
    { value: 'other', label: 'Autre' }
  ]

  return (
    <div className="space-y-4">
      <div>
        <Label>Question *</Label>
        <Input
          value={formData.question}
          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          placeholder="Ex: Comment créer un compte ?"
          className="mt-1"
        />
      </div>

      <div>
        <Label>Réponse *</Label>
        <Textarea
          value={formData.answer}
          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
          placeholder="Réponse détaillée..."
          rows={5}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Catégorie</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Ordre d'affichage</Label>
          <Input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="active"
          checked={formData.active}
          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
          className="rounded border-slate-300"
        />
        <Label htmlFor="active" className="text-sm font-normal">FAQ active et visible</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button onClick={() => onSave(formData)}>Enregistrer</Button>
      </div>
    </div>
  )
}

// Composant de détail du signalement
function ReportDetail({ report, onUpdateStatus, onClose }: { 
  report: ProblemReport, 
  onUpdateStatus: (id: string, status: string, resolution?: string) => void,
  onClose: () => void 
}) {
  const [resolution, setResolution] = useState('')
  const [showResolution, setShowResolution] = useState(false)

  const severityColors = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  }

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    reviewing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  }

  const statusLabels = {
    pending: 'En attente',
    reviewing: 'En revue',
    in_progress: 'En cours',
    resolved: 'Résolu',
    rejected: 'Rejeté'
  }

  const typeLabels = {
    bug: 'Bug technique',
    feature: 'Fonctionnalité',
    performance: 'Performance',
    security: 'Sécurité',
    usability: 'Utilisation',
    other: 'Autre'
  }

  const handleStatusUpdate = (status: string) => {
    if (status === 'resolved' && !resolution) {
      setShowResolution(true)
      return
    }
    onUpdateStatus(report._id, status, resolution)
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            {report.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* En-tête avec infos */}
          <div className="flex flex-wrap gap-2">
            <Badge className={severityColors[report.severity]}>
              {report.severity === 'critical' ? 'Critique' : 
               report.severity === 'high' ? 'Haute' :
               report.severity === 'medium' ? 'Moyenne' : 'Faible'}
            </Badge>
            <Badge className={statusColors[report.status]}>
              {statusLabels[report.status]}
            </Badge>
            <Badge variant="outline">
              {typeLabels[report.type]}
            </Badge>
          </div>

          {/* Informations utilisateur */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Informations utilisateur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span>{report.user.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{report.user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-400" />
                <span>Rôle: {report.user.role === 'freelance' ? 'Freelance' : 'Client'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">{report.description}</p>
            </CardContent>
          </Card>

          {/* Détails techniques */}
          {(report.steps || report.expectedBehavior || report.actualBehavior) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Détails techniques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {report.steps && (
                  <div>
                    <div className="font-semibold mb-1">Étapes pour reproduire :</div>
                    <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{report.steps}</p>
                  </div>
                )}
                {report.expectedBehavior && (
                  <div>
                    <div className="font-semibold mb-1">Comportement attendu :</div>
                    <p className="text-slate-600 dark:text-slate-400">{report.expectedBehavior}</p>
                  </div>
                )}
                {report.actualBehavior && (
                  <div>
                    <div className="font-semibold mb-1">Comportement réel :</div>
                    <p className="text-slate-600 dark:text-slate-400">{report.actualBehavior}</p>
                  </div>
                )}
                {(report.browser || report.os) && (
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    {report.browser && <span>🌐 {report.browser}</span>}
                    {report.os && <span>💻 {report.os}</span>}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Résolution */}
          {showResolution && (
            <div>
              <Label>Résolution / Solution apportée</Label>
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Décrivez comment le problème a été résolu..."
                rows={3}
                className="mt-1"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 justify-end pt-4 border-t">
            <Button variant="outline" size="sm" onClick={() => handleStatusUpdate('rejected')}>
              <XCircle className="h-4 w-4 mr-2" />
              Rejeter
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleStatusUpdate('in_progress')}>
              <Clock className="h-4 w-4 mr-2" />
              Prendre en charge
            </Button>
            <Button variant="default" size="sm" onClick={() => handleStatusUpdate('resolved')}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Marquer comme résolu
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Composant principal
export default function AdminSupportPage() {
  const { data: session } = useSession()
  const params = useParams()
  const lang = params.lang as Locale
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState('reports')
  const [reports, setReports] = useState<ProblemReport[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<ProblemReport | null>(null)
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [showFaqDialog, setShowFaqDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')


  // Charger les données
  const loadData = useCallback(async () => {
    
    setLoading(true)
    try {
      // Charger les signalements
      const reportsRes = await fetch('/api/support/reports/admin')
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json()
        setReports(reportsData.reports)
      }

      // Charger les FAQs
      const faqsRes = await fetch('/api/support/faq')
      if (faqsRes.ok) {
        const faqsData = await faqsRes.json()
        setFaqs(faqsData.faqs)
      }

      // Charger les tickets
      const ticketsRes = await fetch('/api/support/tickets')
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json()
        setTickets(ticketsData.tickets)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])
  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    if (status === "loading") return
    
    if (!session || (session.user as any)?.role !== "admin") {
      router.push(`/${lang}/dashboard`)
      toast.error( "Accès non autorisé")
    }
  }, [session, status, router, lang])

  // Filtrer les signalements
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          report.user.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus
    const matchesSeverity = filterSeverity === 'all' || report.severity === filterSeverity
    return matchesSearch && matchesStatus && matchesSeverity
  })

  // Mettre à jour le statut d'un signalement
  const updateReportStatus = async (id: string, status: string, resolution?: string) => {
    try {
      const response = await fetch(`/api/support/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution })
      })
      
      if (response.ok) {
        toast.success('Statut mis à jour')
        loadData()
      }
    } catch (error) {
      console.error('Error updating report:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  // Sauvegarder une FAQ
  const saveFaq = async (data: any) => {
    try {
      const url = editingFaq ? `/api/support/faq/${editingFaq._id}` : '/api/support/faq'
      const method = editingFaq ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        toast.success(editingFaq ? 'FAQ mise à jour' : 'FAQ créée')
        setShowFaqDialog(false)
        setEditingFaq(null)
        loadData()
      }
    } catch (error) {
      console.error('Error saving FAQ:', error)
      toast.error('Erreur lors de l\'enregistrement')
    }
  }

  // Supprimer une FAQ
  const deleteFaq = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette FAQ ?')) return
    
    try {
      const response = await fetch(`/api/support/faq/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('FAQ supprimée')
        loadData()
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  // Statistiques
  const stats = {
    pending: reports.filter(r => r.status === 'pending').length,
    inProgress: reports.filter(r => r.status === 'in_progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    urgent: reports.filter(r => r.severity === 'critical' && r.status !== 'resolved').length
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-16">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Administration Support</h1>
            <p className="text-slate-500 text-sm">Gérez les signalements, FAQs et tickets</p>
          </div>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="py-3 text-center">
              <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
              <div className="text-xs text-slate-500">En attente</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.inProgress}</div>
              <div className="text-xs text-slate-500">En cours</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
              <div className="text-xs text-slate-500">Résolus</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <div className="text-2xl font-bold text-red-500">{stats.urgent}</div>
              <div className="text-xs text-slate-500">Urgents</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="reports">Signalements ({reports.length})</TabsTrigger>
            <TabsTrigger value="faqs">FAQs ({faqs.length})</TabsTrigger>
            <TabsTrigger value="tickets">Tickets ({tickets.length})</TabsTrigger>
          </TabsList>

          {/* Onglet Signalements */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <CardTitle>Signalements utilisateurs</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-8 text-sm w-40"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32 h-8 text-sm">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="reviewing">En revue</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="resolved">Résolu</SelectItem>
                        <SelectItem value="rejected">Rejeté</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                      <SelectTrigger className="w-32 h-8 text-sm">
                        <SelectValue placeholder="Sévérité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                        <SelectItem value="critical">Critique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredReports.map((report) => (
                    <div
                      key={report._id}
                      className="p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedReport(report)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-sm">{report.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {report.type}
                            </Badge>
                            <Badge className={cn(
                              "text-xs",
                              report.severity === 'critical' ? "bg-red-100 text-red-800" :
                              report.severity === 'high' ? "bg-orange-100 text-orange-800" :
                              report.severity === 'medium' ? "bg-yellow-100 text-yellow-800" :
                              "bg-blue-100 text-blue-800"
                            )}>
                              {report.severity}
                            </Badge>
                            <Badge className={cn(
                              "text-xs",
                              report.status === 'pending' ? "bg-gray-100" :
                              report.status === 'resolved' ? "bg-green-100 text-green-800" :
                              report.status === 'rejected' ? "bg-red-100 text-red-800" :
                              "bg-blue-100 text-blue-800"
                            )}>
                              {report.status === 'pending' ? 'En attente' :
                               report.status === 'reviewing' ? 'En revue' :
                               report.status === 'in_progress' ? 'En cours' :
                               report.status === 'resolved' ? 'Résolu' : 'Rejeté'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {report.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                            <span>{report.user.name}</span>
                            <span>•</span>
                            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Eye className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                  {filteredReports.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      Aucun signalement trouvé
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet FAQs */}
          <TabsContent value="faqs">
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Questions fréquentes</CardTitle>
                <Button size="sm" onClick={() => {
                  setEditingFaq(null)
                  setShowFaqDialog(true)
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une FAQ
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {faqs.map((faq) => (
                    <div key={faq._id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-sm">{faq.question}</h3>
                            <Badge variant="outline" className="text-xs">{faq.category}</Badge>
                            {!faq.active && (
                              <Badge variant="outline" className="text-xs bg-gray-100">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {faq.answer}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                            <span>👍 {faq.helpful}</span>
                            <span>👎 {faq.notHelpful}</span>
                            <span>Ordre: {faq.order}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setEditingFaq(faq)
                            setShowFaqDialog(true)
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteFaq(faq._id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Tickets */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle>Tickets de support</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <div key={ticket._id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-sm">{ticket.subject}</h3>
                            <Badge variant="outline" className="text-xs">{ticket.category}</Badge>
                            <Badge className={cn(
                              "text-xs",
                              ticket.priority === 'urgent' ? "bg-red-100 text-red-800" :
                              ticket.priority === 'high' ? "bg-orange-100 text-orange-800" :
                              "bg-blue-100 text-blue-800"
                            )}>
                              {ticket.priority}
                            </Badge>
                            <Badge className={cn(
                              "text-xs",
                              ticket.status === 'open' ? "bg-green-100 text-green-800" :
                              ticket.status === 'closed' ? "bg-gray-100" :
                              "bg-blue-100 text-blue-800"
                            )}>
                              {ticket.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                            <span>{ticket.user.name}</span>
                            <span>•</span>
                            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogue FAQ */}
      <Dialog open={showFaqDialog} onOpenChange={setShowFaqDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFaq ? 'Modifier la FAQ' : 'Nouvelle FAQ'}</DialogTitle>
          </DialogHeader>
          <FAQForm
            faq={editingFaq || undefined}
            onSave={saveFaq}
            onCancel={() => {
              setShowFaqDialog(false)
              setEditingFaq(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialogue détail signalement */}
      {selectedReport && (
        <ReportDetail
          report={selectedReport}
          onUpdateStatus={updateReportStatus}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  )
}