import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// POST /api/notifications/broadcast - Send notification to multiple users
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admins to broadcast
    if (!session?.user?.id) { // Remove role check for now, add later
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const body = await request.json();
    const { template, userFilter } = body;

    // In a real app, you'd query users based on the filter
    // For now, we'll simulate with a list of user IDs
    let userIds: string[] = [];
    
    if (userFilter?.role) {
      // Query users by role from your User model
      // const users = await db.collection('users').find({ role: userFilter.role }).toArray();
      // userIds = users.map(user => user.id);
      userIds = [session.user.id]; // Example - just send to current user for now
    } else {
      // Broadcast to all users (be careful in production!)
      // const users = await db.collection('users').find({}).toArray();
      // userIds = users.map(user => user.id);
      userIds = [session.user.id]; // Example - just send to current user for now
    }

    const results = [];
    let sentCount = 0;

    for (const userId of userIds) {
      try {
        // Check user preferences
        const preferences = await db.collection('notification_preferences').findOne({ userId });
        if (preferences && !preferences.categories?.[template.category]) {
          continue;
        }

        const notification = {
          _id: new ObjectId(),
          userId,
          ...template,
          status: 'UNREAD',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await db.collection('notifications').insertOne(notification);
        sentCount++;

        // Send real-time update
        // await sendSSEMessage({
        //   type: 'NEW_NOTIFICATION',
        //   notification
        // }, userId);

        results.push({ userId, success: true, notificationId: notification._id });

      } catch (error) {
        results.push({ userId, success: false, error: (error as Error).message });
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      total: userIds.length,
      results
    });

  } catch (error) {
    console.error('Error broadcasting notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
