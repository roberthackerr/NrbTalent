// /app/api/groups/[id]/members/route.ts - VERSION CORRIGÉE
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// GET: Récupérer les membres d'un groupe
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params // <- AJOUTER CETTE LIGNE
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    
    // Vérifier si l'utilisateur a accès au groupe
    const group = await db.collection("groups").findOne({
      _id: new ObjectId(id) // <- UTILISER id au lieu de params.id
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Si le groupe est public, tout le monde peut voir les membres
    // Si privé, il faut être membre
    if (group.visibility === 'private') {
      const isMember = await db.collection("group_members").findOne({
        groupId: new ObjectId(id), // <- UTILISER id
        userId: userId,
        status: 'active'
      })

      if (!isMember) {
        return NextResponse.json({ 
          error: "Vous devez être membre pour voir les membres" 
        }, { status: 403 })
      }
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build match query
    const match: any = {
      groupId: new ObjectId(id), // <- UTILISER id
      status: 'active'
    }
    
    if (role && role !== 'all') match.role = role

    // Build aggregation pipeline
    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" }
    ]

    // Add search filter if provided
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "user.name": { $regex: search, $options: "i" } },
            { "user.email": { $regex: search, $options: "i" } },
            { "user.title": { $regex: search, $options: "i" } },
            { "user.company": { $regex: search, $options: "i" } }
          ]
        }
      })
    }

    // Continue with sorting and pagination
    pipeline.push(
      { $sort: { 
        role: 1, // Owners first, then admins, moderators, members
        joinedAt: 1 
      }},
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          role: 1,
          status: 1,
          joinedAt: 1,
          activity: 1,
          badges: 1,
          'user._id': 1,
          'user.name': 1,
          'user.avatar': 1,
          'user.title': 1,
          'user.company': 1,
          'user.location': 1,
          'user.skills': 1,
          'user.statistics': 1,
          'user.isVerified': 1
        }
      }
    )

    const [members, total] = await Promise.all([
      db.collection("group_members").aggregate(pipeline).toArray(),
      db.collection("group_members").countDocuments(match)
    ])

    // Get current user's role for permission checks
    const currentUserRole = await db.collection("group_members").findOne({
      groupId: new ObjectId(id), // <- UTILISER id
      userId: userId
    })

    return NextResponse.json({
      members: members.map(m => ({
        ...m,
        _id: m._id.toString(),
        userId: m.user._id.toString(),
        user: {
          ...m.user,
          _id: m.user._id.toString()
        }
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      currentUserRole: currentUserRole?.role || null,
      canInvite: currentUserRole?.role === 'owner' || currentUserRole?.role === 'admin'
    })
  } catch (error) {
    console.error("Error fetching group members:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST: Rejoindre un groupe ou faire une demande
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // <- CHANGER LE TYPE
) {
  try {
    const { id } = await params // <- AJOUTER CETTE LIGNE
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const groupId = new ObjectId(id) // <- UTILISER id

    const group = await db.collection("groups").findOne({ _id: groupId })
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Vérifier si l'utilisateur est déjà membre
    const existingMember = await db.collection("group_members").findOne({
      groupId,
      userId
    })

    if (existingMember) {
      if (existingMember.status === 'active') {
        return NextResponse.json(
          { error: "Vous êtes déjà membre de ce groupe" },
          { status: 400 }
        )
      }
      if (existingMember.status === 'pending') {
        return NextResponse.json(
          { error: "Votre demande est déjà en attente" },
          { status: 400 }
        )
      }
      if (existingMember.status === 'banned') {
        return NextResponse.json(
          { error: "Vous avez été banni de ce groupe" },
          { status: 403 }
        )
      }
    }

    // Gérer le cas où le body est vide
    let message = ''
    try {
      const body = await request.json()
      message = body.message || ''
    } catch (error) {
      // Body vide, c'est OK
      console.log('No message provided in join request')
    }

    // Gérer selon la visibilité du groupe
    if (group.visibility === 'private') {
      // Créer une demande d'adhésion
      await db.collection("group_join_requests").insertOne({
        groupId,
        userId,
        message,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Notifier les admins
      const admins = await db.collection("group_members").find({
        groupId,
        role: { $in: ['owner', 'admin'] },
        status: 'active'
      }).toArray()

      for (const admin of admins) {
        await db.collection("notifications").insertOne({
          userId: admin.userId,
          type: 'group_join_request',
          title: 'Nouvelle demande d\'adhésion',
          message: `${session.user?.name || 'Un utilisateur'} souhaite rejoindre "${group.name}"`,
          data: {
            groupId: id, // <- UTILISER id
            userId: userId.toString(),
            userName: session.user?.name,
            groupName: group.name
          },
          read: false,
          createdAt: new Date()
        })
      }

      return NextResponse.json({
        success: true,
        message: "Demande d'adhésion envoyée avec succès",
        requiresApproval: true
      })
    } else {
      // Rejoindre directement
      const member = {
        _id: new ObjectId(),
        groupId,
        userId,
        role: 'member',
        status: 'active',
        joinedAt: new Date(),
        activity: {
          postCount: 0,
          commentCount: 0,
          eventAttendance: 0,
          lastActivity: new Date()
        },
        badges: ['new-member'],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection("group_members").insertOne(member)

      // Mettre à jour les statistiques du groupe
      await db.collection("groups").updateOne(
        { _id: groupId },
        {
          $inc: { 'stats.totalMembers': 1 },
          $set: { updatedAt: new Date() }
        }
      )

      return NextResponse.json({
        ...member,
        _id: member._id.toString(),
        groupId: member.groupId.toString(),
        userId: member.userId.toString()
      }, { status: 201 })
    }
  } catch (error: any) {
    console.error("Error joining group:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE: Quitter un groupe
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // <- CHANGER LE TYPE
) {
  try {
    const { id } = await params // <- AJOUTER CETTE LIGNE
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const groupId = new ObjectId(id) // <- UTILISER id

    // Vérifier si l'utilisateur est membre
    const member = await db.collection("group_members").findOne({
      groupId,
      userId,
      status: 'active'
    })

    if (!member) {
      return NextResponse.json(
        { error: "Vous n'êtes pas membre de ce groupe" },
        { status: 404 }
      )
    }

    // L'owner ne peut pas quitter son propre groupe
    if (member.role === 'owner') {
      const ownersCount = await db.collection("group_members").countDocuments({
        groupId,
        role: 'owner',
        status: 'active'
      })
      
      if (ownersCount === 1) {
        return NextResponse.json(
          { error: "Le propriétaire ne peut pas quitter le groupe. Transférez la propriété d'abord." },
          { status: 400 }
        )
      }
    }

    // Supprimer le membre
    await db.collection("group_members").deleteOne({
      groupId,
      userId
    })

    // Mettre à jour les statistiques du groupe
    await db.collection("groups").updateOne(
      { _id: groupId },
      {
        $inc: { 'stats.totalMembers': -1 },
        $set: { updatedAt: new Date() }
      }
    )

    return NextResponse.json({
      success: true,
      message: "Vous avez quitté le groupe avec succès"
    })
  } catch (error: any) {
    console.error("Error leaving group:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}