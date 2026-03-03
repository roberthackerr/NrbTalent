// /app/api/groups/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { GroupService } from "@/lib/services/group-service"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const group = await db.collection("groups").findOne({
      _id: new ObjectId(params.id),
      $or: [
        { status: { $ne: 'archived' } },
        { status: { $exists: false } }
      ]
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Vérifier si l'utilisateur est membre
    const isMember = await db.collection("group_members").findOne({
      groupId: new ObjectId(params.id),
      userId: new ObjectId((session.user as any).id)
    })

    // Récupérer les stats supplémentaires
    const [memberCount, postCount] = await Promise.all([
      db.collection("group_members").countDocuments({
        groupId: new ObjectId(params.id),
        status: 'active'
      }),
      db.collection("group_posts").countDocuments({
        groupId: new ObjectId(params.id),
        status: 'published'
      })
    ])

    // Récupérer les derniers posts
    const recentPosts = await db.collection("group_posts")
      .find({
        groupId: new ObjectId(params.id),
        status: 'published'
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()

    // Récupérer les membres actifs
    const activeMembers = await db.collection("group_members")
      .aggregate([
        { $match: { groupId: new ObjectId(params.id), status: 'active' } },
        { $sort: { 'activity.lastActive': -1 } },
        { $limit: 10 },
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
            role: 1,
            joinedAt: 1,
            'user._id': 1,
            'user.name': 1,
            'user.avatar': 1,
            'user.title': 1
          }
        }
      ])
      .toArray()

    return NextResponse.json({
      ...group,
      isMember: !!isMember,
      memberRole: isMember?.role,
      stats: {
        ...group.stats,
        memberCount,
        postCount
      },
      recentPosts,
      activeMembers
    })
  } catch (error) {
    console.error("Error fetching group:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}