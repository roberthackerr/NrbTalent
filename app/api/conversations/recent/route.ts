// app/api/conversations/recent/route.ts (version avec cache)
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Cache simple en mémoire (pour les requêtes fréquentes)
const conversationCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 30 * 1000 // 30 secondes

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")
    const orderId = searchParams.get("orderId")
    const skipCache = searchParams.get("skipCache") === "true"

    const userId = (session.user as any).id
    const cacheKey = `${userId}-${limit}-${orderId || 'all'}`

    // Vérifier le cache
    if (!skipCache) {
      const cached = conversationCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json(cached.data)
      }
    }

    const db = await getDatabase()
    const userObjectId = new ObjectId(userId)

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
              participants: userObjectId
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
          }
        ])
        .next()

      if (!conversation) {
        return NextResponse.json({ error: "Conversation not found for this order" }, { status: 404 })
      }

      const unreadCount = await db.collection("messages").countDocuments({
        conversationId: conversation._id,
        readBy: { $ne: userObjectId }
      })

      const result = { 
        success: true,
        conversation: {
          ...conversation,
          unreadCount
        }
      }

      // Mettre en cache
      conversationCache.set(cacheKey, { data: result, timestamp: Date.now() })

      return NextResponse.json(result)
    }

    // Récupérer les conversations récentes avec limite
    const conversations = await db.collection("conversations")
      .aggregate([
        { $match: { participants: userObjectId } },
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
        { $sort: { updatedAt: -1 } },
        { $limit: Math.min(limit, 50) }
      ])
      .toArray()

    // Calculer les messages non lus pour chaque conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await db.collection("messages").countDocuments({
          conversationId: conv._id,
          readBy: { $ne: userObjectId }
        })
        
        return {
          ...conv,
          unreadCount
        }
      })
    )

    const result = { 
      success: true,
      conversations: conversationsWithUnread,
      total: conversationsWithUnread.length,
      limit: Math.min(limit, 50)
    }

    // Mettre en cache
    conversationCache.set(cacheKey, { data: result, timestamp: Date.now() })

    return NextResponse.json(result)

  } catch (error) {
    console.error("Error fetching recent conversations:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Nettoyage périodique du cache
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of conversationCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      conversationCache.delete(key)
    }
  }
}, CACHE_TTL)