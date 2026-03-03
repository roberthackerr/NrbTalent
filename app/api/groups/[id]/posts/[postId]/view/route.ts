// /app/api/groups/[id]/posts/[postId]/view/route.ts
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

    // Vérifier si l'utilisateur est membre du groupe
    const isMember = await db.collection("group_members").findOne({
      groupId: new ObjectId(id),
      userId: userId,
      status: 'active'
    })

    if (!isMember) {
      return NextResponse.json(
        { error: "Vous devez être membre du groupe pour voir les posts" },
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

    // Marquer le post comme vu (incrémenter le compteur)
    // On vérifie d'abord si l'utilisateur a déjà vu ce post
    const viewRecord = await db.collection("post_views").findOne({
      postId: new ObjectId(postId),
      userId: userId
    })

    if (!viewRecord) {
      // Ajouter la vue dans l'historique
      await db.collection("post_views").insertOne({
        postId: new ObjectId(postId),
        userId: userId,
        groupId: new ObjectId(id),
        viewedAt: new Date()
      })

      // Incrémenter le compteur de vues
      await db.collection("group_posts").updateOne(
        { _id: new ObjectId(postId) },
        { $inc: { viewCount: 1 } }
      )

      // Mettre à jour les statistiques du groupe
      await db.collection("groups").updateOne(
        { _id: new ObjectId(id) },
        {
          $inc: { 'stats.totalViews': 1 },
          $set: { 'stats.lastActivityAt': new Date() }
        }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Post marqué comme vu"
    })

  } catch (error: any) {
    console.error("Error marking post as viewed:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    )
  }
}