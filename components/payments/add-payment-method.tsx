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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CreditCard } from "lucide-react"
import { toast } from "sonner"

declare global {
  interface Window {
    Stripe: any
  }
}

interface AddPaymentMethodProps {
  trigger: React.ReactNode
  onSuccess?: () => void
  dict?: any
  lang?: string
}

export function AddPaymentMethod({ trigger, onSuccess, dict, lang }: AddPaymentMethodProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cardholderName, setCardholderName] = useState('')
  const [isDefault, setIsDefault] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Créer la méthode de paiement via Stripe
      const stripe = (window as any).Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      
      // Simuler la création d'une carte (dans la réalité, utilisez Stripe Elements)
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: {
          number: '4242424242424242', // À remplacer par les vraies données
          exp_month: 12,
          exp_year: 2025,
          cvc: '123',
        },
        billing_details: {
          name: cardholderName,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      // 2. Envoyer à notre API
      const response = await fetch('/api/stripe/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          cardholderName,
          isDefault,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'ajout de la carte')
      }

      toast.success(dict?.billings?.success?.added || 'Carte ajoutée avec succès !')
      setOpen(false)
      setCardholderName('')
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Erreur ajout carte:', error)
      toast.error(error instanceof Error ? error.message : dict?.billings?.errors?.add || 'Erreur lors de l\'ajout de la carte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {dict?.billings?.addCard || 'Ajouter une carte'}
          </DialogTitle>
          <DialogDescription>
            {dict?.billings?.addCardDesc || 'Entrez les informations de votre carte bancaire'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cardholderName">
              {dict?.billings?.cardholderName || 'Nom du titulaire'}
            </Label>
            <Input
              id="cardholderName"
              placeholder="John Doe"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber">
              {dict?.billings?.cardNumber || 'Numéro de carte'}
            </Label>
            <Input
              id="cardNumber"
              placeholder="4242 4242 4242 4242"
              disabled
              className="bg-slate-50 dark:bg-slate-800"
            />
            <p className="text-xs text-slate-500">
              {dict?.billings?.testCard || 'Mode test: utilisez 4242 4242 4242 4242'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">
                {dict?.billings?.expiry || 'Date d\'expiration'}
              </Label>
              <Input
                id="expiry"
                placeholder="MM/AA"
                disabled
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                placeholder="123"
                disabled
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-slate-300"
            />
            <Label htmlFor="isDefault" className="text-sm">
              {dict?.billings?.setAsDefault || 'Définir comme carte par défaut'}
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              {dict?.common?.cancel || 'Annuler'}
            </Button>
            <Button
              type="submit"
              disabled={loading || !cardholderName}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {dict?.common?.adding || 'Ajout...'}
                </>
              ) : (
                dict?.billings?.add || 'Ajouter'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}