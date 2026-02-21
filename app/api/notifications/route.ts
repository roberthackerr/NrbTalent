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
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const body = await request.json();
    const { userId, category, priority, title, message, data, actionUrl, image } = body;

    // Check if user has preferences to receive this type of notification
    const preferences = await db.collection('notification_preferences').findOne({ userId });
    if (preferences && !preferences.categories?.[category]) {
      return NextResponse.json(
        { error: 'User has disabled this notification category' }, 
        { status: 400 }
      );
    }

    const notification = {
      _id: new ObjectId(),
      userId,
      category,
      priority,
      title,
      message,
      data,
      actionUrl,
      image,
      status: 'UNREAD',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('notifications').insertOne(notification);

    // Send real-time update via SSE (you'll need to implement this)
    // await sendSSEMessage({
    //   type: 'NEW_NOTIFICATION',
    //   notification
    // }, userId);

    return NextResponse.json(notification);

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
