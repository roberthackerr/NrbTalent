// services/notificationService.ts - Version server-side (sans fetch)
import { NotificationCategory, NotificationPriority } from '@/types/notifications';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export interface NotificationTemplate {
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string;
  image?: string;
  data?: any;
}

export interface SendNotificationOptions {
  userId: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string;
  image?: string;
  data?: any;
  checkPreferences?: boolean;
}

class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Méthode principale d'envoi (direct DB)
  // ──────────────────────────────────────────────────────────────────────────
  async send(options: SendNotificationOptions): Promise<string | null> {
    try {
      // Vérifier les préférences utilisateur si demandé
      if (options.checkPreferences !== false) {
        const shouldSend = await this.shouldSendNotification(
          options.userId, 
          options.category
        );
        if (!shouldSend) return null;
      }

      const db = await getDatabase();
      
      const notification = {
        userId: options.userId,
        category: options.category,
        priority: options.priority,
        title: options.title,
        message: options.message,
        actionUrl: options.actionUrl,
        image: options.image,
        data: options.data || {},
        status: 'UNREAD',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection("notifications").insertOne(notification);
      
      console.log('✅ Notification inserted:', result.insertedId);
      return result.insertedId.toString();
      
    } catch (error) {
      console.error('NotificationService.send error:', error);
      return null;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Vérification des préférences (direct DB)
  // ──────────────────────────────────────────────────────────────────────────
  async shouldSendNotification(userId: string, category: NotificationCategory): Promise<boolean> {
    try {
      const db = await getDatabase();
      
      // Convertir userId en ObjectId si possible
      let objectId;
      try {
        objectId = new ObjectId(userId);
      } catch {
        objectId = userId;
      }
      
      const user = await db.collection("users").findOne(
        { _id: objectId },
        { projection: { notificationPreferences: 1 } }
      );
      
      // Mapper la catégorie vers la clé de préférence
      const preferenceKey = this.getPreferenceKey(category);
      return user?.notificationPreferences?.[preferenceKey] !== false;
      
    } catch (error) {
      console.error('Error checking preferences:', error);
      return true; // En cas d'erreur, envoyer par défaut
    }
  }

  private getPreferenceKey(category: NotificationCategory): string {
    const mapping: Record<NotificationCategory, string> = {
      MESSAGE: 'push-messages',
      ORDER: 'push-bids',
      REVIEW: 'push-reviews',
      SECURITY: 'security-login',
      COMMUNITY: 'social-connections',
      ACHIEVEMENT: 'push-reviews',
      SYSTEM: 'email-marketing',
      PROMOTION: 'email-marketing',
    };
    return mapping[category] || 'push-messages';
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEMPLATES - AUTH & SECURITY
  // ──────────────────────────────────────────────────────────────────────────
  
  async send2FAEnabled(userId: string) {
    return this.send({
      userId,
      category: 'SECURITY',
      priority: 'HIGH',
      title: '🔐 Authentification 2FA activée',
      message: 'L\'authentification à deux facteurs a été activée sur votre compte',
      actionUrl: '/dashboard/settings/security',
      data: { action: '2fa_enabled', timestamp: new Date().toISOString() }
    });
  }

  async send2FADisabled(userId: string) {
    return this.send({
      userId,
      category: 'SECURITY',
      priority: 'HIGH',
      title: '🔓 Authentification 2FA désactivée',
      message: 'L\'authentification à deux facteurs a été désactivée sur votre compte',
      actionUrl: '/dashboard/settings/security',
      data: { action: '2fa_disabled' }
    });
  }

  async sendLoginAlert(userId: string, device: string, location: string) {
    return this.send({
      userId,
      category: 'SECURITY',
      priority: 'URGENT',
      title: '🚨 Nouvelle connexion',
      message: `Connexion détectée depuis ${device} (${location})`,
      actionUrl: '/dashboard/settings/security',
      data: { device, location, action: 'new_login' }
    });
  }

  async sendPasswordChanged(userId: string) {
    return this.send({
      userId,
      category: 'SECURITY',
      priority: 'HIGH',
      title: '🔑 Mot de passe modifié',
      message: 'Votre mot de passe a été modifié avec succès',
      actionUrl: '/dashboard/settings/security',
      data: { action: 'password_changed' }
    });
  }

  async sendEmailVerified(userId: string) {
    return this.send({
      userId,
      category: 'SECURITY',
      priority: 'MEDIUM',
      title: '✅ Email vérifié',
      message: 'Votre adresse email a été vérifiée avec succès',
      actionUrl: '/dashboard/settings',
      data: { action: 'email_verified' }
    });
  }

  async sendPhoneVerified(userId: string) {
    return this.send({
      userId,
      category: 'SECURITY',
      priority: 'MEDIUM',
      title: '📱 Téléphone vérifié',
      message: 'Votre numéro de téléphone a été vérifié avec succès',
      actionUrl: '/dashboard/settings',
      data: { action: 'phone_verified' }
    });
  }

  async sendIdentityVerified(userId: string) {
    return this.send({
      userId,
      category: 'SECURITY',
      priority: 'HIGH',
      title: '✅ Identité vérifiée',
      message: 'Votre identité a été vérifiée. Vous avez maintenant le badge "Vérifié" sur votre profil.',
      actionUrl: '/profile',
      data: { action: 'identity_verified' }
    });
  }

  async sendIdentityRejected(userId: string, reason: string) {
    return this.send({
      userId,
      category: 'SECURITY',
      priority: 'HIGH',
      title: '❌ Vérification d\'identité refusée',
      message: `Votre demande de vérification a été refusée : ${reason}`,
      actionUrl: '/dashboard/settings/verification',
      data: { action: 'identity_rejected', reason }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEMPLATES - PROJECTS
  // ──────────────────────────────────────────────────────────────────────────
  
  async sendProjectCreated(userId: string, projectId: string, projectTitle: string) {
    return this.send({
      userId,
      category: 'ORDER',
      priority: 'LOW',
      title: '📋 Projet publié',
      message: `Votre projet "${projectTitle}" a été publié avec succès`,
      actionUrl: `/projects/${projectId}`,
      data: { entityId: projectId, entityType: 'project', title: projectTitle }
    });
  }

  async sendNewApplication(userId: string, projectId: string, projectTitle: string, freelancerName: string) {
    return this.send({
      userId,
      category: 'ORDER',
      priority: 'MEDIUM',
      title: '📝 Nouvelle candidature',
      message: `${freelancerName} a postulé à votre projet "${projectTitle}"`,
      actionUrl: `/projects/${projectId}/applications`,
      data: { entityId: projectId, entityType: 'project', freelancerName }
    });
  }

  async sendApplicationAccepted(userId: string, projectId: string, projectTitle: string) {
    return this.send({
      userId,
      category: 'ORDER',
      priority: 'HIGH',
      title: '🎉 Candidature acceptée !',
      message: `Votre candidature pour "${projectTitle}" a été acceptée`,
      actionUrl: `/projects/${projectId}`,
      data: { entityId: projectId, entityType: 'project' }
    });
  }

  async sendApplicationRejected(userId: string, projectId: string, projectTitle: string) {
    return this.send({
      userId,
      category: 'ORDER',
      priority: 'LOW',
      title: '❌ Candidature refusée',
      message: `Votre candidature pour "${projectTitle}" n'a pas été retenue`,
      actionUrl: `/projects/${projectId}`,
      data: { entityId: projectId, entityType: 'project' }
    });
  }

  async sendProjectMilestone(userId: string, projectId: string, projectTitle: string, milestoneName: string) {
    return this.send({
      userId,
      category: 'ORDER',
      priority: 'MEDIUM',
      title: '🎯 Étape validée',
      message: `L'étape "${milestoneName}" du projet "${projectTitle}" a été validée`,
      actionUrl: `/projects/${projectId}`,
      data: { entityId: projectId, entityType: 'project', milestone: milestoneName }
    });
  }

  async sendProjectCompleted(userId: string, projectId: string, projectTitle: string) {
    return this.send({
      userId,
      category: 'ORDER',
      priority: 'HIGH',
      title: '✅ Projet terminé',
      message: `Le projet "${projectTitle}" est terminé. N'oubliez pas de laisser un avis !`,
      actionUrl: `/projects/${projectId}`,
      data: { entityId: projectId, entityType: 'project' }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEMPLATES - GIGS & ORDERS
  // ──────────────────────────────────────────────────────────────────────────
  
  async sendNewOrder(userId: string, orderId: string, gigTitle: string, buyerName: string) {
    return this.send({
      userId,
      category: 'ORDER',
      priority: 'HIGH',
      title: '🛒 Nouvelle commande',
      message: `${buyerName} a commandé "${gigTitle}"`,
      actionUrl: `/orders/${orderId}`,
      data: { entityId: orderId, entityType: 'order', gigTitle, buyerName }
    });
  }

  async sendOrderAccepted(userId: string, orderId: string, gigTitle: string, sellerName: string) {
    return this.send({
      userId,
      category: 'ORDER',
      priority: 'MEDIUM',
      title: '✅ Commande acceptée',
      message: `${sellerName} a accepté votre commande "${gigTitle}"`,
      actionUrl: `/orders/${orderId}`,
      data: { entityId: orderId, entityType: 'order', gigTitle }
    });
  }

  async sendOrderDelivered(userId: string, orderId: string, gigTitle: string) {
    return this.send({
      userId,
      category: 'ORDER',
      priority: 'MEDIUM',
      title: '📦 Livraison en attente',
      message: `Le travail pour "${gigTitle}" a été livré. Vérifiez et validez la commande.`,
      actionUrl: `/orders/${orderId}`,
      data: { entityId: orderId, entityType: 'order' }
    });
  }

  async sendOrderCompleted(userId: string, orderId: string, gigTitle: string) {
    return this.send({
      userId,
      category: 'ORDER',
      priority: 'HIGH',
      title: '🎉 Commande terminée',
      message: `La commande "${gigTitle}" est terminée. Merci pour votre confiance !`,
      actionUrl: `/orders/${orderId}`,
      data: { entityId: orderId, entityType: 'order' }
    });
  }

  async sendOrderCancelled(userId: string, orderId: string, gigTitle: string, reason?: string) {
    return this.send({
      userId,
      category: 'ORDER',
      priority: 'MEDIUM',
      title: '❌ Commande annulée',
      message: reason 
        ? `La commande "${gigTitle}" a été annulée : ${reason}`
        : `La commande "${gigTitle}" a été annulée`,
      actionUrl: `/orders/${orderId}`,
      data: { entityId: orderId, entityType: 'order', reason }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEMPLATES - MESSAGES
  // ──────────────────────────────────────────────────────────────────────────
  
  async sendNewMessage(userId: string, conversationId: string, senderName: string, messagePreview: string) {
    return this.send({
      userId,
      category: 'MESSAGE',
      priority: 'MEDIUM',
      title: '💬 Nouveau message',
      message: `${senderName}: ${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? '...' : ''}`,
      actionUrl: `/messages/${conversationId}`,
      data: { entityId: conversationId, entityType: 'conversation', senderName }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEMPLATES - REVIEWS
  // ──────────────────────────────────────────────────────────────────────────
  
  async sendNewReview(userId: string, reviewId: string, reviewerName: string, rating: number, projectTitle: string) {
    const stars = '⭐'.repeat(rating);
    return this.send({
      userId,
      category: 'REVIEW',
      priority: 'MEDIUM',
      title: `⭐ Nouvel avis - ${rating}/5`,
      message: `${reviewerName} a laissé un avis ${stars} sur "${projectTitle}"`,
      actionUrl: `/reviews/${reviewId}`,
      data: { entityId: reviewId, entityType: 'review', rating, reviewerName }
    });
  }

  async sendReviewResponse(userId: string, reviewId: string, projectTitle: string) {
    return this.send({
      userId,
      category: 'REVIEW',
      priority: 'LOW',
      title: '💬 Réponse à votre avis',
      message: `Le freelancer a répondu à votre avis sur "${projectTitle}"`,
      actionUrl: `/reviews/${reviewId}`,
      data: { entityId: reviewId, entityType: 'review' }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEMPLATES - COMMUNITY & GROUPS
  // ──────────────────────────────────────────────────────────────────────────
  
  async sendGroupJoinRequest(userId: string, groupId: string, groupName: string, requesterName: string) {
    return this.send({
      userId,
      category: 'COMMUNITY',
      priority: 'MEDIUM',
      title: '👥 Demande d\'adhésion',
      message: `${requesterName} souhaite rejoindre "${groupName}"`,
      actionUrl: `/groups/${groupId}/requests`,
      data: { entityId: groupId, entityType: 'group', requesterName }
    });
  }

  async sendGroupJoinApproved(userId: string, groupId: string, groupName: string) {
    return this.send({
      userId,
      category: 'COMMUNITY',
      priority: 'MEDIUM',
      title: '✅ Demande acceptée !',
      message: `Votre demande pour rejoindre "${groupName}" a été acceptée`,
      actionUrl: `/groups/${groupId}`,
      data: { entityId: groupId, entityType: 'group' }
    });
  }

  async sendGroupJoinRejected(userId: string, groupId: string, groupName: string) {
    return this.send({
      userId,
      category: 'COMMUNITY',
      priority: 'MEDIUM',
      title: '❌ Demande refusée',
      message: `Votre demande pour rejoindre "${groupName}" a été refusée`,
      actionUrl: `/groups`,
      data: { entityId: groupId, entityType: 'group' }
    });
  }

  async sendNewGroupPost(userId: string, groupId: string, groupName: string, postTitle: string, authorName: string) {
    return this.send({
      userId,
      category: 'COMMUNITY',
      priority: 'LOW',
      title: '📝 Nouveau post',
      message: `${authorName} a publié "${postTitle}" dans "${groupName}"`,
      actionUrl: `/groups/${groupId}`,
      data: { entityId: groupId, entityType: 'group', postTitle }
    });
  }

  async sendGroupEvent(userId: string, groupId: string, groupName: string, eventTitle: string, eventDate: Date) {
    const formattedDate = eventDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    return this.send({
      userId,
      category: 'COMMUNITY',
      priority: 'MEDIUM',
      title: '📅 Nouvel événement',
      message: `"${eventTitle}" dans "${groupName}" - ${formattedDate}`,
      actionUrl: `/groups/${groupId}/events`,
      data: { entityId: groupId, entityType: 'group', eventTitle, eventDate }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEMPLATES - PAYMENTS
  // ──────────────────────────────────────────────────────────────────────────
  
  async sendPaymentReceived(userId: string, amount: number, projectTitle: string) {
    return this.send({
      userId,
      category: 'ORDER',
      priority: 'HIGH',
      title: '💰 Paiement reçu',
      message: `${amount.toFixed(2)} € ont été crédités pour "${projectTitle}"`,
      actionUrl: '/dashboard/payments',
      data: { amount, projectTitle }
    });
  }

  async sendPaymentReleased(userId: string, amount: number, projectTitle: string) {
    return this.send({
      userId,
      category: 'ORDER',
      priority: 'HIGH',
      title: '💸 Paiement libéré',
      message: `${amount.toFixed(2)} € pour "${projectTitle}" sont disponibles sur votre compte`,
      actionUrl: '/dashboard/payments',
      data: { amount, projectTitle }
    });
  }

  async sendWithdrawalRequested(userId: string, amount: number) {
    return this.send({
      userId,
      category: 'ORDER',
      priority: 'MEDIUM',
      title: '🏦 Retrait demandé',
      message: `Votre demande de retrait de ${amount.toFixed(2)} € a été enregistrée`,
      actionUrl: '/dashboard/payments',
      data: { amount }
    });
  }

  async sendWithdrawalCompleted(userId: string, amount: number) {
    return this.send({
      userId,
      category: 'ORDER',
      priority: 'HIGH',
      title: '✅ Retrait effectué',
      message: `${amount.toFixed(2)} € ont été transférés sur votre compte bancaire`,
      actionUrl: '/dashboard/payments',
      data: { amount }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEMPLATES - ACHIEVEMENTS & PROMOTIONS
  // ──────────────────────────────────────────────────────────────────────────
  
  async sendAchievementUnlocked(userId: string, achievementName: string, points: number) {
    return this.send({
      userId,
      category: 'ACHIEVEMENT',
      priority: 'LOW',
      title: '🏆 Succès débloqué !',
      message: `"${achievementName}" - +${points} points d'expérience`,
      actionUrl: '/dashboard/achievements',
      data: { achievementName, points }
    });
  }

  async sendLevelUp(userId: string, newLevel: number) {
    return this.send({
      userId,
      category: 'ACHIEVEMENT',
      priority: 'MEDIUM',
      title: '🌟 Nouveau niveau atteint !',
      message: `Félicitations ! Vous êtes maintenant niveau ${newLevel}`,
      actionUrl: '/dashboard/achievements',
      data: { newLevel }
    });
  }

  async sendPromotion(userId: string, promotionTitle: string, description: string, promoCode?: string) {
    return this.send({
      userId,
      category: 'PROMOTION',
      priority: 'MEDIUM',
      title: `💰 ${promotionTitle}`,
      message: promoCode 
        ? `${description} - Code promo : ${promoCode}`
        : description,
      actionUrl: '/promotions',
      data: { promotionTitle, promoCode }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEMPLATES - PROFILE & AVATAR
  // ──────────────────────────────────────────────────────────────────────────
  
  async sendAvatarUpdated(userId: string, oldAvatarUrl?: string, newAvatarUrl?: string) {
    return this.send({
      userId,
      category: 'SYSTEM',
      priority: 'LOW',
      title: '🖼️ Photo de profil mise à jour',
      message: 'Votre photo de profil a été mise à jour avec succès',
      actionUrl: '/profile',
      data: { 
        action: 'avatar_updated',
        oldAvatarUrl: oldAvatarUrl || null,
        newAvatarUrl: newAvatarUrl || null,
        timestamp: new Date().toISOString()
      }
    });
  }

  async sendProfileUpdated(userId: string, updatedFields: string[]) {
    return this.send({
      userId,
      category: 'SYSTEM',
      priority: 'LOW',
      title: '📝 Profil mis à jour',
      message: `Les champs suivants ont été mis à jour : ${updatedFields.join(', ')}`,
      actionUrl: '/profile',
      data: { action: 'profile_updated', updatedFields }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Méthodes utilitaires
  // ──────────────────────────────────────────────────────────────────────────
  
  async sendToMultiple(userIds: string[], templateFn: (userId: string) => Promise<string | null>) {
    const results = await Promise.allSettled(
      userIds.map(userId => templateFn(userId))
    );

    return results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
  }

  async broadcast(template: Omit<SendNotificationOptions, 'userId'>, userFilter?: { role?: string; ids?: string[] }) {
    try {
      const db = await getDatabase();
      
      // Construire le filtre
      let filter: any = {};
      
      if (userFilter?.role) {
        filter.role = userFilter.role;
      }
      
      if (userFilter?.ids && userFilter.ids.length > 0) {
        const objectIds = userFilter.ids.map(id => {
          try {
            return new ObjectId(id);
          } catch {
            return id;
          }
        });
        filter._id = { $in: objectIds };
      }
      
      // Récupérer les utilisateurs
      const users = await db.collection("users").find(filter).toArray();
      
      // Créer les notifications
      const notifications = users.map(user => ({
        userId: user._id.toString(),
        category: template.category,
        priority: template.priority,
        title: template.title,
        message: template.message,
        actionUrl: template.actionUrl,
        image: template.image,
        data: template.data || {},
        status: 'UNREAD',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      
      if (notifications.length > 0) {
        await db.collection("notifications").insertMany(notifications);
      }
      
      return { success: true, sent: notifications.length };
      
    } catch (error) {
      console.error('NotificationService.broadcast error:', error);
      throw error;
    }
  }
}

export const notificationService = NotificationService.getInstance();