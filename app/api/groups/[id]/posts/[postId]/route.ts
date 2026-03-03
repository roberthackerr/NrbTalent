// /app/api/groups/[id]/posts/[postId]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
        { error: "Vous devez être membre pour voir ce post" },
        { status: 403 }
      )
    }

    // Pipeline d'agrégation pour obtenir le post avec toutes les informations
    const pipeline = [
      {
        $match: {
          _id: new ObjectId(postId),
          groupId: new ObjectId(id),
          status: 'published'
        }
      },
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

    const posts = await db.collection("group_posts")
      .aggregate(pipeline)
      .toArray()

    if (posts.length === 0) {
      return NextResponse.json({ error: "Post non trouvé" }, { status: 404 })
    }

    const post = posts[0]

    // Formater la réponse
    const response = {
      ...post,
      _id: post._id.toString(),
      groupId: id,
      authorId: post.author?._id?.toString(),
      author: post.author ? {
        ...post.author,
        _id: post.author._id.toString()
      } : null
    }

    // Marquer le post comme vu (dans le background)
    setTimeout(async () => {
      try {
        await db.collection("group_posts").updateOne(
          { _id: new ObjectId(postId) },
          { $inc: { viewCount: 1 } }
        )
      } catch (error) {
        console.error("Background view count update failed:", error)
      }
    }, 0)

    return NextResponse.json(response)

  } catch (error: any) {
    console.error("Error fetching post:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    )
  }
}

// PUT: Mettre à jour un post
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Vérifier si l'utilisateur est l'auteur ou admin
    const post = await db.collection("group_posts").findOne({
      _id: new ObjectId(postId),
      groupId: new ObjectId(id)
    })

    if (!post) {
      return NextResponse.json({ error: "Post non trouvé" }, { status: 404 })
    }

    const isAuthor = post.authorId.equals(userId)
    const isAdmin = await db.collection("group_members").findOne({
      groupId: new ObjectId(id),
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
    
    // Mettre à jour
    await db.collection("group_posts").updateOne(
      { _id: new ObjectId(postId) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({ success: true, message: "Post mis à jour" })

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
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Vérifier les permissions
    const post = await db.collection("group_posts").findOne({
      _id: new ObjectId(postId),
      groupId: new ObjectId(id)
    })

    if (!post) {
      return NextResponse.json({ error: "Post non trouvé" }, { status: 404 })
    }

    const isAuthor = post.authorId.equals(userId)
    const isAdmin = await db.collection("group_members").findOne({
      groupId: new ObjectId(id),
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

    // Soft delete
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
      { _id: new ObjectId(id) },
      { $inc: { 'stats.totalPosts': -1 } }
    )

    return NextResponse.json({ success: true, message: "Post supprimé" })

  } catch (error: any) {
    console.error("Error deleting post:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    )
  }
}