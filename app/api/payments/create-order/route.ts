// app/api/payments/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_API_URL = PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Vérification des variables d'environnement
if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.error('❌ PayPal credentials missing!');
}

async function getPayPalAccessToken(): Promise<string> {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get access token: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting PayPal access token:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, planName, amount, currency = 'EUR' } = body;

    // Validation
    if (!planId || !amount) {
      return NextResponse.json({ error: 'Missing required fields: planId and amount' }, { status: 400 });
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Vérifier que l'utilisateur n'a pas déjà un abonnement actif
    const db = await getDatabase();
    const existingSubscription = await db.collection('user_subscriptions').findOne({
      userId: new ObjectId(session.user.id),
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (existingSubscription) {
      return NextResponse.json({ error: 'You already have an active subscription' }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: planId,
            description: `Subscription ${planName} - NRB Talents`,
            custom_id: session.user.id,
            amount: {
              currency_code: currency,
              value: amount.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: currency,
                  value: amount.toFixed(2),
                },
              },
            },
            items: [
              {
                name: `${planName} Plan`,
                description: `Monthly subscription to ${planName} plan on NRB Talents`,
                unit_amount: {
                  currency_code: currency,
                  value: amount.toFixed(2),
                },
                quantity: '1',
                category: 'DIGITAL_GOODS',
              },
            ],
          },
        ],
        application_context: {
          brand_name: 'NRB Talents',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXTAUTH_URL}/payment/success`,
          cancel_url: `${process.env.NEXTAUTH_URL}/payment/cancel`,
        },
      }),
    });

    const order = await response.json();

    if (!response.ok) {
      console.error('PayPal order creation failed:', order);
      return NextResponse.json({ 
        error: 'Failed to create PayPal order',
        details: order.message || order.error_description 
      }, { status: 500 });
    }

    // Find approval link
    const approvalLink = order.links?.find((link: any) => link.rel === 'approve');
    
    if (!approvalLink) {
      return NextResponse.json({ error: 'No approval link found' }, { status: 500 });
    }

    // Store order in database
    await db.collection('payment_transactions').insertOne({
      userId: new ObjectId(session.user.id),
      planId,
      planName,
      amount,
      currency,
      status: 'pending',
      paypalOrderId: order.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      approvalUrl: approvalLink.href,
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}