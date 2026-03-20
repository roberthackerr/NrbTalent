// app/contracts/page.tsx - VERSION MISE À JOUR
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Loader2, 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Euro,
  Clock,
  PlusCircle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Briefcase
} from "lucide-react"
import { toast } from "sonner"
import type { Contract } from "@/types/contract"

export default function ContractsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([])

  useEffect(() => {
    if (status === "authenticated") {
      fetchContracts()
    }
  }, [status])

  useEffect(() => {
    filterContracts()
  }, [contracts, searchTerm, activeTab])

  const fetchContracts = async () => {
    setIsLoading(true)
    try {
      console.log("📡 Fetching contracts...")
      const response = await fetch("/api/contracts")
      const data = await response.json()
      
      console.log("📦 Contracts data received:", data)
      
      if (response.ok) {
        // Convertir les dates strings en objets Date si nécessaire
        const formattedContracts = data.contracts?.map((contract: any) => ({
          ...contract,
          startDate: new Date(contract.startDate),
          createdAt: new Date(contract.createdAt),
          updatedAt: new Date(contract.updatedAt),
          endDate: contract.endDate ? new Date(contract.endDate) : undefined,
          signedAt: contract.signedAt ? new Date(contract.signedAt) : undefined
        })) || []
        
        setContracts(formattedContracts)
        console.log(`✅ Loaded ${formattedContracts.length} contracts`)
      } else {
        console.error("❌ Error loading contracts:", data)
        toast.error(data.error || "Erreur lors du chargement des contrats")
      }
    } catch (error) {
      console.error("❌ Erreur chargement contrats:", error)
      toast.error("Erreur lors du chargement des contrats")
    } finally {
      setIsLoading(false)
    }
  }

  const filterContracts = () => {
    let filtered = [...contracts]

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(contract =>
        contract.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.freelancer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtre par statut
    if (activeTab !== "all") {
      filtered = filtered.filter(contract => contract.status === activeTab)
    }

    setFilteredContracts(filtered)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800 border border-gray-300",
      pending: "bg-yellow-100 text-yellow-800 border border-yellow-300",
      signed: "bg-blue-100 text-blue-800 border border-blue-300",
      active: "bg-green-100 text-green-800 border border-green-300",
      completed: "bg-purple-100 text-purple-800 border border-purple-300",
      cancelled: "bg-red-100 text-red-800 border border-red-300"
    }
    
    const icons: Record<string, JSX.Element> = {
      draft: <FileText className="h-3 w-3 mr-1" />,
      pending: <Clock className="h-3 w-3 mr-1" />,
      signed: <CheckCircle className="h-3 w-3 mr-1" />,
      active: <Briefcase className="h-3 w-3 mr-1" />,
      completed: <CheckCircle className="h-3 w-3 mr-1" />,
      cancelled: <XCircle className="h-3 w-3 mr-1" />
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
      <Badge className={`${variants[status] || 'bg-gray-100'} flex items-center text-xs font-medium px-2 py-1`}>
        {icons[status]}
        {labels[status] || status}
      </Badge>
    )
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      fixed_price: "Prix Fixe",
      hourly: "À l'Heure",
      milestone: "Par Jalons"
    }
    return labels[type] || type
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(amount)
  }

  const getTotalValue = (status: string) => {
    return contracts
      .filter(c => c.status === status)
      .reduce((sum, c) => sum + c.amount, 0)
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des contrats...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin?callbackUrl=/contracts")
    return null
  }

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mes Contrats</h1>
            <p className="text-gray-600">
              Gérez tous vos contrats avec vos clients et freelancers
            </p>
          </div>
          
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Retour au Dashboard
          </Button>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un contrat, client, freelancer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span className="font-medium">{filteredContracts.length}</span>
            <span>contrats sur {contracts.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-7 gap-2">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <FileText className="h-3 w-3" />
            Tous
            <Badge variant="secondary" className="ml-1">
              {contracts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Briefcase className="h-3 w-3" />
            Actifs
            <Badge variant="secondary" className="ml-1">
              {contracts.filter(c => c.status === 'active').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            En attente
            <Badge variant="secondary" className="ml-1">
              {contracts.filter(c => c.status === 'pending').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="draft" className="flex items-center gap-2">
            <FileText className="h-3 w-3" />
            Brouillons
            <Badge variant="secondary" className="ml-1">
              {contracts.filter(c => c.status === 'draft').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="signed" className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3" />
            Signés
            <Badge variant="secondary" className="ml-1">
              {contracts.filter(c => c.status === 'signed').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3" />
            Terminés
            <Badge variant="secondary" className="ml-1">
              {contracts.filter(c => c.status === 'completed').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex items-center gap-2">
            <XCircle className="h-3 w-3" />
            Annulés
            <Badge variant="secondary" className="ml-1">
              {contracts.filter(c => c.status === 'cancelled').length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredContracts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? "Aucun contrat trouvé" : "Aucun contrat"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? "Essayez avec d'autres termes de recherche"
                    : activeTab === "all"
                      ? "Vous n'avez pas encore de contrats"
                      : `Vous n'avez pas de contrats avec le statut "${activeTab}"`
                  }
                </p>
                {searchTerm && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm("")}
                  >
                    Effacer la recherche
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContracts.map((contract) => (
                <Card 
                  key={contract._id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow border"
                  onClick={() => router.push(`/contracts/${contract._id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg line-clamp-2">
                        {contract.title}
                      </CardTitle>
                      {getStatusBadge(contract.status)}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="h-3 w-3" />
                      <span>Contrat #{contract._id?.slice(-6) || 'N/A'}</span>
                      <span>•</span>
                      <span className="capitalize">{getTypeLabel(contract.type)}</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {contract.description || "Aucune description"}
                    </p>

                    {/* Parties */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg border">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-3 w-3 text-gray-500" />
                          <span className="font-medium">Client</span>
                        </div>
                        <p className="truncate font-medium">
                          {contract.client?.name || "Non spécifié"}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg border">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-3 w-3 text-gray-500" />
                          <span className="font-medium">Freelancer</span>
                        </div>
                        <p className="truncate font-medium">
                          {contract.freelancer?.name || "Non spécifié"}
                        </p>
                      </div>
                    </div>

                    {/* Informations financières */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Euro className="h-3 w-3 text-green-600" />
                          <span className="font-medium">Montant</span>
                        </div>
                        <p className="font-semibold text-green-700">
                          {formatCurrency(contract.amount, contract.currency)}
                        </p>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-3 w-3 text-blue-600" />
                          <span className="font-medium">Début</span>
                        </div>
                        <p className="font-semibold text-blue-700">
                          {formatDate(contract.startDate)}
                        </p>
                      </div>
                    </div>

                    {/* Durée si disponible */}
                    {contract.duration && (
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-3 w-3 text-purple-600" />
                          <span className="font-medium">Durée</span>
                        </div>
                        <p className="font-semibold text-purple-700">
                          {contract.duration} jours
                        </p>
                      </div>
                    )}

                    {/* Dates et actions */}
                    <div className="flex justify-between items-center pt-3 border-t">
                      <div className="text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Créé le {formatDate(contract.createdAt)}
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/contracts/${contract._id}`)
                        }}
                      >
                        Voir détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Statistiques des contrats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border">
              <div className="text-2xl font-bold text-blue-700">
                {formatCurrency(getTotalValue('active'), 'EUR')}
              </div>
              <p className="text-sm text-gray-600 mt-1">Valeur totale active</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg border">
              <div className="text-2xl font-bold text-green-700">
                {contracts.filter(c => c.status === 'active').length}
              </div>
              <p className="text-sm text-gray-600 mt-1">Contrats actifs</p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg border">
              <div className="text-2xl font-bold text-yellow-700">
                {contracts.filter(c => c.status === 'pending').length}
              </div>
              <p className="text-sm text-gray-600 mt-1">En attente</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg border">
              <div className="text-2xl font-bold text-purple-700">
                {contracts.filter(c => c.status === 'completed').length}
              </div>
              <p className="text-sm text-gray-600 mt-1">Terminés</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}