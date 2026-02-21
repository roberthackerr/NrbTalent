// components/projects/project-payment-modal.tsx
"use client"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  CreditCard,
  DollarSign,
  Shield,
  Lock,
  CheckCircle2,
  Loader2,
  Sparkles,
  Building,
  AlertCircle
} from "lucide-react"
import { AddPaymentMethod } from "@/components/payments/add-payment-method"

interface ProjectPaymentModalProps {
  project: any
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ProjectPaymentModal({ 
  project, 
  trigger, 
  open: externalOpen, 
  onOpenChange 
}: ProjectPaymentModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState(project.budget?.min || 0)

  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const setOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen

  // Récupérer les méthodes de paiement du client
  useEffect(() => {
    if (open) {
      fetchPaymentMethods()
    }
  }, [open])

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/stripe/payment-methods')
      const data = await response.json()
      
      if (data.success) {
        setPaymentMethods(data.paymentMethods || [])
        
        // Sélectionner la méthode par défaut
        const defaultMethod = data.paymentMethods.find((m: any) => m.isDefault)
        if (defaultMethod) {
          setSelectedMethod(defaultMethod.id)
        }
      }
    } catch (error) {
      console.error('Erreur récupération méthodes:', error)
    }
  }

  const handlePayment = async () => {
    if (!selectedMethod && paymentMethods.length > 0) {
      toast.error("Veuillez sélectionner une méthode de paiement")
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`/api/projects/${project._id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId: selectedMethod,
          amount: paymentAmount
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur de paiement')
      }

      if (data.success) {
        // Si paiement réussi immédiatement
        if (data.status === 'succeeded') {
          toast.success("🎉 Paiement effectué avec succès!")
          
          // Fermer le modal
          setOpen(false)
          
          // Rediriger vers la page de succès
          setTimeout(() => {
            window.location.href = data.redirectUrl || 
              `/dashboard/client/projects/payment/success?payment_intent=${data.paymentIntentId}&project=${project._id}`
          }, 1000)
          
        } 
        // Si action supplémentaire requise (3D Secure)
        else if (data.requiresAction) {
          toast.info("🔒 Vérification de sécurité requise...")
          
          try {
            // Charger Stripe.js dynamiquement
            const stripeModule = await import('@stripe/stripe-js')
            const stripe = await stripeModule.loadStripe(
              process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
            )
            
            if (!stripe) {
              throw new Error("Stripe n'a pas pu être initialisé")
            }

            if (data.clientSecret) {
              const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret)
              
              if (error) {
                throw new Error(error.message)
              }
              
              if (paymentIntent?.status === 'succeeded') {
                toast.success("✅ Vérification réussie! Paiement confirmé.")
                setOpen(false)
                
                // Rediriger vers la page de succès
                setTimeout(() => {
                  window.location.href = `/dashboard/client/projects/payment/success?payment_intent=${paymentIntent.id}&project=${project._id}`
                }, 1000)
              } else {
                toast.warning(`Statut: ${paymentIntent?.status}. Redirection...`)
                setOpen(false)
                window.location.reload()
              }
            }
          } catch (stripeError) {
            console.error('Erreur Stripe:', stripeError)
            toast.error("Erreur lors de la vérification")
          }
        }
        // Si paiement en cours de traitement
        else {
          toast.info("⏳ Paiement en cours de traitement...")
          setOpen(false)
          setTimeout(() => {
            window.location.reload()
          }, 3000)
        }
        
      } else {
        throw new Error(data.error || "Échec du paiement")
      }
      
    } catch (error) {
      console.error('❌ Erreur paiement:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors du paiement")
    } finally {
      setLoading(false)
    }
  }

  const calculateFees = () => {
    const platformFee = paymentAmount * 0.15 // 15% de commission
    const stripeFee = paymentAmount * 0.014 + 0.25 // 1.4% + 0.25€
    const total = paymentAmount + platformFee + stripeFee
    
    return {
      platformFee,
      stripeFee,
      total: parseFloat(total.toFixed(2))
    }
  }

  const fees = calculateFees()

  const handleSuccess = () => {
    toast.success("✅ Carte ajoutée avec succès!")
    fetchPaymentMethods()
  }

  return (
    <>
      {trigger && (
        <div onClick={() => setOpen(true)}>
          {trigger}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Paiement sécurisé
            </DialogTitle>
            <DialogDescription>
              Finalisez le paiement pour le projet "{project.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Récapitulatif projet */}
            <Card className="border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Projet</span>
                    <span className="font-semibold">{project.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Budget estimé</span>
                    <span className="font-semibold">
                      {project.budget?.min}€ - {project.budget?.max}€
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Montant à payer</span>
                    <span className="text-lg font-bold">{paymentAmount} €</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Méthodes de paiement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Méthode de paiement
                </CardTitle>
                <CardDescription>
                  Choisissez comment vous souhaitez payer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cartes existantes */}
                {paymentMethods.length > 0 ? (
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedMethod === method.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                        onClick={() => setSelectedMethod(method.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {method.brand?.toUpperCase() || 'CARTE'} •••• {method.last4}
                            </p>
                            <p className="text-sm text-gray-500">
                              Expire le {method.exp_month}/{method.exp_year}
                              {method.isDefault && " • Par défaut"}
                            </p>
                          </div>
                        </div>
                        {selectedMethod === method.id && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border-2 border-dashed rounded-lg">
                    <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Aucune carte enregistrée
                    </p>
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

                {/* Ajouter une autre carte */}
                {paymentMethods.length > 0 && (
                  <AddPaymentMethod 
                    trigger={
                      <Button variant="outline" className="w-full">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Ajouter une autre carte
                      </Button>
                    }
                    onSuccess={handleSuccess}
                  />
                )}
              </CardContent>
            </Card>

            {/* Détails des frais */}
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Détails des frais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Montant projet</span>
                  <span>{paymentAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    Commission plateforme (15%)
                  </span>
                  <span className="text-orange-600">+{fees.platformFee.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Frais Stripe (1.4% + 0.25€)
                  </span>
                  <span className="text-orange-600">+{fees.stripeFee.toFixed(2)} €</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total à payer</span>
                  <span>{fees.total.toFixed(2)} €</span>
                </div>
              </CardContent>
            </Card>

            {/* Avertissement si projet déjà payé */}
            {project.payment === 'paid' && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-300">
                    Ce projet a déjà été payé
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Vous ne pouvez pas payer plusieurs fois le même projet.
                  </p>
                </div>
              </div>
            )}

            {/* Bouton de paiement */}
            <Button
              onClick={handlePayment}
              disabled={loading || (paymentMethods.length > 0 && !selectedMethod) || project.payment === 'paid'}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Traitement en cours...
                </>
              ) : project.payment === 'paid' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Déjà payé
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Payer {fees.total.toFixed(2)} €
                </>
              )}
            </Button>

            {/* Message de sécurité */}
            <p className="text-xs text-center text-gray-500">
              En cliquant sur "Payer", vous acceptez nos conditions générales d'utilisation.
              Votre paiement est sécurisé par Stripe et conforme PCI DSS niveau 1.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}