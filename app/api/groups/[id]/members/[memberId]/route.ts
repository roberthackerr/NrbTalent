// /app/api/groups/[id]/members/[memberId]/route.ts
// Pour gérer un membre spécifique (rôles, suppression, etc.)

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { notificationService } from "@/services/NotificationService"

// GET: Récupérer un membre spécifique
export async function GET(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Vérifier les permissions
    const currentUserRole = await db.collection("group_members").findOne({
      groupId: new ObjectId(params.id),
      userId,
      status: 'active'
    })

    if (!currentUserRole) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Récupérer le membre
    const member = await db.collection("group_members").findOne({
      groupId: new ObjectId(params.id),
      userId: new ObjectId(params.memberId),
      status: 'active'
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error("Error fetching member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH: Mettre à jour le rôle d'un membre
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const data = await request.json()

    // Vérifier les permissions
    const currentUser = await db.collection("group_members").findOne({
      groupId: new ObjectId(params.id),
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
      groupId: new ObjectId(params.id),
      userId: new ObjectId(params.memberId),
      status: 'active'
    })

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Les owners ne peuvent pas être modifiés par les admins
    if (targetMember.role === 'owner' && currentUser.role !== 'owner') {
      return NextResponse.json({ 
        error: "Seul le propriétaire peut modifier un autre propriétaire" 
      }, { status: 403 })
    }

    // Mettre à jour le rôle
    await db.collection("group_members").updateOne(
      {
        groupId: new ObjectId(params.id),
        userId: new ObjectId(params.memberId)
      },
      {
        $set: {
          role: data.role,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: "Rôle mis à jour avec succès"
    })
  } catch (error: any) {
    console.error("Error updating member:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE: Retirer un membre du groupe
export async function DELETE(
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
    const userEmail = (session.user as any).email
    const userName = session.user?.name || 'Un administrateur'

    // Vérifier les permissions
    const currentUser = await db.collection("group_members").findOne({
      groupId: new ObjectId(id),
      userId,
      status: 'active'
    })

    if (!currentUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
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

    // Logique de permission
    if (currentUser.role === 'owner') {
      if (targetMember.userId.equals(userId)) {
        // L'owner veut se supprimer lui-même
        const otherOwners = await db.collection("group_members").countDocuments({
          groupId: new ObjectId(id),
          role: 'owner',
          userId: { $ne: userId }
        })
        
        if (otherOwners === 0) {
          return NextResponse.json({
            error: "Vous devez transférer la propriété avant de quitter le groupe"
          }, { status: 400 })
        }
      }
    } else if (currentUser.role === 'admin') {
      // Admin ne peut pas supprimer owner ou d'autres admins
      if (['owner', 'admin'].includes(targetMember.role)) {
        return NextResponse.json({
          error: "Vous ne pouvez pas supprimer un propriétaire ou un admin"
        }, { status: 403 })
      }
    } else {
      return NextResponse.json({
        error: "Vous n'avez pas la permission de supprimer des membres"
      }, { status: 403 })
    }

    // Récupérer la raison si fournie
    let reason = ''
    try {
      const body = await request.json()
      reason = body.reason || ''
    } catch (error) {
      // Pas de body, c'est OK
    }

    // Récupérer les infos de l'utilisateur à supprimer
    const userToRemove = await db.collection("users").findOne({
      _id: new ObjectId(memberId)
    })

    // 1. Notifier l'utilisateur AVANT la suppression
    if (userToRemove) {
      try {
        await notificationService.send(
          memberId,
          notificationService.templates.groupMemberRemoved(
            group.name,
            id,
            userName,
            reason
          )
        )
      } catch (notificationError) {
        console.error('Error sending removal notification:', notificationError)
        // Continuer même si la notification échoue
      }
    }

    // 2. Supprimer le membre
    await db.collection("group_members").deleteOne({
      groupId: new ObjectId(id),
      userId: new ObjectId(memberId)
    })

    // 3. Mettre à jour les statistiques du groupe
    await db.collection("groups").updateOne(
      { _id: new ObjectId(id) },
      {
        $inc: { 'stats.totalMembers': -1 },
        $set: { updatedAt: new Date() }
      }
    )

    // 4. Notifier les autres admins (optionnel)
    if (currentUser.role === 'admin') {
      const owners = await db.collection("group_members").find({
        groupId: new ObjectId(id),
        role: 'owner',
        status: 'active',
        userId: { $ne: userId }
      }).toArray()

      for (const owner of owners) {
        try {
          await notificationService.send(
            owner.userId.toString(),
            {
              category: 'COMMUNITY',
              priority: 'MEDIUM',
              title: '👥 Membre retiré',
              message: `${userName} a retiré ${userToRemove?.name || 'un membre'} de "${group.name}"`,
              actionUrl: `/groups/${id}/members`,
              data: {
                entityId: id,
                entityType: 'group',
                entityName: group.name
              }
            }
          )
        } catch (error) {
          console.error('Error notifying owner:', error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Membre retiré avec succès"
    })
  } catch (error: any) {
    console.error("Error removing member:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}