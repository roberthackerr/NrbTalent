// /app/api/groups/[id]/posts/[postId]/share/route.ts
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

    // Vérifier si l'utilisateur a déjà partagé ce post récemment (dans les dernières 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const recentShare = await db.collection("post_shares").findOne({
      postId: new ObjectId(postId),
      userId: userId,
      createdAt: { $gte: twentyFourHoursAgo }
    })

    if (recentShare) {
      return NextResponse.json(
        { error: "Vous avez déjà partagé ce post récemment" },
        { status: 400 }
      )
    }

    // Enregistrer le partage
    await db.collection("post_shares").insertOne({
      postId: new ObjectId(postId),
      userId: userId,
      groupId: new ObjectId(id),
      sharedAt: new Date(),
      platform: 'web' // ou 'mobile', etc.
    })

    // Incrémenter le compteur de partages
    await db.collection("group_posts").updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { shareCount: 1 } }
    )

    // Mettre à jour les statistiques du groupe
    await db.collection("groups").updateOne(
      { _id: new ObjectId(id) },
      {
        $inc: { 'stats.totalShares': 1 },
        $set: { 'stats.lastActivityAt': new Date() }
      }
    )

    return NextResponse.json({
      success: true,
      message: "Post partagé avec succès"
    })

  } catch (error: any) {
    console.error("Error sharing post:", error)
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    )
  }
}