import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/notifications/[id] - Get specific notification
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();

    const notification = await db.collection('notifications').findOne({
      _id: new ObjectId(params.id),
      userId: session.user.id
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json(notification);

  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();

    const result = await db.collection('notifications').deleteOne({
      _id: new ObjectId(params.id),
      userId: session.user.id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Send real-time update
    // await sendSSEMessage({
    //   type: 'NOTIFICATION_UPDATED'
    // }, session.user.id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
