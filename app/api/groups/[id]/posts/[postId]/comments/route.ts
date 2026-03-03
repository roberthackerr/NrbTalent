

// /app/api/groups/[id]/posts/[postId]/comments/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

// Schéma de validation
const commentSchema = z.object({
  content: z.string()
    .min(1, "Le commentaire ne peut pas être vide")
    .max(1000, "Le commentaire ne peut pas dépasser 1000 caractères"),
  parentId: z.string().optional().nullable(),
  attachments: z.array(z.object({
    url: z.string(),
    type: z.enum(['image', 'video', 'file']),
    name: z.string().optional(),
    size: z.number().optional()
  })).optional().default([]),
  mentions: z.array(z.string()).optional().default([])
})

// /app/api/groups/[id]/posts/[postId]/comments/route.ts

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Vérifier si l'utilisateur est membre du groupe
    const isMember = await db.collection("group_members").findOne({
      groupId: new ObjectId(id),
      userId: userId,
      status: 'active'
    })

    if (!isMember) {
      return NextResponse.json(
        { error: "Vous devez être membre pour voir les commentaires" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Pipeline d'agrégation pour charger les commentaires AVEC leurs réponses
    const pipeline = [
      // Étape 1: Récupérer les commentaires principaux
      {
        $match: {
          postId: new ObjectId(postId),
          groupId: new ObjectId(id),
          status: 'published',
          parentId: { $exists: false } // Commentaires sans parent
        }
      },
      // Étape 2: Charger les infos de l'auteur
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "author"
        }
      },
      { $unwind: "$author" },
      // Étape 3: Charger le rôle dans le groupe
      {
        $lookup: {
          from: "group_members",
          let: { commentUserId: "$userId", commentGroupId: "$groupId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$commentUserId"] },
                    { $eq: ["$groupId", "$$commentGroupId"] }
                  ]
                }
              }
            }
          ],
          as: "authorMembership"
        }
      },
      // Étape 4: Ajouter les champs calculés
      {
        $addFields: {
          authorRole: { $arrayElemAt: ["$authorMembership.role", 0] },
          userLiked: { $in: [userId, "$likes"] },
          likesCount: { $size: "$likes" },
          // Initialiser le tableau de réponses
          replies: [],
          repliesCount: 0
        }
      },
      // Étape 5: CHARGER LES RÉPONSES
      {
        $lookup: {
          from: "post_comments",
          let: { parentCommentId: "$_id" },
          pipeline: [
            // Récupérer les réponses à ce commentaire
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$parentId", "$$parentCommentId"] },
                    { $eq: ["$status", "published"] }
                  ]
                }
              }
            },
            // Limiter le nombre de réponses à charger initialement
            { $limit: 5 },
            // Charger les infos des auteurs des réponses
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "replyAuthor"
              }
            },
            { $unwind: "$replyAuthor" },
            // Charger le rôle des auteurs des réponses
            {
              $lookup: {
                from: "group_members",
                let: { replyUserId: "$userId", replyGroupId: "$groupId" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$userId", "$$replyUserId"] },
                          { $eq: ["$groupId", "$$replyGroupId"] }
                        ]
                      }
                    }
                  }
                ],
                as: "replyAuthorMembership"
              }
            },
            // Ajouter les champs calculés pour les réponses
            {
              $addFields: {
                author: "$replyAuthor",
                authorRole: { $arrayElemAt: ["$replyAuthorMembership.role", 0] },
                userLiked: { $in: [userId, "$likes"] },
                likesCount: { $size: "$likes" },
                // Les réponses n'ont pas de sous-réponses dans ce chargement
                replies: [],
                repliesCount: 0
              }
            },
            // Sélectionner les champs à retourner
            {
              $project: {
                _id: 1,
                content: 1,
                userId: 1,
                author: {
                  _id: 1,
                  name: 1,
                  avatar: 1,
                  title: 1,
                  company: 1,
                  isVerified: 1
                },
                authorRole: 1,
                likesCount: 1,
                userLiked: 1,
                attachments: 1,
                mentions: 1,
                createdAt: 1,
                updatedAt: 1,
                parentId: 1,
                isEdited: 1,
                editedAt: 1,
                isPinned: 1,
                replies: 1,
                repliesCount: 1
              }
            },
            { $sort: { createdAt: 1 } }
          ],
          as: "replies"
        }
      },
      // Étape 6: Compter le nombre total de réponses
      {
        $addFields: {
          repliesCount: { $size: "$replies" }
        }
      },
      // Étape 7: Formater la réponse
      {
        $project: {
          _id: 1,
          content: 1,
          userId: 1,
          author: {
            _id: 1,
            name: 1,
            avatar: 1,
            title: 1,
            company: 1,
            isVerified: 1
          },
          authorRole: 1,
          likesCount: 1,
          userLiked: 1,
          attachments: 1,
          mentions: 1,
          createdAt: 1,
          updatedAt: 1,
          parentId: 1,
          isEdited: 1,
          editedAt: 1,
          isPinned: 1,
          replies: 1,
          repliesCount: 1
        }
      },
      // Étape 8: Trier et paginer
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]

    // Exécuter l'agrégation
    const comments = await db.collection("post_comments").aggregate(pipeline).toArray()

    // Compter le total de commentaires principaux
    const totalComments = await db.collection("post_comments").countDocuments({
      postId: new ObjectId(postId),
      groupId: new ObjectId(id),
      status: 'published',
      parentId: { $exists: false }
    })

    // Formater les IDs pour le frontend
    const formattedComments = comments.map(comment => ({
      ...comment,
      _id: comment._id.toString(),
      userId: comment.userId.toString(),
      author: {
        ...comment.author,
        _id: comment.author._id.toString()
      },
      parentId: comment.parentId ? comment.parentId.toString() : null,
      replies: comment.replies.map((reply: any) => ({
        ...reply,
        _id: reply._id.toString(),
        userId: reply.userId.toString(),
        author: {
          ...reply.author,
          _id: reply.author._id.toString()
        },
        parentId: reply.parentId ? reply.parentId.toString() : null
      }))
    }))

    return NextResponse.json({
      comments: formattedComments,
      pagination: {
        page,
        limit,
        total: totalComments,
        pages: Math.ceil(totalComments / limit),
        hasMore: page * limit < totalComments
      }
    })

  } catch (error: any) {
    console.error("Error fetching comments:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Vérifier si l'utilisateur est membre
    const isMember = await db.collection("group_members").findOne({
      groupId: new ObjectId(id),
      userId: userId,
      status: 'active'
    })

    if (!isMember) {
      return NextResponse.json(
        { error: "Vous devez être membre pour commenter" },
        { status: 403 }
      )
    }

    // Vérifier les permissions de commentaire du groupe
    const group = await db.collection("groups").findOne({
      _id: new ObjectId(id)
    })

    if (group?.settings?.commentPermissions === 'disabled') {
      return NextResponse.json(
        { error: "Les commentaires sont désactivés pour ce groupe" },
        { status: 403 }
      )
    }

    if (group?.settings?.commentPermissions === 'admins' && 
        isMember.role !== 'admin' && 
        isMember.role !== 'owner' && 
        isMember.role !== 'moderator') {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent commenter" },
        { status: 403 }
      )
    }

    // Lire et parser le body
    let body: any
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json(
        { error: "Format de requête invalide. JSON attendu." },
        { status: 400 }
      )
    }

    // DEBUG: Afficher le body reçu
    console.log("=== REQUEST DEBUG ===")
    console.log("Body received:", JSON.stringify(body, null, 2))
    console.log("Content:", body?.content)
    console.log("ParentId value:", body?.parentId)
    console.log("ParentId type:", typeof body?.parentId)
    console.log("Is parentId valid ObjectId?", ObjectId.isValid(body?.parentId || ''))
    console.log("=== END DEBUG ===")

    // Valider les données
    const validation = commentSchema.safeParse(body)

    if (!validation.success) {
      console.log("Validation errors:", validation.error.errors)
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { content, parentId, attachments, mentions } = validation.data

    // Validation: Vérifier si parentId est un ObjectId valide
    let validParentId: string | null = null
    let parentComment = null
    
    // CORRECTION: parentId peut être null ou undefined, gérer ces cas
    if (parentId && parentId !== 'null' && parentId !== 'undefined' && parentId.trim() !== '') {
      if (!ObjectId.isValid(parentId)) {
        console.log("Invalid parentId format:", parentId)
        return NextResponse.json(
          { error: "ID de commentaire parent invalide" },
          { status: 400 }
        )
      }
      validParentId = parentId
      
      // Vérifier si le commentaire parent existe
      parentComment = await db.collection("post_comments").findOne({
        _id: new ObjectId(parentId),
        postId: new ObjectId(postId),
        groupId: new ObjectId(id),
        status: 'published'
      })

      if (!parentComment) {
        return NextResponse.json(
          { error: "Commentaire parent non trouvé" },
          { status: 404 }
        )
      }
    }

    // Vérifier si le post existe
    const post = await db.collection("group_posts").findOne({
      _id: new ObjectId(postId),
      groupId: new ObjectId(id),
      status: 'published'
    })

    if (!post) {
      return NextResponse.json(
        { error: "Post non trouvé" },
        { status: 404 }
      )
    }

    // Créer l'objet commentaire avec un ID unique
    const commentId = new ObjectId()
    const now = new Date()
    
    // CORRECTION: parentId doit être undefined si null pour respecter le schéma MongoDB
    const commentData: any = {
      _id: commentId,
      // Champs requis
      postId: new ObjectId(postId),
      groupId: new ObjectId(id),
      userId: userId,
      content: content.trim(),
      status: 'published',
      createdAt: now,
      
      // Champs optionnels
      attachments: attachments || [],
      likes: [],
      likesCount: 0,
      isPinned: false,
      isEdited: false,
      updatedAt: now
    }

    // Ajouter parentId seulement si valide
    if (validParentId) {
      commentData.parentId = new ObjectId(validParentId)
    }

    // Gérer les mentions
    if (mentions && mentions.length > 0) {
      commentData.mentions = mentions
        .filter((mentionId: string) => ObjectId.isValid(mentionId))
        .map((mentionId: string) => new ObjectId(mentionId))
    } else {
      commentData.mentions = []
    }

    console.log("Comment data to insert:", JSON.stringify(commentData, null, 2))

    // Insérer le commentaire
    await db.collection("post_comments").insertOne(commentData)

    // Mettre à jour le compteur de commentaires du post
    await db.collection("group_posts").updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { commentCount: 1 } }
    )

    // Mettre à jour la dernière activité du groupe
    await db.collection("groups").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          'stats.lastActivityAt': now,
          'updatedAt': now 
        }
      }
    )

    // Récupérer les informations de l'auteur
    const [author, authorMembership] = await Promise.all([
      db.collection("users").findOne(
        { _id: userId },
        { projection: { name: 1, avatar: 1, title: 1, company: 1, isVerified: 1 } }
      ),
      db.collection("group_members").findOne({
        groupId: new ObjectId(id),
        userId: userId
      })
    ])

    // Formater la réponse pour le frontend
    const response = {
      _id: commentId.toString(),
      postId: postId,
      userId: userId.toString(),
      content: content.trim(),
      parentId: validParentId || null,
      attachments: attachments || [],
      mentions: commentData.mentions.map((id: ObjectId) => id.toString()),
      author: {
        _id: userId.toString(),
        name: session.user?.name || author?.name || 'Utilisateur',
        avatar: session.user?.image || author?.avatar || null,
        title: author?.title || null,
        company: author?.company || null,
        isVerified: author?.isVerified || false
      },
      authorRole: authorMembership?.role || 'member',
      likes: 0,
      likesCount: 0,
      userLiked: false,
      replies: [],
      repliesCount: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error: any) {
    console.error("Error creating comment:", error)
    
    // Gestion spécifique des erreurs
    if (error.message.includes("24 character hex string") || error.message.includes("ObjectId")) {
      return NextResponse.json(
        { error: "ID invalide dans la requête" },
        { status: 400 }
      )
    }
    
    if (error.code === 121) { // Erreur de validation MongoDB
      console.error("MongoDB validation error details:", error.errInfo?.details)
      return NextResponse.json(
        { 
          error: "Erreur de validation des données",
          details: error.errInfo?.details 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: "Erreur lors de la création du commentaire",
        message: error.message 
      },
      { status: 500 }
    )
  }
}