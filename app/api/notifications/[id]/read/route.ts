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

// PUT /api/notifications/[id]/read - Mark notification as read
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();

    const result = await db.collection('notifications').findOneAndUpdate(
      {
        _id: new ObjectId(params.id),
        userId: session.user.id
      },
      {
        $set: {
          status: 'READ',
          readAt: new Date(),
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Send real-time update
    // await sendSSEMessage({
    //   type: 'NOTIFICATION_UPDATED'
    // }, session.user.id);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
