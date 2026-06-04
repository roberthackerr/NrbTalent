// components/payments/payment-methods.tsx
"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  CreditCard,
  Bitcoin,
  Building2,
  Smartphone,
  Landmark,
  Wallet,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Copy,
  QrCode
} from "lucide-react"
import Image from "next/image"
import { loadStripe } from '@stripe/stripe-js'

interface PaymentMethod {
  id: string
  type: 'stripe' | 'paypal' | 'crypto' | 'bank_transfer' | 'mobile_money' | 'wave' | 'orange_money'
  name: string
  icon: any
  enabled: boolean
  config?: any
}

interface PaymentMethodSelectorProps {
  amount: number
  currency: string
  projectId?: string
  onSuccess: (payment: any) => void
  onError: (error: string) => void
}

// Configuration des méthodes de paiement
const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'stripe',
    type: 'stripe',
    name: 'Carte bancaire',
    icon: CreditCard,
    enabled: true
  },
  {
    id: 'paypal',
    type: 'paypal',
    name: 'PayPal',
    icon: () => (
      <Image src="/paypal-icon.svg" alt="PayPal" width={24} height={24} />
    ),
    enabled: true
  },
  {
    id: 'crypto',
    type: 'crypto',
    name: 'Cryptomonnaies',
    icon: Bitcoin,
    enabled: true,
    config: {
      currencies: ['BTC', 'ETH', 'USDT', 'BNB', 'SOL']
    }
  },
  {
    id: 'bank_transfer',
    type: 'bank_transfer',
    name: 'Virement bancaire',
    icon: Landmark,
    enabled: true
  },
  {
    id: 'mobile_money',
    type: 'mobile_money',
    name: 'Mobile Money',
    icon: Smartphone,
    enabled: true,
    config: {
      providers: ['MTN Money', 'Orange Money', 'Airtel Money', 'Moov Money']
    }
  },
  {
    id: 'wave',
    type: 'wave',
    name: 'Wave',
    icon: Wallet,
    enabled: true
  },
  {
    id: 'orange_money',
    type: 'orange_money',
    name: 'Orange Money',
    icon: Smartphone,
    enabled: true
  }
]

export function PaymentMethodSelector({ amount, currency, projectId, onSuccess, onError }: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('stripe')
  const [loading, setLoading] = useState(false)
  const [showCryptoModal, setShowCryptoModal] = useState(false)
  const [cryptoAddress, setCryptoAddress] = useState('')
  const [bankDetails, setBankDetails] = useState<any>(null)
  const [mobileNumber, setMobileNumber] = useState('')
  const [mobileProvider, setMobileProvider] = useState('')

  const handlePayment = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: selectedMethod,
          amount,
          currency,
          projectId,
          metadata: {
            mobileNumber,
            mobileProvider,
            cryptoAddress
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de paiement')
      }

      // Rediriger selon la méthode
      switch (selectedMethod) {
        case 'stripe':
          if (data.clientSecret) {
            // Gérer Stripe
            const stripe = await loadStripe()
            const { error } = await stripe.confirmCardPayment(data.clientSecret)
            if (error) throw new Error(error.message)
          }
          break
        
        case 'paypal':
          if (data.approvalUrl) {
            window.location.href = data.approvalUrl
          }
          break
        
        case 'crypto':
          setCryptoAddress(data.cryptoAddress)
          setShowCryptoModal(true)
          break
        
        case 'bank_transfer':
          setBankDetails(data.bankDetails)
          break
        
        default:
          onSuccess(data)
          toast.success("Paiement initié avec succès")
      }
      
    } catch (error) {
      console.error('Payment error:', error)
      onError(error instanceof Error ? error.message : 'Erreur de paiement')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Adresse copiée dans le presse-papier")
  }

  return (
    <div className="space-y-6">
      {/* Sélection de la méthode */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PAYMENT_METHODS.filter(m => m.enabled).map((method) => {
          const Icon = method.icon
          return (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                ${selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-800 hover:border-blue-300'
                }
              `}
            >
              {typeof Icon === 'function' && Icon.name === 'Icon' ? (
                <Icon className="h-6 w-6" />
              ) : (
                Icon
              )}
              <span className="text-sm font-medium">{method.name}</span>
            </button>
          )
        })}
      </div>

      {/* Formulaire spécifique selon méthode */}
      {selectedMethod === 'mobile_money' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label>Opérateur</Label>
                <select
                  className="w-full mt-1 p-2 border rounded-lg"
                  value={mobileProvider}
                  onChange={(e) => setMobileProvider(e.target.value)}
                >
                  <option value="">Sélectionner un opérateur</option>
                  <option value="mtn">MTN Money</option>
                  <option value="orange">Orange Money</option>
                  <option value="airtel">Airtel Money</option>
                  <option value="moov">Moov Money</option>
                </select>
              </div>
              <div>
                <Label>Numéro de téléphone</Label>
                <Input
                  type="tel"
                  placeholder="+229 01 XX XX XX"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Détails virement bancaire */}
      {selectedMethod === 'bank_transfer' && bankDetails && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h4 className="font-semibold">Coordonnées bancaires</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Banque:</span>
                <span className="font-medium">{bankDetails.bank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Titulaire:</span>
                <span className="font-medium">{bankDetails.accountHolder}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">IBAN:</span>
                <span className="font-mono text-xs">{bankDetails.iban}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">BIC/SWIFT:</span>
                <span className="font-mono">{bankDetails.bic}</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-2"
              onClick={() => copyToClipboard(`${bankDetails.iban}\n${bankDetails.bic}`)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copier les coordonnées
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bouton de paiement */}
      <Button
        onClick={handlePayment}
        disabled={loading}
        className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-purple-600"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Traitement...
          </>
        ) : (
          <>
            Payer {amount} {currency}
          </>
        )}
      </Button>

      {/* Modal Crypto */}
      <Dialog open={showCryptoModal} onOpenChange={setShowCryptoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paiement en Cryptomonnaie</DialogTitle>
            <DialogDescription>
              Envoyez le montant exact à l'adresse ci-dessous
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Adresse de réception</p>
              <code className="text-xs break-all font-mono bg-white dark:bg-gray-900 p-2 rounded block">
                {cryptoAddress}
              </code>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => copyToClipboard(cryptoAddress)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copier
              </Button>
            </div>

            <div className="text-center">
              <QrCode className="h-32 w-32 mx-auto" />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                ⚠️ Important: Envoyez exactement {amount} {currency}. 
                Une fois le paiement confirmé (environ 10-30 minutes), 
                votre transaction sera validée.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}