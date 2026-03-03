// /app/api/groups/[id]/posts/[postId]/comments/[commentId]/like/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; postId: string; commentId: string }> }
) {
  try {
    const { id, postId, commentId } = await params
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
        { error: "Vous devez être membre pour aimer les commentaires" },
        { status: 403 }
      )
    }

    // Vérifier si le commentaire existe et est publié
    const comment = await db.collection("post_comments").findOne({
      _id: new ObjectId(commentId),
      postId: new ObjectId(postId),
      groupId: new ObjectId(id),
      status: 'published'
    })

    if (!comment) {
      return NextResponse.json(
        { error: "Commentaire non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier si l'utilisateur a déjà aimé le commentaire
    const hasLiked = comment.likes?.some((like: ObjectId) => like.equals(userId))

    if (hasLiked) {
      // Retirer le like
      await db.collection("post_comments").updateOne(
        { _id: new ObjectId(commentId) },
        {
          $pull: { likes: userId },
          $inc: { likesCount: -1 }
        }
      )

      return NextResponse.json({
        success: true,
        action: 'unliked',
        likesCount: comment.likesCount - 1
      })
    } else {
      // Ajouter le like
      await db.collection("post_comments").updateOne(
        { _id: new ObjectId(commentId) },
        {
          $addToSet: { likes: userId },
          $inc: { likesCount: 1 }
        }
      )

      // Créer une notification pour l'auteur du commentaire (si différent de l'utilisateur)
      if (!comment.userId.equals(userId)) {
        await db.collection("notifications").insertOne({
          userId: comment.userId,
          type: 'comment_like',
          message: `${session.user?.name} a aimé votre commentaire`,
          data: {
            postId: postId,
            commentId: commentId,
            groupId: id,
            authorId: userId.toString(),
            authorName: session.user?.name
          },
          read: false,
          createdAt: new Date()
        })
      }

      return NextResponse.json({
        success: true,
        action: 'liked',
        likesCount: comment.likesCount + 1
      })
    }

  } catch (error: any) {
    console.error("Error liking comment:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    )
  }
}