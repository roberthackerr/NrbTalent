// app/api/groups/[id]/posts/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import cloudinary from "@/lib/cloudinary/config"
import { v4 as uuidv4 } from "uuid"
import { notificationService } from "@/services/NotificationService"

// Configuration pour l'upload
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/zip'
]

// Fonction d'upload vers Cloudinary
async function uploadToCloudinary(file: File, groupId: string, userId: string): Promise<any> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const base64File = `data:${file.type};base64,${buffer.toString('base64')}`
  
  const isImage = file.type.startsWith('image/')
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64File,
      {
        public_id: `groups/${groupId}/posts/${uuidv4()}`,
        folder: `nrbtalents/groups/${groupId}/posts`,
        resource_type: isImage ? 'image' : 'raw',
        transformation: isImage ? [
          { width: 1200, crop: 'limit', quality: 'auto' }
        ] : [],
        tags: ['group-post', groupId, userId],
        context: {
          groupId,
          userId,
          fileName: file.name,
          fileType: file.type,
          uploadedAt: new Date().toISOString()
        }
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )
  })
}

// Fonction pour récupérer la langue d'un utilisateur
async function getUserLanguage(db: any, userId: string): Promise<'fr' | 'en' | 'mg'> {
  try {
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      { projection: { language: 1, preferences: 1 } }
    )
    const userLang = user?.language || user?.preferences?.language || 'fr'
    return userLang === 'fr' || userLang === 'en' || userLang === 'mg' ? userLang : 'fr'
  } catch {
    return 'fr'
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const { searchParams } = new URL(request.url)
    
    const type = searchParams.get('type')
    const authorId = searchParams.get('authorId')
    const pinned = searchParams.get('pinned') === 'true'
    const sortBy = searchParams.get('sortBy') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const isMember = await db.collection("group_members").findOne({
      groupId: new ObjectId(id),
      userId: new ObjectId((session.user as any).id),
      status: 'active'
    })

    if (!isMember) {
      return NextResponse.json({ 
        error: "Vous devez être membre pour voir les posts" 
      }, { status: 403 })
    }

    const match: any = {
      groupId: new ObjectId(id),
      status: 'published'
    }
    
    if (type) match.type = type
    if (authorId) match.authorId = new ObjectId(authorId)
    if (pinned) match.isPinned = true

    let sortOptions: any = {}
    switch (sortBy) {
      case 'popular':
        sortOptions = { reactionCounts: -1, commentCount: -1 }
        break
      case 'top':
        sortOptions = { reactionCounts: -1 }
        break
      default:
        sortOptions = { isPinned: -1, createdAt: -1 }
    }

    const pipeline: any[] = [
      { $match: match },
      { $sort: sortOptions },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "author"
        }
      },
      { $unwind: "$author" },
      {
        $lookup: {
          from: "group_members",
          let: { postAuthorId: "$authorId", postGroupId: "$groupId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$postAuthorId"] },
                    { $eq: ["$groupId", "$$postGroupId"] }
                  ]
                }
              }
            }
          ],
          as: "authorMembership"
        }
      },
      {
        $addFields: {
          authorRole: { $arrayElemAt: ["$authorMembership.role", 0] }
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          type: 1,
          images: 1,
          attachments: 1,
          tags: 1,
          isPinned: 1,
          isFeatured: 1,
          reactionCounts: 1,
          commentCount: 1,
          viewCount: 1,
          shareCount: 1,
          saveCount: 1,
          createdAt: 1,
          updatedAt: 1,
          "author._id": 1,
          "author.name": 1,
          "author.avatar": 1,
          "author.title": 1,
          "author.company": 1,
          authorRole: 1
        }
      }
    ]

    const [posts, total] = await Promise.all([
      db.collection("group_posts").aggregate(pipeline).toArray(),
      db.collection("group_posts").countDocuments(match)
    ])

    const formattedPosts = posts.map(post => ({
      ...post,
      _id: post._id.toString(),
      groupId: id,
      authorId: post.author?._id?.toString(),
      author: post.author ? {
        ...post.author,
        _id: post.author._id.toString()
      } : null
    }))

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    })

  } catch (error: any) {
    console.error("❌ Error fetching group posts:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const userName = session.user?.name || 'Utilisateur'
    const userAvatar = session.user?.image || null
    
    // Vérifier si l'utilisateur est membre
    const member = await db.collection("group_members").findOne({
      groupId: new ObjectId(id),
      userId: userId,
      status: 'active'
    })

    if (!member) {
      return NextResponse.json(
        { error: "Vous devez être membre pour poster" },
        { status: 403 }
      )
    }

    // Récupérer le groupe
    const group = await db.collection("groups").findOne({
      _id: new ObjectId(id)
    })

    if (!group) {
      return NextResponse.json(
        { error: "Groupe non trouvé" },
        { status: 404 }
      )
    }

    // Lire les données du formulaire
    const formData = await request.formData()
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const type = formData.get('type') as string || 'discussion'
    const tags = JSON.parse(formData.get('tags') as string || '[]')
    const files = formData.getAll('files') as File[]

    // Validation
    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Le titre est requis" },
        { status: 400 }
      )
    }

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Le contenu est requis" },
        { status: 400 }
      )
    }

    // Upload des fichiers vers Cloudinary
    const uploadedImages: any[] = []
    const uploadedAttachments: any[] = []

    if (files && files.length > 0) {
      for (const file of files) {
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          return NextResponse.json(
            { error: `Type de fichier non supporté: ${file.name}` },
            { status: 400 }
          )
        }

        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `Fichier trop volumineux: ${file.name} (max 10MB)` },
            { status: 400 }
          )
        }

        try {
          const uploadResult = await uploadToCloudinary(file, id, userId.toString())
          const fileData = {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            name: file.name,
            type: file.type,
            size: file.size
          }

          if (file.type.startsWith('image/')) {
            uploadedImages.push(fileData)
          } else {
            uploadedAttachments.push(fileData)
          }
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError)
          return NextResponse.json(
            { error: `Erreur lors de l'upload de ${file.name}` },
            { status: 500 }
          )
        }
      }
    }

    // Créer le post
    const post = {
      _id: new ObjectId(),
      groupId: new ObjectId(id),
      authorId: userId,
      type: type,
      title: title.trim(),
      content: content.trim(),
      excerpt: content.trim().substring(0, 200) + (content.trim().length > 200 ? '...' : ''),
      images: uploadedImages,
      attachments: uploadedAttachments,
      tags: tags,
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
      authorRole: member.role,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date()
    }

    // Insérer dans la base de données
    const result = await db.collection("group_posts").insertOne(post)

    // Mettre à jour les statistiques du groupe
    await db.collection("groups").updateOne(
      { _id: new ObjectId(id) },
      { 
        $inc: { 'stats.totalPosts': 1 },
        $set: { 
          updatedAt: new Date(),
          'stats.lastActivityAt': new Date()
        }
      }
    )

    // ============================================
    // 📢 ENVOYER DES NOTIFICATIONS AUX MEMBRES DU GROUPE
    // ============================================
    try {
      // Récupérer tous les membres du groupe (sauf l'auteur)
      const groupMembers = await db.collection("group_members")
        .find({
          groupId: new ObjectId(id),
          userId: { $ne: userId },
          status: 'active'
        })
        .toArray()

      if (groupMembers.length > 0) {
        // Messages de notification multilingues
        const notificationMessages = {
          fr: {
            title: `📝 Nouveau post dans ${group.name}`,
            message: `${userName} a publié "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}"`
          },
          en: {
            title: `📝 New post in ${group.name}`,
            message: `${userName} published "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}"`
          },
          mg: {
            title: `📝 Lahatsoratra vaovao ao amin'ny ${group.name}`,
            message: `${userName} namoaka "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}"`
          }
        }

        // Envoyer les notifications à chaque membre
        for (const member of groupMembers) {
          const userLang = await getUserLanguage(db, member.userId.toString())
          const msg = notificationMessages[userLang] || notificationMessages.fr

          await notificationService.send({
            userId: member.userId.toString(),
            category: 'COMMUNITY',
            priority: 'MEDIUM',
            title: msg.title,
            message: msg.message,
            actionUrl: `/groups/${id}/posts/${post._id}`,
            data: {
              entityType: 'group_post',
              action: 'create',
              groupId: id,
              groupName: group.name,
              postId: post._id.toString(),
              postTitle: title,
              authorId: userId.toString(),
              authorName: userName,
              authorAvatar: userAvatar,
              tags: tags,
              hasImages: uploadedImages.length > 0,
              hasAttachments: uploadedAttachments.length > 0,
              timestamp: new Date().toISOString()
            },
            checkPreferences: true
          })
        }

        console.log(`✅ Notifications envoyées à ${groupMembers.length} membres du groupe`)
      }
    } catch (notifError) {
      console.error('⚠️ Erreur lors de l\'envoi des notifications:', notifError)
    }

    // ============================================
    // 📢 NOTIFICATION À L'AUTEUR (confirmation)
    // ============================================
    try {
      const userLang = await getUserLanguage(db, userId.toString())
      const confirmMessages = {
        fr: {
          title: "✅ Post publié avec succès",
          message: `Votre post "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}" a été publié dans ${group.name}`
        },
        en: {
          title: "✅ Post published successfully",
          message: `Your post "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}" has been published in ${group.name}`
        },
        mg: {
          title: "✅ Navoaka soa aman-tsara ny lahatsoratra",
          message: `Navoaka tao amin'ny ${group.name} ny lahatsoratrao "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}"`
        }
      }

      const msg = confirmMessages[userLang] || confirmMessages.fr

      await notificationService.send({
        userId: userId.toString(),
        category: 'SYSTEM',
        priority: 'LOW',
        title: msg.title,
        message: msg.message,
        actionUrl: `/groups/${id}/posts/${post._id}`,
        data: {
          entityType: 'group_post',
          action: 'create_confirm',
          groupId: id,
          groupName: group.name,
          postId: post._id.toString(),
          postTitle: title,
          timestamp: new Date().toISOString()
        },
        checkPreferences: true
      })
    } catch (notifError) {
      console.error('⚠️ Erreur lors de l\'envoi de la notification de confirmation:', notifError)
    }

    // Formatage de la réponse
    const response = {
      ...post,
      _id: post._id.toString(),
      groupId: id,
      authorId: userId.toString(),
      author: {
        _id: userId.toString(),
        name: userName,
        avatar: userAvatar,
        role: member.role
      }
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error: any) {
    console.error("❌ Error creating post:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du post" },
      { status: 500 }
    )
  }
}

