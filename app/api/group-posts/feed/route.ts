// /app/api/group-posts/feed/route.ts - Version corrigée
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const { searchParams } = new URL(request.url)
    
    // Paramètres
    const type = searchParams.get('type')
    const sortBy = searchParams.get('sortBy') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // 1. Récupérer tous les groupes où l'utilisateur est membre
    const userGroups = await db.collection("group_members").find({
      userId: userId,
      status: 'active'
    }).toArray()

    if (userGroups.length === 0) {
      return NextResponse.json({
        posts: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 1,
          hasMore: false
        }
      })
    }

    const groupIds = userGroups.map(g => g.groupId)

    // 2. Construire la requête EXACTEMENT comme dans l'API des groupes
    const match: any = {
      groupId: { $in: groupIds },
      status: 'published'
    }
    
    if (type) match.type = type

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

    // Pipeline d'agrégation EXACTEMENT comme dans l'API des groupes
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
      // Ajouter le lookup du groupe
      {
        $lookup: {
          from: "groups",
          localField: "groupId",
          foreignField: "_id",
          as: "group"
        }
      },
      { $unwind: "$group" },
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
          // Informations de l'auteur
          "author._id": 1,
          "author.name": 1,
          "author.avatar": 1,
          "author.title": 1,
          "author.company": 1,
          authorRole: 1,
          // Informations du groupe
          "group._id": 1,
          "group.name": 1,
          "group.slug": 1,
          "group.avatar": 1,
          "group.description": 1,
          "group.type": 1
        }
      }
    ]

    // Exécuter la requête
    const [posts, total] = await Promise.all([
      db.collection("group_posts").aggregate(pipeline).toArray(),
      db.collection("group_posts").countDocuments(match)
    ])

    // Formater les données de retour EXACTEMENT comme dans l'API des groupes
    const formattedPosts = posts.map(post => ({
      ...post,
      _id: post._id.toString(),
      groupId: post.group?._id?.toString(),
      authorId: post.author?._id?.toString(),
      author: post.author ? {
        ...post.author,
        _id: post.author._id.toString()
      } : null,
      group: post.group ? {
        ...post.group,
        _id: post.group._id.toString()
      } : null
    }))

    const pages = Math.ceil(total / limit)
    const hasMore = page * limit < total

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasMore
      }
    })

  } catch (error: any) {
    console.error("❌ Error fetching group posts feed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}