// app/api/projects/[id]/pay/route.ts - VERSION FINALE
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    
    const { id: projectId } = await params
    const body = await request.json()
    const { paymentMethodId, amount } = body

    // 2. Valider l'ID du projet
    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: 'ID projet invalide' }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // 3. Récupérer le projet
    const project = await db.collection('projects').findOne({ 
      _id: new ObjectId(projectId) 
    })

    if (!project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 })
    }

    // 4. Vérifier que l'utilisateur est le client
    if (project.clientId.toString() !== userId.toString()) {
      return NextResponse.json({ 
        error: 'Seul le client peut payer ce projet' 
      }, { status: 403 })
    }

    // 5. Vérifier si le projet est déjà payé
    if (project.payment === "paid") {
      return NextResponse.json({ 
        error: 'Ce projet a déjà été payé' 
      }, { status: 400 })
    }

    // Vérifier s'il y a déjà une transaction en cours
    const existingTransaction = await db.collection('transactions').findOne({
      projectId: new ObjectId(projectId),
      status: { $in: ['succeeded', 'requires_confirmation', 'requires_action'] }
    })

    if (existingTransaction) {
      return NextResponse.json({
        error: 'Un paiement est déjà en cours pour ce projet'
      }, { status: 400 })
    }

    // 6. Récupérer l'utilisateur et son customer Stripe
    const user = await db.collection('users').findOne({ _id: userId })
    let customerId = user?.stripeCustomerId

    if (!customerId) {
      // Créer un nouveau customer Stripe
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name!,
        metadata: { userId: userId.toString() }
      })
      customerId = customer.id
      
      await db.collection('users').updateOne(
        { _id: userId },
        { $set: { stripeCustomerId: customer.id } }
      )
    }

    // 7. Si pas de paymentMethodId, utiliser la méthode par défaut
    let finalPaymentMethodId = paymentMethodId
    if (!finalPaymentMethodId && user?.defaultPaymentMethod) {
      finalPaymentMethodId = user.defaultPaymentMethod
    }

    if (!finalPaymentMethodId) {
      return NextResponse.json({ 
        error: 'Aucune méthode de paiement sélectionnée' 
      }, { status: 400 })
    }

    // 8. Calculer les montants
    const paymentAmount = amount || project.budget?.min || 100
    const platformFee = Math.round(paymentAmount * 0.15 * 100) // 15% en centimes
    const totalAmount = Math.round(paymentAmount * 100)

    // 9. Créer l'URL de retour
    const origin = request.headers.get('origin') || 'http://localhost:3000'
    const returnUrl = `${origin}/dashboard/client/projects/payment/success?project=${projectId}`

    // 10. Créer le Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'eur',
      customer: customerId,
      payment_method: finalPaymentMethodId,
      confirm: true,
      off_session: false,
      return_url: returnUrl, // ⚠️ OBLIGATOIRE
      metadata: {
        projectId: projectId,
        projectTitle: project.title,
        userId: userId.toString(),
        userEmail: session.user.email!,
        type: 'project_payment',
        platformFee: platformFee.toString()
      },
      description: `Paiement pour le projet: ${project.title}`,
    })

    console.log('✅ PaymentIntent créé:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      requiresAction: paymentIntent.status === 'requires_action'
    })

    // 11. Si le paiement nécessite une action (3D Secure)
    if (paymentIntent.status === 'requires_action') {
      // Sauvegarder la transaction comme "en attente"
      const pendingTransaction = {
        _id: new ObjectId(),
        projectId: new ObjectId(projectId),
        clientId: userId,
        freelancerId: project.freelancerId ? new ObjectId(project.freelancerId) : null,
        amount: paymentAmount,
        currency: 'eur',
        stripePaymentIntentId: paymentIntent.id,
        stripePaymentMethodId: finalPaymentMethodId,
        status: 'pending',
        platformFee: paymentAmount * 0.15,
        netAmount: paymentAmount * 0.85,
        type: 'project_payment',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('transactions').insertOne(pendingTransaction)

      return NextResponse.json({
        success: true,
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        redirectUrl: returnUrl
      })
    }

    // 12. Si le paiement a ÉCHOUÉ
    if (paymentIntent.status === 'requires_payment_method' || 
        paymentIntent.status === 'canceled' ||
        paymentIntent.status === 'requires_confirmation') {
      return NextResponse.json({
        success: false,
        status: paymentIntent.status,
        error: `Échec du paiement: ${paymentIntent.status}`
      })
    }

    // 13. Si le paiement est RÉUSSI
    if (paymentIntent.status === 'succeeded') {
      // Sauvegarder la transaction
      const transaction = {
        _id: new ObjectId(),
        projectId: new ObjectId(projectId),
        clientId: userId,
        freelancerId: project.freelancerId ? new ObjectId(project.freelancerId) : null,
        amount: paymentAmount,
        currency: 'eur',
        stripePaymentIntentId: paymentIntent.id,
        stripePaymentMethodId: finalPaymentMethodId,
        status: 'succeeded',
        platformFee: paymentAmount * 0.15,
        netAmount: paymentAmount * 0.85,
        type: 'project_payment',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('transactions').insertOne(transaction)

      // Mettre à jour le projet
      await db.collection('projects').updateOne(
        { _id: new ObjectId(projectId) },
        { 
          $set: { 
            payment: 'paid',
            paidAmount: paymentAmount,
            paymentDate: new Date(),
            paymentTransactionId: transaction._id,
            updatedAt: new Date()
          },
          $push: {
            paymentHistory: {
              amount: paymentAmount,  
              date: new Date(),
              transactionId: transaction._id,
              status: 'completed'
            }
          }
        }
      )

      // Mettre à jour les stats utilisateur
      await db.collection('users').updateOne(
        { _id: userId },
        {
          $inc: {
            'paymentStats.totalSpent': paymentAmount,
            'paymentStats.totalProjects': 1,
            'paymentStats.successfulPayments': 1
          },
          $set: {
            'paymentStats.lastPaymentDate': new Date(),
            updatedAt: new Date()
          }
        }
      )

      // Réponse de succès
      return NextResponse.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        transactionId: transaction._id,
        redirectUrl: `${origin}/dashboard/client/projects/payment/success?payment_intent=${paymentIntent.id}&project=${projectId}`
      })
    }

    // 14. Autres statuts (processing)
    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      message: 'Paiement en cours de traitement',
      redirectUrl: returnUrl
    })

  } catch (error) {
    console.error('❌ Erreur paiement projet:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          error: 'Erreur de paiement',
          stripeError: error.message
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}