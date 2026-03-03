// /app/api/groups/[id]/members/[memberId]/role/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { notificationService } from "@/services/NotificationService"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const userName = session.user?.name || 'Un administrateur'
    
    const { role, reason } = await request.json()

    // Vérifier les permissions
    const currentUser = await db.collection("group_members").findOne({
      groupId: new ObjectId(id),
      userId,
      status: 'active'
    })

    if (!currentUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Seuls owner et admin peuvent modifier les rôles
    if (!['owner', 'admin'].includes(currentUser.role)) {
      return NextResponse.json({ 
        error: "Vous n'avez pas la permission de modifier les rôles" 
      }, { status: 403 })
    }

    const targetMember = await db.collection("group_members").findOne({
      groupId: new ObjectId(id),
      userId: new ObjectId(memberId),
      status: 'active'
    })

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Récupérer les infos du groupe
    const group = await db.collection("groups").findOne({
      _id: new ObjectId(id)
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Les owners ne peuvent pas être modifiés par les admins
    if (targetMember.role === 'owner' && currentUser.role !== 'owner') {
      return NextResponse.json({ 
        error: "Seul le propriétaire peut modifier un autre propriétaire" 
      }, { status: 403 })
    }

    // Ne pas notifier si c'est la même personne
    if (!targetMember.userId.equals(userId)) {
      // Notifier l'utilisateur du changement de rôle
      try {
        await notificationService.send(
          memberId,
          notificationService.templates.groupRoleChanged(
            group.name,
            id,
            role,
            userName
          )
        )
      } catch (notificationError) {
        console.error('Error sending role change notification:', notificationError)
        // Continuer même si la notification échoue
      }
    }

    // Mettre à jour le rôle
    await db.collection("group_members").updateOne(
      {
        groupId: new ObjectId(id),
        userId: new ObjectId(memberId)
      },
      {
        $set: {
          role: role,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: "Rôle mis à jour avec succès"
    })
  } catch (error: any) {
    console.error("Error updating member role:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}