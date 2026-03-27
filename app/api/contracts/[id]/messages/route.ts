// app/api/contracts/[id]/messages/route.ts
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET - Récupérer les messages d'un contrat
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const contractId = params.id
    if (!ObjectId.isValid(contractId)) {
      return NextResponse.json({ error: "ID de contrat invalide" }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Vérifier l'accès au contrat
    const contract = await db.collection("contracts").findOne({
      _id: new ObjectId(contractId),
      $or: [
        { clientId: userId },
        { freelancerId: userId }
      ]
    })

    if (!contract) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Récupérer les messages
    const messages = await db.collection("contract_messages")
      .find({ contractId: new ObjectId(contractId) })
      .sort({ createdAt: 1 })
      .toArray()

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Erreur récupération messages:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

// POST - Envoyer un message
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const contractId = params.id
    if (!ObjectId.isValid(contractId)) {
      return NextResponse.json({ error: "ID de contrat invalide" }, { status: 400 })
    }

    const { content, type = "message", attachment } = await request.json()
    
    if (!content?.trim()) {
      return NextResponse.json({ error: "Le message ne peut pas être vide" }, { status: 400 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    const userName = session.user?.name || "Utilisateur"

    // Vérifier l'accès au contrat
    const contract = await db.collection("contracts").findOne({
      _id: new ObjectId(contractId),
      $or: [
        { clientId: userId },
        { freelancerId: userId }
      ]
    })

    if (!contract) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Créer le message
    const message = {
      contractId: new ObjectId(contractId),
      senderId: userId,
      senderName: userName,
      content: content.trim(),
      type,
      attachment: attachment || null,
      readBy: [userId],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("contract_messages").insertOne(message)

    // Déterminer le destinataire
    const receiverId = contract.clientId.equals(userId) 
      ? contract.freelancerId 
      : contract.clientId

    // Envoyer notification
    await db.collection("notifications").insertOne({
      userId: receiverId,
      type: "contract_message",
      title: "Nouveau message",
      message: `${userName} a envoyé un message sur le contrat "${contract.title}"`,
      data: { 
        contractId,
        messageId: result.insertedId,
        senderId: userId 
      },
      createdAt: new Date()
    })

    return NextResponse.json({ 
      success: true, 
      messageId: result.insertedId 
    }, { status: 201 })
  } catch (error) {
    console.error("Erreur envoi message:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}