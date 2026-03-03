// /app/api/groups/slug/[slug]/join-requests/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { notificationService } from "@/services/NotificationService"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Trouver le groupe par slug
    const group = await db.collection("groups").findOne({ slug })
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Vérifier si l'utilisateur est admin/owner
    const currentUser = await db.collection("group_members").findOne({
      groupId: group._id,
      userId,
      status: 'active',
      role: { $in: ['owner', 'admin'] }
    })

    if (!currentUser) {
      return NextResponse.json({ 
        error: "Vous n'avez pas la permission de voir les demandes" 
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const match: any = {
      groupId: group._id
    }
    
    if (status !== 'all') {
      match.status = status
    }

    const [requests, total] = await Promise.all([
      db.collection("group_join_requests")
        .aggregate([
          { $match: match },
          { $sort: { createdAt: -1 } },
          { $limit: limit },
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
              message: 1,
              status: 1,
              createdAt: 1,
              processedAt: 1,
              processedBy: 1,
              'user._id': 1,
              'user.name': 1,
              'user.email': 1,
              'user.avatar': 1,
              'user.title': 1,
              'user.company': 1,
              'user.location': 1,
              'user.bio': 1,
              'user.skills': 1
            }
          }
        ])
        .toArray(),
      db.collection("group_join_requests").countDocuments(match)
    ])

    return NextResponse.json({
      requests: requests.map(r => ({
        ...r,
        _id: r._id.toString(),
        userId: r.user._id.toString(),
        user: {
          ...r.user,
          _id: r.user._id.toString()
        }
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      currentUserRole: currentUser.role
    })
  } catch (error) {
    console.error("Error fetching join requests:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}



// /app/api/groups/slug/[slug]/join-requests/route.ts - VERSION CORRIGÉE
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  console.log('🔔 [DEBUG] Starting join request processing...')
  
  try {
    const { slug } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      console.log('🔔 [ERROR] No session')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const { requestId, action, role = 'member', message } = await request.json()

    // 1. Trouver le groupe
    const group = await db.collection("groups").findOne({ slug })
    if (!group) {
      console.log('🔔 [ERROR] Group not found:', slug)
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    console.log('🔔 [DEBUG] Group:', {
      name: group.name,
      id: group._id.toString()
    })

    // 2. Vérifier les permissions (vérifie le format de l'ID ici)
    const currentUserId = new ObjectId((session.user as any).id)
    console.log('🔔 [DEBUG] Current user ID:', {
      raw: (session.user as any).id,
      objectId: currentUserId.toString(),
      isValid: ObjectId.isValid((session.user as any).id)
    })

    const currentUser = await db.collection("group_members").findOne({
      groupId: group._id,
      userId: currentUserId,
      status: 'active',
      role: { $in: ['owner', 'admin'] }
    })

    if (!currentUser) {
      console.log('🔔 [ERROR] User not admin')
      return NextResponse.json({ 
        error: "Vous n'avez pas la permission de gérer les demandes" 
      }, { status: 403 })
    }

    // 3. Trouver la demande
    const joinRequest = await db.collection("group_join_requests").findOne({
      _id: new ObjectId(requestId),
      groupId: group._id,
      status: 'pending'
    })

    if (!joinRequest) {
      console.log('🔔 [ERROR] Join request not found')
      return NextResponse.json({ 
        error: "Demande non trouvée ou déjà traitée" 
      }, { status: 404 })
    }

    // IMPORTANT: Vérifier l'ID utilisateur de la demande
    console.log('🔔 [DEBUG] Join request user ID:', {
      raw: joinRequest.userId,
      type: typeof joinRequest.userId,
      isObjectId: joinRequest.userId instanceof ObjectId,
      stringValue: joinRequest.userId.toString(),
      isValid: ObjectId.isValid(joinRequest.userId.toString())
    })

    // Assure-toi que c'est un string pour l'API de notification
    const targetUserId = joinRequest.userId.toString()
    console.log('🔔 [DEBUG] Target user ID for notification:', targetUserId)

    // 4. Vérifier que l'utilisateur existe
    const targetUser = await db.collection("users").findOne({
      _id: joinRequest.userId
    })

    if (!targetUser) {
      console.log('🔔 [ERROR] Target user not found:', targetUserId)
      // Continue quand même, mais log l'erreur
    } else {
      console.log('🔔 [DEBUG] Target user found:', {
        name: targetUser.name,
        email: targetUser.email,
        id: targetUser._id.toString()
      })
    }

    // 5. Traiter selon l'action
    if (action === 'approve') {
      console.log('🔔 [INFO] Approving request...')
      
      // Ajouter le membre
      await db.collection("group_members").insertOne({
        groupId: group._id,
        userId: joinRequest.userId,
        role: role,
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
      })

      // Mettre à jour les stats
      await db.collection("groups").updateOne(
        { _id: group._id },
        {
          $inc: { 'stats.totalMembers': 1 },
          $set: { updatedAt: new Date() }
        }
      )

      console.log('🔔 [INFO] Member added successfully')

      // 6. ENVOYER LA NOTIFICATION - Vérification d'ID robuste
      console.log('🔔 [INFO] Sending approval notification...')
      
      try {
        // Vérifier une dernière fois l'ID
        if (!targetUserId || targetUserId === 'undefined' || targetUserId === 'null') {
          throw new Error(`Invalid user ID: ${targetUserId}`)
        }

        console.log('🔔 [DEBUG] Calling notification service with:', {
          userId: targetUserId,
          isValid: ObjectId.isValid(targetUserId),
          groupName: group.name,
          groupId: group._id.toString()
        })

        // Utiliser le service de notification
        const notificationId = await notificationService.send(
          targetUserId, // Doit être un string valide
          notificationService.templates.groupJoinApproved(
            group.name,
            group._id.toString()
          )
        )
        
        console.log('🔔 [SUCCESS] Notification sent! ID:', notificationId)
        
      } catch (serviceError: any) {
        console.error('🔔 [ERROR] Notification service failed:', serviceError.message)
        console.error('🔔 [ERROR] Stack:', serviceError.stack)
        
        // Méthode de secours: insérer directement
        try {
          console.log('🔔 [INFO] Trying direct database insertion...')
          
          await db.collection("notifications").insertOne({
            _id: new ObjectId(),
            userId: joinRequest.userId, // ObjectId ici
            category: 'COMMUNITY',
            priority: 'MEDIUM',
            title: '✅ Demande acceptée !',
            message: `Votre demande pour rejoindre "${group.name}" a été acceptée`,
            status: 'UNREAD',
            actionUrl: `/groups/${group._id.toString()}`,
            data: { 
              entityId: group._id.toString(), 
              entityType: 'group',
              entityName: group.name
            },
            createdAt: new Date(),
            readAt: null
          })
          
          console.log('🔔 [SUCCESS] Notification created directly in DB!')
          
        } catch (directError) {
          console.error('🔔 [ERROR] Direct method also failed:', directError)
        }
      }

    } else if (action === 'reject') {
      console.log('🔔 [INFO] Rejecting request...')
      
      try {
        await notificationService.send(
          targetUserId,
          notificationService.templates.groupJoinRejected(
            group.name,
            group._id.toString()
          )
        )
        console.log('🔔 [SUCCESS] Rejection notification sent!')
      } catch (error) {
        console.error('🔔 [ERROR] Rejection notification failed:', error)
      }
    }

    // 7. Marquer la demande comme traitée
    await db.collection("group_join_requests").updateOne(
      { _id: new ObjectId(requestId) },
      {
        $set: {
          status: action === 'approve' ? 'approved' : 'rejected',
          processedBy: currentUserId,
          processedAt: new Date(),
          updatedAt: new Date(),
          adminMessage: message || ''
        }
      }
    )

    console.log('🔔 [SUCCESS] Request processed successfully!')
    
    return NextResponse.json({
      success: true,
      message: `Demande ${action === 'approve' ? 'approuvée' : 'refusée'}`
    })
    
  } catch (error: any) {
    console.error('🔔 [CRITICAL] Error processing join request:', error.message)
    console.error('🔔 [CRITICAL] Stack:', error.stack)
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}