// PUT: Mettre à jour un post
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json(
        { error: "ID du post requis" },
        { status: 400 }
      )
    }

    const post = await db.collection("group_posts").findOne({
      _id: new ObjectId(postId),
      groupId: new ObjectId(groupId)
    })

    if (!post) {
      return NextResponse.json({ error: "Post non trouvé" }, { status: 404 })
    }

    const isAuthor = post.authorId.equals(userId)
    const isAdmin = await db.collection("group_members").findOne({
      groupId: new ObjectId(groupId),
      userId: userId,
      role: { $in: ['owner', 'admin'] },
      status: 'active'
    })

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission de modifier ce post" },
        { status: 403 }
      )
    }

    const updateData = await request.json()
    
    await db.collection("group_posts").updateOne(
      { _id: new ObjectId(postId) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    )

    // ============================================
    // 📢 NOTIFICATION DE MODIFICATION
    // ============================================
    try {
      const userLang = await getUserLanguage(db, userId.toString())
      const group = await db.collection("groups").findOne({ _id: new ObjectId(groupId) })
      
      const updateMessages = {
        fr: {
          title: "✏️ Post modifié",
          message: `Votre post "${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}" a été modifié`
        },
        en: {
          title: "✏️ Post updated",
          message: `Your post "${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}" has been updated`
        },
        mg: {
          title: "✏️ Nohavaozina ny lahatsoratra",
          message: `Nohavaozina ny lahatsoratrao "${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}"`
        }
      }

      const msg = updateMessages[userLang] || updateMessages.fr

      await notificationService.send({
        userId: userId.toString(),
        category: 'SYSTEM',
        priority: 'LOW',
        title: msg.title,
        message: msg.message,
        actionUrl: `/groups/${groupId}/posts/${postId}`,
        data: {
          entityType: 'group_post',
          action: 'update',
          groupId,
          postId,
          postTitle: post.title,
          timestamp: new Date().toISOString()
        },
        checkPreferences: true
      })
    } catch (notifError) {
      console.error('⚠️ Erreur lors de l\'envoi de la notification de modification:', notifError)
    }

    return NextResponse.json({
      success: true,
      message: "Post mis à jour avec succès"
    })

  } catch (error: any) {
    console.error("Error updating post:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    )
  }
}

