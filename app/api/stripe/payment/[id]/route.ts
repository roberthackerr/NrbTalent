// app/api/stripe/payment/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id: paymentIntentId } = await params

    // Récupérer le PaymentIntent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge', 'latest_charge.balance_transaction']
    })

    console.log('PaymentIntent:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata,
      latest_charge: paymentIntent.latest_charge
    })

    // Vérifier que l'utilisateur est bien le client
    if (paymentIntent.metadata?.userId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Formater la réponse (version sécurisée)
    const latestCharge = paymentIntent.latest_charge
    let receiptUrl = null
    let last4 = null
    let brand = null
    let networkFee = null
    let netAmount = null

    // Vérifier si latest_charge existe et est un objet
    if (latestCharge && typeof latestCharge === 'object') {
      const charge = latestCharge as any
      
      receiptUrl = charge.receipt_url || null
      
      if (charge.payment_method_details?.card) {
        last4 = charge.payment_method_details.card.last4 || null
        brand = charge.payment_method_details.card.brand || null
      }
      
      if (charge.balance_transaction) {
        networkFee = charge.balance_transaction.fee || null
        netAmount = charge.balance_transaction.net || null
      }
    }

    const paymentData = {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      createdAt: new Date(paymentIntent.created * 1000).toISOString(),
      description: paymentIntent.description || '',
      metadata: paymentIntent.metadata || {},
      receiptUrl,
      last4,
      brand,
      networkFee,
      netAmount
    }

    return NextResponse.json({
      success: true,
      payment: paymentData
    })

  } catch (error) {
    console.error('❌ Erreur récupération paiement:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          error: 'Erreur Stripe',
          message: error.message,
          code: error.code 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}