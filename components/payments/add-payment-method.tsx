// components/payments/add-payment-method.tsx
"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { 
  CreditCard, 
  Lock, 
  Shield,
  Loader2,
  CheckCircle2
} from "lucide-react"
import { useElements, useStripe, CardElement } from "@stripe/react-stripe-js"

interface AddPaymentMethodProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function AddPaymentMethod({ trigger, onSuccess }: AddPaymentMethodProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cardholderName, setCardholderName] = useState("")
  
  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements) {
      toast.error("Stripe n'est pas initialisé")
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      toast.error("Veuillez remplir les informations de la carte")
      return
    }

    if (!cardholderName.trim()) {
      toast.error("Veuillez entrer le nom sur la carte")
      return
    }

    setLoading(true)

    try {
      // 1. Créer un PaymentMethod avec la carte
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardholderName,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      // 2. Envoyer au backend pour lier au client Stripe
      const response = await fetch('/api/stripe/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          cardholderName,
          isDefault: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'ajout de la carte')
      }

      toast.success("Carte ajoutée avec succès !")
      setOpen(false)
      onSuccess?.()
      
    } catch (error) {
      console.error('Erreur ajout carte:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'ajout de la carte")
    } finally {
      setLoading(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        padding: '10px 12px',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <CreditCard className="h-4 w-4 mr-2" />
            Ajouter une carte
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Ajouter une carte de paiement
          </DialogTitle>
          <DialogDescription>
            Votre carte sera sauvegardée de manière sécurisée pour les paiements futurs
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations carte */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardholderName">Nom sur la carte</Label>
              <Input
                id="cardholderName"
                placeholder="Ex: JEAN DUPONT"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Détails de la carte</Label>
              <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900">
                <CardElement options={cardElementOptions} />
              </div>
            </div>
          </div>

          {/* Sécurité */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-blue-700 dark:text-blue-300">
                Sécurité maximale
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Vos informations bancaires sont chiffrées et ne sont jamais stockées sur nos serveurs.
                Conforme PCI DSS niveau 1.
              </p>
            </div>
          </div>

          {/* Bouton de soumission */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading || !stripe}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Ajouter cette carte
              </>
            )}
          </Button>

          {/* Cartes acceptées */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">
              Cartes acceptées
            </p>
            <div className="flex justify-center gap-2">
              <div className="text-2xl">💳</div>
              <div className="text-2xl">🔷</div>
              <div className="text-2xl">🟡</div>
              <div className="text-2xl">🔶</div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}