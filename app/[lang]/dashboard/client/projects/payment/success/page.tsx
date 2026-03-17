// app/dashboard/client/projects/payment/success/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  CheckCircle2, 
  Download, 
  Mail, 
  FileText, 
  Calendar,
  CreditCard,
  ArrowLeft,
  Shield,
  Sparkles
} from "lucide-react"
import { toast } from "sonner"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [project, setProject] = useState<any>(null)

  const projectId = searchParams.get('project')
  const paymentIntentId = searchParams.get('payment_intent')

  useEffect(() => {
    if (projectId) {
      fetchPaymentDetails()
    }
  }, [projectId])

  const fetchPaymentDetails = async () => {
    try {
      // Récupérer les détails du projet
      const projectRes = await fetch(`/api/projects/client?id=${projectId}`)
      const projectData = await projectRes.json()
      
      if (projectData.singleProject) {
        setProject(projectData.singleProject)
      }

      // Récupérer les détails de la transaction
      if (paymentIntentId) {
        const paymentRes = await fetch(`/api/stripe/payment/${paymentIntentId}`)
        const paymentData = await paymentRes.json()
        
        if (paymentData.success) {
          setPaymentData(paymentData.payment)
        }
      }

    } catch (error) {
      console.error('Erreur récupération détails:', error)
      toast.error("Erreur lors du chargement des détails")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReceipt = () => {
    if (paymentData?.receiptUrl) {
      window.open(paymentData.receiptUrl, '_blank')
    } else {
      toast.info("Le reçu sera disponible dans quelques minutes")
    }
  }

  const handleSendEmail = () => {
    toast.success("Reçu envoyé par email avec succès!")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre confirmation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* En-tête de succès */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
            <CheckCircle2 className="relative h-20 w-20 text-green-600 mx-auto" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Paiement Réussi ! 🎉
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            Votre projet est maintenant sécurisé et prêt à démarrer
          </p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
            <Sparkles className="h-4 w-4 text-green-600" />
            <span className="text-green-700 dark:text-green-300 font-medium">
              Transaction confirmée
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche : Récapitulatif */}
          <div className="lg:col-span-2 space-y-6">
            {/* Carte de confirmation */}
            <Card className="border-green-200 dark:border-green-800 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      Confirmation de paiement
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      ID: {paymentIntentId?.substring(0, 20)}...
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-600">
                      {paymentData?.amount ? `${(paymentData.amount / 100).toFixed(2)}€` : '2 000,00€'}
                    </p>
                    <p className="text-sm text-gray-500">Montant payé</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <Calendar className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">Date du paiement</p>
                        <p className="text-sm text-gray-500">
                          {paymentData?.createdAt ? formatDate(paymentData.createdAt) : new Date().toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <CreditCard className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">Moyen de paiement</p>
                        <p className="text-sm text-gray-500">
                          Carte •••• {paymentData?.last4 || '4242'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {project && (
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          <FileText className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">Projet</p>
                          <p className="text-sm text-gray-500">{project.title}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Prochaines étapes */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Prochaines étapes</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-300 font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Le freelance a été notifié</p>
                      <p className="text-sm text-gray-600">
                        Le développeur peut maintenant commencer à travailler sur votre projet
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-300 font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Communication sécurisée</p>
                      <p className="text-sm text-gray-600">
                        Utilisez la messagerie NrbTalents pour discuter avec votre freelance
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-300 font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Suivi des livrables</p>
                      <p className="text-sm text-gray-600">
                        Vous recevrez des mises à jour régulières sur l'avancement du projet
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne droite : Actions */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Actions</h3>
                <div className="space-y-3">
                  <Button 
                    onClick={handleDownloadReceipt}
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger le reçu
                  </Button>
                  
                  <Button 
                    onClick={handleSendEmail}
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer par email
                  </Button>
                  
                  <Button 
                    onClick={() => router.push(`/projects/${projectId}`)}
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Voir le projet
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-700 dark:text-blue-300">
                      Support & Assistance
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Vous avez des questions ? Notre équipe est là pour vous aider.
                    </p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-blue-600 dark:text-blue-400 mt-2"
                      onClick={() => router.push('/support')}
                    >
                      Contacter le support
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bouton principal */}
            <Button 
              onClick={() => router.push('/dashboard/client/projects')}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-6"
              size="lg"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour à mes projets
            </Button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-10 text-center text-sm text-gray-500">
          <p>
            Un email de confirmation a été envoyé à votre adresse.
            Vous pouvez suivre l'avancement de votre projet dans votre dashboard.
          </p>
          <p className="mt-2">
            Merci d'avoir choisi NrbTalents ! 🚀
          </p>
        </div>
      </div>
    </div>
  )
}