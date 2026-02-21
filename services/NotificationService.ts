// services/notificationService.ts
import { Notifications, NotificationCategory, NotificationPriority } from '@/types/notifications';

export interface NotificationTemplate {
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string;
  image?: string;
  data?: any;
}

class NotificationService {
  private static instance: NotificationService;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Templates prédéfinis
  public readonly templates = {
    // Messages
    newMessage: (senderName: string, conversationId: string): NotificationTemplate => ({
      category: 'MESSAGE',
      priority: 'MEDIUM',
      title: '💬 Nouveau message',
      message: `${senderName} vous a envoyé un message`,
      actionUrl: `/messages/${conversationId}`,
      data: { entityId: conversationId, entityType: 'conversation' }
    }),

    // Commandes
    newOrder: (gigTitle: string, orderId: string, buyerName: string): NotificationTemplate => ({
      category: 'ORDER',
      priority: 'HIGH',
      title: '🛒 Nouvelle commande',
      message: `${buyerName} a commandé "${gigTitle}"`,
      actionUrl: `/orders/${orderId}`,
      data: { entityId: orderId, entityType: 'order' }
    }),

    orderAccepted: (gigTitle: string, orderId: string, sellerName: string): NotificationTemplate => ({
      category: 'ORDER',
      priority: 'MEDIUM',
      title: '✅ Commande acceptée',
      message: `${sellerName} a accepté votre commande "${gigTitle}"`,
      actionUrl: `/orders/${orderId}`,
      data: { entityId: orderId, entityType: 'order' }
    }),

    orderCompleted: (gigTitle: string, orderId: string): NotificationTemplate => ({
      category: 'ORDER',
      priority: 'MEDIUM',
      title: '🎉 Commande terminée',
      message: `Votre commande "${gigTitle}" est prête !`,
      actionUrl: `/orders/${orderId}`,
      data: { entityId: orderId, entityType: 'order' }
    }),

    // Avis
    newReview: (gigTitle: string, reviewId: string, reviewerName: string): NotificationTemplate => ({
      category: 'REVIEW',
      priority: 'MEDIUM',
      title: '⭐ Nouvel avis',
      message: `${reviewerName} a laissé un avis sur "${gigTitle}"`,
      actionUrl: `/reviews/${reviewId}`,
      data: { entityId: reviewId, entityType: 'review' }
    }),

    // Sécurité
    securityAlert: (device: string, location: string): NotificationTemplate => ({
      category: 'SECURITY',
      priority: 'URGENT',
      title: '🚨 Alerte de sécurité',
      message: `Nouvelle connexion depuis ${device} (${location})`,
      actionUrl: '/security'
    }),

    // Communauté
    newFollower: (userName: string, userId: string): NotificationTemplate => ({
      category: 'COMMUNITY',
      priority: 'LOW',
      title: '👤 Nouvel abonné',
      message: `${userName} vous suit maintenant`,
      actionUrl: `/profile/${userId}`,
      data: { entityId: userId, entityType: 'user' }
    }),

    // Réalisations
    achievementUnlocked: (achievementName: string, points: number): NotificationTemplate => ({
      category: 'ACHIEVEMENT',
      priority: 'LOW',
      title: '🏆 Succès débloqué !',
      message: `"${achievementName}" - +${points} points`,
      actionUrl: '/achievements'
    }),

    // Système
    systemUpdate: (version: string): NotificationTemplate => ({
      category: 'SYSTEM',
      priority: 'LOW',
      title: '🔔 Mise à jour système',
      message: `Nouvelle version ${version} disponible`,
      actionUrl: '/changelog'
    }),

    // Promotions
    promotion: (title: string, description: string, promoCode?: string): NotificationTemplate => ({
      category: 'PROMOTION',
      priority: 'MEDIUM',
      title: `💰 ${title}`,
      message: promoCode ? `${description} - Code: ${promoCode}` : description,
      actionUrl: '/promotions'
    })
  };

  // Envoyer une notification
  async send(
    userId: string, 
    template: NotificationTemplate
  ): Promise<string> {
    try {
      const notification: Omit<Notifications, '_id' | 'createdAt'> = {
        userId,
        ...template,
        status: 'UNREAD',
      };

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
      });

      if (!response.ok) {
        throw new Error(`Failed to send notification: ${response.status}`);
      }

      const result = await response.json();
      return result._id;
    } catch (error) {
      console.error('NotificationService.send error:', error);
      throw error;
    }
  }

  // Notification en masse
  async broadcast(
    template: NotificationTemplate,
    userFilter?: { role?: string; segment?: string }
  ): Promise<{ success: boolean; sent: number }> {
    try {
      const response = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, userFilter }),
      });

      if (!response.ok) {
        throw new Error(`Failed to broadcast notification: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('NotificationService.broadcast error:', error);
      throw error;
    }
  }

  // Méthodes utilitaires
  async sendToMultiple(
    userIds: string[], 
    template: NotificationTemplate
  ): Promise<string[]> {
    const results = await Promise.allSettled(
      userIds.map(userId => this.send(userId, template))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  // Vérifier si une notification doit être envoyée basée sur les préférences
  async shouldSendNotification(
    userId: string, 
    category: NotificationCategory
  ): Promise<boolean> {
    try {
      const response = await fetch(`/api/notifications/preferences/${userId}`);
      if (!response.ok) return true; // Par défaut, envoyer

      const { preferences } = await response.json();
      return preferences?.categories?.[category] !== false;
    } catch (error) {
      console.error('Error checking notification preferences:', error);
      return true; // En cas d'erreur, envoyer par défaut
    }
  }
}

export const notificationService = NotificationService.getInstance();