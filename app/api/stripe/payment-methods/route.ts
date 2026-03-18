// app/api/stripe/payment-methods/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// GET - Récupérer les cartes d'un client
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Récupérer l'utilisateur
    const user = await db.collection('users').findOne({ _id: userId })
    
    if (!user?.stripeCustomerId) {
      return NextResponse.json({
        success: true,
        paymentMethods: [],
        hasPaymentMethods: false
      })
    }

    // Récupérer les cartes de Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    })

    // Formater la réponse
    const formattedMethods = paymentMethods.data.map(method => ({
      id: method.id,
      brand: method.card?.brand || 'unknown',
      last4: method.card?.last4 || '****',
      exp_month: method.card?.exp_month,
      exp_year: method.card?.exp_year,
      isDefault: method.id === user.defaultPaymentMethod,
      addedAt: new Date(method.created * 1000),
      cardholderName: method.billing_details?.name || ''
    }))

    return NextResponse.json({
      success: true,
      paymentMethods: formattedMethods,
      hasPaymentMethods: formattedMethods.length > 0,
      customerId: user.stripeCustomerId
    })

  } catch (error) {
    console.error('Erreur récupération cartes:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST - Ajouter une carte
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { paymentMethodId, cardholderName, isDefault = false } = await request.json()
    
    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID requis' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Récupérer ou créer le client Stripe
    const user = await db.collection('users').findOne({ _id: userId })
    let customerId = user?.stripeCustomerId

    if (!customerId) {
      // Créer un nouveau client Stripe
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name!,
        metadata: { userId: userId.toString() }
      })
      customerId = customer.id
      
      // Sauvegarder l'ID customer
      await db.collection('users').updateOne(
        { _id: userId },
        { $set: { stripeCustomerId: customer.id } }
      )
    }

    // Attacher la carte au client
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })

    // Mettre à jour le nom sur la carte
    if (cardholderName) {
      await stripe.paymentMethods.update(paymentMethodId, {
        billing_details: {
          name: cardholderName,
        },
      })
    }

    // Définir comme méthode par défaut si demandé
    if (isDefault) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })
      
      await db.collection('users').updateOne(
        { _id: userId },
        { $set: { defaultPaymentMethod: paymentMethodId } }
      )
    }

    // Sauvegarder dans MongoDB
    await db.collection('users').updateOne(
      { _id: userId },
      {
        $push: {
          paymentMethods: {
            id: paymentMethod.id,
            brand: paymentMethod.card?.brand || 'unknown',
            last4: paymentMethod.card?.last4 || '****',
            exp_month: paymentMethod.card?.exp_month,
            exp_year: paymentMethod.card?.exp_year,
            isDefault,
            addedAt: new Date(),
            cardholderName: cardholderName || ''
          }
        },
        $set: { updatedAt: new Date() }
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Carte ajoutée avec succès',
      paymentMethod: {
        id: paymentMethod.id,
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4
      }
    })

  } catch (error) {
    console.error('Erreur ajout carte:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une carte
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const paymentMethodId = searchParams.get('id')
    
    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID requis' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Récupérer l'utilisateur
    const user = await db.collection('users').findOne({ _id: userId })
    
    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Aucun compte Stripe trouvé' },
        { status: 404 }
      )
    }

    // Détacher la carte de Stripe
    await stripe.paymentMethods.detach(paymentMethodId)

    // Supprimer de MongoDB
    await db.collection('users').updateOne(
      { _id: userId },
      {
        $pull: { paymentMethods: { id: paymentMethodId } },
        $set: { updatedAt: new Date() }
      }
    )

    // Si c'était la carte par défaut, en choisir une autre
    if (user.defaultPaymentMethod === paymentMethodId) {
      const remainingCards = (user.paymentMethods || []).filter(
        (card: any) => card.id !== paymentMethodId
      )
      
      if (remainingCards.length > 0) {
        const newDefault = remainingCards[0].id
        await stripe.customers.update(user.stripeCustomerId, {
          invoice_settings: {
            default_payment_method: newDefault,
          },
        })
        
        await db.collection('users').updateOne(
          { _id: userId },
          { $set: { defaultPaymentMethod: newDefault } }
        )
      } else {
        await db.collection('users').updateOne(
          { _id: userId },
          { $unset: { defaultPaymentMethod: "" } }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Carte supprimée avec succès'
    })

  } catch (error) {
    console.error('Erreur suppression carte:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}