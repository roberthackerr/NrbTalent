// app/dashboard/freelancer/payments/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  CreditCard,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Calendar,
  Euro
} from "lucide-react"

export default function FreelancerPaymentsPage() {
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<any>(null)
  const [bankAccount, setBankAccount] = useState<any>(null)

  useEffect(() => {
    fetchPaymentsData()
  }, [])

  const fetchPaymentsData = async () => {
    try {
      const [paymentsRes, bankRes] = await Promise.all([
        fetch('/api/freelancer/payments'),
        fetch('/api/freelancer/bank-account')
      ])

      const paymentsData = await paymentsRes.json()
      const bankData = await bankRes.json()

      if (paymentsData.success) {
        setPayments(paymentsData)
      }

      if (bankData.success) {
        setBankAccount(bankData.bankAccount)
      }

    } catch (error) {
      console.error('Erreur:', error)
      toast.error("Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }

  const handleRequestPayout = async () => {
    try {
      const response = await fetch('/api/freelancer/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: payments?.availableAmount })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la demande')
      }

      toast.success("✅ Demande de paiement envoyée !")
      fetchPaymentsData()
      
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : "Erreur")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">Chargement de vos paiements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mes paiements</h1>
        <p className="text-gray-600">
          Gérez vos revenus et vos retraits
        </p>
      </div>

      {/* Alertes importantes */}
      {!bankAccount && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800">
                  Configuration bancaire requise
                </h3>
                <p className="text-red-700 text-sm">
                  Vous devez configurer votre compte bancaire pour recevoir vos paiements.
                </p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-red-800 font-semibold mt-1"
                  onClick={() => window.location.href = '/dashboard/freelancer/bank'}
                >
                  Configurer mon compte →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : Statistiques */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Disponible</p>
                    <p className="text-2xl font-bold">
                      {payments?.availableAmount?.toFixed(2) || '0.00'} €
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Wallet className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  disabled={!payments?.availableAmount || payments.availableAmount < 1}
                  onClick={handleRequestPayout}
                >
                  Demander le paiement
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">En attente</p>
                    <p className="text-2xl font-bold">
                      {payments?.pendingAmount?.toFixed(2) || '0.00'} €
                    </p>
                  </div>
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Paiements en cours de validation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total gagné</p>
                    <p className="text-2xl font-bold">
                      {payments?.totalEarnings?.toFixed(2) || '0.00'} €
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Depuis le début
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Prochains paiements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Prochains paiements
              </CardTitle>
              <CardDescription>
                Vos paiements programmés
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments?.transactions?.length > 0 ? (
                <div className="space-y-4">
                  {payments.transactions.slice(0, 5).map((transaction: any) => (
                    <div key={transaction._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          Projet #{transaction.projectId?.toString().substring(0, 8)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{transaction.amount.toFixed(2)} €</p>
                        <Badge 
                          variant={
                            transaction.status === 'paid' ? 'default' :
                            transaction.status === 'pending' ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {transaction.status === 'paid' ? 'Payé' :
                           transaction.status === 'pending' ? 'En attente' : 'En traitement'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">Aucun paiement pour le moment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite : Informations bancaires */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Compte bancaire
              </CardTitle>
              <CardDescription>
                {bankAccount ? 'Vos informations bancaires' : 'Non configuré'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bankAccount ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">IBAN</p>
                    <p className="font-mono">
                      {bankAccount.iban.match(/.{1,4}/g)?.join(' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Titulaire</p>
                    <p>{bankAccount.accountHolder}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Banque</p>
                    <p>{bankAccount.bankName || 'Non spécifié'}</p>
                  </div>
                  <Separator />
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.location.href = '/dashboard/freelancer/bank'}
                  >
                    Modifier
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Button 
                    className="w-full"
                    onClick={() => window.location.href = '/dashboard/freelancer/bank'}
                  >
                    Configurer mon compte
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations de paiement */}
          <Card>
            <CardHeader>
              <CardTitle>Frais et délais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Commission NrbTalents</span>
                <span className="font-semibold">15%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Frais de virement</span>
                <span className="text-green-600">Gratuit</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span>Délai de paiement</span>
                <span>2-3 jours ouvrés</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Paiement minimum</span>
                <span>Aucun</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Fréquence</span>
                <span>Tous les vendredis</span>
              </div>
            </CardContent>
          </Card>

          {/* Bouton d'export */}
          <Card>
            <CardContent className="pt-6">
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exporter mes transactions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}