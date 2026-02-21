// /lib/services/group-service.ts - VERSION AMÉLIORÉE
import { ObjectId } from "mongodb"
import { Group, GroupType, GroupVisibility, GroupRole } from "@/lib/models/group"
import { GroupMember } from "@/lib/models/group-member"
import { GroupPost, PostType } from "@/lib/models/group-post"
import { getDatabase } from "@/lib/mongodb"

export class GroupService {
  private static instance: GroupService

  static getInstance(): GroupService {
    if (!GroupService.instance) {
      GroupService.instance = new GroupService()
    }
    return GroupService.instance
  }

  // ==================== CRÉATION DE GROUPE ====================
  async createGroup(
    userId: string,
    data: {
      name: string
      description: string
      type: GroupType
      visibility: GroupVisibility
      tags: string[]
      skills?: string[]
      location?: string
      company?: string
      avatar?: string // URL d'avatar personnalisé
    }
  ): Promise<Group> {
    const db = await getDatabase()

    // Vérifier si le nom existe déjà
    const existingGroup = await db.collection<Group>("groups").findOne({
      name: data.name,
      $or: [
        { status: { $ne: 'archived' } },
        { status: { $exists: false } }
      ]
    })

    if (existingGroup) {
      throw new Error("Un groupe avec ce nom existe déjà")
    }

    // Générer un slug unique
    const slug = this.generateSlug(data.name)

    // Générer les images du groupe
    const images = this.generateGroupImages(data.type, data.name, data.avatar)

    const group: Group = {
      _id: new ObjectId(),
      name: data.name,
      slug,
      description: data.description,
      type: data.type,
      visibility: data.visibility,
      isVerified: false,
      isFeatured: false,
      ownerId: new ObjectId(userId),
      moderators: [],
      tags: data.tags,
      skills: data.skills || [],
      location: data.location,
      company: data.company,
      avatar: images.avatar,
      banner: images.banner,
      color: this.generateColor(data.type),
      rules: {
        allowPosts: true,
        allowEvents: true,
        allowJobs: data.type === 'professional',
        allowFiles: true,
        requireApproval: data.visibility === 'private',
        maxPostsPerDay: 5,
        minAccountAge: 0,
        bannedWords: []
      },
      settings: {
        allowMemberInvites: true,
        allowCrossPosting: false,
        autoApproveMembers: data.visibility === 'public',
        sendWelcomeMessage: true,
        notifyOnNewPost: true
      },
      stats: {
        totalMembers: 1,
        activeMembers: 1,
        totalPosts: 0,
        totalEvents: 0,
        totalJobs: 0,
        engagementRate: 0,
        growthRate: 0
      },
      featuredMembers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivityAt: new Date(),
      viewCount: 0,
      saveCount: 0,
      reportCount: 0
    }

    // Créer le groupe
    await db.collection<Group>("groups").insertOne(group)

    // Ajouter le créateur comme membre admin
    await this.addMember(group._id!, userId, 'owner')

    return group
  }

  // Générer des images par défaut pour le groupe
  private generateGroupImages(
    type: GroupType, 
    name: string, 
    customAvatar?: string
  ): { avatar: string; banner: string } {
    const colors = this.getTypeColors(type)
    
    // Utiliser l'avatar personnalisé ou générer un avatar par défaut
    const avatar = customAvatar || this.generateAvatar(type, name)
    
    // Générer une bannière basée sur le type et le nom
    const banner = this.generateBanner(type, name)
    
    return { avatar, banner }
  }

  // Générer un avatar par défaut
  private generateAvatar(type: GroupType, name: string): string {
    const colors = this.getTypeColors(type)
    const firstLetter = name.charAt(0).toUpperCase()
    
    // Utiliser DiceBear API pour un avatar stylisé
    return `https://api.dicebear.com/7.x/initials/svg?seed=${firstLetter}&backgroundColor=${colors.hex}&color=fff&fontSize=40`
  }

  // Générer une bannière par défaut
  private generateBanner(type: GroupType, name: string): string {
    const colors = this.getTypeColors(type)
    
    // Utiliser un service de placeholder avec gradient
    const gradient = `${colors.primary},${colors.secondary}`
    const encodedName = encodeURIComponent(name)
    
    return `https://placehold.co/600x200/${colors.hex}/fff?text=${encodedName}&font=montserrat`
  }

