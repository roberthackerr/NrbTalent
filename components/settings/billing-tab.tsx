"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Download, Plus, CheckCircle2, Trash2, AlertCircle, Shield, Lock, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { AddPaymentMethod } from "@/components/payments/add-payment-method"

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  exp_month: number
  exp_year: number
  isDefault: boolean
  addedAt: string | Date
  cardholderName?: string
}

interface BillingTabProps {
  dict: any
  lang: string
}

export function BillingTab({ dict, lang }: BillingTabProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<any[]>([]) // À remplacer par vos vraies factures
  const [loadingInvoices, setLoadingInvoices] = useState(false)

  useEffect(() => {
    fetchPaymentMethods()
    fetchInvoices() // Si vous avez des factures à charger
  }, [])

  const fetchPaymentMethods = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/payment-methods')
      const data = await response.json()
      
      if (data.success) {
        console.log('Cartes chargées:', data.paymentMethods) // Debug
        setPaymentMethods(data.paymentMethods || [])
      } else {
        throw new Error(data.error || 'Erreur de chargement')
      }
    } catch (error) {
      console.error('Erreur récupération cartes:', error)
      toast.error(dict?.billing?.errors?.fetch || "Erreur lors du chargement des cartes")
    } finally {
      setLoading(false)
    }
  }

  const fetchInvoices = async () => {
    // Si vous avez une API pour les factures
    setLoadingInvoices(true)
    try {
      // const response = await fetch('/api/stripe/invoices')
      // const data = await response.json()
      // setInvoices(data.invoices || [])
      
      // Pour l'instant, on laisse vide
      setInvoices([])
    } catch (error) {
      console.error('Erreur récupération factures:', error)
    } finally {
      setLoadingInvoices(false)
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm(dict?.billing?.confirmDelete || "Êtes-vous sûr de vouloir supprimer cette carte ?")) {
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

      toast.success(dict?.billing?.success?.deleted || "Carte supprimée avec succès")
      fetchPaymentMethods()
    } catch (error) {
      console.error('Erreur suppression carte:', error)
      toast.error(error instanceof Error ? error.message : dict?.billing?.errors?.delete || "Erreur lors de la suppression")
    }
  }

  const handleSetDefault = async (cardId: string) => {
    try {
      const response = await fetch('/api/stripe/payment-methods/default', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentMethodId: cardId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du changement de carte par défaut')
      }

      toast.success(dict?.billing?.success?.defaultSet || "Carte par défaut mise à jour")
      fetchPaymentMethods()
    } catch (error) {
      console.error('Erreur changement carte par défaut:', error)
      toast.error(error instanceof Error ? error.message : dict?.billing?.errors?.defaultSet || "Erreur lors du changement")
    }
  }

  const handleSuccess = () => {
    toast.success(dict?.billing?.success?.added || "Carte ajoutée avec succès !")
    fetchPaymentMethods()
  }

  const formatExpiry = (month: number, year: number) => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`
  }

  const formatBrand = (brand: string) => {
    const brands: Record<string, string> = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      amex: 'American Express',
      discover: 'Discover',
      jcb: 'JCB',
      diners: 'Diners Club',
      unionpay: 'UnionPay'
    }
    return brands[brand.toLowerCase()] || brand.toUpperCase()
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'en' ? 'en-US' : 'fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Méthodes de paiement */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            {dict?.billing?.paymentMethods || "Méthodes de Paiement"}
          </CardTitle>
          <CardDescription>
            {dict?.billing?.paymentMethodsDesc || "Gérez vos cartes bancaires pour des paiements rapides et sécurisés"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-slate-600 dark:text-slate-400">
                {dict?.common?.loading || "Chargement..."}
              </span>
            </div>
          ) : paymentMethods.length > 0 ? (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {formatBrand(method.brand)} •••• {method.last4}
                        </p>
                        {method.isDefault && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {dict?.billing?.default || "Par défaut"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          {method.cardholderName || dict?.billing?.cardholder || "Titulaire"}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {dict?.billing?.expires || "Expire le"} {formatExpiry(method.exp_month, method.exp_year)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {dict?.billing?.addedOn || "Ajoutée le"} {formatDate(method.addedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!method.isDefault && paymentMethods.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                        className="text-xs whitespace-nowrap"
                      >
                        {dict?.billing?.setDefault || "Définir par défaut"}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCard(method.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="pt-4">
                <AddPaymentMethod 
                  trigger={
                    <Button variant="outline" className="w-full bg-transparent border-dashed">
                      <Plus className="h-4 w-4 mr-2" />
                      {dict?.billing?.addMethod || "Ajouter une autre carte"}
                    </Button>
                  }
                  onSuccess={handleSuccess}
                  dict={dict}
                  lang={lang}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <CreditCard className="h-10 w-10 text-slate-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-xl text-slate-900 dark:text-white">
                  {dict?.billing?.noCards || "Aucune carte enregistrée"}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                  {dict?.billing?.noCardsDesc || "Ajoutez une carte pour pouvoir payer vos projets rapidement et en toute sécurité"}
                </p>
              </div>
              <AddPaymentMethod 
                trigger={
                  <Button className="bg-blue-600 hover:bg-blue-700 mt-4">
                    <CreditCard className="h-4 w-4 mr-2" />
                    {dict?.billing?.addFirstCard || "Ajouter ma première carte"}
                  </Button>
                }
                onSuccess={handleSuccess}
                dict={dict}
                lang={lang}
              />
            </div>
          )}

          {/* Lien vers la page de gestion complète */}
          {paymentMethods.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <Link 
                href={`/${lang}/dashboard/payment-methods`}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 justify-center sm:justify-start"
              >
                {dict?.billing?.managePaymentMethods || "Gérer toutes mes méthodes de paiement"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique de facturation */}
      {invoices.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle>{dict?.billing?.history || "Historique de Facturation"}</CardTitle>
            <CardDescription>
              {dict?.billing?.historyDesc || "Consultez et téléchargez vos factures"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {invoice.id}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {invoice.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {invoice.amount}
                    </p>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800">
                      {invoice.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      {dict?.billing?.download || "Télécharger"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations de sécurité - Toujours afficher */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">
                  {dict?.billing?.securePayment || "Paiement sécurisé"}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {dict?.billing?.securePaymentDesc || "Toutes les transactions sont cryptées et conformes aux normes PCI DSS niveau 1"}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">
                  {dict?.billing?.dataProtection || "Données protégées"}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {dict?.billing?.dataProtectionDesc || "Vos informations bancaires ne sont jamais stockées sur nos serveurs"}
                </p>
              </div>
            </div>

            {/* Note importante */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-700 dark:text-amber-300">
                  {dict?.billing?.important || "Information importante"}
                </h4>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {dict?.billing?.importantDesc || "Les cartes sont validées avec une transaction de 1€ qui est immédiatement annulée."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}