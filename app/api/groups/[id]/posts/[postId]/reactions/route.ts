// /app/api/groups/[id]/posts/[postId]/reactions/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

type ReactionType = 'like' | 'love' | 'insightful' | 'helpful' | 'celebrate'

export async function POST(
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
    const body = await request.json()
    const reaction = body.reaction as ReactionType

    if (!reaction || !['like', 'love', 'insightful', 'helpful', 'celebrate'].includes(reaction)) {
      return NextResponse.json(
        { error: "Type de réaction invalide" },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur est membre du groupe
    const isMember = await db.collection("group_members").findOne({
      groupId: new ObjectId(id),
      userId: userId,
      status: 'active'
    })

    if (!isMember) {
      return NextResponse.json(
        { error: "Vous devez être membre du groupe pour réagir" },
        { status: 403 }
      )
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

    // Vérifier si l'utilisateur a déjà réagi à ce post
    const existingReaction = await db.collection("post_reactions").findOne({
      postId: new ObjectId(postId),
      userId: userId,
      reaction: reaction
    })

    if (existingReaction) {
      // Retirer la réaction
      await db.collection("post_reactions").deleteOne({
        _id: existingReaction._id
      })

      // Décrémenter le compteur
      await db.collection("group_posts").updateOne(
        { _id: new ObjectId(postId) },
        { $inc: { [`reactionCounts.${reaction}`]: -1 } }
      )

      return NextResponse.json({
        success: true,
        action: 'removed',
        message: "Réaction retirée"
      })
    } else {
      // Supprimer toute autre réaction de l'utilisateur sur ce post
      await db.collection("post_reactions").deleteMany({
        postId: new ObjectId(postId),
        userId: userId
      })

      // Ajouter la nouvelle réaction
      await db.collection("post_reactions").insertOne({
        postId: new ObjectId(postId),
        userId: userId,
        groupId: new ObjectId(id),
        reaction: reaction,
        createdAt: new Date()
      })

      // Incrémenter le compteur de la nouvelle réaction
      await db.collection("group_posts").updateOne(
        { _id: new ObjectId(postId) },
        { $inc: { [`reactionCounts.${reaction}`]: 1 } }
      )

      // Mettre à jour la dernière activité
      await db.collection("groups").updateOne(
        { _id: new ObjectId(id) },
        { $set: { 'stats.lastActivityAt': new Date() } }
      )

      return NextResponse.json({
        success: true,
        action: 'added',
        message: "Réaction ajoutée"
      })
    }

  } catch (error: any) {
    console.error("Error managing reaction:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    )
  }
}

// GET: Récupérer les réactions d'un post
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

    // Récupérer les réactions avec les utilisateurs
    const reactions = await db.collection("post_reactions")
      .aggregate([
        {
          $match: {
            postId: new ObjectId(postId),
            groupId: new ObjectId(id)
          }
        },
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
          $group: {
            _id: "$reaction",
            count: { $sum: 1 },
            users: {
              $push: {
                _id: "$user._id",
                name: "$user.name",
                avatar: "$user.avatar"
              }
            }
          }
        },
        {
          $project: {
            reaction: "$_id",
            count: 1,
            users: { $slice: ["$users", 10] }, // Limiter à 10 utilisateurs par réaction
            _id: 0
          }
        }
      ])
      .toArray()

    // Vérifier la réaction de l'utilisateur actuel
    const userReaction = await db.collection("post_reactions").findOne({
      postId: new ObjectId(postId),
      userId: userId
    })

    return NextResponse.json({
      reactions,
      userReaction: userReaction?.reaction || null
    })

  } catch (error: any) {
    console.error("Error fetching reactions:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    )
  }
}