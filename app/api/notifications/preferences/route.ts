import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/notifications/preferences - Get user preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();

    let preferences = await db.collection('notification_preferences').findOne({ 
      userId: session.user.id 
    });
    if (!preferences) {
      // Create default preferences if they don't exist
      preferences = {
        userId: session.user.id,
        _id: new ObjectId(),
        email: true,
        push: true,
        inApp: true,
        categories: {
          MESSAGE: true,
          ORDER: true,
          REVIEW: true,
          SYSTEM: true,
          PROMOTION: true,
          SECURITY: true,
          COMMUNITY: true,
          ACHIEVEMENT: true
        },
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        }
      };
      await db.collection('notification_preferences').insertOne(preferences);
    }

    return NextResponse.json({ preferences });

  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// PUT /api/notifications/preferences - Update user preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const body = await request.json();

    const preferences = await db.collection('notification_preferences').findOneAndUpdate(
      { userId: session.user.id },
      { $set: body },
      { 
        returnDocument: 'after',
        upsert: true 
      }
    );

    return NextResponse.json({ preferences });

  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
