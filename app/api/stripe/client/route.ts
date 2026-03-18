// app/api/stripe/client/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Créer ou récupérer un client Stripe
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const db = await getDatabase();
    const userId = new ObjectId((session.user as any).id);

    // Vérifier si l'utilisateur existe
    const user = await db.collection('users').findOne({ _id: userId });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Si l'utilisateur a déjà un customer Stripe
    if (user.stripeCustomerId) {
      // Récupérer les infos du customer
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      
      return NextResponse.json({
        success: true,
        customerId: user.stripeCustomerId,
        customer: customer,
        message: 'Client Stripe existant récupéré'
      });
    }

    // Créer un nouveau customer Stripe
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      phone: user.phone,
      metadata: {
        userId: userId.toString(),
        userRole: user.role,
        platform: 'nrbTalents'
      }
    });

    // Mettre à jour l'utilisateur avec le customer ID
    await db.collection('users').updateOne(
      { _id: userId },
      { 
        $set: { 
          stripeCustomerId: customer.id,
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({
      success: true,
      customerId: customer.id,
      customer: customer,
      message: 'Client Stripe créé avec succès'
    });

  } catch (error) {
    console.error('Erreur création client Stripe:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// Récupérer les méthodes de paiement d'un client
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const db = await getDatabase();
    const userId = new ObjectId((session.user as any).id);

    // Récupérer l'utilisateur
    const user = await db.collection('users').findOne({ _id: userId });
    
    if (!user?.stripeCustomerId) {
      return NextResponse.json({
        success: true,
        paymentMethods: [],
        customerId: null,
        message: 'Aucune méthode de paiement'
      });
    }

    // Récupérer les méthodes de paiement de Stripe
    const paymentMethods = await stripe.customers.listPaymentMethods(
      user.stripeCustomerId,
      { type: 'card' }
    );

    // Formater la réponse
    const formattedMethods = paymentMethods.data.map(method => ({
      id: method.id,
      brand: method.card?.brand || 'unknown',
      last4: method.card?.last4 || '****',
      exp_month: method.card?.exp_month,
      exp_year: method.card?.exp_year,
      isDefault: false, // À gérer selon ta logique
      addedAt: new Date(method.created * 1000)
    }));

    return NextResponse.json({
      success: true,
      paymentMethods: formattedMethods,
      customerId: user.stripeCustomerId,
      hasPaymentMethods: formattedMethods.length > 0
    });

  } catch (error) {
    console.error('Erreur récupération méthodes de paiement:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}