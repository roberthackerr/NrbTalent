import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { Message } from "@/lib/models/user"
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
if (conversationId) {
  // Utiliser conversationId comme string directement
  const messages = await db
    .collection<Message>("messages")
    .find({ 
      conversationId: conversationId // 👈 Utiliser comme string
    })
    .sort({ createdAt: 1 })
    .toArray()

  // Aussi ici
  await db
    .collection<Message>("messages")
    .updateMany({ 
      conversationId: conversationId, // 👈 Utiliser comme string
      receiverId: userId, 
      read: false 
    }, { 
      $set: { read: true } 
    })

  return NextResponse.json({ messages })
      
    } else {
      // Get all conversations for the user
      const messages = await db
        .collection<Message>("messages")
        .aggregate([
          {
            $match: {
              $or: [{ senderId: userId }, { receiverId: userId }],
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $group: {
              _id: "$conversationId",
              lastMessage: { $first: "$$ROOT" },
              unreadCount: {
                $sum: {
                  $cond: [{ $and: [{ $eq: ["$receiverId", userId] }, { $eq: ["$read", false] }] }, 1, 0],
                },
              },
            },
          },
        ])
        .toArray()

      return NextResponse.json({ messages }) // 👈 Ici aussi
    }
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { conversationId, receiverId, content } = await request.json();

    if (!conversationId || !receiverId || !content) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await db.collection('conversations').findOne({
      _id: new ObjectId(conversationId),
      participants: new ObjectId((session.user as any).id)
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    // Créer le message
    const newMessage = {
      conversationId,
      senderId: new ObjectId((session.user as any).id),
      receiverId: new ObjectId(receiverId),
      content: content.trim(),
      read: false,
      createdAt: new Date(),
      type: 'text'
    };

    // Insérer le message
    const result = await db.collection('messages').insertOne(newMessage);
    const messageId = result.insertedId.toString();

    // Mettre à jour la conversation
    await db.collection('conversations').updateOne(
      { _id: new ObjectId(conversationId) },
      { 
        $set: { 
          updatedAt: new Date(),
          lastMessage: content.trim()
        } 
      }
    );

    // 🔥 CORRECTION : Retourner le message formaté comme le frontend l'attend
    const responseMessage = {
      _id: messageId,
      conversationId,
      senderId: (session.user as any).id,
      receiverId: receiverId,
      content: content.trim(),
      read: false,
      createdAt: newMessage.createdAt.toISOString(),
      type: 'text'
    };

    return NextResponse.json({ 
      success: true,
      message: responseMessage // 🔥 Format correct
    });

  } catch (error) {
    console.error('❌ Erreur envoi message:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
