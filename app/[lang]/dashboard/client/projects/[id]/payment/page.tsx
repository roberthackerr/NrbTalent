"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard, Shield, CheckCircle2 } from "lucide-react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function PaymentForm({ clientSecret, amount, platformFee, freelancerAmount }: any) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError("")

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/client/projects`,
      },
    })

    if (submitError) {
      setError(submitError.message || "Payment failed")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Payment Summary</h3>
            <p className="text-sm text-gray-400">Secure payment via Stripe</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Project Amount</span>
            <span className="text-white font-medium">${amount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Platform Fee (10%)</span>
            <span className="text-white font-medium">${platformFee}</span>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
          <div className="flex justify-between">
            <span className="text-white font-semibold">Freelancer Receives</span>
            <span className="text-cyan-400 font-bold text-lg">${freelancerAmount}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <PaymentElement />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">{error}</div>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-900/30 rounded-lg p-4">
        <Shield className="w-4 h-4 text-cyan-400" />
        <span>Your payment is secured by Stripe with 256-bit SSL encryption</span>
      </div>

      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Pay ${amount}
          </>
        )}
      </Button>
    </form>
  )
}

export default function PaymentPage() {
  const params = useParams()
  const [clientSecret, setClientSecret] = useState("")
  const [paymentData, setPaymentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const res = await fetch("/api/payments/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationId: params.id }),
        })
        const data = await res.json()
        setClientSecret(data.clientSecret)
        setPaymentData(data)
      } catch (error) {
        console.error("Payment setup error:", error)
      } finally {
        setLoading(false)
      }
    }

    createPaymentIntent()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Complete Payment</h1>
          <p className="text-gray-400">Secure your freelancer and start your project</p>
        </div>

        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm {...paymentData} clientSecret={clientSecret} />
          </Elements>
        )}
      </div>
    </div>
  )
}
