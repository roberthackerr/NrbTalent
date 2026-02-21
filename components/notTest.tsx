// components/TestNotificationSystem.tsx
"use client"
import { useNotificationManager } from '@/hooks/useNotificationManager';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export function TestNotificationSystem() {
  const { notify, unreadCount, markAllAsRead, state, actions } = useNotificationManager();
  const { data: session } = useSession();
  const [isSending, setIsSending] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  const sendTestNotifications = async () => {
    if (!session?.user?.id) {
      console.error("❌ No user session found");
      setLastAction("❌ No user session - please log in");
      return;
    }

    setIsSending(true);
    setLastAction("Sending test notifications...");
    
    try {
      console.log("Sending test notifications for user:", session.user.id);
      
      // Test different notification types using the current user's ID
      await notify.newMessage("Sarah Johnson", "conv-123", session.user.id);
      console.log("✅ Message notification sent");
      
      await notify.newOrder("Website Design", "order-456", "Alex Thompson", session.user.id);
      console.log("✅ Order notification sent");
      
      await notify.securityAlert("Chrome Browser", "Paris, France", session.user.id);
      console.log("✅ Security notification sent");
      
      await notify.newReview("Logo Design", "review-789", "Michael Brown", session.user.id);
      console.log("✅ Review notification sent");

      // Test direct notification creation
     await actions.createNotification({
        status:"UNREAD",
  userId: session.user.id,
  category: 'SYSTEM',
  priority: 'MEDIUM',
  title: '🔔 Test System Notification',
  message: 'This is a direct test notification from the system',
  actionUrl: '/test',
  data: { 
    entityId: "test-entity-123",
    entityType: "test",
    metadata: {} // Use empty object instead of null, or omit it entirely
  }
});
      console.log("✅ Direct notification sent");
      
      setLastAction("✅ All test notifications sent!");
      console.log("🎉 All test notifications sent!");
      
      // Refresh to see new notifications
      setTimeout(() => {
        actions.refreshNotifications();
      }, 1000);
      
    } catch (error) {
      console.error("❌ Failed to send notifications:", error);
      setLastAction(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  const clearAll = async () => {
    try {
      await markAllAsRead();
      setLastAction("📭 All notifications marked as read");
      console.log("📭 All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      setLastAction("❌ Failed to mark all as read");
    }
  };

  const refreshNotifications = async () => {
    try {
      await actions.refreshNotifications();
      setLastAction("🔄 Notifications refreshed");
      console.log("🔄 Notifications refreshed");
    } catch (error) {
      console.error("Error refreshing notifications:", error);
      setLastAction("❌ Failed to refresh notifications");
    }
  };

  const deleteAllNotifications = async () => {
    if (!state.notifications || state.notifications.length === 0) return;
    
    try {
      // Delete all notifications one by one
      for (const notification of state.notifications) {
        await actions.deleteNotification(notification._id);
      }
      setLastAction("🗑️ All notifications deleted");
      console.log("🗑️ All notifications deleted");
    } catch (error) {
      console.error("Error deleting notifications:", error);
      setLastAction("❌ Failed to delete notifications");
    }
  };

  // Safe state access
  const totalNotifications = state.notifications?.length || 0;
  const readCount = state.notifications?.filter(n => n.status === 'READ').length || 0;
  const notificationCategories = state.notifications?.reduce((acc, n) => {
    acc[n.category] = (acc[n.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔔 Notification System Test
          <Badge variant={state.isConnected ? "default" : "secondary"}>
            {state.isConnected ? "Connected" : "Disconnected"}
          </Badge>
          {!session?.user && (
            <Badge variant="destructive">Not Logged In</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Test your notification system in real-time
          {session?.user && (
            <span className="block text-xs mt-1">
              User: {session.user.email} ({session.user.id})
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalNotifications}</div>
            <div className="text-sm text-blue-500">Total</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
            <div className="text-sm text-red-500">Unread</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{readCount}</div>
            <div className="text-sm text-green-500">Read</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{Object.keys(notificationCategories).length}</div>
            <div className="text-sm text-purple-500">Categories</div>
          </div>
        </div>

        {/* Category Breakdown */}
        {Object.keys(notificationCategories).length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Notification Categories:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(notificationCategories).map(([category, count]) => (
                <Badge key={category} variant="outline" className="text-xs">
                  {category}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={sendTestNotifications} 
            disabled={isSending || !session?.user}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSending ? "Sending..." : "Send Test Notifications"}
          </Button>
          
          <Button 
            onClick={clearAll} 
            variant="outline"
            disabled={!session?.user || unreadCount === 0}
          >
            Mark All as Read
          </Button>
          
          <Button 
            onClick={refreshNotifications} 
            variant="outline"
            disabled={!session?.user}
          >
            Refresh
          </Button>
          
          <Button 
            onClick={deleteAllNotifications} 
            variant="destructive"
            disabled={!session?.user || totalNotifications === 0}
          >
            Delete All
          </Button>
        </div>

        {/* Status */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Session Status:</span>
            <Badge variant={session?.user ? "default" : "destructive"}>
              {session?.user ? "Logged In" : "Not Logged In"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>API Status:</span>
            <Badge variant={state.isLoading ? "secondary" : state.isConnected ? "default" : "destructive"}>
              {state.isLoading ? "🔄 Loading..." : state.isConnected ? "🟢 Connected" : "🔴 Disconnected"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Last Updated:</span>
            <span>{state.lastUpdated ? new Date(state.lastUpdated).toLocaleTimeString() : "Never"}</span>
          </div>
          {lastAction && (
            <div className="flex justify-between bg-yellow-50 p-2 rounded">
              <span>Last Action:</span>
              <span className="font-medium">{lastAction}</span>
            </div>
          )}
        </div>

        {/* Debug Info */}
        <details className="text-xs bg-gray-50 p-3 rounded">
          <summary className="cursor-pointer font-medium">Debug Information</summary>
          <div className="mt-2 space-y-2">
            <div>
              <strong>Session:</strong>
              <pre className="mt-1 whitespace-pre-wrap">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
            <div>
              <strong>Notification State:</strong>
              <pre className="mt-1 whitespace-pre-wrap">
                {JSON.stringify({
                  notifications: state.notifications?.length || 0,
                  unreadCount: state.unreadCount,
                  isLoading: state.isLoading,
                  isConnected: state.isConnected,
                  lastUpdated: state.lastUpdated,
                  preferences: state.preferences ? 'Set' : 'Not set'
                }, null, 2)}
              </pre>
            </div>
            {state.notifications && state.notifications.length > 0 && (
              <div>
                <strong>Sample Notification:</strong>
                <pre className="mt-1 whitespace-pre-wrap">
                  {JSON.stringify(state.notifications[0], null, 2)}
                </pre>
              </div>
            )}
          </div>
        </details>

        {/* Help Text */}
        {!session?.user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
            <p className="font-semibold text-yellow-800">⚠️ Not Logged In</p>
            <p className="text-yellow-700 mt-1">
              You need to be logged in to test notifications. The system uses your user ID to send notifications.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}