  // Obtenir les couleurs selon le type
  private getTypeColors(type: GroupType): { 
    primary: string; 
    secondary: string; 
    hex: string;
    name: string;
  } {
    const colors: Record<GroupType, { primary: string; secondary: string; hex: string; name: string }> = {
      'skill': { 
        primary: '#3b82f6', 
        secondary: '#06b6d4', 
        hex: '3b82f6',
        name: 'blue'
      },
      'location': { 
        primary: '#10b981', 
        secondary: '#059669', 
        hex: '10b981',
        name: 'emerald'
      },
      'interest': { 
        primary: '#8b5cf6', 
        secondary: '#a855f7', 
        hex: '8b5cf6',
        name: 'violet'
      },
      'professional': { 
        primary: '#f59e0b', 
        secondary: '#d97706', 
        hex: 'f59e0b',
        name: 'amber'
      },
      'company': { 
        primary: '#ef4444', 
        secondary: '#dc2626', 
        hex: 'ef4444',
        name: 'red'
      },
      'learning': { 
        primary: '#06b6d4', 
        secondary: '#0ea5e9', 
        hex: '06b6d4',
        name: 'cyan'
      }
    }
    
    return colors[type] || { 
      primary: '#6b7280', 
      secondary: '#4b5563', 
      hex: '6b7280',
      name: 'gray'
    }
  }

  // ==================== GESTION DES MEMBRES ====================
  async addMember(
    groupId: ObjectId,
    userId: string,
    role: GroupRole = 'member'
  ): Promise<GroupMember> {
    const db = await getDatabase()

    // Vérifier si l'utilisateur est déjà membre
    const existingMember = await db.collection<GroupMember>("group_members").findOne({
      groupId,
      userId: new ObjectId(userId)
    })

    if (existingMember) {
      throw new Error("L'utilisateur est déjà membre de ce groupe")
    }

    const member: GroupMember = {
      _id: new ObjectId(),
      groupId,
      userId: new ObjectId(userId),
      role,
      status: 'active',
      permissions: this.getPermissionsForRole(role),
      activity: {
        postCount: 0,
        commentCount: 0,
        eventCount: 0,
        jobCount: 0,
        lastActive: new Date(),
        joinDate: new Date()
      },
      notifications: {
        newPosts: true,
        newEvents: true,
        newJobs: true,
        mentions: true,
        dailyDigest: false,
        weeklySummary: false
      },
      badges: [],
      reputation: 0,
      joinedAt: new Date(),
      updatedAt: new Date()
    }

    await db.collection<GroupMember>("group_members").insertOne(member)

    // Mettre à jour le nombre de membres du groupe
    await db.collection<Group>("groups").updateOne(
      { _id: groupId },
      {
        $inc: {
          'stats.totalMembers': 1,
          'stats.activeMembers': 1
        },
        $set: { 
          updatedAt: new Date(),
          lastActivityAt: new Date()
        }
      }
    )

    return member
  }

  async removeMember(groupId: ObjectId, userId: string): Promise<void> {
    const db = await getDatabase()

    await db.collection<GroupMember>("group_members").deleteOne({
      groupId,
      userId: new ObjectId(userId)
    })

    // Mettre à jour le nombre de membres
    await db.collection<Group>("groups").updateOne(
      { _id: groupId },
      {
        $inc: {
          'stats.totalMembers': -1,
          'stats.activeMembers': -1
        },
        $set: { 
          updatedAt: new Date(),
          lastActivityAt: new Date()
        }
      }
    )
  }

  // ==================== POSTS DE GROUPE ====================
  async createPost(
    groupId: ObjectId,
    authorId: string,
    data: {
      type: PostType
      title: string
      content: string
      tags?: string[]
      mentions?: string[]
      attachments?: any[]
      event?: any
      job?: any
      poll?: any
    }
  ): Promise<GroupPost> {
    const db = await getDatabase()

    // Vérifier si l'utilisateur peut poster
    const member = await db.collection<GroupMember>("group_members").findOne({
      groupId,
      userId: new ObjectId(authorId),
      status: 'active'
    })

    if (!member) {
      throw new Error("Vous devez être membre pour poster")
    }

    if (!member.permissions.canPost) {
      throw new Error("Vous n'avez pas la permission de poster")
    }

    // Vérifier la limite de posts par jour
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const postsToday = await db.collection<GroupPost>("group_posts").countDocuments({
      groupId,
      authorId: new ObjectId(authorId),
      createdAt: { $gte: today }
    })

    const group = await db.collection<Group>("groups").findOne({ _id: groupId })
    if (postsToday >= group!.rules.maxPostsPerDay) {
      throw new Error(`Limite de ${group!.rules.maxPostsPerDay} posts par jour atteinte`)
    }

    const post: GroupPost = {
      _id: new ObjectId(),
      groupId,
      authorId: new ObjectId(authorId),
      type: data.type,
      title: data.title,
      content: data.content,
      excerpt: data.content.substring(0, 200) + (data.content.length > 200 ? '...' : ''),
      tags: data.tags || [],
      mentions: data.mentions?.map(id => new ObjectId(id)) || [],
      attachments: data.attachments || [],
      event: data.event,
      job: data.job,
      poll: data.poll,
      reactions: [],
      reactionCounts: {
        like: 0,
        love: 0,
        insightful: 0,
        helpful: 0,
        celebrate: 0
      },
      commentCount: 0,
      viewCount: 0,
      shareCount: 0,
      saveCount: 0,
      status: 'published',
      isPinned: false,
      isFeatured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date()
    }

    await db.collection<GroupPost>("group_posts").insertOne(post)

    // Mettre à jour les stats du groupe
    await db.collection<Group>("groups").updateOne(
      { _id: groupId },
      {
        $inc: { 'stats.totalPosts': 1 },
        $set: {
          lastActivityAt: new Date(),
          updatedAt: new Date()
        }
      }
    )

    // Mettre à jour les stats du membre
    await db.collection<GroupMember>("group_members").updateOne(
      { groupId, userId: new ObjectId(authorId) },
      {
        $inc: { 'activity.postCount': 1 },
        $set: {
          'activity.lastActive': new Date(),
          updatedAt: new Date()
        }
      }
    )

    // Notifier les membres mentionnés
    if (data.mentions && data.mentions.length > 0) {
      await this.notifyMentions(groupId, post._id!, authorId, data.mentions)
    }

    return post
  }

