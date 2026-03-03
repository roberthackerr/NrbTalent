// app/api/projects/[id]/check-access/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const db = await getDatabase()
    const {id}=await params;
    const projectId = new ObjectId(id)

    const project = await db.collection("projects").findOne(
      { _id: projectId },
      { projection: { clientId: 1 } }
    )

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 })
    }

    const isClient = project.clientId.toString() === session.user.id
    const isAdmin = (session.user as any).role === "admin"

    return NextResponse.json({
      hasAccess: isClient || isAdmin,
      role: isClient ? "client" : isAdmin ? "admin" : "viewer",
      canGenerateAI: isClient,
      projectId: params.id
    })

  } catch (error) {
    console.error("Check access error:", error)
    return NextResponse.json(
      { error: "Erreur de vérification" },
      { status: 500 }
    )
  }
}