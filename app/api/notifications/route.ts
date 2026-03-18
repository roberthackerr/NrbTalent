import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const status = searchParams.get('status');

    let query: any = { userId: session.user.id };
    
    if (status && status !== 'ALL') {
      query.status = status;
    }

    const notifications = await db
      .collection('notifications')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();

    const total = await db.collection('notifications').countDocuments(query);
    const unreadCount = await db.collection('notifications').countDocuments({ 
      userId: session.user.id, 
      status: 'UNREAD' 
    });

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
      hasMore: total > skip + limit
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
// /app/api/notifications/route.ts - VERSION CORRIGÉE
// /app/api/notifications/route.ts - VERSION MIXTE
export async function POST(request: NextRequest) {
  console.log('🔔 [NOTIF API] Creating notification...')
  
  try {
    const session = await getServerSession(authOptions);
    
    // Vérifier si c'est un appel interne (avec header spécial)
    const isInternalCall = request.headers.get('x-internal-call') === 'true'
    const internalApiKey = request.headers.get('x-api-key')
    
    console.log('🔔 [NOTIF API] Auth check:', {
      hasSession: !!session?.user?.id,
      isInternalCall,
      hasInternalKey: !!internalApiKey
    })

    // Si c'est un appel interne, vérifier la clé API
    if (isInternalCall) {
      const validApiKey = process.env.INTERNAL_API_KEY || 'default-internal-key'
      if (internalApiKey !== validApiKey) {
        console.log('🔔 [NOTIF API] ❌ Invalid internal API key')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      console.log('🔔 [NOTIF API] ✅ Valid internal call')
    }
    // Sinon, vérifier la session normale
    else if (!session?.user?.id) {
      console.log('🔔 [NOTIF API] ❌ No session for regular call')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDatabase();
    const body = await request.json();
    
    console.log('🔔 [NOTIF API] Request body:', {
      userId: body.userId,
      title: body.title,
      category: body.category
    })

    // Validation
    if (!body.userId || !body.category || !body.title || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convertir userId
    const userIdObj = new ObjectId(body.userId);

    // Créer la notification
    const notification = {
      _id: new ObjectId(),
      userId: userIdObj,
      category: body.category,
      priority: body.priority || 'MEDIUM',
      title: body.title,
      message: body.message,
      data: body.data || {},
      actionUrl: body.actionUrl,
      image: body.image,
      status: 'UNREAD',
      createdAt: new Date(),
      updatedAt: new Date(),
      // Ajouter info sur qui a créé la notification
      //createdBy: isInternalCall ? 'internal_api' : session?.user?.id
    };

    await db.collection('notifications').insertOne(notification);

    console.log('🔔 [NOTIF API] ✅ Notification created:', notification._id.toString())

    return NextResponse.json({
      ...notification,
      _id: notification._id.toString(),
      userId: notification.userId.toString()
    }, { status: 201 });

  } catch (error: any) {
    console.error('🔔 [NOTIF API] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}