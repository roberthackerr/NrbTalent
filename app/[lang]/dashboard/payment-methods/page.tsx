// app/dashboard/payment-methods/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { 
  CreditCard, 
  Trash2, 
  Shield,
  Lock,
  CheckCircle2,
  AlertCircle,
  Plus
} from "lucide-react"
import { AddPaymentMethod } from "@/components/payments/add-payment-method"

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/stripe/payment-methods')
      const data = await response.json()
      
      if (data.success) {
        setPaymentMethods(data.paymentMethods || [])
      }
    } catch (error) {
      console.error('Erreur récupération cartes:', error)
      toast.error("Erreur lors du chargement des cartes")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette carte ?")) {
      return
    }

    try {
      const response = await fetch(`/api/stripe/payment-methods?id=${cardId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      toast.success("Carte supprimée avec succès")
      fetchPaymentMethods()
    } catch (error) {
      console.error('Erreur suppression carte:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression")
    }
  }

  const handleSuccess = () => {
    toast.success("Carte ajoutée avec succès !")
    fetchPaymentMethods()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Méthodes de paiement</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gérez vos cartes bancaires pour des paiements rapides et sécurisés
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Vos cartes enregistrées
          </CardTitle>
          <CardDescription>
            Ces cartes seront utilisées pour vos paiements sur NrbTalents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p>Chargement des cartes...</p>
            </div>
          ) : paymentMethods.length > 0 ? (
            <div className="space-y-4">
              {paymentMethods.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {card.brand.toUpperCase()} •••• {card.last4}
                        </p>
                        {card.isDefault && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Par défaut
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {card.cardholderName} • Expire le {card.exp_month}/{card.exp_year}
                      </p>
                      <p className="text-xs text-gray-500">
                        Ajoutée le {new Date(card.addedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCard(card.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <AddPaymentMethod 
                trigger={
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une autre carte
                  </Button>
                }
                onSuccess={handleSuccess}
              />
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <CreditCard className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <h3 className="font-medium text-lg">Aucune carte enregistrée</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Ajoutez une carte pour pouvoir payer vos projets rapidement
                </p>
              </div>
              <AddPaymentMethod 
                trigger={
                  <Button>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Ajouter ma première carte
                  </Button>
                }
                onSuccess={handleSuccess}
              />
            </div>
          )}

          <Separator className="my-6" />

          {/* Informations de sécurité */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Paiement sécurisé</h4>
                <p className="text-sm text-gray-600">
                  Toutes les transactions sont cryptées et conformes aux normes PCI DSS niveau 1
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Données protégées</h4>
                <p className="text-sm text-gray-600">
                  Vos informations bancaires ne sont jamais stockées sur nos serveurs
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note importante */}
      <Card className="border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-700 dark:text-amber-300">
                Information importante
              </h4>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Vous devez configurer au moins une carte bancaire avant de pouvoir payer un projet.
                Les cartes sont validées avec une transaction de 1€ qui est immédiatement annulée.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}