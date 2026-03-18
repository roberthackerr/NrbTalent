// app/[lang]/admin/verification/page.tsx
'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  Eye, 
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  AlertTriangle,
  Mail,
  Calendar,
  FileText,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { getDictionarySafe } from "@/lib/i18n/dictionaries"
import type { Locale } from "@/lib/i18n/config"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Interface pour les documents
interface VerificationDocument {
  url: string
  publicId: string
  type: string
  name: string
  size: number
}

// Interface mise à jour pour correspondre à la structure réelle
interface VerificationRequest {
  _id: string
  userId: string
  requestId: string
  documents: VerificationDocument[]  // ← Maintenant c'est un tableau d'objets, pas de strings
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  updatedAt: string
  reviewedBy?: string
  reviewedAt?: string
  rejectionReason?: string
  metadata?: {
    fileCount: number
    userAgent: string
    ip: string
  }
  user?: {
    _id: string
    name: string
    email: string
    avatar?: string
    title?: string
    verificationStatus?: string
    createdAt?: string
  }
}

export default function AdminVerificationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const lang = params.lang as Locale
  
  const [dict, setDict] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [processing, setProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  })

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    if (status === "loading") return
    
    if (!session || (session.user as any)?.role !== "admin") {
      router.push(`/${lang}/dashboard`)
      toast.error(dict?.common?.unauthorized || "Accès non autorisé")
    }
  }, [session, status, router, lang, dict])

  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  // Charger les demandes
  useEffect(() => {
    if (session && dict) {
      fetchRequests()
    }
  }, [session, dict, activeTab, currentPage, searchQuery])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        status: activeTab !== "all" ? activeTab : "",
        page: currentPage.toString(),
        limit: "10",
        search: searchQuery
      })

      console.log('Fetching with params:', queryParams.toString())
      const response = await fetch(`/api/admin/verification?${queryParams}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch requests')
      }

      const data = await response.json()
      console.log('API Response:', data)
      
      setRequests(data.requests || [])
      setTotalPages(data.totalPages || 1)
      setStats(data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 })
    } catch (error) {
      console.error('Error fetching verification requests:', error)
      toast.error(dict?.admin?.verification?.errors?.fetch || "Erreur lors du chargement des demandes")
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return

    if (status === 'rejected' && !rejectReason.trim()) {
      toast.error(dict?.admin?.verification?.errors?.rejectReasonRequired || "Veuillez fournir une raison de rejet")
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/admin/verification', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: selectedRequest._id,
          status,
          rejectionReason: status === 'rejected' ? rejectReason : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update request')
      }

      toast.success(
        status === 'approved' 
          ? (dict?.admin?.verification?.success?.approved || "Demande approuvée avec succès")
          : (dict?.admin?.verification?.success?.rejected || "Demande rejetée avec succès")
      )

      setReviewDialogOpen(false)
      setSelectedRequest(null)
      setRejectReason("")
      fetchRequests()
    } catch (error) {
      console.error('Error updating request:', error)
      toast.error(dict?.admin?.verification?.errors?.update || "Erreur lors de la mise à jour")
    } finally {
      setProcessing(false)
    }
  }

  const viewDocument = (url: string) => {
    window.open(url, '_blank')
  }

  const downloadDocument = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">
            <Clock className="h-3 w-3 mr-1" />
            {dict?.admin?.verification?.status?.pending || "En attente"}
          </Badge>
        )
      case 'approved':
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {dict?.admin?.verification?.status?.approved || "Approuvé"}
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white border-0">
            <XCircle className="h-3 w-3 mr-1" />
            {dict?.admin?.verification?.status?.rejected || "Rejeté"}
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'en' ? 'en-US' : 'fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE'
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('image')) return '🖼️'
    return '📁'
  }

  if (!session || (session.user as any)?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            {dict?.common?.loading || "Chargement..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push(`/${lang}/admin`)}
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {dict?.common?.back || "Retour"}
            </Button>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {dict?.admin?.verification?.title || "Vérification d'Identité"}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {dict?.admin?.verification?.subtitle || "Gérez les demandes de vérification des utilisateurs"}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {dict?.admin?.verification?.stats?.total || "Total"}
                    </p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {stats.total}
                    </h3>
                  </div>
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                    <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      {dict?.admin?.verification?.stats?.pending || "En attente"}
                    </p>
                    <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                      {stats.pending}
                    </h3>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {dict?.admin?.verification?.stats?.approved || "Approuvées"}
                    </p>
                    <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                      {stats.approved}
                    </h3>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {dict?.admin?.verification?.stats?.rejected || "Rejetées"}
                    </p>
                    <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                      {stats.rejected}
                    </h3>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={dict?.admin?.verification?.searchPlaceholder || "Rechercher par nom ou email..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setCurrentPage(1)
                fetchRequests()
              }}
              className="sm:w-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {dict?.common?.refresh || "Actualiser"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="pending" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
              {dict?.admin?.verification?.tabs?.pending || "En attente"}
              {stats.pending > 0 && (
                <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">
                  {stats.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
              {dict?.admin?.verification?.tabs?.approved || "Approuvées"}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
              {dict?.admin?.verification?.tabs?.rejected || "Rejetées"}
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
              {dict?.admin?.verification?.tabs?.all || "Toutes"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : requests.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800">
                <CardContent className="pt-16 pb-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Shield className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {dict?.admin?.verification?.noRequests || "Aucune demande"}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    {dict?.admin?.verification?.noRequestsDesc || "Il n'y a actuellement aucune demande de vérification dans cette catégorie."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card 
                    key={request._id} 
                    className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedRequest(request)
                      setReviewDialogOpen(true)
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-900">
                            <AvatarImage src={request.user?.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {request.user?.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-900 dark:text-white">
                                {request.user?.name}
                              </h4>
                              {getStatusBadge(request.status)}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400 mb-2">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {request.user?.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(request.submittedAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {request.documents?.length || 0} document(s)
                              </span>
                              {request.metadata?.ip && (
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                  IP: {request.metadata.ip}
                                </span>
                              )}
                            </div>
                            
                            {request.rejectionReason && (
                              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                                {request.rejectionReason}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 lg:flex-shrink-0">
                          {request.documents && request.documents.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                viewDocument(request.documents[0].url)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {dict?.admin?.verification?.view || "Voir"}
                            </Button>
                          )}
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedRequest(request)
                              setReviewDialogOpen(true)
                            }}
                          >
                            {dict?.admin?.verification?.review || "Examiner"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {dict?.admin?.verification?.page || "Page"} {currentPage} / {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              {dict?.admin?.verification?.reviewTitle || "Examiner la demande de vérification"}
            </DialogTitle>
            <DialogDescription>
              {dict?.admin?.verification?.reviewDescription || "Vérifiez les documents et approuvez ou rejetez la demande"}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 py-4">
              {/* User Info */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <Avatar className="h-16 w-16 border-2 border-white dark:border-slate-900">
                  <AvatarImage src={selectedRequest.user?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
                    {selectedRequest.user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {selectedRequest.user?.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {selectedRequest.user?.title || dict?.admin?.verification?.noTitle || "Titre non défini"}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {selectedRequest.user?.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(selectedRequest.submittedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {dict?.admin?.verification?.documents || "Documents soumis"}
                </h4>
                <div className="grid gap-3">
                  {selectedRequest.documents && selectedRequest.documents.length > 0 ? (
                    selectedRequest.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {doc.name || `Document ${index + 1}`}
                              <span className="ml-2 text-xs text-slate-500 dark:text-slate-500">
                                .{getFileExtension(doc.name)}
                              </span>
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                              {doc.type} • {(doc.size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewDocument(doc.url)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {dict?.admin?.verification?.view || "Voir"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadDocument(doc.url, doc.name)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {dict?.admin?.verification?.download || "Télécharger"}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Aucun document disponible
                    </p>
                  )}
                </div>
              </div>

              {/* Rejection Reason */}
              <div className="space-y-3">
                <Label htmlFor="reject-reason" className="text-sm font-medium">
                  {dict?.admin?.verification?.rejectionReason || "Raison du rejet"}
                </Label>
                <Textarea
                  id="reject-reason"
                  placeholder={dict?.admin?.verification?.rejectionPlaceholder || "Expliquez pourquoi la demande est rejetée..."}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  {dict?.admin?.verification?.rejectionNote || "Cette raison sera envoyée à l'utilisateur par email et notification."}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setReviewDialogOpen(false)
                setSelectedRequest(null)
                setRejectReason("")
              }}
              className="flex-1"
            >
              {dict?.common?.cancel || "Annuler"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReview('rejected')}
              disabled={processing || (rejectReason && rejectReason.trim().length === 0)}
              className="flex-1"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  {dict?.admin?.verification?.reject || "Rejeter"}
                </>
              )}
            </Button>
            <Button
              variant="default"
              onClick={() => handleReview('approved')}
              disabled={processing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {dict?.admin?.verification?.approve || "Approuver"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}