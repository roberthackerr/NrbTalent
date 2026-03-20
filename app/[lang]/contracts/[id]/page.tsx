// app/contracts/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ContractSignature } from "@/components/contracts/ContractSignature"
import { Loader2, FileText, Calendar, User, Euro, Clock, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

export default function ContractPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const contractId = params.id as string

  const [contract, setContract] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (status === "authenticated") {
      fetchContractDetails()
    }
  }, [status, contractId])

  const fetchContractDetails = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}`)
      const data = await response.json()
      
      if (response.ok) {
        setContract(data.contract)
      } else {
        toast.error(data.error)
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Erreur chargement contrat:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      pending: "bg-yellow-100 text-yellow-800",
      signed: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      completed: "bg-purple-100 text-purple-800",
      cancelled: "bg-red-100 text-red-800"
    }
    
    const labels: Record<string, string> = {
      draft: "Brouillon",
      pending: "En attente",
      signed: "Signé",
      active: "Actif",
      completed: "Terminé",
      cancelled: "Annulé"
    }

    return (
      <Badge className={`${variants[status] || 'bg-gray-100'} capitalize`}>
        {labels[status] || status}
      </Badge>
    )
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getCurrentUserRole = () => {
    if (!contract || !session?.user) return null
    const userId = (session.user as any).id
    return contract.clientId._id === userId ? "client" : "freelancer"
  }

  const handleSigned = () => {
    toast.success("Contrat signé avec succès !")
    fetchContractDetails() // Refresh data
  }

  const handleRequestChanges = (changes: string) => {
    toast.success("Demande de modifications envoyée")
    fetchContractDetails()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Contrat non trouvé</h2>
            <p className="text-gray-600 mb-4">
              Le contrat que vous recherchez n'existe pas ou vous n'y avez pas accès.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentUserRole = getCurrentUserRole()
  const isClient = currentUserRole === "client"
  const userIsSigned = isClient ? contract.clientSignature : contract.freelancerSignature
  const otherPartySigned = isClient ? contract.freelancerSignature : contract.clientSignature

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{contract.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              {getStatusBadge(contract.status)}
              <span className="text-gray-600">Contrat #{contract._id.slice(-6)}</span>
              <span className="text-gray-600">• Version {contract.version}</span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => window.print()}
          >
            <FileText className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </div>

        <Separator className="my-6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Euro className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Montant</p>
                    <p className="text-xl font-semibold">
                      {contract.amount} {contract.currency}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date de Début</p>
                    <p className="text-xl font-semibold">
                      {formatDate(contract.startDate)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="text-xl font-semibold capitalize">
                      {contract.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <nav className="flex space-x-8">
              {['overview', 'deliverables', 'terms', 'payments'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-1 font-medium text-sm border-b-2 ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'overview' && 'Aperçu'}
                  {tab === 'deliverables' && 'Livrables'}
                  {tab === 'terms' && 'Conditions'}
                  {tab === 'payments' && 'Paiements'}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <Card>
            <CardContent className="pt-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-700 whitespace-pre-line">
                      {contract.description || "Aucune description fournie."}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Portée du Travail</h3>
                    <p className="text-gray-700 whitespace-pre-line">
                      {contract.scopeOfWork || "Aucune portée spécifiée."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-600 mb-1">Client</h4>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{contract.client?.name}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-600 mb-1">Freelancer</h4>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{contract.freelancer?.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'deliverables' && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Livrables</h3>
                  {contract.deliverables?.length > 0 ? (
                    <ul className="space-y-3">
                      {contract.deliverables.map((deliverable: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-blue-600 text-sm">{index + 1}</span>
                          </div>
                          <span className="text-gray-700">{deliverable}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">Aucun livrable spécifié.</p>
                  )}
                </div>
              )}

              {activeTab === 'terms' && (
                <div>
                  <h3 className="font-semibold mb-4">Termes et Conditions</h3>
                  <div className="prose max-w-none text-gray-700 whitespace-pre-line">
                    {contract.termsAndConditions}
                  </div>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Plan de Paiement</h3>
                  <p className="text-gray-600">
                    Type: <span className="capitalize">{contract.paymentSchedule?.type}</span>
                  </p>
                  
                  {contract.paymentSchedule?.milestones?.length > 0 ? (
                    <div className="space-y-3">
                      {contract.paymentSchedule.milestones.map((milestone: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{milestone.title}</span>
                            <Badge className={milestone.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {milestone.status === 'paid' ? 'Payé' : 'En attente'}
                            </Badge>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>{milestone.amount} {contract.currency}</span>
                            <span>Échéance: {formatDate(milestone.dueDate)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Aucun jalon de paiement défini.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Signature Component */}
          {['pending', 'draft'].includes(contract.status) && currentUserRole && (
            <ContractSignature
              contractId={contractId}
              title={contract.title}
              currentUserRole={currentUserRole}
              onSigned={handleSigned}
              onRequestChanges={handleRequestChanges}
              isSigned={!!userIsSigned}
              otherPartySigned={!!otherPartySigned}
            />
          )}

          {/* Contract Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du Contrat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Date de création</p>
                <p className="font-medium">{formatDate(contract.createdAt)}</p>
              </div>
              
              {contract.signedAt && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Date de signature</p>
                  <p className="font-medium">{formatDate(contract.signedAt)}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600 mb-1">Projet associé</p>
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => router.push(`/projects/${contract.projectId._id || contract.projectId}`)}
                >
                  {contract.project?.title || "Voir le projet"}
                </Button>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Actions</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      // Navigate to messages
                      router.push(`/messages?contract=${contractId}`)
                    }}
                  >
                    Message
                  </Button>
                  
                  {contract.status === 'active' && isClient && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        // Create milestone
                        router.push(`/contracts/${contractId}/milestones/new`)
                      }}
                    >
                      Ajouter un jalon
                    </Button>
                  )}
                  
                  {contract.status === 'active' && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={async () => {
                        // Mark as completed
                        if (confirm("Êtes-vous sûr de vouloir marquer ce contrat comme terminé ?")) {
                          try {
                            const response = await fetch(`/api/contracts/${contractId}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'complete' })
                            })
                            
                            if (response.ok) {
                              toast.success("Contrat marqué comme terminé")
                              fetchContractDetails()
                            }
                          } catch (error) {
                            console.error(error)
                          }
                        }
                      }}
                    >
                      Marquer comme terminé
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signatures */}
          <Card>
            <CardHeader>
              <CardTitle>Signatures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Client</p>
                  {contract.clientSignature ? (
                    <div className="text-sm text-gray-600">
                      <p>Signé le {formatDate(contract.clientSignature.signedAt)}</p>
                      <p className="text-xs">IP: {contract.clientSignature.ipAddress}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-yellow-600">En attente de signature</p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Freelancer</p>
                  {contract.freelancerSignature ? (
                    <div className="text-sm text-gray-600">
                      <p>Signé le {formatDate(contract.freelancerSignature.signedAt)}</p>
                      <p className="text-xs">IP: {contract.freelancerSignature.ipAddress}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-yellow-600">En attente de signature</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}