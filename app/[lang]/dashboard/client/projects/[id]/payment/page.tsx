// app/dashboard/client/projects/[id]/payment/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CreditCard, Shield, CheckCircle2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { ProjectPaymentModal } from "@/components/projects/project-payment-modal"

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [params.id])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/client?id=${params.id}`)
      const data = await response.json()
      
      // CORRECTION ICI : Utilise data.singleProject OU data.projects[0]
      const projectData = data.singleProject || (data.projects && data.projects[0])
      
      if (projectData) {
        setProject(projectData)
      } else {
        toast.error("Projet non trouvé")
        router.back()
      }
    } catch (error) {
      console.error('Erreur récupération projet:', error)
      toast.error("Erreur lors du chargement du projet")
      router.back()
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement du projet...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Projet non trouvé</p>
          <Button onClick={() => router.back()}>
            Retour
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux projets
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Paiement du projet
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Finalisez le paiement pour sécuriser votre projet
          </p>
        </div>

        {/* Récapitulatif du projet */}
        <Card className="mb-6 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {project.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {project.description?.substring(0, 150)}...
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Budget estimé</p>
                  <p className="font-semibold">
                    {project.budget?.min}€ - {project.budget?.max}€
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Statut</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    project.status === 'accepted' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}>
                    {project.status === 'accepted' ? 'Accepté' : 'En attente'}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Date de création</p>
                  <p className="font-semibold">
                    {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mb-8 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-300">
                  Important à savoir avant de payer
                </h3>
                <ul className="mt-2 space-y-2 text-sm text-amber-700 dark:text-amber-400">
                  <li>• Le paiement sera versé sur une plateforme sécurisée</li>
                  <li>• Vous serez remboursé intégralement si le projet est annulé</li>
                  <li>• La commission de 15% couvre le support et la garantie</li>
                  <li>• Le freelance sera payé à la validation de chaque étape</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bouton de paiement */}
        <div className="text-center">
          <ProjectPaymentModal
            project={project}
            open={showPaymentModal}
            onOpenChange={setShowPaymentModal}
            trigger={
              <Button 
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8 py-6 text-lg"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Procéder au paiement sécurisé
              </Button>
            }
          />
          
          <p className="text-sm text-gray-500 mt-4">
            En cliquant sur ce bouton, vous serez redirigé vers notre système de paiement sécurisé
          </p>
        </div>
      </div>
    </div>
  )
}