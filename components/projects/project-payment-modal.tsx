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
import { PaymentMethodSelector } from '@/components/payments/payment-methods'

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
  const [showPaymentSelector, setShowPaymentSelector] = useState(false)

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

  const handlePaymentSuccess = (payment: any) => {
    toast.success("🎉 Paiement effectué avec succès!")
    setOpen(false)
    
    // Redirection après succès
    setTimeout(() => {
      window.location.href = `/dashboard/client/projects/payment/success?payment_id=${payment.paymentId}&project=${project._id}`
    }, 1000)
  }

  const handlePaymentError = (error: string) => {
    toast.error(error)
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

            {/* Section des méthodes de paiement */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Méthode de paiement</h3>
                {!showPaymentSelector && paymentMethods.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowPaymentSelector(true)}
                  >
                    Changer de méthode
                  </Button>
                )}
              </div>

              {!showPaymentSelector && paymentMethods.length > 0 ? (
                // Afficher les cartes existantes
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedMethod === method.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-800 hover:border-blue-300'
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

                  {/* Bouton de paiement avec carte existante */}
                  <Button
                    onClick={async () => {
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
                          if (data.status === 'succeeded') {
                            toast.success("🎉 Paiement effectué avec succès!")
                            setOpen(false)
                            setTimeout(() => {
                              window.location.href = data.redirectUrl || 
                                `/dashboard/client/projects/payment/success?payment_intent=${data.paymentIntentId}&project=${project._id}`
                            }, 1000)
                          } else if (data.requiresAction && data.clientSecret) {
                            const stripeModule = await import('@stripe/stripe-js')
                            const stripe = await stripeModule.loadStripe(
                              process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
                            )
                            
                            if (stripe) {
                              const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret)
                              if (error) throw new Error(error.message)
                              if (paymentIntent?.status === 'succeeded') {
                                toast.success("✅ Paiement confirmé!")
                                setOpen(false)
                                setTimeout(() => {
                                  window.location.href = `/dashboard/client/projects/payment/success?payment_intent=${paymentIntent.id}&project=${project._id}`
                                }, 1000)
                              }
                            }
                          }
                        }
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Erreur lors du paiement")
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading || !selectedMethod || project.payment === 'paid'}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>Payer {fees.total.toFixed(2)} €</>
                    )}
                  </Button>

                  {/* Ajouter une autre carte */}
                  <AddPaymentMethod 
                    trigger={
                      <Button variant="outline" className="w-full">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Ajouter une autre carte
                      </Button>
                    }
                    onSuccess={handleSuccess}
                  />
                </div>
              ) : (
                // Afficher le sélecteur de méthodes de paiement
                <>
                  <PaymentMethodSelector
                    amount={fees.total}
                    currency="EUR"
                    projectId={project._id}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                  
                  {paymentMethods.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setShowPaymentSelector(false)}
                    >
                      ← Utiliser une carte enregistrée
                    </Button>
                  )}
                </>
              )}
            </div>

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
                    Frais de transaction
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

            {/* Message de sécurité */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Shield className="h-3 w-3" />
              <span>Paiement 100% sécurisé</span>
              <Lock className="h-3 w-3 ml-2" />
              <span>Conforme PCI DSS</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}