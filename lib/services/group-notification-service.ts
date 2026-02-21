// /lib/services/group-notification-service.ts
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"

export class GroupNotificationService {
  private static instance: GroupNotificationService
  
  static getInstance(): GroupNotificationService {
    if (!GroupNotificationService.instance) {
      GroupNotificationService.instance = new GroupNotificationService()
    }
    return GroupNotificationService.instance
  }
  
  async notifyNewPost(
    groupId: ObjectId,
    postId: ObjectId,
    authorId: string,
    postTitle: string
  ): Promise<void> {
    const db = await getDatabase()
    
    // Récupérer tous les membres qui veulent des notifications
    const members = await db.collection("group_members").find({
      groupId,
      userId: { $ne: new ObjectId(authorId) },
      status: 'active',
      'notifications.newPosts': true
    }).toArray()
    
    for (const member of members) {
      await db.collection("notifications").insertOne({
        userId: member.userId,
        type: 'group_new_post',
        title: 'Nouveau post dans le groupe',
        message: `${postTitle}`,
        data: {
          groupId: groupId.toString(),
          postId: postId.toString(),
          authorId
        },
        read: false,
        createdAt: new Date()
      })
    }
  }
  
  async notifyNewEvent(
    groupId: ObjectId,
    eventId: ObjectId,
    eventTitle: string
  ): Promise<void> {
    const db = await getDatabase()
    
    const members = await db.collection("group_members").find({
      groupId,
      status: 'active',
      'notifications.newEvents': true
    }).toArray()
    
    for (const member of members) {
      await db.collection("notifications").insertOne({
        userId: member.userId,
        type: 'group_new_event',
        title: 'Nouvel événement dans le groupe',
        message: `${eventTitle}`,
        data: {
          groupId: groupId.toString(),
          eventId: eventId.toString()
        },
        read: false,
        createdAt: new Date()
      })
    }
  }
  
  async notifyNewJob(
    groupId: ObjectId,
    jobId: ObjectId,
    jobTitle: string,
    company: string
  ): Promise<void> {
    const db = await getDatabase()
    
    const members = await db.collection("group_members").find({
      groupId,
      status: 'active',
      'notifications.newJobs': true
    }).toArray()
    
    for (const member of members) {
      await db.collection("notifications").insertOne({
        userId: member.userId,
        type: 'group_new_job',
        title: 'Nouvelle offre d\'emploi',
        message: `${jobTitle} chez ${company}`,
        data: {
          groupId: groupId.toString(),
          jobId: jobId.toString()
        },
        read: false,
        createdAt: new Date()
      })
    }
  }
  
  async notifyMention(
    groupId: ObjectId,
    postId: ObjectId,
    authorId: string,
    mentionedUserId: string
  ): Promise<void> {
    const db = await getDatabase()
    
    // Vérifier si l'utilisateur mentionné est membre
    const isMember = await db.collection("group_members").findOne({
      groupId,
      userId: new ObjectId(mentionedUserId),
      status: 'active'
    })
    
    if (isMember && isMember.notifications?.mentions) {
      await db.collection("notifications").insertOne({
        userId: new ObjectId(mentionedUserId),
        type: 'group_mention',
        title: 'Vous avez été mentionné',
        message: 'Quelqu\'un vous a mentionné dans un post',
        data: {
          groupId: groupId.toString(),
          postId: postId.toString(),
          authorId
        },
        read: false,
        createdAt: new Date()
      })
    }
  }
  
  async notifyJoinRequest(
    groupId: ObjectId,
    userId: string,
    groupName: string
  ): Promise<void> {
    const db = await getDatabase()
    
    // Notifier les admins du groupe
    const admins = await db.collection("group_members").find({
      groupId,
      role: { $in: ['owner', 'admin'] },
      status: 'active'
    }).toArray()
    
    for (const admin of admins) {
      await db.collection("notifications").insertOne({
        userId: admin.userId,
        type: 'group_join_request',
        title: 'Nouvelle demande d\'adhésion',
        message: `Quelqu'un souhaite rejoindre ${groupName}`,
        data: {
          groupId: groupId.toString(),
          userId,
          groupName
        },
        read: false,
        createdAt: new Date()
      })
    }
  }
  
  async notifyJoinRequestApproved(
    groupId: ObjectId,
    userId: string,
    groupName: string
  ): Promise<void> {
    const db = await getDatabase()
    
    await db.collection("notifications").insertOne({
      userId: new ObjectId(userId),
      type: 'group_join_approved',
      title: 'Demande d\'adhésion approuvée',
      message: `Vous êtes maintenant membre de ${groupName}`,
      data: {
        groupId: groupId.toString(),
        groupName
      },
      read: false,
      createdAt: new Date()
    })
  }
  
  async sendDailyDigest(groupId: ObjectId): Promise<void> {
    const db = await getDatabase()
    
    // Récupérer les membres qui veulent le digest quotidien
    const members = await db.collection("group_members").find({
      groupId,
      status: 'active',
      'notifications.dailyDigest': true
    }).toArray()
    
    // Récupérer les activités de la journée
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const [newPosts, newEvents, newJobs] = await Promise.all([
      db.collection("group_posts").countDocuments({
        groupId,
        createdAt: { $gte: yesterday, $lt: today },
        status: 'published'
      }),
      db.collection("group_events").countDocuments({
        groupId,
        createdAt: { $gte: yesterday, $lt: today },
        status: 'scheduled'
      }),
      db.collection("group_posts").countDocuments({
        groupId,
        type: 'job',
        createdAt: { $gte: yesterday, $lt: today },
        status: 'published'
      })
    ])
    
    // Envoyer le digest
    for (const member of members) {
      await db.collection("notifications").insertOne({
        userId: member.userId,
        type: 'group_daily_digest',
        title: 'Digest quotidien du groupe',
        message: `Aujourd'hui : ${newPosts} posts, ${newEvents} événements, ${newJobs} offres d'emploi`,
        data: {
          groupId: groupId.toString(),
          stats: { newPosts, newEvents, newJobs }
        },
        read: false,
        createdAt: new Date()
      })
    }
  }
}