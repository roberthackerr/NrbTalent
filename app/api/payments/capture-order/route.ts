// app/api/payments/capture-order/route.ts
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

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();

    // Capture the order
    const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const capture = await response.json();

    if (!response.ok) {
      console.error('PayPal capture failed:', capture);
      return NextResponse.json({ error: 'Failed to capture payment' }, { status: 500 });
    }

    // Update transaction in database
    const db = await getDatabase();
    const transaction = await db.collection('payment_transactions').findOneAndUpdate(
      { paypalOrderId: orderId },
      {
        $set: {
          status: 'completed',
          paypalCaptureId: capture.id,
          payerEmail: capture.payer?.email_address,
          completedAt: new Date(),
          metadata: capture,
        },
      },
      { returnDocument: 'after' }
    );

    // Create or update user subscription
    const plan = await db.collection('payment_plans').findOne({ id: transaction?.planId });
    
    if (plan && transaction) {
      const endDate = new Date();
      if (plan.interval === 'month') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      await db.collection('user_subscriptions').updateOne(
        { userId: new ObjectId(session.user.id) },
        {
          $set: {
            userId: new ObjectId(session.user.id),
            planId: plan.id,
            status: 'active',
            startDate: new Date(),
            endDate,
            autoRenew: true,
            platformFee: plan.platformFee,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      // Update user role and permissions
      await db.collection('users').updateOne(
        { _id: new ObjectId(session.user.id) },
        {
          $set: {
            subscriptionPlan: plan.id,
            subscriptionStatus: 'active',
            subscriptionEndDate: endDate,
            platformFee: plan.platformFee,
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      captureId: capture.id,
      status: capture.status,
    });
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}