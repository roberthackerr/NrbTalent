// /app/api/groups/[id]/posts/[postId]/save/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

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

    // Vérifier si l'utilisateur a déjà sauvegardé ce post
    const existingSave = await db.collection("saved_posts").findOne({
      postId: new ObjectId(postId),
      userId: userId
    })

    if (existingSave) {
      // Retirer la sauvegarde
      await db.collection("saved_posts").deleteOne({
        _id: existingSave._id
      })

      // Décrémenter le compteur
      await db.collection("group_posts").updateOne(
        { _id: new ObjectId(postId) },
        { $inc: { saveCount: -1 } }
      )

      return NextResponse.json({
        success: true,
        action: 'unsaved',
        message: "Post retiré des sauvegardes"
      })
    } else {
      // Sauvegarder le post
      await db.collection("saved_posts").insertOne({
        postId: new ObjectId(postId),
        userId: userId,
        groupId: new ObjectId(id),
        savedAt: new Date(),
        postTitle: post.title,
        postType: post.type,
        postAuthor: post.authorId
      })

      // Incrémenter le compteur
      await db.collection("group_posts").updateOne(
        { _id: new ObjectId(postId) },
        { $inc: { saveCount: 1 } }
      )

      return NextResponse.json({
        success: true,
        action: 'saved',
        message: "Post sauvegardé avec succès"
      })
    }

  } catch (error: any) {
    console.error("Error saving post:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    )
  }
}

// GET: Récupérer les posts sauvegardés par l'utilisateur
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; postId?: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    const savedPosts = await db.collection("saved_posts")
      .find({ userId: userId, groupId: new ObjectId(id) })
      .sort({ savedAt: -1 })
      .toArray()

    return NextResponse.json({ savedPosts })

  } catch (error: any) {
    console.error("Error fetching saved posts:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    )
  }
}