  // ==================== RECHERCHE DE GROUPES ====================
  async searchGroups(options: {
    query?: string
    type?: GroupType
    skills?: string[]
    location?: string
    company?: string
    tags?: string[]
    sortBy?: 'relevance' | 'members' | 'activity' | 'newest'
    page?: number
    limit?: number
  }): Promise<{ groups: Group[]; total: number }> {
    const db = await getDatabase()

    const {
      query,
      type,
      skills,
      location,
      company,
      tags,
      sortBy = 'relevance',
      page = 1,
      limit = 20
    } = options

    const skip = (page - 1) * limit
    const match: any = {}

    if (query) {
      match.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ]
    }

    if (type) match.type = type
    if (location) match.location = { $regex: location, $options: 'i' }
    if (company) match.company = { $regex: company, $options: 'i' }
    if (skills && skills.length > 0) {
      match.skills = { $in: skills.map(s => new RegExp(s, 'i')) }
    }
    if (tags && tags.length > 0) {
      match.tags = { $in: tags.map(t => new RegExp(t, 'i')) }
    }

    // Exclure les groupes archivés
    match.$or = [
      { status: { $ne: 'archived' } },
      { status: { $exists: false } }
    ]

    let sortOptions: any = {}
    switch (sortBy) {
      case 'members':
        sortOptions = { 'stats.totalMembers': -1 }
        break
      case 'activity':
        sortOptions = { lastActivityAt: -1 }
        break
      case 'newest':
        sortOptions = { createdAt: -1 }
        break
      default:
        sortOptions = { isFeatured: -1, 'stats.totalMembers': -1 }
    }

    const [groups, total] = await Promise.all([
      db.collection<Group>("groups")
        .find(match)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<Group>("groups").countDocuments(match)
    ])

