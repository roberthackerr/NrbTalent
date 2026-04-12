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

async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId, planName, amount, currency = 'EUR' } = await request.json();

    if (!planId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
            description: `Abonnement ${planName} - NRB Talents`,
            amount: {
              currency_code: currency,
              value: amount.toString(),
              breakdown: {
                item_total: {
                  currency_code: currency,
                  value: amount.toString(),
                },
              },
            },
            items: [
              {
                name: `Plan ${planName}`,
                description: `Abonnement ${planName} sur NRB Talents`,
                unit_amount: {
                  currency_code: currency,
                  value: amount.toString(),
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
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Store order in database
    const db = await getDatabase();
    await db.collection('payment_transactions').insertOne({
      userId: new ObjectId(session.user.id),
      planId,
      amount,
      currency,
      status: 'pending',
      paypalOrderId: order.id,
      createdAt: new Date(),
    });

    // Find approval link
    const approvalLink = order.links.find((link: any) => link.rel === 'approve');

    return NextResponse.json({
      orderId: order.id,
      approvalUrl: approvalLink?.href,
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}