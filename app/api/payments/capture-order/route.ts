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
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
    }

    // Vérifier que la transaction existe et est en attente
    const db = await getDatabase();
    const existingTransaction = await db.collection('payment_transactions').findOne({
      paypalOrderId: orderId,
      userId: new ObjectId(session.user.id),
      status: 'pending'
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaction not found or already processed' }, { status: 404 });
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
      
      // Update transaction status to failed
      await db.collection('payment_transactions').updateOne(
        { paypalOrderId: orderId },
        {
          $set: {
            status: 'failed',
            error: capture.message || capture.error_description,
            updatedAt: new Date(),
          },
        }
      );
      
      return NextResponse.json({ 
        error: 'Failed to capture payment',
        details: capture.message || capture.error_description 
      }, { status: 500 });
    }

    // Check if capture was successful
    const captureStatus = capture.status;
    if (captureStatus !== 'COMPLETED') {
      return NextResponse.json({ error: `Payment not completed: ${captureStatus}` }, { status: 400 });
    }

    const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    const payerEmail = capture.payer?.email_address;

    // Update transaction in database
    await db.collection('payment_transactions').updateOne(
      { paypalOrderId: orderId },
      {
        $set: {
          status: 'completed',
          paypalCaptureId: captureId,
          payerEmail: payerEmail,
          completedAt: new Date(),
          updatedAt: new Date(),
          metadata: capture,
        },
      }
    );

    // Create or update user subscription
    const plan = await db.collection('payment_plans').findOne({ id: existingTransaction.planId });
    
    if (plan) {
      const endDate = new Date();
      if (plan.interval === 'month') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan.interval === 'year') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1); // Default to month
      }

      // Upsert subscription
      await db.collection('user_subscriptions').updateOne(
        { userId: new ObjectId(session.user.id) },
        {
          $set: {
            userId: new ObjectId(session.user.id),
            planId: plan.id,
            planName: plan.name,
            status: 'active',
            startDate: new Date(),
            endDate,
            autoRenew: true,
            platformFee: plan.platformFee || 5,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      // Update user in database
      await db.collection('users').updateOne(
        { _id: new ObjectId(session.user.id) },
        {
          $set: {
            subscriptionPlan: plan.id,
            subscriptionStatus: 'active',
            subscriptionEndDate: endDate,
            platformFee: plan.platformFee || 5,
            updatedAt: new Date(),
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      captureId: captureId,
      status: captureStatus,
      transactionId: existingTransaction._id,
    });
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}