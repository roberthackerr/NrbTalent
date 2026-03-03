// /app/api/groups/[id]/posts/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

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
    
    // Paramètres de requête
    const type = searchParams.get('type')
    const authorId = searchParams.get('authorId')
    const pinned = searchParams.get('pinned') === 'true'
    const sortBy = searchParams.get('sortBy') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Vérifier si l'utilisateur est membre du groupe
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

    // Construire la requête
    const match: any = {
      groupId: new ObjectId(id),
      status: 'published'
    }
    
    if (type) match.type = type
    if (authorId) match.authorId = new ObjectId(authorId)
    if (pinned) match.isPinned = true

    // Options de tri
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

    // Pipeline d'agrégation
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

    // Exécuter la requête
    const [posts, total] = await Promise.all([
      db.collection("group_posts").aggregate(pipeline).toArray(),
      db.collection("group_posts").countDocuments(match)
    ])

    // Formater les données de retour
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
    
    console.log('📝 Creating post for group:', {
      groupId: id,
      userId: userId.toString(),
      userName
    })

    // Vérifier si l'utilisateur est membre
    const member = await db.collection("group_members").findOne({
      groupId: new ObjectId(id),
      userId: userId,
      status: 'active'
    })

    if (!member) {
      console.log('❌ User not member:', userId.toString())
      return NextResponse.json(
        { error: "Vous devez être membre pour poster" },
        { status: 403 }
      )
    }

    console.log('✅ User is member, role:', member.role)

    // Lire les données JSON
    let postData
    try {
      postData = await request.json()
      console.log('📥 Received post data:', {
        title: postData.title?.substring(0, 50),
        type: postData.type,
        hasImages: !!postData.images?.length,
        hasAttachments: !!postData.attachments?.length,
        tagsCount: postData.tags?.length || 0
      })
    } catch (jsonError) {
      console.error('❌ Error parsing JSON:', jsonError)
      return NextResponse.json(
        { error: "Données JSON invalides" },
        { status: 400 }
      )
    }

    // Validation des champs requis
    if (!postData.title?.trim()) {
      return NextResponse.json(
        { error: "Le titre est requis" },
        { status: 400 }
      )
    }

    if (!postData.content?.trim()) {
      return NextResponse.json(
        { error: "Le contenu est requis" },
        { status: 400 }
      )
    }

    // Créer le post
    const post = {
      _id: new ObjectId(),
      groupId: new ObjectId(id),
      authorId: userId,
      type: postData.type || 'discussion',
      title: postData.title.trim(),
      content: postData.content.trim(),
      excerpt: postData.content.trim().substring(0, 200) + 
               (postData.content.trim().length > 200 ? '...' : ''),
      images: postData.images || [], // URLs uploadées via /upload
      attachments: postData.attachments || [], // Fichiers uploadés via /upload
      tags: postData.tags || [],
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

    console.log('💾 Saving post to database...')
    
    // Insérer dans la base de données
    const result = await db.collection("group_posts").insertOne(post)
    
    console.log('✅ Post created with ID:', result.insertedId.toString())

    // Mettre à jour les statistiques du groupe
// Mettre à jour les statistiques du groupe
await db.collection("groups").updateOne(
  { _id: new ObjectId(id) },
  { 
    $inc: { 
      'stats.totalPosts': 1
    },
    $set: { 
      updatedAt: new Date(),
      'stats.lastActivityAt': new Date()  // Utiliser $set pour la date
    }
  }
);
    console.log('📊 Group stats updated')

    // Formatage de la réponse
    const response = {
      ...post,
      _id: post._id.toString(),
      groupId: id,
      authorId: userId.toString(),
      author: {
        _id: userId.toString(),
        name: userName,
        avatar: session.user?.image || null,
        role: member.role
      }
    }

    console.log('🎉 Post created successfully:', {
      postId: response._id,
      title: response.title.substring(0, 30)
    })

    return NextResponse.json(response, { status: 201 })

  } catch (error: any) {
    console.error("❌ Error creating post:", error)
    console.error("Stack trace:", error.stack)
    
    return NextResponse.json(
      { 
        error: "Erreur lors de la création du post",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
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

    // Vérifier si l'utilisateur est l'auteur du post ou admin
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
    
    // Mettre à jour le post
    await db.collection("group_posts").updateOne(
      { _id: new ObjectId(postId) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    )

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

    // Vérifier les permissions
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