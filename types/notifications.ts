// types/notification.ts
export type NotificationCategory = 
  | 'MESSAGE'
  | 'ORDER' 
  | 'REVIEW'
  | 'SYSTEM'
  | 'PROMOTION'
  | 'SECURITY'
  | 'COMMUNITY'
  | 'ACHIEVEMENT';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

export interface Notifications {
  _id: string;
  userId: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  status: NotificationStatus;
  data?: {
    entityId?: string;
    entityType?: string;
    metadata?: Record<string, any> | null;
  };
  actionUrl?: string;
  image?: string;
  expiresAt?: Date;
  createdAt: Date;
  readAt?: Date;
}

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
  categories: {
    [K in NotificationCategory]: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
  };
}

export interface NotificationState {
  notifications: Notifications[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  isConnected: boolean;
  lastUpdated: Date | null;
}