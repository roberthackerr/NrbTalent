// hooks/useNotificationManager.ts
import { useNotifications } from '@/contexts/NotificationContext';
import { notificationService } from '@/services/NotificationService';

export function useNotificationManager() {
  const { state, actions } = useNotifications();

  // Méthodes de notification avec templates
  const notify = {
    // Messages
    newMessage: (senderName: string, conversationId: string, userId: string) => {
      return notificationService.send(
        userId,
        notificationService.templates.newMessage(senderName, conversationId)
      );
    },

    // Commandes
    newOrder: (gigTitle: string, orderId: string, buyerName: string, sellerId: string) => {
      return notificationService.send(
        sellerId,
        notificationService.templates.newOrder(gigTitle, orderId, buyerName)
      );
    },

    orderAccepted: (gigTitle: string, orderId: string, sellerName: string, buyerId: string) => {
      return notificationService.send(
        buyerId,
        notificationService.templates.orderAccepted(gigTitle, orderId, sellerName)
      );
    },

    // Avis
    newReview: (gigTitle: string, reviewId: string, reviewerName: string, sellerId: string) => {
      return notificationService.send(
        sellerId,
        notificationService.templates.newReview(gigTitle, reviewId, reviewerName)
      );
    },

    // Sécurité
    securityAlert: (device: string, location: string, userId: string) => {
      return notificationService.send(
        userId,
        notificationService.templates.securityAlert(device, location)
      );
    },
  };

  return {
    // État
    state:state,
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    isLoading: state.isLoading,
    isConnected: state.isConnected,
    preferences: state.preferences,
    actions,
    // Actions de gestion
    ...actions,

    // Méthodes de notification
    notify,

    // Utilitaires
    hasUnread: state.unreadCount > 0,
    lastUpdated: state.lastUpdated,
  };
}