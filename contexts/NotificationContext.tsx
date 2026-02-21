// contexts/NotificationContext.tsx
"use client"

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Notifications, NotificationPreferences, NotificationState } from '@/types/notifications';

// Action Types
type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_NOTIFICATIONS'; payload: Notifications[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notifications }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_READ' }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'SET_PREFERENCES'; payload: NotificationPreferences }
  | { type: 'UPDATE_LAST_UPDATED' };

// Reducer
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };

    case 'SET_NOTIFICATIONS':
      const unreadCount = action.payload?.filter((n: any) => n.status === 'UNREAD').length;
      return {
        ...state,
        notifications: action.payload,
        unreadCount,
        lastUpdated: new Date(),
      };

    case 'ADD_NOTIFICATION':
      // Éviter les doublons
      const exists = state.notifications.some((n: any) => n._id === action.payload._id);
      if (exists) return state;

      const newUnreadCount = action.payload.status === 'UNREAD' 
        ? state.unreadCount + 1 
        : state.unreadCount;
      
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: newUnreadCount,
        lastUpdated: new Date(),
      };

    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map((notification: any) =>
          notification._id === action.payload
            ? { ...notification, status: 'READ', readAt: new Date() }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };

    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map((notification: any) => ({
          ...notification,
          status: 'READ',
          readAt: new Date(),
        })),
        unreadCount: 0,
      };

    case 'DELETE_NOTIFICATION':
      const notificationToDelete = state.notifications.find((n: any) => n._id === action.payload);
      const updatedUnreadCount = notificationToDelete?.status === 'UNREAD' 
        ? Math.max(0, state.unreadCount - 1) 
        : state.unreadCount;
      
      return {
        ...state,
        notifications: state.notifications.filter((n: any) => n._id !== action.payload),
        unreadCount: updatedUnreadCount,
      };

    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload };

    case 'UPDATE_LAST_UPDATED':
      return { ...state, lastUpdated: new Date() };

    default:
      return state;
  }
}

// Initial State
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  preferences: null,
  isLoading: false,
  isConnected: false,
  lastUpdated: null,
};

// Context
interface NotificationContextValue {
  state: NotificationState;
  actions: {
    refreshNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    createNotification: (notification: Omit<Notifications, '_id' | 'createdAt'>) => Promise<void>;
    updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
    clearAll: () => void;
  };
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

// Provider
interface NotificationProviderProps {
  children: React.ReactNode;
  session?: any;
}

export function NotificationProvider({ children, session: propSession }: NotificationProviderProps) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { data: hookSession, status } = useSession();
  
  // Utiliser la session des props ou du hook useSession
  const session = propSession || hookSession;
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>(null);

  // API Calls
  const apiCall = useCallback(async (
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<any> => {
    const response = await fetch(`/api/notifications${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }, []);

  // Charger les notifications
  const refreshNotifications = useCallback(async () => {
    if (!session) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const data = await apiCall('');
      dispatch({ type: 'SET_NOTIFICATIONS', payload: data.notifications });
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [session, apiCall]);

  // Marquer comme lu
  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiCall(`/${id}/read`, { method: 'PUT' });
      dispatch({ type: 'MARK_AS_READ', payload: id });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [apiCall]);

  // Tout marquer comme lu
  const markAllAsRead = useCallback(async () => {
    try {
      await apiCall('/read-all', { method: 'PUT' });
      dispatch({ type: 'MARK_ALL_READ' });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [apiCall]);

  // Supprimer une notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await apiCall(`/${id}`, { method: 'DELETE' });
      dispatch({ type: 'DELETE_NOTIFICATION', payload: id });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [apiCall]);

  // Créer une notification
  const createNotification = useCallback(async (
    notification: Omit<Notifications, '_id' | 'createdAt'>
  ) => {
    try {
      const result = await apiCall('', {
        method: 'POST',
        body: JSON.stringify(notification),
      });
      dispatch({ type: 'ADD_NOTIFICATION', payload: result });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }, [apiCall]);

  // Mettre à jour les préférences
  const updatePreferences = useCallback(async (
    preferences: Partial<NotificationPreferences>
  ) => {
    try {
      const result = await apiCall('/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });
      dispatch({ type: 'SET_PREFERENCES', payload: result.preferences });
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }, [apiCall]);

  // Tout effacer
  const clearAll = useCallback(() => {
    dispatch({ type: 'SET_NOTIFICATIONS', payload: [] });
  }, []);

  // Notification navigateur
  const showBrowserNotification = useCallback((notification: Notifications) => {
    // Vérifier si on est dans le navigateur
    if (typeof window === 'undefined') return;
    
    if (!('Notification' in window) || 
        (window as any).Notification.permission !== 'granted' ||
        document.visibilityState === 'visible') {
      return;
    }

    const browserNotification = new (window as any).Notification(notification.title, {
      body: notification.message,
      icon: notification.image || '/icon.png',
      tag: notification._id,
      silent: notification.priority !== 'URGENT',
    });

    browserNotification.onclick = () => {
      window.focus();
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
      browserNotification.close();
    };

    // Fermer automatiquement après 5 secondes
    setTimeout(() => browserNotification.close(), 5000);
  }, []);

  // Configuration SSE pour le temps réel
  const setupSSE = useCallback(() => {
    if (!session || eventSourceRef.current) return;

    try {
      eventSourceRef.current = new EventSource('/api/notifications/stream');

      eventSourceRef.current.onopen = () => {
        dispatch({ type: 'SET_CONNECTED', payload: true });
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'NEW_NOTIFICATION') {
            dispatch({ type: 'ADD_NOTIFICATION', payload: data.notification });
            showBrowserNotification(data.notification);
          }
          
          if (data.type === 'NOTIFICATION_UPDATED') {
            refreshNotifications();
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSourceRef.current.onerror = () => {
        dispatch({ type: 'SET_CONNECTED', payload: false });
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        
        // Reconnexion progressive
        reconnectTimeoutRef.current = setTimeout(setupSSE, 5000);
      };
    } catch (error) {
      console.error('Error setting up SSE:', error);
    }
  }, [session, refreshNotifications, showBrowserNotification]);

  // Effets principaux
  useEffect(() => {
    // Attendre que la session soit chargée si on utilise useSession
    if (!propSession && status === 'loading') return;
    
    if (session) {
      refreshNotifications();
      setupSSE();
      
      // Demander la permission pour les notifications push
      if (typeof window !== 'undefined' && 'Notification' in window && (window as any).Notification.permission === 'default') {
        (window as any).Notification.requestPermission().catch(console.error);
      }
    } else {
      clearAll();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      dispatch({ type: 'SET_CONNECTED', payload: false });
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [session, status, propSession, refreshNotifications, setupSSE, clearAll]);

  // Auto-refresh périodique (fallback si SSE échoue)
  useEffect(() => {
    if (!session || !state.isConnected) return;

    const interval = setInterval(() => {
      refreshNotifications();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [session, state.isConnected, refreshNotifications]);

  const contextValue: NotificationContextValue = {
    state,
    actions: {
      refreshNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      createNotification,
      updatePreferences,
      clearAll,
    },
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};