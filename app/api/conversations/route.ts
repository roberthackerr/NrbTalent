import { getDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { ObjectId } from "mongodb"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Si un orderId est fourni, chercher la conversation liée à cette commande
    if (orderId) {
      if (!ObjectId.isValid(orderId)) {
        return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
      }

      const conversation = await db.collection("conversations")
        .aggregate([
          { 
            $match: { 
              orderId: new ObjectId(orderId),
              participants: userId // Vérifier que l'utilisateur a accès
            } 
          },
          { 
            $lookup: { 
              from: "users", 
              localField: "participants", 
              foreignField: "_id", 
              as: "participants" 
            } 
          },
          {
            $lookup: {
              from: "orders",
              localField: "orderId",
              foreignField: "_id",
              as: "order"
            }
          },
          { $unwind: { path: "$order", preserveNullAndEmptyArrays: true } },
          {
            $project: { 
              "participants.password": 0,
              "participants.createdAt": 0,
              "participants.updatedAt": 0,
              "order.buyerId": 0,
              "order.sellerId": 0
            }
          }
        ])
        .next()

      if (!conversation) {
        return NextResponse.json({ error: "Conversation not found for this order" }, { status: 404 })
      }

      return NextResponse.json({ conversation })
    }

    // Sinon, retourner toutes les conversations de l'utilisateur
    const conversations = await db.collection("conversations")
      .aggregate([
        { $match: { participants: userId } },
        { 
          $lookup: { 
            from: "users", 
            localField: "participants", 
            foreignField: "_id", 
            as: "participants" 
          } 
        },
        {
          $lookup: {
            from: "orders",
            localField: "orderId",
            foreignField: "_id",
            as: "order"
          }
        },
        { $unwind: { path: "$order", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "messages",
            let: { conversationId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$conversationId", "$$conversationId"] } } },
              { $sort: { createdAt: -1 } },
              { $limit: 1 }
            ],
            as: "lastMessage"
          }
        },
        { $unwind: { path: "$lastMessage", preserveNullAndEmptyArrays: true } },
        {
          $project: { 
            "participants.password": 0,
            "participants.createdAt": 0,
            "participants.updatedAt": 0,
            "order.buyerId": 0,
            "order.sellerId": 0
          }
        },
        { $sort: { updatedAt: -1 } }
      ])
      .toArray()

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { participantIds, orderId } = await request.json()
    const currentUserId = (session.user as any).id

    // Si un orderId est fourni, créer une conversation liée à une commande
    if (orderId) {
      if (!ObjectId.isValid(orderId)) {
        return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
      }

      const db = await getDatabase()

      // Vérifier que la commande existe et que l'utilisateur y a accès
      const order = await db.collection("orders").findOne({
        _id: new ObjectId(orderId),
        $or: [
          { buyerId: new ObjectId(currentUserId) },
          { sellerId: new ObjectId(currentUserId) }
        ]
      })

      if (!order) {
        return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 })
      }

      // Vérifier si une conversation existe déjà pour cette commande
      const existingConversation = await db.collection("conversations").findOne({
        orderId: new ObjectId(orderId)
      })

      if (existingConversation) {
        console.log(`✅ Conversation existante pour la commande: ${existingConversation._id}`)
        
        const conversationWithDetails = await db.collection("conversations")
          .aggregate([
            { $match: { _id: existingConversation._id } },
            { 
              $lookup: { 
                from: "users", 
                localField: "participants", 
                foreignField: "_id", 
                as: "participants" 
              }
            },
            {
              $lookup: {
                from: "orders",
                localField: "orderId",
                foreignField: "_id",
                as: "order"
              }
            },
            { $unwind: { path: "$order", preserveNullAndEmptyArrays: true } },
            { 
              $project: { 
                "participants.password": 0,
                "participants.createdAt": 0,
                "participants.updatedAt": 0,
                "order.buyerId": 0,
                "order.sellerId": 0
              }
            }
          ])
          .next()

        return NextResponse.json({ 
          conversation: conversationWithDetails,
          existing: true,
          message: "Conversation already exists for this order" 
        })
      }

      // Créer une nouvelle conversation pour la commande
      const participants = [order.buyerId, order.sellerId]
      
      const newConversation = {
        participants,
        orderId: new ObjectId(orderId),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessage: null,
        unreadCount: 0,
        type: 'order'
      }

      const result = await db.collection("conversations").insertOne(newConversation)

      // Récupérer la conversation créée avec les infos
      const conversation = await db.collection("conversations").aggregate([
        { $match: { _id: result.insertedId } },
        { 
          $lookup: { 
            from: "users", 
            localField: "participants", 
            foreignField: "_id", 
            as: "participants" 
          }
        },
        {
          $lookup: {
            from: "orders",
            localField: "orderId",
            foreignField: "_id",
            as: "order"
          }
        },
        { $unwind: { path: "$order", preserveNullAndEmptyArrays: true } },
        { 
          $project: { 
            "participants.password": 0,
            "participants.createdAt": 0,
            "participants.updatedAt": 0,
            "order.buyerId": 0,
            "order.sellerId": 0
          }
        }
      ]).next()

      console.log(`✅ Nouvelle conversation créée pour la commande: ${result.insertedId}`)

      return NextResponse.json({ 
        conversation,
        existing: false,
        message: "Order conversation created successfully" 
      }, { status: 201 })
    }

    // Code existant pour les conversations normales (sans orderId)
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({ error: "Participant IDs are required" }, { status: 400 })
    }

    // 🔥 VALIDATION 1: On ne peut pas créer une conversation avec soi-même
    if (participantIds.includes(currentUserId)) {
      return NextResponse.json({ 
        error: "Vous ne pouvez pas créer une conversation avec vous-même" 
      }, { status: 400 })
    }

    // 🔥 VALIDATION 2: Vérifier qu'il n'y a pas de doublons dans les participants
    const uniqueParticipants = [...new Set(participantIds)]
    if (uniqueParticipants.length !== participantIds.length) {
      return NextResponse.json({ 
        error: "Des doublons ont été détectés dans la liste des participants" 
      }, { status: 400 })
    }

    // 🔥 VALIDATION 3: Maximum 10 participants
    if (participantIds.length > 10) {
      return NextResponse.json({ 
        error: "Une conversation ne peut pas avoir plus de 10 participants" 
      }, { status: 400 })
    }

    const db = await getDatabase()

    // Vérifier que tous les participants existent
    const participantsObjectIds = participantIds.map(id => new ObjectId(id))
    const existingUsers = await db.collection("users")
      .find({ 
        _id: { $in: participantsObjectIds } 
      })
      .toArray()

    if (existingUsers.length !== participantIds.length) {
      return NextResponse.json({ 
        error: "Un ou plusieurs participants n'existent pas" 
      }, { status: 400 })
    }

    // 🔥 VALIDATION 4: Vérifier si une conversation existe déjà avec exactement ces participants
    const allParticipants = [
      new ObjectId(currentUserId), 
      ...participantsObjectIds
    ].sort((a, b) => a.toString().localeCompare(b.toString()))

    const existingConversation = await db.collection("conversations").findOne({
      participants: { 
        $all: allParticipants,
        $size: allParticipants.length
      }
    })

    if (existingConversation) {
      console.log(`✅ Conversation existante trouvée: ${existingConversation._id}`)
      
      const conversationWithDetails = await db.collection("conversations")
        .aggregate([
          { $match: { _id: existingConversation._id } },
          { 
            $lookup: { 
              from: "users", 
              localField: "participants", 
              foreignField: "_id", 
              as: "participants" 
            }
          },
          { 
            $project: { 
              "participants.password": 0,
              "participants.createdAt": 0,
              "participants.updatedAt": 0
            }
          }
        ])
        .next()

      return NextResponse.json({ 
        conversation: conversationWithDetails,
        existing: true,
        message: "Conversation already exists" 
      })
    }

    // Créer une nouvelle conversation normale
    const newConversation = {
      participants: allParticipants,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: null,
      unreadCount: 0,
      type: allParticipants.length === 2 ? 'direct' : 'group'
    }

    const result = await db.collection("conversations").insertOne(newConversation)

    const conversation = await db.collection("conversations").aggregate([
      { $match: { _id: result.insertedId } },
      { 
        $lookup: { 
          from: "users", 
          localField: "participants", 
          foreignField: "_id", 
          as: "participants" 
        }
      },
      { 
        $project: { 
          "participants.password": 0,
          "participants.createdAt": 0,
          "participants.updatedAt": 0
        }
      }
    ]).next()

    console.log(`✅ Nouvelle conversation créée: ${result.insertedId}`)

    return NextResponse.json({ 
      conversation,
      existing: false,
      message: "Conversation created successfully" 
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await db.collection("conversations").findOne({
      _id: new ObjectId(conversationId),
      participants: userId
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found or access denied" }, { status: 404 })
    }

    // 🔥 SUPPRIMER LA CONVERSATION ET TOUS SES MESSAGES
    const result = await db.collection("conversations").deleteOne({
      _id: new ObjectId(conversationId)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 })
    }

    // Supprimer tous les messages associés à cette conversation
    await db.collection("messages").deleteMany({
      conversationId: conversationId
    })

    console.log(`🗑️ Conversation ${conversationId} supprimée par l'utilisateur ${userId}`)

    return NextResponse.json({ 
      success: true,
      message: "Conversation deleted successfully",
      deletedCount: result.deletedCount
    })

  } catch (error) {
    console.error("Error deleting conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}