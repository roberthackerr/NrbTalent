// /lib/services/group-analytics-service.ts
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { GroupAnalytics } from "@/lib/models/group-analytics"

export class GroupAnalyticsService {
  private static instance: GroupAnalyticsService
  
  static getInstance(): GroupAnalyticsService {
    if (!GroupAnalyticsService.instance) {
      GroupAnalyticsService.instance = new GroupAnalyticsService()
    }
    return GroupAnalyticsService.instance
  }
  
  async generateDailyAnalytics(groupId: ObjectId): Promise<GroupAnalytics> {
    const db = await getDatabase()
    
    // Date d'hier
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 1)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 1)
    endDate.setHours(23, 59, 59, 999)
    
    // Récupérer les statistiques
    const [
      totalMembers,
      activeMembers,
      newMembers,
      newPosts,
      newComments,
      newEvents,
      newJobs,
      views,
      topContributors,
      popularContent
    ] = await Promise.all([
      this.getTotalMembers(groupId),
      this.getActiveMembers(groupId, startDate, endDate),
      this.getNewMembers(groupId, startDate, endDate),
      this.getNewPosts(groupId, startDate, endDate),
      this.getNewComments(groupId, startDate, endDate),
      this.getNewEvents(groupId, startDate, endDate),
      this.getNewJobs(groupId, startDate, endDate),
      this.getViews(groupId, startDate, endDate),
      this.getTopContributors(groupId, startDate, endDate),
      this.getPopularContent(groupId, startDate, endDate)
    ])
    
    // Calculer les taux
    const engagementRate = activeMembers > 0 ? (activeMembers / totalMembers) * 100 : 0
    const growthRate = totalMembers > 0 ? (newMembers / totalMembers) * 100 : 0
    
    const analytics: GroupAnalytics = {
      _id: new ObjectId(),
      groupId,
      period: 'daily',
      stats: {
        totalMembers,
        activeMembers,
        engagementRate,
        growthRate,
        retentionRate: 0, // À calculer sur une période plus longue
        avgTimeSpent: 0  // À implémenter avec tracking
      },
      dailyStats: [{
        date: startDate,
        newMembers,
        activeMembers,
        newPosts,
        newComments,
        newEvents,
        newJobs,
        views
      }],
      topContributors,
      popularContent,
      demographics: await this.getDemographics(groupId),
      activityHours: await this.getActivityHours(groupId, startDate, endDate),
      referrers: await this.getReferrers(groupId, startDate, endDate),
      startDate,
      endDate,
      generatedAt: new Date()
    }
    
    // Sauvegarder les analytics
    await db.collection<GroupAnalytics>("group_analytics").insertOne(analytics)
    
    return analytics
  }
  
  private async getTotalMembers(groupId: ObjectId): Promise<number> {
    const db = await getDatabase()
    return db.collection("group_members").countDocuments({
      groupId,
      status: 'active'
    })
  }
  
  private async getActiveMembers(
    groupId: ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const db = await getDatabase()
    
    // Membres qui ont eu une activité dans la période
    const activeMemberIds = await db.collection("group_posts")
      .distinct("authorId", {
        groupId,
        createdAt: { $gte: startDate, $lte: endDate }
      })
    
    return activeMemberIds.length
  }
  
  private async getNewMembers(
    groupId: ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const db = await getDatabase()
    return db.collection("group_members").countDocuments({
      groupId,
      joinedAt: { $gte: startDate, $lte: endDate },
      status: 'active'
    })
  }
  
  private async getNewPosts(
    groupId: ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const db = await getDatabase()
    return db.collection("group_posts").countDocuments({
      groupId,
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'published'
    })
  }
  
  private async getNewComments(
    groupId: ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const db = await getDatabase()
    
    // Implémentation simplifiée - ajuster selon votre structure de commentaires
    const posts = await db.collection("group_posts")
      .find({
        groupId,
        createdAt: { $gte: startDate, $lte: endDate }
      })
      .toArray()
    
    return posts.reduce((total, post) => total + (post.commentCount || 0), 0)
  }
  
  private async getNewEvents(
    groupId: ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const db = await getDatabase()
    return db.collection("group_events").countDocuments({
      groupId,
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'scheduled'
    })
  }
  
  private async getNewJobs(
    groupId: ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const db = await getDatabase()
    return db.collection("group_posts").countDocuments({
      groupId,
      type: 'job',
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'published'
    })
  }
  
  private async getViews(
    groupId: ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const db = await getDatabase()
    
    // Implémentation simplifiée
    const posts = await db.collection("group_posts")
      .find({
        groupId,
        createdAt: { $gte: startDate, $lte: endDate }
      })
      .toArray()
    
    return posts.reduce((total, post) => total + (post.viewCount || 0), 0)
  }
  
  private async getTopContributors(
    groupId: ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const db = await getDatabase()
    
    const pipeline = [
      {
        $match: {
          groupId,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: "$authorId",
          posts: { $sum: 1 },
          reactions: { $sum: { $size: "$reactions" } },
          comments: { $sum: "$commentCount" }
        }
      },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ["$posts", 10] },
              { $multiply: ["$reactions", 5] },
              { $multiply: ["$comments", 3] }
            ]
          }
        }
      },
      { $sort: { score: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$_id",
          name: "$user.name",
          avatar: "$user.avatar",
          score: 1,
          posts: 1,
          comments: 1,
          reactions: 1
        }
      }
    ]
    
    return db.collection("group_posts").aggregate(pipeline).toArray()
  }
  
  private async getPopularContent(
    groupId: ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const db = await getDatabase()
    
    return db.collection("group_posts")
      .find({
        groupId,
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'published'
      })
      .sort({ 
        viewCount: -1,
        reactionCounts: -1,
        commentCount: -1 
      })
      .limit(10)
      .toArray()
      .then(posts => posts.map(post => ({
        postId: post._id,
        title: post.title,
        type: post.type,
        views: post.viewCount || 0,
        reactions: post.reactionCounts ? Object.values(post.reactionCounts).reduce((a: number, b: number) => a + b, 0) : 0,
        comments: post.commentCount || 0,
        shares: post.shareCount || 0
      })))
  }
  
  private async getDemographics(groupId: ObjectId): Promise<any> {
    const db = await getDatabase()
    
    // Récupérer les membres avec leurs profils
    const members = await db.collection("group_members")
      .aggregate([
        { $match: { groupId, status: 'active' } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        { $unwind: "$user" },
        {
          $project: {
            location: "$user.location",
            skills: "$user.skills",
            experience: "$user.experience?.length" || 0
          }
        }
      ])
      .toArray()
    
    // Analyser la démographie
    const demographics = {
      locations: {},
      skills: {},
      experience: {
        beginner: 0,
        intermediate: 0,
        expert: 0
      }
    }
    
    members.forEach((member : any) => {
      // Locations
      if (member.location) {
        demographics.locations[member.location] = 
          (demographics.locations[member.location] || 0) + 1
      }
      
      // Skills
      if (member.skills) {
        member.skills.forEach((skill: string) => {
          demographics.skills[skill] = 
            (demographics.skills[skill] || 0) + 1
        })
      }
      
      // Expérience
      const expYears = member.experience
      if (expYears < 2) demographics.experience.beginner++
      else if (expYears < 5) demographics.experience.intermediate++
      else demographics.experience.expert++
    })
    
    return demographics
  }
  
  private async getActivityHours(
    groupId: ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    const db = await getDatabase()
    
    const posts = await db.collection("group_posts")
      .find({
        groupId,
        createdAt: { $gte: startDate, $lte: endDate }
      })
      .toArray()
    
    const activityHours: Record<string, number> = {}
    
    posts.forEach(post => {
      const hour = new Date(post.createdAt).getHours()
      const hourKey = `${hour}:00`
      activityHours[hourKey] = (activityHours[hourKey] || 0) + 1
    })
    
    return activityHours
  }
  
  private async getReferrers(
    groupId: ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const db = await getDatabase()
    
    // Récupérer les nouveaux membres et leur source
    const newMembers = await db.collection("group_members")
      .aggregate([
        { 
          $match: { 
            groupId, 
            joinedAt: { $gte: startDate, $lte: endDate } 
          } 
        },
        {
          $lookup: {
            from: "user_activities",
            let: { userId: "$userId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$userId", "$$userId"] },
                      { $eq: ["$action", "group_join"] },
                      { $eq: ["$groupId", groupId] }
                    ]
                  }
                }
              }
            ],
            as: "activity"
          }
        },
        { $unwind: { path: "$activity", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$activity.referrer",
            count: { $sum: 1 }
          }
        }
      ])
      .toArray()
    
    return newMembers.map(member => ({
      source: member._id || 'direct',
      count: member.count
    }))
  }
}