// DELETE: Supprimer un post
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json(
        { error: "ID du post requis" },
        { status: 400 }
      )
    }

    const post = await db.collection("group_posts").findOne({
      _id: new ObjectId(postId),
      groupId: new ObjectId(groupId)
    })

    if (!post) {
      return NextResponse.json({ error: "Post non trouvé" }, { status: 404 })
    }

    const isAuthor = post.authorId.equals(userId)
    const isAdmin = await db.collection("group_members").findOne({
      groupId: new ObjectId(groupId),
      userId: userId,
      role: { $in: ['owner', 'admin'] },
      status: 'active'
    })

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission de supprimer ce post" },
        { status: 403 }
      )
    }

    // Supprimer les fichiers de Cloudinary
    try {
      for (const image of post.images || []) {
        if (image.publicId) {
          await cloudinary.uploader.destroy(image.publicId)
        }
      }
      for (const attachment of post.attachments || []) {
        if (attachment.publicId) {
          await cloudinary.uploader.destroy(attachment.publicId, { resource_type: 'raw' })
        }
      }
    } catch (cloudinaryError) {
      console.error("Error deleting files from Cloudinary:", cloudinaryError)
    }

    // Soft delete: marquer comme archivé
    await db.collection("group_posts").updateOne(
      { _id: new ObjectId(postId) },
      {
        $set: {
          status: 'archived',
          updatedAt: new Date(),
          deletedAt: new Date(),
          deletedBy: userId
        }
      }
    )

    // Mettre à jour les statistiques du groupe
    await db.collection("groups").updateOne(
      { _id: new ObjectId(groupId) },
      { 
        $inc: { 'stats.totalPosts': -1 },
        $set: { updatedAt: new Date() }
      }
    )

    // ============================================
    // 📢 NOTIFICATION DE SUPPRESSION
    // ============================================
    try {
      const userLang = await getUserLanguage(db, userId.toString())
      const group = await db.collection("groups").findOne({ _id: new ObjectId(groupId) })
      
      const deleteMessages = {
        fr: {
          title: "🗑️ Post supprimé",
          message: `Votre post "${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}" a été supprimé`
        },
        en: {
          title: "🗑️ Post deleted",
          message: `Your post "${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}" has been deleted`
        },
        mg: {
          title: "🗑️ Nofafana ny lahatsoratra",
          message: `Nofafana ny lahatsoratrao "${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}"`
        }
      }

      const msg = deleteMessages[userLang] || deleteMessages.fr

      await notificationService.send({
        userId: userId.toString(),
        category: 'SYSTEM',
        priority: 'MEDIUM',
        title: msg.title,
        message: msg.message,
        actionUrl: `/groups/${groupId}`,
        data: {
          entityType: 'group_post',
          action: 'delete',
          groupId,
          postId,
          postTitle: post.title,
          timestamp: new Date().toISOString()
        },
        checkPreferences: true
      })
    } catch (notifError) {
      console.error('⚠️ Erreur lors de l\'envoi de la notification de suppression:', notifError)
    }

    return NextResponse.json({
      success: true,
      message: "Post supprimé avec succès"
    })

  } catch (error: any) {
    console.error("Error deleting post:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    )
  }
}