    return { groups, total }
  }

  // ==================== GROUPES RECOMMANDÉS ====================
  async getRecommendedGroups(userId: string): Promise<Group[]> {
    const db = await getDatabase()

    // Récupérer les compétences et intérêts de l'utilisateur
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      { projection: { skills: 1, location: 1, interests: 1 } }
    )

    if (!user) return []

    const recommended: Group[] = []

    // 1. Groupes par compétences
    if (user.skills && user.skills.length > 0) {
      const skillGroups = await db.collection<Group>("groups").find({
        type: 'skill',
        skills: { $in: user.skills.map((s: any) => new RegExp(s, 'i')) },
        $or: [
          { status: { $ne: 'archived' } },
          { status: { $exists: false } }
        ]
      })
      .limit(5)
      .toArray()

      recommended.push(...skillGroups)
    }

    // 2. Groupes géographiques
    if (user.location) {
      const locationGroups = await db.collection<Group>("groups").find({
        type: 'location',
        location: { $regex: user.location, $options: 'i' },
        $or: [
          { status: { $ne: 'archived' } },
          { status: { $exists: false } }
        ]
      })
      .limit(3)
      .toArray()

      recommended.push(...locationGroups)
    }

    // 3. Groupes populaires
    const popularGroups = await db.collection<Group>("groups").find({
      isFeatured: true,
      $or: [
        { status: { $ne: 'archived' } },
        { status: { $exists: false } }
      ]
    })
    .sort({ 'stats.totalMembers': -1 })
    .limit(5)
    .toArray()

    recommended.push(...popularGroups)

    // Éliminer les doublons et limiter à 10
    const uniqueGroups = Array.from(new Map(recommended.map(g => [g._id!.toString(), g])).values())
    return uniqueGroups.slice(0, 10)
  }

  // ==================== MISE À JOUR DES IMAGES ====================
  async updateGroupImages(
    groupId: ObjectId,
    images: { avatar?: string; banner?: string }
  ): Promise<Group> {
    const db = await getDatabase()

    const updateData: any = { updatedAt: new Date() }
    
    if (images.avatar) updateData.avatar = images.avatar
    if (images.banner) updateData.banner = images.banner

    const result = await db.collection<Group>("groups").findOneAndUpdate(
      { _id: groupId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (!result) {
      throw new Error("Groupe non trouvé")
    }

    return result
  }

  // ==================== UTILITAIRES ====================
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  private generateColor(type: GroupType): string {
    const colors = this.getTypeColors(type)
    return colors.primary
  }

  private getPermissionsForRole(role: GroupRole) {
    const base = {
      canPost: true,
      canComment: true,
      canInvite: false,
      canModerate: false,
      canDeleteOwnPosts: true,
      canCreateEvents: false,
      canPostJobs: false
    }

    switch (role) {
      case 'owner':
      case 'admin':
        return {
          ...base,
          canInvite: true,
          canModerate: true,
          canCreateEvents: true,
          canPostJobs: true
        }
      case 'moderator':
        return {
          ...base,
          canModerate: true,
          canCreateEvents: true
        }
      default:
        return base
    }
  }

  private async notifyMentions(
    groupId: ObjectId,
    postId: ObjectId,
    authorId: string,
    mentions: string[]
  ): Promise<void> {
    const db = await getDatabase()

    for (const mentionId of mentions) {
      // Vérifier si l'utilisateur mentionné est membre
      const isMember = await db.collection<GroupMember>("group_members").findOne({
        groupId,
        userId: new ObjectId(mentionId)
      })

      if (isMember) {
        await db.collection("notifications").insertOne({
          userId: new ObjectId(mentionId),
          type: 'group_mention',
          title: 'Vous avez été mentionné dans un groupe',
          message: `Quelqu'un vous a mentionné dans un post`,
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
  }

  // ==================== MÉTHODES SUPPLEMENTAIRES ====================
  async getGroupById(id: string): Promise<Group | null> {
    const db = await getDatabase()
    return db.collection<Group>("groups").findOne({ 
      _id: new ObjectId(id) 
    })
  }


  async updateGroupStats(groupId: ObjectId, stats: Partial<Group['stats']>): Promise<void> {
    const db = await getDatabase()
    
    await db.collection<Group>("groups").updateOne(
      { _id: groupId },
      { 
        $set: { 
          stats: stats,
          updatedAt: new Date(),
          lastActivityAt: new Date()
        } 
      }
    )
  }

  async incrementGroupViews(groupId: ObjectId): Promise<void> {
    const db = await getDatabase()
    
    await db.collection<Group>("groups").updateOne(
      { _id: groupId },
      { 
        $inc: { viewCount: 1 },
        $set: { updatedAt: new Date() }
      }
    )
  }

  async getGroupMembers(groupId: ObjectId, page = 1, limit = 20) {
    const db = await getDatabase()
    const skip = (page - 1) * limit

    const [members, total] = await Promise.all([
      db.collection<GroupMember>("group_members")
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
          { $sort: { role: -1, joinedAt: 1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              role: 1,
              joinedAt: 1,
              activity: 1,
              badges: 1,
              reputation: 1,
              user: {
                _id: 1,
                name: 1,
                email: 1,
                avatar: 1,
                bio: 1,
                skills: 1,
                location: 1
              }
            }
          }
        ])
        .toArray(),
      db.collection<GroupMember>("group_members").countDocuments({ groupId, status: 'active' })
    ])

    return {
      members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }
  async isGroupMember(groupId: ObjectId, userId: string): Promise<boolean> {
  const db = await getDatabase()
  
  const member = await db.collection<GroupMember>("group_members").findOne({
    groupId,
    userId: new ObjectId(userId),
    status: 'active'
  })
  
  return !!member
}

// Obtenir un groupe par slug avec plus de détails
async getGroupBySlug(slug: string): Promise<any> {
  const db = await getDatabase()
  
  const group = await db.collection<Group>("groups").findOne({ slug })
  
  if (!group) {
    return null
  }

  // Compter les membres actifs
  const activeMembers = await db.collection<GroupMember>("group_members").countDocuments({
    groupId: group._id,
    status: 'active'
  })

  // Récupérer le propriétaire
  const owner = await db.collection("users").findOne(
    { _id: group.ownerId },
    { projection: { name: 1, avatar: 1, bio: 1 } }
  )

  return {
    ...group,
    stats: {
      ...group.stats,
      activeMembers
    },
    owner,
    memberCount: group.stats.totalMembers
  }
}
}