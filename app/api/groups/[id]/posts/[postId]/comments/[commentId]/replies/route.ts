// /app/api/groups/[id]/posts/[postId]/comments/[commentId]/replies/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; postId: string; commentId: string }> }
) {
  try {
    const { id, postId, commentId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Validation des IDs
    if (!ObjectId.isValid(id) || !ObjectId.isValid(postId) || !ObjectId.isValid(commentId)) {
      return NextResponse.json(
        { error: "ID invalide" },
        { status: 400 }
      )
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
        { error: "Vous devez être membre" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Récupérer les réponses
    const replies = await db.collection("post_comments").aggregate([
      {
        $match: {
          postId: new ObjectId(postId),
          groupId: new ObjectId(id),
          parentId: new ObjectId(commentId),
          status: 'published'
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "author"
        }
      },
      { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
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
          as: "authorMembership"
        }
      },
      {
        $addFields: {
          authorRole: { $arrayElemAt: ["$authorMembership.role", 0] },
          userLiked: { $in: [userId, "$likes"] },
          likesCount: { $size: "$likes" }
        }
      },
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
          updatedAt: 1
        }
      },
      { $sort: { createdAt: 1 } },
      { $skip: skip },
      { $limit: limit }
    ]).toArray()

    // Compter le total de réponses
    const totalReplies = await db.collection("post_comments").countDocuments({
      postId: new ObjectId(postId),
      groupId: new ObjectId(id),
      parentId: new ObjectId(commentId),
      status: 'published'
    })

    // Formater les réponses
    const formattedReplies = replies.map(reply => ({
      ...reply,
      _id: reply._id.toString(),
      userId: reply.userId.toString(),
      author: reply.author ? {
        ...reply.author,
        _id: reply.author._id.toString()
      } : null,
      replies: [],
      repliesCount: 0
    }))

    return NextResponse.json({
      replies: formattedReplies,
      pagination: {
        page,
        limit,
        total: totalReplies,
        pages: Math.ceil(totalReplies / limit),
        hasMore: page * limit < totalReplies
      }
    })

  } catch (error: any) {
    console.error("Error fetching replies:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    )
  }
}