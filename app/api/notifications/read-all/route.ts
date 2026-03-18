import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';

// PUT /api/notifications/read-all - Mark all notifications as read
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();

    const result = await db.collection('notifications').updateMany(
      {
        userId: session.user.id,
        status: 'UNREAD'
      },
      {
        $set: {
          status: 'READ',
          readAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Send real-time update
    // await sendSSEMessage({
    //   type: 'NOTIFICATION_UPDATED'
    // }, session.user.id);

    return NextResponse.json({ 
      success: true, 
      modifiedCount: result.modifiedCount 
    });

  } catch (error) {
    console.error('Error marking all as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
